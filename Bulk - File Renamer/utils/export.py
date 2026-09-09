import csv
from pathlib import Path
from typing import List
from core.preview_engine.preview import RenamePreviewItem

def export_to_csv(items: List[RenamePreviewItem], filepath: Path):
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Original Path", "New Name", "Valid", "Error Message"])
        for item in items:
            writer.writerow([str(item.original_path), item.new_name, item.is_valid, item.error_message or ""])
