"""fix_cascade_delete_on_tenant_fks

Revision ID: 9fe072cbcef8
Revises: 4aec44cd6a9b
Create Date: 2026-01-12 09:18:59.794466

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fe072cbcef8'
down_revision: Union[str, Sequence[str], None] = '4aec44cd6a9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
