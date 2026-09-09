import asyncio
from sqlalchemy.future import select
from backend.db.session import engine, Base, AsyncSessionLocal
from backend.db.models import User, Organization, ScraperProject, ScrapeJob, ExtractedRecord
from backend.core.security import get_password_hash

async def init_db():
    async with engine.begin() as conn:
        # Create all tables in database
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default user and demo scrapers if empty
    async with AsyncSessionLocal() as session:
        # Check user
        result = await session.execute(select(User).limit(1))
        user = result.scalars().first()
        if not user:
            org = Organization(name="Default Organization")
            session.add(org)
            await session.flush()

            admin = User(
                email="admin@webscraper.io",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
                organization_id=org.id
            )
            session.add(admin)

        # Check demo scrapers
        s_result = await session.execute(select(ScraperProject).limit(1))
        scraper = s_result.scalars().first()
        if not scraper:
            hn_scraper = ScraperProject(
                name="Hacker News Top Stories",
                description="Extracts top trending stories, URLs, and submission points from Hacker News.",
                start_url="https://news.ycombinator.com/",
                scraper_type="http",
                max_depth=1,
                extraction_schema={
                    "title": {"type": "css", "selector": "span.titleline > a", "attribute": "text"},
                    "link": {"type": "css", "selector": "span.titleline > a", "attribute": "href"},
                    "score": {"type": "css", "selector": "span.score", "attribute": "text"}
                }
            )
            session.add(hn_scraper)

            books_scraper = ScraperProject(
                name="Books to Scrape Catalog",
                description="Scrapes product titles, prices, and stock availability from Books to Scrape demo store.",
                start_url="https://books.toscrape.com/",
                scraper_type="http",
                max_depth=1,
                extraction_schema={
                    "title": {"type": "css", "selector": "article.product_pod h3 a", "attribute": "title"},
                    "price": {"type": "css", "selector": "article.product_pod p.price_color", "attribute": "text"},
                    "availability": {"type": "css", "selector": "article.product_pod p.instock", "attribute": "text"}
                }
            )
            session.add(books_scraper)

        await session.commit()
    print("Database tables provisioned and initial seed data created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
