from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_
from datetime import datetime

from app.api import deps
from app.models.book import Book, BookCopy, CopyStatus
from app.models.author import Author
from app.models.circulation import Loan, LoanStatus
from app.models.branch import Branch
from app.models.user import User

router = APIRouter()

class AIQuery(BaseModel):
    query: str

class AIResponse(BaseModel):
    answer: str
    suggestions: list[str] = []

@router.post("/ask", response_model=AIResponse)
async def ask_ai(
    *,
    db: AsyncSession = Depends(deps.get_db),
    query_in: AIQuery,
    current_user: User = Depends(deps.get_current_active_user)
) -> AIResponse:
    q = query_in.query.lower().strip()

    # 1. Check for book search / availability questions
    # E.g. "Do you have clean code?", "search 1984", "who wrote refactoring"
    words = [w for w in q.replace("?", "").replace(",", "").split() if len(w) > 2]
    
    # Try finding matching books
    if any(keyword in q for keyword in ["have", "find", "search", "book", "author", "recommend", "available", "copies", "title", "read"]):
        for word in words:
            if word in ["who", "what", "where", "have", "book", "books", "read", "the", "for", "and", "show"]:
                continue
            res = await db.execute(
                select(Book)
                .options(selectinload(Book.copies), selectinload(Book.authors))
                .where(
                    or_(
                        Book.title.ilike(f"%{word}%"),
                        Book.authors.any(Author.name.ilike(f"%{word}%"))
                    )
                )
            )
            matched_books = res.scalars().all()
            if matched_books:
                book = matched_books[0]
                total = len(book.copies)
                available = sum(1 for c in book.copies if c.status == CopyStatus.AVAILABLE)
                authors_str = ", ".join(a.name for a in book.authors)
                return AIResponse(
                    answer=f"Yes! We have **{book.title}** by {authors_str}. Currently, **{available} of {total}** physical copies are available for checkout in our branches. ({book.description[:140]}...)",
                    suggestions=[f"Show {book.title} details", "Check another book", "View circulation status"]
                )

    # 2. Check for overdue / loans statistics
    if "overdue" in q or "due" in q:
        now = datetime.utcnow()
        overdue_count = await db.scalar(
            select(func.count(Loan.id)).where(
                (Loan.status == LoanStatus.OVERDUE) |
                ((Loan.status == LoanStatus.ACTIVE) & (Loan.due_date < now))
            )
        ) or 0
        return AIResponse(
            answer=f"Currently, there are **{overdue_count} overdue loans** flagged in the library system. Our daily overdue fine rate is **$1.00 per day** past the return due date.",
            suggestions=["View overdue loans in Circulation", "Check Fines and Payments", "Renew active loans"]
        )

    # 3. Check for branch / location questions
    if "branch" in q or "where" in q or "location" in q or "address" in q:
        branches_res = await db.execute(select(Branch))
        branches = branches_res.scalars().all()
        branch_lines = "\n".join([f"- **{b.name}**: {b.address} (Tel: {b.contact_phone})" for b in branches])
        return AIResponse(
            answer=f"Our library system operates across {len(branches)} convenient branches:\n\n{branch_lines}",
            suggestions=["View Central Main Library", "Check Catalog", "Membership Rules"]
        )

    # 4. Check for borrowing rules & limits
    if "rule" in q or "limit" in q or "policy" in q or "how many" in q or "duration" in q:
        return AIResponse(
            answer="**Library Borrowing Guidelines:**\n- **Faculty/Staff**: Up to 10 books at a time for 30 days.\n- **Students**: Up to 5 books at a time for 14 days.\n- **Community Members**: Up to 3 books at a time for 14 days.\n- **Renewals**: Allowed up to 3 times per loan if no holds are reserved.\n- **Late Fines**: $1.00 per day after grace period.",
            suggestions=["View my active loans", "Browse Catalog", "Ask another question"]
        )

    # 5. General catalog summary
    books_count = await db.scalar(select(func.count(Book.id))) or 0
    copies_count = await db.scalar(select(func.count(BookCopy.id))) or 0
    return AIResponse(
        answer=f"Hello **{current_user.full_name}**! I am your Library AI Assistant. We currently curate **{books_count} unique titles** with **{copies_count} physical copies** in the collection. You can ask me to search titles, verify physical copy availability, report overdue loan stats, or explain borrowing rules.",
        suggestions=["Do you have Clean Code?", "Are there overdue books?", "Show library branches", "What is the borrowing limit?"]
    )
