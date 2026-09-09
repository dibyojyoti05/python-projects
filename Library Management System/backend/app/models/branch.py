from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    address = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
