"""Face Recognition Module v2 - InsightFace (SCRFD + ArcFace) upgrade.

Drop-in replacement for face_recognizer.py.
Uses InsightFace's buffalo_sc model pack for both detection and recognition.
Includes temporal voting for identity stabilization, GPU acceleration,
GFPGAN face enhancement for blurry enrollment images, and FAISS index for fast similarity search.
"""

import os
import pickle
import time
import numpy as np
import cv2
from typing import List, Tuple, Optional
from collections import Counter, deque
from insightface.app import FaceAnalysis

try:
    from liveness_detector import LivenessDetector
    LIVENESS_IMPORTED = True
except ImportError:
    LIVENESS_IMPORTED = False
    print("[v2] WARNING: liveness_detector.py not found. Liveness disabled.")
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[v2] WARNING: FAISS not installed. Install with: pip install faiss-cpu")




class TemporalVoter:
    """Stabilizes identity across consecutive frames using confidence-weighted voting with IoU matching."""

    def __init__(self, window: int = 10, confirm_threshold: int = 6, iou_threshold: float = 0.3):
        # tracks: list of dicts: {'bbox': bbox, 'history': deque()}
        self.tracks = []
        self.window = window
        self.threshold = confirm_threshold
        self.iou_threshold = iou_threshold
        self._cleanup_counter = 0

    def _compute_iou(self, boxA, boxB):
        # top, right, bottom, left
        yA = max(boxA[0], boxB[0])
        xA = max(boxA[3], boxB[3])
        yB = min(boxA[2], boxB[2])
        xB = min(boxA[1], boxB[1])

        interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
        if interArea == 0:
            return 0.0

        boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[1] - boxA[3] + 1)
        boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[1] - boxB[3] + 1)
        
        iou = interArea / float(boxAArea + boxBArea - interArea)
        return iou

    def vote(self, bbox: Tuple[int, int, int, int], name: str, confidence: float):
        """Vote on identity for a face at a given location using IoU matching."""
        now = time.time()
        
        # Periodic cleanup
        self._cleanup_counter += 1
        if self._cleanup_counter % 50 == 0:
            self._cleanup_stale()

        # Find best matching track via IoU
        best_iou = 0.0
        best_track_idx = -1
        
        for i, track in enumerate(self.tracks):
            iou = self._compute_iou(bbox, track['bbox'])
            if iou > best_iou:
                best_iou = iou
                best_track_idx = i

        if best_iou > self.iou_threshold and best_track_idx != -1:
            # Update existing track
            self.tracks[best_track_idx]['bbox'] = bbox
            self.tracks[best_track_idx]['history'].append((name, confidence, now))
            track_history = self.tracks[best_track_idx]['history']
        else:
            # Create new track
            history = deque(maxlen=self.window)
            history.append((name, confidence, now))
            self.tracks.append({'bbox': bbox, 'history': history})
            track_history = history

        # Confidence-weighted voting
        name_scores = {}
        for n, c, t in track_history:
            if n not in name_scores:
                name_scores[n] = {'total_confidence': 0.0, 'count': 0}
            name_scores[n]['total_confidence'] += c
            name_scores[n]['count'] += 1

        if not name_scores:
            return name, confidence, "PENDING"
        
        top_name = max(name_scores.items(), key=lambda x: x[1]['total_confidence'])[0]
        top_count = name_scores[top_name]['count']
        avg_conf = name_scores[top_name]['total_confidence'] / top_count

        if top_count >= self.threshold:
            return top_name, float(avg_conf), "CONFIRMED"

        return name, confidence, "PENDING"

    def _cleanup_stale(self, max_age: float = 5.0):
        """Remove tracks that haven't been updated recently."""
        now = time.time()
        self.tracks = [t for t in self.tracks if t['history'] and (now - t['history'][-1][2]) <= max_age]


class FaceRecognizer:
    """Face recognizer using InsightFace (SCRFD detector + ArcFace/MBF recognizer).

    Drop-in replacement for the original YuNet+SFace FaceRecognizer.
    Same __init__(config) signature, same recognize_faces() return format.
    """

    def __init__(self, config):
        """Initialize the face recognizer with InsightFace."""
        self.config = config
        self.known_face_names = []
        self.known_face_encodings = []
        self.known_encodings_numpy = None

        # Temporal voting for identity stabilization
        # Reduced window for faster confirmation while maintaining accuracy
        self.voter = TemporalVoter(window=7, confirm_threshold=4)

        # FAISS index for fast similarity search
        self.faiss_index = None
        self.use_faiss = FAISS_AVAILABLE

        # Pick the model variant from config, default to buffalo_sc (fastest)
        model_name = getattr(config, 'INSIGHTFACE_MODEL', 'buffalo_sc')

        # Pick execution provider: GPU if available, else CPU
        providers = self._get_providers()
        print(f"[v2] Initializing InsightFace ({model_name}) with {providers[0]}...")

        self.app = FaceAnalysis(name=model_name, providers=providers)

        # det_size controls detection resolution — higher = better small-face detection but slower
        det_size = (
            getattr(config, 'DET_SIZE_W', 640),
            getattr(config, 'DET_SIZE_H', 640)
        )
        self.app.prepare(ctx_id=0, det_size=det_size)

        # Set detection threshold
        det_thresh = getattr(config, 'DET_THRESHOLD', 0.5)
        for model in self.app.models:
            if hasattr(model, 'det_thresh'):
                model.det_thresh = det_thresh

        # Similarity threshold for matching
        self.similarity_threshold = getattr(config, 'SIMILARITY_THRESHOLD', 0.36)
        self.min_confidence = getattr(config, 'MIN_CONFIDENCE', 0.45)
        self.max_faces = getattr(config, 'MAX_FACES_PER_FRAME', 4)

        # Liveness Detection
        self.enable_liveness = getattr(config, 'ENABLE_LIVENESS', False) and LIVENESS_IMPORTED
        self.liveness_detector = None
        if self.enable_liveness:
            liveness_thresh = getattr(config, 'LIVENESS_THRESHOLD', 0.7)
            model_path = getattr(config, 'MODEL_PATH', 'models')
            self.liveness_detector = LivenessDetector(model_dir=model_path, threshold=liveness_thresh)

        # Cache file path
        cache_dir = getattr(config, 'MODEL_PATH', 'models')
        self.cache_file = os.path.join(cache_dir, 'face_encodings_cache_v2.pkl')
        self.cache_version = 'insightface_v2'

        # Frame counter for tiered detection
        self._frame_counter = 0



        # Load known faces
        self.load_known_faces()

    def _get_providers(self) -> list:
        """Detect available ONNX Runtime providers."""
        try:
            import onnxruntime
            available = onnxruntime.get_available_providers()
            if 'CUDAExecutionProvider' in available:
                print("[v2] GPU (CUDA) detected - using GPU acceleration")
                return ['CUDAExecutionProvider', 'CPUExecutionProvider']
        except ImportError:
            pass
        print("[v2] Using CPU execution")
        return ['CPUExecutionProvider']



    # ---- Known face loading ----

    def load_known_faces(self):
        """Load known faces from the known_faces directory."""
        if self._load_from_cache():
            return

        known_faces_path = getattr(self.config, 'KNOWN_FACES_PATH', 'known_faces')
        print(f"[v2] Loading known faces from {known_faces_path}...")

        if not os.path.exists(known_faces_path):
            print(f"[v2] WARNING: Known faces directory not found: {known_faces_path}")
            return

        for person_name in sorted(os.listdir(known_faces_path)):
            person_dir = os.path.join(known_faces_path, person_name)
            if not os.path.isdir(person_dir):
                continue
            self._load_person_images(person_dir, person_name)

        self._rebuild_numpy_encodings()
        self._save_to_cache()

        unique_people = len(set(self.known_face_names))
        print(f"[v2] Loaded {len(self.known_face_names)} encodings for {unique_people} people")

    def _load_person_images(self, person_dir: str, person_name: str):
        """Load and encode all images for one person."""
        count = 0
        for filename in sorted(os.listdir(person_dir)):
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue

            filepath = os.path.join(person_dir, filename)
            try:
                img = cv2.imread(filepath)
                if img is None:
                    continue

                # InsightFace detects + extracts embeddings in one call
                faces = self.app.get(img)
                if not faces:
                    continue

                # Use the largest face (most prominent)
                face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
                embedding = face.normed_embedding

                if embedding is not None:
                    self.known_face_encodings.append(
                        np.asarray(embedding, dtype=np.float32).reshape(-1)
                    )
                    self.known_face_names.append(person_name)
                    count += 1

            except Exception as e:
                print(f"[v2] Error loading {filepath}: {e}")

        if count > 0:
            print(f"  Loaded {count} images for {person_name}")

    def _rebuild_numpy_encodings(self):
        """Build stacked numpy array for vectorized cosine matching."""
        if not self.known_face_encodings:
            self.known_encodings_numpy = None
            self.faiss_index = None
            return
        self.known_encodings_numpy = np.vstack([
            np.asarray(enc, dtype=np.float32)
            for enc in self.known_face_encodings
        ])
        
        # Build FAISS index for fast similarity search
        if self.use_faiss:
            self._build_faiss_index()

    def _build_faiss_index(self):
        """Build FAISS index from known encodings for fast similarity search.
        
        Uses IndexFlatIP (Inner Product) since embeddings are L2-normalized,
        making inner product equivalent to cosine similarity.
        """
        if not FAISS_AVAILABLE or self.known_encodings_numpy is None:
            self.faiss_index = None
            return
        
        try:
            # Get embedding dimension
            d = self.known_encodings_numpy.shape[1]
            
            # Create FAISS index for inner product (cosine similarity for normalized vectors)
            self.faiss_index = faiss.IndexFlatIP(d)
            
            # Add all known encodings to the index
            self.faiss_index.add(self.known_encodings_numpy)
            
            print(f"[v2] FAISS index built with {self.faiss_index.ntotal} encodings (dimension: {d})")
        except Exception as e:
            print(f"[v2] FAISS index build failed: {e}. Falling back to numpy search.")
            self.faiss_index = None
            self.use_faiss = False

    # ---- Cache ----

    def _load_from_cache(self) -> bool:
        """Load encodings from cache file."""
        try:
            if not os.path.exists(self.cache_file):
                return False

            with open(self.cache_file, 'rb') as f:
                data = pickle.load(f)

            if data.get('version') != self.cache_version:
                print("[v2] Cache version mismatch, rebuilding...")
                return False

            self.known_face_encodings = [
                np.asarray(enc, dtype=np.float32)
                for enc in data.get('encodings', [])
            ]
            self.known_face_names = data.get('names', [])

            # Validate cache against known_faces directory
            known_faces_path = getattr(self.config, 'KNOWN_FACES_PATH', 'known_faces')
            if os.path.exists(known_faces_path):
                num_folders = len([
                    name for name in os.listdir(known_faces_path)
                    if os.path.isdir(os.path.join(known_faces_path, name))
                ])
                num_cached = len(set(self.known_face_names))
                if num_folders != num_cached:
                    print(f"[v2] Cache mismatch: {num_folders} folders vs {num_cached} cached. Rebuilding...")
                    return False

            self._rebuild_numpy_encodings()
            print(f"[v2] Loaded {len(self.known_face_names)} faces from cache")
            return True

        except Exception as e:
            print(f"[v2] Cache load failed: {e}")
        return False

    def _save_to_cache(self):
        """Save encodings to cache file."""
        try:
            os.makedirs(os.path.dirname(self.cache_file) or '.', exist_ok=True)
            data = {
                'version': self.cache_version,
                'encodings': [enc.astype(np.float32) for enc in self.known_face_encodings],
                'names': self.known_face_names,
            }
            with open(self.cache_file, 'wb') as f:
                pickle.dump(data, f)
            print(f"[v2] Saved cache to {self.cache_file}")
        except Exception as e:
            print(f"[v2] Cache save failed: {e}")

    # ---- Recognition ----

    def recognize_faces(self, frame: np.ndarray) -> Tuple[
        List[Tuple[int, int, int, int]], List[str], List[float]
    ]:
        """Recognize faces in a frame.

        Returns:
            locations: List of (top, right, bottom, left) tuples
            names: List of recognized names
            confidences: List of confidence scores

        Same return signature as the original FaceRecognizer.
        """
        self._frame_counter += 1

        # Run InsightFace detection + embedding extraction
        faces = self.app.get(frame)

        if not faces:
            return [], [], []

        locations = []
        names = []
        confidences = []

        # Process each detected face (limit to max_faces)
        for face in faces[:self.max_faces]:
            # Extract bounding box (insightface gives [x1, y1, x2, y2])
            x1, y1, x2, y2 = face.bbox.astype(int)
            h, w = frame.shape[:2]
            top = max(0, int(y1))
            right = min(w - 1, int(x2))
            bottom = min(h - 1, int(y2))
            left = max(0, int(x1))

            # Get embedding (already normalized by InsightFace)
            embedding = face.normed_embedding
            if embedding is None:
                continue

            feature = np.asarray(embedding, dtype=np.float32).reshape(-1)

            # Match against known faces
            name, confidence = self._match_face(feature)
            
            # Apply liveness detection if enabled
            bbox = (top, right, bottom, left)
            is_live = True
            
            if self.enable_liveness and name != "Unknown":
                # Check face size to avoid falsely spoofing distant small faces
                face_w = right - left
                face_h = bottom - top
                
                if face_w < 60 or face_h < 60:
                    # Too small/far to reliably verify liveness. 
                    # Force them to step closer by falling back to Unknown.
                    name = "Unknown"
                else:
                    is_live, liveness_score = self.liveness_detector.is_live(frame, bbox)
                    if not is_live:
                        name = "SPOOF"
                        confidence = 1.0 - liveness_score

            # Apply temporal voting for stability
            voted_name, voted_conf, status = self.voter.vote(bbox, name, confidence)

            # Use voted result if confirmed, otherwise use raw result
            if status == "CONFIRMED":
                name = voted_name
                confidence = voted_conf

            locations.append(bbox)
            names.append(name)
            confidences.append(confidence)

        return locations, names, confidences

    def _match_face(self, feature: np.ndarray) -> Tuple[str, float]:
        """Match a face embedding against known faces using cosine similarity.
        
        Uses FAISS index if available for fast search, otherwise falls back to numpy.
        """
        if self.known_encodings_numpy is None or len(self.known_encodings_numpy) == 0:
            return "Unknown", 0.0

        # Use FAISS for fast search if available
        if self.use_faiss and self.faiss_index is not None:
            try:
                # FAISS search (k=1 for top match)
                feature_2d = feature.reshape(1, -1).astype(np.float32)
                similarities, indices = self.faiss_index.search(feature_2d, k=1)
                
                best_idx = int(indices[0, 0])
                best_score = float(similarities[0, 0])
                
                # Check thresholds
                if best_score >= self.similarity_threshold and best_score >= self.min_confidence:
                    return self.known_face_names[best_idx], best_score
                
                return "Unknown", best_score
            except Exception as e:
                print(f"[v2] FAISS search failed: {e}. Falling back to numpy.")
                self.use_faiss = False

        # Fallback: Vectorized cosine similarity (embeddings are already L2-normalized)
        feature = feature.reshape(1, -1)
        similarities = feature @ self.known_encodings_numpy.T

        best_idx = np.argmax(similarities)
        best_score = float(similarities[0, best_idx])

        # Check thresholds
        if best_score >= self.similarity_threshold and best_score >= self.min_confidence:
            return self.known_face_names[best_idx], best_score

        return "Unknown", best_score

    # ---- Admin helpers ----

    def reload_faces(self):
        """Reload known faces from directory (clears cache)."""
        self.known_face_names = []
        self.known_face_encodings = []
        self.known_encodings_numpy = None
        self.faiss_index = None

        if os.path.exists(self.cache_file):
            try:
                os.remove(self.cache_file)
                print("[v2] Deleted cache file")
            except Exception as e:
                print(f"[v2] Failed to delete cache: {e}")

        self.load_known_faces()

    def get_known_faces_count(self) -> int:
        """Get the number of unique known people."""
        return len(set(self.known_face_names))
