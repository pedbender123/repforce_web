"""Add formula support to meta_fields

Revision ID: 7e1fcc52fa86
Revises: 346ec68a36b2
Create Date: 2026-01-11 18:45:16.748825

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e1fcc52fa86'
down_revision: Union[str, Sequence[str], None] = '346ec68a36b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [x['name'] for x in inspector.get_columns('meta_fields', schema='public')]
    
    if 'formula' not in columns:
        op.add_column('meta_fields', sa.Column('formula', sa.String(), nullable=True), schema='public')
    
    if 'is_virtual' not in columns:
        op.add_column('meta_fields', sa.Column('is_virtual', sa.Boolean(), server_default='false', nullable=True), schema='public')


def downgrade() -> None:
    op.drop_column('meta_fields', 'is_virtual', schema='public')
    op.drop_column('meta_fields', 'formula', schema='public')
