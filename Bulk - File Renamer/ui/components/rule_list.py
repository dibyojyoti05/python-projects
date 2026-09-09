from PySide6.QtWidgets import QListWidget, QListWidgetItem
from PySide6.QtCore import Signal, Qt
from PySide6.QtGui import QKeyEvent
from plugins.base_rule import BaseRenameRule
from typing import Optional

def format_rule_label(rule: BaseRenameRule) -> str:
    """Format a rule with its parameters into a human-readable display string."""
    name = rule.name
    cfg = rule.config
    if name == "Add Prefix":
        return f"Prefix: \"{cfg.get('prefix', '')}\""
    elif name == "Add Suffix":
        return f"Suffix: \"{cfg.get('suffix', '')}\""
    elif name == "Replace Text":
        return f"Replace: \"{cfg.get('target', '')}\" -> \"{cfg.get('replacement', '')}\""
    elif name == "Regex Replace":
        return f"Regex: /{cfg.get('pattern', '')}/ -> \"{cfg.get('replacement', '')}\""
    elif "Sequential" in name:
        return f"Sequence: start={cfg.get('start', 1)}, pad={cfg.get('padding', 3)}, sep='{cfg.get('separator', '_')}'"
    elif "Extension" in name:
        return f"Extension: {cfg.get('extension', '')}"
    return name

class RuleListWidget(QListWidget):
    rules_reordered = Signal()
    rule_double_clicked = Signal(int, object)
    rule_deleted = Signal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setDragDropMode(QListWidget.DragDropMode.InternalMove)
        self.setDefaultDropAction(Qt.DropAction.MoveAction)
        self.itemDoubleClicked.connect(self._on_item_double_clicked)

    def dropEvent(self, event):
        super().dropEvent(event)
        self.rules_reordered.emit()

    def keyPressEvent(self, event: QKeyEvent):
        if event.key() == Qt.Key.Key_Delete or event.key() == Qt.Key.Key_Backspace:
            row = self.currentRow()
            if row >= 0:
                self.remove_selected_rule()
                return
        super().keyPressEvent(event)

    def add_rule_item(self, rule: BaseRenameRule):
        item = QListWidgetItem(format_rule_label(rule))
        item.setData(Qt.ItemDataRole.UserRole, rule)
        self.addItem(item)

    def update_rule_item(self, row: int, rule: BaseRenameRule):
        item = self.item(row)
        if item:
            item.setText(format_rule_label(rule))
            item.setData(Qt.ItemDataRole.UserRole, rule)

    def get_rules(self):
        rules = []
        for i in range(self.count()):
            item = self.item(i)
            rule = item.data(Qt.ItemDataRole.UserRole)
            if rule:
                rules.append(rule)
        return rules

    def get_selected_rule(self) -> Optional[BaseRenameRule]:
        item = self.currentItem()
        if item:
            return item.data(Qt.ItemDataRole.UserRole)
        return None

    def remove_selected_rule(self):
        row = self.currentRow()
        if row >= 0:
            self.takeItem(row)
            self.rule_deleted.emit(row)

    def move_selected_up(self):
        row = self.currentRow()
        if row > 0:
            item = self.takeItem(row)
            self.insertItem(row - 1, item)
            self.setCurrentRow(row - 1)
            self.rules_reordered.emit()

    def move_selected_down(self):
        row = self.currentRow()
        if 0 <= row < self.count() - 1:
            item = self.takeItem(row)
            self.insertItem(row + 1, item)
            self.setCurrentRow(row + 1)
            self.rules_reordered.emit()

    def _on_item_double_clicked(self, item: QListWidgetItem):
        row = self.row(item)
        rule = item.data(Qt.ItemDataRole.UserRole)
        self.rule_double_clicked.emit(row, rule)
