from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.future import select
from sqlalchemy import func
import hashlib

from app.core.config import settings
from app.models.user import User
from app.models.api_key import ApiKey
from pydantic import BaseModel

engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False
)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

class TokenPayload(BaseModel):
    sub: Optional[str] = None

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = await db.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_api_key(
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(api_key_header)
) -> ApiKey:
    """
    Validates an incoming X-API-Key header against the database.
    Can be used by endpoints serving programmatic requests.
    """
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
        
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    query = select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
    result = await db.execute(query)
    valid_key = result.scalars().first()
    
    if not valid_key:
        raise HTTPException(status_code=401, detail="Invalid API Key")
        
    # Update last used timestamp
    valid_key.last_used_at = func.now()
    await db.commit()
    
    return valid_key

optional_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

async def get_current_user_or_api_key_user(
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(api_key_header),
    token: str = Depends(optional_oauth2)
) -> User:
    """
    Allows authentication either via Bearer JWT or programmatic X-API-Key header.
    """
    if api_key:
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        query = select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
        result = await db.execute(query)
        valid_key = result.scalars().first()
        if valid_key:
            valid_key.last_used_at = func.now()
            await db.commit()
            user = await db.get(User, valid_key.created_by)
            if user:
                return user
        raise HTTPException(status_code=401, detail="Invalid API Key")

    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            token_data = TokenPayload(**payload)
            user = await db.get(User, token_data.sub)
            if user and user.is_active:
                return user
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide a Bearer token or X-API-Key header."
    )

