# Rename Pipeline & Plugin System

## 1. Pipeline Execution Model

The `RenamePipeline` processes files sequentially through an ordered chain of rules:

```
Original Name -> [ Rule 1 ] -> [ Rule 2 ] -> ... -> [ Rule N ] -> New Name
```

1. **Rule Transformation**:
   Each rule implements `apply(current_name: str, file_path: Path, index: int) -> str`.
2. **Preview Generation & Collision Detection**:
   Before any file is touched on disk, `PreviewGenerator` runs each file through the pipeline and performs checks:
   - **Empty Names**: Prevents zero-length target file names.
   - **Invalid Characters**: Rejects reserved Windows characters (`<>:"/\\|?*`).
   - **Internal Collisions**: Flags if two files in the batch would resolve to the same destination filename.
   - **Destination Collisions**: Flags if the new path already exists on disk (accounting for Windows case-insensitivity).
3. **Transactional Execution**:
   Once validated, `RenameExecutor` executes renames using a `ThreadPoolExecutor`. Successful renames are bundled into a `Transaction` containing individual `RenameOperation` records in SQLite.
4. **Rollback (Undo)**:
   `UndoManager` iterates over the transaction's operations in **reverse order**, renaming destination files back to their original names.

---

## 2. Writing Custom Plugin Rules

Custom rules inherit from `BaseRenameRule`:

```python
from pathlib import Path
from plugins.base_rule import BaseRenameRule

class CustomRule(BaseRenameRule):
    @property
    def name(self) -> str:
        return "My Custom Rule"
        
    @property
    def description(self) -> str:
        return "Transforms file names according to custom logic."
        
    def apply(self, current_name: str, file_path: Path, index: int) -> str:
        # custom transformation logic
        return current_name.lower()
```

Rules can serialize their configuration to JSON dictionaries via `to_dict()` and reconstruct via `create_rule_from_dict()`.
