from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.analysis import Analysis
from app.models.repository import Repository
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.utils.security import get_current_user
from app.services.demo_service import demo_service

router = APIRouter(prefix="/api/projects", tags=["Projects"])

def enrich_project_out(project: Project, db: Session) -> ProjectOut:
    latest_analysis = db.query(Analysis).filter(Analysis.project_id == project.id).order_by(Analysis.created_at.desc()).first()
    repo = db.query(Repository).filter(Repository.project_id == project.id).first()

    return ProjectOut(
        id=project.id,
        user_id=project.user_id,
        name=project.name,
        description=project.description,
        repository_url=project.repository_url,
        primary_language=project.primary_language or "Unknown",
        created_at=project.created_at,
        updated_at=project.updated_at,
        health_score=latest_analysis.health_score if latest_analysis else None,
        security_score=latest_analysis.security_score if latest_analysis else None,
        devops_score=latest_analysis.devops_readiness_score if latest_analysis else None,
        file_count=repo.file_count if repo else 0,
        line_count=repo.line_count if repo else 0
    )

@router.get("", response_model=List[ProjectOut], summary="List all projects for the user")
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()
    return [enrich_project_out(p, db) for p in projects]

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED, summary="Create a new project workspace")
def create_project(payload: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = Project(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        repository_url=payload.repository_url,
        primary_language=payload.primary_language or "Unknown"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return enrich_project_out(project, db)

@router.post("/demo", response_model=ProjectOut, summary="Instantly generate or load the rich Demo Project")
def load_demo(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = demo_service.load_demo_project(db, current_user)
    return enrich_project_out(project, db)

@router.get("/{project_id}", response_model=ProjectOut, summary="Retrieve detailed project metadata")
def get_project(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return enrich_project_out(project, db)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a project and related artifacts")
def delete_project(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None
