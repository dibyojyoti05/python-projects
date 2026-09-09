class RenameError(Exception):
    """Base class for exceptions in this module."""
    pass

class RuleExecutionError(RenameError):
    """Exception raised for errors in the execution of a rename rule."""
    pass

class PreviewError(RenameError):
    """Exception raised for errors during preview generation."""
    pass

class UndoRedoError(RenameError):
    """Exception raised for errors during undo/redo operations."""
    pass

class CollisionError(RenameError):
    """Exception raised when a rename would result in a file collision."""
    pass
