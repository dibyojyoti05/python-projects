import pytest
from app.database import (
    get_db_session,
    Meeting,
    Transcript,
    Summary,
    ActionItem,
    Participant,
    MeetingStatus,
    PriorityLevel,
    ActionItemStatus,
)


def test_database_crud_and_relationships():
    with get_db_session() as session:
        # Create meeting
        m = Meeting(
            title="Design Review",
            source_filename="design_review.txt",
            file_type="text",
            status=MeetingStatus.COMPLETED
        )
        session.add(m)
        session.flush()

        # Add transcript
        t = Transcript(meeting_id=m.id, raw_text="Design discussion...")
        session.add(t)

        # Add summary
        s = Summary(meeting_id=m.id, quick_summary="Quick review.", key_points=["Point 1"])
        session.add(s)

        # Add action items
        a1 = ActionItem(
            meeting_id=m.id,
            task="Update figma tokens",
            assignee="Lucas",
            priority=PriorityLevel.HIGH,
            status=ActionItemStatus.PENDING
        )
        session.add(a1)

        # Add participant
        p1 = Participant(meeting_id=m.id, name="Lucas", role="Designer")
        session.add(p1)

    # Read back and verify cascade
    with get_db_session() as session:
        meeting = session.query(Meeting).filter(Meeting.title == "Design Review").first()
        assert meeting is not None
        assert meeting.transcript.raw_text == "Design discussion..."
        assert meeting.summary.quick_summary == "Quick review."
        assert len(meeting.action_items) == 1
        assert meeting.action_items[0].assignee == "Lucas"
        assert len(meeting.participants) == 1

        # Delete meeting
        session.delete(meeting)

    # Verify cascading delete
    with get_db_session() as session:
        assert session.query(Meeting).count() == 0
        assert session.query(Transcript).count() == 0
        assert session.query(Summary).count() == 0
        assert session.query(ActionItem).count() == 0
        assert session.query(Participant).count() == 0

