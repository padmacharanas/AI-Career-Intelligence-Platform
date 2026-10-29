
import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)
from fastapi.responses import FileResponse

from pydantic import BaseModel, EmailStr, Field

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.ats_analysis_model import ATSAnalysis
from app.database.learning_progress_model import LearningProgress
from app.database.job_role_model import JobRole, JobRoleSkill

from app.api.dependencies import get_db, require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==========================================
# STUDENT PROFILE UPDATE SCHEMA
# ==========================================

class StudentUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    college: str = Field(min_length=1, max_length=255)
    degree: str = Field(min_length=1, max_length=100)
    branch: str = Field(min_length=1, max_length=150)
    graduation_year: int = Field(ge=2000, le=2100)


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    total_users = (
        db.query(func.count(User.id))
        .filter(User.role == "student")
        .scalar()
    ) or 0

    total_students = total_users

    total_admins = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
    ) or 0

    total_resumes = (
        db.query(func.count(func.distinct(Resume.id)))
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .scalar()
    ) or 0

    total_job_roles = (
        db.query(func.count(JobRole.id))
        .scalar()
    ) or 0

    total_unique_skills = (
        db.query(func.count(func.distinct(ResumeSkill.skill_name)))
        .join(Resume, ResumeSkill.resume_id == Resume.id)
        .join(User, Resume.user_id == User.id)
        .filter(User.role == "student")
        .scalar()
    ) or 0

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
# STUDENT MANAGEMENT - UPDATE STUDENT
# ==========================================

@router.put("/students/{student_id}")
def update_student_details(
    student_id: int,
    student_data: StudentUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    # 1. Find the student account
    student = (
        db.query(User)
        .filter(User.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    # 2. Never allow editing Admin accounts
    if student.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be edited through this endpoint."
        )

    # 3. Normalize the email address
    new_email = str(student_data.email).strip().lower()

    # 4. Check whether another account already uses this email
    existing_user = (
        db.query(User)
        .filter(
            func.lower(User.email) == new_email,
            User.id != student_id
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="This email address is already registered."
        )

    # 5. Validate that text fields are not empty after trimming
    full_name = student_data.full_name.strip()
    college = student_data.college.strip()
    degree = student_data.degree.strip()
    branch = student_data.branch.strip()

    if not all([full_name, college, degree, branch]):
        raise HTTPException(
            status_code=422,
            detail="Name, college, degree and branch cannot be empty."
        )

    # 6. Update student details
    try:

        student.full_name = full_name
        student.email = new_email
        student.college = college
        student.degree = degree
        student.branch = branch
        student.graduation_year = student_data.graduation_year

        db.commit()
        db.refresh(student)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update student details."
        )

    # 7. Return updated student information
    return {
        "message": "Student details updated successfully.",
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
        }
    }


# ==========================================
# STUDENT MANAGEMENT - DELETE STUDENT
# ==========================================

@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    # 1. Find the account
    student = (
        db.query(User)
        .filter(User.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    # 2. Never allow deletion of Admin accounts
    if student.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be deleted through this endpoint."
        )

    # 3. Get all resumes belonging to the student
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .all()
    )

    resume_ids = [resume.id for resume in resumes]

    # Collect file paths before deleting database records
    resume_file_paths = list({
        os.path.abspath(resume.file_path)
        for resume in resumes
        if resume.file_path
    })

    try:

        # 4. Delete ATS analysis records
        db.query(ATSAnalysis).filter(
            ATSAnalysis.user_id == student.id
        ).delete(synchronize_session=False)

        # 5. Delete extracted resume skills
        if resume_ids:
            db.query(ResumeSkill).filter(
                ResumeSkill.resume_id.in_(resume_ids)
            ).delete(synchronize_session=False)

        # 6. Delete learning progress
        db.query(LearningProgress).filter(
            LearningProgress.user_id == student.id
        ).delete(synchronize_session=False)

        # 7. Delete resume records
        db.query(Resume).filter(
            Resume.user_id == student.id
        ).delete(synchronize_session=False)

        # 8. Delete student account
        db.delete(student)

        # 9. Commit database transaction
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete student. Database changes were rolled back."
        )

    # 10. Delete stored PDF files after successful commit
    deleted_files = 0
    failed_files = 0

    for file_path in resume_file_paths:

        if os.path.isfile(file_path):

            try:
                os.remove(file_path)
                deleted_files += 1

            except OSError:
                failed_files += 1

    return {
        "message": "Student and associated records deleted successfully.",
        "student_id": student_id,
        "deleted_records": {
            "ats_analyses": "Deleted",
            "resume_skills": "Deleted",
            "learning_progress": "Deleted",
            "resumes": len(resume_ids),
            "student_account": "Deleted"
        },
        "resume_files": {
            "deleted": deleted_files,
            "failed": failed_files
        }
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

    try:

        # Explicitly delete related ATS reports
        db.query(ATSAnalysis).filter(
            ATSAnalysis.resume_id == result.id
        ).delete(synchronize_session=False)

        # Delete extracted skills
        db.query(ResumeSkill).filter(
            ResumeSkill.resume_id == result.id
        ).delete(synchronize_session=False)

        # Delete resume record
        db.delete(result)

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
