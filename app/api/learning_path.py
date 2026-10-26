
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user

from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.job_role_model import JobRole, JobRoleSkill
from app.database.learning_progress_model import LearningProgress

from app.services.job_matcher import calculate_job_match
from app.services.learning_recommender import generate_learning_recommendations


router = APIRouter(
    prefix="/learning-path",
    tags=["Learning Path"]
)


class LearningProgressUpdate(BaseModel):
    job_role_id: int
    skill_name: str = Field(min_length=1, max_length=100)
    is_completed: bool


# ==========================================
# GET LEARNING PATH FOR A RESUME
# ==========================================

@router.get("/{resume_id}")
def get_learning_path(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # 1. Verify resume ownership
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

    # 2. Get extracted resume skills
    resume_skills = (
        db.query(ResumeSkill)
        .filter(ResumeSkill.resume_id == resume_id)
        .all()
    )

    if not resume_skills:
        raise HTTPException(
            status_code=400,
            detail="No extracted skills found. Extract skills first."
        )

    resume_skill_names = [
        skill.skill_name for skill in resume_skills
    ]

    # 3. Get all job roles
    job_roles = (
        db.query(JobRole)
        .order_by(JobRole.id)
        .all()
    )

    learning_paths = []

    # 4. Build a learning path for each role
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

        # Index recommendations by skill name
        recommendation_map = {
            item["skill"].strip().lower(): item
            for item in recommendations
            if item.get("skill")
        }

        # Get saved progress for this student and role
        saved_progress = (
            db.query(LearningProgress)
            .filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.job_role_id == role.id
            )
            .all()
        )

        progress_map = {
            item.skill_name.strip().lower(): item.is_completed
            for item in saved_progress
        }

        skills = []

        for skill_name in missing_skills:

            recommendation = recommendation_map.get(
                skill_name.strip().lower(),
                {}
            )

            is_completed = progress_map.get(
                skill_name.strip().lower(),
                False
            )

            skills.append({
                "skill_name": skill_name,
                "is_completed": is_completed,
                "description": recommendation.get(
                    "description",
                    "Learn this skill to improve your job-role match."
                ),
                "resources": recommendation.get(
                    "resources",
                    []
                )
            })

        completed_count = sum(
            1 for skill in skills if skill["is_completed"]
        )

        total_skills = len(skills)

        progress_percentage = (
            round((completed_count / total_skills) * 100, 2)
            if total_skills > 0
            else 100
        )

        learning_paths.append({

            "job_role_id": role.id,
            "role_name": role.role_name,
            "category": role.category,
            "description": role.description,

            "match_percentage": match_result["match_percentage"],

            "total_missing_skills": total_skills,
            "completed_skills": completed_count,

            "progress_percentage": progress_percentage,

            "skills": skills

        })

    # 5. Sort by best job match
    learning_paths.sort(
        key=lambda item: item["match_percentage"],
        reverse=True
    )

    return {
        "resume_id": resume_id,
        "total_roles": len(learning_paths),
        "learning_paths": learning_paths
    }


# ==========================================
# UPDATE LEARNING PROGRESS
# ==========================================

@router.post("/progress")
def update_learning_progress(
    progress: LearningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    skill_name = progress.skill_name.strip()

    if not skill_name:
        raise HTTPException(
            status_code=400,
            detail="Skill name cannot be empty."
        )

    # 1. Verify that the job role exists
    role = (
        db.query(JobRole)
        .filter(JobRole.id == progress.job_role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Job role not found."
        )

    # 2. Verify that this skill belongs to the selected role
    required_skill = (
        db.query(JobRoleSkill)
        .filter(
            JobRoleSkill.job_role_id == progress.job_role_id,
            JobRoleSkill.skill_name.ilike(skill_name)
        )
        .first()
    )

    if required_skill is None:
        raise HTTPException(
            status_code=400,
            detail="This skill is not part of the selected job role."
        )

    canonical_skill_name = required_skill.skill_name

    # 3. Find existing progress
    existing_progress = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.job_role_id == progress.job_role_id,
            LearningProgress.skill_name == canonical_skill_name
        )
        .first()
    )

    # 4. Create or update progress
    if existing_progress:

        existing_progress.is_completed = progress.is_completed

    else:

        new_progress = LearningProgress(
            user_id=current_user.id,
            job_role_id=progress.job_role_id,
            skill_name=canonical_skill_name,
            is_completed=progress.is_completed
        )

        db.add(new_progress)

    db.commit()

    return {
        "message": "Learning progress updated successfully.",
        "job_role_id": progress.job_role_id,
        "skill_name": canonical_skill_name,
        "is_completed": progress.is_completed
    }
