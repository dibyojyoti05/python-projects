from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.api import deps
from app.models.financial import Reservation, Fine, Payment, ReservationStatus, FineStatus
from app.schemas.financial import (
    Reservation as ReservationSchema, ReservationCreate,
    Fine as FineSchema, FineCreate,
    Payment as PaymentSchema, PaymentCreate
)
from app.models.user import User, UserRole
from app.models.member import Member
from app.models.book import Book
from app.models.circulation import Loan
from app.core.audit import log_audit_event

router = APIRouter()

def format_fine(fine: Fine) -> dict:
    member_name = fine.member.user.full_name if fine.member and fine.member.user else f"Member #{fine.member_id}"
    member_barcode = fine.member.member_barcode if fine.member else "N/A"
    book_title = fine.loan.copy.book.title if fine.loan and fine.loan.copy and fine.loan.copy.book else "General Fine"

    return {
        "id": fine.id,
        "member_id": fine.member_id,
        "loan_id": fine.loan_id,
        "amount": fine.amount,
        "paid_amount": fine.paid_amount,
        "status": fine.status,
        "reason": fine.reason,
        "created_at": fine.created_at,
        "member_name": member_name,
        "member_barcode": member_barcode,
        "book_title": book_title
    }

@router.get("/fines", response_model=List[FineSchema])
async def list_fines(
    db: AsyncSession = Depends(deps.get_db),
    status: Optional[str] = Query(None, description="Filter by fine status (unpaid, partial, paid, waived)"),
    member_id: Optional[int] = Query(None, description="Filter by member ID"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    stmt = (
        select(Fine)
        .options(
            selectinload(Fine.member).selectinload(Member.user),
            selectinload(Fine.loan)
        )
        .order_by(Fine.id.desc())
    )

    if status:
        stmt = stmt.where(Fine.status == status.lower())
    if member_id:
        stmt = stmt.where(Fine.member_id == member_id)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    fines = result.scalars().all()
    return [format_fine(f) for f in fines]

@router.post("/fines", response_model=FineSchema)
async def create_fine(
    *,
    db: AsyncSession = Depends(deps.get_db),
    fine_in: FineCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    fine = Fine(
        member_id=fine_in.member_id,
        loan_id=fine_in.loan_id,
        amount=fine_in.amount,
        paid_amount=0.0,
        status=FineStatus.UNPAID,
        reason=fine_in.reason or "Manual administrative fine",
        created_at=datetime.utcnow()
    )
    db.add(fine)
    await db.flush()

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="FINE_CREATE",
        resource_type="fine",
        resource_id=fine.id,
        details=f"Created ${fine.amount:.2f} fine for member #{fine.member_id}"
    )

    await db.commit()
    await db.refresh(fine)

    res = await db.execute(
        select(Fine).options(selectinload(Fine.member).selectinload(Member.user)).where(Fine.id == fine.id)
    )
    return format_fine(res.scalars().first())

@router.post("/payments", response_model=PaymentSchema)
async def process_payment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    payment_in: PaymentCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.ASSISTANT]))
) -> Any:
    result = await db.execute(
        select(Fine).options(selectinload(Fine.member).selectinload(Member.user)).where(Fine.id == payment_in.fine_id)
    )
    fine = result.scalars().first()
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")

    remaining_due = fine.amount - fine.paid_amount
    if payment_in.amount > remaining_due:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (${payment_in.amount:.2f}) exceeds outstanding fine balance (${remaining_due:.2f})"
        )

    now = datetime.utcnow()
    payment = Payment(
        fine_id=payment_in.fine_id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        paid_at=now,
        processed_by_id=current_user.id
    )
    db.add(payment)

    fine.paid_amount += payment_in.amount
    if fine.paid_amount >= fine.amount:
        fine.status = FineStatus.PAID
    elif fine.paid_amount > 0:
        fine.status = FineStatus.PARTIAL

    db.add(fine)
    await db.flush()

    member_name = fine.member.user.full_name if fine.member and fine.member.user else f"Member #{fine.member_id}"

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="FINE_PAYMENT",
        resource_type="payment",
        resource_id=payment.id,
        details=f"Processed payment of ${payment.amount:.2f} via {payment.payment_method} for {member_name}"
    )

    await db.commit()
    await db.refresh(payment)

    return {
        "id": payment.id,
        "fine_id": payment.fine_id,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "paid_at": payment.paid_at,
        "processed_by_id": payment.processed_by_id,
        "processed_by_name": current_user.full_name,
        "member_name": member_name,
        "fine_amount": fine.amount
    }

@router.get("/payments", response_model=List[PaymentSchema])
async def list_payments(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.ASSISTANT]))
) -> Any:
    result = await db.execute(
        select(Payment)
        .options(
            selectinload(Payment.processed_by),
            selectinload(Payment.fine).selectinload(Fine.member).selectinload(Member.user)
        )
        .order_by(Payment.id.desc())
        .offset(skip).limit(limit)
    )
    payments = result.scalars().all()
    output = []
    for p in payments:
        member_name = (
            p.fine.member.user.full_name
            if p.fine and p.fine.member and p.fine.member.user
            else "Member"
        )
        output.append({
            "id": p.id,
            "fine_id": p.fine_id,
            "amount": p.amount,
            "payment_method": p.payment_method,
            "paid_at": p.paid_at,
            "processed_by_id": p.processed_by_id,
            "processed_by_name": p.processed_by.full_name if p.processed_by else "Staff",
            "member_name": member_name,
            "fine_amount": p.fine.amount if p.fine else p.amount
        })
    return output

@router.get("/reservations", response_model=List[ReservationSchema])
async def list_reservations(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.book),
            selectinload(Reservation.member).selectinload(Member.user)
        )
        .order_by(Reservation.id.desc())
        .offset(skip).limit(limit)
    )
    reservations = result.scalars().all()
    output = []
    for r in reservations:
        output.append({
            "id": r.id,
            "book_id": r.book_id,
            "member_id": r.member_id,
            "created_at": r.created_at,
            "status": r.status,
            "fulfilled_at": r.fulfilled_at,
            "expiry_date": r.expiry_date,
            "book_title": r.book.title if r.book else "Book",
            "member_name": r.member.user.full_name if r.member and r.member.user else "Member"
        })
    return output

@router.post("/reservations", response_model=ReservationSchema)
async def create_reservation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    reservation_in: ReservationCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    res = await db.execute(select(Book).where(Book.id == reservation_in.book_id))
    book = res.scalars().first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    reservation = Reservation(
        book_id=reservation_in.book_id,
        member_id=reservation_in.member_id,
        created_at=datetime.utcnow(),
        status=ReservationStatus.PENDING
    )
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)

    res_final = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.book),
            selectinload(Reservation.member).selectinload(Member.user)
        )
        .where(Reservation.id == reservation.id)
    )
    r = res_final.scalars().first()
    return {
        "id": r.id,
        "book_id": r.book_id,
        "member_id": r.member_id,
        "created_at": r.created_at,
        "status": r.status,
        "fulfilled_at": r.fulfilled_at,
        "expiry_date": r.expiry_date,
        "book_title": r.book.title if r.book else "Book",
        "member_name": r.member.user.full_name if r.member and r.member.user else "Member"
    }
