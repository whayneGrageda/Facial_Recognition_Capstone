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

# FAISS for fast similarity search
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[v2] WARNING: FAISS not installed. Install with: pip install faiss-cpu")

# GFPGAN is optional -- graceful fallback if not installed
try:
    from gfpgan import GFPGANer
    GFPGAN_AVAILABLE = True
except ImportError:
    GFPGAN_AVAILABLE = False


class TemporalVoter:
    """Stabilizes identity across consecutive frames using confidence-weighted voting."""

    def __init__(self, window: int = 10, confirm_threshold: int = 6):
        self.tracks = {}  # spatial_key -> deque of (name, confidence, timestamp)
        self.window = window
        self.threshold = confirm_threshold
        self._cleanup_counter = 0

    def vote(self, bbox: Tuple[int, int, int, int], name: str, confidence: float):
        """Vote on identity for a face at a given location using confidence-weighted voting."""
        key = self._spatial_key(bbox)
        if key not in self.tracks:
            self.tracks[key] = deque(maxlen=self.window)
        self.tracks[key].append((name, confidence, time.time()))

        # Confidence-weighted voting: sum confidence scores per name
        name_scores = {}
        for n, c, t in self.tracks[key]:
            if n not in name_scores:
                name_scores[n] = {'total_confidence': 0.0, 'count': 0}
            name_scores[n]['total_confidence'] += c
            name_scores[n]['count'] += 1

        # Find name with highest total confidence
        if not name_scores:
            return name, confidence, "PENDING"
        
        top_name = max(name_scores.items(), key=lambda x: x[1]['total_confidence'])[0]
        top_count = name_scores[top_name]['count']
        avg_conf = name_scores[top_name]['total_confidence'] / top_count

        # Confirm if count meets threshold
        if top_count >= self.threshold:
            # Periodic cleanup of stale tracks
            self._cleanup_counter += 1
            if self._cleanup_counter % 50 == 0:
                self._cleanup_stale()
            
            return top_name, float(avg_conf), "CONFIRMED"

        # Periodic cleanup of stale tracks
        self._cleanup_counter += 1
        if self._cleanup_counter % 50 == 0:
            self._cleanup_stale()

        return name, confidence, "PENDING"

    def _spatial_key(self, bbox: Tuple[int, int, int, int], grid: int = 80):
        """Bin face center into grid cells for spatial tracking."""
        top, right, bottom, left = bbox
        cx = (left + right) // 2
        cy = (top + bottom) // 2
        return (cx // grid, cy // grid)

    def _cleanup_stale(self, max_age: float = 5.0):
        """Remove tracks that haven't been updated recently."""
        now = time.time()
        stale_keys = []
        for key, history in self.tracks.items():
            if history and (now - history[-1][2]) > max_age:
                stale_keys.append(key)
        for key in stale_keys:
            del self.tracks[key]


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

        # Cache file path
        cache_dir = getattr(config, 'MODEL_PATH', 'models')
        self.cache_file = os.path.join(cache_dir, 'face_encodings_cache_v2.pkl')
        self.cache_version = 'insightface_v2_gfpgan'

        # Frame counter for tiered detection
        self._frame_counter = 0

        # Blur threshold -- images below this Laplacian variance get enhanced
        # Set to 0 to disable enhancement (fast rebuild). Set to 80+ to enable.
        # GFPGAN uses significant memory, disable for production use
        self.blur_threshold = getattr(config, 'BLUR_THRESHOLD', 0)

        # Initialize GFPGAN face enhancer (enrollment only)
        self.enhancer = self._init_gfpgan()

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

    # ---- GFPGAN Face Enhancement ----

    def _init_gfpgan(self):
        """Initialize the GFPGAN face enhancer for enrollment preprocessing."""
        if not GFPGAN_AVAILABLE:
            print("[v2] GFPGAN not installed -- enrollment enhancement disabled")
            return None

        try:
            model_path = os.path.join(
                getattr(self.config, 'MODEL_PATH', 'models'),
                'GFPGANv1.4.pth'
            )

            # Download model if not present
            if not os.path.exists(model_path):
                print("[v2] Downloading GFPGAN model (348MB, one-time)...")
                import urllib.request
                os.makedirs(os.path.dirname(model_path) or '.', exist_ok=True)
                url = 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth'
                urllib.request.urlretrieve(url, model_path)
                print("[v2] GFPGAN model downloaded successfully")

            enhancer = GFPGANer(
                model_path=model_path,
                upscale=2,
                arch='clean',
                channel_multiplier=2,
                bg_upsampler=None,  # Skip background upsampling for speed
            )
            print("[v2] GFPGAN face enhancer loaded (enrollment enhancement enabled)")
            return enhancer

        except Exception as e:
            print(f"[v2] GFPGAN init failed: {e} -- enhancement disabled")
            return None

    def _compute_blur_score(self, image: np.ndarray) -> float:
        """Compute blur score using Laplacian variance. Higher = sharper."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        return cv2.Laplacian(gray, cv2.CV_64F).var()

    def _enhance_face_image(self, image: np.ndarray) -> np.ndarray:
        """Enhance a blurry face image using GFPGAN.

        Only enhances if the image is below the blur threshold.
        Returns the original image if enhancement is unavailable or unnecessary.
        """
        if self.enhancer is None:
            return image

        blur_score = self._compute_blur_score(image)

        if blur_score >= self.blur_threshold:
            return image  # Already sharp enough

        try:
            _, _, enhanced = self.enhancer.enhance(
                image,
                has_aligned=False,
                only_center_face=True,
                paste_back=True,
            )
            if enhanced is not None:
                return enhanced
        except Exception:
            pass  # Silently fall back to original

        return image

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
        """Load and encode all images for one person.

        If GFPGAN is available, blurry images are enhanced before
        embedding extraction for better recognition accuracy.
        """
        count = 0
        enhanced_count = 0
        for filename in sorted(os.listdir(person_dir)):
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue

            filepath = os.path.join(person_dir, filename)
            try:
                img = cv2.imread(filepath)
                if img is None:
                    continue

                # Enhance blurry enrollment images before extraction
                original_blur = self._compute_blur_score(img)
                processed_img = self._enhance_face_image(img)
                was_enhanced = processed_img is not img
                if was_enhanced:
                    enhanced_count += 1

                # InsightFace detects + extracts embeddings in one call
                faces = self.app.get(processed_img)
                if not faces:
                    # Fallback: try original image if enhancement broke detection
                    if was_enhanced:
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
            suffix = f" ({enhanced_count} enhanced)" if enhanced_count > 0 else ""
            print(f"  Loaded {count} images for {person_name}{suffix}")

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

            # Apply temporal voting for stability
            bbox = (top, right, bottom, left)
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
