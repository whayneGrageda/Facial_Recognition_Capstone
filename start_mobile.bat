@echo off
echo ============================================
echo  FaceTrack Mobile - Starting Expo
echo ============================================
echo.
echo Starting Expo with IP 192.168.1.10...
echo Scan the QR code with Expo Go on your phone.
echo.
start "FaceTrack Mobile" cmd /k "cd /d %~dp0FaceTrack_Mobile && set REACT_NATIVE_PACKAGER_HOSTNAME=10.10.10.188 && npx expo start"
echo.
echo Expo is starting in a new window.
pause >nul
