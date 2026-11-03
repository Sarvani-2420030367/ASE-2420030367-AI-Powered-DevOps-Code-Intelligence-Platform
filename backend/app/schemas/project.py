from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    primary_language: Optional[str] = "Unknown"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    repository_url: Optional[str] = None
    primary_language: Optional[str] = None

class ProjectOut(ProjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    health_score: Optional[float] = None
    security_score: Optional[float] = None
    devops_score: Optional[float] = None
    file_count: Optional[int] = 0
    line_count: Optional[int] = 0

    class Config:
        from_attributes = True
