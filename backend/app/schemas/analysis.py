from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FindingOut(BaseModel):
    id: str
    analysis_id: str
    type: str
    severity: str
    file_path: str
    line_number: Optional[int] = 1
    title: str
    description: str
    recommendation: str

    class Config:
        from_attributes = True

class AnalysisOut(BaseModel):
    id: str
    project_id: str
    health_score: float
    quality_score: float
    security_score: float
    maintainability_score: float
    architecture_score: float
    devops_readiness_score: float
    devops_readiness_details: Dict[str, Any]
    insights: Dict[str, Any]
    created_at: datetime
    findings_count: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0

    class Config:
        from_attributes = True

class AnalysisDetailOut(AnalysisOut):
    findings: List[FindingOut] = []
