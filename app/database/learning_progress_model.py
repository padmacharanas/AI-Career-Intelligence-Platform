
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.database.connection import Base


class LearningProgress(Base):

    __tablename__ = "learning_progress"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    job_role_id = Column(
        Integer,
        ForeignKey("job_roles.id"),
        nullable=False,
        index=True
    )

    skill_name = Column(
        String(100),
        nullable=False
    )

    is_completed = Column(
        Boolean,
        nullable=False,
        default=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "job_role_id",
            "skill_name",
            name="uq_user_role_skill"
        ),
    )
