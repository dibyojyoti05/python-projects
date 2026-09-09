import time
from pathlib import Path
from typing import Optional
from app.providers.ai_provider import (
    AIProvider,
    MeetingAnalysisResult,
    ActionItemModel,
    ParticipantModel,
)
from app.providers.transcription_provider import (
    TranscriptionProvider,
    TranscriptionResult,
    SpeakerSegment,
)
from app.utils.logger import logger


MOCK_TRANSCRIPT_DEFAULT = """[00:00:00] Sarah Jenkins: Good morning everyone. Let's kick off our Q3 Product Roadmap & Infrastructure Planning meeting. On the call we have Alex, Michael, and Priyanshi.
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


class MockAIProvider(AIProvider):
    """Realistic Mock AI Provider for offline development, tests, and demo mode."""

    def __init__(self, simulated_delay: float = 0.5):
        self.simulated_delay = simulated_delay

    def summarize(self, transcript: str, user_title: Optional[str] = None) -> MeetingAnalysisResult:
        logger.info(f"MockAIProvider: Generating mock summary for transcript ({len(transcript)} chars)...")
        time.sleep(self.simulated_delay)

        # Infer title or use user_title
        title = user_title if (user_title and user_title.strip()) else "Q3 Product Roadmap & Infrastructure Planning"

        # Check if custom transcript keywords exist
        lower_trans = transcript.lower()
        if "sprint" in lower_trans or "scrum" in lower_trans:
            return self._generate_sprint_summary(user_title)
        elif "budget" in lower_trans or "finance" in lower_trans or "revenue" in lower_trans:
            return self._generate_finance_summary(user_title)

        # Default rich mock summary
        return MeetingAnalysisResult(
            title=title,
            quick_summary=(
                "The team reviewed Q3 frontend improvements, addressed backend query latency with Redis caching, "
                "finalized the SOC2 compliance timeline, and confirmed the enterprise customer migration date for October 15th."
            ),
            standard_summary=(
                "The Q3 Product and Infrastructure planning meeting focused on critical technical milestones and compliance. "
                "Michael reported a 35% increase in user satisfaction following the client portal redesign. Priyanshi highlighted "
                "database latency spikes, leading to an agreement for Alex to deploy Redis caching by Thursday.\n\n"
                "In terms of compliance and operations, Priyanshi committed to finalizing the SOC2 audit sign-off by Tuesday. "
                "The leadership team formally approved a $45,000 cloud infrastructure budget allocation and set October 15th as "
                "the enterprise migration launch date."
            ),
            detailed_summary=(
                "### 1. Frontend & Client Portal Redesign\n"
                "Michael Chang presented positive results from beta testing, noting a 35% user satisfaction bump. The redesigned interface is stable and ready for rollout.\n\n"
                "### 2. Backend Performance & Caching\n"
                "Priyanshi identified database query bottlenecks under high load. The team unanimously agreed that adding a Redis caching layer is mandatory before broad release.\n\n"
                "### 3. Compliance & Security Audit\n"
                "Priyanshi reported on the SOC2 draft. Minor encryption policy adjustments are needed, after which formal sign-off will occur by Tuesday.\n\n"
                "### 4. Cloud Infrastructure Budget & Migration\n"
                "Sarah Jenkins led the budget review, confirming $45,000 for Google Cloud scaling. Enterprise customer migration was locked in for October 15th."
            ),
            key_points=[
                "Client portal redesign achieved a 35% satisfaction boost in beta tests.",
                "Backend database queries require Redis caching to resolve peak load latency.",
                "SOC2 compliance draft requires minor encryption policy updates before sign-off.",
                "Enterprise customer migration timeline officially set for October 15th.",
                "Cloud infrastructure budget of $45,000 approved for Q3 scaling."
            ],
            decisions=[
                "Enterprise tenant migration scheduled for October 15th.",
                "Allocated $45,000 cloud infrastructure scaling budget on GCP.",
                "Approved deployment of Redis caching layer on staging."
            ],
            action_items=[
                ActionItemModel(
                    task="Implement Redis caching layer and benchmark database queries on staging",
                    assignee="Alex Rivera",
                    deadline="Thursday",
                    priority="HIGH"
                ),
                ActionItemModel(
                    task="Finalize encryption policy adjustments and sign off on SOC2 audit report",
                    assignee="Priyanshi Patel",
                    deadline="Next Tuesday",
                    priority="CRITICAL"
                ),
                ActionItemModel(
                    task="Update customer documentation and migration guides for enterprise tenants",
                    assignee="Michael Chang",
                    deadline="Friday, 5:00 PM",
                    priority="MEDIUM"
                )
            ],
            questions=[
                "What is the exact communication cadence for enterprise customers ahead of the October 15th migration?",
                "Are additional database read-replicas required alongside the Redis caching layer?"
            ],
            topics=[
                "Frontend Redesign",
                "Backend Latency & Caching",
                "SOC2 Compliance Audit",
                "Cloud Budget Allocation",
                "Enterprise Migration Timeline"
            ],
            participants=[
                ParticipantModel(name="Sarah Jenkins", role="Meeting Lead / VP Product"),
                ParticipantModel(name="Michael Chang", role="Frontend Lead"),
                ParticipantModel(name="Priyanshi Patel", role="Backend & Security Lead"),
                ParticipantModel(name="Alex Rivera", role="DevOps / Infrastructure Engineer")
            ],
            duration_minutes=35.0
        )

    def _generate_sprint_summary(self, user_title: Optional[str]) -> MeetingAnalysisResult:
        return MeetingAnalysisResult(
            title=user_title or "Sprint 24 Planning & Retrospective",
            quick_summary="Sprint 24 completed 85% of committed story points. Blockers around authentication tokens were resolved.",
            standard_summary="The engineering team conducted the Sprint 24 retrospective and planned Sprint 25 priorities. Mobile responsiveness and API rate-limiting were selected as the top objectives.",
            detailed_summary="Detailed review of sprint velocity, burn-down metrics, and technical debt items.",
            key_points=[
                "Velocity remained stable at 42 story points.",
                "Authentication token refresh bug fixed and deployed.",
                "Mobile UI testing needs automation."
            ],
            decisions=[
                "Prioritize API rate-limiting in Sprint 25.",
                "Deprecate legacy v1 authentication endpoints by end of sprint."
            ],
            action_items=[
                ActionItemModel(task="Create unit test suite for token refresh flow", assignee="David", deadline="Wednesday", priority="HIGH"),
                ActionItemModel(task="Draft API rate limit specification", assignee="Elena", deadline="Friday", priority="MEDIUM")
            ],
            questions=["Should we enforce per-user or per-IP rate limits?"],
            topics=["Sprint Retrospective", "Sprint 25 Planning", "API Rate Limiting", "Test Automation"],
            participants=[ParticipantModel(name="David", role="Backend Engineer"), ParticipantModel(name="Elena", role="Tech Lead")],
            duration_minutes=45.0
        )

    def _generate_finance_summary(self, user_title: Optional[str]) -> MeetingAnalysisResult:
        return MeetingAnalysisResult(
            title=user_title or "Q2 Financial Review & Budget Allocation",
            quick_summary="Q2 revenue grew 22% quarter-over-quarter. Operating expenses remained well within target thresholds.",
            standard_summary="Executive leadership reviewed quarterly financial performance, recurring revenue trends, and departmental budget requests for the upcoming fiscal quarter.",
            detailed_summary="Comprehensive financial analysis including SaaS ARR growth, customer acquisition costs, and hiring allocations.",
            key_points=[
                "ARR reached $4.2M representing 22% QoQ growth.",
                "Gross margins held steady at 78%.",
                "Customer acquisition cost decreased by 8%."
            ],
            decisions=[
                "Approved expanding the customer success team by 4 headcount.",
                "Maintain current marketing spend through Q3."
            ],
            action_items=[
                ActionItemModel(task="Publish finalized Q2 investor update deck", assignee="CFO", deadline="Monday", priority="HIGH"),
                ActionItemModel(task="Open job requisitions for Customer Success Managers", assignee="HR Lead", deadline="Wednesday", priority="MEDIUM")
            ],
            questions=["Will enterprise sales cycle lengthen in European regions?"],
            topics=["Revenue Analysis", "Gross Margins", "Headcount Approvals", "Investor Deck"],
            participants=[ParticipantModel(name="CFO", role="Finance"), ParticipantModel(name="CEO", role="Executive")],
            duration_minutes=60.0
        )

    def summarize_chunk(self, chunk_text: str, chunk_index: int, total_chunks: int) -> str:
        time.sleep(0.2)
        return f"Section {chunk_index}/{total_chunks} Summary: Discussed key project priorities, infrastructure, and action items."


class MockTranscriptionProvider(TranscriptionProvider):
    """Realistic Mock Speech-to-Text provider."""

    def __init__(self, simulated_delay: float = 0.5):
        self.simulated_delay = simulated_delay

    def transcribe(self, audio_path: Path, language: Optional[str] = None) -> TranscriptionResult:
        logger.info(f"MockTranscriptionProvider: Simulating transcription for {audio_path.name}...")
        time.sleep(self.simulated_delay)

        return TranscriptionResult(
            raw_text=MOCK_TRANSCRIPT_DEFAULT,
            language=language or "en",
            duration_seconds=330.0,
            segments=[
                SpeakerSegment(speaker="Sarah Jenkins", start_time=0.0, end_time=24.0, text="Good morning everyone. Let's kick off our Q3 Product Roadmap & Infrastructure Planning meeting."),
                SpeakerSegment(speaker="Michael Chang", start_time=25.0, end_time=68.0, text="Thanks Sarah. On the frontend side, we've completed the UI redesign for the client portal."),
                SpeakerSegment(speaker="Priyanshi Patel", start_time=70.0, end_time=108.0, text="On the backend, we noticed our PostgreSQL query latency spiked during peak load tests."),
                SpeakerSegment(speaker="Alex Rivera", start_time=110.0, end_time=148.0, text="I can take ownership of the Redis caching implementation on staging by Thursday."),
                SpeakerSegment(speaker="Sarah Jenkins", start_time=150.0, end_time=210.0, text="We decided to schedule the enterprise tenant migration for October 15th."),
            ],
            has_speaker_diarization=True
        )

