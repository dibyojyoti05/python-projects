import os
from pathlib import Path
from typing import List
import asyncio
from concurrent.futures import ThreadPoolExecutor

from core.preview_engine.preview import RenamePreviewItem

class RenameExecutor:
    """
    Executes the validated rename operations.
    """
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)

    def _rename_file(self, item: RenamePreviewItem) -> bool:
        if not item.is_valid:
            return False
        
        try:
            if item.original_path.exists():
                os.rename(item.original_path, item.new_path)
            return True
        except Exception as e:
            item.is_valid = False
            item.error_message = f"Execution failed: {str(e)}"
            return False

    async def execute_batch(self, items: List[RenamePreviewItem]) -> List[RenamePreviewItem]:
        """
        Executes a batch of renames asynchronously.
        """
        loop = asyncio.get_running_loop()
        tasks = []
        for item in items:
            if item.is_valid:
                task = loop.run_in_executor(self.executor, self._rename_file, item)
                tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks)
            
        return items
