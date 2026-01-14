"""add config to meta_navigation_groups

Revision ID: 962eff4d87ae
Revises: 04f8caaa584b
Create Date: 2026-01-14 13:57:49.710594

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '962eff4d87ae'
down_revision: Union[str, Sequence[str], None] = '04f8caaa584b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
