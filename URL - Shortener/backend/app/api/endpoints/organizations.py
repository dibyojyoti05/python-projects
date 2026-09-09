import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.user import User
from app.models.organization import OrganizationUser
from app.models.organization import Organization
from pydantic import BaseModel

router = APIRouter()

class OrgCreate(BaseModel):
    name: str

class MemberInvite(BaseModel):
    email: str
    role: str = "member" # admin, member, viewer

@router.get("/")
async def get_my_organizations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get all organizations the current user belongs to.
    """
    query = select(OrganizationUser).where(OrganizationUser.user_id == current_user.id).options(selectinload(OrganizationUser.organization))
    result = await db.execute(query)
    user_orgs = result.scalars().all()
    
    return [
        {
            "id": uo.organization.id,
            "name": uo.organization.name,
            "role": uo.role
        } for uo in user_orgs
    ]

@router.post("/")
async def create_organization(
    payload: OrgCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new organization and assign the current user as owner.
    """
    org = Organization(name=payload.name)
    db.add(org)
    await db.commit()
    await db.refresh(org)
    
    user_org = OrganizationUser(
        user_id=current_user.id,
        organization_id=org.id,
        role="owner"
    )
    db.add(user_org)
    await db.commit()
    
    return {"id": org.id, "name": org.name, "role": "owner"}

@router.get("/{org_id}/members")
async def get_organization_members(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get members of an organization (requires access).
    """
    # Check access
    access_query = select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == org_id
    )
    result = await db.execute(access_query)
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Not a member of this organization")
        
    members_query = select(OrganizationUser).where(OrganizationUser.organization_id == org_id).options(selectinload(OrganizationUser.user))
    members_result = await db.execute(members_query)
    members = members_result.scalars().all()
    
    return [
        {
            "id": m.user.id,
            "email": m.user.email,
            "full_name": m.user.full_name,
            "role": m.role
        } for m in members
    ]

@router.post("/{org_id}/members")
async def invite_organization_member(
    org_id: uuid.UUID,
    payload: MemberInvite,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Invite and add a member to the organization.
    """
    # Verify caller is owner or admin
    access_query = select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == org_id
    )
    access_res = await db.execute(access_query)
    caller_role = access_res.scalars().first()
    if not caller_role or caller_role.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can invite members")

    # Find or create user
    user_query = select(User).where(User.email == payload.email)
    user_res = await db.execute(user_query)
    target_user = user_res.scalars().first()

    if not target_user:
        # Create user account with invited status
        from app.core import security
        import secrets
        target_user = User(
            email=payload.email,
            hashed_password=security.get_password_hash(secrets.token_urlsafe(16)),
            full_name=payload.email.split('@')[0],
            is_active=True
        )
        db.add(target_user)
        await db.commit()
        await db.refresh(target_user)

    # Check if already member
    member_check = select(OrganizationUser).where(
        OrganizationUser.organization_id == org_id,
        OrganizationUser.user_id == target_user.id
    )
    member_res = await db.execute(member_check)
    existing_member = member_res.scalars().first()

    if existing_member:
        existing_member.role = payload.role.lower()
        await db.commit()
        return {"status": "updated", "user_id": target_user.id, "email": target_user.email, "role": payload.role}

    new_member = OrganizationUser(
        user_id=target_user.id,
        organization_id=org_id,
        role=payload.role.lower()
    )
    db.add(new_member)
    await db.commit()

    return {"status": "invited", "user_id": target_user.id, "email": target_user.email, "role": payload.role}

@router.delete("/{org_id}/members/{user_id}")
async def remove_organization_member(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Remove a member from the organization.
    """
    # Verify caller is owner or admin
    access_query = select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == org_id
    )
    access_res = await db.execute(access_query)
    caller_role = access_res.scalars().first()
    if not caller_role or caller_role.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can remove members")

    # Find member to remove
    target_query = select(OrganizationUser).where(
        OrganizationUser.user_id == user_id,
        OrganizationUser.organization_id == org_id
    )
    target_res = await db.execute(target_query)
    target_member = target_res.scalars().first()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in organization")

    if target_member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the organization owner")

    await db.delete(target_member)
    await db.commit()

    return {"status": "removed"}

