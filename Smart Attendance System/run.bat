@echo off
echo Starting Smart Attendance System...

REM Start Backend
start "Smart Attendance - Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Start Frontend
start "Smart Attendance - Frontend" cmd /k "cd frontend && npm run dev"

echo Both services started in separate windows.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo Swagger Docs: http://localhost:8000/docs
