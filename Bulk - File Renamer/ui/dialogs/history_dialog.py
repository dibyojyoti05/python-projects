from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem, 
    QPushButton, QLabel, QMessageBox, QHeaderView, QSplitter, QWidget
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QColor
from db.database import SessionLocal
from db.models.history import Transaction, RenameOperation
from core.undo_engine.manager import UndoManager

class HistoryDialog(QDialog):
    """Dialog for inspecting transaction history and executing rollbacks."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Rename History & Rollback")
        self.resize(850, 520)
        self.undo_manager = UndoManager()
        self._setup_ui()
        self.load_transactions()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        splitter = QSplitter(Qt.Orientation.Vertical)
        layout.addWidget(splitter)

        # Top section: Transactions list
        txn_widget = QWidget()
        txn_layout = QVBoxLayout(txn_widget)
        txn_layout.setContentsMargins(0, 0, 0, 0)
        txn_layout.addWidget(QLabel("<b>Batch Transactions:</b>"))

        self.txn_table = QTableWidget(0, 4)
        self.txn_table.setHorizontalHeaderLabels(["ID", "Date & Time", "Description", "Undone?"])
        self.txn_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.ResizeToContents)
        self.txn_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.txn_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        self.txn_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.txn_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.txn_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.txn_table.itemSelectionChanged.connect(self.on_transaction_selected)
        txn_layout.addWidget(self.txn_table)
        splitter.addWidget(txn_widget)

        # Bottom section: Operations in selected transaction
        ops_widget = QWidget()
        ops_layout = QVBoxLayout(ops_widget)
        ops_layout.setContentsMargins(0, 0, 0, 0)
        ops_layout.addWidget(QLabel("<b>Operations in Selected Transaction:</b>"))

        self.ops_table = QTableWidget(0, 3)
        self.ops_table.setHorizontalHeaderLabels(["Original File", "New File", "Status"])
        self.ops_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.ops_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.ops_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.ops_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        ops_layout.addWidget(self.ops_table)
        splitter.addWidget(ops_widget)

        # Bottom buttons
        btn_layout = QHBoxLayout()
        self.refresh_btn = QPushButton("Refresh")
        self.refresh_btn.clicked.connect(self.load_transactions)
        btn_layout.addWidget(self.refresh_btn)

        btn_layout.addStretch()

        self.undo_btn = QPushButton("Rollback Selected Transaction")
        self.undo_btn.setStyleSheet("background-color: #f38ba8; color: #1e1e2e; font-weight: bold; padding: 6px 12px;")
        self.undo_btn.clicked.connect(self.undo_selected)
        btn_layout.addWidget(self.undo_btn)

        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.accept)
        btn_layout.addWidget(close_btn)

        layout.addLayout(btn_layout)

    def load_transactions(self):
        self.txn_table.setRowCount(0)
        self.ops_table.setRowCount(0)
        db = SessionLocal()
        try:
            txns = db.query(Transaction).order_by(Transaction.id.desc()).all()
            for row, txn in enumerate(txns):
                self.txn_table.insertRow(row)
                id_item = QTableWidgetItem(str(txn.id))
                id_item.setData(Qt.ItemDataRole.UserRole, txn.id)
                time_item = QTableWidgetItem(txn.timestamp.strftime("%Y-%m-%d %H:%M:%S") if txn.timestamp else "")
                desc_item = QTableWidgetItem(txn.description or "")
                status_item = QTableWidgetItem("Yes" if txn.is_undone else "No")
                if txn.is_undone:
                    status_item.setForeground(QColor("#a6adc8"))
                else:
                    status_item.setForeground(QColor("#a6e3a1"))

                self.txn_table.setItem(row, 0, id_item)
                self.txn_table.setItem(row, 1, time_item)
                self.txn_table.setItem(row, 2, desc_item)
                self.txn_table.setItem(row, 3, status_item)
        finally:
            db.close()

    def on_transaction_selected(self):
        selected = self.txn_table.selectedItems()
        if not selected:
            return
        row = self.txn_table.currentRow()
        id_item = self.txn_table.item(row, 0)
        if not id_item:
            return
        txn_id = int(id_item.data(Qt.ItemDataRole.UserRole))

        db = SessionLocal()
        try:
            txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
            self.ops_table.setRowCount(0)
            if txn:
                for r_idx, op in enumerate(txn.operations):
                    self.ops_table.insertRow(r_idx)
                    self.ops_table.setItem(r_idx, 0, QTableWidgetItem(op.original_path))
                    self.ops_table.setItem(r_idx, 1, QTableWidgetItem(op.new_path))
                    self.ops_table.setItem(r_idx, 2, QTableWidgetItem(op.status))
        finally:
            db.close()

    def undo_selected(self):
        row = self.txn_table.currentRow()
        if row < 0:
            QMessageBox.warning(self, "Undo", "Please select a transaction to rollback.")
            return

        id_item = self.txn_table.item(row, 0)
        txn_id = int(id_item.data(Qt.ItemDataRole.UserRole))
        
        reply = QMessageBox.question(
            self, "Confirm Rollback", 
            f"Are you sure you want to rollback Transaction #{txn_id}?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            success = self.undo_manager.undo_transaction(txn_id)
            if success:
                QMessageBox.information(self, "Success", f"Transaction #{txn_id} was successfully rolled back.")
                self.load_transactions()
            else:
                QMessageBox.critical(self, "Error", f"Failed to rollback Transaction #{txn_id}. It may already be undone or files were moved.")
