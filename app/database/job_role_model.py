
from sqlalchemy import Column, Integer, String, Text, ForeignKey

from app.database.connection import Base


# ==========================================
# JOB ROLES TABLE
# ==========================================

class JobRole(Base):

    __tablename__ = "job_roles"

    id = Column(Integer, primary_key=True, index=True)

    role_name = Column(
        String(150),
        nullable=False,
        unique=True
    )

    category = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )


# ==========================================
# JOB ROLE SKILLS TABLE
# ==========================================

class JobRoleSkill(Base):

    __tablename__ = "job_role_skills"

    id = Column(Integer, primary_key=True, index=True)

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
