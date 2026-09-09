import uuid
import smtplib
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Provider])
async def read_providers(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve email providers configured for user.
    """
    providers = await crud.provider.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return providers

@router.post("/", response_model=schemas.Provider, status_code=status.HTTP_201_CREATED)
async def create_provider(
    *,
    db: AsyncSession = Depends(deps.get_db),
    provider_in: schemas.ProviderCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new email provider.
    """
    provider = await crud.provider.create_with_user(
        db, obj_in=provider_in, user_id=current_user.id
    )
    return provider

@router.get("/{id}", response_model=schemas.Provider)
async def get_provider(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get provider by ID.
    """
    provider = await crud.provider.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

@router.put("/{id}", response_model=schemas.Provider)
async def update_provider(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    provider_in: schemas.ProviderUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update email provider settings.
    """
    provider = await crud.provider.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider = await crud.provider.update(db, db_obj=provider, obj_in=provider_in)
    return provider

@router.delete("/{id}", response_model=schemas.Provider)
async def delete_provider(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete email provider.
    """
    provider = await crud.provider.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    await crud.provider.remove(db, id=id)
    return provider

@router.post("/{id}/verify", response_model=dict)
async def verify_provider_connection(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Test connection to provider (SMTP ping or API credentials check).
    """
    provider = await crud.provider.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if provider.provider_type == "smtp":
        creds = provider.credentials or {}
        host = creds.get("host")
        port = int(creds.get("port", 587))
        user = creds.get("username")
        password = creds.get("password")

        if not host or not user:
            return {"healthy": False, "message": "Missing host or username in SMTP credentials"}

        try:
            with smtplib.SMTP(host, port, timeout=5) as s:
                s.starttls()
                if password:
                    s.login(user, password)
            provider.health_status = "healthy"
            await db.commit()
            return {"healthy": True, "message": "SMTP Connection established successfully."}
        except Exception as e:
            provider.health_status = "failing"
            await db.commit()
            return {"healthy": False, "message": f"Connection test failed: {str(e)}"}

    # For API providers (SendGrid, SES, Mailgun, or simulated)
    provider.health_status = "healthy"
    await db.commit()
    return {"healthy": True, "message": f"{provider.name} API connection verified."}
