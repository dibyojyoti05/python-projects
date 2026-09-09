from pathlib import Path
from typing import List, Callable, Optional
from core.rename_engine.pipeline import RenamePipeline
from core.preview_engine.preview import PreviewGenerator, RenamePreviewItem
from core.state_manager.preset_manager import PresetManager

class StateManager:
    """
    Centralizes runtime state for the batch file renamer:
    - active files
    - active rename pipeline
    - generated preview items
    - preset manager integration
    - observer callbacks for state changes
    """
    def __init__(self):
        self.files: List[Path] = []
        self.pipeline = RenamePipeline()
        self.preview_generator = PreviewGenerator()
        self.previews: List[RenamePreviewItem] = []
        self.preset_manager = PresetManager()
        self._listeners: List[Callable[['StateManager'], None]] = []

    def subscribe(self, callback: Callable[['StateManager'], None]):
        """Subscribe a callback to be notified whenever state changes."""
        if callback not in self._listeners:
            self._listeners.append(callback)

    def unsubscribe(self, callback: Callable[['StateManager'], None]):
        if callback in self._listeners:
            self._listeners.remove(callback)

    def _notify(self):
        for cb in self._listeners:
            try:
                cb(self)
            except Exception:
                pass

    def add_files(self, paths: List[Path]):
        added = False
        for p in paths:
            if p not in self.files:
                self.files.append(p)
                added = True
        if added:
            self.refresh_preview()

    def remove_file(self, path: Path):
        if path in self.files:
            self.files.remove(path)
            self.refresh_preview()

    def clear_files(self):
        self.files.clear()
        self.refresh_preview()

    def set_pipeline(self, pipeline: RenamePipeline):
        self.pipeline = pipeline
        self.refresh_preview()

    def refresh_preview(self) -> List[RenamePreviewItem]:
        self.previews = self.preview_generator.generate_preview(self.files, self.pipeline)
        self._notify()
        return self.previews

    def save_preset(self, name: str) -> Path:
        return self.preset_manager.save_preset(name, self.pipeline)

    def load_preset(self, name_or_path: str):
        rules = self.preset_manager.load_preset(name_or_path)
        self.pipeline.clear_rules()
        for r in rules:
            self.pipeline.add_rule(r)
        self.refresh_preview()
