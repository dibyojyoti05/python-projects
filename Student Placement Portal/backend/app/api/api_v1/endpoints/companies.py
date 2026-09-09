from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.company import Company, RecruiterProfile
from app.schemas.company import (
    CompanyCreate,
    CompanyUpdate,
    CompanyOut,
    RecruiterProfileCreate,
    RecruiterProfileOut
)

router = APIRouter()

@router.get("", response_model=List[CompanyOut], include_in_schema=False)
@router.get("/", response_model=List[CompanyOut])
async def list_companies(

    search: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db)
):
    query = select(Company)
    if search:
        query = query.where(Company.name.ilike(f"%{search}%"))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/me", response_model=Optional[RecruiterProfileOut])
async def get_my_recruiter_profile(
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(
        select(RecruiterProfile)
        .options(selectinload(RecruiterProfile.company))
        .where(RecruiterProfile.user_id == current_user.id)
    )
    recruiter = result.scalars().first()
    if not recruiter:
        # Create empty profile
        recruiter = RecruiterProfile(user_id=current_user.id)
        db.add(recruiter)
        await db.commit()
        await db.refresh(recruiter)
    return recruiter

@router.post("/setup", response_model=RecruiterProfileOut)
async def setup_company_and_profile(
    company_in: CompanyCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    # Check if company with this name exists
    result = await db.execute(select(Company).where(Company.name.ilike(company_in.name)))
    company = result.scalars().first()
    
    if not company:
        company = Company(
            name=company_in.name,
            website=company_in.website,
            industry=company_in.industry,
            description=company_in.description,
            headquarters=company_in.headquarters,
            company_size=company_in.company_size,
            is_verified=True
        )
        db.add(company)
        await db.commit()
        await db.refresh(company)

    # Find or create recruiter profile
    result = await db.execute(
        select(RecruiterProfile)
        .where(RecruiterProfile.user_id == current_user.id)
    )
    recruiter = result.scalars().first()
    if not recruiter:
        recruiter = RecruiterProfile(user_id=current_user.id, company_id=company.id)
        db.add(recruiter)
    else:
        recruiter.company_id = company.id
        
    await db.commit()
    await db.refresh(recruiter)
    
    # Reload with company
    result = await db.execute(
        select(RecruiterProfile)
        .options(selectinload(RecruiterProfile.company))
        .where(RecruiterProfile.id == recruiter.id)
    )
    return result.scalars().first()

@router.patch("/me", response_model=RecruiterProfileOut)
async def update_company_profile(
    company_update: CompanyUpdate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(
        select(RecruiterProfile)
        .options(selectinload(RecruiterProfile.company))
        .where(RecruiterProfile.user_id == current_user.id)
    )
    recruiter = result.scalars().first()
    if not recruiter or not recruiter.company_id:
        raise HTTPException(status_code=400, detail="Recruiter profile not yet linked to a company.")

    company = recruiter.company
    update_data = company_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    
    result = await db.execute(
        select(RecruiterProfile)
        .options(selectinload(RecruiterProfile.company))
        .where(RecruiterProfile.id == recruiter.id)
    )
    return result.scalars().first()
