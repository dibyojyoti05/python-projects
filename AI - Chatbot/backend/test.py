import asyncio
import asyncpg

async def run():
    try:
        conn = await asyncpg.connect('postgresql://postgres:root@127.0.0.1:5433/AI-Chatbot')
        print(await conn.fetch('SELECT * FROM users;'))
        await conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    asyncio.run(run())
