import asyncio
import asyncpg
from app.core.config import settings

async def migrate():
    print(f"Connecting to PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}...")
    conn = await asyncpg.connect(
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        database=settings.POSTGRES_DB
    )
    
    print("Executing safe schema updates...")
    
    # 1. Update jobs table with new columns if not present
    await conn.execute("""
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_cgpa DOUBLE PRECISION DEFAULT 0.0;
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_backlogs INTEGER DEFAULT 0;
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS eligible_branches VARCHAR;
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    """)
    print("  [OK] Jobs table updated with deadline and eligibility columns.")

    # 2. Update applications table with new columns if not present
    await conn.execute("""
        ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ;
        ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_link VARCHAR;
        ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_round VARCHAR;
    """)
    print("  [OK] Applications table updated with interview scheduling columns.")

    # 3. Add Unique Constraint on applications(job_id, student_id) safely
    try:
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'uq_job_student_application'
                ) THEN
                    ALTER TABLE applications ADD CONSTRAINT uq_job_student_application UNIQUE (job_id, student_id);
                END IF;
            END $$;
        """)
        print("  [OK] Unique constraint on applications(job_id, student_id) ensured.")
    except Exception as e:
        print(f"  Notice on unique constraint: {e}")

    # 4. Create notifications table if not exists
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR NOT NULL,
            message TEXT NOT NULL,
            link VARCHAR,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id);
    """)
    print("  [OK] Notifications table created.")

    # 5. Verify all tables in placement_db
    rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
    print("\nVerified tables in placement_db:")
    for r in rows:
        print(f"  - {r['table_name']}")

    await conn.close()
    print("\nDatabase migration completed 100% successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
