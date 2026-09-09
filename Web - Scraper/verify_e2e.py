import sys
import os
import asyncio
import io
import csv
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.db.session import AsyncSessionLocal
from backend.db.models import ScraperProject, ScrapeJob, ExtractedRecord
from sqlalchemy.future import select
from sqlalchemy import func

async def run_e2e():
    print("==================================================")
    print("  Enterprise Web Scraper - End-to-End Verification")
    print("==================================================")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check & Root
        print("\n[1/6] Checking Platform API Health...")
        r = await client.get("/")
        assert r.status_code == 200, f"Root endpoint failed: {r.text}"
        print(f"  -> Root status: {r.json()['status']}")

        # 2. Database Stats Check
        print("\n[2/6] Checking PostgreSQL Dashboard Stats...")
        r = await client.get("/api/v1/dashboard/stats")
        assert r.status_code == 200, f"Stats failed: {r.text}"
        stats = r.json()
        print(f"  -> Total Scrapers in DB: {stats['total_scrapers']}")
        print(f"  -> Stored Extracted Records: {stats['extracted_records_total']}")
        print(f"  -> Success Rate: {stats['success_rate']}%")

        # 3. Google Gemini AI Selector Generation
        print("\n[3/6] Testing Google Gemini AI Selector Generator...")
        html_snippet = """
        <div class="product-item">
            <h1 class="main-title">Apple MacBook Pro M3</h1>
            <span class="price-val">$1,999.00</span>
            <a class="product-link" href="/shop/macbook-pro">View Details</a>
        </div>
        """
        r = await client.post("/api/v1/ai/suggest-selectors", json={
            "html_snippet": html_snippet,
            "target_fields": ["title", "price", "link"]
        })
        assert r.status_code == 200, f"Gemini selector generation failed: {r.text}"
        selectors = r.json()
        print(f"  -> Gemini Suggested Selectors: {selectors}")
        assert "title" in selectors and "price" in selectors

        # 4. Google Gemini Copilot
        print("\n[4/6] Testing Google Gemini Scraping Copilot...")
        r = await client.post("/api/v1/ai/copilot", json={
            "prompt": "Give 1 golden rule for polite, respectful web crawling."
        })
        assert r.status_code == 200, f"Copilot failed: {r.text}"
        print(f"  -> Gemini Copilot Reply:\n     {r.json()['response'][:140]}...")

        # 5. Create Scraper & Execute Live Scrape Job
        print("\n[5/6] Creating New Scraper Project and Executing Live Scrape...")
        new_scraper = {
            "name": "E2E Verified Quotes Scraper",
            "description": "Automated verification target for Quotes to Scrape",
            "start_url": "https://quotes.toscrape.com/",
            "scraper_type": "http",
            "max_depth": 1,
            "extraction_schema": {
                "quote": {"type": "css", "selector": "div.quote span.text", "attribute": "text"},
                "author": {"type": "css", "selector": "div.quote small.author", "attribute": "text"}
            }
        }
        r = await client.post("/api/v1/scrapers/", json=new_scraper)
        assert r.status_code == 201, f"Failed to create scraper: {r.text}"
        created_scraper = r.json()
        scraper_id = created_scraper["id"]
        print(f"  -> Scraper Project created: {created_scraper['name']} (ID: {scraper_id})")

        # Trigger Job
        r = await client.post(f"/api/v1/jobs/{scraper_id}/run")
        assert r.status_code == 200, f"Trigger job failed: {r.text}"
        job_id = r.json()["id"]
        print(f"  -> Triggered Background Job ID: {job_id}")

        # Wait for background task to complete
        for _ in range(20):
            await asyncio.sleep(1)
            r = await client.get(f"/api/v1/jobs/{job_id}")
            job_status = r.json()["status"]
            if job_status in ("completed", "failed"):
                break

        print(f"  -> Job Status: {job_status} | Rows: {r.json()['extracted_records_count']} | Duration: {r.json()['duration_ms']}ms")
        assert job_status == "completed", f"Job did not complete: {r.json()}"
        assert r.json()["extracted_records_count"] > 0, "No records extracted"

        # 6. Verify Records and Export Download
        print("\n[6/6] Verifying PostgreSQL Records and File Exports...")
        r = await client.get(f"/api/v1/jobs/{job_id}/records")
        assert r.status_code == 200, f"Get records failed: {r.text}"
        records = r.json()
        print(f"  -> Retrieved {len(records)} records from PostgreSQL:")
        print(f"     Sample #1: {records[0]['data']}")

        # CSV Export
        r_csv = await client.get(f"/api/v1/jobs/{job_id}/export?format=csv")
        assert r_csv.status_code == 200, f"CSV export failed: {r_csv.text}"
        assert "quote" in r_csv.text and "author" in r_csv.text
        print(f"  -> CSV Export successfully streamed ({len(r_csv.text)} bytes)")

        # JSON Export
        r_json = await client.get(f"/api/v1/jobs/{job_id}/export?format=json")
        assert r_json.status_code == 200, f"JSON export failed: {r_json.text}"
        print(f"  -> JSON Export successfully streamed ({len(r_json.text)} bytes)")

        # Cleanup
        await client.delete(f"/api/v1/scrapers/{scraper_id}")
        print("  -> Cleaned up temporary verification scraper.")

    print("\n==================================================")
    print("  ALL END-TO-END VERIFICATION CHECKS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_e2e())
