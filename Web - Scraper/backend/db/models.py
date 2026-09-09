import uuid
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="operator") # admin, manager, operator, viewer
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    organization = relationship("Organization", back_populates="users")

class ScraperProject(Base):
    __tablename__ = "scrapers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    start_url = Column(String, nullable=False)
    scraper_type = Column(String, default="http") # "http", "playwright", "crawler"
    max_depth = Column(Integer, default=1)
    proxy = Column(String, nullable=True)
    headers = Column(JSON, default=dict)
    extraction_schema = Column(JSON, default=dict) # e.g. {"title": {"type": "css", "selector": "h1", "attribute": "text"}}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    jobs = relationship("ScrapeJob", back_populates="scraper", cascade="all, delete-orphan", order_by="desc(ScrapeJob.started_at)")

class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    scraper_id = Column(String, ForeignKey("scrapers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="pending", index=True) # pending, running, completed, failed
    total_pages = Column(Integer, default=0)
    extracted_records_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    scraper = relationship("ScraperProject", back_populates="jobs")
    records = relationship("ExtractedRecord", back_populates="job", cascade="all, delete-orphan", order_by="desc(ExtractedRecord.crawled_at)")

class ExtractedRecord(Base):
    __tablename__ = "extracted_records"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    job_id = Column(String, ForeignKey("scrape_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    scraper_id = Column(String, ForeignKey("scrapers.id", ondelete="CASCADE"), nullable=False, index=True)
    source_url = Column(String, nullable=False)
    data = Column(JSON, nullable=False) # extracted key-value dictionary
    crawled_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("ScrapeJob", back_populates="records")
