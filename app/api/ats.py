
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user, require_admin

from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.ats_analysis_model import ATSAnalysis

from app.schemas.ats_schema import (
    ATSAnalysisRequest,
    ATSAnalysisResponse,
    ATSAnalysisHistoryItem
)

from app.services.ats_service import analyze_resume_for_job


router = APIRouter(
    prefix="/ats",
    tags=["ATS Resume Checker"]
)


# ==================================================
# HELPER: SAVE ATS ANALYSIS
# ==================================================

def save_ats_analysis(
    db: Session,
    user_id: int,
    resume: Resume,
    job_role_id: int
):
    """
    Analyze a resume and save the report in MySQL.

    The user_id represents the student who owns the resume.
    """

    try:
        result = analyze_resume_for_job(
            db=db,
            resume=resume,
            job_role_id=job_role_id
        )

        analysis = ATSAnalysis(
            user_id=user_id,
            resume_id=resume.id,
            job_role_id=job_role_id,
            overall_score=result["overall_score"],
            matched_skills=result["matched_skills"],
            missing_skills=result["missing_skills"],
            analysis_report=result["analysis_report"]
        )

        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        return analysis

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ATS analysis could not be completed. Please try again."
        )


# ==================================================
# 1. STUDENT: ANALYZE OWN RESUME
# ==================================================

@router.post(
    "/analyze",
    response_model=ATSAnalysisResponse,
    status_code=status.HTTP_201_CREATED
)
def analyze_student_resume(
    request: ATSAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required."
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == request.resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )

    return save_ats_analysis(
        db=db,
        user_id=current_user.id,
        resume=resume,
        job_role_id=request.job_role_id
    )


# ==================================================
# 2. STUDENT: VIEW OWN ATS HISTORY
# ==================================================

@router.get(
    "/history",
    response_model=list[ATSAnalysisHistoryItem]
)
def get_student_ats_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required."
        )

    return (
        db.query(ATSAnalysis)
        .filter(
            ATSAnalysis.user_id == current_user.id
        )
        .order_by(ATSAnalysis.created_at.desc())
        .all()
    )


# ==================================================
# 3. STUDENT: VIEW ONE OWN ATS REPORT
# ==================================================

@router.get(
    "/history/{analysis_id}",
    response_model=ATSAnalysisResponse
)
def get_student_ats_report(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required."
        )

    analysis = (
        db.query(ATSAnalysis)
        .filter(
            ATSAnalysis.id == analysis_id,
            ATSAnalysis.user_id == current_user.id
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS report not found."
        )

    return analysis


# ==================================================
# 4. ADMIN: ANALYZE A STUDENT'S RESUME
# ==================================================

@router.post(
    "/admin/analyze",
    response_model=ATSAnalysisResponse,
    status_code=status.HTTP_201_CREATED
)
def admin_analyze_student_resume(
    request: ATSAnalysisRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    resume = (
        db.query(Resume)
        .join(User, Resume.user_id == User.id)
        .filter(
            Resume.id == request.resume_id,
            User.role == "student"
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student resume not found."
        )

    return save_ats_analysis(
        db=db,
        user_id=resume.user_id,
        resume=resume,
        job_role_id=request.job_role_id
    )


# ==================================================
# 5. ADMIN: VIEW ALL STUDENT ATS HISTORY
# ==================================================

@router.get(
    "/admin/history",
    response_model=list[ATSAnalysisHistoryItem]
)
def get_all_ats_history(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return (
        db.query(ATSAnalysis)
        .join(User, ATSAnalysis.user_id == User.id)
        .filter(User.role == "student")
        .order_by(ATSAnalysis.created_at.desc())
        .all()
    )


# ==================================================
# 6. ADMIN: VIEW ANY STUDENT ATS REPORT
# ==================================================

@router.get(
    "/admin/history/{analysis_id}",
    response_model=ATSAnalysisResponse
)
def admin_get_ats_report(
    analysis_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    analysis = (
        db.query(ATSAnalysis)
        .join(User, ATSAnalysis.user_id == User.id)
        .filter(
            ATSAnalysis.id == analysis_id,
            User.role == "student"
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS report not found."
        )

    return analysis
