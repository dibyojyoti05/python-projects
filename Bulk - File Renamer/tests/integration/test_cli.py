import os
import pytest
import subprocess
from pathlib import Path

def test_cli_rename_and_undo(tmp_path):
    # Create test files
    file1 = tmp_path / "test1.txt"
    file2 = tmp_path / "test2.txt"
    file1.write_text("hello")
    file2.write_text("world")
    
    # Run CLI
    main_script = Path(__file__).parent.parent.parent / "main.py"
    
    # Apply prefix
    env = os.environ.copy()
    env["PYTHONPATH"] = str(main_script.parent)
    
    result = subprocess.run(
        ["python", str(main_script), "--cli", "--dir", str(tmp_path), "--prefix", "PRE_"],
        capture_output=True, text=True, env=env
    )
    
    assert "Successfully renamed 2/2 files" in result.stdout
    assert (tmp_path / "PRE_test1.txt").exists()
    assert (tmp_path / "PRE_test2.txt").exists()
    assert not file1.exists()
    
    # Undo
    result_undo = subprocess.run(
        ["python", str(main_script), "--cli", "--undo"],
        capture_output=True, text=True, env=env
    )
    
    assert "Successfully undid the last transaction" in result_undo.stdout
    assert file1.exists()
    assert file2.exists()
    assert not (tmp_path / "PRE_test1.txt").exists()
