from sqlalchemy import text
from app.shared.database import engine

class SchemaManager:
    @staticmethod
    def map_type_to_sql(field_type: str):
        mapping = {
            "text": "TEXT",
            "long_text": "TEXT",
            "number": "NUMERIC",
            "integer": "INTEGER",
            "boolean": "BOOLEAN",
            "date": "TIMESTAMP",
            "currency": "NUMERIC(15, 2)",
            "select": "TEXT",
            "whatsapp": "TEXT",
            "email": "TEXT",
            "phone": "TEXT"
        }
        return mapping.get(field_type, "TEXT")

    @classmethod
    def create_table(cls, tenant_schema: str, table_slug: str):
        table_name = f'"{tenant_schema}"."{table_slug}"'
        ddl = f"""
        CREATE SCHEMA IF NOT EXISTS "{tenant_schema}";
        CREATE TABLE IF NOT EXISTS {table_name} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id INTEGER, 
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
        """
        # Note: tenant_id in the physical table might be redundant if we use schema isolation, 
        # but spec mentioned it. We'll use INTEGER or UUID depending on Global Tenant ID type. 
        # Global Tenant ID is UUID. Let's use UUID for consistency if we link back.
        # But wait, spec said "tenant_id INT". Assuming legacy compatibility or simple FK. 
        # Since our Tenant ID is UUID, let's use UUID.
        
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()

    @classmethod
    def add_column(cls, tenant_schema: str, table_slug: str, column_name: str, field_type: str, is_required: bool = False):
        table_name = f'"{tenant_schema}"."{table_slug}"'
        sql_type = cls.map_type_to_sql(field_type)
        nullable = "NOT NULL" if is_required else "NULL"
        
        ddl = f'ALTER TABLE {table_name} ADD COLUMN "{column_name}" {sql_type} {nullable};'
        
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()

    @classmethod
    def rename_table(cls, tenant_schema: str, old_slug: str, new_slug: str):
        old_name = f'"{tenant_schema}"."{old_slug}"'
        new_name = f'"{tenant_schema}"."{new_slug}"'
        
        # PostgreSQL syntax: ALTER TABLE schema.old_name RENAME TO new_name
        # Note: "new_name" in RENAME TO should NOT include schema
        ddl = f'ALTER TABLE {old_name} RENAME TO "{new_slug}";'
        
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()

    @classmethod
    def drop_table(cls, tenant_schema: str, table_slug: str):
        table_name = f'"{tenant_schema}"."{table_slug}"'
        ddl = f'DROP TABLE IF EXISTS {table_name} CASCADE;'
        
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()

    @classmethod
    def rename_column(cls, tenant_schema: str, table_slug: str, old_name: str, new_name: str):
        table_name = f'"{tenant_schema}"."{table_slug}"'
        ddl = f'ALTER TABLE {table_name} RENAME COLUMN "{old_name}" TO "{new_name}";'
        
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()

    @classmethod
    def drop_column(cls, tenant_schema: str, table_slug: str, column_name: str):
        table_name = f'"{tenant_schema}"."{table_slug}"'
        ddl = f'ALTER TABLE {table_name} DROP COLUMN IF EXISTS "{column_name}";'
        
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()

    @classmethod
    def drop_schema(cls, tenant_schema: str):
        """Drops the entire schema and all its objects."""
        ddl = f'DROP SCHEMA IF EXISTS "{tenant_schema}" CASCADE;'
        with engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()
