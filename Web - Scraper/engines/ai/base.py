from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAIEngine(ABC):
    @abstractmethod
    async def generate_selectors(self, html_snippet: str, target_fields: List[str]) -> Dict[str, str]:
        """
        Given a snippet of HTML and a list of target field names (e.g. ['price', 'title']),
        returns a dictionary mapping field names to suggested CSS selectors.
        """
        pass
        
    @abstractmethod
    async def clean_data(self, raw_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Given raw extracted JSON data, clean and normalize it according to a schema.
        """
        pass
