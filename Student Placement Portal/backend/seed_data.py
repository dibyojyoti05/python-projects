import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import SessionLocal
from app.core import security
from app.models.user import User, RoleEnum
from app.models.company import Company, RecruiterProfile
from app.models.student import StudentProfile, Education, Skill, Project, Resume
from app.models.job import Job
from app.models.application import Application

async def seed():
    print("Starting database seeding for Student Placement Portal...")
    async with SessionLocal() as db:
        # 1. Admin
        res = await db.execute(select(User).where(User.email == "admin@placement.edu"))
        admin = res.scalars().first()
        if not admin:
            admin = User(
                email="admin@placement.edu",
                hashed_password=security.get_password_hash("Admin@123"),
                role=RoleEnum.SUPER_ADMIN,
                is_active=True
            )
            db.add(admin)
            print("  + Created Admin: admin@placement.edu / Admin@123")

        # 2. Companies
        companies_data = [
            {
                "name": "Google",
                "industry": "Internet & Cloud Technology",
                "website": "https://careers.google.com",
                "headquarters": "Mountain View, CA & Bangalore, India",
                "company_size": "100,000+",
                "description": "Google is a global technology leader focused on improving the ways people connect with information.",
                "is_verified": True
            },
            {
                "name": "Microsoft",
                "industry": "Software, Cloud & AI",
                "website": "https://careers.microsoft.com",
                "headquarters": "Redmond, WA & Hyderabad, India",
                "company_size": "150,000+",
                "description": "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
                "is_verified": True
            },
            {
                "name": "Tata Consultancy Services (TCS)",
                "industry": "IT Services & Consulting",
                "website": "https://www.tcs.com/careers",
                "headquarters": "Mumbai, India",
                "company_size": "500,000+",
                "description": "TCS is an IT services, consulting and business solutions organization that has been partnering with the world's largest businesses.",
                "is_verified": True
            }
        ]

        companies = {}
        for cdata in companies_data:
            res = await db.execute(select(Company).where(Company.name == cdata["name"]))
            c = res.scalars().first()
            if not c:
                c = Company(**cdata)
                db.add(c)
                await db.flush()
                print(f"  + Created Company: {c.name}")
            companies[cdata["name"]] = c

        # 3. Recruiters
        recruiters_data = [
            {
                "email": "recruiter@google.com",
                "password": "Recruiter@123",
                "company": companies["Google"],
                "first_name": "Sundar",
                "last_name": "Rao",
                "designation": "Lead Campus Talent Partner",
                "phone": "+91 98765 43210"
            },
            {
                "email": "recruiter@microsoft.com",
                "password": "Recruiter@123",
                "company": companies["Microsoft"],
                "first_name": "Ananya",
                "last_name": "Sharma",
                "designation": "University Recruiting Manager",
                "phone": "+91 98765 43211"
            },
            {
                "email": "recruiter@tcs.com",
                "password": "Recruiter@123",
                "company": companies["Tata Consultancy Services (TCS)"],
                "first_name": "Vikram",
                "last_name": "Verma",
                "designation": "Campus Placement Head",
                "phone": "+91 98765 43212"
            }
        ]

        for rdata in recruiters_data:
            res = await db.execute(select(User).where(User.email == rdata["email"]))
            u = res.scalars().first()
            if not u:
                u = User(
                    email=rdata["email"],
                    hashed_password=security.get_password_hash(rdata["password"]),
                    role=RoleEnum.RECRUITER,
                    is_active=True
                )
                db.add(u)
                await db.flush()

                rec_profile = RecruiterProfile(
                    user_id=u.id,
                    company_id=rdata["company"].id,
                    first_name=rdata["first_name"],
                    last_name=rdata["last_name"],
                    designation=rdata["designation"],
                    phone=rdata["phone"]
                )
                db.add(rec_profile)
                print(f"  + Created Recruiter: {u.email} / {rdata['password']} ({rdata['company'].name})")

        # 4. Students
        students_data = [
            {
                "email": "student1@placement.edu",
                "password": "Student@123",
                "first_name": "Aarav",
                "last_name": "Patel",
                "college": "Indian Institute of Technology, Delhi",
                "department": "Computer Science & Engineering",
                "degree": "B.Tech",
                "graduation_year": 2026,
                "cgpa": 9.35,
                "phone": "+91 91234 56780",
                "skills": ["Python", "FastAPI", "Next.js", "PostgreSQL", "Docker"]
            },
            {
                "email": "student2@placement.edu",
                "password": "Student@123",
                "first_name": "Diya",
                "last_name": "Sen",
                "college": "National Institute of Technology, Trichy",
                "department": "Data Science & Artificial Intelligence",
                "degree": "B.Tech",
                "graduation_year": 2026,
                "cgpa": 8.92,
                "phone": "+91 91234 56781",
                "skills": ["Python", "PyTorch", "Pandas", "Scikit-Learn", "Machine Learning"]
            },
            {
                "email": "student3@placement.edu",
                "password": "Student@123",
                "first_name": "Rohan",
                "last_name": "Mehta",
                "college": "BITS Pilani",
                "department": "Electronics & Electrical Engineering",
                "degree": "B.E.",
                "graduation_year": 2026,
                "cgpa": 8.55,
                "phone": "+91 91234 56782",
                "skills": ["C++", "Embedded Systems", "Python", "Linux"]
            },
            {
                "email": "student4@placement.edu",
                "password": "Student@123",
                "first_name": "Sneha",
                "last_name": "Reddy",
                "college": "IIIT Hyderabad",
                "department": "Information Technology",
                "degree": "B.Tech",
                "graduation_year": 2026,
                "cgpa": 9.60,
                "phone": "+91 91234 56783",
                "skills": ["React", "TypeScript", "Node.js", "AWS", "GraphQL"]
            }
        ]

        students = []
        for sdata in students_data:
            res = await db.execute(select(User).where(User.email == sdata["email"]))
            u = res.scalars().first()
            if not u:
                u = User(
                    email=sdata["email"],
                    hashed_password=security.get_password_hash(sdata["password"]),
                    role=RoleEnum.STUDENT,
                    is_active=True
                )
                db.add(u)
                await db.flush()

                sp = StudentProfile(
                    user_id=u.id,
                    first_name=sdata["first_name"],
                    last_name=sdata["last_name"],
                    college=sdata["college"],
                    department=sdata["department"],
                    degree=sdata["degree"],
                    graduation_year=sdata["graduation_year"],
                    cgpa=sdata["cgpa"],
                    phone=sdata["phone"]
                )
                db.add(sp)
                await db.flush()

                # Add skills
                for sk in sdata["skills"]:
                    db.add(Skill(student_id=sp.id, name=sk, proficiency="Expert"))

                # Add demo resume
                db.add(Resume(
                    student_id=sp.id,
                    file_name=f"{sdata['first_name']}_Resume.pdf",
                    file_path=f"uploads/resumes/{sdata['first_name'].lower()}_resume.pdf",
                    content_type="application/pdf",
                    is_primary=True
                ))

                print(f"  + Created Student: {u.email} / {sdata['password']} ({sdata['first_name']} {sdata['last_name']})")
                students.append(sp)
            else:
                res_sp = await db.execute(select(StudentProfile).where(StudentProfile.user_id == u.id))
                students.append(res_sp.scalars().first())

        # 5. Jobs
        jobs_data = [
            {
                "company_id": companies["Google"].id,
                "title": "Software Development Engineer (Full Stack)",
                "description": "Join Google's Core Engineering organization to develop scalable distributed web applications serving billions of users worldwide.",
                "requirements": "Strong algorithmic problem-solving skills, proficiency in Python or Go, familiarity with modern JavaScript/TypeScript frameworks.",
                "location": "Bangalore, India",
                "salary_range": "₹26,00,000 - ₹34,00,000 PA",
                "job_type": "Full-time",
                "is_active": True
            },
            {
                "company_id": companies["Google"].id,
                "title": "Machine Learning Engineer - Graduate Campus Drive",
                "description": "Design and deploy cutting-edge deep learning and LLM architectures within Google Search & Cloud AI teams.",
                "requirements": "Proficiency in PyTorch or TensorFlow, background in deep learning, linear algebra, and data structures. CGPA >= 8.5.",
                "location": "Bangalore / Hyderabad, India",
                "salary_range": "₹30,00,000 - ₹40,00,000 PA",
                "job_type": "Full-time",
                "is_active": True
            },
            {
                "company_id": companies["Microsoft"].id,
                "title": "Cloud & Azure Systems Engineer",
                "description": "Architect high-performance cloud infrastructure and microservices powering enterprise workloads on Microsoft Azure.",
                "requirements": "Knowledge of distributed systems, Linux/Windows internals, cloud networking, and CI/CD pipelines.",
                "location": "Hyderabad, India",
                "salary_range": "₹22,00,000 - ₹28,00,000 PA",
                "job_type": "Full-time",
                "is_active": True
            },
            {
                "company_id": companies["Microsoft"].id,
                "title": "Software Engineering Intern (Summer 2027)",
                "description": "10-week summer internship working directly with senior software architects on Microsoft 365 core products.",
                "requirements": "B.Tech/B.E. 3rd year students in CS/IT/ECE. Solid grasp of OOP, Git, and data structures.",
                "location": "Bangalore, India",
                "salary_range": "₹1,25,000 / month Stipend",
                "job_type": "Internship",
                "is_active": True
            },
            {
                "company_id": companies["Tata Consultancy Services (TCS)"].id,
                "title": "Associate Software Engineer - Digital Cadre",
                "description": "Work across enterprise client modernization programs using modern web stacks, microservices, and automated testing.",
                "requirements": "Good communication skills, knowledge of Java/Python, relational databases, and web basics. No active backlogs.",
                "location": "Pune / Mumbai / Chennai",
                "salary_range": "₹9,50,000 - ₹12,00,000 PA",
                "job_type": "Full-time",
                "is_active": True
            },
            {
                "company_id": companies["Tata Consultancy Services (TCS)"].id,
                "title": "Cybersecurity & Network Operations Analyst",
                "description": "Monitor and analyze network intrusion attempts, security policies, and enterprise identity management systems.",
                "requirements": "Knowledge of TCP/IP, cryptography basics, firewalls, and security frameworks.",
                "location": "Kolkata / Delhi NCR",
                "salary_range": "₹8,50,000 - ₹11,00,000 PA",
                "job_type": "Full-time",
                "is_active": True
            }
        ]

        created_jobs = []
        for jdata in jobs_data:
            res = await db.execute(
                select(Job).where(Job.title == jdata["title"]).where(Job.company_id == jdata["company_id"])
            )
            j = res.scalars().first()
            if not j:
                j = Job(**jdata)
                db.add(j)
                await db.flush()
                print(f"  + Created Job: {j.title}")
            created_jobs.append(j)

        # 6. Sample Applications
        if students and created_jobs:
            app_samples = [
                {"student": students[0], "job": created_jobs[0], "status": "Shortlisted", "notes": "Outstanding coding interview performance."},
                {"student": students[0], "job": created_jobs[2], "status": "Reviewed", "notes": "Resume reviewed, scheduled for round 1."},
                {"student": students[1], "job": created_jobs[1], "status": "Accepted", "notes": "Final offer letter released and accepted!"},
                {"student": students[1], "job": created_jobs[0], "status": "Shortlisted", "notes": "Strong machine learning portfolio."},
                {"student": students[2], "job": created_jobs[4], "status": "Pending", "notes": "Application received and under review."},
                {"student": students[3], "job": created_jobs[0], "status": "Shortlisted", "notes": "Top 1% rank in university batch."}
            ]

            for samp in app_samples:
                res = await db.execute(
                    select(Application)
                    .where(Application.student_id == samp["student"].id)
                    .where(Application.job_id == samp["job"].id)
                )
                if not res.scalars().first():
                    app = Application(
                        student_id=samp["student"].id,
                        job_id=samp["job"].id,
                        status=samp["status"],
                        notes=samp["notes"]
                    )
                    db.add(app)
                    print(f"  + Created Application: Student #{samp['student'].id} -> {samp['job'].title} [{samp['status']}]")

        await db.commit()
        print("\nSeed data loaded successfully!")
        print("Demo Credentials:")
        print("  Admin:      admin@placement.edu / Admin@123")
        print("  Recruiters: recruiter@google.com / Recruiter@123")
        print("              recruiter@microsoft.com / Recruiter@123")
        print("              recruiter@tcs.com / Recruiter@123")
        print("  Students:   student1@placement.edu / Student@123")
        print("              student2@placement.edu / Student@123")

if __name__ == "__main__":
    asyncio.run(seed())
