"""add_meta_trails

Revision ID: ab28ed3f561e
Revises: 7e1fcc52fa86
Create Date: 2026-01-12 14:03:50.526022

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab28ed3f561e'
down_revision: Union[str, Sequence[str], None] = '7e1fcc52fa86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
