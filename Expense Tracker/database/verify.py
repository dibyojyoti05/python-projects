import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5433,
    user='postgres',
    password='root',
    dbname='expense_tracker'
)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
tables = [row[0] for row in cur.fetchall()]
print("Tables in expense_tracker:", tables)
cur.close()
conn.close()
