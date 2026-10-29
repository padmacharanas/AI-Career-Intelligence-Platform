from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.sql import func

from app.database.connection import Base


class ATSAnalysis(Base):
    __tablename__ = "ats_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Student who owns this ATS report
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Resume used for the analysis
    # Delete its ATS reports when the resume is deleted
    resume_id = Column(
        Integer,
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Preserve the report if its job role is deleted.
    # The role name will also be saved in analysis_report.
    job_role_id = Column(
        Integer,
        ForeignKey("job_roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Weighted ATS score out of 100
    overall_score = Column(
        Numeric(5, 2),
        nullable=False
    )

    # Skills found in the resume
    matched_skills = Column(
        JSON,
        nullable=False
    )

    # Required skills not found in the resume
    missing_skills = Column(
        JSON,
        nullable=False
    )

    # Detailed report, score breakdown and suggestions
    analysis_report = Column(
        JSON,
        nullable=False
    )

    # Analysis creation date and time
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )