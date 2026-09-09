from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    logo_url = Column(String, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    headquarters = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    # Recruiters belonging to this company
    recruiters = relationship("RecruiterProfile", back_populates="company")
    # Jobs will be linked here
    jobs = relationship("Job", back_populates="company")
class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    designation = Column(String, nullable=True)

    user = relationship("User", backref="recruiter_profile")
    company = relationship("Company", back_populates="recruiters")
