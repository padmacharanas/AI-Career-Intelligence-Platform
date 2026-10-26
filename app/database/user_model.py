
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password = Column(String(255), nullable=False)

    role = Column(
        String(20),
        nullable=False,
        default="student"
    )

    # Academic profile information
    college = Column(String(200), nullable=True)

    degree = Column(String(100), nullable=True)

    branch = Column(String(150), nullable=True)

    graduation_year = Column(Integer, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
