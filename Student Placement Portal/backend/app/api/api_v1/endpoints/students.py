from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import os
import uuid
import shutil

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.student import (
    StudentProfile, Resume, Education, Skill, Project, Certification, Internship
)
from app.schemas.student import (
    StudentProfileCreate, StudentProfileResponse,
    EducationCreate, EducationResponse,
    SkillCreate, SkillResponse,
    ProjectCreate, ProjectResponse,
    InternshipCreate, InternshipResponse,
    CertificationCreate, CertificationResponse
)

router = APIRouter()
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def student_profile_eager_options():
    return [
        selectinload(StudentProfile.educations),
        selectinload(StudentProfile.skills),
        selectinload(StudentProfile.projects),
        selectinload(StudentProfile.internships),
        selectinload(StudentProfile.certifications),
        selectinload(StudentProfile.resumes),
    ]

# ----------------- Profile -----------------

@router.get("/me", response_model=StudentProfileResponse)
async def get_my_profile(
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(
        select(StudentProfile)
        .options(*student_profile_eager_options())
        .where(StudentProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        # re-fetch with relationships
        result = await db.execute(
            select(StudentProfile)
            .options(*student_profile_eager_options())
            .where(StudentProfile.id == profile.id)
        )
        profile = result.scalars().first()
    return profile

@router.patch("/me", response_model=StudentProfileResponse)
async def update_my_profile(
    profile_in: StudentProfileCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
        
    await db.commit()
    
    # reload with all relations
    result = await db.execute(
        select(StudentProfile)
        .options(*student_profile_eager_options())
        .where(StudentProfile.id == profile.id)
    )
    return result.scalars().first()

@router.get("/{student_id}", response_model=StudentProfileResponse)
async def get_student_by_id(
    student_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    # Recruiters, Admins, Placement Officers, or the student themselves can view
    result = await db.execute(
        select(StudentProfile)
        .options(*student_profile_eager_options())
        .where(StudentProfile.id == student_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile

# ----------------- Resumes -----------------

@router.post("/me/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are allowed.")
    
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Complete your profile first")

    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Set previous resumes to is_primary = False
    prev_resumes = await db.execute(select(Resume).where(Resume.student_id == profile.id))
    for r in prev_resumes.scalars().all():
        r.is_primary = False

    resume = Resume(
        student_id=profile.id,
        file_name=file.filename,
        file_path=file_path,
        content_type=file.content_type,
        is_primary=True,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    return {"message": "Resume uploaded successfully", "resume_id": resume.id, "file_name": resume.file_name}

@router.get("/resume/{resume_id}")
async def download_resume(
    resume_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server")

    return FileResponse(
        resume.file_path,
        media_type=resume.content_type or "application/pdf",
        filename=resume.file_name
    )

# ----------------- Skills -----------------

@router.post("/skills", response_model=SkillResponse)
async def add_skill(
    skill_in: SkillCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    skill = Skill(student_id=profile.id, name=skill_in.name, proficiency=skill_in.proficiency)
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill

@router.delete("/skills/{skill_id}")
async def delete_skill(
    skill_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    res = await db.execute(select(Skill).where(Skill.id == skill_id, Skill.student_id == profile.id))
    skill = res.scalars().first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    await db.delete(skill)
    await db.commit()
    return {"message": "Skill deleted successfully"}

# ----------------- Projects -----------------

@router.post("/projects", response_model=ProjectResponse)
async def add_project(
    project_in: ProjectCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    project = Project(
        student_id=profile.id,
        name=project_in.name,
        description=project_in.description,
        technologies=project_in.technologies,
        github_url=project_in.github_url,
        live_url=project_in.live_url
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    res = await db.execute(select(Project).where(Project.id == project_id, Project.student_id == profile.id))
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}

# ----------------- Internships / Experience -----------------

@router.post("/internships", response_model=InternshipResponse)
async def add_internship(
    internship_in: InternshipCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    internship = Internship(
        student_id=profile.id,
        company=internship_in.company,
        role=internship_in.role,
        start_date=internship_in.start_date,
        end_date=internship_in.end_date,
        description=internship_in.description
    )
    db.add(internship)
    await db.commit()
    await db.refresh(internship)
    return internship

@router.delete("/internships/{internship_id}")
async def delete_internship(
    internship_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    res = await db.execute(select(Internship).where(Internship.id == internship_id, Internship.student_id == profile.id))
    internship = res.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    await db.delete(internship)
    await db.commit()
    return {"message": "Internship deleted successfully"}

# ----------------- Certifications -----------------

@router.post("/certifications", response_model=CertificationResponse)
async def add_certification(
    cert_in: CertificationCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    cert = Certification(
        student_id=profile.id,
        name=cert_in.name,
        issuing_organization=cert_in.issuing_organization,
        issue_date=cert_in.issue_date,
        credential_id=cert_in.credential_id,
        credential_url=cert_in.credential_url
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return cert

@router.delete("/certifications/{cert_id}")
async def delete_certification(
    cert_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    res = await db.execute(select(Certification).where(Certification.id == cert_id, Certification.student_id == profile.id))
    cert = res.scalars().first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")

    await db.delete(cert)
    await db.commit()
    return {"message": "Certification deleted successfully"}

# ----------------- Education -----------------

@router.post("/education", response_model=EducationResponse)
async def add_education(
    edu_in: EducationCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    edu = Education(
        student_id=profile.id,
        institution=edu_in.institution,
        degree=edu_in.degree,
        field_of_study=edu_in.field_of_study,
        start_date=edu_in.start_date,
        end_date=edu_in.end_date,
        grade=edu_in.grade
    )
    db.add(edu)
    await db.commit()
    await db.refresh(edu)
    return edu

@router.delete("/education/{edu_id}")
async def delete_education(
    edu_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile does not exist")

    res = await db.execute(select(Education).where(Education.id == edu_id, Education.student_id == profile.id))
    edu = res.scalars().first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education record not found")

    await db.delete(edu)
    await db.commit()
    return {"message": "Education record deleted successfully"}
