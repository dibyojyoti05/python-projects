from typing import List
from pathlib import Path
from plugins.base_rule import BaseRenameRule

class RenamePipeline:
    """
    Manages a sequence of rename rules and applies them to file names.
    """
    def __init__(self):
        self.rules: List[BaseRenameRule] = []
        
    def add_rule(self, rule: BaseRenameRule):
        self.rules.append(rule)
        
    def remove_rule(self, index: int):
        if 0 <= index < len(self.rules):
            self.rules.pop(index)
            
    def clear_rules(self):
        self.rules.clear()
        
    def apply_pipeline(self, original_name: str, file_path: Path, file_index: int) -> str:
        """
        Passes the original name through all rules sequentially.
        """
        current_name = original_name
        for rule in self.rules:
            current_name = rule.apply(current_name, file_path, file_index)
        return current_name

    def to_preset(self) -> List[dict]:
        return [rule.to_dict() for rule in self.rules]
