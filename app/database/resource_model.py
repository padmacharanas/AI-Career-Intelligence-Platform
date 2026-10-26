
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    JSON,
)
from sqlalchemy.sql import func

from app.database.connection import Base


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)

    description = Column(Text, nullable=True)

    category = Column(String(100), nullable=False)

    url = Column(String(1000), nullable=False)

    # Multiple skills assigned by the administrator.
    # Example: ["Python", "NumPy", "Machine Learning"]
    skills = Column(JSON, nullable=True)

    # Inactive resources are hidden from students.
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )
