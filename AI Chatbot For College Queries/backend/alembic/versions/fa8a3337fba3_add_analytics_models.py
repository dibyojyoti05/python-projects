"""Add analytics models

Revision ID: fa8a3337fba3
Revises: fa681205e6fa
Create Date: 2026-08-09 20:33:24.333161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa8a3337fba3'
down_revision: Union[str, None] = 'fa681205e6fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('unanswered_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('conversation_id', sa.Integer(), nullable=True),
        sa.Column('resolved', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_unanswered_questions_id'), 'unanswered_questions', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_unanswered_questions_id'), table_name='unanswered_questions')
    op.drop_table('unanswered_questions')

