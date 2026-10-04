import asyncio
import asyncpg
async def main():
    try:
        url = 'postgresql://postgres.hwnevuyeoskoxcrcwnjc:%40Mj012000%21%40%23@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
        conn = await asyncpg.connect(url, timeout=5, statement_cache_size=0)
        users = await conn.fetch('SELECT * FROM users')
        print(f'Total users: {len(users)}')
        for u in users:
            print(f"ID: {u['user_id']}, referred_by: {u['referred_by']}")
        await conn.close()
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(main())
