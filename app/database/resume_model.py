from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from sqlalchemy.sql import func

from app.database.connection import Base


class Resume(Base):

    __tablename__ = "resumes"

    # Primary key
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Link resume to registered user
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Original uploaded file name
    file_name = Column(
        String(255),
        nullable=False
    )

    # File storage location
    file_path = Column(
        String(500),
        nullable=False
    )

    # Extracted text from PDF
    extracted_text = Column(
        String(10000),
        nullable=True
    )

    # Upload timestamp
    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )