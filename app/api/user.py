
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.user_model import User
from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse
)
from app.services.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.api.dependencies import get_db, get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


# PROFILE UPDATE SCHEMA
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    college: Optional[str] = Field(default=None, max_length=200)
    degree: Optional[str] = Field(default=None, max_length=100)
    branch: Optional[str] = Field(default=None, max_length=150)
    graduation_year: Optional[int] = Field(default=None, ge=2000, le=2100)


# HELPER: FORMAT USER PROFILE
def format_user_profile(user: User):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "college": user.college,
        "degree": user.degree,
        "branch": user.branch,
        "graduation_year": user.graduation_year,
        "created_at": user.created_at
    }


# USER REGISTRATION
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if user.role == "admin":
        existing_admin = db.query(User).filter(
            User.role == "admin"
        ).first()

        if existing_admin:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An admin account already exists. Only one admin is allowed."
            )

    hashed_password = hash_password(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# USER LOGIN
@router.post("/login", response_model=TokenResponse)
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "role": existing_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# GET CURRENT USER PROFILE
@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return format_user_profile(current_user)


# UPDATE CURRENT USER PROFILE
@router.put("/me")
def update_my_profile(
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = profile.dict(exclude_unset=True)

    if "full_name" in update_data:
        if update_data["full_name"] is None or len(update_data["full_name"].strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name must contain at least 2 characters"
            )

        update_data["full_name"] = update_data["full_name"].strip()

    text_fields = ["college", "degree", "branch"]

    for field in text_fields:
        if field in update_data:
            value = update_data[field]

            if value is not None:
                update_data[field] = value.strip() or None

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "user": format_user_profile(current_user)
    }
