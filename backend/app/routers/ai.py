import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.repository import Repository
from app.models.analysis import Analysis
from app.models.finding import Finding
from app.models.chat import ChatMessage
from app.schemas.ai import ChatRequest, ChatResponse, InsightsRequest, InsightsResponse
from app.utils.security import get_optional_current_user
from app.ai.llm_service import llm_service

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

@router.post("/chat", response_model=ChatResponse, summary="Query the DevSight AI Assistant regarding the repository")
async def chat_with_codebase(
    payload: ChatRequest,
    current_user: User = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    latest_analysis = db.query(Analysis).filter(Analysis.project_id == project.id).order_by(Analysis.created_at.desc()).first()
    findings = db.query(Finding).filter(Finding.analysis_id == latest_analysis.id).all() if latest_analysis else []

    project_data = {
        "name": project.name,
        "primary_language": project.primary_language,
        "file_count": repo.file_count if repo else 0,
        "line_count": repo.line_count if repo else 0,
        "health_score": latest_analysis.health_score if latest_analysis else 85.0,
        "security_score": latest_analysis.security_score if latest_analysis else 80.0,
        "dependencies": json.loads(repo.dependencies) if repo and repo.dependencies else [],
        "findings": [
            {"file": f.file_path, "line": f.line_number, "type": f.type, "severity": f.severity, "title": f.title, "recommendation": f.recommendation}
            for f in findings
        ]
    }

    # Record User Message
    user_msg = ChatMessage(
        project_id=project.id,
        user_id=current_user.id if current_user else None,
        role="user",
        message=payload.message
    )
    db.add(user_msg)

    # Invoke AI
    ai_result = await llm_service.chat(project_data, payload.message)

    # Record Assistant Message
    assistant_msg = ChatMessage(
        project_id=project.id,
        user_id=current_user.id if current_user else None,
        role="assistant",
        message=ai_result["response"],
        sources=json.dumps(ai_result.get("sources", []))
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        response=ai_result["response"],
        sources=ai_result.get("sources", [])
    )

@router.get("/projects/{project_id}/messages", summary="Fetch conversation history for project")
def get_chat_history(project_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.project_id == project_id).order_by(ChatMessage.created_at.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "sources": json.loads(m.sources) if m.sources else [],
            "created_at": m.created_at
        }
        for m in messages
    ]

@router.post("/insights", response_model=InsightsResponse, summary="Generate or retrieve high-level AI repository insights")
def get_insights(payload: InsightsRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    latest_analysis = db.query(Analysis).filter(Analysis.project_id == project.id).order_by(Analysis.created_at.desc()).first()
    if latest_analysis and latest_analysis.insights:
        data = json.loads(latest_analysis.insights)
        return InsightsResponse(
            architecture_summary=data.get("architecture_summary", ""),
            key_components=data.get("key_components", []),
            recommendations=data.get("recommendations", [])
        )

    # Fallback generation
    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    findings = db.query(Finding).filter(Finding.analysis_id == latest_analysis.id).all() if latest_analysis else []
    insights = llm_service.generate_repository_insights({
        "primary_language": project.primary_language or "Python",
        "devops_signals": {},
        "findings": [{"type": f.type} for f in findings]
    })
    return InsightsResponse(
        architecture_summary=insights["architecture_summary"],
        key_components=insights["key_components"],
        recommendations=insights["recommendations"]
    )
