import asyncio
from typing import Set, List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

from engines.scraper.base import ScrapeRequest, BaseScraper
from engines.scraper.http import HttpScraper

class Spider:
    def __init__(self, start_url: str, max_depth: int = 1, max_pages: int = 10, scraper: Optional[BaseScraper] = None):
        self.start_url = start_url
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.scraper = scraper or HttpScraper()
        
        self.domain = urlparse(start_url).netloc
        self.visited: Set[str] = set()
        self.results: List[Dict[str, Any]] = []

    def _is_valid_url(self, url: str) -> bool:
        parsed = urlparse(url)
        return bool(parsed.netloc) and bool(parsed.scheme) and parsed.netloc == self.domain

    def _extract_links(self, base_url: str, html: str) -> Set[str]:
        try:
            soup = BeautifulSoup(html, "html.parser")
            links = set()
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                full_url = urljoin(base_url, href).split("#")[0].split("?")[0]
                if self._is_valid_url(full_url):
                    links.add(full_url)
            return links
        except Exception:
            return set()

    async def crawl(self) -> List[Dict[str, Any]]:
        queue = [(self.start_url, 0)]
        self.visited.add(self.start_url)
        
        while queue and len(self.results) < self.max_pages:
            current_url, depth = queue.pop(0)
            
            try:
                request = ScrapeRequest(url=current_url)
                response = await self.scraper.scrape(request)
                
                self.results.append({
                    "url": current_url,
                    "status": response.status_code,
                    "html": response.html,
                    "content_length": len(response.html)
                })
                
                if depth < self.max_depth:
                    links = self._extract_links(current_url, response.html)
                    for link in links:
                        if link not in self.visited and len(self.visited) < self.max_pages * 2:
                            self.visited.add(link)
                            queue.append((link, depth + 1))
                            
            except Exception as e:
                self.results.append({
                    "url": current_url,
                    "status": 500,
                    "html": "",
                    "error": str(e)
                })
        
        return self.results
