
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database
from app.database.connection import engine, Base

# Database models
from app.database.user_model import User
from app.database.resume_model import Resume
from app.database.skill_model import ResumeSkill
from app.database.job_role_model import JobRole, JobRoleSkill
from app.database.learning_progress_model import LearningProgress
from app.database.resource_model import LearningResource

# API routers
from app.api.user import router as user_router
from app.api.resume import router as resume_router
from app.api.job_role import router as job_role_router
from app.api.dashboard import router as dashboard_router
from app.api.admin import router as admin_router
from app.api.learning_path import router as learning_path_router
from app.api.resource import router as resource_router


# ==========================================
# CREATE DATABASE TABLES
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="AI Career Intelligence Platform",
    description="An AI-powered career and job recommendation system",
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REGISTER API ROUTERS
# ==========================================

app.include_router(user_router)
app.include_router(resume_router)
app.include_router(job_role_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(learning_path_router)
app.include_router(resource_router)


# ==========================================
# HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to AI Career Intelligence Platform!",
        "status": "Backend is running successfully"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
