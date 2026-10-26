
import re

from app.utils.skill_list import SKILL_DATABASE


def extract_skills(resume_text: str) -> list:
    """
    Identify skills from extracted resume text.
    Returns a list of skills with their categories.
    """

    extracted_skills = []

    # Convert text to lowercase for case-insensitive matching
    text = resume_text.lower()

    # Search for every skill in our skill database
    for category, skills in SKILL_DATABASE.items():

        for skill in skills:

            # Escape special characters in skill names
            escaped_skill = re.escape(skill.lower())

            # Match complete words or phrases
            pattern = r"(?<!\w)" + escaped_skill + r"(?!\w)"

            if re.search(pattern, text):

                extracted_skills.append({
                    "skill_name": skill,
                    "category": category
                })

    return extracted_skills
