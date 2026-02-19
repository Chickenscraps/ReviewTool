import psycopg2
import os

DB_URL = "postgresql://postgres:Socktop88!@db.ztixihgacithgnghymau.supabase.co:5432/postgres"

try:
    print(f"Connecting to {DB_URL.split('@')[1]}...")
    conn = psycopg2.connect(DB_URL)
    print("Successfully connected!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone())
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
