import sys
import os
sys.path.append(os.getcwd())
from app.db.session import engine, Base
from app.db import models_system
from sqlalchemy import text

def create_tasks_table():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS public.global_tasks (
                id UUID PRIMARY KEY,
                title VARCHAR,
                description VARCHAR,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                assignee_id UUID REFERENCES public.global_users(id)
            );
        """))
        conn.commit()
    print("Table global_tasks created.")

if __name__ == "__main__":
    create_tasks_table()
