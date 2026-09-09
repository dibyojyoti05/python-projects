import pytest
from app.services.meeting_service import MeetingService
from app.providers import MockAIProvider
from app.database import ActionItemStatus, PriorityLevel


def test_meeting_service_flow(sample_transcript):
    ai = MockAIProvider(simulated_delay=0.0)
    analysis = ai.summarize(sample_transcript, user_title="Sprint 12 Sync")

    # 1. Create meeting record
    m_id = MeetingService.create_or_update_meeting_record(
        source_filename="sprint12.txt",
        file_type="text",
        file_hash="testhash123456",
        file_size_bytes=1024,
        user_title="Sprint 12 Sync"
    )
    assert m_id > 0

    # 2. Save analysis
    meeting = MeetingService.save_analysis_results(
        meeting_id=m_id,
        raw_transcript=sample_transcript,
        analysis=analysis,
        duration_seconds=1.2,
        model_used="MockAI"
    )
    assert meeting.title == "Sprint 12 Sync"
    assert len(meeting.action_items) > 0

    # 3. Test find by hash
    cached = MeetingService.find_meeting_by_hash("testhash123456")
    assert cached is not None
    assert cached.id == m_id

    # 4. Test update action item
    action_item = meeting.action_items[0]
    updated = MeetingService.update_action_item(
        item_id=action_item.id,
        status="COMPLETED",
        priority="CRITICAL",
        assignee="Updated Assignee"
    )
    assert updated.status == ActionItemStatus.COMPLETED
    assert updated.priority == PriorityLevel.CRITICAL
    assert updated.assignee == "Updated Assignee"

    # 5. Test search
    search_results = MeetingService.list_meetings(search_query="Sprint 12")
    assert len(search_results) >= 1

    # 6. Test delete
    deleted = MeetingService.delete_meeting(m_id)
    assert deleted is True
    assert MeetingService.get_meeting(m_id) is None

