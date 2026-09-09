import asyncio
from pathlib import Path
from typing import List, Optional
from PySide6.QtCore import QObject, Signal
from core.state_manager.state_manager import StateManager
from core.rename_engine.executor import RenameExecutor
from core.undo_engine.manager import UndoManager
from core.preview_engine.preview import RenamePreviewItem
from plugins.base_rule import BaseRenameRule

class RenameViewModel(QObject):
    """
    ViewModel coordinating UI actions with the core engine and state manager.
    Emits Qt signals to update UI views reactively.
    """
    previews_updated = Signal(list)
    rules_changed = Signal(list)
    files_changed = Signal(list)
    execution_started = Signal()
    execution_finished = Signal(list, int, int) # results, success_count, total_count
    error_occurred = Signal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.state = StateManager()
        self.executor = RenameExecutor()
        self.undo_manager = UndoManager()
        self.state.subscribe(self._on_state_changed)

    def _on_state_changed(self, state: StateManager):
        self.previews_updated.emit(state.previews)
        self.rules_changed.emit(state.pipeline.rules)
        self.files_changed.emit(state.files)

    @property
    def files(self) -> List[Path]:
        return self.state.files

    @property
    def rules(self) -> List[BaseRenameRule]:
        return self.state.pipeline.rules

    @property
    def previews(self) -> List[RenamePreviewItem]:
        return self.state.previews

    def add_files(self, paths: List[Path]):
        self.state.add_files(paths)

    def clear_files(self):
        self.state.clear_files()

    def add_rule(self, rule: BaseRenameRule):
        self.state.pipeline.add_rule(rule)
        self.state.refresh_preview()

    def update_rule(self, index: int, new_rule: BaseRenameRule):
        if 0 <= index < len(self.state.pipeline.rules):
            self.state.pipeline.rules[index] = new_rule
            self.state.refresh_preview()

    def remove_rule(self, index: int):
        self.state.pipeline.remove_rule(index)
        self.state.refresh_preview()

    def set_rules(self, rules: List[BaseRenameRule]):
        self.state.pipeline.rules = list(rules)
        self.state.refresh_preview()

    def clear_rules(self):
        self.state.pipeline.clear_rules()
        self.state.refresh_preview()

    def save_preset(self, name: str) -> Path:
        return self.state.save_preset(name)

    def load_preset(self, name: str):
        self.state.load_preset(name)

    def execute_rename(self) -> List[RenamePreviewItem]:
        if not self.state.previews:
            return []

        self.execution_started.emit()
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            results = loop.run_until_complete(self.executor.execute_batch(self.state.previews))

            self.undo_manager.record_transaction(results)

            success_count = sum(1 for r in results if r.is_valid and not r.error_message)
            total_count = len(results)

            # Update file paths to new names for valid renames
            new_files = []
            for r in results:
                if r.is_valid and not r.error_message:
                    new_files.append(r.new_path)
                else:
                    new_files.append(r.original_path)

            self.state.files = new_files
            self.state.pipeline.clear_rules()
            self.state.refresh_preview()

            self.execution_finished.emit(results, success_count, total_count)
            return results
        except Exception as e:
            self.error_occurred.emit(str(e))
            return []
