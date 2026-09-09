import re
from typing import List, Dict, Set
from app.schemas.resume import ResumeAnalysisResponse

# Comprehensive skill ontology
TECH_SKILLS = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "sql", "r", "dart", "html", "css", "bash", "shell",
    # Frontend
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "tailwind", "tailwindcss",
    "bootstrap", "redux", "html5", "css3", "sass", "webpack", "vite",
    # Backend
    "fastapi", "django", "flask", "node.js", "nodejs", "express", "express.js", "spring",
    "spring boot", "asp.net", ".net", "nestjs", "graphql", "rest api", "microservices",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", "dynamodb",
    "elasticsearch", "pgvector", "supabase", "firebase", "oracle",
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "ci/cd", "github actions", "jenkins", "ansible", "linux", "nginx",
    # AI / ML & Data
    "machine learning", "deep learning", "nlp", "natural language processing", "computer vision",
    "pytorch", "tensorflow", "scikit-learn", "sklearn", "pandas", "numpy", "spacy", "huggingface",
    "transformers", "langchain", "llm", "large language models", "rag", "opencv", "data analysis",
    # Methodologies & Tools
    "git", "github", "gitlab", "jira", "agile", "scrum", "unit testing", "pytest", "jest",
    "system design", "restful apis", "oop", "problem solving"
}

# Synonyms & standard display names
CANONICAL_NAMES = {
    "fastapi": "FastAPI",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "sqlite": "SQLite",
    "graphql": "GraphQL",
    "github": "GitHub",
    "gitlab": "GitLab",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "opencv": "OpenCV",
    "huggingface": "HuggingFace",
    "langchain": "LangChain",
    "react.js": "React",
    "vue.js": "Vue",
    "next.js": "Next.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express.js": "Express",
    "spring boot": "Spring Boot",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "amazon web services": "AWS",
    "google cloud": "GCP",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "tailwindcss": "TailwindCSS",
    "tailwind": "TailwindCSS",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "rest api": "REST APIs",
    "restful apis": "REST APIs",
    "ci/cd": "CI/CD",
    "llm": "LLMs",
    "large language models": "LLMs",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning"
}

class ResumeParser:
    @staticmethod
    def extract_skills(text: str) -> List[str]:
        text_lower = " " + text.lower() + " "
        found: Set[str] = set()

        for skill in TECH_SKILLS:
            # Word boundary pattern
            pattern = r'(?<![a-zA-Z0-9#+])' + re.escape(skill) + r'(?![a-zA-Z0-9#+])'
            if re.search(pattern, text_lower):
                display_name = CANONICAL_NAMES.get(skill, skill.title() if len(skill) > 3 else skill.upper())
                found.add(display_name)

        return sorted(list(found))

    @staticmethod
    def extract_sections(text: str) -> Dict[str, List[str]]:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        
        section_headers = {
            "experience": re.compile(r'^(work\s+experience|professional\s+experience|employment\s+history|experience|career\s+history)', re.I),
            "education": re.compile(r'^(education|academic\s+background|qualifications|academic\s+history)', re.I),
            "projects": re.compile(r'^(projects|personal\s+projects|key\s+projects|academic\s+projects)', re.I),
            "skills": re.compile(r'^(skills|technical\s+skills|core\s+competencies|technologies)', re.I),
            "certifications": re.compile(r'^(certifications|licenses|courses|awards)', re.I),
        }

        sections: Dict[str, List[str]] = {
            "experience": [],
            "education": [],
            "projects": [],
            "skills": [],
            "certifications": []
        }

        current_sec = None

        for line in lines:
            matched_sec = None
            if len(line) < 40:
                for sec_name, pattern in section_headers.items():
                    if pattern.search(line):
                        matched_sec = sec_name
                        break
            
            if matched_sec:
                current_sec = matched_sec
            elif current_sec:
                sections[current_sec].append(line)

        return sections

    @staticmethod
    def analyze(text: str) -> ResumeAnalysisResponse:
        skills = ResumeParser.extract_skills(text)
        sections = ResumeParser.extract_sections(text)

        # Fallback if sections were not recognized by headers
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        experience = sections["experience"]
        if not experience and len(lines) > 5:
            experience = lines[2:12]

        education = sections["education"]
        if not education:
            for line in lines:
                if any(w in line.lower() for w in ["bachelor", "master", "degree", "university", "college", "b.tech", "b.s.", "m.s."]):
                    education.append(line)

        projects = sections["projects"]
        certifications = sections["certifications"]

        # Formulate summary
        summary = ""
        for line in lines[:6]:
            if len(line) > 40 and not any(w in line.lower() for w in ["resume", "curriculum", "email", "phone"]):
                summary = line
                break
        if not summary and lines:
            summary = " ".join(lines[:3])

        return ResumeAnalysisResponse(
            skills=skills,
            experience=experience[:15],
            education=education[:6],
            projects=projects[:10],
            certifications=certifications[:6],
            summary=summary[:300] if summary else "Professional summary extracted from resume."
        )

    @staticmethod
    def generate_report(text: str) -> Dict:
        """
        Generate detailed ATS score, component scores, strengths, weaknesses, and suggestions.
        """
        analysis = ResumeParser.analyze(text)
        text_lower = text.lower()
        skills = analysis.skills
        experience = analysis.experience
        education = analysis.education

        # 1. Skills score (0-100)
        skill_count = len(skills)
        skills_score = min(100, int((skill_count / 12) * 100))

        # 2. Experience score (0-100)
        action_verbs = ["developed", "built", "designed", "implemented", "led", "created", "managed", "optimized", "architected", "deployed", "scaled"]
        verbs_found = sum(1 for v in action_verbs if v in text_lower)
        exp_length_factor = min(50, len(experience) * 5)
        verb_factor = min(50, verbs_found * 10)
        experience_score = exp_length_factor + verb_factor

        # 3. Education score
        education_score = 90 if education else 60

        # 4. Formatting / Standard Structure score
        has_email = "@" in text
        has_phone = bool(re.search(r'[\+\(]?[0-9]{3,}[\s\-\)]?[0-9]{3,}', text))
        formatting_score = 70
        if has_email and has_phone:
            formatting_score += 20
        if len(experience) > 0:
            formatting_score += 10
        formatting_score = min(100, formatting_score)

        # 5. Brevity & Impact (checks for numbers/metrics: %, $, numbers)
        has_metrics = bool(re.search(r'(\d+[\%kK\+]|\$\d+|\d+\s+(users|clients|percent|times|x|ms))', text))
        impact_score = 85 if has_metrics else 65

        # Component scores
        component_scores = {
            "skills": skills_score,
            "experience": experience_score,
            "education": education_score,
            "formatting": formatting_score,
            "impact": impact_score
        }

        # Overall and ATS calculation
        ats_score = int(
            (skills_score * 0.30) +
            (experience_score * 0.25) +
            (formatting_score * 0.20) +
            (education_score * 0.15) +
            (impact_score * 0.10)
        )
        ats_score = max(40, min(98, ats_score))
        overall_score = int(ats_score * 0.98)

        # Strengths
        strengths = []
        if skill_count >= 8:
            strengths.append(f"Strong technical keyword footprint with {skill_count} identified domain skills.")
        if verbs_found >= 3:
            strengths.append("Effective use of active verbs in experience descriptions.")
        if has_email and has_phone:
            strengths.append("Clear contact credentials easily identifiable by ATS scanners.")
        if has_metrics:
            strengths.append("Includes quantified achievements and metrics that demonstrate business impact.")
        if not strengths:
            strengths.append("Clear and legible resume structure suitable for automated parsers.")

        # Weaknesses
        weaknesses = []
        if not has_metrics:
            weaknesses.append("Lack of measurable impact metrics (percentages, revenues, or latency reductions).")
        if skill_count < 8:
            weaknesses.append("Keyword density could be improved by explicitly listing relevant modern frameworks and tools.")
        if verbs_found < 3:
            weaknesses.append("Experience bullets could use more impactful action verbs (e.g. 'Architected', 'Spearheaded').")
        if not education:
            weaknesses.append("Education section is either absent or not labeled with standard industry headings.")
        if not weaknesses:
            weaknesses.append("Ensure skills listed in project sections are mirrored in your primary skills summary.")

        # Suggestions
        suggestions = [
            "Tailor your skill keywords directly to match specific target job descriptions.",
            "Quantify your accomplishments using the formula: 'Accomplished [X], as measured by [Y], by doing [Z]'.",
            "Keep formatting clean without nested tables, non-standard fonts, or complex multi-column layouts."
        ]
        if not has_metrics:
            suggestions.insert(0, "Add at least 2-3 specific metric benchmarks to your recent employment bullets.")

        return {
            "overall_score": overall_score,
            "ats_score": ats_score,
            "component_scores": component_scores,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "suggestions": suggestions
        }
