import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from core.rename_engine.pipeline import RenamePipeline
from plugins.base_rule import BaseRenameRule
from plugins.examples.basic_rules import create_rule_from_dict

class PresetManager:
    """Manages saving and loading rename presets (JSON pipelines)."""
    def __init__(self, preset_dir: Optional[Path] = None):
        self.preset_dir = preset_dir or Path(__file__).parent.parent.parent / "presets"
        self.preset_dir.mkdir(parents=True, exist_ok=True)

    def save_preset(self, name: str, pipeline: RenamePipeline) -> Path:
        """Saves a pipeline to a JSON preset file."""
        if not name.endswith(".json"):
            name = f"{name}.json"
        target_file = self.preset_dir / name
        data = {
            "name": Path(name).stem,
            "rules": pipeline.to_preset()
        }
        with open(target_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return target_file

    def load_preset(self, filepath_or_name: str) -> List[BaseRenameRule]:
        """Loads rules from a preset JSON file."""
        p = Path(filepath_or_name)
        if not p.is_file():
            if not filepath_or_name.endswith(".json"):
                filepath_or_name += ".json"
            p = self.preset_dir / filepath_or_name
            
        if not p.exists():
            raise FileNotFoundError(f"Preset file not found: {p}")

        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        rules = []
        for r_dict in data.get("rules", []):
            rules.append(create_rule_from_dict(r_dict))
        return rules

    def list_presets(self) -> List[str]:
        """Returns all preset names found in preset_dir."""
        return [p.stem for p in self.preset_dir.glob("*.json")]
