
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl, Field

from app.api.dependencies import (
    get_db,
    get_current_user,
    require_admin,
)

from app.database.resource_model import LearningResource


router = APIRouter(
    prefix="/resources",
    tags=["Learning Resources"],
)


# ==========================================
# HELPER: NORMALIZE SKILL TAGS
# ==========================================

def normalize_skills(skills):
    if not skills:
        return []

    cleaned_skills = []
    seen = set()

    for skill in skills:
        if not isinstance(skill, str):
            continue

        skill = skill.strip()

        if not skill:
            continue

        normalized = skill.lower()

        if normalized not in seen:
            seen.add(normalized)
            cleaned_skills.append(skill)

    return cleaned_skills


# ==========================================
# REQUEST SCHEMAS
# ==========================================

class ResourceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    category: str = Field(min_length=1, max_length=100)
    url: HttpUrl

    skills: List[str] = Field(default_factory=list)

    is_active: bool = True


class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: Optional[str] = None

    category: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    url: Optional[HttpUrl] = None

    skills: Optional[List[str]] = None

    is_active: Optional[bool] = None


# ==========================================
# STUDENT / ADMIN: VIEW RESOURCES
# ==========================================

@router.get("/")
def get_resources(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(LearningResource)

    # Students only see active resources.
    # Administrators can also see inactive resources.
    if getattr(current_user, "role", None) != "admin":
        query = query.filter(
            LearningResource.is_active.is_(True)
        )

    resources = query.order_by(
        LearningResource.id.desc()
    ).all()

    return resources


# ==========================================
# STUDENT / ADMIN: VIEW ONE RESOURCE
# ==========================================

@router.get("/{resource_id}")
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    resource = db.query(LearningResource).filter(
        LearningResource.id == resource_id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    # Do not allow students to access inactive resources.
    if (
        getattr(current_user, "role", None) != "admin"
        and not resource.is_active
    ):
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    return resource


# ==========================================
# ADMIN: ADD RESOURCE
# ==========================================

@router.post("/admin/", status_code=201)
def create_resource(
    resource_data: ResourceCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    resource = LearningResource(
        title=resource_data.title.strip(),
        description=resource_data.description,
        category=resource_data.category.strip(),
        url=str(resource_data.url),
        skills=normalize_skills(resource_data.skills),
        is_active=resource_data.is_active,
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    return {
        "message": "Learning resource created successfully",
        "resource": resource,
    }


# ==========================================
# ADMIN: UPDATE RESOURCE
# ==========================================

@router.put("/admin/{resource_id}")
def update_resource(
    resource_id: int,
    resource_data: ResourceUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    resource = db.query(LearningResource).filter(
        LearningResource.id == resource_id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    update_data = resource_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        if key == "url" and value is not None:
            value = str(value)

        if key == "skills" and value is not None:
            value = normalize_skills(value)

        if key == "title" and value is not None:
            value = value.strip()

        if key == "category" and value is not None:
            value = value.strip()

        setattr(resource, key, value)

    db.commit()
    db.refresh(resource)

    return {
        "message": "Learning resource updated successfully",
        "resource": resource,
    }


# ==========================================
# ADMIN: DELETE RESOURCE
# ==========================================

@router.delete("/admin/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    resource = db.query(LearningResource).filter(
        LearningResource.id == resource_id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    db.delete(resource)
    db.commit()

    return {
        "message": "Learning resource deleted successfully",
    }
