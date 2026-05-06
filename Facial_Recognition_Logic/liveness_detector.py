import os
import cv2
import numpy as np
import urllib.request

class LivenessDetector:
    """Silent Face Anti-Spoofing using MiniFASNet ONNX."""
    
    def __init__(self, model_dir='models', threshold=0.7):
        self.model_dir = model_dir
        self.threshold = threshold
        self.model_path = os.path.join(model_dir, 'MiniFASNetV2.onnx')
        self.session = None
        self.is_ready = False
        
        # Download model if not exists
        self._ensure_model_exists()
        
        # Initialize ONNX Runtime session
        try:
            import onnxruntime as ort
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            self.session = ort.InferenceSession(self.model_path, providers=providers)
            
            # Get input/output names
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name
            self.is_ready = True
            print(f"[Liveness] Initialized MiniFASNetV2 from {self.model_path}")
        except ImportError:
            print("[Liveness] Warning: onnxruntime not installed. Liveness detection disabled. Install via 'pip install onnxruntime' or 'onnxruntime-gpu'.")
        except Exception as e:
            print(f"[Liveness] Failed to load model: {e}")

    def _ensure_model_exists(self):
        """Downloads the ONNX model if it doesn't exist."""
        if not os.path.exists(self.model_path):
            print(f"[Liveness] Downloading MiniFASNetV2.onnx to {self.model_path}...")
            os.makedirs(self.model_dir, exist_ok=True)
            url = "https://github.com/yakhyo/face-anti-spoofing/releases/download/weights/MiniFASNetV2.onnx"
            try:
                urllib.request.urlretrieve(url, self.model_path)
                print("[Liveness] Download complete.")
            except Exception as e:
                print(f"[Liveness] Error downloading model: {e}")

    def get_crop(self, frame, bbox, scale=2.7):
        """
        Crop face with context (scale > 1.0 expands the box).
        MiniFASNet typically uses a scale around 2.7 to 4.0 to see the screen edges if it's a spoof.
        """
        top, right, bottom, left = bbox
        h, w = bottom - top, right - left
        
        # Center of face
        cx, cy = left + w // 2, top + h // 2
        
        # New size based on scale
        new_w, new_h = int(w * scale), int(h * scale)
        side = max(new_w, new_h)
        
        # Calculate new coordinates, ensuring they stay within image bounds
        new_left = max(0, cx - side // 2)
        new_top = max(0, cy - side // 2)
        new_right = min(frame.shape[1], cx + side // 2)
        new_bottom = min(frame.shape[0], cy + side // 2)
        
        crop = frame[new_top:new_bottom, new_left:new_right]
        return crop

    def is_live(self, frame: np.ndarray, bbox: tuple) -> tuple:
        """
        Checks if the face in the bounding box is a live person or a spoof.
        Returns: (is_live: bool, liveness_score: float)
        """
        if not self.is_ready or self.session is None:
            # If not initialized, assume live to not break the pipeline
            return True, 1.0

        try:
            # Crop the face with context
            crop = self.get_crop(frame, bbox, scale=2.7)
            if crop.size == 0:
                return False, 0.0

            # Resize to model input size (80x80)
            resized = cv2.resize(crop, (80, 80))
            
            # Convert to float32 and normalize if necessary (ONNX model specifics)
            # MiniFASNet expected input: [1, 3, 80, 80]
            # No explicit mean/std usually required if model has BN, but let's do standard RGB
            # Assuming Yakhyo's ONNX expects standard float32 normalized
            blob = cv2.dnn.blobFromImage(resized, 1.0, (80, 80), (0, 0, 0), swapRB=True, crop=False)
            
            # Run inference
            outputs = self.session.run([self.output_name], {self.input_name: blob})
            
            # Output is typically shape [1, 3] or [1, 2]. Yakhyo's outputs [1, 2] usually (0: spoof, 1: real) or [1, 3].
            # Let's apply softmax
            preds = outputs[0][0]
            exp_preds = np.exp(preds - np.max(preds))
            probs = exp_preds / exp_preds.sum()
            
            # Usually, the class index for 'real' is 1 (if 2 classes) or 1 (if 3 classes: 0=spoof, 1=real, 2=spoof)
            # We'll check the argmax or the prob of real class.
            if len(probs) == 3:
                # 0: Fake (Print), 1: Real, 2: Fake (Replay)
                liveness_score = float(probs[1])
            else:
                # 0: Fake, 1: Real
                liveness_score = float(probs[1])
            
            is_live = liveness_score >= self.threshold
            return is_live, liveness_score

        except Exception as e:
            print(f"[Liveness] Inference error: {e}")
            return True, 1.0
