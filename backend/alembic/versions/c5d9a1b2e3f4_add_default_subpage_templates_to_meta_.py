"""add_default_subpage_templates_to_meta_page

Revision ID: c5d9a1b2e3f4
Revises: 962eff4d87ae
Create Date: 2026-01-14 15:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c5d9a1b2e3f4'
down_revision = '962eff4d87ae'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to meta_pages
    op.add_column('meta_pages', sa.Column('default_detail_subpage_id', postgresql.UUID(as_uuid=True), nullable=True), schema='public')
    op.add_column('meta_pages', sa.Column('default_form_subpage_id', postgresql.UUID(as_uuid=True), nullable=True), schema='public')
    
    # Add foreign key constraints
    op.create_foreign_key(
        'fk_meta_pages_default_detail_subpage',
        'meta_pages', 'meta_subpages',
        ['default_detail_subpage_id'], ['id'],
        source_schema='public', referent_schema='public',
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_meta_pages_default_form_subpage',
        'meta_pages', 'meta_subpages',
        ['default_form_subpage_id'], ['id'],
        source_schema='public', referent_schema='public',
        ondelete='SET NULL'
    )


def downgrade():
    # Drop foreign keys
    op.drop_constraint('fk_meta_pages_default_form_subpage', 'meta_pages', schema='public', type_='foreignkey')
    op.drop_constraint('fk_meta_pages_default_detail_subpage', 'meta_pages', schema='public', type_='foreignkey')
    
    # Drop columns
    op.drop_column('meta_pages', 'default_form_subpage_id', schema='public')
    op.drop_column('meta_pages', 'default_detail_subpage_id', schema='public')
