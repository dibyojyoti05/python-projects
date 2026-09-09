from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QTextEdit, QPushButton, QDialogButtonBox, QMessageBox, QTableWidget, QTableWidgetItem, QHeaderView
)
from PySide6.QtCore import Qt
from typing import List, Dict
from pathlib import Path
from services.ai_service.client import AIRenameAssistant

class AISuggestionDialog(QDialog):
    """Dialog allowing natural language prompting for renaming suggestions."""
    def __init__(self, files: List[Path], parent=None):
        super().__init__(parent)
        self.setWindowTitle("AI Smart Renamer")
        self.resize(700, 480)
        self.files = files
        self.suggestions: Dict[str, str] = {}
        self.assistant = AIRenameAssistant()
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        layout.addWidget(QLabel("<b>Describe how you want your files renamed:</b>"))
        self.prompt_edit = QLineEdit()
        self.prompt_edit.setPlaceholderText("e.g., 'standardize to kebab-case with date prefix', 'clean symbols and make lowercase'")
        layout.addWidget(self.prompt_edit)

        suggest_btn = QPushButton("Generate AI Suggestions")
        suggest_btn.setStyleSheet("background-color: #89b4fa; color: #1e1e2e; font-weight: bold; padding: 6px;")
        suggest_btn.clicked.connect(self.generate_suggestions)
        layout.addWidget(suggest_btn)

        layout.addWidget(QLabel("<b>Suggestions Preview:</b>"))
        self.table = QTableWidget(0, 2)
        self.table.setHorizontalHeaderLabels(["Original Name", "AI Suggested Name"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)

        self.button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        self.button_box.accepted.connect(self.accept)
        self.button_box.rejected.connect(self.reject)
        layout.addWidget(self.button_box)

    def generate_suggestions(self):
        prompt = self.prompt_edit.text().strip()
        if not prompt:
            QMessageBox.warning(self, "Input Required", "Please enter a description or prompt for the AI.")
            return

        file_names = [f.name for f in self.files]
        self.suggestions = self.assistant.suggest_names(file_names, context=prompt)

        self.table.setRowCount(0)
        for row, f in enumerate(self.files):
            self.table.insertRow(row)
            self.table.setItem(row, 0, QTableWidgetItem(f.name))
            new_name = self.suggestions.get(f.name, f.name)
            self.table.setItem(row, 1, QTableWidgetItem(new_name))
