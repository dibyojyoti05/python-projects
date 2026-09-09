import uuid
import secrets
import hashlib
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.organization import OrganizationUser
from app.models.api_key import ApiKey

router = APIRouter()

class ApiKeyCreate(BaseModel):
    name: str
    organization_id: uuid.UUID
    is_production: bool = True

def generate_api_key(prefix: str = "lf_prod_") -> tuple[str, str]:
    """Generates a raw key and its sha256 hash"""
    raw_key = prefix + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    return raw_key, key_hash

@router.get("/")
async def list_api_keys(
    organization_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    # Check access
    access = await db.execute(select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == organization_id
    ))
    if not access.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    query = select(ApiKey).where(ApiKey.organization_id == organization_id, ApiKey.is_active == True)
    result = await db.execute(query)
    keys = result.scalars().all()
    
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at
        } for k in keys
    ]

@router.post("/")
async def create_api_key(
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    # Check access (must be admin/owner for API keys conceptually)
    access = await db.execute(select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == payload.organization_id
    ))
    role_check = access.scalars().first()
    if not role_check or role_check.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Must be an Admin to create API Keys")
        
    prefix = "lf_prod_" if payload.is_production else "lf_test_"
    raw_key, key_hash = generate_api_key(prefix)
    
    new_key = ApiKey(
        name=payload.name,
        key_hash=key_hash,
        key_prefix=prefix + raw_key[len(prefix):len(prefix)+4] + "...", # Store safe prefix for UI
        organization_id=payload.organization_id,
        created_by=current_user.id
    )
    
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)
    
    return {
        "id": new_key.id,
        "name": new_key.name,
        "raw_key": raw_key # Only returned once!
    }

@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    query = select(ApiKey).where(ApiKey.id == key_id)
    result = await db.execute(query)
    api_key = result.scalars().first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="Key not found")
        
    # Check org access
    access = await db.execute(select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == api_key.organization_id
    ))
    role_check = access.scalars().first()
    if not role_check or role_check.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    api_key.is_active = False
    await db.commit()
    
    return {"status": "revoked"}
