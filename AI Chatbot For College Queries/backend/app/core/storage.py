import uuid
from typing import BinaryIO
from minio import Minio
from app.core.config import settings

client = Minio(
    settings.STORAGE_ENDPOINT,
    access_key=settings.STORAGE_ACCESS_KEY,
    secret_key=settings.STORAGE_SECRET_KEY,
    secure=False # Set to True in production with HTTPS
)

# Ensure bucket exists
found = client.bucket_exists(settings.STORAGE_BUCKET_NAME)
if not found:
    client.make_bucket(settings.STORAGE_BUCKET_NAME)

def upload_file(file_obj: BinaryIO, filename: str, content_type: str = "application/octet-stream") -> str:
    # Generate unique s3_key
    ext = filename.split(".")[-1] if "." in filename else ""
    s3_key = f"{uuid.uuid4()}.{ext}"
    
    file_obj.seek(0, 2)
    size = file_obj.tell()
    file_obj.seek(0)
    
    client.put_object(
        settings.STORAGE_BUCKET_NAME,
        s3_key,
        file_obj,
        length=size,
        content_type=content_type,
    )
    return s3_key

def get_file_url(s3_key: str) -> str:
    # Get a presigned URL (valid for 1 hour)
    return client.presigned_get_object(
        settings.STORAGE_BUCKET_NAME, 
        s3_key
    )

def delete_file(s3_key: str):
    client.remove_object(settings.STORAGE_BUCKET_NAME, s3_key)
