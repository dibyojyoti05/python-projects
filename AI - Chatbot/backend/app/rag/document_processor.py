import os
import uuid

def process_and_chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Very basic sliding window chunking algorithm for text.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

async def process_uploaded_file(workspace_id: int, filename: str, content: bytes) -> str:
    """
    Simulates parsing a file (PDF, TXT, etc), extracting text, chunking it, 
    and sending it to the vector store.
    """
    # 1. Parse text (Simplified for demonstration - assumes it's plain text or utf-8 parseable)
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        # Fallback or error handling for binary files without OCR/PDF parsing
        text = f"[Binary content for {filename}]"

    # 2. Chunk text
    chunks = process_and_chunk_text(text)
    
    # 3. Save to Vector Store
    from app.rag.vector_store import add_document_chunks
    file_id = str(uuid.uuid4())
    add_document_chunks(workspace_id=workspace_id, file_id=file_id, chunks=chunks)
    
    return file_id
