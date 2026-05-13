@echo off
echo ============================================
echo  FaceTrack - Starting All Services
echo ============================================
echo.

:: Backend (Node.js)
echo [1/3] Starting Backend on port 3002...
start "FaceTrack Backend" cmd /k "cd /d %~dp0Facial_Recognition_Backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Frontend (Vite)
echo [2/3] Starting Frontend on port 5173...
start "FaceTrack Frontend" cmd /k "cd /d %~dp0Facial_Recognition_Frontend && npm run dev"

:: Python Logic
echo [3/3] Starting Facial Recognition Logic...
start "FaceTrack Logic" cmd /k "cd /d %~dp0Facial_Recognition_Logic && python main.py"

echo.
echo ============================================
echo  All services started in separate windows:
echo    Backend  -> http://localhost:3002
echo    Frontend -> http://localhost:5173
echo    Logic    -> Python process
echo ============================================
echo.
echo Close this window or press any key to exit.
pause >nul
