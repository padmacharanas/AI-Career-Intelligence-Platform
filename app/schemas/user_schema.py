
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Literal["student", "recruiter", "admin"] = "student"

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter")

        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number")

        if not any(not char.isalnum() and not char.isspace() for char in value):
            raise ValueError("Password must contain at least one special character")

        return value


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
