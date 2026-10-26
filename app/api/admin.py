
import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)
from fastapi.responses import FileResponse

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.job_role_model import JobRole, JobRoleSkill

from app.api.dependencies import get_db, require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    # Count only registered student accounts
    total_users = (
        db.query(func.count(User.id))
        .filter(User.role == "student")
        .scalar()
    ) or 0

    total_students = total_users

    # Count admin accounts separately
    total_admins = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
    ) or 0

    # Count actual student resumes.
    # DISTINCT prevents duplicate resume counting.
    total_resumes = (
        db.query(func.count(func.distinct(Resume.id)))
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .scalar()
    ) or 0

    # Count all available job roles
    total_job_roles = (
        db.query(func.count(JobRole.id))
        .scalar()
    ) or 0

    # Count unique skills extracted from student resumes only
    total_unique_skills = (
        db.query(func.count(func.distinct(ResumeSkill.skill_name)))
        .join(Resume, ResumeSkill.resume_id == Resume.id)
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .scalar()
    ) or 0

    # Get latest five student registrations
    recent_users = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.created_at.desc(), User.id.desc())
        .limit(5)
        .all()
    )

    return {
        "statistics": {
            "total_users": total_users,
            "total_students": total_students,
            "total_admins": total_admins,
            "total_resumes": total_resumes,
            "total_job_roles": total_job_roles,
            "total_unique_skills": total_unique_skills
        },
        "recent_users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at
            }
            for user in recent_users
        ]
    }


# ==========================================
# GET ALL REGISTERED USERS
# ==========================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at
            }
            for user in users
        ]
    }


# ==========================================
# STUDENT MANAGEMENT - LIST AND SEARCH
# ==========================================

@router.get("/students")
def get_all_students(
    search: str = Query(
        default="",
        description="Search by student name or email"
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    query = db.query(User).filter(User.role == "student")

    if search.strip():
        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )

    students = query.order_by(User.id.desc()).all()

    student_list = []

    for student in students:

        resume_count = (
            db.query(func.count(func.distinct(Resume.id)))
            .filter(Resume.user_id == student.id)
            .scalar()
        ) or 0

        student_list.append({
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "college": student.college,
            "degree": student.degree,
            "branch": student.branch,
            "graduation_year": student.graduation_year,
            "total_resumes": resume_count,
            "created_at": student.created_at
        })

    return {
        "total_students": len(student_list),
        "students": student_list
    }


# ==========================================
# STUDENT MANAGEMENT - INDIVIDUAL PROFILE
# ==========================================

@router.get("/students/{student_id}")
def get_student_details(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    student = (
        db.query(User)
        .filter(
            User.id == student_id,
            User.role == "student"
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .order_by(Resume.id.desc())
        .all()
    )

    total_unique_skills = (
        db.query(func.count(func.distinct(ResumeSkill.skill_name)))
        .join(Resume, ResumeSkill.resume_id == Resume.id)
        .filter(Resume.user_id == student.id)
        .scalar()
    ) or 0

    return {
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "role": student.role,
            "college": student.college,
            "degree": student.degree,
            "branch": student.branch,
            "graduation_year": student.graduation_year,
            "created_at": student.created_at
        },
        "statistics": {
            "total_resumes": len(resumes),
            "total_unique_skills": total_unique_skills
        },
        "resumes": [
            {
                "id": resume.id,
                "file_name": resume.file_name,
                "uploaded_at": resume.uploaded_at
            }
            for resume in resumes
        ]
    }


# ==========================================
# RESUME MANAGEMENT - LIST AND SEARCH
# ==========================================

@router.get("/resumes")
def get_all_resumes(
    search: str = Query(
        default="",
        description="Search by student name, email or resume filename"
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    query = (
        db.query(Resume, User)
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
    )

    if search.strip():
        keyword = f"%{search.strip()}%"

        query = query.filter(
            or_(
                User.full_name.ilike(keyword),
                User.email.ilike(keyword),
                Resume.file_name.ilike(keyword)
            )
        )

    results = (
        query
        .order_by(Resume.uploaded_at.desc())
        .all()
    )

    resumes = []

    for resume, student in results:

        resumes.append({
            "id": resume.id,
            "file_name": resume.file_name,
            "uploaded_at": resume.uploaded_at,
            "student": {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email
            }
        })

    return {
        "total_resumes": len(resumes),
        "resumes": resumes
    }


# ==========================================
# RESUME MANAGEMENT - INDIVIDUAL DETAILS
# ==========================================

@router.get("/resumes/{resume_id}")
def get_resume_details(
    resume_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    result = (
        db.query(Resume, User)
        .join(User, Resume.user_id == User.id)
        .filter(
            Resume.id == resume_id,
            User.role == "student"
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Resume not found."
        )

    resume, student = result

    skills = (
        db.query(ResumeSkill)
        .filter(ResumeSkill.resume_id == resume.id)
        .order_by(ResumeSkill.skill_name.asc())
        .all()
    )

    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "uploaded_at": resume.uploaded_at,
        "extracted_text": resume.extracted_text,
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "college": student.college,
            "degree": student.degree,
            "branch": student.branch,
            "graduation_year": student.graduation_year
        },
        "skills": [
            {
                "skill_name": skill.skill_name,
                "category": skill.category
            }
            for skill in skills
        ]
    }


# ==========================================
# RESUME MANAGEMENT - DOWNLOAD PDF
# ==========================================

@router.get("/resumes/{resume_id}/download")
def download_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    result = (
        db.query(Resume)
        .join(User, Resume.user_id == User.id)
        .filter(
            Resume.id == resume_id,
            User.role == "student"
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Resume not found."
        )

    file_path = os.path.abspath(result.file_path)

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="Resume file does not exist on the server."
        )

    return FileResponse(
        path=file_path,
        filename=os.path.basename(result.file_name),
        media_type="application/pdf"
    )


# ==========================================
# RESUME MANAGEMENT - DELETE RESUME
# ==========================================

@router.delete("/resumes/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    result = (
        db.query(Resume)
        .join(User, Resume.user_id == User.id)
        .filter(
            Resume.id == resume_id,
            User.role == "student"
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Resume not found."
        )

    file_path = os.path.abspath(result.file_path)

    db.query(ResumeSkill).filter(
        ResumeSkill.resume_id == result.id
    ).delete(synchronize_session=False)

    db.delete(result)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete resume from database."
        )

    file_deleted = False

    if os.path.isfile(file_path):
        try:
            os.remove(file_path)
            file_deleted = True
        except OSError:
            file_deleted = False

    return {
        "message": "Resume deleted successfully.",
        "resume_id": resume_id,
        "file_deleted": file_deleted
    }


# ==========================================
# ADMIN ANALYTICS - STUDENT REGISTRATION
# ==========================================

@router.get("/analytics/registrations")
def get_student_registration_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    results = (
        db.query(
            func.date_format(
                User.created_at, "%Y-%m"
            ).label("month"),
            func.count(User.id).label("total_students")
        )
        .filter(User.role == "student")
        .group_by(
            func.date_format(User.created_at, "%Y-%m")
        )
        .order_by(
            func.date_format(User.created_at, "%Y-%m")
        )
        .all()
    )

    return {
        "registrations": [
            {
                "month": row.month,
                "total_students": row.total_students
            }
            for row in results
        ]
    }


# ==========================================
# ADMIN ANALYTICS - RESUME UPLOAD TRENDS
# ==========================================

@router.get("/analytics/resume-uploads")
def get_resume_upload_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    results = (
        db.query(
            func.date_format(
                Resume.uploaded_at, "%Y-%m"
            ).label("month"),
            func.count(Resume.id).label("total_uploads")
        )
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .group_by(
            func.date_format(Resume.uploaded_at, "%Y-%m")
        )
        .order_by(
            func.date_format(Resume.uploaded_at, "%Y-%m")
        )
        .all()
    )

    return {
        "resume_uploads": [
            {
                "month": row.month,
                "total_uploads": row.total_uploads
            }
            for row in results
        ]
    }


# ==========================================
# ADMIN ANALYTICS - POPULAR STUDENT SKILLS
# ==========================================

@router.get("/analytics/popular-skills")
def get_popular_skills_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    results = (
        db.query(
            ResumeSkill.skill_name,
            func.count(
                func.distinct(Resume.user_id)
            ).label("student_count")
        )
        .join(Resume, ResumeSkill.resume_id == Resume.id)
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .group_by(ResumeSkill.skill_name)
        .order_by(
            func.count(
                func.distinct(Resume.user_id)
            ).desc()
        )
        .limit(10)
        .all()
    )

    return {
        "popular_skills": [
            {
                "skill_name": row.skill_name,
                "student_count": row.student_count
            }
            for row in results
        ]
    }


# ==========================================
# ADMIN ANALYTICS - JOB ROLE DEMAND
# ==========================================

@router.get("/analytics/job-role-demand")
def get_job_role_demand_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    roles = (
        db.query(JobRole)
        .order_by(JobRole.id.asc())
        .all()
    )

    role_demand = []

    for role in roles:

        skills = (
            db.query(JobRoleSkill)
            .filter(JobRoleSkill.job_role_id == role.id)
            .all()
        )

        role_demand.append({
            "role_id": role.id,
            "role_name": role.role_name,
            "category": role.category,
            "required_skills": [
                skill.skill_name
                for skill in skills
            ]
        })

    return {
        "total_job_roles": len(roles),
        "job_role_demand": role_demand
    }


# ==========================================
# ADMIN ANALYTICS - SKILL GAP ANALYSIS
# ==========================================

@router.get("/analytics/skill-gaps")
def get_skill_gap_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    required_skills = (
        db.query(
            JobRoleSkill.skill_name,
            func.count(
                func.distinct(JobRoleSkill.job_role_id)
            ).label("role_count")
        )
        .group_by(JobRoleSkill.skill_name)
        .all()
    )

    available_skills = (
        db.query(
            ResumeSkill.skill_name,
            func.count(
                func.distinct(Resume.user_id)
            ).label("student_count")
        )
        .join(Resume, ResumeSkill.resume_id == Resume.id)
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .group_by(ResumeSkill.skill_name)
        .all()
    )

    student_skill_map = {
        row.skill_name.strip().lower(): row.student_count
        for row in available_skills
    }

    skill_gaps = []

    for skill in required_skills:

        available_count = student_skill_map.get(
            skill.skill_name.strip().lower(), 0
        )

        skill_gaps.append({
            "skill_name": skill.skill_name,
            "job_role_count": skill.role_count,
            "student_count": available_count,
            "gap_count": max(
                skill.role_count - available_count, 0
            )
        })

    skill_gaps.sort(
        key=lambda item: item["gap_count"],
        reverse=True
    )

    return {
        "skill_gaps": skill_gaps
    }
