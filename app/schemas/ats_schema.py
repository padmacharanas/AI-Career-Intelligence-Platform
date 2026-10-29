
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, ConfigDict


class ATSAnalysisRequest(BaseModel):
    resume_id: int = Field(gt=0)
    job_role_id: int = Field(gt=0)


class ATSAnalysisResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int
    job_role_id: int | None
    overall_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    analysis_report: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ATSAnalysisHistoryItem(BaseModel):
    id: int
    resume_id: int
    job_role_id: int | None
    overall_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
