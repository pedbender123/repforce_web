from app.shared.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS public.meta_workflows CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS public.meta_pages CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS public.meta_navigation_groups CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS public.meta_views CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS public.entity_records CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS public.meta_fields CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS public.meta_entities CASCADE"))
    conn.commit()
    print("Metadata tables dropped.")
