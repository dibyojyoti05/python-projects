import pytest
from app.services.email.base import EmailMessageData
from datetime import datetime, timezone

def test_email_parsing_model():
    """Verify that EmailMessageData correctly handles fields."""
    msg = EmailMessageData(
        message_id="1234",
        sender="test@example.com",
        recipients=["user@mailmind.com"],
        subject="Test Parsing",
        body_text="This is a test body.",
        body_html="<p>This is a test body.</p>",
        date=datetime.now(timezone.utc)
    )
    
    assert msg.message_id == "1234"
    assert msg.sender == "test@example.com"
    assert "user@mailmind.com" in msg.recipients
    assert msg.subject == "Test Parsing"
