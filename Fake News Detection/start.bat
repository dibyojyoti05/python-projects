@echo off
title TruthLens AI Launcher
cd /d "%~dp0"
echo ========================================================
echo   Starting TruthLens AI - Fake News Detection Platform
echo ========================================================
echo.
echo [1/3] Checking backend dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt

echo.
echo [2/3] Checking frontend dependencies...
cd /d "%~dp0frontend"
call npm install

echo.
echo [3/3] Launching Backend and Frontend servers...
start "TruthLens Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && python main.py"
start "TruthLens Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  All services launched successfully!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API Docs:   http://localhost:8000/docs
echo  - PostgreSQL Server:  127.0.0.1:5433 (fake_news_db)
echo ========================================================
pause
