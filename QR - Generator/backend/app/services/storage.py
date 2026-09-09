import boto3
from botocore.client import Config
from app.core.config import settings
import uuid

BUCKET_NAME = "qr-assets"

def get_s3_client():
    try:
        return boto3.client(
            's3',
            endpoint_url='http://localhost:9000',
            aws_access_key_id='qr_minio_user',
            aws_secret_access_key='qr_minio_password',
            config=Config(connect_timeout=0.2, read_timeout=0.2, retries={'max_attempts': 0})
        )
    except Exception:
        return None

def upload_qr_image(image_bytes: bytes, mime_type: str, qr_id: uuid.UUID) -> str:
    """
    Attempts to upload QR image to S3/MinIO.
    Returns the endpoint URL /api/v1/qr/{qr_id}/image for reliable client consumption.
    """
    client = get_s3_client()
    if client:
        try:
            try:
                client.head_bucket(Bucket=BUCKET_NAME)
            except Exception:
                client.create_bucket(Bucket=BUCKET_NAME)
                
            ext = "png" if "png" in mime_type else "svg"
            object_name = f"{qr_id}.{ext}"
            client.put_object(
                Bucket=BUCKET_NAME,
                Key=object_name,
                Body=image_bytes,
                ContentType=mime_type
            )
        except Exception:
            # MinIO not running, gracefully fallback
            pass
            
    # Always return our direct high-performance API endpoint
    return f"/api/v1/qr/{qr_id}/image"
