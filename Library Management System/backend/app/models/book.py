from sqlalchemy import Column, Integer, String, Date, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

# Association tables for many-to-many relationships
book_authors = Table(
    'book_authors',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id', ondelete="CASCADE"), primary_key=True),
    Column('author_id', Integer, ForeignKey('authors.id', ondelete="CASCADE"), primary_key=True)
)

book_categories = Table(
    'book_categories',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id', ondelete="CASCADE"), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id', ondelete="CASCADE"), primary_key=True)
)

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    subtitle = Column(String)
    isbn10 = Column(String(10), unique=True, index=True)
    isbn13 = Column(String(13), unique=True, index=True)
    description = Column(String)
    publisher_id = Column(Integer, ForeignKey("publishers.id"))
    publication_date = Column(Date)
    edition = Column(String)
    language = Column(String)
    pages = Column(Integer)
    cover_image = Column(String)

    # Relationships
    publisher = relationship("Publisher")
    authors = relationship("Author", secondary=book_authors, backref="books")
    categories = relationship("Category", secondary=book_categories, backref="books")
    copies = relationship("BookCopy", back_populates="book", cascade="all, delete-orphan")

class CopyStatus(str, enum.Enum):
    AVAILABLE = "available"
    ISSUED = "issued"
    LOST = "lost"
    DAMAGED = "damaged"
    RESERVED = "reserved"

class BookCopy(Base):
    __tablename__ = "book_copies"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    barcode = Column(String, unique=True, index=True, nullable=False)
    status = Column(Enum(CopyStatus), default=CopyStatus.AVAILABLE, nullable=False)
    condition = Column(String)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    shelf = Column(String)

    # Relationships
    book = relationship("Book", back_populates="copies")
    branch = relationship("Branch")
