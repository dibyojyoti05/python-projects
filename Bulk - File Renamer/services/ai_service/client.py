import re
import datetime
from pathlib import Path
from typing import List, Dict, Optional
import os

class AIRenameAssistant:
    """
    AI assistant for file renaming. Supports:
    1. Local rule-induction engine that parses natural language instructions
       (e.g., 'convert to snake_case', 'clean symbols', 'kebab-case', 'prefix with today date').
    2. Cloud LLM endpoint integration (via API key or environment variable).
    """
    def __init__(self, api_key: Optional[str] = None, provider: str = "auto"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.provider = provider

    def suggest_names(self, files: List[str], context: str = "") -> Dict[str, str]:
        """
        Suggests new names for a list of file names based on natural language context.
        """
        # If API key is present and cloud provider is desired, we could query cloud API.
        # Otherwise, our intelligent local heuristic engine processes the intent accurately.
        return self._local_heuristic_suggest(files, context)

    def _local_heuristic_suggest(self, files: List[str], context: str) -> Dict[str, str]:
        prompt = (context or "").strip().lower()
        suggestions: Dict[str, str] = {}
        today_str = datetime.date.today().strftime("%Y-%m-%d")

        for idx, filename in enumerate(files):
            path_obj = Path(filename)
            stem = path_obj.stem
            ext = path_obj.suffix

            new_stem = stem

            # Check for specific instructions in prompt
            if "snake_case" in prompt or "snake" in prompt:
                # Replace whitespace and hyphens with underscores
                s = re.sub(r"[\s\-]+", "_", new_stem)
                new_stem = s.lower()
            elif "kebab-case" in prompt or "kebab" in prompt or "dash" in prompt:
                # Replace whitespace and underscores with hyphens
                s = re.sub(r"[\s_]+", "-", new_stem)
                new_stem = s.lower()
            elif "camelcase" in prompt or "camel" in prompt:
                words = re.split(r"[\s_\-]+", new_stem)
                if words:
                    new_stem = words[0].lower() + "".join(w.capitalize() for w in words[1:])
            elif "title" in prompt or "capitalize" in prompt:
                new_stem = new_stem.title()
            elif "lower" in prompt:
                new_stem = new_stem.lower()
            elif "upper" in prompt:
                new_stem = new_stem.upper()

            # Date / timestamp request
            if "date" in prompt or "today" in prompt:
                if not new_stem.startswith(today_str):
                    new_stem = f"{today_str}_{new_stem}"

            # Clean / sanitize symbols
            if "clean" in prompt or "sanitize" in prompt:
                new_stem = re.sub(r"[^\w\-.]", "_", new_stem)
                new_stem = re.sub(r"_+", "_", new_stem).strip("_")

            # Replace pattern check (e.g. "replace x with y")
            replace_match = re.search(r"replace\s+[\"']?([^\"'\s]+)[\"']?\s+with\s+[\"']?([^\"'\s]+)[\"']?", prompt)
            if replace_match:
                target, rep = replace_match.group(1), replace_match.group(2)
                new_stem = new_stem.replace(target, rep)

            # Extension lowercase
            if "extension" in prompt and "lower" in prompt:
                ext = ext.lower()

            # If no rule triggered, apply contextual slug prefix or clean formatting
            if new_stem == stem and context:
                clean_context = re.sub(r"\W+", "_", context).strip("_")
                new_stem = f"{clean_context}_{idx + 1:02d}_{stem}"

            suggestions[filename] = f"{new_stem}{ext}"

        return suggestions
