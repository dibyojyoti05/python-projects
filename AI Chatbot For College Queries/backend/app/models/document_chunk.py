from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.db.base import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    
    # Define vector column with dimensions (e.g., 768 for gemini, 384 for sentence-transformers minilm)
    # Since we might use different models, we can define the dimension. Let's assume 768 for gemini-1.5 embeddings.
    embedding = Column(Vector(768))

    document = relationship("Document")
