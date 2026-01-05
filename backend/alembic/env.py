import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy import text

from alembic import context

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Import configurations and models
from app.db.session import SQLALCHEMY_DATABASE_URL, Base, BaseCrm

# Import all models to ensure they are registered with the Bases
from app.db import models_system
from app.db import models_tenant
from app.db import models_metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)

target_metadata_system = Base.metadata
target_metadata_tenant = BaseCrm.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata_system, 
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def include_object_system(object, name, type_, reflected, compare_to):
    if type_ == "table":
        # Include system tables (schema='public') and shadow_backups (no schema but intended for system)
        # However, checking schema=='public' keeps explicit system tables.
        # ShadowBackup doesn't have schema set.
        # If we return True, it's included. 
        # But we rely on the migration script splitting execution.
        # include_object is for autogenerate primarily.
        pass
    return True

def include_object_tenant(object, name, type_, reflected, compare_to):
    return True

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # 1. System Migrations (Public)
        print("Migrating System (public schema)...")
        context.configure(
            connection=connection,
            target_metadata=target_metadata_system,
            version_table_schema="public",
            include_schemas=True,
            x_arguments={"scope": "system"} 
        )
        
        with context.begin_transaction():
            context.run_migrations()
            
        # 2. Tenant Migrations (All Tenants)
        try:
            result = connection.execute(text("SELECT slug FROM public.tenants"))
            tenants = result.fetchall()
            tenant_slugs = [row[0] for row in tenants]
        except Exception as e:
            print(f"Warning: Could not fetch tenants. Maybe table doesn't exist yet? Error: {e}")
            tenant_slugs = []

        for slug in tenant_slugs:
            safe_slug = slug.replace("-", "_")
            schema = f"tenant_{safe_slug}"
            print(f"Migrating Tenant: {slug} (Schema: {schema})...")
            
            connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema}\""))
            connection.execute(text(f"SET search_path TO \"{schema}\", public"))
            
            context.configure(
                connection=connection,
                target_metadata=target_metadata_tenant,
                version_table_schema=schema,
                include_schemas=False, 
                x_arguments={"scope": "tenant"}
            )
            
            with context.begin_transaction():
                context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
