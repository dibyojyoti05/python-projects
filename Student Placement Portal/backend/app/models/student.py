from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    
    # Core academic
    college = Column(String, nullable=True)
    department = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    backlogs = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", backref="student_profile")
    educations = relationship("Education", back_populates="student")
    skills = relationship("Skill", back_populates="student")
    projects = relationship("Project", back_populates="student")
    certifications = relationship("Certification", back_populates="student")
    internships = relationship("Internship", back_populates="student")
    resumes = relationship("Resume", back_populates="student")
    applications = relationship("Application", back_populates="student")

class Education(Base):
    __tablename__ = "student_education"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    institution = Column(String)
    degree = Column(String)
    field_of_study = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    grade = Column(String)
    
    student = relationship("StudentProfile", back_populates="educations")

class Skill(Base):
    __tablename__ = "student_skills"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    name = Column(String, index=True)
    proficiency = Column(String) # Beginner, Intermediate, Expert
    
    student = relationship("StudentProfile", back_populates="skills")

class Project(Base):
    __tablename__ = "student_projects"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    name = Column(String)
    description = Column(Text)
    technologies = Column(String)
    github_url = Column(String, nullable=True)
    live_url = Column(String, nullable=True)
    
    student = relationship("StudentProfile", back_populates="projects")

class Certification(Base):
    __tablename__ = "student_certifications"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    name = Column(String)
    issuing_organization = Column(String)
    issue_date = Column(Date)
    credential_id = Column(String, nullable=True)
    credential_url = Column(String, nullable=True)
    
    student = relationship("StudentProfile", back_populates="certifications")

class Internship(Base):
    __tablename__ = "student_internships"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    company = Column(String)
    role = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    description = Column(Text)
    
    student = relationship("StudentProfile", back_populates="internships")

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    file_name = Column(String)
    file_path = Column(String) # Relative path to secure storage
    content_type = Column(String)
    is_primary = Column(Boolean, default=False)
    uploaded_at = Column(Date)
    
    student = relationship("StudentProfile", back_populates="resumes")
