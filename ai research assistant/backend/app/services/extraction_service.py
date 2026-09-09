import httpx
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class ExtractionService:
    def __init__(self):
        self.timeout = httpx.Timeout(10.0)
        # Use a realistic user agent to avoid being blocked
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    async def extract_url(self, url: str) -> str:
        """
        Fetches a URL and extracts clean text from the HTML.
        Returns empty string if it fails.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Check if it's HTML (ignore PDFs for this simple version to avoid complex dependencies, though we could add PyPDF2 later)
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                    logger.warning(f"Skipping non-HTML content at {url}")
                    return ""

                # Parse and clean HTML
                soup = BeautifulSoup(response.text, "lxml")
                
                # Remove unwanted tags
                for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    element.decompose()
                
                # Extract text
                text = soup.get_text(separator="\n", strip=True)
                
                # Clean up whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                clean_text = "\n".join(chunk for chunk in chunks if chunk)
                
                return clean_text
        except Exception as e:
            logger.error(f"Failed to extract {url}: {e}")
            return ""
