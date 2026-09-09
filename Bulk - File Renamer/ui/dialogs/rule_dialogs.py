from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QSpinBox, QCheckBox, QPushButton, QDialogButtonBox, QMessageBox
)
from PySide6.QtCore import Qt
from typing import Optional, Dict, Any
import re
from plugins.base_rule import BaseRenameRule
from plugins.examples.basic_rules import (
    PrefixRule, SuffixRule, ReplaceRule, RegexRule, SequentialRule, ExtensionRule
)

class BaseRuleDialog(QDialog):
    """Base dialog for configuring a rename rule."""
    def __init__(self, title: str, parent=None):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setMinimumWidth(380)
        self.layout = QVBoxLayout(self)
        self.rule: Optional[BaseRenameRule] = None
        
    def add_buttons(self):
        button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        button_box.accepted.connect(self.validate_and_accept)
        button_box.rejected.connect(self.reject)
        self.layout.addWidget(button_box)
        
    def validate_and_accept(self):
        rule = self.build_rule()
        if rule:
            self.rule = rule
            self.accept()
            
    def build_rule(self) -> Optional[BaseRenameRule]:
        raise NotImplementedError

class PrefixRuleDialog(BaseRuleDialog):
    def __init__(self, parent=None, config: Optional[Dict[str, Any]] = None):
        super().__init__("Configure Prefix Rule", parent)
        self.layout.addWidget(QLabel("Prefix text to prepend:"))
        self.prefix_edit = QLineEdit()
        self.prefix_edit.setPlaceholderText("e.g. Project_ or 2026_")
        if config and "prefix" in config:
            self.prefix_edit.setText(config["prefix"])
        self.layout.addWidget(self.prefix_edit)
        self.add_buttons()

    def build_rule(self) -> Optional[BaseRenameRule]:
        prefix = self.prefix_edit.text()
        if not prefix:
            QMessageBox.warning(self, "Invalid Input", "Prefix cannot be empty.")
            return None
        return PrefixRule(prefix=prefix)

class SuffixRuleDialog(BaseRuleDialog):
    def __init__(self, parent=None, config: Optional[Dict[str, Any]] = None):
        super().__init__("Configure Suffix Rule", parent)
        self.layout.addWidget(QLabel("Suffix text to append (before extension):"))
        self.suffix_edit = QLineEdit()
        self.suffix_edit.setPlaceholderText("e.g. _v1 or _backup")
        if config and "suffix" in config:
            self.suffix_edit.setText(config["suffix"])
        self.layout.addWidget(self.suffix_edit)
        self.add_buttons()

    def build_rule(self) -> Optional[BaseRenameRule]:
        suffix = self.suffix_edit.text()
        if not suffix:
            QMessageBox.warning(self, "Invalid Input", "Suffix cannot be empty.")
            return None
        return SuffixRule(suffix=suffix)

class ReplaceRuleDialog(BaseRuleDialog):
    def __init__(self, parent=None, config: Optional[Dict[str, Any]] = None):
        super().__init__("Configure Replace Rule", parent)
        self.layout.addWidget(QLabel("Target text to replace:"))
        self.target_edit = QLineEdit()
        self.target_edit.setPlaceholderText("Text to find...")
        self.layout.addWidget(self.target_edit)

        self.layout.addWidget(QLabel("Replacement text:"))
        self.replacement_edit = QLineEdit()
        self.replacement_edit.setPlaceholderText("Replace with (leave blank to remove)...")
        self.layout.addWidget(self.replacement_edit)

        if config:
            self.target_edit.setText(config.get("target", ""))
            self.replacement_edit.setText(config.get("replacement", ""))
            
        self.add_buttons()

    def build_rule(self) -> Optional[BaseRenameRule]:
        target = self.target_edit.text()
        if not target:
            QMessageBox.warning(self, "Invalid Input", "Target text to find cannot be empty.")
            return None
        replacement = self.replacement_edit.text()
        return ReplaceRule(target=target, replacement=replacement)

class RegexRuleDialog(BaseRuleDialog):
    def __init__(self, parent=None, config: Optional[Dict[str, Any]] = None):
        super().__init__("Configure Regex Rule", parent)
        self.layout.addWidget(QLabel("Regular expression pattern:"))
        self.pattern_edit = QLineEdit()
        self.pattern_edit.setPlaceholderText("e.g. [0-9]+ or ^IMG_")
        self.layout.addWidget(self.pattern_edit)

        self.layout.addWidget(QLabel("Replacement string (supports \\1, \\2 groups):"))
        self.replacement_edit = QLineEdit()
        self.replacement_edit.setPlaceholderText("e.g. Doc_\\1")
        self.layout.addWidget(self.replacement_edit)

        if config:
            self.pattern_edit.setText(config.get("pattern", ""))
            self.replacement_edit.setText(config.get("replacement", ""))
            
        self.add_buttons()

    def build_rule(self) -> Optional[BaseRenameRule]:
        pattern = self.pattern_edit.text()
        if not pattern:
            QMessageBox.warning(self, "Invalid Input", "Regex pattern cannot be empty.")
            return None
        try:
            re.compile(pattern)
        except re.error as e:
            QMessageBox.warning(self, "Invalid Regex", f"Invalid regular expression syntax: {e}")
            return None
        replacement = self.replacement_edit.text()
        return RegexRule(pattern=pattern, replacement=replacement)

class SequentialRuleDialog(BaseRuleDialog):
    def __init__(self, parent=None, config: Optional[Dict[str, Any]] = None):
        super().__init__("Configure Sequential Numbering", parent)
        
        self.layout.addWidget(QLabel("Start Number:"))
        self.start_spin = QSpinBox()
        self.start_spin.setRange(0, 999999)
        self.start_spin.setValue(1)
        self.layout.addWidget(self.start_spin)

        self.layout.addWidget(QLabel("Padding digits (e.g. 3 -> 001):"))
        self.padding_spin = QSpinBox()
        self.padding_spin.setRange(1, 10)
        self.padding_spin.setValue(3)
        self.layout.addWidget(self.padding_spin)

        self.layout.addWidget(QLabel("Separator before number:"))
        self.separator_edit = QLineEdit()
        self.separator_edit.setText("_")
        self.layout.addWidget(self.separator_edit)

        if config:
            self.start_spin.setValue(int(config.get("start", 1)))
            self.padding_spin.setValue(int(config.get("padding", 3)))
            self.separator_edit.setText(config.get("separator", "_"))

        self.add_buttons()

    def build_rule(self) -> Optional[BaseRenameRule]:
        return SequentialRule(
            start=self.start_spin.value(),
            padding=self.padding_spin.value(),
            separator=self.separator_edit.text()
        )

class ExtensionRuleDialog(BaseRuleDialog):
    def __init__(self, parent=None, config: Optional[Dict[str, Any]] = None):
        super().__init__("Configure Extension Change", parent)
        self.layout.addWidget(QLabel("New file extension:"))
        self.ext_edit = QLineEdit()
        self.ext_edit.setPlaceholderText("e.g. .jpg, .png, or txt")
        if config and "extension" in config:
            self.ext_edit.setText(config["extension"])
        self.layout.addWidget(self.ext_edit)
        self.add_buttons()

    def build_rule(self) -> Optional[BaseRenameRule]:
        ext = self.ext_edit.text().strip()
        if not ext:
            QMessageBox.warning(self, "Invalid Input", "Extension cannot be empty.")
            return None
        return ExtensionRule(extension=ext)

def create_rule_dialog(rule_type: str, parent=None, existing_rule: Optional[BaseRenameRule] = None) -> Optional[BaseRuleDialog]:
    """Helper factory for opening rule dialogs by rule name or existing rule instance."""
    config = existing_rule.config if existing_rule else {}
    lookup = {
        "Add Prefix": PrefixRuleDialog,
        "Add Suffix": SuffixRuleDialog,
        "Replace Text": ReplaceRuleDialog,
        "Regex Replace": RegexRuleDialog,
        "Sequential": SequentialRuleDialog,
        "Sequential Numbering": SequentialRuleDialog,
        "Extension": ExtensionRuleDialog,
        "Change Extension": ExtensionRuleDialog
    }
    dialog_cls = lookup.get(rule_type)
    if dialog_cls:
        return dialog_cls(parent=parent, config=config)
    return None
