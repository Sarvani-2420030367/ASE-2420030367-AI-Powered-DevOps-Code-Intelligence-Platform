from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class RepositoryOut(BaseModel):
    id: str
    project_id: str
    file_count: int
    line_count: int
    languages: Dict[str, Any]
    dependencies: List[Dict[str, Any]]
    uploaded_at: datetime

    class Config:
        from_attributes = True

class RepositoryUploadResponse(BaseModel):
    message: str
    project_id: str
    repository_id: str
    file_count: int
    line_count: int
    primary_language: str
