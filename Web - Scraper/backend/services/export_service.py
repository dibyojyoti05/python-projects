import io
import csv
import json
from typing import Tuple, List, Dict, Any
from sqlalchemy.future import select

from backend.db.session import AsyncSessionLocal
from backend.db.models import ScrapeJob, ExtractedRecord

async def generate_export_data(job_id: str, export_format: str = "csv") -> Tuple[str, str, str]:
    """
    Returns (content_string, media_type, filename)
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ExtractedRecord).where(ExtractedRecord.job_id == job_id))
        records = result.scalars().all()

        rows: List[Dict[str, Any]] = [r.data for r in records if isinstance(r.data, dict)]

        if export_format.lower() == "json":
            content = json.dumps(rows, indent=2, ensure_ascii=False)
            media_type = "application/json"
            filename = f"scrape_export_{job_id[:8]}.json"
            return content, media_type, filename

        # Default to CSV
        output = io.StringIO()
        if rows:
            # Collect all unique field keys across rows
            fieldnames = []
            for r in rows:
                for k in r.keys():
                    if k not in fieldnames:
                        fieldnames.append(k)
            
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
        else:
            writer = csv.writer(output)
            writer.writerow(["No records found"])

        content = output.getvalue()
        media_type = "text/csv"
        filename = f"scrape_export_{job_id[:8]}.csv"
        return content, media_type, filename
