
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.services.learning_recommender import generate_learning_recommendations
from app.api.dependencies import get_db, get_current_user, require_admin

from app.database.job_role_model import JobRole, JobRoleSkill
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.user_model import User

from app.services.job_matcher import calculate_job_match


router = APIRouter(
    prefix="/job-roles",
    tags=["Job Roles"]
)


# ==========================================
# 1. GET ALL JOB ROLES
# ==========================================

@router.get("/")
def get_all_job_roles(
    db: Session = Depends(get_db)
):
    job_roles = (
        db.query(JobRole)
        .order_by(JobRole.id)
        .all()
    )

    result = []

    for role in job_roles:
        skills = (
            db.query(JobRoleSkill)
            .filter(JobRoleSkill.job_role_id == role.id)
            .order_by(JobRoleSkill.id)
            .all()
        )

        result.append({
            "id": role.id,
            "role_name": role.role_name,
            "category": role.category,
            "description": role.description,
            "required_skills": [
                skill.skill_name for skill in skills
            ]
        })

    return {
        "total_roles": len(result),
        "job_roles": result
    }


# ==========================================
# 2. MATCH RESUME WITH ALL JOB ROLES
# ==========================================

@router.get("/match/{resume_id}")
def match_resume_with_job_roles(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    resume_skills = (
        db.query(ResumeSkill)
        .filter(ResumeSkill.resume_id == resume_id)
        .all()
    )

    if not resume_skills:
        raise HTTPException(
            status_code=400,
            detail="No skills found. Extract skills from the resume first."
        )

    resume_skill_names = [
        skill.skill_name for skill in resume_skills
    ]

    job_roles = (
        db.query(JobRole)
        .order_by(JobRole.id)
        .all()
    )

    results = []

    for role in job_roles:
        required_skills = (
            db.query(JobRoleSkill)
            .filter(JobRoleSkill.job_role_id == role.id)
            .all()
        )

        required_skill_names = [
            skill.skill_name for skill in required_skills
        ]

        match_result = calculate_job_match(
            resume_skill_names,
            required_skill_names
        )

        results.append({
            "job_role_id": role.id,
            "role_name": role.role_name,
            "category": role.category,
            "description": role.description,
            **match_result
        })

    results.sort(
        key=lambda item: item["match_percentage"],
        reverse=True
    )

    return {
        "resume_id": resume_id,
        "total_roles_analyzed": len(results),
        "job_matches": results
    }


# ==========================================
# 3. GET LEARNING RECOMMENDATIONS
# ==========================================

@router.get("/recommendations/{resume_id}")
def get_learning_recommendations(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    resume_skills = (
        db.query(ResumeSkill)
        .filter(ResumeSkill.resume_id == resume_id)
        .all()
    )

    if not resume_skills:
        raise HTTPException(
            status_code=400,
            detail="No skills found. Extract skills from the resume first."
        )

    resume_skill_names = [
        skill.skill_name for skill in resume_skills
    ]

    job_roles = (
        db.query(JobRole)
        .order_by(JobRole.id)
        .all()
    )

    results = []

    for role in job_roles:
        required_skills = (
            db.query(JobRoleSkill)
            .filter(JobRoleSkill.job_role_id == role.id)
            .all()
        )

        required_skill_names = [
            skill.skill_name for skill in required_skills
        ]

        match_result = calculate_job_match(
            resume_skill_names,
            required_skill_names
        )

        missing_skills = match_result["missing_skills"]

        recommendations = generate_learning_recommendations(
            missing_skills
        )

        results.append({
            "job_role_id": role.id,
            "role_name": role.role_name,
            "match_percentage": match_result["match_percentage"],
            "missing_skills": missing_skills,
            "learning_recommendations": recommendations
        })

    results.sort(
        key=lambda item: item["match_percentage"],
        reverse=True
    )

    return {
        "resume_id": resume_id,
        "total_roles_analyzed": len(results),
        "learning_recommendations": results
    }


# ==========================================
# 4. ADMIN - CREATE JOB ROLE
# ==========================================

@router.post("/admin/")
def create_job_role(
    role_name: str,
    category: str,
    description: str = "",
    required_skills: list[str] = [],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    role_name = role_name.strip()
    category = category.strip()

    if not role_name or not category:
        raise HTTPException(
            status_code=400,
            detail="Role name and category are required"
        )

    existing_role = (
        db.query(JobRole)
        .filter(JobRole.role_name == role_name)
        .first()
    )

    if existing_role:
        raise HTTPException(
            status_code=409,
            detail="This job role already exists"
        )

    clean_skills = list(dict.fromkeys(
        skill.strip()
        for skill in required_skills
        if skill and skill.strip()
    ))

    try:
        new_role = JobRole(
            role_name=role_name,
            category=category,
            description=description.strip()
        )

        db.add(new_role)
        db.flush()

        for skill_name in clean_skills:
            db.add(
                JobRoleSkill(
                    job_role_id=new_role.id,
                    skill_name=skill_name
                )
            )

        db.commit()
        db.refresh(new_role)

        return {
            "message": "Job role created successfully",
            "job_role_id": new_role.id,
            "role_name": new_role.role_name,
            "required_skills": clean_skills
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Job role already exists"
        )


# ==========================================
# 5. ADMIN - UPDATE JOB ROLE
# ==========================================

@router.put("/admin/{role_id}")
def update_job_role(
    role_id: int,
    role_name: str,
    category: str,
    description: str = "",
    required_skills: list[str] = [],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    role = (
        db.query(JobRole)
        .filter(JobRole.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Job role not found"
        )

    role_name = role_name.strip()
    category = category.strip()

    if not role_name or not category:
        raise HTTPException(
            status_code=400,
            detail="Role name and category are required"
        )

    duplicate = (
        db.query(JobRole)
        .filter(
            JobRole.role_name == role_name,
            JobRole.id != role_id
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Another job role already uses this name"
        )

    clean_skills = list(dict.fromkeys(
        skill.strip()
        for skill in required_skills
        if skill and skill.strip()
    ))

    try:
        role.role_name = role_name
        role.category = category
        role.description = description.strip()

        db.query(JobRoleSkill).filter(
            JobRoleSkill.job_role_id == role_id
        ).delete(synchronize_session=False)

        for skill_name in clean_skills:
            db.add(
                JobRoleSkill(
                    job_role_id=role_id,
                    skill_name=skill_name
                )
            )

        db.commit()

        return {
            "message": "Job role updated successfully",
            "job_role_id": role.id,
            "role_name": role.role_name,
            "required_skills": clean_skills
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Unable to update job role"
        )


# ==========================================
# 6. ADMIN - DELETE JOB ROLE
# ==========================================

@router.delete("/admin/{role_id}")
def delete_job_role(
    role_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    role = (
        db.query(JobRole)
        .filter(JobRole.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Job role not found"
        )

    db.query(JobRoleSkill).filter(
        JobRoleSkill.job_role_id == role_id
    ).delete(synchronize_session=False)

    db.delete(role)
    db.commit()

    return {
        "message": "Job role deleted successfully",
        "job_role_id": role_id
    }
