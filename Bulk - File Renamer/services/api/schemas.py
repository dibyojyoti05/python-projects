from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class RuleModel(BaseModel):
    name: str = Field(..., description="Name of rule, e.g. 'Add Prefix', 'Replace Text'")
    config: Dict[str, Any] = Field(default_factory=dict, description="Rule specific parameters")

class PreviewRequest(BaseModel):
    files: List[str] = Field(..., description="List of file paths or file names to preview")
    rules: List[RuleModel] = Field(..., description="Ordered list of rename rules to apply")

class PreviewItemResponse(BaseModel):
    original_path: str
    new_name: str
    is_valid: bool
    error_message: Optional[str] = None

class PreviewResponse(BaseModel):
    items: List[PreviewItemResponse]
    total: int
    valid_count: int

class ExecuteRequest(BaseModel):
    files: List[str] = Field(..., description="Absolute paths to files to rename")
    rules: List[RuleModel] = Field(..., description="List of rename rules to execute")
    description: Optional[str] = Field("API Batch Rename", description="Optional transaction description")

class ExecuteResponse(BaseModel):
    success: bool
    renamed_count: int
    total_count: int
    transaction_id: Optional[int] = None
    items: List[PreviewItemResponse]

class AISuggestRequest(BaseModel):
    files: List[str] = Field(..., description="List of filenames to rename")
    prompt: str = Field(..., description="Instruction prompt for AI renaming")

class AISuggestResponse(BaseModel):
    suggestions: Dict[str, str]

class TransactionItemResponse(BaseModel):
    id: int
    timestamp: Optional[str]
    description: Optional[str]
    is_undone: bool
    operations_count: int
