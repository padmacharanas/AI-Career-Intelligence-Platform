def calculate_job_match(resume_skills, required_skills):

    # Convert skills to lowercase for comparison
    resume_skill_set = {
        skill.lower() for skill in resume_skills
    }

    required_skill_set = {
        skill.lower() for skill in required_skills
    }

    # Find matching skills
    matched_skills = resume_skill_set.intersection(
        required_skill_set
    )

    # Find missing skills
    missing_skills = required_skill_set - resume_skill_set

    # Calculate match percentage
    if len(required_skill_set) == 0:
        match_percentage = 0
    else:
        match_percentage = (
            len(matched_skills) / len(required_skill_set)
        ) * 100

    return {
        "match_percentage": round(match_percentage, 2),
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "total_required_skills": len(required_skill_set),
        "total_matched_skills": len(matched_skills)
    }