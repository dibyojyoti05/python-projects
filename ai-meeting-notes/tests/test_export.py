import pytest
from app.services.meeting_service import MeetingService
from app.services.export_service import ExportService
from app.providers import MockAIProvider


def test_export_all_formats(sample_transcript):
    ai = MockAIProvider(simulated_delay=0.0)
    analysis = ai.summarize(sample_transcript, user_title="Export Test Meeting")

    m_id = MeetingService.create_or_update_meeting_record(
        source_filename="test.txt",
        file_type="text",
        file_hash="exporthash123",
        file_size_bytes=500,
        user_title="Export Test Meeting"
    )

    MeetingService.save_analysis_results(
        meeting_id=m_id,
        raw_transcript=sample_transcript,
        analysis=analysis,
        duration_seconds=1.0,
        model_used="Mock"
    )

    meeting = MeetingService.get_meeting(m_id)

    # 1. Markdown Export
    md = ExportService.export_to_markdown(meeting)
    assert "# Export Test Meeting" in md
    assert "Executive Summary" in md
    assert "Action Items" in md

    # 2. TXT Export
    txt = ExportService.export_to_txt(meeting)
    assert "MEETING SUMMARY: EXPORT TEST MEETING" in txt
    assert "ACTION ITEMS:" in txt

    # 3. DOCX Export
    docx_bytes = ExportService.export_to_docx_bytes(meeting)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 500

    # 4. PDF Export
    pdf_bytes = ExportService.export_to_pdf_bytes(meeting)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

