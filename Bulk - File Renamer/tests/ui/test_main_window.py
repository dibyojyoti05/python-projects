import pytest
import os
from pathlib import Path
from PySide6.QtWidgets import QApplication
from ui.main_window import MainWindow
from plugins.examples.basic_rules import PrefixRule, SuffixRule
from ui.viewmodels.rename_viewmodel import RenameViewModel

# Ensure offscreen rendering for headless test environments
os.environ["QT_QPA_PLATFORM"] = "offscreen"

def test_main_window_init(qtbot):
    window = MainWindow()
    qtbot.addWidget(window)
    assert window.windowTitle() == "Advanced Bulk File Renamer"
    assert window.rule_list.count() == 0
    assert window.preview_table.rowCount() == 0

def test_main_window_rule_list_operations(qtbot):
    window = MainWindow()
    qtbot.addWidget(window)

    # Manually add rules to test UI components and synchronization
    rule1 = PrefixRule(prefix="Pre_")
    rule2 = SuffixRule(suffix="_Suf")
    window.pipeline.add_rule(rule1)
    window.rule_list.add_rule_item(rule1)
    window.pipeline.add_rule(rule2)
    window.rule_list.add_rule_item(rule2)

    assert window.rule_list.count() == 2
    assert "Pre_" in window.rule_list.item(0).text()
    assert "_Suf" in window.rule_list.item(1).text()

    # Test move down
    window.rule_list.setCurrentRow(0)
    window.rule_list.move_selected_down()
    window.sync_pipeline_from_list()

    assert "_Suf" in window.rule_list.item(0).text()
    assert "Pre_" in window.rule_list.item(1).text()
    assert window.pipeline.rules[0].name == "Add Suffix"

    # Test remove rule
    window.rule_list.setCurrentRow(0)
    window.rule_list.remove_selected_rule()
    assert window.rule_list.count() == 1
    assert window.pipeline.rules[0].name == "Add Prefix"

    # Test clear
    window.clear_rules()
    assert window.rule_list.count() == 0
    assert len(window.pipeline.rules) == 0

def test_rename_viewmodel(qtbot):
    vm = RenameViewModel()
    received_rules = []
    vm.rules_changed.connect(lambda rules: received_rules.append(len(rules)))

    rule = PrefixRule(prefix="VM_")
    vm.add_rule(rule)

    assert len(vm.rules) == 1
    assert len(received_rules) > 0

    vm.clear_rules()
    assert len(vm.rules) == 0
