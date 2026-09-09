import boto3
import os
from botocore.exceptions import NoCredentialsError

class CloudEngine:
    """Engine for uploading and downloading PDFs to/from AWS S3."""

    @staticmethod
    def upload_to_s3(file_path: str, bucket_name: str, object_name: str = None) -> bool:
        """Upload a file to an S3 bucket."""
        if not os.path.exists(file_path):
            raise FileNotFoundError("Input file not found.")

        if object_name is None:
            object_name = os.path.basename(file_path)

        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        )
        
        try:
            s3_client.upload_file(file_path, bucket_name, object_name)
            return True
        except NoCredentialsError:
            raise RuntimeError("AWS Credentials not available.")
        except Exception as e:
            raise RuntimeError(f"S3 Upload failed: {e}")

    @staticmethod
    def download_from_s3(bucket_name: str, object_name: str, file_path: str) -> bool:
        """Download a file from an S3 bucket."""
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        )
        
        try:
            s3_client.download_file(bucket_name, object_name, file_path)
            return True
        except NoCredentialsError:
            raise RuntimeError("AWS Credentials not available.")
        except Exception as e:
            raise RuntimeError(f"S3 Download failed: {e}")
