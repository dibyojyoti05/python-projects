# Bulk - File Renamer Platform

A comprehensive, production-grade file management and intelligent batch renaming platform.

## Architecture

- **UI Layer**: PySide6 (Qt) with Catppuccin-themed styling, interactive rule dialogs, and real-time collision preview.
- **MVVM & State Management**: Decoupled ViewModels and observable `StateManager` with JSON preset support.
- **Core Engine**: Pluggable pipeline with rule chaining, collision detection, and multi-threaded asynchronous execution.
- **Undo Engine**: Transactional undo and rollback system backed by PostgreSQL / SQLite.
- **Backend Services**: FastAPI RESTful API with OpenAPI interactive documentation.
- **AI Smart Renamer**: Natural language rule-induction engine and extensible LLM completion support.
- **Database**: PostgreSQL (default) / SQLite via SQLAlchemy ORM.

## Installation

```bash
pip install -r requirements.txt
```

## Running the Application

### 1. Graphical User Interface (GUI)

```bash
python main.py
```

### 2. FastAPI REST Server

```bash
python main.py --server --port 8000
```
Open interactive API docs at `http://127.0.0.1:8000/docs`.

### 3. Command Line Interface (CLI)

```bash
# Add a prefix
python main.py --cli --dir ./my_folder --prefix "ARCHIVE_"

# Add a suffix
python main.py --cli --dir ./my_folder --suffix "_v1"

# Replace text
python main.py --cli --dir ./my_folder --replace "draft" "final"

# Rollback last operation
python main.py --cli --undo
```

## Running Tests

```bash
pytest
```
