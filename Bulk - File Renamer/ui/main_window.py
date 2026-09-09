import os
import asyncio
from pathlib import Path
from PySide6.QtWidgets import (
    QMainWindow, QVBoxLayout, QHBoxLayout, QWidget, QPushButton, 
    QFileDialog, QSplitter, QLabel, QMessageBox, QComboBox, QInputDialog
)
from PySide6.QtCore import Qt
from core.rename_engine.pipeline import RenamePipeline
from core.preview_engine.preview import PreviewGenerator
from core.rename_engine.executor import RenameExecutor
from core.undo_engine.manager import UndoManager
from core.state_manager.preset_manager import PresetManager
from services.file_management.scanner import FileScanner
from ui.components.preview_table import PreviewTable
from ui.components.rule_list import RuleListWidget
from ui.dialogs.rule_dialogs import create_rule_dialog
from ui.dialogs.history_dialog import HistoryDialog
from ui.dialogs.ai_dialog import AISuggestionDialog
from utils.export import export_to_csv
from db.database import init_db

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Advanced Bulk File Renamer")
        self.resize(1400, 900)
        
        # Initialize Database
        init_db()
        
        self.pipeline = RenamePipeline()
        self.preview_generator = PreviewGenerator()
        self.executor = RenameExecutor()
        self.undo_manager = UndoManager()
        self.scanner = FileScanner()
        self.preset_manager = PresetManager()
        
        self.files = []
        self.previews = []
        
        self._setup_ui()
        self._load_styles()
        
    def _load_styles(self):
        style_path = Path(__file__).parent / "themes" / "style.qss"
        if style_path.exists():
            with open(style_path, "r", encoding="utf-8") as f:
                self.setStyleSheet(f.read())
                
    def _setup_ui(self):
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QHBoxLayout(main_widget)
        
        splitter = QSplitter(Qt.Orientation.Horizontal)
        main_layout.addWidget(splitter)
        
        # Left Panel: Rules
        rules_widget = QWidget()
        rules_layout = QVBoxLayout(rules_widget)
        
        pipeline_header = QLabel("<b>Rename Pipeline</b>")
        rules_layout.addWidget(pipeline_header)
        
        self.rule_list = RuleListWidget()
        self.rule_list.rules_reordered.connect(self.sync_pipeline_from_list)
        self.rule_list.rule_double_clicked.connect(self.edit_rule_at)
        self.rule_list.rule_deleted.connect(self.on_rule_deleted)
        rules_layout.addWidget(self.rule_list)
        
        # Rule controls: Move Up, Move Down, Edit, Remove
        reorder_layout = QHBoxLayout()
        move_up_btn = QPushButton("▲ Up")
        move_up_btn.clicked.connect(self.rule_list.move_selected_up)
        move_down_btn = QPushButton("▼ Down")
        move_down_btn.clicked.connect(self.rule_list.move_selected_down)
        edit_rule_btn = QPushButton("Edit")
        edit_rule_btn.clicked.connect(self.edit_selected_rule)
        remove_rule_btn = QPushButton("Remove")
        remove_rule_btn.clicked.connect(self.rule_list.remove_selected_rule)

        reorder_layout.addWidget(move_up_btn)
        reorder_layout.addWidget(move_down_btn)
        reorder_layout.addWidget(edit_rule_btn)
        reorder_layout.addWidget(remove_rule_btn)
        rules_layout.addLayout(reorder_layout)
        
        # Rule dropdown and Add
        self.rule_combo = QComboBox()
        self.rule_combo.addItems([
            "Add Prefix", "Add Suffix", "Replace Text", 
            "Regex Replace", "Sequential", "Extension"
        ])
        rules_layout.addWidget(self.rule_combo)
        
        add_rule_btn = QPushButton("Add Rule...")
        add_rule_btn.setStyleSheet("background-color: #89b4fa; color: #1e1e2e; font-weight: bold;")
        add_rule_btn.clicked.connect(self.add_rule)
        rules_layout.addWidget(add_rule_btn)

        clear_rules_btn = QPushButton("Clear Rules")
        clear_rules_btn.clicked.connect(self.clear_rules)
        rules_layout.addWidget(clear_rules_btn)

        # Preset and AI controls
        preset_layout = QHBoxLayout()
        save_preset_btn = QPushButton("Save Preset")
        save_preset_btn.clicked.connect(self.save_preset)
        load_preset_btn = QPushButton("Load Preset")
        load_preset_btn.clicked.connect(self.load_preset)
        preset_layout.addWidget(save_preset_btn)
        preset_layout.addWidget(load_preset_btn)
        rules_layout.addLayout(preset_layout)

        ai_btn = QPushButton("AI Smart Renamer...")
        ai_btn.setStyleSheet("background-color: #cba6f7; color: #1e1e2e; font-weight: bold;")
        ai_btn.clicked.connect(self.open_ai_dialog)
        rules_layout.addWidget(ai_btn)

        rules_layout.addStretch()
        splitter.addWidget(rules_widget)
        
        # Right Panel: Files & Preview
        preview_widget = QWidget()
        preview_layout = QVBoxLayout(preview_widget)
        
        btn_layout = QHBoxLayout()
        add_files_btn = QPushButton("Add Files")
        add_files_btn.clicked.connect(self.add_files)
        add_folder_btn = QPushButton("Add Folder")
        add_folder_btn.clicked.connect(self.add_folder)
        clear_files_btn = QPushButton("Clear Files")
        clear_files_btn.clicked.connect(self.clear_files)
        export_btn = QPushButton("Export CSV")
        export_btn.clicked.connect(self.export_csv)
        
        btn_layout.addWidget(add_files_btn)
        btn_layout.addWidget(add_folder_btn)
        btn_layout.addWidget(clear_files_btn)
        btn_layout.addWidget(export_btn)
        btn_layout.addStretch()
        preview_layout.addLayout(btn_layout)
        
        self.preview_table = PreviewTable()
        preview_layout.addWidget(self.preview_table)
        
        # Bottom controls
        bottom_layout = QHBoxLayout()
        history_btn = QPushButton("History & Rollback...")
        history_btn.clicked.connect(self.open_history_dialog)

        undo_btn = QPushButton("Undo Last")
        undo_btn.setStyleSheet("background-color: #f38ba8; color: #1e1e2e; font-weight: bold;")
        undo_btn.clicked.connect(self.undo_rename)

        execute_btn = QPushButton("Execute Rename")
        execute_btn.setStyleSheet("background-color: #a6e3a1; color: #1e1e2e; font-weight: bold; padding: 6px 14px;")
        execute_btn.clicked.connect(self.execute_rename)
        
        bottom_layout.addWidget(history_btn)
        bottom_layout.addStretch()
        bottom_layout.addWidget(undo_btn)
        bottom_layout.addWidget(execute_btn)
        
        preview_layout.addLayout(bottom_layout)
        splitter.addWidget(preview_widget)
        
        splitter.setSizes([350, 1050])
        
    def add_rule(self):
        selection = self.rule_combo.currentText()
        dialog = create_rule_dialog(selection, parent=self)
        if dialog and dialog.exec():
            rule = dialog.rule
            if rule:
                self.pipeline.add_rule(rule)
                self.rule_list.add_rule_item(rule)
                self.update_preview()

    def edit_selected_rule(self):
        row = self.rule_list.currentRow()
        if row >= 0:
            rule = self.rule_list.get_selected_rule()
            self.edit_rule_at(row, rule)

    def edit_rule_at(self, row: int, rule):
        if not rule:
            return
        dialog = create_rule_dialog(rule.name, parent=self, existing_rule=rule)
        if dialog and dialog.exec():
            new_rule = dialog.rule
            if new_rule:
                self.pipeline.rules[row] = new_rule
                self.rule_list.update_rule_item(row, new_rule)
                self.update_preview()

    def on_rule_deleted(self, row: int):
        if 0 <= row < len(self.pipeline.rules):
            self.pipeline.remove_rule(row)
            self.update_preview()

    def sync_pipeline_from_list(self):
        new_rules = self.rule_list.get_rules()
        self.pipeline.rules = new_rules
        self.update_preview()

    def clear_rules(self):
        self.pipeline.clear_rules()
        self.rule_list.clear()
        self.update_preview()

    def save_preset(self):
        if not self.pipeline.rules:
            QMessageBox.warning(self, "Preset", "No rules configured to save.")
            return
        name, ok = QInputDialog.getText(self, "Save Preset", "Enter preset name:")
        if ok and name.strip():
            path = self.preset_manager.save_preset(name.strip(), self.pipeline)
            QMessageBox.information(self, "Saved", f"Preset successfully saved to:\n{path}")

    def load_preset(self):
        presets = self.preset_manager.list_presets()
        if not presets:
            QMessageBox.information(self, "Presets", "No saved presets found.")
            return
        name, ok = QInputDialog.getItem(self, "Load Preset", "Select a preset:", presets, 0, False)
        if ok and name:
            rules = self.preset_manager.load_preset(name)
            self.pipeline.clear_rules()
            self.rule_list.clear()
            for r in rules:
                self.pipeline.add_rule(r)
                self.rule_list.add_rule_item(r)
            self.update_preview()
            QMessageBox.information(self, "Loaded", f"Loaded preset '{name}' with {len(rules)} rules.")

    def open_history_dialog(self):
        dialog = HistoryDialog(parent=self)
        dialog.exec()
        self.update_preview()

    def open_ai_dialog(self):
        if not self.files:
            QMessageBox.warning(self, "AI Smart Rename", "Please add some files first.")
            return
        dialog = AISuggestionDialog(self.files, parent=self)
        if dialog.exec():
            # Apply suggestions as a custom replace or direct renaming preview
            if dialog.suggestions:
                # We can present the suggestions in the preview table directly
                from core.preview_engine.preview import RenamePreviewItem
                custom_previews = []
                for f in self.files:
                    new_name = dialog.suggestions.get(f.name, f.name)
                    custom_previews.append(RenamePreviewItem(
                        original_path=f,
                        new_name=new_name,
                        is_valid=True
                    ))
                self.previews = custom_previews
                self.preview_table.populate(self.previews)

    def export_csv(self):
        if not self.previews:
            QMessageBox.warning(self, "Export", "No preview items to export.")
            return
        filename, _ = QFileDialog.getSaveFileName(self, "Export Preview to CSV", "", "CSV Files (*.csv)")
        if filename:
            export_to_csv(self.previews, Path(filename))
            QMessageBox.information(self, "Exported", f"Exported preview to {filename}")

    def add_files(self):
        files, _ = QFileDialog.getOpenFileNames(self, "Select Files")
        if files:
            for f in files:
                path = Path(f)
                if path not in self.files:
                    self.files.append(path)
            self.update_preview()
            
    def add_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select Folder")
        if folder:
            found = self.scanner.scan(Path(folder))
            for f in found:
                if f not in self.files:
                    self.files.append(f)
            self.update_preview()
            
    def clear_files(self):
        self.files.clear()
        self.update_preview()
        
    def update_preview(self):
        self.previews = self.preview_generator.generate_preview(self.files, self.pipeline)
        self.preview_table.populate(self.previews)
        
    def execute_rename(self):
        if not self.previews:
            return
            
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(self.executor.execute_batch(self.previews))
        
        self.undo_manager.record_transaction(results)
        
        success_count = sum(1 for r in results if r.is_valid and not r.error_message)
        QMessageBox.information(self, "Success", f"Successfully renamed {success_count}/{len(results)} files.")
        
        new_files = []
        for r in results:
            if r.is_valid and not r.error_message:
                new_files.append(r.new_path)
            else:
                new_files.append(r.original_path)
        
        self.files = new_files
        self.clear_rules()
        self.update_preview()

    def undo_rename(self):
        from db.database import SessionLocal
        from db.models.history import Transaction
        
        db = SessionLocal()
        last_txn = db.query(Transaction).filter(Transaction.is_undone == False).order_by(Transaction.id.desc()).first()
        db.close()
        
        if last_txn:
            success = self.undo_manager.undo_transaction(last_txn.id)
            if success:
                QMessageBox.information(self, "Undo", "Successfully rolled back the last rename operation.")
            else:
                QMessageBox.warning(self, "Undo", "Failed to rollback.")
        else:
            QMessageBox.information(self, "Undo", "No operations to undo.")
