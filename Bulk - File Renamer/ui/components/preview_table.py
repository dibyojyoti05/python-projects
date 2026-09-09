from PySide6.QtWidgets import QTableWidget, QTableWidgetItem, QHeaderView
from PySide6.QtGui import QColor
from PySide6.QtCore import Qt

class PreviewTable(QTableWidget):
    def __init__(self, parent=None):
        super().__init__(0, 4, parent)
        self.setHorizontalHeaderLabels(["Original Name", "New Name", "Path", "Status"])
        self.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        
        self.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)

    def populate(self, previews):
        self.setRowCount(0)
        for row, item in enumerate(previews):
            self.insertRow(row)
            
            orig_item = QTableWidgetItem(item.original_path.name)
            new_item = QTableWidgetItem(item.new_name)
            path_item = QTableWidgetItem(str(item.original_path.parent))
            status_text = "OK" if item.is_valid else "Error"
            status_item = QTableWidgetItem(status_text)
            
            if not item.is_valid:
                error_color = QColor("#f38ba8") # red
                orig_item.setForeground(error_color)
                new_item.setForeground(error_color)
                path_item.setForeground(error_color)
                status_item.setForeground(error_color)
                status_item.setToolTip(item.error_message)
            else:
                success_color = QColor("#a6e3a1") # green
                new_item.setForeground(success_color)

            self.setItem(row, 0, orig_item)
            self.setItem(row, 1, new_item)
            self.setItem(row, 2, path_item)
            self.setItem(row, 3, status_item)
