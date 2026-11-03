from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.repository import router as repository_router
from app.routers.analysis import router as analysis_router
from app.routers.ai import router as ai_router
from app.routers.deployment import router as deployment_router
from app.routers.security import router as security_router
from app.routers.docker_security import router as docker_security_router

__all__ = [
    "auth_router",
    "projects_router",
    "repository_router",
    "analysis_router",
    "ai_router",
    "deployment_router",
    "security_router",
    "docker_security_router"
]