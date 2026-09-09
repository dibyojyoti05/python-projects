from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.api import deps
from app.models.circulation import Loan, LoanStatus
from app.schemas.circulation import (
    Loan as LoanSchema, LoanCreate, LoanWithDetails, LoanReturnResponse
)
from app.models.book import Book, BookCopy, CopyStatus
from app.models.member import Member
from app.models.user import User, UserRole
from app.models.financial import Fine, FineStatus
from app.core.audit import log_audit_event

router = APIRouter()

def format_loan_details(loan: Loan) -> dict:
    now = datetime.utcnow()
    is_overdue = False
    days_overdue = 0
    if loan.status == LoanStatus.ACTIVE and loan.due_date < now:
        is_overdue = True
        days_overdue = (now - loan.due_date).days
    elif loan.status == LoanStatus.OVERDUE:
        is_overdue = True
        days_overdue = max(1, (now - loan.due_date).days)

    book = loan.copy.book if loan.copy and loan.copy.book else None
    member = loan.member if loan.member else None
    user = member.user if member and member.user else None
    issued_by = loan.issued_by if loan.issued_by else None

    return {
        "id": loan.id,
        "copy_id": loan.copy_id,
        "copy_barcode": loan.copy.barcode if loan.copy else "N/A",
        "book_id": book.id if book else 0,
        "book_title": book.title if book else "Unknown Book",
        "book_cover": book.cover_image if book else None,
        "member_id": loan.member_id,
        "member_name": user.full_name if user else f"Member #{loan.member_id}",
        "member_barcode": member.member_barcode if member else "N/A",
        "issued_by_id": loan.issued_by_id,
        "issued_by_name": issued_by.full_name if issued_by else "Staff",
        "issued_at": loan.issued_at,
        "due_date": loan.due_date,
        "returned_at": loan.returned_at,
        "renewal_count": loan.renewal_count,
        "status": loan.status,
        "is_overdue": is_overdue,
        "days_overdue": days_overdue,
        "fine_amount": float(days_overdue * 1.0) if is_overdue else 0.0
    }

@router.get("/loans", response_model=List[LoanWithDetails])
async def list_loans(
    db: AsyncSession = Depends(deps.get_db),
    status: Optional[str] = Query(None, description="Filter by status (active, returned, overdue)"),
    member_id: Optional[int] = Query(None, description="Filter by member ID"),
    overdue_only: Optional[bool] = Query(False, description="Only show overdue loans"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    stmt = (
        select(Loan)
        .options(
            selectinload(Loan.copy).selectinload(BookCopy.book),
            selectinload(Loan.member).selectinload(Member.user),
            selectinload(Loan.issued_by)
        )
        .order_by(Loan.id.desc())
    )

    if status:
        stmt = stmt.where(Loan.status == status.lower())

    if member_id:
        stmt = stmt.where(Loan.member_id == member_id)

    if overdue_only:
        now = datetime.utcnow()
        stmt = stmt.where(
            (Loan.status == LoanStatus.OVERDUE) |
            ((Loan.status == LoanStatus.ACTIVE) & (Loan.due_date < now))
        )

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    loans = result.scalars().all()

    return [format_loan_details(l) for l in loans]

@router.post("/issue", response_model=LoanWithDetails)
async def issue_book(
    *,
    db: AsyncSession = Depends(deps.get_db),
    loan_in: LoanCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.ASSISTANT]))
) -> Any:
    # 1. Check member
    result = await db.execute(
        select(Member)
        .options(selectinload(Member.user))
        .where(Member.id == loan_in.member_id)
    )
    member = result.scalars().first()
    if not member or member.status != "active":
        raise HTTPException(status_code=400, detail="Member is inactive or not found")

    # 2. Check borrowing limit
    res_loans = await db.execute(
        select(Loan).where(Loan.member_id == member.id, Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.OVERDUE]))
    )
    active_loans = res_loans.scalars().all()
    if len(active_loans) >= member.borrowing_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Member has reached their limit of {member.borrowing_limit} active loans"
        )

    # 3. Check copy
    res_copy = await db.execute(
        select(BookCopy)
        .options(selectinload(BookCopy.book))
        .where(BookCopy.id == loan_in.copy_id)
    )
    copy = res_copy.scalars().first()
    if not copy:
        raise HTTPException(status_code=404, detail="Book copy not found")
    if copy.status != CopyStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Copy is currently {copy.status.value}")

    # 4. Create Loan
    due_days = loan_in.due_days or 14
    due_date = datetime.utcnow() + timedelta(days=due_days)

    loan = Loan(
        copy_id=copy.id,
        member_id=member.id,
        issued_by_id=current_user.id,
        issued_at=datetime.utcnow(),
        due_date=due_date,
        renewal_count=0,
        status=LoanStatus.ACTIVE
    )
    copy.status = CopyStatus.ISSUED

    db.add(loan)
    db.add(copy)
    await db.flush()

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="BOOK_ISSUE",
        resource_type="loan",
        resource_id=loan.id,
        details=f"Issued copy {copy.barcode} ('{copy.book.title}') to {member.user.full_name}"
    )

    await db.commit()

    # Load relations
    res = await db.execute(
        select(Loan)
        .options(
            selectinload(Loan.copy).selectinload(BookCopy.book),
            selectinload(Loan.member).selectinload(Member.user),
            selectinload(Loan.issued_by)
        )
        .where(Loan.id == loan.id)
    )
    refreshed = res.scalars().first()
    return format_loan_details(refreshed)

@router.post("/{loan_id}/return", response_model=LoanReturnResponse)
async def return_book(
    *,
    db: AsyncSession = Depends(deps.get_db),
    loan_id: int,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.ASSISTANT]))
) -> Any:
    result = await db.execute(
        select(Loan)
        .options(
            selectinload(Loan.copy).selectinload(BookCopy.book),
            selectinload(Loan.member).selectinload(Member.user)
        )
        .where(Loan.id == loan_id)
    )
    loan = result.scalars().first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan record not found")
    if loan.status == LoanStatus.RETURNED:
        raise HTTPException(status_code=400, detail="Loan has already been returned")

    now = datetime.utcnow()
    loan.status = LoanStatus.RETURNED
    loan.returned_at = now

    # Make copy available again
    if loan.copy:
        loan.copy.status = CopyStatus.AVAILABLE
        db.add(loan.copy)

    # Check for overdue fine
    is_overdue = False
    days_overdue = 0
    fine_generated = None
    if loan.due_date < now:
        is_overdue = True
        days_overdue = (now - loan.due_date).days
        if days_overdue > 0:
            fine_rate = 1.0  # $1.00 per day
            fine_amount = float(days_overdue * fine_rate)
            fine = Fine(
                member_id=loan.member_id,
                loan_id=loan.id,
                amount=fine_amount,
                paid_amount=0.0,
                status=FineStatus.UNPAID,
                reason=f"Overdue return by {days_overdue} days for '{loan.copy.book.title if loan.copy and loan.copy.book else 'Book'}'"
            )
            db.add(fine)
            fine_generated = fine_amount

    db.add(loan)

    book_title = loan.copy.book.title if loan.copy and loan.copy.book else "Book"
    member_name = loan.member.user.full_name if loan.member and loan.member.user else "Member"

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="BOOK_RETURN",
        resource_type="loan",
        resource_id=loan.id,
        details=f"Returned '{book_title}' from {member_name}. Overdue: {is_overdue} ({days_overdue} days)"
    )

    await db.commit()

    return LoanReturnResponse(
        loan_id=loan.id,
        status="returned",
        returned_at=now,
        is_overdue=is_overdue,
        days_overdue=days_overdue,
        fine_generated=fine_generated,
        message=f"Book returned successfully! {'A fine of $' + str(fine_generated) + ' was generated.' if fine_generated else 'No fines assessed.'}"
    )

@router.post("/renew/{loan_id}", response_model=LoanWithDetails)
async def renew_loan(
    *,
    db: AsyncSession = Depends(deps.get_db),
    loan_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Loan)
        .options(
            selectinload(Loan.copy).selectinload(BookCopy.book),
            selectinload(Loan.member).selectinload(Member.user),
            selectinload(Loan.issued_by)
        )
        .where(Loan.id == loan_id)
    )
    loan = result.scalars().first()
    if not loan or loan.status not in [LoanStatus.ACTIVE, LoanStatus.OVERDUE]:
        raise HTTPException(status_code=404, detail="Active loan not found")

    if loan.renewal_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum renewal limit (3) reached for this loan")

    loan.due_date = loan.due_date + timedelta(days=14)
    loan.renewal_count += 1
    loan.status = LoanStatus.ACTIVE
    db.add(loan)

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="LOAN_RENEW",
        resource_type="loan",
        resource_id=loan.id,
        details=f"Renewed loan #{loan.id}. New due date: {loan.due_date.strftime('%Y-%m-%d')}"
    )

    await db.commit()
    await db.refresh(loan)
    return format_loan_details(loan)
