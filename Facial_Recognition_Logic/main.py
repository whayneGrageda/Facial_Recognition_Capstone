"""
Standalone Facial Recognition Attendance System
Optimized for Performance and Stability
"""

import cv2
import sys
import os
import threading
import multiprocessing
import time
import math
from queue import Empty
from datetime import datetime
from face_recognizer_v2 import FaceRecognizer
from database_logger import DatabaseLogger
from config import Config
import numpy as np

try:
    from ai_agent import SecurityAnalystAgent
except ImportError:
    SecurityAnalystAgent = None

# Global list to track all camera systems for coordinated shutdown
_global_systems = []

def recognition_process_worker(frame_queue, results_queue, stop_event, attendance_type, config_dict):
    """
    Background process for face recognition.
    Bypasses GIL and utilizes separate CPU core.
    """
    # Create a config object from the passed dict
    class ProcConfig:
        def __init__(self, d):
            for k, v in d.items():
                setattr(self, k, v)
    
    config = ProcConfig(config_dict)
    
    # Initialize components inside the process
    try:
        recognizer = FaceRecognizer(config)
        db_logger = DatabaseLogger(config)
        last_recognition_time = {}
        dwell_trackers = {} # Tracks {key: {'first_seen': datetime, 'last_seen': datetime}}
        
        print(f"[{attendance_type.upper()}] Recognition worker started")
        
        while not stop_event.is_set():
            try:
                # Get latest frame from queue (skip old frames)
                frame = None
                try:
                    # Queue.get() blocks, which is what we want
                    encoded_data = frame_queue.get(timeout=0.1)
                    if isinstance(encoded_data, bytes):
                        # Decode JPEG back into raw BGR frame
                        nparr = np.frombuffer(encoded_data, np.uint8)
                        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    else:
                        frame = encoded_data
                except Empty:
                    continue
                
                if frame is None:
                    continue
                
                # Perform recognition
                locations, names, confidences = recognizer.recognize_faces(frame)
                
                # Log attendance
                current_time = datetime.now()
                
                # Clean up old dwell trackers (people who left the frame for > 1 second)
                keys_to_remove = []
                for k, v in dwell_trackers.items():
                    if (current_time - v['last_seen']).total_seconds() > 1.0:
                        keys_to_remove.append(k)
                for k in keys_to_remove:
                    del dwell_trackers[k]

                for i, name in enumerate(names):
                    if name != "Unknown" and name != "SPOOF":
                        key = f"{name}_{attendance_type}"
                        last_time = last_recognition_time.get(key)
                        
                        if last_time is None or (current_time - last_time).total_seconds() > config.RECOGNITION_COOLDOWN:
                            # Check dwell time
                            if key not in dwell_trackers:
                                dwell_trackers[key] = {'first_seen': current_time, 'last_seen': current_time}
                            else:
                                dwell_trackers[key]['last_seen'] = current_time
                                
                            dwell_duration = (current_time - dwell_trackers[key]['first_seen']).total_seconds()
                            
                            if dwell_duration >= getattr(config, 'DWELL_TIME_SECONDS', 1.5):
                                success, reason = db_logger.log_attendance(name, confidences[i], attendance_type)
                                if success:
                                    print(f"[OK] {attendance_type.upper()}: {name} (confidence: {confidences[i]:.2%}) - Dwelled {dwell_duration:.1f}s")
                                    last_recognition_time[key] = current_time
                                    del dwell_trackers[key]
                                else:
                                    if reason.startswith("ALREADY_"):
                                        print(f"[INFO] Ignored {attendance_type.upper()}: {name} is already {attendance_type}ed today.")
                                        last_recognition_time[key] = current_time
                                        del dwell_trackers[key]
                                    else:
                                        print(f"[ERROR] Failed to log {attendance_type.upper()} for {name}: {reason}")
                    elif name == "SPOOF":
                        # Optional: Log the spoofing attempt to the console or database
                        print(f"[WARNING] {attendance_type.upper()}: Spoof attempt detected! (confidence: {confidences[i]:.2%})")
                
                # Send results back to main process
                if not results_queue.full():
                    results_queue.put({
                        'locations': locations,
                        'names': names,
                        'confidences': confidences,
                        'timestamp': time.time()
                    })
            
            except Exception as e:
                print(f"Recognition worker error ({attendance_type}): {e}")
                time.sleep(0.01)
                
    except Exception as e:
        print(f"FATAL: Recognition worker ({attendance_type}) failed to start: {e}")
    finally:
        if 'db_logger' in locals():
            db_logger.close()

class CameraSystem:
    """Individual camera system using multiprocessing for recognition"""
    
    def __init__(self, camera_index, attendance_type, config, ai_agent=None):
        self.camera_index = camera_index
        self.attendance_type = attendance_type
        self.config = config
        self.ai_agent = ai_agent
        self.window_name = f"{attendance_type.upper()} Camera"
        
        # Communication
        self.frame_queue = multiprocessing.Queue(maxsize=1)
        self.results_queue = multiprocessing.Queue(maxsize=1)
        self.stop_event = multiprocessing.Event()
        
        # Recognition tracking
        self.tracked_results = {
            'locations': [],
            'names': [],
            'confidences': [],
            'timestamp': 0
        }
        
        # FPS calculation
        self.fps = 0.0
        self.frame_count = 0
        self.fps_time = time.time()
        self.fps_update_interval = 15
        
        # Camera
        self.camera = None
        self._init_camera()
        
        # Start worker process
        self._start_recognition_worker()
    
    def _init_camera(self):
        """Initialize camera with optimal settings"""
        if os.name == "nt":
            self.camera = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
        else:
            self.camera = cv2.VideoCapture(self.camera_index)
        
        if not self.camera.isOpened():
            raise RuntimeError(f"Cannot open camera {self.camera_index}")
        
        # Set buffer size to 1 for minimal latency
        try:
            self.camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception as e:
            print(f"NOTE: Camera buffer size not configurable: {e}")
        
        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.CAMERA_WIDTH)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.CAMERA_HEIGHT)
        self.camera.set(cv2.CAP_PROP_FPS, self.config.CAMERA_FPS)
    
    def _start_recognition_worker(self):
        """Start background process for recognition"""
        # Convert config to dict for serialization
        config_dict = {k: v for k, v in vars(Config).items() if not k.startswith('_')}
        
        self.process = multiprocessing.Process(
            target=recognition_process_worker,
            args=(self.frame_queue, self.results_queue, self.stop_event, self.attendance_type, config_dict),
            daemon=True
        )
        self.process.start()
    
    def get_latest_frame(self):
        """Get and process current frame - called from main loop"""
        if self.stop_event.is_set():
            return None
        
        try:
            ret, frame = self.camera.read()
            if not ret or frame is None:
                return None
            
            # Flip frame horizontally to create a mirror effect
            frame = cv2.flip(frame, 1)
        except Exception:
            return None
        
        self.frame_count += 1
        
        # Calculate FPS
        if self.frame_count % self.fps_update_interval == 0:
            now = time.time()
            elapsed = now - self.fps_time
            self.fps = self.fps_update_interval / elapsed if elapsed > 0 else 0.0
            self.fps_time = now
        
        # Check for new recognition results
        try:
            while True:
                new_results = self.results_queue.get_nowait()
                self.tracked_results = new_results
                
                # Check for SPOOF to trigger AI agent
                if "SPOOF" in new_results['names']:
                    if hasattr(self, 'ai_agent') and self.ai_agent and getattr(self.ai_agent, 'enabled', False):
                        self.ai_agent.analyze_threat(frame, "SPOOF", {"attendance_type": self.attendance_type})
        except Empty:
            pass
        
        # Send frame for recognition every N frames
        if self.frame_count % self.config.PROCESS_EVERY_N_FRAMES == 0:
            # Drop old frame if queue is full
            if self.frame_queue.full():
                try:
                    self.frame_queue.get_nowait()
                except Empty:
                    pass
            try:
                # JPEG compress to bypass IPC memory bandwidth bottleneck, keeping full resolution
                _, encoded_img = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                self.frame_queue.put_nowait(encoded_img.tobytes())
            except:
                pass
        
        # Draw results (Temporal Persistence)
        # Scale coordinates from recognition resolution (480x360) to display resolution
        now = time.time()
        if now - self.tracked_results.get('timestamp', 0) < 2.0:
            locations = self.tracked_results['locations']
            names = self.tracked_results['names']
            confidences = self.tracked_results['confidences']
            
            # Calculate scale factors
            display_h, display_w = frame.shape[:2]
            recognition_w, recognition_h = display_w, display_h  # Now matches the display resolution since we sent the full frame
            scale_x = display_w / recognition_w
            scale_y = display_h / recognition_h
            
            for i, (top, right, bottom, left) in enumerate(locations):
                name = names[i]
                confidence = confidences[i]
                
                # Scale coordinates to display resolution
                scaled_top = int(top * scale_y)
                scaled_right = int(right * scale_x)
                scaled_bottom = int(bottom * scale_y)
                scaled_left = int(left * scale_x)
                
                # Choose color based on name and camera type
                if name == "SPOOF":
                    color = (0, 0, 255)  # Red for spoof
                elif name != "Unknown":
                    color = (0, 255, 0) if self.attendance_type == 'time-in' else (255, 165, 0)
                else:
                    color = (0, 0, 255)
                
                self._draw_pretty_box(frame, (scaled_left, scaled_top, scaled_right, scaled_bottom), name, confidence, color)
        
        # Add System HUD
        self._draw_status_hud(frame)
        
        return frame
    
    def _draw_pretty_box(self, img, bbox, name, confidence, color):
        """Draw a clean, simple face box with name only"""
        left, top, right, bottom = bbox
        
        # 1. Draw main box (clean 2px thickness)
        cv2.rectangle(img, (left, top), (right, bottom), color, 2)
        
        # 2. Draw name label without background (just text)
        label = name
        font = cv2.FONT_HERSHEY_SIMPLEX
        
        # Draw text with black outline for visibility
        (l_w, l_h), _ = cv2.getTextSize(label, font, 0.6, 2)
        text_x = left + 5
        text_y = top - 10 if top > 30 else bottom + 20
        
        # Black outline for contrast
        cv2.putText(img, label, (text_x, text_y), font, 0.6, (0, 0, 0), 3)
        # Colored text on top
        cv2.putText(img, label, (text_x, text_y), font, 0.6, color, 2)

    def _draw_status_hud(self, frame):
        """Draw minimal status info"""
        # Minimal top-left text, no overlays
        title = f"{self.attendance_type.upper()} | FPS: {self.fps:.1f}"
        cv2.putText(frame, title, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    def stop(self):
        """Stop camera and cleanup"""
        self.stop_event.set()
        if self.camera:
            try:
                self.camera.release()
            except:
                pass
        if hasattr(self, 'process'):
            self.process.terminate()
            self.process.join(timeout=1.0)

def main():
    """Main application with dual camera support and centralized UI"""
    global _global_systems
    
    # Required for Windows multiprocessing
    if os.name == 'nt':
        multiprocessing.freeze_support()
    
    print("=" * 60)
    print("OPTIMIZED FACIAL RECOGNITION ATTENDANCE SYSTEM")
    print("=" * 60)
    
    config = Config()
    
    # Start database connection test in main process
    db_test = DatabaseLogger(config)
    db_test.close()
    
    print("\nPress 'q' in any window to quit")
    print("-" * 60)
    
    # Initialize AI Agent
    ai_agent = None
    if SecurityAnalystAgent is not None:
        ai_agent = SecurityAnalystAgent(config.GEMINI_API_KEY)
    
    systems = []
    
    try:
        # Initialize TIME-IN camera
        print(f"\nInitializing TIME-IN camera (index: {config.TIMEIN_CAMERA_INDEX})...")
        timein_system = CameraSystem(config.TIMEIN_CAMERA_INDEX, 'time-in', config, ai_agent=ai_agent)
        systems.append(timein_system)
        print(f"✓ TIME-IN camera initialized")
        
        # Initialize TIME-OUT camera
        print(f"\nInitializing TIME-OUT camera (index: {config.TIMEOUT_CAMERA_INDEX})...")
        try:
            timeout_system = CameraSystem(config.TIMEOUT_CAMERA_INDEX, 'time-out', config, ai_agent=ai_agent)
            systems.append(timeout_system)
            print(f"✓ TIME-OUT camera initialized")
        except RuntimeError as e:
            print(f"WARNING: {e}. Running with TIME-IN only.")
        
        _global_systems = systems
        
        # MAIN UI LOOP - MUST be on main thread
        while True:
            for system in systems:
                frame = system.get_latest_frame()
                if frame is not None:
                    cv2.imshow(system.window_name, frame)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("Quit signal received")
                break
                
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"Main loop error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        for system in systems:
            system.stop()
        cv2.destroyAllWindows()
        print("Cameras released. Goodbye!")

if __name__ == "__main__":
    main()
