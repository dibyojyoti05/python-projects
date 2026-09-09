# Enterprise PDF Management Suite - 100% Production Edition

A comprehensive, production-grade desktop application for managing PDF files, built with Python, PySide6 (Qt6), PyMuPDF, SQLAlchemy, and Tesseract OCR.

---

## Features

### 1. Live Interactive PDF Viewer
- High-fidelity rendering with PyMuPDF.
- **Page Navigation:** First, Previous, Next, Last, and Jump-to-Page spinbox with total page count (`Page X of Y`).
- **Zoom Controls:** Zoom In (+25%), Zoom Out (-25%), and Fit / 100% Reset.
- **Page Rotation:** 90° Clockwise and Counter-Clockwise rendering rotation.
- **Reading Progress Tracking:** Automatically records recently viewed files and last opened page in the database.

### 2. PDF Operations & Conversion
- **Merge PDFs:** Drag-and-drop file reordering, multi-file select, and optimized memory merging.
- **Split & Extract:** Extract page ranges (e.g. `1-3, 5-7`) or individual pages into separate documents.
- **Compress PDF:** Lossless file size optimization using stream deflation and object garbage collection.
- **Convert PDF:**
  - High-resolution multi-page image rendering (PNG).
  - Clean text extraction (.txt).
  - Word document conversion (.docx via `pdf2docx`).
  - Table extraction to Excel spreadsheet (.xlsx via `pdfplumber` & `pandas`).
- **OCR (Optical Character Recognition):** Extract searchable text from scanned or rasterized PDFs using Tesseract OCR.
- **Security & Encryption:** AES-256 password encryption with customizable user/owner permissions, plus fast decryption.
- **AI Document Intelligence:** Document summarization and keyword extraction powered by OpenAI API.

### 3. Cloud Storage (AWS S3)
- Direct PDF upload to custom Amazon S3 buckets.
- Remote object download with local path selection.
- Credential management handled through application settings.

### 4. Database & Operation Audit Logging
- **SQLite Database:** Zero-config embedded database stored at `db/pdf_suite.db` (also configurable to PostgreSQL via `DATABASE_URL`).
- **Audit History Tab:** Real-time log of every operation (Timestamp, Operation Type, Status, Input Files, Output Destination, Duration).
- **One-Click Actions:** "Open Selected Output File" and "Open Containing Folder" directly from the history table.

### 5. Settings & Theming
- In-app configuration for OpenAI API Keys, AWS Access Credentials, and default bucket names.
- **Theme Switcher:** Instant switching between **Dark (Catppuccin Mocha)** and **Light (Corporate Clean)** themes.
- **Logging:** Rotating file handler saving detailed logs to `logs/pdf_suite.log` (10MB max, 5 backups).

---

## Architecture

```
PDF - Merger/
├── core/
│   ├── config.py              # Application settings, paths, and rotating logger setup
├── db/
│   ├── database.py            # SQLAlchemy engine, session maker, and init_db()
│   ├── models.py              # OperationHistory, RecentDocument, AppSetting models
├── engines/
│   ├── ai/                    # OpenAI document summarization & keywords
│   ├── cloud/                 # AWS S3 upload and download client
│   ├── compression/           # Lossless PyMuPDF stream compressor
│   ├── conversion/            # Image, Text, Word, and Excel converters
│   ├── merge/                 # PDF merger engine
│   ├── ocr/                   # Tesseract OCR engine
│   ├── pdf/                   # Core PDF reading, metadata, and rendering
│   ├── security/              # AES-256 encryption and decryption
│   └── split/                 # Range-based page splitting and extraction
├── logs/                      # Rotating application logs (pdf_suite.log)
├── services/
│   ├── history_service.py     # Thread-safe audit logging & recent document service
│   └── settings_service.py    # Persistent app configuration & credential store
├── tests/
│   ├── test_database.py       # Database models, audit logs, and settings unit tests
│   └── test_engines.py        # Core PDF engines unit tests (100% passing)
├── themes/
│   └── theme_manager.py       # Catppuccin Dark & Corporate Light stylesheets
├── ui/
│   ├── main_window.py         # Main PySide6 window with 11 functional tabs
│   └── viewer.py              # Enhanced PDF viewer widget
├── utils/
│   └── worker.py              # QThreadPool background worker & Qt signals
├── main.py                    # Entrypoint with auto-db init and theme bootstrap
└── requirements.txt           # Python package dependencies
```

---

## Installation & Running

1. **Activate your Python environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the Desktop Application:**
   ```bash
   python main.py
   ```

---

## Running Automated Tests

Run the complete test suite using `pytest`:
```bash
pytest tests/ -v
```
All 10 tests across the engine layer and database layer pass automatically.
