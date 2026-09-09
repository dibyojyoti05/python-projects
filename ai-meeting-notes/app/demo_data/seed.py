from datetime import datetime, timedelta
from app.database import (
    get_db_session,
    init_db,
    Meeting,
    Transcript,
    Summary,
    ActionItem,
    Participant,
    ProcessingLog,
    MeetingStatus,
    PriorityLevel,
    ActionItemStatus,
)
from app.utils.logger import logger
from app.utils.security import compute_file_hash


def seed_demo_data(force: bool = False) -> None:
    """Populates database with 3 rich realistic demo meetings if empty or forced."""
    init_db()

    with get_db_session() as session:
        existing_count = session.query(Meeting).count()
        if existing_count > 0 and not force:
            logger.info("Demo data already seeded. Skipping.")
            return

        if force:
            logger.info("Force flag enabled. Clearing existing demo data...")
            session.query(ProcessingLog).delete()
            session.query(ActionItem).delete()
            session.query(Participant).delete()
            session.query(Summary).delete()
            session.query(Transcript).delete()
            session.query(Meeting).delete()
            session.flush()

        logger.info("Seeding realistic demo meetings...")

        # ----------------------------------------------------
        # Demo Meeting 1: Q3 Product Roadmap & Infrastructure Planning
        # ----------------------------------------------------
        trans1 = """[00:00:00] Sarah Jenkins: Good morning everyone. Let's kick off our Q3 Product Roadmap & Infrastructure Planning meeting. On the call we have Alex, Michael, and Priyanshi.
[00:00:25] Michael Chang: Thanks Sarah. On the frontend side, we've completed the UI redesign for the client portal. We saw a 35% increase in user satisfaction in beta testing.
[00:01:10] Priyanshi Patel: That's great Michael. On the backend, we noticed our PostgreSQL query latency spiked during peak load tests. We need to implement Redis caching and optimize the meeting search queries before the launch.
[00:01:50] Alex Rivera: I agree. I can take ownership of the Redis caching implementation. I will benchmark the queries and deploy the caching layer to staging by this Thursday.
[00:02:30] Sarah Jenkins: Perfect Alex. What about the SOC2 compliance audit report?
[00:02:45] Priyanshi Patel: I have reviewed the draft findings. There are two minor encryption policy updates required. I will finalize and sign off on the SOC2 audit report by next Tuesday.
[00:03:30] Michael Chang: Do we have clarity on the customer migration timeline for existing enterprise tenants?
[00:03:50] Sarah Jenkins: Good question. We decided to schedule the enterprise tenant migration for October 15th to give customers a 3-week advance notice.
[00:04:20] Sarah Jenkins: Also, we decided to allocate $45,000 from the Q3 budget for cloud infrastructure scaling on Google Cloud Platform.
[00:04:55] Michael Chang: I will update the customer documentation and migration guide by Friday at 5 PM.
[00:05:30] Sarah Jenkins: Excellent. Let's wrap up. Thanks all!"""

        m1 = Meeting(
            title="Q3 Product Roadmap & Infrastructure Planning",
            date=datetime.utcnow() - timedelta(days=2),
            duration_minutes=35.0,
            source_filename="q3_product_roadmap_planning.mp3",
            file_type="audio",
            file_hash=compute_file_hash(trans1.encode("utf-8")),
            file_size_bytes=14205000,
            status=MeetingStatus.COMPLETED,
            processing_time_seconds=4.2,
            created_at=datetime.utcnow() - timedelta(days=2),
        )
        session.add(m1)
        session.flush()

        t1 = Transcript(
            meeting_id=m1.id,
            raw_text=trans1,
            cleaned_text=trans1,
            word_count=len(trans1.split()),
            has_speaker_labels=1,
            language="en",
        )
        session.add(t1)

        s1 = Summary(
            meeting_id=m1.id,
            quick_summary="The team evaluated Q3 frontend UI benchmarks, committed to deploying Redis caching to remediate PostgreSQL query latency by Thursday, approved $45,000 in GCP infrastructure scaling, and locked October 15th for enterprise migration.",
            standard_summary="In this Q3 Planning session, Michael Chang presented positive beta results showing a 35% jump in client portal satisfaction. Priyanshi Patel raised database latency bottlenecks under peak traffic, which Alex Rivera agreed to solve by deploying Redis caching to staging by Thursday.\n\nPriyanshi committed to completing the SOC2 audit sign-off by Tuesday following minor encryption policy adjustments. Finally, Sarah Jenkins led key organizational decisions: setting the enterprise migration date for October 15th and allocating $45,000 for cloud infrastructure scaling.",
            detailed_summary="### 1. Client Portal UI Redesign\nMichael reported that the beta testing cohort demonstrated a 35% higher user satisfaction rating. The component library has stabilized and is ready for full release.\n\n### 2. Backend Infrastructure & Query Optimization\nLoad tests revealed database query degradation on full-text meeting searches. Alex Rivera took ownership of implementing Redis caching, establishing benchmarks, and deploying to staging by Thursday.\n\n### 3. Security & SOC2 Compliance\nPriyanshi reviewed the auditor's draft findings. Two encryption policy updates are underway, and the final sign-off is scheduled for next Tuesday.\n\n### 4. Migration Schedule & Cloud Budget\nEnterprise customer migration is officially set for October 15th with a 3-week customer notice period. Leadership approved a $45,000 GCP cloud infrastructure scaling budget.",
            key_points=[
                "Client portal redesign produced a 35% increase in user satisfaction during beta testing.",
                "Database query latency requires Redis caching and index optimization before launch.",
                "SOC2 audit report will be finalized by next Tuesday after minor encryption policy updates.",
                "Enterprise customer migration timeline scheduled for October 15th.",
                "Approved $45,000 Q3 cloud infrastructure scaling budget on GCP."
            ],
            decisions=[
                "Enterprise tenant migration scheduled for October 15th.",
                "Approved $45,000 cloud infrastructure budget allocation on Google Cloud Platform.",
                "Deploy Redis caching layer to staging environment."
            ],
            questions=[
                "What is the exact communication cadence for enterprise customers ahead of the October 15th migration?",
                "Are additional database read-replicas required alongside the Redis caching layer?"
            ],
            topics=["Frontend Redesign", "Database Caching", "SOC2 Compliance", "Cloud Budget", "Enterprise Migration"],
            model_used="Gemini 1.5 Flash",
        )
        session.add(s1)

        session.add(ActionItem(
            meeting_id=m1.id,
            task="Implement Redis caching layer and benchmark database queries on staging",
            assignee="Alex Rivera",
            deadline="Thursday",
            priority=PriorityLevel.HIGH,
            status=ActionItemStatus.IN_PROGRESS,
        ))
        session.add(ActionItem(
            meeting_id=m1.id,
            task="Finalize encryption policy adjustments and sign off on SOC2 audit report",
            assignee="Priyanshi Patel",
            deadline="Next Tuesday",
            priority=PriorityLevel.CRITICAL,
            status=ActionItemStatus.PENDING,
        ))
        session.add(ActionItem(
            meeting_id=m1.id,
            task="Update customer documentation and migration guide for enterprise tenants",
            assignee="Michael Chang",
            deadline="Friday, 5:00 PM",
            priority=PriorityLevel.MEDIUM,
            status=ActionItemStatus.COMPLETED,
        ))

        for name, role in [("Sarah Jenkins", "Meeting Lead / VP Product"), ("Michael Chang", "Frontend Lead"), ("Priyanshi Patel", "Backend & Security Lead"), ("Alex Rivera", "DevOps Engineer")]:
            session.add(Participant(meeting_id=m1.id, name=name, role=role))

        # ----------------------------------------------------
        # Demo Meeting 2: AI Search Engine Architecture Review
        # ----------------------------------------------------
        trans2 = """[00:00:00] Dr. Evelyn Vance: Welcome to the AI Search Engine architecture review. Joining today: Marcus, Liam, and Chloe.
[00:00:30] Marcus Brody: We conducted benchmark comparisons between dense vector embeddings and hybrid BM25 lexical search. Hybrid search achieved a 28% higher Recall@10 on domain-specific queries.
[00:01:15] Chloe Dubois: That aligns with our findings. However, vector indexing in Qdrant increased memory usage by 40%. We need scalar quantization to keep RAM within cloud limits.
[00:02:00] Liam Gallagher: I tested 8-bit scalar quantization yesterday. It reduced memory overhead by 65% with only a 0.8% drop in precision.
[00:02:40] Dr. Evelyn Vance: Outstanding. Let's officially decide to adopt hybrid search with 8-bit scalar quantization as our default indexing strategy.
[00:03:10] Liam Gallagher: I will write the quantization integration module by Wednesday noon.
[00:03:45] Marcus Brody: I will configure the automated re-indexing pipeline in Airflow by next Monday.
[00:04:15] Dr. Evelyn Vance: And Chloe, please conduct load testing with 500 concurrent search requests by Friday."""

        m2 = Meeting(
            title="AI Search Engine Architecture Review",
            date=datetime.utcnow() - timedelta(days=5),
            duration_minutes=25.0,
            source_filename="ai_search_architecture.pdf",
            file_type="text",
            file_hash=compute_file_hash(trans2.encode("utf-8")),
            file_size_bytes=485000,
            status=MeetingStatus.COMPLETED,
            processing_time_seconds=3.8,
            created_at=datetime.utcnow() - timedelta(days=5),
        )
        session.add(m2)
        session.flush()

        t2 = Transcript(
            meeting_id=m2.id,
            raw_text=trans2,
            cleaned_text=trans2,
            word_count=len(trans2.split()),
            has_speaker_labels=1,
            language="en",
        )
        session.add(t2)

        s2 = Summary(
            meeting_id=m2.id,
            quick_summary="The engineering team benchmarked semantic vs hybrid search, formally adopted hybrid BM25 + dense vector indexing with 8-bit scalar quantization, and distributed re-indexing and load testing tasks across the team.",
            standard_summary="The team evaluated search retrieval architectures for the next-gen AI search platform. Marcus Brody demonstrated that hybrid BM25 and vector search delivers 28% higher recall. To mitigate vector memory overhead, Liam Gallagher proved 8-bit scalar quantization cuts RAM consumption by 65%.\n\nDr. Evelyn Vance approved hybrid search with scalar quantization as the production architecture. Implementation tasks were assigned for quantization integration, Airflow re-indexing, and stress testing.",
            detailed_summary="### 1. Retrieval Quality & Benchmarks\nMarcus presented benchmark results comparing pure dense vector embeddings against hybrid search. Hybrid BM25 + dense vector embeddings yielded a 28% boost in Recall@10 for specialized domain queries.\n\n### 2. Memory Optimization with Quantization\nChloe highlighted that full-precision vector storage threatened cloud memory budgets. Liam demonstrated that 8-bit scalar quantization reduced memory by 65% with negligible (<0.8%) precision loss.\n\n### 3. Architecture Standardization & Action Plan\nThe team standardized on hybrid indexing with scalar quantization. Action items include quantization pipeline integration by Wednesday, Airflow scheduling by Monday, and 500 concurrent query load testing by Friday.",
            key_points=[
                "Hybrid BM25 + vector search demonstrated 28% superior Recall@10 over vector-only search.",
                "8-bit scalar quantization achieves 65% RAM reduction with only 0.8% precision drop.",
                "Adopted hybrid search with quantization as the official production standard."
            ],
            decisions=[
                "Adopt hybrid BM25 + dense vector search architecture.",
                "Enforce 8-bit scalar quantization across all production vector indices."
            ],
            questions=["Should we support real-time index updates or hourly batch re-indexing?"],
            topics=["Hybrid Search", "Vector Embeddings", "Scalar Quantization", "Airflow Re-indexing", "Load Testing"],
            model_used="Gemini 1.5 Flash",
        )
        session.add(s2)

        session.add(ActionItem(
            meeting_id=m2.id,
            task="Write 8-bit scalar quantization integration module",
            assignee="Liam Gallagher",
            deadline="Wednesday noon",
            priority=PriorityLevel.HIGH,
            status=ActionItemStatus.COMPLETED,
        ))
        session.add(ActionItem(
            meeting_id=m2.id,
            task="Conduct load testing with 500 concurrent search queries",
            assignee="Chloe Dubois",
            deadline="Friday",
            priority=PriorityLevel.HIGH,
            status=ActionItemStatus.PENDING,
        ))
        session.add(ActionItem(
            meeting_id=m2.id,
            task="Configure automated search re-indexing DAGs in Apache Airflow",
            assignee="Marcus Brody",
            deadline="Next Monday",
            priority=PriorityLevel.MEDIUM,
            status=ActionItemStatus.PENDING,
        ))

        for name, role in [("Dr. Evelyn Vance", "Chief AI Architect"), ("Marcus Brody", "Senior ML Engineer"), ("Chloe Dubois", "Performance Engineer"), ("Liam Gallagher", "Search Systems Engineer")]:
            session.add(Participant(meeting_id=m2.id, name=name, role=role))

        # ----------------------------------------------------
        # Demo Meeting 3: Customer Success & Churn Mitigation Strategy
        # ----------------------------------------------------
        trans3 = """[00:00:00] Hannah Abbott: Welcome team. Today's focus is customer retention, Q2 churn root-cause analysis, and onboarding optimizations.
[00:00:30] Lucas Vance: Analyzing last quarter's cancellations, 60% of churned accounts dropped out during weeks 2 to 4 due to complex workspace onboarding.
[00:01:15] Maya Lin: If we launch interactive in-app onboarding checklists and automated milestone check-in emails, we can intercept at-risk accounts early.
[00:02:00] Hannah Abbott: Agreed. We decided to roll out mandatory interactive onboarding tours for all new self-serve signups starting August 1st.
[00:02:40] Lucas Vance: I will design the in-app onboarding tour mockups by Thursday.
[00:03:15] Maya Lin: I will configure the Customer.io email sequence triggers by next Tuesday.
[00:03:45] Hannah Abbott: I will schedule 1-on-1 interview sessions with 5 churned enterprise accounts by August 10th."""

        m3 = Meeting(
            title="Customer Success & Churn Mitigation Strategy",
            date=datetime.utcnow() - timedelta(days=9),
            duration_minutes=20.0,
            source_filename="cs_churn_strategy.docx",
            file_type="text",
            file_hash=compute_file_hash(trans3.encode("utf-8")),
            file_size_bytes=225000,
            status=MeetingStatus.COMPLETED,
            processing_time_seconds=2.9,
            created_at=datetime.utcnow() - timedelta(days=9),
        )
        session.add(m3)
        session.flush()

        t3 = Transcript(
            meeting_id=m3.id,
            raw_text=trans3,
            cleaned_text=trans3,
            word_count=len(trans3.split()),
            has_speaker_labels=1,
            language="en",
        )
        session.add(t3)

        s3 = Summary(
            meeting_id=m3.id,
            quick_summary="The Customer Success team analyzed churn patterns, identifying week 2-4 onboarding friction as the root cause. The team approved interactive onboarding tours for all self-serve signups starting August 1st.",
            standard_summary="Hannah Abbott led a strategic review of Q2 retention metrics. Data revealed 60% of churned accounts struggled during early onboarding. Maya Lin and Lucas Vance proposed interactive walkthroughs and automated milestone emails.\n\nThe team committed to launching mandatory interactive onboarding tours by August 1st, alongside proactive customer outreach interviews.",
            detailed_summary="### 1. Churn Root-Cause Analysis\nLucas Vance presented retention cohort data showing 60% of customer cancellations occurred between weeks 2 and 4, directly attributed to complex workspace setup friction.\n\n### 2. In-App Onboarding & Lifecycle Emails\nMaya Lin proposed structured in-app guided tours and behavioral milestone check-ins to flag at-risk accounts before cancellation.\n\n### 3. Strategic Decisions & Execution Plan\nLeadership approved mandatory in-app onboarding tours launching August 1st. Action items include tour UI design by Thursday, email triggers by Tuesday, and churn interview scheduling by August 10th.",
            key_points=[
                "60% of customer churn occurred within weeks 2 to 4 due to onboarding friction.",
                "In-app checklists and milestone emails identified as key retention levers.",
                "Mandatory interactive onboarding tours will launch August 1st."
            ],
            decisions=[
                "Deploy interactive onboarding tours for all self-serve signups starting August 1st.",
                "Automate milestone check-in emails for accounts with inactive usage in week 2."
            ],
            questions=["Should live chat support be enabled during the first 14 days for trial users?"],
            topics=["Churn Analysis", "Onboarding Walkthrough", "Customer Lifecycle Emails", "User Interviews"],
            model_used="Gemini 1.5 Flash",
        )
        session.add(s3)

        session.add(ActionItem(
            meeting_id=m3.id,
            task="Design in-app onboarding tour UI mockups and interaction flow",
            assignee="Lucas Vance",
            deadline="Thursday",
            priority=PriorityLevel.HIGH,
            status=ActionItemStatus.COMPLETED,
        ))
        session.add(ActionItem(
            meeting_id=m3.id,
            task="Configure Customer.io email sequence triggers for at-risk accounts",
            assignee="Maya Lin",
            deadline="Next Tuesday",
            priority=PriorityLevel.MEDIUM,
            status=ActionItemStatus.COMPLETED,
        ))
        session.add(ActionItem(
            meeting_id=m3.id,
            task="Schedule qualitative 1-on-1 interview sessions with 5 churned enterprise accounts",
            assignee="Hannah Abbott",
            deadline="August 10th",
            priority=PriorityLevel.LOW,
            status=ActionItemStatus.IN_PROGRESS,
        ))

        for name, role in [("Hannah Abbott", "Head of Customer Success"), ("Lucas Vance", "Product Designer"), ("Maya Lin", "Growth & Lifecycle Lead")]:
            session.add(Participant(meeting_id=m3.id, name=name, role=role))

        logger.info("Demo data seeding completed successfully.")


if __name__ == "__main__":
    seed_demo_data(force=True)

