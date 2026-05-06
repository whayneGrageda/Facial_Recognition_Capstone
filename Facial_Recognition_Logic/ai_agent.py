import os
import threading
import queue
import time
import cv2
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
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.enabled = bool(self.api_key) and GENAI_AVAILABLE
        
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
            # Copy frame to ensure it isn't mutated by the main thread
            frame_copy = frame.copy()
            self.task_queue.put((frame_copy, event_type, metadata or {}))
            self.last_alert_time = current_time
            
    def _worker_loop(self):
        while True:
            try:
                frame, event_type, metadata = self.task_queue.get()
                
                print(f"\n[AI AGENT] Analyzing {event_type} event... Please wait.")
                
                # Convert CV2 BGR to RGB PIL Image
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                
                cam_type = metadata.get("attendance_type", "Unknown Camera").upper()
                
                # Prepare prompt based on event type
                prompt = f"""
                You are a Security Analyst AI monitoring a facial recognition system.
                An alert of type '{event_type}' has been triggered on the {cam_type} camera.
                
                Analyze the provided camera frame. Describe what you see in the frame that might be causing this alert.
                For example, if it's a SPOOF alert, is the person holding up a phone screen, a printed photo, or wearing a mask?
                If it's an UNKNOWN person, describe their appearance and any suspicious behavior (e.g., wearing sunglasses, hoodie).
                Keep your response concise, professional, and actionable. Max 3 sentences.
                """
                
                response = self.model.generate_content([prompt, pil_img])
                
                print("\n" + "="*70)
                print(f"🚨 [SECURITY AI ANALYST] - ALERT: {event_type} ({cam_type})")
                print(response.text.strip())
                print("="*70 + "\n")
                
            except Exception as e:
                print(f"[SECURITY AI ANALYST] Error analyzing frame: {e}")
            finally:
                self.task_queue.task_done()
