from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional
from core.rename_engine.pipeline import RenamePipeline
from core.exceptions import CollisionError

@dataclass
class RenamePreviewItem:
    original_path: Path
    new_name: str
    is_valid: bool
    error_message: Optional[str] = None
    
    @property
    def new_path(self) -> Path:
        return self.original_path.with_name(self.new_name)

class PreviewGenerator:
    """
    Generates previews for batch rename operations and detects collisions.
    """
    def __init__(self):
        # Reserved characters in Windows
        self.invalid_chars = '<>:"/\\|?*'
        
    def generate_preview(self, files: List[Path], pipeline: RenamePipeline) -> List[RenamePreviewItem]:
        previews = []
        seen_paths = set()
        
        for idx, file_path in enumerate(files):
            try:
                new_name = pipeline.apply_pipeline(file_path.name, file_path, idx)
                item = RenamePreviewItem(original_path=file_path, new_name=new_name, is_valid=True)
                
                # Validation checks
                if not new_name:
                    item.is_valid = False
                    item.error_message = "File name cannot be empty."
                elif any(char in new_name for char in self.invalid_chars):
                    item.is_valid = False
                    item.error_message = f"File name contains invalid characters."
                elif item.new_path in seen_paths:
                    item.is_valid = False
                    item.error_message = "Collision: Another file will be renamed to this exact path."
                elif item.new_path.exists() and item.new_path != file_path:
                    # In Windows, paths are case-insensitive.
                    # if only case changed, it's valid.
                    if item.new_path.name.lower() != file_path.name.lower():
                        item.is_valid = False
                        item.error_message = "Collision: File already exists at destination."
                
                seen_paths.add(item.new_path)
                previews.append(item)
                
            except Exception as e:
                previews.append(RenamePreviewItem(
                    original_path=file_path, 
                    new_name=file_path.name, 
                    is_valid=False, 
                    error_message=str(e)
                ))
                
        return previews
