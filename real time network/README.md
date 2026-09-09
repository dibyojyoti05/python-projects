# NETWORKPULSE

A real-time network monitoring and analytics platform using Python, FastAPI, SQLite and WebSockets to monitor connectivity, latency, packet loss, bandwidth, network interfaces and authorized local devices. Features live visualization, anomaly detection, incident tracking, configurable alerts and historical performance analytics.

## Features

- **Live Dashboard**: Real-time stats on latency, packet loss, and throughput
- **Network Interfaces**: See real-time bytes up/down per interface
- **Alerts & Incidents**: Grouped alerts into incidents based on configurable thresholds
- **WebSockets**: Zero-lag updates to the UI
- **Local SQLite DB**: No Docker or external DB required

## Getting Started

Run the start script (Windows only):

```cmd
run.bat
```

This will start:
1. FastAPI Backend on `http://localhost:8000`
2. React Vite Frontend on `http://localhost:5173`

Alternatively, you can run them manually:

### Backend
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```cmd
cd frontend
npm install
npm run dev
```

Enjoy monitoring your network!
