from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from db.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(String)
    is_undone = Column(Boolean, default=False)
    
    operations = relationship("RenameOperation", back_populates="transaction")

class RenameOperation(Base):
    __tablename__ = "rename_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    original_path = Column(String, nullable=False)
    new_path = Column(String, nullable=False)
    status = Column(String, default="SUCCESS")
    
    transaction = relationship("Transaction", back_populates="operations")
