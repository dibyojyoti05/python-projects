from pathlib import Path
from typing import List
import re

class FileScanner:
    """
    Scans directories for files with advanced filtering.
    """
    def __init__(self):
        pass
        
    def scan(self, directory: Path, recursive: bool = False, pattern: str = None) -> List[Path]:
        if not directory.exists() or not directory.is_dir():
            return []
            
        files = []
        iterator = directory.rglob("*") if recursive else directory.glob("*")
        
        for path in iterator:
            if path.is_file():
                if pattern:
                    if re.search(pattern, path.name):
                        files.append(path)
                else:
                    files.append(path)
                    
        return sorted(files)
