import logging
import requests
from typing import List, Optional
from datetime import datetime
from app.schemas.job import JobCreate
from app.services.scraping.base import JobSourceProvider

logger = logging.getLogger(__name__)

class RemoteOKSource(JobSourceProvider):
    @property
    def source_name(self) -> str:
        return "RemoteOK"

    def fetch_jobs(self, keyword: str = "", location: str = "", limit: int = 20) -> List[JobCreate]:
        url = "https://remoteok.com/api"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobTracker/1.0",
            "Accept": "application/json"
        }
        jobs: List[JobCreate] = []

        try:
            response = requests.get(url, headers=headers, timeout=12)
            if response.status_code != 200:
                logger.warning(f"RemoteOK returned status code {response.status_code}")
                return jobs

            raw_data = response.json()
            if not isinstance(raw_data, list):
                return jobs

            keyword_lower = keyword.lower().strip() if keyword else ""
            location_lower = location.lower().strip() if location else ""

            for item in raw_data:
                # The first element is usually legal disclaimer/metadata without an 'id'
                if not isinstance(item, dict) or "id" not in item:
                    continue

                title = item.get("position") or item.get("title") or ""
                company = item.get("company") or ""
                job_location = item.get("location") or "Remote"
                description = item.get("description") or ""
                tags = item.get("tags") or []
                tags_str = " ".join([str(t) for t in tags]).lower()

                # Filter if keyword provided
                if keyword_lower:
                    searchable = f"{title} {company} {description} {tags_str}".lower()
                    if keyword_lower not in searchable:
                        continue

                # Filter if location provided
                if location_lower and location_lower not in job_location.lower():
                    continue

                # Parse date
                posted_at = None
                date_val = item.get("date")
                if date_val:
                    try:
                        if isinstance(date_val, (int, float)):
                            posted_at = datetime.utcfromtimestamp(date_val)
                        elif isinstance(date_val, str):
                            posted_at = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                    except Exception:
                        posted_at = datetime.utcnow()

                # Format salary if available
                salary = None
                sal_min = item.get("salary_min")
                sal_max = item.get("salary_max")
                if sal_min and sal_max:
                    salary = f"${sal_min:,} - ${sal_max:,}"
                elif sal_min:
                    salary = f"From ${sal_min:,}"
                elif sal_max:
                    salary = f"Up to ${sal_max:,}"

                job_url = item.get("url") or f"https://remoteok.com/remote-jobs/{item.get('id')}"
                if not job_url.startswith("http"):
                    job_url = f"https://remoteok.com{job_url}"

                job = JobCreate(
                    title=title.strip(),
                    company=company.strip(),
                    location=job_location.strip(),
                    remote_type="Remote",
                    salary=salary,
                    description=description,
                    requirements=", ".join(tags) if tags else None,
                    employment_type="Full-time",
                    posted_at=posted_at or datetime.utcnow(),
                    source_url=job_url,
                    external_job_id=str(item.get("id"))
                )
                jobs.append(job)

                if len(jobs) >= limit:
                    break

        except Exception as e:
            logger.error(f"Error fetching from RemoteOK: {e}")

        return jobs
