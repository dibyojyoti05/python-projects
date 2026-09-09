from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.alert import WeatherAlertRule
from app.schemas.weather import AlertRuleCreate, AlertRuleResponse, TriggeredAlert
from app.providers.base import WeatherProvider
from app.services.weather_service import get_weather_provider

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/", response_model=List[AlertRuleResponse])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherAlertRule).order_by(WeatherAlertRule.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=AlertRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(alert_in: AlertRuleCreate, db: AsyncSession = Depends(get_db)):
    new_alert = WeatherAlertRule(
        city_name=alert_in.city_name,
        latitude=alert_in.latitude,
        longitude=alert_in.longitude,
        condition_type=alert_in.condition_type,
        threshold=alert_in.threshold,
        is_active=True
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return new_alert

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherAlertRule).where(WeatherAlertRule.id == alert_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    await db.delete(rule)
    await db.commit()
    return None

@router.get("/check", response_model=List[TriggeredAlert])
async def check_alerts(
    db: AsyncSession = Depends(get_db),
    provider: WeatherProvider = Depends(get_weather_provider)
):
    result = await db.execute(select(WeatherAlertRule).where(WeatherAlertRule.is_active == True))
    rules = result.scalars().all()
    
    triggered: List[TriggeredAlert] = []
    
    for rule in rules:
        try:
            current = await provider.get_current_weather(rule.latitude, rule.longitude, units="metric")
            daily = await provider.get_daily_forecast(rule.latitude, rule.longitude, units="metric")
            
            val = 0.0
            is_triggered = False
            msg = ""
            
            if rule.condition_type == "rain":
                # Check max precipitation probability today
                val = daily.days[0].precipitation_probability if daily.days else 0.0
                if val >= rule.threshold:
                    is_triggered = True
                    msg = f"Rain probability in {rule.city_name} is {int(val)}% (threshold: {int(rule.threshold)}%). Take an umbrella!"
            elif rule.condition_type == "temp_high":
                val = current.temperature
                if val >= rule.threshold:
                    is_triggered = True
                    msg = f"High temperature alert in {rule.city_name}: {val:.1f}°C exceeded {rule.threshold:.1f}°C."
            elif rule.condition_type == "temp_low":
                val = current.temperature
                if val <= rule.threshold:
                    is_triggered = True
                    msg = f"Cold temperature alert in {rule.city_name}: {val:.1f}°C dropped below {rule.threshold:.1f}°C."
            elif rule.condition_type == "wind":
                val = current.wind_speed
                if val >= rule.threshold:
                    is_triggered = True
                    msg = f"High wind alert in {rule.city_name}: {val:.1f} km/h (threshold: {rule.threshold:.1f} km/h)."
            
            if is_triggered:
                triggered.append(
                    TriggeredAlert(
                        rule_id=rule.id,
                        city_name=rule.city_name,
                        condition_type=rule.condition_type,
                        threshold=rule.threshold,
                        current_value=val,
                        message=msg
                    )
                )
        except Exception:
            continue
            
    return triggered
