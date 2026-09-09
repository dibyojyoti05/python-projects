from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class WeatherAlertRule(Base):
    __tablename__ = "weather_alert_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    city_name: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    condition_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'rain', 'temp_high', 'temp_low', 'wind'
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
