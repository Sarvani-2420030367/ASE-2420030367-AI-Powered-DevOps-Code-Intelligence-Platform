from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ArtifactOut(BaseModel):
    id: str
    project_id: str
    artifact_type: str
    filename: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class GenerateDockerRequest(BaseModel):
    project_id: str
    port: Optional[int] = None
    base_image: Optional[str] = None

class GenerateCicdRequest(BaseModel):
    project_id: str
    platform: str = "github"  # github or gitlab
    deploy_target: Optional[str] = "docker"

class GenerateK8sRequest(BaseModel):
    project_id: str
    app_name: Optional[str] = None
    port: Optional[int] = 8000
    replicas: Optional[int] = 2
    cpu_limit: Optional[str] = "500m"
    memory_limit: Optional[str] = "512Mi"
