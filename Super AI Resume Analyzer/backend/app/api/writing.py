import os
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.models.user import User
from app.api.deps import get_current_user
from app.services.nlp.parser import ResumeParser
from pydantic import BaseModel

router = APIRouter()

class RewriteRequest(BaseModel):
    section_text: str
    style: str = "Professional"

class CoverLetterRequest(BaseModel):
    job_id: int
    company_name: str

class SummaryRequest(BaseModel):
    style: str = "Professional"

class AIWritingProvider:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key and self.api_key.strip() and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                self.client = None

    def rewrite_section(self, text: str, style: str) -> str:
        if self.client:
            try:
                prompt = (
                    f"Rewrite the following resume bullet point to make it more impactful, metric-driven, "
                    f"and ATS-friendly in a {style} tone. Keep it concise (1-2 sentences) and lead with a strong action verb:\n\n{text}"
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                if response and response.text:
                    return response.text.strip()
            except Exception:
                pass

        # Intelligent NLP Fallback
        cleaned = text.strip().rstrip(".")
        # Replace weak starter verbs with strong impact verbs
        replacements = [
            (r'^(worked on|helped with|was responsible for|handled)\s+', "Architected and delivered "),
            (r'^(created|made|did)\s+', "Engineered and deployed "),
            (r'^(managed|looked after)\s+', "Spearheaded and scaled "),
            (r'^(tested|checked)\s+', "Systematically validated and optimized ")
        ]
        improved = cleaned
        for pat, repl in replacements:
            if re.search(pat, improved, re.I):
                improved = re.sub(pat, repl, improved, flags=re.I)
                break
        else:
            if not any(improved.lower().startswith(v) for v in ["architected", "engineered", "spearheaded", "accelerated", "designed"]):
                improved = f"Engineered and optimized {improved[0].lower() + improved[1:]}"

        if not re.search(r'\d+%', improved):
            improved += ", improving operational performance and delivery efficiency by 25%."
        else:
            improved += "."

        return improved

    def generate_summary(self, text: str, style: str) -> str:
        if self.client:
            try:
                prompt = (
                    f"Generate a compelling {style} 3-sentence professional resume summary based on this background:\n\n{text[:2000]}"
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                if response and response.text:
                    return response.text.strip()
            except Exception:
                pass

        # Contextual synthesis fallback
        skills = ResumeParser.extract_skills(text)
        top_skills = ", ".join(skills[:5]) if skills else "modern software engineering tools"
        return (
            f"Results-driven software professional with demonstrable experience building high-impact systems. "
            f"Proficient across core technologies including {top_skills}, with a track record of delivering scalable solutions and optimizing technical workflows. "
            f"Adept at collaborating in agile cross-functional environments and translating complex requirements into robust software."
        )

    def generate_cover_letter(self, resume_text: str, job_desc: str, company: str) -> str:
        if self.client:
            try:
                prompt = (
                    f"Write a formal, tailored cover letter for a candidate applying to {company}.\n"
                    f"Candidate background:\n{resume_text[:2000]}\n\n"
                    f"Job Description:\n{job_desc[:2000]}\n"
                    f"Structure into 3-4 professional paragraphs with greeting and sign-off."
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                if response and response.text:
                    return response.text.strip()
            except Exception:
                pass

        # Contextual synthesis fallback
        resume_skills = ResumeParser.extract_skills(resume_text)
        job_skills = ResumeParser.extract_skills(job_desc)
        matched = [s for s in resume_skills if s in job_skills] or resume_skills[:4]
        skills_phrase = ", ".join(matched[:4]) if matched else "software development, architectural design, and agile execution"

        return f"""Dear Hiring Manager,

I am writing to express my enthusiastic interest in the open position at {company}. With a strong background in software development and practical experience in {skills_phrase}, I am eager to contribute to your engineering initiatives and product goals.

Throughout my career, I have focused on engineering scalable, maintainable solutions and tackling complex problem spaces. My background has provided me with hands-on expertise with technologies including {skills_phrase}, which closely aligns with the technical vision and responsibilities outlined in your job posting.

What particularly excites me about {company} is your commitment to quality and innovation. I am confident that my problem-solving ability, technical foundation, and collaborative approach will allow me to immediately add value to your team.

Thank you for your time and consideration. I welcome the opportunity to discuss how my skill set and enthusiasm can support {company}'s ongoing success.

Sincerely,
Applicant
"""

ai_provider = AIWritingProvider()

@router.post("/rewrite")
def rewrite_section(req: RewriteRequest, current_user: User = Depends(get_current_user)):
    rewritten = ai_provider.rewrite_section(req.section_text, req.style)
    return {"rewritten_text": rewritten}

@router.post("/{resume_id}/summary")
def generate_summary(
    resume_id: int, 
    req: SummaryRequest,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    summary = ai_provider.generate_summary(resume.parsed_text or "", req.style)
    return {"summary": summary}

@router.post("/{resume_id}/cover-letter")
def generate_cover_letter(
    resume_id: int, 
    req: CoverLetterRequest,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    job = db.query(Job).filter(Job.id == req.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
        
    cover_letter = ai_provider.generate_cover_letter(resume.parsed_text or "", job.description or "", req.company_name)
    return {"cover_letter": cover_letter}
