import json
import re
from typing import Dict, List, Set
from app.models.resume import Resume
from app.models.job import Job
from app.services.embeddings.model import EmbeddingModel
from app.services.nlp.parser import ResumeParser

class MatchingEngine:
    @staticmethod
    def calculate_match(resume: Resume, job: Job) -> dict:
        resume_text = resume.parsed_text or ""
        job_text = job.description or ""

        # 1. Semantic Match via Embedding Model
        resume_emb = EmbeddingModel.get_embedding(resume_text[:2000])
        job_emb = EmbeddingModel.get_embedding(job_text[:2000])
        raw_sim = EmbeddingModel.cosine_similarity(resume_emb, job_emb)
        semantic_score = round(raw_sim * 100, 1)

        # 2. Skill Extraction and Matching
        resume_analysis = ResumeParser.analyze(resume_text)
        resume_skills_map = {s.lower(): s for s in resume_analysis.skills}

        # Parse extracted job skills or extract dynamically
        req_skills_raw = []
        pref_skills_raw = []
        if job.requirements_extracted:
            try:
                reqs = json.loads(job.requirements_extracted)
                req_skills_raw = reqs.get("required_skills", [])
                pref_skills_raw = reqs.get("preferred_skills", [])
            except Exception:
                pass

        if not req_skills_raw:
            job_extracted = ResumeParser.extract_skills(job_text)
            req_skills_raw = job_extracted[:8]
            pref_skills_raw = job_extracted[8:14]

        # Canonical matching
        matched_skills = []
        missing_skills = []

        all_target_skills = list(dict.fromkeys(req_skills_raw + pref_skills_raw))
        if not all_target_skills:
            all_target_skills = ["Python", "FastAPI", "SQL", "Git"]

        for skill in all_target_skills:
            if skill.lower() in resume_skills_map:
                matched_skills.append(resume_skills_map[skill.lower()])
            else:
                missing_skills.append(skill)

        # Skill score
        total_skills = len(all_target_skills)
        if total_skills > 0:
            skill_score = round((len(matched_skills) / total_skills) * 100, 1)
        else:
            skill_score = 65.0

        # 3. Experience Alignment Score
        exp_score = 75.0
        exp_years_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', job_text, re.I)
        if exp_years_match:
            required_years = int(exp_years_match.group(1))
            user_exp_count = len(resume_analysis.experience)
            if user_exp_count >= required_years * 2:
                exp_score = 92.0
            elif user_exp_count >= required_years:
                exp_score = 82.0
            else:
                exp_score = 68.0

        # 4. Overall Weighted Score
        overall_score = round((skill_score * 0.45) + (semantic_score * 0.40) + (exp_score * 0.15), 1)
        overall_score = max(20.0, min(99.0, overall_score))

        # 5. Tailored Recommendations
        recommendations = []
        if missing_skills:
            top_missing = missing_skills[:4]
            recommendations.append(f"Add direct evidence of working with {', '.join(top_missing)} in your recent project or experience bullets.")
        if skill_score < 70:
            recommendations.append(f"Highlight transferable competencies that bridge the gap in required tooling for {job.title}.")
        if semantic_score < 60:
            recommendations.append(f"Incorporate industry keywords from the job description (e.g. '{job.title}', '{job.company}') into your headline and professional summary.")
        recommendations.append("Mirror the action verbs used in this job posting to pass ATS semantic parsing filters.")

        return {
            "overall_score": overall_score,
            "match_score": int(overall_score),
            "semantic_score": semantic_score,
            "skill_score": skill_score,
            "experience_score": exp_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommendations": recommendations
        }
