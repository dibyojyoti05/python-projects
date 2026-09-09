import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5433,
        user="postgres",
        password="root",
        dbname="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'library_db';")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE library_db;")
        print("Database 'library_db' created successfully.")
    else:
        print("Database 'library_db' already exists.")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    create_database()
