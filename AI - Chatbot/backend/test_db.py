import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:root@127.0.0.1:5433/AI-Chatbot')
    res = await conn.fetch('SELECT * FROM chat')
    print(res)
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
