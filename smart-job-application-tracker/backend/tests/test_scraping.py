from app.services.scraping.dummy import DummySource
from app.services.scraping.engine import ScrapingEngine
from app.models.job import Job

def test_scraping_engine_deduplication(db_session):
    provider = DummySource()
    engine = ScrapingEngine(db=db_session, providers=[provider])

    # First run saves 1 job
    count1 = engine.run(keyword="React", location="Remote")
    assert count1 == 1

    # Second run should identify duplicate and save 0
    count2 = engine.run(keyword="React", location="Remote")
    assert count2 == 0

    total = db_session.query(Job).count()
    assert total == 1
