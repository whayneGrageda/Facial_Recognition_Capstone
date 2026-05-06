# Facial Recognition Logic - Standalone Python Application

This is a standalone Python application for facial recognition attendance tracking using highly optimized multiprocessing, InsightFace (SCRFD + ArcFace) models, and FAISS indexing.

## Features

- **Dual Camera Support:** Handles TIME-IN and TIME-OUT physical cameras concurrently.
- **High-Performance Architecture:** Uses Python `multiprocessing` to bypass the GIL, decoupling rendering from inference.
- **Advanced Face Recognition:** Uses InsightFace (buffalo_sc pack) with ONNX Runtime GPU acceleration (if available).
- **Silent Face Anti-Spoofing (Liveness):** Integrated MiniFASNetV2 to detect and block screen/photo spoofing attempts.
- **GFPGAN Image Enhancement:** Automatically upscales blurry enrollment images for high-quality baseline encodings.
- **Temporal Voting (IoU):** Stabilizes identity across frames using IoU tracking to prevent flickering and spoof bleed-over.
- **FAISS Indexing:** Fast vector similarity search for large-scale databases.
- **Automatic Logging:** Logs directly to PostgreSQL with configurable cooldowns (e.g., 5 mins).

## Setup

1. Install Python dependencies:
```bash
setup.bat
```

2. Configure environment variables in `.env`:
```env
TIMEIN_CAMERA_INDEX=0    # Camera index for time-in
TIMEOUT_CAMERA_INDEX=1   # Camera index for time-out
DB_HOST=localhost
DB_PORT=5432
DB_NAME=facial_recognition
DB_USER=postgres
DB_PASSWORD=your_password
```

3. Download Models:
   - The system uses InsightFace (`buffalo_sc` default). It will attempt to download automatically.
   - `MiniFASNetV2.onnx` (Liveness) and `GFPGANv1.4.pth` (Enhancement) will be downloaded automatically to the `models/` folder on first run if missing.

## Usage

Run the application:
```bash
python main.py
```

### Controls

- `q` - Quit the application
- `r` - Reload known faces from the `known_faces/` folder

## How It Works

1. **Registration Flow** (Web Application):
   - User registers through the web interface
   - 50 frames are captured during registration
   - Frames are saved to `known_faces/{userId}/frame_001.jpg` through `frame_050.jpg`
   - User data (name, student_id, etc.) is saved to the database

2. **Recognition Flow** (Python Application):
   - Application loads face encodings from `known_faces/` folder
   - Two cameras run simultaneously:
     - TIME-IN camera (green boxes) - logs 'time-in' attendance
     - TIME-OUT camera (orange boxes) - logs 'time-out' attendance
   - When a face is recognized:
     - Checks 5-minute cooldown per person per attendance type
     - Logs to database with `attendance_type` ('time-in' or 'time-out')
     - Displays name and confidence on screen

3. **Web Dashboard**:
   - Fetches attendance logs from database
   - Displays time-in and time-out records
   - Shows attendance analytics and reports

## Directory Structure

```
Facial_Recognition_Logic/
├── main.py                 # Main application with multiprocessing dual camera support
├── face_recognizer_v2.py   # Advanced face recognition logic (InsightFace, GFPGAN, FAISS)
├── liveness_detector.py    # Silent Face Anti-Spoofing logic (MiniFASNetV2)
├── database_logger.py      # PostgreSQL attendance logger
├── config.py              # Configuration management
├── requirements.txt       # Python dependencies
├── setup.bat             # Setup script
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment variables
├── models/               # Auto-downloaded model files
│   ├── buffalo_sc/
│   ├── MiniFASNetV2.onnx
│   └── GFPGANv1.4.pth
└── known_faces/          # Face images for recognition
    ├── {userId}/
    │   ├── frame_001.jpg
    │   ├── frame_002.jpg
    │   └── ...
    └── ...
```

## Database Schema

The application logs to the `attendance` table:

```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type user_type_enum,
    name VARCHAR,
    timestamp TIMESTAMP,
    status VARCHAR,
    attendance_type VARCHAR(10) DEFAULT 'time-in'  -- 'time-in' or 'time-out'
);
```

## Troubleshooting

### Camera not opening
- Check camera indices in `.env`
- Ensure cameras are not being used by another application
- Try different camera indices (0, 1, 2, etc.)

### No faces recognized
- Ensure `known_faces/` folder has user images
- Check that folder names match user identifiers (student_id, employee_id, or name)
- Press `r` to reload faces without restarting

### Database connection failed
- Verify database credentials in `.env`
- Ensure PostgreSQL is running
- Check that the database exists and migrations have been run

## Performance Tips

- Adjust `PROCESS_EVERY_N_FRAMES` to process fewer frames (better performance, lower accuracy)
- Reduce `CAMERA_WIDTH` and `CAMERA_HEIGHT` for faster processing
- Adjust `SIMILARITY_THRESHOLD` if getting too many false positives/negatives
