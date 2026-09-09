import time
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.database import (
    get_db_session,
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
from app.providers import MeetingAnalysisResult, TranscriptionResult
from app.utils.logger import logger
from app.utils.text_cleaner import clean_transcript, estimate_word_count


class MeetingService:
    """Business logic for meeting CRUD, search, action items, and dashboard metrics."""

    @staticmethod
    def find_meeting_by_hash(file_hash: str) -> Optional[Meeting]:
        """Find existing meeting by SHA-256 file hash for caching/deduplication."""
        if not file_hash:
            return None
        with get_db_session() as session:
            meeting = (
                session.query(Meeting)
                .options(
                    joinedload(Meeting.transcript),
                    joinedload(Meeting.summary),
                    joinedload(Meeting.action_items),
                    joinedload(Meeting.participants),
                )
                .filter(Meeting.file_hash == file_hash, Meeting.status == MeetingStatus.COMPLETED)
                .order_by(desc(Meeting.created_at))
                .first()
            )
            return meeting

    @staticmethod
    def create_or_update_meeting_record(
        source_filename: str,
        file_type: str,
        file_hash: str,
        file_size_bytes: int,
        user_title: Optional[str] = None,
    ) -> int:
        """Create an initial pending meeting record in the database."""
        with get_db_session() as session:
            meeting = Meeting(
                title=user_title or source_filename or "New Meeting",
                source_filename=source_filename,
                file_type=file_type,
                file_hash=file_hash,
                file_size_bytes=file_size_bytes,
                status=MeetingStatus.PROCESSING,
                created_at=datetime.utcnow(),
            )
            session.add(meeting)
            session.flush()
            meeting_id = meeting.id
            logger.info(f"Created initial meeting record ID={meeting_id} for file '{source_filename}'")
            return meeting_id

    @staticmethod
    def save_analysis_results(
        meeting_id: int,
        raw_transcript: str,
        analysis: MeetingAnalysisResult,
        transcription_result: Optional[TranscriptionResult] = None,
        duration_seconds: Optional[float] = None,
        model_used: Optional[str] = "Gemini",
    ) -> Meeting:
        """Saves transcript, multi-level summary, action items, and participants to the database."""
        with get_db_session() as session:
            meeting = session.query(Meeting).filter(Meeting.id == meeting_id).first()
            if not meeting:
                raise ValueError(f"Meeting ID {meeting_id} not found.")

            cleaned = clean_transcript(raw_transcript)
            word_count = estimate_word_count(cleaned)

            # Update meeting header
            meeting.title = analysis.title
            meeting.status = MeetingStatus.COMPLETED
            meeting.duration_minutes = (
                analysis.duration_minutes
                or (transcription_result.duration_seconds / 60.0 if transcription_result and transcription_result.duration_seconds else None)
            )
            meeting.processing_time_seconds = duration_seconds

            # 1. Transcript
            has_diarization = 1 if (transcription_result and transcription_result.has_speaker_diarization) else 0
            transcript_entry = Transcript(
                meeting_id=meeting.id,
                raw_text=raw_transcript,
                cleaned_text=cleaned,
                word_count=word_count,
                has_speaker_labels=has_diarization,
                language=transcription_result.language if transcription_result else "en",
            )
            session.add(transcript_entry)

            # 2. Summary
            summary_entry = Summary(
                meeting_id=meeting.id,
                quick_summary=analysis.quick_summary,
                standard_summary=analysis.standard_summary,
                detailed_summary=analysis.detailed_summary,
                key_points=analysis.key_points,
                decisions=analysis.decisions,
                questions=analysis.questions,
                topics=analysis.topics,
                model_used=model_used,
            )
            session.add(summary_entry)

            # 3. Action Items
            for item in analysis.action_items:
                priority_enum = PriorityLevel.MEDIUM
                if hasattr(PriorityLevel, item.priority.upper()):
                    priority_enum = PriorityLevel[item.priority.upper()]

                action_item = ActionItem(
                    meeting_id=meeting.id,
                    task=item.task,
                    assignee=item.assignee,
                    deadline=item.deadline,
                    priority=priority_enum,
                    status=ActionItemStatus.PENDING,
                )
                session.add(action_item)

            # 4. Participants
            for p in analysis.participants:
                participant = Participant(
                    meeting_id=meeting.id,
                    name=p.name,
                    role=p.role,
                )
                session.add(participant)

            # 5. Log completion
            log_entry = ProcessingLog(
                meeting_id=meeting.id,
                step_name="Pipeline Completed",
                status="SUCCESS",
                duration_ms=int((duration_seconds or 0) * 1000),
                message=f"Meeting summarized successfully with {len(analysis.action_items)} action items.",
            )
            session.add(log_entry)
            session.flush()

            # Fully query and load all relationships for the returned object
            loaded_meeting = (
                session.query(Meeting)
                .options(
                    joinedload(Meeting.transcript),
                    joinedload(Meeting.summary),
                    joinedload(Meeting.action_items),
                    joinedload(Meeting.participants),
                    joinedload(Meeting.logs),
                )
                .filter(Meeting.id == meeting.id)
                .first()
            )

            logger.info(f"Successfully committed full analysis results for meeting ID={meeting_id}")
            return loaded_meeting

    @staticmethod
    def mark_meeting_failed(meeting_id: int, error_message: str) -> None:
        """Mark meeting as failed and log error."""
        with get_db_session() as session:
            meeting = session.query(Meeting).filter(Meeting.id == meeting_id).first()
            if meeting:
                meeting.status = MeetingStatus.FAILED
                log_entry = ProcessingLog(
                    meeting_id=meeting.id,
                    step_name="Pipeline Failure",
                    status="ERROR",
                    message=error_message,
                )
                session.add(log_entry)
                logger.error(f"Meeting ID {meeting_id} marked as FAILED: {error_message}")

    @staticmethod
    def get_meeting(meeting_id: int) -> Optional[Meeting]:
        """Fetch a single meeting with all related entities."""
        with get_db_session() as session:
            meeting = (
                session.query(Meeting)
                .options(
                    joinedload(Meeting.transcript),
                    joinedload(Meeting.summary),
                    joinedload(Meeting.action_items),
                    joinedload(Meeting.participants),
                    joinedload(Meeting.logs),
                )
                .filter(Meeting.id == meeting_id)
                .first()
            )
            return meeting

    @staticmethod
    def list_meetings(
        search_query: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Meeting]:
        """List meetings with optional search and filtering."""
        with get_db_session() as session:
            query = session.query(Meeting).options(
                joinedload(Meeting.summary),
                joinedload(Meeting.action_items),
                joinedload(Meeting.participants),
            )

            if status_filter and status_filter != "ALL":
                query = query.filter(Meeting.status == MeetingStatus(status_filter))

            if search_query and search_query.strip():
                term = f"%{search_query.strip()}%"
                query = query.outerjoin(Meeting.summary).outerjoin(Meeting.participants).outerjoin(Meeting.action_items)
                query = query.filter(
                    or_(
                        Meeting.title.ilike(term),
                        Meeting.source_filename.ilike(term),
                        Summary.quick_summary.ilike(term),
                        Summary.detailed_summary.ilike(term),
                        Participant.name.ilike(term),
                        ActionItem.task.ilike(term),
                        ActionItem.assignee.ilike(term),
                    )
                )

            query = query.order_by(desc(Meeting.created_at)).limit(limit).offset(offset)
            return query.all()

    @staticmethod
    def update_action_item(
        item_id: int,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[str] = None,
        deadline: Optional[str] = None,
        task: Optional[str] = None,
    ) -> Optional[ActionItem]:
        """Update action item details and status."""
        with get_db_session() as session:
            item = session.query(ActionItem).filter(ActionItem.id == item_id).first()
            if not item:
                return None

            if status and hasattr(ActionItemStatus, status):
                item.status = ActionItemStatus[status]
            if priority and hasattr(PriorityLevel, priority):
                item.priority = PriorityLevel[priority]
            if assignee is not None:
                item.assignee = assignee.strip() or "Not specified"
            if deadline is not None:
                item.deadline = deadline.strip() or "Not specified"
            if task is not None:
                item.task = task.strip()

            item.updated_at = datetime.utcnow()
            session.flush()
            logger.info(f"Updated ActionItem ID={item_id} (Status={item.status.value})")
            return item

    @staticmethod
    def delete_meeting(meeting_id: int) -> bool:
        """Deletes a meeting and all cascading records."""
        with get_db_session() as session:
            meeting = session.query(Meeting).filter(Meeting.id == meeting_id).first()
            if not meeting:
                return False
            session.delete(meeting)
            logger.info(f"Deleted meeting ID={meeting_id}")
            return True

    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        """Calculates global dashboard statistics."""
        with get_db_session() as session:
            total_meetings = session.query(Meeting).count()
            processed_meetings = session.query(Meeting).filter(Meeting.status == MeetingStatus.COMPLETED).count()
            pending_meetings = session.query(Meeting).filter(Meeting.status == MeetingStatus.PROCESSING).count()
            failed_meetings = session.query(Meeting).filter(Meeting.status == MeetingStatus.FAILED).count()

            total_action_items = session.query(ActionItem).count()
            pending_action_items = session.query(ActionItem).filter(ActionItem.status == ActionItemStatus.PENDING).count()
            in_progress_action_items = session.query(ActionItem).filter(ActionItem.status == ActionItemStatus.IN_PROGRESS).count()
            completed_action_items = session.query(ActionItem).filter(ActionItem.status == ActionItemStatus.COMPLETED).count()

            recent_meetings = (
                session.query(Meeting)
                .options(joinedload(Meeting.action_items))
                .order_by(desc(Meeting.created_at))
                .limit(5)
                .all()
            )

            recent_actions = (
                session.query(ActionItem)
                .options(joinedload(ActionItem.meeting))
                .filter(ActionItem.status != ActionItemStatus.COMPLETED)
                .order_by(desc(ActionItem.created_at))
                .limit(5)
                .all()
            )

            return {
                "total_meetings": total_meetings,
                "processed_meetings": processed_meetings,
                "pending_meetings": pending_meetings,
                "failed_meetings": failed_meetings,
                "total_action_items": total_action_items,
                "pending_action_items": pending_action_items,
                "in_progress_action_items": in_progress_action_items,
                "completed_action_items": completed_action_items,
                "recent_meetings": recent_meetings,
                "recent_actions": recent_actions,
            }

