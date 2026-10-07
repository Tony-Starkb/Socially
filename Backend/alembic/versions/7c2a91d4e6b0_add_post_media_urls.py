"""add media URLs to posts

Revision ID: 7c2a91d4e6b0
Revises: 48c89517daee
Create Date: 2026-10-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c2a91d4e6b0"
down_revision: Union[str, Sequence[str], None] = "48c89517daee"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("posts", sa.Column("media_urls", sa.JSON(), nullable=True))
    op.execute(
        "UPDATE posts SET media_urls = json_build_array(image_url) "
        "WHERE media_urls IS NULL"
    )
    op.alter_column("posts", "media_urls", nullable=False)


def downgrade() -> None:
    op.drop_column("posts", "media_urls")