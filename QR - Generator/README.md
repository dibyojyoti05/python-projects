# Enterprise QR Code Management Platform

A production-ready, commercial-grade QR code management and dynamic tracking platform.

## Architecture
- **Frontend:** Next.js 16 (React 19), TailwindCSS, Lucide Icons, TypeScript
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy Async (asyncpg)
- **Database:** PostgreSQL on Port `5433` (Core Data: Users, Organizations, Campaigns, QRs, Scans)
- **Migrations:** Alembic
- **Storage:** Local Direct High-Speed Image Streaming + Optional MinIO S3

---

## Features

1. **Interactive QR Studio**
   - Multi-type encoding: Website URL, Plain Text, Wi-Fi Network, Contact Card (vCard), Email, and SMS.
   - Real-time live visual preview as you type or adjust parameters.
   - Brand customization: Custom foreground and background hex colors, color presets, pixel scale density slider, quiet zone margin slider, and 4-tier error correction resilience (L, M, Q, H).
   - Instant SVG (vector) and PNG (raster) downloads.
   - Dynamic vs. Static QR mode selector with explanation.

2. **Dynamic QR Redirection & Audit Logs**
   - Change the destination URL of printed QR codes on the fly without reprinting.
   - Root dynamic redirect endpoint: `http://localhost:8000/r/{short_code}`.
   - Real-time device fingerprinting: extracts device type (Desktop, Mobile, Tablet), browser, operating system, IP address, and referrers.

3. **Management Dashboard**
   - KPI metrics: Total QRs, Total Scans, Active Dynamic Links, Total Campaigns.
   - Live search & dynamic/static filters.
   - Table view with QR thumbnail, short link copy, active/paused status toggles, inline destination editor, and delete actions.

4. **Scan Telemetry & Analytics**
   - Summary statistics: Total Scans, Unique Visitors, Last Scanned At.
   - Visual distribution progress bars for Device Types, Web Browsers, and Operating Systems.
   - Recent scan audit history log table with exact timestamps, IPs, and referrers.

5. **Marketing Campaigns**
   - Group QR codes into marketing campaigns.
   - Monitor total QR count per campaign.

6. **Bulk Generation Tool**
   - Download sample CSV template.
   - Upload CSV spreadsheets (`name,destination_url`).
   - Generates and downloads a ZIP archive containing all PNG or SVG QR codes in one click.

---

## Quickstart

### 1. Database Configuration
PostgreSQL is configured on:
- Host: `127.0.0.1`
- Port: `5433`
- Database: `qr_platform`
- User: `postgres`
- Password: `root`

Seed data is pre-populated with default admin:
- Email: `admin@example.com`
- Password: `admin123`

### 2. Run Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
alembic upgrade head
python scripts/seed_db.py
uvicorn app.main:app --reload --port 8000
```
Interactive API docs are available at `http://localhost:8000/docs`.

### 3. Run Frontend
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Testing

- **Backend Pytest Suite:**
  ```powershell
  cd backend
  .\venv\Scripts\pytest tests/test_api.py -v
  ```
  *(Tests root health check, admin JWT auth, dynamic QR generation, SVG image serving, dynamic redirect with scan audit logging, analytics aggregation, and bulk CSV generation).*

- **Frontend Production Build:**
  ```powershell
  cd frontend
  npm run build
  ```
