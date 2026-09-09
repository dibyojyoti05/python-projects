import logging
from ddgs import DDGS
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        self.ddgs = DDGS()

    def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Searches DuckDuckGo and returns a list of results.
        Returns: [{"title": "...", "href": "...", "body": "..."}, ...]
        """
        logger.info(f"Searching for: {query}")
        try:
            results = self.ddgs.text(query, max_results=max_results)
            # Ensure we return a list even if DDGS returns an iterator or None
            if not results:
                return []
            return list(results)
        except Exception as e:
            logger.error(f"Search failed for query '{query}': {e}")
            return []
