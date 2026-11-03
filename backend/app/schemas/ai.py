from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ChatRequest(BaseModel):
    project_id: str
    message: str

class SourceReference(BaseModel):
    file_path: str
    line_number: Optional[int] = None
    snippet: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]] = []

class InsightsRequest(BaseModel):
    project_id: str

class InsightsResponse(BaseModel):
    architecture_summary: str
    key_components: List[Dict[str, str]]
    recommendations: List[str]
