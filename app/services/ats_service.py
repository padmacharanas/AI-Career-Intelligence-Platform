
from sqlalchemy.orm import Session

from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.job_role_model import JobRole, JobRoleSkill
from app.database.resource_model import LearningResource

from app.services.skill_extractor import extract_skills
from app.services.ats_analyzer import calculate_overall_ats_score


def analyze_resume_for_job(
    db: Session,
    resume: Resume,
    job_role_id: int
):
    """
    Analyze one resume against one selected job role.
    """

    # 1. GET THE SELECTED JOB ROLE

    job_role = (
        db.query(JobRole)
        .filter(JobRole.id == job_role_id)
        .first()
    )

    if job_role is None:
        raise ValueError("Selected job role was not found.")

    role_skill_records = (
        db.query(JobRoleSkill)
        .filter(JobRoleSkill.job_role_id == job_role.id)
        .all()
    )

    required_skills = list(dict.fromkeys(
        skill.skill_name.strip()
        for skill in role_skill_records
        if skill.skill_name and skill.skill_name.strip()
    ))

    if not required_skills:
        raise ValueError(
            "This job role has no required skills configured."
        )

    # 2. GET SAVED RESUME SKILLS

    saved_skill_records = (
        db.query(ResumeSkill)
        .filter(ResumeSkill.resume_id == resume.id)
        .all()
    )

    # 3. EXTRACT SKILLS IF NECESSARY

    if not saved_skill_records:

        resume_text = resume.extracted_text or ""

        if not resume_text.strip():
            raise ValueError(
                "No extracted resume text is available. "
                "Please check the uploaded PDF."
            )

        extracted_skills = extract_skills(resume_text)

        if not isinstance(extracted_skills, list):
            raise ValueError(
                "Skill extraction returned an invalid result."
            )

        skill_records = []

        for skill in extracted_skills:

            if not isinstance(skill, dict):
                continue

            skill_name = skill.get("skill_name")
            category = skill.get("category")

            if (
                isinstance(skill_name, str)
                and skill_name.strip()
                and isinstance(category, str)
                and category.strip()
            ):
                skill_records.append(
                    ResumeSkill(
                        resume_id=resume.id,
                        skill_name=skill_name.strip(),
                        category=category.strip()
                    )
                )

        if skill_records:
            db.add_all(skill_records)
            db.flush()

        saved_skill_records = (
            db.query(ResumeSkill)
            .filter(ResumeSkill.resume_id == resume.id)
            .all()
        )

    resume_skills = [
        skill.skill_name
        for skill in saved_skill_records
        if skill.skill_name
    ]

    # 4. CALCULATE ATS SCORE

    resume_text = resume.extracted_text or ""

    score_result = calculate_overall_ats_score(
        resume_text=resume_text,
        resume_skills=resume_skills,
        required_skills=required_skills,
        job_description=job_role.description or ""
    )

    overall_score = score_result["overall_score"]

    components = score_result["components"]

    skills_result = components["skills"]

    matched_skills = skills_result["matched_skills"]
    missing_skills = skills_result["missing_skills"]

    # 5. FIND RELEVANT LEARNING RESOURCES

    active_resources = (
        db.query(LearningResource)
        .filter(LearningResource.is_active.is_(True))
        .all()
    )

    missing_skill_set = {
        skill.lower().strip()
        for skill in missing_skills
    }

    recommended_resources = []

    for resource in active_resources:

        resource_skills = resource.skills or []

        if not isinstance(resource_skills, list):
            continue

        matching_skills = [
            skill
            for skill in resource_skills
            if (
                isinstance(skill, str)
                and skill.lower().strip() in missing_skill_set
            )
        ]

        if matching_skills:
            recommended_resources.append({
                "resource_id": resource.id,
                "title": resource.title,
                "description": resource.description,
                "category": resource.category,
                "url": resource.url,
                "matching_skills": matching_skills
            })

    # 6. GENERATE IMPROVEMENT SUGGESTIONS

    suggestions = []

    if missing_skills:
        suggestions.append({
            "area": "Required Skills",
            "priority": "High",
            "suggestion": (
                "Develop and practise the missing required skills: "
                + ", ".join(missing_skills)
                + ". Add them to your resume only after gaining "
                  "genuine knowledge or experience."
            )
        })

    keyword_result = components["keywords"]

    if keyword_result["missing_keywords"]:
        suggestions.append({
            "area": "Job Description Keywords",
            "priority": "High",
            "suggestion": (
                "Review the selected job description and include "
                "relevant keywords naturally when they accurately "
                "describe your experience and projects."
            )
        })

    content_result = components["content"]

    if content_result["missing_sections"]:
        suggestions.append({
            "area": "Resume Sections",
            "priority": "Medium",
            "suggestion": (
                "Consider adding these relevant sections: "
                + ", ".join(content_result["missing_sections"])
                + ". Include only sections that accurately reflect "
                  "your background."
            )
        })

    sentence_result = components["sentence_quality"]

    if sentence_result["feedback"]:
        suggestions.append({
            "area": "Sentence Quality",
            "priority": "Medium",
            "suggestion": " ".join(sentence_result["feedback"])
        })

    education_result = components["education"]

    if education_result["percentage"] < 100:
        suggestions.append({
            "area": "Education Match",
            "priority": "Low",
            "suggestion": (
                "Review the education requirements in the job "
                "description and make your relevant degree, field "
                "of study and qualifications clear in your resume."
            )
        })

    if not suggestions:
        suggestions.append({
            "area": "Overall Improvement",
            "priority": "Low",
            "suggestion": (
                "Your resume performed well against the selected "
                "job role. Continue improving your projects and "
                "keep your resume updated."
            )
        })

    # 7. PREPARE THE COMPLETE REPORT

    analysis_report = {
        "score_type": "Estimated ATS Compatibility Score",
        "disclaimer": (
            "This is a project-specific estimated compatibility "
            "score based on skills, job description keywords, "
            "resume content, sentence quality and education "
            "matching. Different employers use different ATS "
            "systems and scoring methods. This score is not an "
            "actual employer ATS score and does not guarantee "
            "interview selection."
        ),
        "resume": {
            "id": resume.id,
            "file_name": resume.file_name
        },
        "job_role": {
            "id": job_role.id,
            "role_name": job_role.role_name,
            "category": job_role.category,
            "description": job_role.description
        },
        "overall_score": overall_score,
        "score_out_of": 100,
        "score_breakdown": components,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "learning_resources": recommended_resources,
        "improvement_suggestions": suggestions
    }

    return {
        "overall_score": overall_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "analysis_report": analysis_report
    }
