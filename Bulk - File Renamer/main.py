import sys
import argparse
import asyncio
from pathlib import Path
from PySide6.QtWidgets import QApplication
from ui.main_window import MainWindow
from utils.logger import setup_logger
from core.rename_engine.pipeline import RenamePipeline
from core.rename_engine.executor import RenameExecutor
from core.preview_engine.preview import PreviewGenerator
from plugins.examples.basic_rules import PrefixRule, SuffixRule, ReplaceRule
from db.database import init_db

def run_cli(args):
    from core.undo_engine.manager import UndoManager
    undo = UndoManager()
    
    if args.undo:
        # We need to find the last transaction and undo it
        from db.models.history import Transaction
        from db.database import SessionLocal
        db = SessionLocal()
        last_txn = db.query(Transaction).order_by(Transaction.id.desc()).first()
        db.close()
        
        if last_txn and not last_txn.is_undone:
            if undo.undo_transaction(last_txn.id):
                print("Successfully undid the last transaction.")
            else:
                print("Failed to undo.")
        else:
            print("No transactions to undo.")
        return
        
    init_db()
    pipeline = RenamePipeline()
    if args.prefix:
        pipeline.add_rule(PrefixRule(prefix=args.prefix))
    if args.suffix:
        pipeline.add_rule(SuffixRule(suffix=args.suffix))
    if args.replace:
        pipeline.add_rule(ReplaceRule(target=args.replace[0], replacement=args.replace[1]))
        
    if not pipeline.rules:
        print("Error: No rename rules specified for CLI.")
        return
        
    target_dir = Path(args.dir)
    if not target_dir.exists() or not target_dir.is_dir():
        print(f"Error: Invalid directory '{args.dir}'")
        return
        
    files = [f for f in target_dir.glob("*") if f.is_file()]
    if not files:
        print("No files found to rename.")
        return
        
    generator = PreviewGenerator()
    previews = generator.generate_preview(files, pipeline)
    
    executor = RenameExecutor()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results = loop.run_until_complete(executor.execute_batch(previews))
    
    undo.record_transaction(results, description="CLI Batch Rename")
    
    success_count = sum(1 for r in results if r.is_valid)
    print(f"Successfully renamed {success_count}/{len(results)} files.")

def main():
    parser = argparse.ArgumentParser(description="Bulk - File Renamer")
    parser.add_argument("--cli", action="store_true", help="Run in CLI mode")
    parser.add_argument("--undo", action="store_true", help="Undo the last rename operation")
    parser.add_argument("--dir", type=str, default=".", help="Directory to process in CLI mode")
    parser.add_argument("--prefix", type=str, help="Add prefix")
    parser.add_argument("--suffix", type=str, help="Add suffix")
    parser.add_argument("--replace", type=str, nargs=2, metavar=('TARGET', 'REPLACEMENT'), help="Replace text")
    parser.add_argument("--server", action="store_true", help="Start the FastAPI backend server")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host for FastAPI server")
    parser.add_argument("--port", type=int, default=8000, help="Port for FastAPI server")
    args = parser.parse_args()

    setup_logger()

    if args.server:
        import uvicorn
        from services.api.app import app
        print(f"Starting Bulk File Renamer API server at http://{args.host}:{args.port}")
        uvicorn.run(app, host=args.host, port=args.port)
        sys.exit(0)

    if args.cli:
        run_cli(args)
        sys.exit(0)
    
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
