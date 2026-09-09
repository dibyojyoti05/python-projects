import os
import logging
from typing import Optional, Dict
from db.database import SessionLocal
from db.models import AppSetting

logger = logging.getLogger(__name__)

class SettingsService:
    """Service to load and store application settings and credentials."""

    DEFAULT_SETTINGS = {
        "THEME": "dark",
        "DEFAULT_OUTPUT_DIR": "",
        "OPENAI_API_KEY": "",
        "AWS_ACCESS_KEY_ID": "",
        "AWS_SECRET_ACCESS_KEY": "",
        "AWS_DEFAULT_REGION": "us-east-1",
        "AWS_BUCKET_NAME": ""
    }

    @classmethod
    def get_setting(cls, key: str, default: Optional[str] = None) -> str:
        """Get a setting value by key."""
        session = SessionLocal()
        try:
            item = session.query(AppSetting).filter_by(key=key).first()
            if item and item.value is not None:
                return item.value
            # Fall back to env var if set
            env_val = os.getenv(key)
            if env_val:
                return env_val
            return default if default is not None else cls.DEFAULT_SETTINGS.get(key, "")
        except Exception as e:
            logger.error(f"Error fetching setting {key}: {e}")
            return default if default is not None else cls.DEFAULT_SETTINGS.get(key, "")
        finally:
            session.close()

    @classmethod
    def set_setting(cls, key: str, value: str) -> bool:
        """Set or update a setting value."""
        session = SessionLocal()
        try:
            item = session.query(AppSetting).filter_by(key=key).first()
            if item:
                item.value = value
            else:
                item = AppSetting(key=key, value=value)
                session.add(item)
            session.commit()
            
            # If it's an environment variable like OPENAI_API_KEY or AWS, also set in os.environ
            if key in ["OPENAI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_DEFAULT_REGION"]:
                os.environ[key] = value

            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving setting {key}: {e}")
            return False
        finally:
            session.close()

    @classmethod
    def get_all_settings(cls) -> Dict[str, str]:
        """Fetch all settings as a dict."""
        settings = dict(cls.DEFAULT_SETTINGS)
        session = SessionLocal()
        try:
            items = session.query(AppSetting).all()
            for item in items:
                settings[item.key] = item.value or ""
        except Exception as e:
            logger.error(f"Error fetching all settings: {e}")
        finally:
            session.close()
        return settings
