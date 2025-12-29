from logging.config import fileConfig
import sys
import os
from sqlalchemy import engine_from_config, pool, text

from alembic import context

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.database import BaseCrm
from app.db import models_tenant # Ensure CRM models are known

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = BaseCrm.metadata

# Set CRM database URL
# Use CRM_DATABASE_URL if available, else standard DATABASE_URL
crm_url = settings.CRM_DATABASE_URL or settings.DATABASE_URL
config.set_main_option("sqlalchemy.url", crm_url)

def include_object(object, name, type_, reflected, compare_to):
    # Only include tables present in BaseCrm metadata
    # This prevents Alembic from trying to drop System tables (users, tenants, etc.)
    if type_ == "table":
        if reflected and name not in target_metadata.tables:
            return False
    return True

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    # Get schema from -x tenant_schema=...
    x_args = context.get_x_argument(as_dictionary=True)
    tenant_schema = x_args.get("tenant_schema")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        version_table_schema=tenant_schema if tenant_schema else None
    )

    with context.begin_transaction():
        # If schema is specified, we might want to emit SET search_path (for SQL generation)
        if tenant_schema:
            context.execute(f"SET search_path TO {tenant_schema}")
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # Get schema from -x tenant_schema=...
        x_args = context.get_x_argument(as_dictionary=True)
        tenant_schema = x_args.get("tenant_schema")

        if tenant_schema:
            connection.execute(text(f"SET search_path TO {tenant_schema}"))

        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            include_object=include_object,
            version_table_schema=tenant_schema if tenant_schema else None
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
