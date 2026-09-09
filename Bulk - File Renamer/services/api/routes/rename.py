from fastapi import APIRouter, HTTPException
from pathlib import Path
from typing import List, Dict, Any
import asyncio

from core.rename_engine.pipeline import RenamePipeline
from core.preview_engine.preview import PreviewGenerator, RenamePreviewItem
from core.rename_engine.executor import RenameExecutor
from core.undo_engine.manager import UndoManager
from plugins.examples.basic_rules import create_rule_from_dict
from services.api.schemas import (
    PreviewRequest, PreviewResponse, PreviewItemResponse,
    ExecuteRequest, ExecuteResponse, RuleModel
)

router = APIRouter(prefix="/api", tags=["Rename Operations"])

@router.get("/rules")
def get_available_rules() -> List[Dict[str, Any]]:
    """Returns all available rule types and sample configuration schemas."""
    return [
        {
            "name": "Add Prefix",
            "description": "Adds a specified prefix to the file name.",
            "params": {"prefix": "string (required)"}
        },
        {
            "name": "Add Suffix",
            "description": "Adds a specified suffix before the extension.",
            "params": {"suffix": "string (required)"}
        },
        {
            "name": "Replace Text",
            "description": "Replaces occurrences of target text with replacement.",
            "params": {"target": "string (required)", "replacement": "string"}
        },
        {
            "name": "Regex Replace",
            "description": "Replaces text matching a regular expression.",
            "params": {"pattern": "regex string (required)", "replacement": "string"}
        },
        {
            "name": "Sequential Numbering",
            "description": "Appends formatted sequential numbers.",
            "params": {"start": "int", "padding": "int", "separator": "string"}
        },
        {
            "name": "Change Extension",
            "description": "Modifies the extension of the file.",
            "params": {"extension": "string (required, e.g. '.jpg')"}
        }
    ]

def _build_pipeline(rules_data: List[RuleModel]) -> RenamePipeline:
    pipeline = RenamePipeline()
    for r in rules_data:
        rule_obj = create_rule_from_dict({"name": r.name, "config": r.config})
        pipeline.add_rule(rule_obj)
    return pipeline

@router.post("/preview", response_model=PreviewResponse)
def generate_preview(payload: PreviewRequest):
    """Generates preview items with collision and syntax validation for given files and rules."""
    try:
        pipeline = _build_pipeline(payload.rules)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid rule configuration: {e}")

    paths = [Path(f) for f in payload.files]
    generator = PreviewGenerator()
    previews = generator.generate_preview(paths, pipeline)

    items = [
        PreviewItemResponse(
            original_path=str(p.original_path),
            new_name=p.new_name,
            is_valid=p.is_valid,
            error_message=p.error_message
        ) for p in previews
    ]
    valid_count = sum(1 for i in items if i.is_valid)
    return PreviewResponse(items=items, total=len(items), valid_count=valid_count)

@router.post("/execute", response_model=ExecuteResponse)
async def execute_rename(payload: ExecuteRequest):
    """Executes validated batch renames on disk and records the transaction in database."""
    try:
        pipeline = _build_pipeline(payload.rules)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid rule configuration: {e}")

    paths = [Path(f) for f in payload.files]
    generator = PreviewGenerator()
    previews = generator.generate_preview(paths, pipeline)

    executor = RenameExecutor()
    results = await executor.execute_batch(previews)

    undo_manager = UndoManager()
    undo_manager.record_transaction(results, description=payload.description)

    # Get last transaction id from DB
    from db.database import SessionLocal
    from db.models.history import Transaction
    db = SessionLocal()
    last_txn = db.query(Transaction).order_by(Transaction.id.desc()).first()
    txn_id = last_txn.id if last_txn else None
    db.close()

    items = [
        PreviewItemResponse(
            original_path=str(p.original_path),
            new_name=p.new_name,
            is_valid=p.is_valid,
            error_message=p.error_message
        ) for p in results
    ]
    renamed = sum(1 for i in items if i.is_valid and not i.error_message)

    return ExecuteResponse(
        success=True,
        renamed_count=renamed,
        total_count=len(items),
        transaction_id=txn_id,
        items=items
    )
