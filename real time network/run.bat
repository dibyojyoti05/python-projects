@echo off
echo Starting NETWORKPULSE...

REM Start Backend
start "NETWORKPULSE Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Start Frontend
start "NETWORKPULSE Frontend" cmd /k "cd frontend && npm run dev"

echo Both services started in separate windows.
