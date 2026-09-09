from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.job import JobCreate

class JobSourceProvider(ABC):
    """
    Abstract base class for all job scraping sources.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    @abstractmethod
    def fetch_jobs(self, keyword: str, location: str, limit: int = 10) -> List[JobCreate]:
        """
        Fetch a list of jobs from the source based on search criteria.
        """
        pass

    def normalize_job(self, raw_data: dict) -> JobCreate:
        """
        Convert raw source data into a standardized JobCreate schema.
        Should be implemented by subclasses if they do 2-step parsing.
        """
        raise NotImplementedError
