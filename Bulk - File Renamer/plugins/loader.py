import importlib
import pkgutil
import inspect
from pathlib import Path
from typing import Dict, Type
from plugins.base_rule import BaseRenameRule
import plugins

class PluginLoader:
    """
    Dynamically loads all RenameRule classes from the plugins directory.
    """
    def __init__(self):
        self.rules: Dict[str, Type[BaseRenameRule]] = {}
        self.load_plugins()
        
    def load_plugins(self):
        plugins_path = Path(plugins.__file__).parent
        for _, module_name, is_pkg in pkgutil.iter_modules([str(plugins_path)]):
            if is_pkg and module_name == "examples":
                module = importlib.import_module(f"plugins.{module_name}.basic_rules")
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if issubclass(obj, BaseRenameRule) and obj != BaseRenameRule:
                        try:
                            # Instantiate to get the display name
                            instance = obj()
                            self.rules[instance.name] = obj
                        except TypeError:
                            pass
