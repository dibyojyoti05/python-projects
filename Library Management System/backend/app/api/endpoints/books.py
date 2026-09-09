from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, func

from app.api import deps
from app.models.book import Book, BookCopy, CopyStatus
from app.models.author import Author
from app.models.category import Category
from app.schemas.book import (
    Book as BookSchema, BookCreate, BookUpdate, BookDetail,
    BookCopy as BookCopySchema, BookCopyCreate, BookCopySimple
)
from app.models.user import User, UserRole
from app.core.audit import log_audit_event

router = APIRouter()

def enrich_book_copies_count(book: Book) -> dict:
    total = len(book.copies) if book.copies else 0
    available = sum(1 for c in book.copies if c.status == CopyStatus.AVAILABLE) if book.copies else 0
    return {
        "id": book.id,
        "title": book.title,
        "subtitle": book.subtitle,
        "isbn10": book.isbn10,
        "isbn13": book.isbn13,
        "description": book.description,
        "publisher_id": book.publisher_id,
        "publication_date": book.publication_date,
        "edition": book.edition,
        "language": book.language,
        "pages": book.pages,
        "cover_image": book.cover_image,
        "authors": book.authors,
        "categories": book.categories,
        "publisher": book.publisher,
        "total_copies": total,
        "available_copies": available
    }

@router.get("/", response_model=List[BookSchema])
async def read_books(
    db: AsyncSession = Depends(deps.get_db),
    q: Optional[str] = Query(None, description="Search query across title, ISBN, description"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    author_id: Optional[int] = Query(None, description="Filter by author ID"),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    stmt = (
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.categories),
            selectinload(Book.publisher),
            selectinload(Book.copies)
        )
    )

    if q:
        query_str = f"%{q}%"
        stmt = stmt.where(
            or_(
                Book.title.ilike(query_str),
                Book.subtitle.ilike(query_str),
                Book.isbn10.ilike(query_str),
                Book.isbn13.ilike(query_str),
                Book.description.ilike(query_str),
                Book.authors.any(Author.name.ilike(query_str))
            )
        )

    if category_id:
        stmt = stmt.where(Book.categories.any(Category.id == category_id))

    if author_id:
        stmt = stmt.where(Book.authors.any(Author.id == author_id))

    stmt = stmt.order_by(Book.id.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    books = result.scalars().all()

    return [enrich_book_copies_count(b) for b in books]

@router.post("/", response_model=BookDetail)
async def create_book(
    *,
    db: AsyncSession = Depends(deps.get_db),
    book_in: BookCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    # Fetch authors and categories
    authors = []
    if book_in.author_ids:
        result = await db.execute(select(Author).where(Author.id.in_(book_in.author_ids)))
        authors = result.scalars().all()
    
    categories = []
    if book_in.category_ids:
        result = await db.execute(select(Category).where(Category.id.in_(book_in.category_ids)))
        categories = result.scalars().all()

    book = Book(
        title=book_in.title,
        subtitle=book_in.subtitle,
        isbn10=book_in.isbn10,
        isbn13=book_in.isbn13,
        description=book_in.description,
        publisher_id=book_in.publisher_id,
        publication_date=book_in.publication_date,
        edition=book_in.edition,
        language=book_in.language,
        pages=book_in.pages,
        cover_image=book_in.cover_image or "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
        authors=authors,
        categories=categories
    )
    db.add(book)
    await db.flush()

    # Create initial physical copies if requested
    copies_count = book_in.initial_copies or 1
    branch_id = book_in.branch_id or current_user.branch_id or 1
    for i in range(1, copies_count + 1):
        barcode = f"BC-{book.id:04d}-{i:02d}"
        copy = BookCopy(
            book_id=book.id,
            barcode=barcode,
            status=CopyStatus.AVAILABLE,
            condition="New",
            branch_id=branch_id,
            shelf="Main Floor"
        )
        db.add(copy)

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="BOOK_CREATE",
        resource_type="book",
        resource_id=book.id,
        details=f"Created book '{book.title}' with {copies_count} copies"
    )

    await db.commit()

    # Load complete book
    result = await db.execute(
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.categories),
            selectinload(Book.publisher),
            selectinload(Book.copies)
        )
        .where(Book.id == book.id)
    )
    b = result.scalars().first()
    data = enrich_book_copies_count(b)
    data["copies"] = b.copies
    return data

@router.get("/{book_id}", response_model=BookDetail)
async def get_book(
    book_id: int,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    result = await db.execute(
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.categories),
            selectinload(Book.publisher),
            selectinload(Book.copies)
        )
        .where(Book.id == book_id)
    )
    book = result.scalars().first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    data = enrich_book_copies_count(book)
    data["copies"] = book.copies
    return data

@router.put("/{book_id}", response_model=BookDetail)
async def update_book(
    *,
    db: AsyncSession = Depends(deps.get_db),
    book_id: int,
    book_in: BookUpdate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    result = await db.execute(
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.categories),
            selectinload(Book.publisher),
            selectinload(Book.copies)
        )
        .where(Book.id == book_id)
    )
    book = result.scalars().first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = book_in.model_dump(exclude_unset=True)
    if "author_ids" in update_data:
        author_ids = update_data.pop("author_ids")
        if author_ids is not None:
            a_res = await db.execute(select(Author).where(Author.id.in_(author_ids)))
            book.authors = a_res.scalars().all()

    if "category_ids" in update_data:
        cat_ids = update_data.pop("category_ids")
        if cat_ids is not None:
            c_res = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
            book.categories = c_res.scalars().all()

    for field, value in update_data.items():
        setattr(book, field, value)

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="BOOK_UPDATE",
        resource_type="book",
        resource_id=book.id,
        details=f"Updated details for '{book.title}'"
    )

    await db.commit()
    await db.refresh(book)

    data = enrich_book_copies_count(book)
    data["copies"] = book.copies
    return data

@router.delete("/{book_id}")
async def delete_book(
    book_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.check_role([UserRole.ADMIN]))
) -> Any:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalars().first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    title = book.title
    await db.delete(book)
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="BOOK_DELETE",
        resource_type="book",
        resource_id=book_id,
        details=f"Deleted book '{title}'"
    )
    await db.commit()
    return {"status": "success", "message": f"Book '{title}' deleted successfully"}

@router.get("/{book_id}/copies", response_model=List[BookCopySimple])
async def get_book_copies(
    book_id: int,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    result = await db.execute(select(BookCopy).where(BookCopy.id == book_id))
    return result.scalars().all()

@router.post("/copies", response_model=BookCopySimple)
async def create_book_copy(
    *,
    db: AsyncSession = Depends(deps.get_db),
    copy_in: BookCopyCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    copy = BookCopy(**copy_in.model_dump())
    db.add(copy)
    await db.commit()
    await db.refresh(copy)
    return copy

@router.delete("/copies/{copy_id}")
async def delete_book_copy(
    copy_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    result = await db.execute(select(BookCopy).where(BookCopy.id == copy_id))
    copy = result.scalars().first()
    if not copy:
        raise HTTPException(status_code=404, detail="Copy not found")

    barcode = copy.barcode
    await db.delete(copy)
    await db.commit()
    return {"status": "success", "message": f"Copy '{barcode}' deleted successfully"}
