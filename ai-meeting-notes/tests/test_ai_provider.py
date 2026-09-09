import pytest
from app.providers import MockAIProvider, MeetingAnalysisResult, ActionItemModel, ParticipantModel


def test_mock_ai_provider_structure(sample_transcript):
    provider = MockAIProvider(simulated_delay=0.0)
    result = provider.summarize(sample_transcript, user_title="Custom Meeting Title")

    assert isinstance(result, MeetingAnalysisResult)
    assert result.title == "Custom Meeting Title"
    assert len(result.quick_summary) > 0
    assert len(result.standard_summary) > 0
    assert len(result.detailed_summary) > 0
    assert len(result.key_points) > 0
    assert len(result.decisions) > 0
    assert len(result.action_items) > 0
    assert len(result.participants) > 0

    # Validate action item fields
    for item in result.action_items:
        assert isinstance(item, ActionItemModel)
        assert len(item.task) > 0
        assert item.priority in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_mock_ai_provider_chunking():
    provider = MockAIProvider(simulated_delay=0.0)
    summary = provider.summarize_chunk("Sample chunk content", 1, 3)
    assert "Section 1/3" in summary

