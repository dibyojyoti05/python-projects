import pytest
from app.services import (
    FileService,
    SummarizationService,
    TranscriptionService,
    MeetingService,
    ExportService,
)
from app.providers import MockAIProvider, MockTranscriptionProvider
from app.database import MeetingStatus


def test_full_pipeline_text_file(tmp_path, sample_transcript):
    # 1. Create a mock uploaded text file
    txt_file = tmp_path / "engineering_sync.txt"
    txt_file.write_text(sample_transcript, encoding="utf-8")

    # 2. Extract Text
    extracted_text = FileService.extract_text_from_file(txt_file)
    assert len(extracted_text) > 0

    # 3. Create Meeting Record
    m_id = MeetingService.create_or_update_meeting_record(
        source_filename=txt_file.name,
        file_type="text",
        file_hash="full_pipeline_hash_1",
        file_size_bytes=len(sample_transcript.encode("utf-8")),
        user_title="Engineering Sync"
    )

    # 4. AI Summarization with Mock Provider
    sum_service = SummarizationService(provider=MockAIProvider(simulated_delay=0.0))
    analysis = sum_service.analyze_meeting(raw_transcript=extracted_text, user_title="Engineering Sync")

    # 5. Save Results
    meeting = MeetingService.save_analysis_results(
        meeting_id=m_id,
        raw_transcript=extracted_text,
        analysis=analysis,
        duration_seconds=0.5,
        model_used="MockAI-Testing"
    )

    assert meeting.status == MeetingStatus.COMPLETED
    assert len(meeting.action_items) > 0

    # 6. Verify Dashboard Metrics
    metrics = MeetingService.get_dashboard_metrics()
    assert metrics["total_meetings"] >= 1
    assert metrics["processed_meetings"] >= 1

    # 7. Verify Multi-format Export
    pdf_bytes = ExportService.export_to_pdf_bytes(meeting)
    assert len(pdf_bytes) > 0
    docx_bytes = ExportService.export_to_docx_bytes(meeting)
    assert len(docx_bytes) > 0


def test_full_pipeline_audio_file(tmp_path):
    # 1. Create dummy audio file
    dummy_audio = tmp_path / "mock_meeting.mp3"
    dummy_audio.write_bytes(b"ID3" + b"\x00" * 500)

    # 2. Transcribe via MockTranscriptionProvider
    trans_service = TranscriptionService(provider=MockTranscriptionProvider(simulated_delay=0.0))
    trans_result = trans_service.process_media_file(dummy_audio)

    assert len(trans_result.raw_text) > 0
    assert len(trans_result.segments) > 0

    # 3. AI Summarization
    sum_service = SummarizationService(provider=MockAIProvider(simulated_delay=0.0))
    analysis = sum_service.analyze_meeting(raw_transcript=trans_result.raw_text, user_title="Mock Audio Meeting")

    # 4. Save to database
    m_id = MeetingService.create_or_update_meeting_record(
        source_filename=dummy_audio.name,
        file_type="audio",
        file_hash="mock_audio_hash_99",
        file_size_bytes=len(dummy_audio.read_bytes()),
        user_title="Mock Audio Meeting"
    )

    meeting = MeetingService.save_analysis_results(
        meeting_id=m_id,
        raw_transcript=trans_result.raw_text,
        analysis=analysis,
        transcription_result=trans_result,
        duration_seconds=0.8,
        model_used="MockAI"
    )

    assert meeting.status == MeetingStatus.COMPLETED
    assert meeting.duration_minutes is not None

