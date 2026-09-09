from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import uuid

COLLECTION_NAME = "enterprise_documents"
_client = None
_embedding_model = None

def get_qdrant_client():
    global _client
    if _client is None:
        _client = QdrantClient(":memory:")
        try:
            _client.get_collection(COLLECTION_NAME)
        except Exception:
            _client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
    return _client

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

def add_document_chunks(workspace_id: int, file_id: str, chunks: list[str]):
    points = []
    model = get_embedding_model()
    embeddings = model.encode(chunks)
    
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding.tolist(),
                payload={
                    "workspace_id": workspace_id,
                    "file_id": file_id,
                    "chunk_index": i,
                    "text": chunk
                }
            )
        )
        
    client = get_qdrant_client()
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

def search_documents(workspace_id: int, query: str, limit: int = 5) -> list[str]:
    model = get_embedding_model()
    query_vector = model.encode([query])[0]
    
    client = get_qdrant_client()
    search_result = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector.tolist(),
        limit=limit,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="workspace_id",
                    match=MatchValue(value=workspace_id)
                )
            ]
        )
    )
    
    return [hit.payload["text"] for hit in search_result]
