# AI Career Intelligence Platform

An AI-powered career guidance platform that helps students analyze
their resumes, identify skill gaps, explore suitable job roles and
follow personalized learning paths.

## Project Overview

The AI Career Intelligence Platform is a full-stack web application
designed to help students understand their career readiness.

Students can upload their resumes, extract technical skills, compare
their skills with different job roles, identify missing skills and
access learning recommendations.

Administrators can manage students, resumes, job roles, learning
resources and platform analytics.

## Problem Statement

Many students struggle to understand whether their current skills
match industry job requirements.

They often do not know:
- Which job roles match their existing skills.
- Which technical skills they are missing.
- What they should learn next.
- How to track their learning progress.

This platform addresses these challenges through resume analysis,
job-role matching and skill-based learning recommendations.

## Key Features

### Student Module

- Student registration and login.
- Secure authentication using JWT.
- Resume upload (PDF).
- Automatic resume text extraction.
- Technical skill extraction.
- Job-role matching.
- Skill-gap analysis.
- Personalized learning recommendations.
- Student dashboard.
- Learning path generation.
- Learning progress tracking.
- Profile management.
- Learning resource access.
- Resume and analysis history.

### Admin Module

- Admin dashboard.
- Student management.
- Student resume management.
- Resume details and PDF downloads.
- Job role management (Add, View, Update and Delete).
- Learning resource management (Add, View, Update and Delete).
- Platform analytics.
- Registration and resume upload statistics.
- Popular skill analysis.
- Job-role demand analysis.
- Skill-gap analytics.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML, CSS |
| Backend | Python, FastAPI |
| Database | MySQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Password Security | Argon2 |
| PDF Processing | Python PDF extraction libraries |
| API Communication | Axios, REST API |
| Charts | Recharts |
| Development Tools | VS Code, Git, GitHub |

## System Architecture

```text
                 STUDENT / ADMIN
                        |
                        v
                REACT FRONTEND
                        |
                  Axios / REST API
                        |
                        v
                 FASTAPI BACKEND
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Authentication  Resume       Job Matching
          |          Processing        |
          |             |              |
          +-------------+--------------+
                        |
                        v
                  MYSQL DATABASE
                        |
                        v
              Learning Recommendations
                        |
                        v
                 REACT FRONTEND