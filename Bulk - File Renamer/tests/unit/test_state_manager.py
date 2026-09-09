import pytest
import tempfile
import shutil
from pathlib import Path
from core.state_manager.state_manager import StateManager
from core.state_manager.preset_manager import PresetManager
from plugins.examples.basic_rules import PrefixRule, SuffixRule

@pytest.fixture
def temp_preset_dir():
    d = tempfile.mkdtemp()
    yield Path(d)
    shutil.rmtree(d)

def test_preset_manager_save_and_load(temp_preset_dir):
    pm = PresetManager(preset_dir=temp_preset_dir)
    sm = StateManager()
    sm.pipeline.add_rule(PrefixRule(prefix="Test_"))
    sm.pipeline.add_rule(SuffixRule(suffix="_End"))

    preset_path = pm.save_preset("custom_pipeline", sm.pipeline)
    assert preset_path.exists()

    presets = pm.list_presets()
    assert "custom_pipeline" in presets

    loaded_rules = pm.load_preset("custom_pipeline")
    assert len(loaded_rules) == 2
    assert loaded_rules[0].name == "Add Prefix"
    assert loaded_rules[0].config["prefix"] == "Test_"
    assert loaded_rules[1].name == "Add Suffix"

def test_state_manager_files_and_listeners():
    sm = StateManager()
    events = []
    
    def on_change(state):
        events.append(len(state.files))

    sm.subscribe(on_change)
    f1 = Path("file1.txt")
    f2 = Path("file2.txt")
    
    sm.add_files([f1, f2])
    assert len(sm.files) == 2
    assert len(events) >= 1

    sm.remove_file(f1)
    assert len(sm.files) == 1

    sm.clear_files()
    assert len(sm.files) == 0
