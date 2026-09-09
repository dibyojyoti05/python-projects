# Start Backend
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd backend; ..\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload`""

# Start Frontend
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd frontend; npm run dev`""

Write-Host "Servers started. Backend on port 8000, Frontend on port 5173"
