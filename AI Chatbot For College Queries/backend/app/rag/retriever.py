from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.document_chunk import DocumentChunk
from app.models.document import Document
from app.rag.processor import embeddings

def retrieve_context(db: Session, query: str, top_k: int = 5) -> List[Tuple[DocumentChunk, float]]:
    if not embeddings:
        return []
    
    # Generate query embedding
    query_embedding = embeddings.embed_query(query)
    
    # Perform vector similarity search using pgvector
    # Order by L2 distance (cosine distance can also be used depending on vector index)
    stmt = (
        select(DocumentChunk, DocumentChunk.embedding.l2_distance(query_embedding).label("distance"))
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(Document.status == "INDEXED")
        .order_by(DocumentChunk.embedding.l2_distance(query_embedding))
        .limit(top_k)
    )
    
    results = db.execute(stmt).all()
    
    return [(row.DocumentChunk, row.distance) for row in results]
