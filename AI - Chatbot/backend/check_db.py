import asyncio
import asyncpg
import sys

async def main():
    port = sys.argv[1]
    try:
        conn = await asyncpg.connect(user='postgres', password='root', database='postgres', host='127.0.0.1', port=port)
        print(f"Connected on port {port}")
        
        # Check if AI-Chatbot DB exists
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'AI-Chatbot'")
        if not exists:
            print("Creating database 'AI-Chatbot'...")
            # We can't run CREATE DATABASE inside a transaction block in asyncpg easily without setting autocommit
            # But asyncpg doesn't have autocommit, we just execute it
            await conn.execute('CREATE DATABASE "AI-Chatbot"')
            print("Database created.")
        else:
            print("Database 'AI-Chatbot' already exists.")
            
        await conn.close()
    except Exception as e:
        print(f"Failed on port {port}: {e}")

if __name__ == '__main__':
    asyncio.run(main())
