from pydantic import BaseModel
from typing import Optional, List

class PublisherBase(BaseModel):
    name: str
    description: Optional[str] = None

class PublisherCreate(PublisherBase):
    pass

class Publisher(PublisherBase):
    id: int
    class Config:
        from_attributes = True

class AuthorBase(BaseModel):
    name: str
    biography: Optional[str] = None

class AuthorCreate(AuthorBase):
    pass

class Author(AuthorBase):
    id: int
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    id: int
    class Config:
        from_attributes = True
