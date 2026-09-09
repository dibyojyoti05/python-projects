"""Convenience script to run the Streamlit AI Meeting Notes Summarizer application."""
import os
import sys
import subprocess
from pathlib import Path

if __name__ == "__main__":
    app_path = Path(__file__).resolve().parent / "app" / "main.py"
    cmd = [sys.executable, "-m", "streamlit", "run", str(app_path)]
    print(f"Launching AI Meeting Notes Summarizer: {' '.join(cmd)}")
    subprocess.run(cmd)

