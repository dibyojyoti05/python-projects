from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from app.core.database import Base
import enum

class ResourceType(str, enum.Enum):
    EBOOK = "ebook"
    PDF = "pdf"
    RESEARCH_PAPER = "research_paper"

class DigitalResource(Base):
    __tablename__ = "digital_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    resource_type = Column(Enum(ResourceType), default=ResourceType.EBOOK)
    file_path = Column(String, nullable=False) # minio/s3 path
    uploaded_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Optional link to physical book
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True)
