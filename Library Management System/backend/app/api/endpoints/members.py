from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, func
from datetime import date, timedelta

from app.api import deps
from app.models.member import Member, MembershipType
from app.models.user import User, UserRole
from app.models.circulation import Loan, LoanStatus
from app.models.financial import Fine, FineStatus
from app.schemas.member import (
    Member as MemberSchema, MemberCreate, MemberQuickCreate, MemberUpdate
)
from app.core.security import get_password_hash
from app.core.audit import log_audit_event

router = APIRouter()

def enrich_member_stats(member: Member, active_count: int = 0, unpaid_fines: float = 0.0) -> dict:
    return {
        "id": member.id,
        "user_id": member.user_id,
        "member_barcode": member.member_barcode,
        "membership_type": member.membership_type,
        "registration_date": member.registration_date,
        "expiry_date": member.expiry_date,
        "status": member.status,
        "borrowing_limit": member.borrowing_limit,
        "phone": member.phone,
        "address": member.address,
        "user": member.user,
        "active_loans_count": active_count,
        "unpaid_fines_amount": unpaid_fines
    }

@router.get("/", response_model=List[MemberSchema])
async def read_members(
    db: AsyncSession = Depends(deps.get_db),
    q: Optional[str] = Query(None, description="Search by name, email, barcode, phone"),
    status: Optional[str] = Query(None, description="Filter by status (active, suspended, expired)"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.ASSISTANT]))
) -> Any:
    stmt = (
        select(Member)
        .join(Member.user)
        .options(selectinload(Member.user), selectinload(Member.loans))
    )

    if q:
        query_str = f"%{q}%"
        stmt = stmt.where(
            or_(
                User.full_name.ilike(query_str),
                User.email.ilike(query_str),
                Member.member_barcode.ilike(query_str),
                Member.phone.ilike(query_str)
            )
        )

    if status:
        stmt = stmt.where(Member.status == status.lower())

    stmt = stmt.order_by(Member.id.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    members = result.scalars().all()

    output = []
    for m in members:
        # Count active/overdue loans
        active_loans = sum(1 for l in m.loans if l.status in [LoanStatus.ACTIVE, LoanStatus.OVERDUE])
        
        # Count unpaid fines
        fines_res = await db.execute(
            select(Fine).where(Fine.member_id == m.id, Fine.status.in_([FineStatus.UNPAID, FineStatus.PARTIAL]))
        )
        fines = fines_res.scalars().all()
        unpaid = sum(f.amount - f.paid_amount for f in fines)

        output.append(enrich_member_stats(m, active_count=active_loans, unpaid_fines=unpaid))

    return output

@router.post("/quick", response_model=MemberSchema)
async def create_member_quick(
    *,
    db: AsyncSession = Depends(deps.get_db),
    member_in: MemberQuickCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    # 1. Check if email exists
    res = await db.execute(select(User).where(User.email == member_in.email))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # 2. Create User
    user = User(
        email=member_in.email,
        hashed_password=get_password_hash(member_in.password),
        full_name=member_in.full_name,
        role=UserRole.MEMBER,
        branch_id=member_in.branch_id or current_user.branch_id or 1,
        is_active=True
    )
    db.add(user)
    await db.flush()

    # 3. Create Member Profile
    today = date.today()
    barcode_num = f"LIB-MEM-{1000 + user.id}"
    member = Member(
        user_id=user.id,
        member_barcode=barcode_num,
        membership_type=member_in.membership_type,
        registration_date=today,
        expiry_date=today + timedelta(days=365),
        status="active",
        borrowing_limit=member_in.borrowing_limit,
        phone=member_in.phone,
        address=member_in.address
    )
    db.add(member)
    await db.flush()

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="MEMBER_REGISTER",
        resource_type="member",
        resource_id=member.id,
        details=f"Registered member '{user.full_name}' ({user.email}) barcode: {barcode_num}"
    )

    await db.commit()

    res_final = await db.execute(
        select(Member).options(selectinload(Member.user)).where(Member.id == member.id)
    )
    created = res_final.scalars().first()
    return enrich_member_stats(created, 0, 0.0)

@router.get("/{member_id}", response_model=MemberSchema)
async def get_member(
    member_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Member)
        .options(selectinload(Member.user), selectinload(Member.loans))
        .where(Member.id == member_id)
    )
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    active_loans = sum(1 for l in member.loans if l.status in [LoanStatus.ACTIVE, LoanStatus.OVERDUE])
    fines_res = await db.execute(
        select(Fine).where(Fine.member_id == member.id, Fine.status.in_([FineStatus.UNPAID, FineStatus.PARTIAL]))
    )
    fines = fines_res.scalars().all()
    unpaid = sum(f.amount - f.paid_amount for f in fines)

    return enrich_member_stats(member, active_loans, unpaid)

@router.put("/{member_id}", response_model=MemberSchema)
async def update_member(
    *,
    db: AsyncSession = Depends(deps.get_db),
    member_id: int,
    member_in: MemberUpdate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    result = await db.execute(
        select(Member).options(selectinload(Member.user)).where(Member.id == member_id)
    )
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    update_dict = member_in.model_dump(exclude_unset=True)
    if "full_name" in update_dict and member.user:
        member.user.full_name = update_dict.pop("full_name")

    for field, value in update_dict.items():
        setattr(member, field, value)

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="MEMBER_UPDATE",
        resource_type="member",
        resource_id=member.id,
        details=f"Updated profile for '{member.user.full_name}'"
    )

    await db.commit()
    await db.refresh(member)
    return enrich_member_stats(member, 0, 0.0)

@router.delete("/{member_id}")
async def delete_member(
    member_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.check_role([UserRole.ADMIN]))
) -> Any:
    result = await db.execute(
        select(Member).options(selectinload(Member.user)).where(Member.id == member_id)
    )
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.status = "suspended"
    if member.user:
        member.user.is_active = False

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="MEMBER_DEACTIVATE",
        resource_type="member",
        resource_id=member.id,
        details=f"Deactivated member '{member.user.full_name}'"
    )
    await db.commit()
    return {"status": "success", "message": f"Member #{member_id} suspended"}
