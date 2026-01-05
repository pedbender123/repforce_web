
import os

content = r'''"""Init

Revision ID: 346ec68a36b2
Revises: 
Create Date: 2026-01-05 16:54:10.916628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '346ec68a36b2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    context = op.get_context()
    # SAFE SCOPE RETRIEVAL via opts
    x_args = context.opts.get('x_arguments', {})
    scope = x_args.get('scope', 'system')
    
    print(f"DEBUG: Running Upgrade with Scope={scope}")

    if scope == 'system':
        # 1. Tenants
        op.create_table('tenants',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('slug', sa.String(), nullable=True),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('status', sa.Enum('setup_pending', 'active', 'suspended', name='tenantstatus'), nullable=True),
            sa.Column('fiscal_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('plan_type', sa.String(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('commercial_info', sa.Text(), nullable=True),
            sa.Column('logo_url', sa.String(), nullable=True),
            sa.Column('demo_mode_start', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        op.create_index(op.f('ix_public_tenants_name'), 'tenants', ['name'], unique=False, schema='public')
        op.create_index(op.f('ix_public_tenants_slug'), 'tenants', ['slug'], unique=True, schema='public')

        # 2. Shadow Backups (System Wide)
        op.create_table('shadow_backups',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('tenant_slug', sa.String(), nullable=True),
            sa.Column('table_name', sa.String(), nullable=True),
            sa.Column('record_id', sa.String(), nullable=True),
            sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_shadow_backups_table_name'), 'shadow_backups', ['table_name'], unique=False)
        op.create_index(op.f('ix_shadow_backups_tenant_slug'), 'shadow_backups', ['tenant_slug'], unique=False)

        # 3. Roles
        op.create_table('roles',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('access_level', sa.Enum('GLOBAL', 'TEAM', 'OWN', name='accesslevel'), nullable=True),
            sa.Column('tenant_id', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        
        # 4. Global Users
        op.create_table('global_users',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('username', sa.String(), nullable=True),
            sa.Column('password_hash', sa.String(), nullable=True),
            sa.Column('recovery_email', sa.String(), nullable=True),
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('is_superuser', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('role_id', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['role_id'], ['public.roles.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        op.create_index(op.f('ix_public_global_users_username'), 'global_users', ['username'], unique=True, schema='public')

        # 5. Memberships
        op.create_table('memberships',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=True),
            sa.Column('tenant_id', sa.UUID(), nullable=True),
            sa.Column('role', sa.String(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['public.global_users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )

        # 6. Global Tasks
        op.create_table('global_tasks',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('title', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('is_completed', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('assignee_id', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['assignee_id'], ['public.global_users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        op.create_index(op.f('ix_public_global_tasks_title'), 'global_tasks', ['title'], unique=False, schema='public')

        # 7. Areas (System/Public Definition - usually 'areas' are tenant specific, but we have public specific areas?)
        # Models System declares Area with schema public.
        op.create_table('areas',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('icon', sa.String(), nullable=True),
            sa.Column('pages_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('tenant_id', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )

        # 8. Role Area Association
        op.create_table('role_area_association',
            sa.Column('role_id', sa.UUID(), nullable=True),
            sa.Column('area_id', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['area_id'], ['public.areas.id'], ),
            sa.ForeignKeyConstraint(['role_id'], ['public.roles.id'], ),
            schema='public'
        )

        # 9. Invites
        op.create_table('invites',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('code', sa.String(), nullable=True),
            sa.Column('email', sa.String(), nullable=True),
            sa.Column('tenant_id', sa.UUID(), nullable=True),
            sa.Column('role', sa.String(), nullable=True),
            sa.Column('expires_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        op.create_index(op.f('ix_public_invites_code'), 'invites', ['code'], unique=True, schema='public')

        # 10. API Keys
        op.create_table('api_keys',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('key', sa.String(), nullable=True),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('tenant_id', sa.UUID(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('scopes', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        op.create_index(op.f('ix_public_api_keys_key'), 'api_keys', ['key'], unique=True, schema='public')

        # 11. User Preferences
        op.create_table('user_grid_preferences',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=True),
            sa.Column('grid_id', sa.String(), nullable=True),
            sa.Column('columns_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['public.global_users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            schema='public'
        )
        op.create_index(op.f('ix_public_user_grid_preferences_grid_id'), 'user_grid_preferences', ['grid_id'], unique=False, schema='public')

    if scope == 'tenant':
        # 1. Areas (Tenant specific)
        op.create_table('areas',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('slug', sa.String(), nullable=True),
            sa.Column('icon', sa.String(), nullable=True),
            sa.Column('order', sa.Integer(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('pages_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_areas_name'), 'areas', ['name'], unique=False)
        op.create_index(op.f('ix_areas_slug'), 'areas', ['slug'], unique=True)

        # 2. Brands
        op.create_table('brands',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

        # 3. Clients
        op.create_table('clients',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=False)

        # 4. Custom Fields
        op.create_table('custom_fields_config',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('entity', sa.String(), nullable=True),
            sa.Column('key', sa.String(), nullable=True),
            sa.Column('label', sa.String(), nullable=True),
            sa.Column('type', sa.String(), nullable=True),
            sa.Column('options', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('required', sa.Boolean(), nullable=True),
            sa.Column('order_index', sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_custom_fields_config_entity'), 'custom_fields_config', ['entity'], unique=False)
        op.create_index(op.f('ix_custom_fields_config_key'), 'custom_fields_config', ['key'], unique=False)

        # 5. Discount Rules
        op.create_table('discount_rules',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('effect', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('type', sa.String(), nullable=True),
            sa.Column('discount_percent', sa.Float(), nullable=True),
            sa.Column('active', sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

        # 6. Product Categories
        op.create_table('products_categories',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

        # 7. Suppliers
        op.create_table('suppliers',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('email', sa.String(), nullable=True),
            sa.Column('phone', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

        # 8. Webhook Subscriptions
        op.create_table('webhook_subscriptions',
            sa.Column('event_type', sa.String(), nullable=False),
            sa.Column('target_url', sa.String(), nullable=True),
            sa.Column('active', sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint('event_type')
        )
        
        # 9. Table Definitions (Metadata)
        op.create_table('table_definitions',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('display_name', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('icon', sa.String(), nullable=True),
            sa.Column('is_system', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_table_definitions_name'), 'table_definitions', ['name'], unique=False)

        # 10. Tasks
        op.create_table('tasks',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('title', sa.String(), nullable=True),
            sa.Column('status', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

        # 11. Products (Depends on brands, suppliers, categories)
        op.create_table('products',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('sku', sa.String(), nullable=True),
            sa.Column('price', sa.Float(), nullable=True),
            sa.Column('specs', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('category_id', sa.UUID(), nullable=True),
            sa.Column('brand_id', sa.UUID(), nullable=True),
            sa.Column('supplier_id', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['brand_id'], ['brands.id'], ),
            sa.ForeignKeyConstraint(['category_id'], ['products_categories.id'], ),
            sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)

        # 12. Field Definitions (Depends on table_definitions)
        op.create_table('field_definitions',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('table_id', sa.UUID(), nullable=True),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('display_name', sa.String(), nullable=True),
            sa.Column('field_type', sa.Enum('TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'RELATION', 'IMAGE', 'FILE', 'FORMULA', 'LOOKUP', name='fieldtype'), nullable=True),
            sa.Column('is_required', sa.Boolean(), nullable=True),
            sa.Column('is_unique', sa.Boolean(), nullable=True),
            sa.Column('is_system', sa.Boolean(), nullable=True),
            sa.Column('default_value', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('options', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.ForeignKeyConstraint(['table_id'], ['table_definitions.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_field_definitions_name'), 'field_definitions', ['name'], unique=False)

        # 13. View Definitions (Depends on table_definitions)
        op.create_table('view_definitions',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('table_id', sa.UUID(), nullable=True),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('view_type', sa.String(), nullable=True),
            sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('is_default', sa.Boolean(), nullable=True),
            sa.Column('is_system', sa.Boolean(), nullable=True),
            sa.ForeignKeyConstraint(['table_id'], ['table_definitions.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

        # 14. Orders (Depends on clients)
        op.create_table('orders',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('client_id', sa.UUID(), nullable=True),
            sa.Column('representative_id', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(), nullable=True),
            sa.Column('total_value', sa.Float(), nullable=True),
            sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_orders_status'), 'orders', ['status'], unique=False)

        # 15. Order Items
        op.create_table('order_items',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('order_id', sa.UUID(), nullable=True),
            sa.Column('product_id', sa.UUID(), nullable=True),
            sa.Column('quantity', sa.Float(), nullable=True),
            sa.Column('unit_price', sa.Float(), nullable=True),
            sa.Column('net_unit_price', sa.Float(), nullable=True),
            sa.Column('total', sa.Float(), nullable=True),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    """Downgrade schema."""
    context = op.get_context()
    x_args = context.opts.get('x_arguments', {})
    scope = x_args.get('scope', 'system')

    if scope == 'tenant':
        op.drop_table('order_items')
        op.drop_table('orders')
        op.drop_table('view_definitions')
        op.drop_table('field_definitions')
        op.drop_table('products')
        op.drop_table('tasks')
        op.drop_table('table_definitions')
        op.drop_table('webhook_subscriptions')
        op.drop_table('suppliers')
        op.drop_table('products_categories')
        op.drop_table('discount_rules')
        op.drop_table('custom_fields_config')
        op.drop_table('clients')
        op.drop_table('brands')
        op.drop_table('areas')

    if scope == 'system':
        op.drop_table('user_grid_preferences', schema='public')
        op.drop_table('api_keys', schema='public')
        op.drop_table('invites', schema='public')
        op.drop_table('role_area_association', schema='public')
        op.drop_table('areas', schema='public')
        op.drop_table('global_tasks', schema='public')
        op.drop_table('memberships', schema='public')
        op.drop_table('global_users', schema='public')
        op.drop_table('roles', schema='public')
        op.drop_table('shadow_backups')
        op.drop_table('tenants', schema='public')
'''

# Use relative path inside the container
filepath = "/app/alembic/versions/346ec68a36b2_init.py"

try:
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Successfully overwrote {filepath}")
except Exception as e:
    print(f"Error overwriting file: {e}")
