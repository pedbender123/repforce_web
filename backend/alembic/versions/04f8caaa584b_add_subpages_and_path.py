"""add_subpages_and_path

Revision ID: 04f8caaa584b
Revises: ab28ed3f561e
Create Date: 2026-01-14 11:11:29.777884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '04f8caaa584b'
down_revision: Union[str, Sequence[str], None] = 'ab28ed3f561e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    context = op.get_context()
    try:
        # Debugging properties
        print(f"Context Opts: {context.opts}")
        scope = context.opts.get('x_arguments', {}).get('scope', 'system')
    except Exception as e:
        print(f"Error reading scope: {e}")
        scope = 'system' # Default to system to fail safe (or unsafe?)

    if scope == 'tenant':
        print(f"Skipping migration for tenant scope.")
        return

    print(f"Running migration for system scope.")

    # 1. Create meta_subpages
    op.create_table('meta_subpages',
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column('page_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=True, server_default="view"),
        sa.Column('icon', sa.String(), nullable=True, server_default="FileText"),
        sa.Column('config', sa.JSON(), nullable=True, server_default=sa.text("'{}'::json")),
        sa.Column('order', sa.Integer(), nullable=True, server_default="0"),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(['page_id'], ['meta_pages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Add path to meta_pages
    op.add_column('meta_pages', sa.Column('path', sa.String(), nullable=True))


def downgrade() -> None:
    context = op.get_context()
    scope = context.opts.get('x_arguments', {}).get('scope', 'system')
    
    if scope == 'tenant':
        return

    op.drop_column('meta_pages', 'path')
    op.drop_table('meta_subpages')
