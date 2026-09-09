from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from lxml import etree

class DataParser:
    def __init__(self, html: str):
        self.html = html or ""
        self.soup = BeautifulSoup(self.html, "html.parser")
        try:
            self.tree = etree.HTML(self.html)
        except Exception:
            self.tree = None

    def extract_css(self, selector: str, attribute: Optional[str] = None) -> List[str]:
        if not selector:
            return []
        try:
            elements = self.soup.select(selector)
            results = []
            for el in elements:
                if attribute and attribute not in ("text", "inner_text"):
                    val = el.get(attribute)
                    if val is not None:
                        results.append(str(val).strip())
                else:
                    text = el.get_text(strip=True)
                    results.append(text)
            return results
        except Exception:
            return []

    def extract_xpath(self, xpath: str) -> List[str]:
        if self.tree is None or not xpath:
            return []
        try:
            elements = self.tree.xpath(xpath)
            results = []
            for el in elements:
                if isinstance(el, str):
                    results.append(el.strip())
                elif hasattr(el, "itertext"):
                    text = "".join(el.itertext()).strip()
                    if text:
                        results.append(text)
            return results
        except Exception:
            return []

    def extract_raw_fields(self, fields: Dict[str, Dict[str, str]]) -> Dict[str, List[str]]:
        """
        Extracts raw lists for each specified field.
        """
        data = {}
        for field_name, config in fields.items():
            if isinstance(config, str):
                config = {"type": "css", "selector": config}

            ext_type = config.get("type", "css").lower()
            selector = config.get("selector", "")
            attribute = config.get("attribute")
            
            if ext_type == "xpath":
                data[field_name] = self.extract_xpath(selector)
            else:
                data[field_name] = self.extract_css(selector, attribute)
        return data

    def extract_records(self, fields: Dict[str, Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Extracts and aligns field data into an array of row records.
        For example:
        {'title': ['A', 'B'], 'price': ['$1', '$2']} ->
        [{'title': 'A', 'price': '$1'}, {'title': 'B', 'price': '$2'}]
        """
        raw = self.extract_raw_fields(fields)
        if not raw:
            return []

        # Find maximum length among extracted field lists
        max_len = max((len(v) for v in raw.values()), default=0)
        if max_len == 0:
            return []

        records = []
        for i in range(max_len):
            row = {}
            for field, values in raw.items():
                if i < len(values):
                    row[field] = values[i]
                elif len(values) == 1:
                    # Repeat single values (e.g., site name or page category)
                    row[field] = values[0]
                else:
                    row[field] = ""
            records.append(row)
        return records
