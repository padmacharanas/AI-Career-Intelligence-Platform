
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.skill_extractor import extract_skills


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)

# Project root directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Uploaded PDF directory
UPLOAD_DIR = BASE_DIR / "uploads"

# Maximum PDF size: 5 MB
MAX_FILE_SIZE = 5 * 1024 * 1024


# ==========================================
# 1. UPLOAD RESUME
# ==========================================

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 5 MB"
        )

    if not contents.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file"
        )

    unique_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = UPLOAD_DIR / unique_filename

    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(contents)

        extracted_text = extract_text_from_pdf(str(file_path))

        if not extracted_text or not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in the PDF"
            )

        new_resume = Resume(
            user_id=current_user.id,
            file_name=file.filename,
            file_path=str(file_path),
            extracted_text=extracted_text
        )

        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)

        return {
            "message": "Resume uploaded and text extracted successfully",
            "resume_id": new_resume.id,
            "file_name": new_resume.file_name,
            "uploaded_at": new_resume.uploaded_at,
            "text_extracted": True
        }

    except HTTPException:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise

    except Exception as e:
        db.rollback()
        file_path.unlink(missing_ok=True)

        print("RESUME UPLOAD ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Could not upload or process resume"
        )

    finally:
        await file.close()


# ==========================================
# 2. GET MY UPLOADED RESUMES
# ==========================================

@router.get("/my-resumes")
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )

    return {
        "total_resumes": len(resumes),
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
# 3. VIEW EXTRACTED RESUME TEXT
# ==========================================

@router.get("/{resume_id}/text")
def get_resume_text(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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

    return {
        "resume_id": resume.id,
        "file_name": resume.file_name,
        "extracted_text": resume.extracted_text
    }


# ==========================================
# 4. EXTRACT AND SAVE RESUME SKILLS
# ==========================================

@router.post("/{resume_id}/extract-skills")
def extract_resume_skills(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find resume belonging to logged-in user
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

    # Validate extracted resume text
    if not resume.extracted_text or not resume.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No extracted resume text available"
        )

    # Extract skills from resume text
    try:
        extracted_skills = extract_skills(resume.extracted_text)

        if extracted_skills is None:
            raise ValueError("Skill extractor returned None")

        if not isinstance(extracted_skills, list):
            raise ValueError("Skill extractor must return a list")

        # Validate each extracted skill
        for skill in extracted_skills:
            if not isinstance(skill, dict):
                raise ValueError(
                    "Each extracted skill must be a dictionary"
                )

            if not skill.get("skill_name") or not skill.get("category"):
                raise ValueError(
                    "Each skill must contain skill_name and category"
                )

    except Exception as e:
        print("SKILL EXTRACTION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to extract skills. Check skill_extractor.py"
        )

    # Save extracted skills to database
    try:
        # Remove previous skills for this resume
        db.query(ResumeSkill).filter(
            ResumeSkill.resume_id == resume_id
        ).delete(synchronize_session=False)

        skill_records = [
            ResumeSkill(
                resume_id=resume_id,
                skill_name=skill["skill_name"],
                category=skill["category"]
            )
            for skill in extracted_skills
        ]

        db.add_all(skill_records)
        db.commit()

    except Exception as e:
        db.rollback()

        print("SKILL DATABASE ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to save extracted skills"
        )

    return {
        "message": "Skills extracted and saved successfully",
        "resume_id": resume_id,
        "total_skills": len(extracted_skills),
        "skills": extracted_skills
    }


# ==========================================
# 5. GET EXTRACTED RESUME SKILLS
# ==========================================

@router.get("/{resume_id}/skills")
def get_resume_skills(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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

    skills = (
        db.query(ResumeSkill)
        .filter(ResumeSkill.resume_id == resume_id)
        .order_by(
            ResumeSkill.category,
            ResumeSkill.skill_name
        )
        .all()
    )

    return {
        "resume_id": resume_id,
        "total_skills": len(skills),
        "skills": [
            {
                "id": skill.id,
                "skill_name": skill.skill_name,
                "category": skill.category
            }
            for skill in skills
        ]
    }


# ==========================================
# 6. DELETE RESUME
# ==========================================

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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

    file_path = Path(resume.file_path)

    try:
        # Delete associated skills
        db.query(ResumeSkill).filter(
            ResumeSkill.resume_id == resume_id
        ).delete(synchronize_session=False)

        # Delete resume database record
        db.delete(resume)

        db.commit()

    except Exception as e:
        db.rollback()

        print("RESUME DELETE ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to delete resume"
        )

    # Delete physical PDF after successful DB deletion
    try:
        if file_path.is_file():
            file_path.unlink()

    except OSError as e:
        print("RESUME FILE DELETE ERROR:", repr(e))

    return {
        "message": "Resume deleted successfully",
        "resume_id": resume_id
    }
