# REST API & CLI Reference

## 1. REST API Endpoints

Start the FastAPI backend with:
```bash
python main.py --server --port 8000
```
Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### Rename Operations
- `GET /api/rules`: List all supported rules, parameters, and descriptions.
- `POST /api/preview`: Generate rename preview with validity status and collision warnings.
  - **Body**:
    ```json
    {
      "files": ["C:/data/photo1.png", "C:/data/photo2.png"],
      "rules": [
        {"name": "Add Prefix", "config": {"prefix": "2026_"}},
        {"name": "Sequential Numbering", "config": {"start": 1, "padding": 3, "separator": "_"}}
      ]
    }
    ```
- `POST /api/execute`: Execute validated batch renaming and record a new transaction.

### History & Rollback
- `GET /api/history`: List transactions with timestamp, description, and status.
- `GET /api/history/{id}`: Detailed view of a transaction including all file operations.
- `POST /api/history/{id}/undo`: Roll back the specified transaction.
- `GET /api/history/stats`: Aggregate statistics of operations and active/undone batches.

### AI Assistance
- `POST /api/ai/suggest`: Natural language naming suggestions.
  - **Body**:
    ```json
    {
      "files": ["Screenshot 2026-01-01.png", "raw data output.csv"],
      "prompt": "convert to kebab-case and lowercase"
    }
    ```

---

## 2. Command Line Interface (CLI)

The application supports direct command-line batch renaming and undo operations:

```bash
# Add a prefix to all files in a folder
python main.py --cli --dir ./my_folder --prefix "ARCHIVE_"

# Add a suffix before extension
python main.py --cli --dir ./my_folder --suffix "_FINAL"

# Replace text
python main.py --cli --dir ./my_folder --replace "draft" "release"

# Undo the last batch operation
python main.py --cli --undo
```
