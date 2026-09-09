from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# Education
class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: date
    end_date: Optional[date] = None
    grade: Optional[str] = None

class EducationCreate(EducationBase):
    pass

class EducationResponse(EducationBase):
    id: int
    
    class Config:
        from_attributes = True

# Skills
class SkillBase(BaseModel):
    name: str
    proficiency: Optional[str] = "Intermediate" # Beginner, Intermediate, Expert

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: int

    class Config:
        from_attributes = True

# Projects
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: Optional[str] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int

    class Config:
        from_attributes = True

# Internships
class InternshipBase(BaseModel):
    company: str
    role: str
    start_date: date
    end_date: Optional[date] = None
    description: Optional[str] = None

class InternshipCreate(InternshipBase):
    pass

class InternshipResponse(InternshipBase):
    id: int

    class Config:
        from_attributes = True

# Certifications
class CertificationBase(BaseModel):
    name: str
    issuing_organization: str
    issue_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class CertificationCreate(CertificationBase):
    pass

class CertificationResponse(CertificationBase):
    id: int

    class Config:
        from_attributes = True

# Resume
class ResumeResponse(BaseModel):
    id: int
    file_name: str
    content_type: Optional[str] = None
    is_primary: bool = False
    uploaded_at: Optional[date] = None

    class Config:
        from_attributes = True

# Student Profile
class StudentProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    college: Optional[str] = None
    department: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    backlogs: Optional[int] = 0

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    educations: List[EducationResponse] = []
    skills: List[SkillResponse] = []
    projects: List[ProjectResponse] = []
    internships: List[InternshipResponse] = []
    certifications: List[CertificationResponse] = []
    resumes: List[ResumeResponse] = []
    
    class Config:
        from_attributes = True
