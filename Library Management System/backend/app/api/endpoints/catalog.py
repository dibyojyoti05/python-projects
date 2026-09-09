from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.category import Category
from app.models.author import Author
from app.models.publisher import Publisher
from app.models.branch import Branch
from app.schemas.catalog import (
    Category as CategorySchema, CategoryCreate,
    Author as AuthorSchema, AuthorCreate,
    Publisher as PublisherSchema, PublisherCreate,
    Branch as BranchSchema, BranchCreate
)
from app.models.user import User, UserRole

router = APIRouter()

# Categories
@router.get("/categories", response_model=List[CategorySchema])
async def get_categories(db: AsyncSession = Depends(deps.get_db)) -> Any:
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()

@router.post("/categories", response_model=CategorySchema)
async def create_category(
    *,
    db: AsyncSession = Depends(deps.get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    category = Category(**category_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

# Authors
@router.get("/authors", response_model=List[AuthorSchema])
async def get_authors(db: AsyncSession = Depends(deps.get_db)) -> Any:
    result = await db.execute(select(Author).order_by(Author.name))
    return result.scalars().all()

@router.post("/authors", response_model=AuthorSchema)
async def create_author(
    *,
    db: AsyncSession = Depends(deps.get_db),
    author_in: AuthorCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    author = Author(**author_in.model_dump())
    db.add(author)
    await db.commit()
    await db.refresh(author)
    return author

# Publishers
@router.get("/publishers", response_model=List[PublisherSchema])
async def get_publishers(db: AsyncSession = Depends(deps.get_db)) -> Any:
    result = await db.execute(select(Publisher).order_by(Publisher.name))
    return result.scalars().all()

@router.post("/publishers", response_model=PublisherSchema)
async def create_publisher(
    *,
    db: AsyncSession = Depends(deps.get_db),
    publisher_in: PublisherCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN, UserRole.LIBRARIAN]))
) -> Any:
    publisher = Publisher(**publisher_in.model_dump())
    db.add(publisher)
    await db.commit()
    await db.refresh(publisher)
    return publisher

# Branches
@router.get("/branches", response_model=List[BranchSchema])
async def get_branches(db: AsyncSession = Depends(deps.get_db)) -> Any:
    result = await db.execute(select(Branch).order_by(Branch.name))
    return result.scalars().all()

@router.post("/branches", response_model=BranchSchema)
async def create_branch(
    *,
    db: AsyncSession = Depends(deps.get_db),
    branch_in: BranchCreate,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN]))
) -> Any:
    branch = Branch(**branch_in.model_dump())
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch
