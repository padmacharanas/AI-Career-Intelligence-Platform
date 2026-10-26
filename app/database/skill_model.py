
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base


class ResumeSkill(Base):
    __tablename__ = "resume_skills"

    id = Column(Integer, primary_key=True, index=True)

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False,
        index=True
    )

    skill_name = Column(String(100), nullable=False)

    category = Column(String(100), nullable=False)
