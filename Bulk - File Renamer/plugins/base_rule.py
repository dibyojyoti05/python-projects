from abc import ABC, abstractmethod
from typing import Dict, Any
from pathlib import Path

class BaseRenameRule(ABC):
    """
    Abstract base class for all rename rules.
    Plugins should inherit from this class.
    """
    def __init__(self, **kwargs):
        self.config = kwargs
        
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the rule (e.g., 'Prefix Rule')."""
        pass
        
    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what the rule does."""
        pass
        
    @abstractmethod
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        """
        Applies the rename rule.
        
        :param current_name: The current name of the file (might be modified by previous rules in pipeline).
        :param file_path: The original absolute path of the file.
        :param index: The index of the file in the current batch (useful for sequential renaming).
        :return: The new name of the file.
        """
        pass

    def to_dict(self) -> Dict[str, Any]:
        """Serialize rule config for saving presets."""
        return {
            "name": self.name,
            "config": self.config
        }
