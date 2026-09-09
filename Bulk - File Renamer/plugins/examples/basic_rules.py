import re
from pathlib import Path
from plugins.base_rule import BaseRenameRule
from core.exceptions import RuleExecutionError

class PrefixRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "Add Prefix"
        
    @property
    def description(self) -> str:
        return "Adds a specified prefix to the file name."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        prefix = self.config.get("prefix", "")
        return f"{prefix}{current_name}"

class SuffixRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "Add Suffix"
        
    @property
    def description(self) -> str:
        return "Adds a specified suffix to the file name before the extension."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        suffix = self.config.get("suffix", "")
        path_obj = Path(current_name)
        stem = path_obj.stem
        ext = path_obj.suffix
        return f"{stem}{suffix}{ext}"

class ReplaceRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "Replace Text"
        
    @property
    def description(self) -> str:
        return "Replaces specific text in the file name."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        target = self.config.get("target", "")
        replacement = self.config.get("replacement", "")
        return current_name.replace(target, replacement)

class RegexRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "Regex Replace"
        
    @property
    def description(self) -> str:
        return "Replaces text using a regular expression."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        pattern = self.config.get("pattern", "")
        replacement = self.config.get("replacement", "")
        try:
            return re.sub(pattern, replacement, current_name)
        except Exception as e:
            raise RuleExecutionError(f"Regex error: {e}")

class SequentialRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "Sequential Numbering"
        
    @property
    def description(self) -> str:
        return "Adds a sequential number to the file name."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        start = int(self.config.get("start", 1))
        padding = int(self.config.get("padding", 3))
        separator = self.config.get("separator", "_")
        
        path_obj = Path(current_name)
        stem = path_obj.stem
        ext = path_obj.suffix
        
        number = str(start + index).zfill(padding)
        return f"{stem}{separator}{number}{ext}"

class ExtensionRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "Change Extension"
        
    @property
    def description(self) -> str:
        return "Changes the file extension."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        new_ext = self.config.get("extension", "")
        if new_ext and not new_ext.startswith("."):
            new_ext = f".{new_ext}"
        stem = Path(current_name).stem
        return f"{stem}{new_ext}"

def create_rule_from_dict(data: dict) -> BaseRenameRule:
    name = data.get("name", "")
    config = data.get("config", {})
    mapping = {
        "Add Prefix": PrefixRule,
        "Add Suffix": SuffixRule,
        "Replace Text": ReplaceRule,
        "Regex Replace": RegexRule,
        "Sequential Numbering": SequentialRule,
        "Sequential": SequentialRule,
        "Change Extension": ExtensionRule,
        "Extension": ExtensionRule
    }
    rule_cls = mapping.get(name)
    if not rule_cls:
        raise ValueError(f"Unknown rule type: {name}")
    return rule_cls(**config)

