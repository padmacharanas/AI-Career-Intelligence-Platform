
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user

from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.job_role_model import JobRole, JobRoleSkill

from app.services.job_matcher import calculate_job_match


router = APIRouter(
    prefix="/dashboard",
    tags=["Student Dashboard"]
)


# ==========================================
# GET STUDENT DASHBOARD
# ==========================================

@router.get("/")
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Step 1: Get all resumes belonging to the logged-in user
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )

    total_resumes = len(resumes)

    # Step 2: Collect unique skills from all user resumes
    all_skills = set()

    for resume in resumes:

        resume_skills = (
            db.query(ResumeSkill)
            .filter(ResumeSkill.resume_id == resume.id)
            .all()
        )

        for skill in resume_skills:
            all_skills.add(skill.skill_name)

    # Step 3: Get all available job roles
    job_roles = (
        db.query(JobRole)
        .order_by(JobRole.id)
        .all()
    )

    job_matches = []

    # Default average match
    average_match = 0

    # Step 4: Calculate job matches using the latest resume
    if resumes:

        latest_resume = resumes[0]

        latest_resume_skills = (
            db.query(ResumeSkill)
            .filter(ResumeSkill.resume_id == latest_resume.id)
            .all()
        )

        resume_skill_names = [
            skill.skill_name
            for skill in latest_resume_skills
        ]

        for role in job_roles:

            required_skills = (
                db.query(JobRoleSkill)
                .filter(
                    JobRoleSkill.job_role_id == role.id
                )
                .all()
            )

            required_skill_names = [
                skill.skill_name
                for skill in required_skills
            ]

            match_result = calculate_job_match(
                resume_skill_names,
                required_skill_names
            )

            job_matches.append({
                "job_role_id": role.id,
                "role_name": role.role_name,
                "category": role.category,
                "match_percentage": match_result["match_percentage"],
                "matched_skills": match_result["matched_skills"],
                "missing_skills": match_result["missing_skills"]
            })

        # Sort job matches by highest percentage
        job_matches.sort(
            key=lambda item: item["match_percentage"],
            reverse=True
        )

        # Calculate average match percentage
        if job_matches:

            average_match = round(
                sum(
                    item["match_percentage"]
                    for item in job_matches
                ) / len(job_matches),
                2
            )

    # Step 5: Prepare recent resume information
    recent_resumes = []

    for resume in resumes[:5]:

        recent_resumes.append({
            "resume_id": resume.id,
            "file_name": resume.file_name,
            "uploaded_at": resume.uploaded_at
        })

    # Step 6: Return dashboard information
    return {

        "student": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email
        },

        "statistics": {
            "total_resumes": total_resumes,
            "total_unique_skills": len(all_skills),
            "total_job_roles": len(job_roles),
            "average_match_percentage": average_match
        },

        "extracted_skills": sorted(all_skills),

        "best_job_matches": job_matches[:3],

        "all_job_matches": job_matches,

        "recent_resumes": recent_resumes
    }
