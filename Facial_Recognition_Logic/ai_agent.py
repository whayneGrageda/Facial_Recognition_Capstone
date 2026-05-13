import os
import threading
import queue
import time
import cv2
import numpy as np
import requests
from datetime import datetime
from PIL import Image

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class SecurityAnalystAgent:
    """
    AI Reasoning Agent that analyzes camera frames using Multimodal LLMs.
    """
    def __init__(self, api_key=None, config=None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.config = config
        self.enabled = bool(self.api_key) and GENAI_AVAILABLE
        
        # Image storage directory
        self.image_dir = os.path.join(os.getcwd(), 'security_alerts')
        os.makedirs(self.image_dir, exist_ok=True)
        
        # Backend API configuration
        self.api_base_url = getattr(config, 'API_BASE_URL', 'http://localhost:3002/api') if config else 'http://localhost:3002/api'
        self.camera_api_key = getattr(config, 'CAMERA_API_KEY', os.getenv('CAMERA_API_KEY')) if config else os.getenv('CAMERA_API_KEY')
        
        if self.enabled:
            genai.configure(api_key=self.api_key)
            # Use gemini-2.5-flash for fast reasoning
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            print("[AI AGENT] Security Analyst Agent initialized and ready.")
        else:
            if not GENAI_AVAILABLE:
                print("[WARNING] google-generativeai not installed. Security Analyst Agent disabled.")
            elif not self.api_key:
                print("[WARNING] GEMINI_API_KEY not found in config. Security Analyst Agent disabled.")
            
        self.task_queue = queue.Queue(maxsize=5) # Prevent memory leaks if processing is slow
        self.thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.last_alert_time = 0
        self.alert_cooldown = 10 # Only analyze once every 10 seconds to avoid spamming the API
        
        if self.enabled:
            self.thread.start()
            
    def analyze_threat(self, frame, event_type, metadata=None):
        """
        Enqueues a frame for analysis if enabled and not on cooldown.
        event_type: e.g., 'SPOOF', 'UNKNOWN_LINGERING'
        """
        if not self.enabled:
            return
            
        current_time = time.time()
        if current_time - self.last_alert_time < self.alert_cooldown:
            return
            
        if not self.task_queue.full():
            # JPEG compress frame before queueing (~50KB vs ~900KB raw)
            _, encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            self.task_queue.put((encoded.tobytes(), event_type, metadata or {}))
            self.last_alert_time = current_time
    
    def _save_alert_image(self, frame_bytes, event_type, camera_type):
        """Save the alert frame to disk and return the filename (not full path)"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{event_type}_{camera_type}_{timestamp}.jpg"
            filepath = os.path.join(self.image_dir, filename)
            
            # Write the JPEG bytes directly to file
            with open(filepath, 'wb') as f:
                f.write(frame_bytes)
            
            # Return just the filename (backend will serve it via static route)
            return filename
        except Exception as e:
            print(f"[AI AGENT] Error saving alert image: {e}")
            return None
    
    def _send_to_backend(self, alert_data):
        """Send security alert to backend API"""
        try:
            url = f"{self.api_base_url}/security-alerts/from-camera"
            headers = {
                'Content-Type': 'application/json',
                'X-Camera-Key': self.camera_api_key or ''
            }
            
            response = requests.post(url, json=alert_data, headers=headers, timeout=5)
            
            if response.status_code in [200, 201]:
                print(f"[AI AGENT] Alert sent to backend successfully (ID: {response.json().get('data', {}).get('id', 'N/A')})")
                return True
            else:
                print(f"[AI AGENT] Backend API error: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"[AI AGENT] Failed to send alert to backend: {e}")
            return False
        except Exception as e:
            print(f"[AI AGENT] Error sending alert to backend: {e}")
            return False
            
    def _worker_loop(self):
        while True:
            try:
                frame_bytes, event_type, metadata = self.task_queue.get()
                
                print(f"\n[AI AGENT] Analyzing {event_type} event... Please wait.")
                
                # Decode JPEG bytes back to numpy, then convert to PIL
                nparr = np.frombuffer(frame_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                
                cam_type = metadata.get("attendance_type", "Unknown Camera").upper()
                
                # === AI VERIFICATION GATE ===
                # Ask AI to determine if this is a REAL spoof or a false positive
                # Only send to backend if AI confirms it's a genuine threat
                is_real_threat = True
                ai_analysis = None
                
                try:
                    if event_type == 'SPOOF':
                        # Verification prompt — AI decides if it's real or false positive
                        verify_prompt = f"""
You are a Security AI verifying a spoofing alert from a facial recognition attendance system.
The liveness detection model flagged this frame as a potential spoof on the {cam_type} camera.

Look at this image carefully and determine:
Is someone ACTUALLY presenting a photo, phone screen, printed image, tablet, or mask to the camera?

Common FALSE POSITIVES (NOT real spoofs):
- Person looking sideways or at an angle (head turned away)
- Person partially out of frame or walking past
- Empty room or no face visible
- Person with their back to camera
- Blurry or poorly lit face
- Background monitors/screens visible but no one holding them up to camera

A REAL SPOOF looks like:
- Someone holding a phone/tablet screen showing a face directly at the camera
- Someone holding a printed photo of a face up to the camera
- A flat 2D image being presented where a real face should be

Respond with ONLY one word: REAL or FALSE
"""
                        response = self.model.generate_content([verify_prompt, pil_img])
                        verdict = response.text.strip().upper()
                        
                        if 'FALSE' in verdict:
                            is_real_threat = False
                            print(f"[AI AGENT] ✓ False positive detected — NOT a real spoof. Discarding alert.")
                            # Clean up saved image for false positives
                            continue
                        else:
                            print(f"[AI AGENT] ⚠ AI confirms: REAL spoofing attempt detected!")
                    
                    # Now generate the detailed analysis for confirmed threats
                    prompt = f"""
You are a Security Analyst AI monitoring a facial recognition system.
A CONFIRMED alert of type '{event_type}' has been triggered on the {cam_type} camera.

Analyze the provided camera frame. Describe what you see:
- If it's a SPOOF: what is being used (phone screen, printed photo, tablet, mask)?
- If it's UNKNOWN: describe the person's appearance.
Keep your response concise, professional, and actionable. Max 3 sentences.
"""
                    response = self.model.generate_content([prompt, pil_img])
                    ai_analysis = response.text.strip()
                    
                    print("\n" + "="*70)
                    print(f"🚨 [SECURITY AI ANALYST] - CONFIRMED ALERT: {event_type} ({cam_type})")
                    print(ai_analysis)
                    print("="*70 + "\n")
                    
                except Exception as ai_error:
                    # If AI fails, use fallback but still send (err on side of caution)
                    print(f"[AI AGENT] AI analysis failed: {ai_error}")
                    print("[AI AGENT] Using fallback — sending alert to be safe...")
                    
                    if event_type == 'SPOOF':
                        ai_analysis = "A potential spoofing attempt was detected by the liveness detection system. The camera frame may show someone presenting a photo, screen, or other non-live representation. Manual review of the captured image is recommended to verify the security threat."
                    else:
                        ai_analysis = f"A security alert of type '{event_type}' was triggered on the {cam_type} camera. The system detected unusual activity that requires attention. Please review the captured image for further investigation."
                    
                    print("\n" + "="*70)
                    print(f"🚨 [SECURITY ALERT] - {event_type} ({cam_type})")
                    print(ai_analysis)
                    print("="*70 + "\n")
                
                # Only send confirmed threats to backend
                if not is_real_threat:
                    continue
                
                # Save the alert image (only for confirmed threats)
                image_path = self._save_alert_image(frame_bytes, event_type, cam_type)
                
                # Send to backend API
                alert_data = {
                    'alert_type': event_type,
                    'camera_type': cam_type.lower(),
                    'ai_analysis': ai_analysis,
                    'image_path': image_path,
                    'severity': 'high' if event_type == 'SPOOF' else 'medium',
                    'metadata': metadata
                }
                
                self._send_to_backend(alert_data)
                
            except Exception as e:
                print(f"[SECURITY AI ANALYST] Critical error in worker loop: {e}")
            finally:
                self.task_queue.task_done()
