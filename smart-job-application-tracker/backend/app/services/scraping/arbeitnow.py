import logging
import requests
from typing import List
from datetime import datetime
from app.schemas.job import JobCreate
from app.services.scraping.base import JobSourceProvider

logger = logging.getLogger(__name__)

class ArbeitnowSource(JobSourceProvider):
    @property
    def source_name(self) -> str:
        return "Arbeitnow"

    def fetch_jobs(self, keyword: str = "", location: str = "", limit: int = 20) -> List[JobCreate]:
        url = "https://www.arbeitnow.com/api/job-board-api"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobTracker/1.0",
            "Accept": "application/json"
        }
        jobs: List[JobCreate] = []

        try:
            response = requests.get(url, headers=headers, timeout=12)
            if response.status_code != 200:
                logger.warning(f"Arbeitnow returned status code {response.status_code}")
                return jobs

            data = response.json()
            raw_jobs = data.get("data", [])
            if not isinstance(raw_jobs, list):
                return jobs

            keyword_lower = keyword.lower().strip() if keyword else ""
            location_lower = location.lower().strip() if location else ""

            for item in raw_jobs:
                if not isinstance(item, dict):
                    continue

                title = item.get("title") or ""
                company = item.get("company_name") or ""
                job_location = item.get("location") or "Worldwide"
                is_remote = item.get("remote", False)
                remote_type = "Remote" if is_remote else "On-site"
                description = item.get("description") or ""
                tags = item.get("tags") or []
                job_types = item.get("job_types") or ["Full-time"]
                employment_type = job_types[0] if job_types else "Full-time"
                source_url = item.get("url") or ""
                external_id = item.get("slug") or source_url

                # Filter by keyword
                if keyword_lower:
                    tags_str = " ".join([str(t) for t in tags]).lower()
                    searchable = f"{title} {company} {description} {tags_str}".lower()
                    if keyword_lower not in searchable:
                        continue

                # Filter by location
                if location_lower and location_lower not in job_location.lower() and not is_remote:
                    continue

                # Timestamp
                created_at_val = item.get("created_at")
                posted_at = datetime.utcnow()
                if created_at_val and isinstance(created_at_val, (int, float)):
                    try:
                        posted_at = datetime.utcfromtimestamp(created_at_val)
                    except Exception:
                        posted_at = datetime.utcnow()

                job = JobCreate(
                    title=title.strip(),
                    company=company.strip(),
                    location=job_location.strip(),
                    remote_type=remote_type,
                    salary=None,
                    description=description,
                    requirements=", ".join(tags) if tags else None,
                    employment_type=str(employment_type).capitalize(),
                    posted_at=posted_at,
                    source_url=source_url,
                    external_job_id=str(external_id)
                )
                jobs.append(job)

                if len(jobs) >= limit:
                    break

        except Exception as e:
            logger.error(f"Error fetching from Arbeitnow: {e}")

        return jobs
