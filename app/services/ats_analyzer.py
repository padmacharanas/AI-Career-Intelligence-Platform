
import re

from app.services.job_matcher import calculate_job_match


# --------------------------------------------------
# 1. REQUIRED SKILLS SCORE (40%)
# --------------------------------------------------

def calculate_skills_score(resume_skills, required_skills):
    """Calculate required skill matching (40%)."""

    if not required_skills:
        raise ValueError(
            "The selected job role has no required skills configured."
        )

    clean_resume_skills = [
        skill.strip()
        for skill in resume_skills
        if isinstance(skill, str) and skill.strip()
    ]

    clean_required_skills = [
        skill.strip()
        for skill in required_skills
        if isinstance(skill, str) and skill.strip()
    ]

    match_result = calculate_job_match(
        clean_resume_skills,
        clean_required_skills
    )

    percentage = float(match_result["match_percentage"])
    weight = 40

    return {
        "component": "Required Skills Match",
        "weight": weight,
        "percentage": round(percentage, 2),
        "weighted_score": round(percentage * weight / 100, 2),
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "total_required_skills": match_result["total_required_skills"],
        "total_matched_skills": match_result["total_matched_skills"]
    }


# --------------------------------------------------
# 2. JOB DESCRIPTION KEYWORD SCORE (30%)
# --------------------------------------------------

def calculate_keyword_score(resume_text, job_description, required_skills):
    """
    Compare meaningful job-description keywords with resume text.

    This is a basic keyword-based estimate, not semantic matching.
    """

    resume_text_lower = (resume_text or "").lower()
    description_lower = (job_description or "").lower()

    stop_words = {
        "the", "and", "for", "with", "from", "this", "that",
        "are", "you", "your", "will", "have", "has", "our",
        "their", "job", "role", "work", "candidate", "ability",
        "strong", "good", "knowledge", "experience", "skills",
        "skill", "must", "should", "can", "who", "what",
        "all", "any", "not", "its", "they", "them", "about",
        "into", "using", "use", "used", "years", "looking",
        "required", "requirements", "demonstrate", "seeking",
        "responsibilities", "responsibility", "preferred",
        "including", "include", "candidate", "candidates",
        "understanding", "proficient", "proficiency",
        "excellent", "ability", "abilities", "related",
        "relevant", "various", "across", "within", "such",
        "etc", "also", "based", "new", "one", "two"
    }

    description_lower = re.sub(
        r"[^a-zA-Z0-9+#.\s]",
        " ",
        description_lower
    )

    words = re.findall(
        r"\b[a-zA-Z][a-zA-Z0-9+#.]*\b",
        description_lower
    )

    keywords = {
        word.strip(".")
        for word in words
        if len(word.strip(".")) >= 3
        and word.strip(".") not in stop_words
    }

    # Preserve complete required skill names.
    for skill in required_skills or []:
        if isinstance(skill, str) and skill.strip():
            keywords.add(skill.strip().lower())

    matched_keywords = []
    missing_keywords = []

    for keyword in sorted(keywords):
        pattern = (
            r"(?<!\w)"
            + re.escape(keyword)
            + r"(?!\w)"
        )

        if re.search(pattern, resume_text_lower):
            matched_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    total_keywords = len(keywords)

    percentage = (
        len(matched_keywords) / total_keywords * 100
        if total_keywords else 0
    )

    weight = 30

    return {
        "component": "Job Description Keyword Match",
        "weight": weight,
        "percentage": round(percentage, 2),
        "weighted_score": round(percentage * weight / 100, 2),
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "total_keywords": total_keywords
    }


# --------------------------------------------------
# 3. RESUME CONTENT SCORE (15%)
# --------------------------------------------------

def calculate_content_score(resume_text):
    """Check important resume section headings (15%)."""

    section_keywords = {
        "Summary": [
            "summary",
            "professional summary",
            "career objective",
            "objective",
            "profile summary",
            "professional profile"
        ],
        "Education": [
            "education",
            "academic background",
            "educational qualification",
            "academic details",
            "education details",
            "academic qualifications"
        ],
        "Experience": [
            "experience",
            "work experience",
            "professional experience",
            "internship",
            "internships",
            "work history",
            "employment history"
        ],
        "Projects": [
            "projects",
            "academic projects",
            "personal projects",
            "project experience",
            "key projects",
            "academic project"
        ],
        "Skills": [
            "skills",
            "technical skills",
            "core competencies",
            "technical competencies",
            "key skills",
            "programming skills"
        ],
        "Certifications": [
            "certifications",
            "certificates",
            "courses",
            "certification",
            "professional certifications",
            "training and certifications"
        ]
    }

    lines = []

    for line in (resume_text or "").lower().splitlines():
        normalized_line = re.sub(
            r"[^a-z0-9 ]",
            "",
            line
        ).strip()

        # Remove optional numbering and bullets.
        normalized_line = re.sub(
            r"^\d+\s*",
            "",
            normalized_line
        ).strip()

        if normalized_line:
            lines.append(normalized_line)

    present_sections = []
    missing_sections = []

    for section, headings in section_keywords.items():
        normalized_headings = [
            re.sub(r"[^a-z0-9 ]", "", heading).strip()
            for heading in headings
        ]

        found = any(
            line in normalized_headings
            for line in lines
        )

        if found:
            present_sections.append(section)
        else:
            missing_sections.append(section)

    total_sections = len(section_keywords)

    percentage = (
        len(present_sections) / total_sections * 100
        if total_sections else 0
    )

    weight = 15

    return {
        "component": "Resume Content Sections",
        "weight": weight,
        "percentage": round(percentage, 2),
        "weighted_score": round(percentage * weight / 100, 2),
        "present_sections": present_sections,
        "found_sections": present_sections,
        "missing_sections": missing_sections,
        "total_sections": total_sections
    }


# --------------------------------------------------
# 4. SENTENCE QUALITY SCORE (10%)
# --------------------------------------------------

def calculate_sentence_quality_score(resume_text):
    """Evaluate resume writing using basic text heuristics."""

    text = (resume_text or "").strip()

    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)

    sentences = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip().split()) >= 4
    ]

    if not sentences:
        return {
            "component": "Sentence Quality",
            "weight": 10,
            "percentage": 0,
            "weighted_score": 0,
            "quality_checks": [],
            "feedback": [
                "Add clear and meaningful statements to your resume."
            ],
            "total_sentences": 0
        }

    action_verbs = {
        "built", "developed", "created", "designed",
        "implemented", "managed", "analyzed", "analysed",
        "improved", "optimized", "optimised", "automated",
        "tested", "deployed", "led", "integrated",
        "engineered", "maintained", "configured",
        "achieved", "reduced", "increased", "generated",
        "performed", "delivered", "programmed", "trained"
    }

    quality_checks = []
    feedback = []

    action_sentence_count = 0

    for sentence in sentences:
        words = re.findall(r"\b[a-zA-Z]+\b", sentence.lower())

        if any(word in action_verbs for word in words):
            action_sentence_count += 1

    action_percentage = (
        action_sentence_count / len(sentences) * 100
    )

    if action_percentage >= 40:
        quality_checks.append("Uses action-oriented language")
    else:
        feedback.append(
            "Use strong action verbs such as Developed, Built, "
            "Implemented and Analyzed where appropriate."
        )

    sentence_lengths = [
        len(sentence.split()) for sentence in sentences
    ]

    readable_sentences = sum(
        1 for length in sentence_lengths
        if 6 <= length <= 30
    )

    readability_percentage = (
        readable_sentences / len(sentences) * 100
    )

    if readability_percentage >= 60:
        quality_checks.append("Good sentence length and readability")
    else:
        feedback.append(
            "Keep resume statements concise and easy to understand."
        )

    complete_sentences = sum(
        1 for length in sentence_lengths
        if length >= 6
    )

    completeness_percentage = (
        complete_sentences / len(sentences) * 100
    )

    if completeness_percentage >= 80:
        quality_checks.append(
            "Contains sufficiently detailed statements"
        )
    else:
        feedback.append(
            "Expand incomplete statements with meaningful details."
        )

    percentage = (
        action_percentage * 0.40
        + readability_percentage * 0.35
        + completeness_percentage * 0.25
    )

    percentage = round(percentage, 2)

    if not feedback:
        feedback.append(
            "Your resume statements show good writing structure."
        )

    weight = 10

    return {
        "component": "Sentence Quality",
        "weight": weight,
        "percentage": percentage,
        "weighted_score": round(percentage * weight / 100, 2),
        "quality_checks": quality_checks,
        "feedback": feedback,
        "total_sentences": len(sentences)
    }


# --------------------------------------------------
# 5. EDUCATION MATCH SCORE (5%)
# --------------------------------------------------

def calculate_education_score(resume_text, job_description):
    """Estimate education relevance using keyword matching."""

    resume_lower = (resume_text or "").lower()
    description_lower = (job_description or "").lower()

    education_terms = {
        "bachelor": [
            "bachelor", "b.tech", "b.e", "b.sc",
            "bca", "bachelor's"
        ],
        "master": [
            "master", "m.tech", "m.e", "m.sc",
            "mca", "master's"
        ],
        "computer_science": [
            "computer science",
            "computer engineering",
            "information technology",
            "information science"
        ],
        "artificial_intelligence": [
            "artificial intelligence",
            "machine learning",
            "data science"
        ],
        "diploma": ["diploma"],
        "phd": ["phd", "doctorate"]
    }

    required_groups = []

    for group, terms in education_terms.items():
        if any(term in description_lower for term in terms):
            required_groups.append(group)

    if not required_groups:
        return {
            "component": "Education Match",
            "weight": 5,
            "percentage": 100,
            "weighted_score": 5,
            "matched_qualifications": [],
            "feedback": (
                "No specific education requirement was identified "
                "in the job description."
            )
        }

    matched_groups = []

    for group in required_groups:
        terms = education_terms[group]

        if any(term in resume_lower for term in terms):
            matched_groups.append(group)

    percentage = (
        len(matched_groups) / len(required_groups) * 100
    )

    weight = 5

    return {
        "component": "Education Match",
        "weight": weight,
        "percentage": round(percentage, 2),
        "weighted_score": round(percentage * weight / 100, 2),
        "matched_qualifications": matched_groups,
        "feedback": (
            "Education keywords were compared with the job description."
        )
    }


# --------------------------------------------------
# 6. OVERALL ATS SCORE
# --------------------------------------------------

def calculate_overall_ats_score(
    resume_text,
    resume_skills,
    required_skills,
    job_description
):
    """Calculate the estimated ATS score out of 100."""

    skills_result = calculate_skills_score(
        resume_skills,
        required_skills
    )

    keyword_result = calculate_keyword_score(
        resume_text,
        job_description,
        required_skills
    )

    content_result = calculate_content_score(resume_text)

    sentence_result = calculate_sentence_quality_score(resume_text)

    education_result = calculate_education_score(
        resume_text,
        job_description
    )

    components = {
        "skills": skills_result,
        "keywords": keyword_result,
        "content": content_result,
        "sentence_quality": sentence_result,
        "education": education_result
    }

    overall_score = sum(
        component["weighted_score"]
        for component in components.values()
    )

    return {
        "overall_score": round(overall_score, 2),
        "score_out_of": 100,
        "score_type": "Estimated ATS Compatibility Score",
        "components": components
    }
