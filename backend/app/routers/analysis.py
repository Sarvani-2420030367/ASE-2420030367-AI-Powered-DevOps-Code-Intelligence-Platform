import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.analysis import Analysis
from app.models.finding import Finding
from app.schemas.analysis import AnalysisOut, AnalysisDetailOut, FindingOut
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/projects/{project_id}", tags=["Analysis"])

@router.get("/analysis", response_model=AnalysisOut, summary="Retrieve latest analysis metrics and scores")
def get_analysis(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    analysis = db.query(Analysis).filter(Analysis.project_id == project.id).order_by(Analysis.created_at.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found for this project")

    findings = db.query(Finding).filter(Finding.analysis_id == analysis.id).all()
    crit_count = sum(1 for f in findings if f.severity == "CRITICAL")
    high_count = sum(1 for f in findings if f.severity == "HIGH")
    med_count = sum(1 for f in findings if f.severity == "MEDIUM")
    low_count = sum(1 for f in findings if f.severity == "LOW")

    return AnalysisOut(
        id=analysis.id,
        project_id=analysis.project_id,
        health_score=analysis.health_score,
        quality_score=analysis.quality_score,
        security_score=analysis.security_score,
        maintainability_score=analysis.maintainability_score,
        architecture_score=analysis.architecture_score,
        devops_readiness_score=analysis.devops_readiness_score,
        devops_readiness_details=json.loads(analysis.devops_readiness_details) if analysis.devops_readiness_details else {},
        insights=json.loads(analysis.insights) if analysis.insights else {},
        created_at=analysis.created_at,
        findings_count=len(findings),
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count
    )

@router.get("/findings", response_model=List[FindingOut], summary="List and filter identified static code findings")
def get_findings(
    project_id: str,
    finding_type: Optional[str] = Query(None, alias="type", description="Filter by type: QUALITY, SECURITY, MAINTAINABILITY"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, INFO"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    latest_analysis = db.query(Analysis).filter(Analysis.project_id == project.id).order_by(Analysis.created_at.desc()).first()
    if not latest_analysis:
        return []

    query = db.query(Finding).filter(Finding.analysis_id == latest_analysis.id)
    if finding_type:
        query = query.filter(Finding.type == finding_type.upper())
    if severity:
        query = query.filter(Finding.severity == severity.upper())

    return query.order_by(
        # Order by severity priority
        Finding.severity.asc()
    ).all()
