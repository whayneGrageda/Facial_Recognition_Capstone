"""Configuration for Facial Recognition System"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration class for the facial recognition system"""
    
    # Camera settings
    TIMEIN_CAMERA_INDEX = int(os.getenv('TIMEIN_CAMERA_INDEX', '0'))
    TIMEOUT_CAMERA_INDEX = int(os.getenv('TIMEOUT_CAMERA_INDEX', '1'))
    CAMERA_WIDTH = int(os.getenv('CAMERA_WIDTH', '640'))
    CAMERA_HEIGHT = int(os.getenv('CAMERA_HEIGHT', '480'))
    CAMERA_FPS = int(os.getenv('CAMERA_FPS', '30'))
    
    # Recognition settings
    KNOWN_FACES_PATH = os.getenv('KNOWN_FACES_PATH', 'known_faces')
    MODEL_PATH = os.getenv('MODEL_PATH', 'models')
    CACHE_FILE = os.path.join(MODEL_PATH, 'face_encodings_cache_v2.pkl')
    
    # Recognition parameters
    SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', '0.36'))  # Lower threshold for better recognition
    MAX_FACES_PER_FRAME = int(os.getenv('MAX_FACES_PER_FRAME', '4'))
    PROCESS_EVERY_N_FRAMES = int(os.getenv('PROCESS_EVERY_N_FRAMES', '3'))  # Uncap display FPS by running AI on fewer frames
    RECOGNITION_COOLDOWN = int(os.getenv('RECOGNITION_COOLDOWN', '300'))  # 5 minutes
    DWELL_TIME_SECONDS = float(os.getenv('DWELL_TIME_SECONDS', '1.5'))  # Seconds a person must stay in frame before time-in
    
    # Performance & Stability settings
    RECOGNITION_SCALE = float(os.getenv('RECOGNITION_SCALE', '0.5'))  # Downscale for detection
    BOX_PERSISTENCE_FRAMES = int(os.getenv('BOX_PERSISTENCE_FRAMES', '10'))  # Keep boxes for 10 frames
    USE_CLAHE = os.getenv('USE_CLAHE', 'True').lower() == 'true'
    QUEUE_SIZE = int(os.getenv('QUEUE_SIZE', '1'))  # Set to 1 to always get latest frame
    
    # InsightFace v2 settings
    INSIGHTFACE_MODEL = os.getenv('INSIGHTFACE_MODEL', 'buffalo_sc')  # buffalo_sc (fast) | buffalo_s | buffalo_l (accurate)
    DET_SIZE_W = int(os.getenv('DET_SIZE_W', '640'))  # Detection input width (higher = better small-face detection)
    DET_SIZE_H = int(os.getenv('DET_SIZE_H', '640'))  # Detection input height
    DET_THRESHOLD = float(os.getenv('DET_THRESHOLD', '0.5'))  # Face detection confidence threshold
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', '0.45'))  # Minimum similarity to accept a match
    
    # Liveness Detection (Anti-Spoofing)
    ENABLE_LIVENESS = os.getenv('ENABLE_LIVENESS', 'True').lower() == 'true'
    LIVENESS_THRESHOLD = float(os.getenv('LIVENESS_THRESHOLD', '0.7'))

    # AI Reasoning Agent
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    
    # Database settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', '5432'))
    DB_NAME = os.getenv('DB_NAME', 'facial_recognition')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    
    # Backend API settings (for notifications)
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3002/api')
    USE_API_FOR_ATTENDANCE = os.getenv('USE_API_FOR_ATTENDANCE', 'True').lower() == 'true'
    CAMERA_API_KEY = os.getenv('CAMERA_API_KEY', '')
    
    def __init__(self):
        """Initialize and validate configuration"""
        self._validate()
    
    def _validate(self):
        """Validate that required paths exist"""
        # Create directories if they don't exist
        os.makedirs(self.KNOWN_FACES_PATH, exist_ok=True)
        os.makedirs(self.MODEL_PATH, exist_ok=True)
