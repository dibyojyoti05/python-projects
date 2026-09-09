import os
import uuid
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, filename: str, content: bytes) -> str:
        """
        Saves file to storage and returns an accessible local URL/path.
        """
        extension = os.path.splitext(filename)[1]
        unique_name = f"{uuid.uuid4().hex}{extension}"
        file_path = os.path.join(self.upload_dir, unique_name)

        with open(file_path, "wb") as f:
            f.write(content)

        # MinIO attempt if configured
        try:
            from minio import Minio
            client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=False
            )
            found = client.bucket_exists(settings.MINIO_BUCKET)
            if not found:
                client.make_bucket(settings.MINIO_BUCKET)
            from io import BytesIO
            client.put_object(
                settings.MINIO_BUCKET,
                unique_name,
                BytesIO(content),
                length=len(content),
            )
            logger.info(f"File {unique_name} successfully uploaded to MinIO bucket {settings.MINIO_BUCKET}")
        except Exception as e:
            # Fallback to local storage
            logger.debug(f"MinIO storage unavailable ({e}), using local upload directory")

        return f"/api/v1/media/{unique_name}"

storage_service = StorageService()
