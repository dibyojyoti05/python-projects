from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.models.book import CopyStatus
from app.schemas.catalog import Author, Publisher, Category

class BookBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    isbn10: Optional[str] = None
    isbn13: Optional[str] = None
    description: Optional[str] = None
    publication_date: Optional[date] = None
    edition: Optional[str] = None
    language: Optional[str] = "English"
    pages: Optional[int] = None
    cover_image: Optional[str] = None
    publisher_id: Optional[int] = None

class BookCreate(BookBase):
    author_ids: List[int] = []
    category_ids: List[int] = []
    initial_copies: Optional[int] = 1
    branch_id: Optional[int] = None

class BookUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    isbn10: Optional[str] = None
    isbn13: Optional[str] = None
    description: Optional[str] = None
    publication_date: Optional[date] = None
    edition: Optional[str] = None
    language: Optional[str] = None
    pages: Optional[int] = None
    cover_image: Optional[str] = None
    publisher_id: Optional[int] = None
    author_ids: Optional[List[int]] = None
    category_ids: Optional[List[int]] = None

class BookCopySimple(BaseModel):
    id: int
    book_id: int
    barcode: str
    status: CopyStatus
    condition: Optional[str] = None
    branch_id: Optional[int] = None
    shelf: Optional[str] = None
    class Config:
        from_attributes = True

class Book(BookBase):
    id: int
    authors: List[Author] = []
    publisher: Optional[Publisher] = None
    categories: List[Category] = []
    total_copies: int = 0
    available_copies: int = 0
    class Config:
        from_attributes = True

class BookDetail(Book):
    copies: List[BookCopySimple] = []
    class Config:
        from_attributes = True

class BookCopyBase(BaseModel):
    book_id: int
    barcode: str
    status: CopyStatus = CopyStatus.AVAILABLE
    condition: Optional[str] = None
    branch_id: Optional[int] = None
    shelf: Optional[str] = None

class BookCopyCreate(BookCopyBase):
    pass

class BookCopy(BookCopyBase):
    id: int
    book: BookBase
    class Config:
        from_attributes = True
