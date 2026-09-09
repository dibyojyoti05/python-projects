from typing import List
from datetime import datetime
from app.schemas.job import JobCreate
from app.services.scraping.base import JobSourceProvider

class DummySource(JobSourceProvider):
    @property
    def source_name(self) -> str:
        return "DummySource"

    def fetch_jobs(self, keyword: str, location: str, limit: int = 10) -> List[JobCreate]:
        return [
            JobCreate(
                title=f"{keyword} Developer",
                company="Acme Corp",
                location=location,
                remote_type="Remote",
                salary="$100k-$150k",
                description="This is a great dummy job.",
                posted_at=datetime.utcnow(),
                source_url="https://dummy.com/job/1",
                external_job_id="dummy-1"
            )
        ]
