import os
import tempfile
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.core.config import settings
from app.core import storage

# Initialize embeddings model based on config
embeddings = None
if settings.LLM_PROVIDER == "gemini":
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.LLM_API_KEY
    )
# Add logic for other providers here later

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

def process_document(db: Session, document_id: int):
    # 1. Fetch document from DB
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return
    
    doc.status = "PROCESSING"
    db.commit()

    try:
        # 2. Download from MinIO to temp file
        ext = doc.s3_key.split(".")[-1].lower() if "." in doc.s3_key else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            storage.client.fget_object(settings.STORAGE_BUCKET_NAME, doc.s3_key, tmp.name)
            tmp_path = tmp.name

        # 3. Load text based on extension
        if ext == "pdf":
            loader = PyPDFLoader(tmp_path)
            raw_docs = loader.load()
        elif ext in ["doc", "docx"]:
            loader = Docx2txtLoader(tmp_path)
            raw_docs = loader.load()
        else: # assume text/markdown
            loader = TextLoader(tmp_path)
            raw_docs = loader.load()

        # 4. Split into chunks
        chunks = text_splitter.split_documents(raw_docs)
        
        # 5. Generate embeddings and save to DB
        for i, chunk in enumerate(chunks):
            page_num = chunk.metadata.get("page", 0) + 1 # PyPDF page is 0-indexed
            
            # Embed the chunk
            embedding_vector = embeddings.embed_query(chunk.page_content) if embeddings else None
            
            doc_chunk = DocumentChunk(
                document_id=doc.id,
                text=chunk.page_content,
                page_number=page_num,
                embedding=embedding_vector
            )
            db.add(doc_chunk)

        doc.status = "INDEXED"
        db.commit()
        
    except Exception as e:
        doc.status = "FAILED"
        db.commit()
        print(f"Error processing document {document_id}: {e}")
    finally:
        # Clean up temp file
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)
