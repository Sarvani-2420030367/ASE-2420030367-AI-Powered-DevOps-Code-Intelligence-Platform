from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    projects_router,
    repository_router,
    analysis_router,
    ai_router,
    deployment_router,
    security_router,
    docker_security_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield

app = FastAPI(
    title="DevSight AI — DevOps & Code Intelligence Platform API",
    description="""
    ## DevSight AI Platform Engine
    Enterprise-grade developer productivity and DevOps intelligence platform.
    
    ### Capabilities:
    * **Code Analysis**: AST and static pattern inspection across Python, JavaScript, TypeScript, Java, C/C++, and Go.
    * **Security Scanning**: Secret detection, dangerous functions, SQL injection, insecure dependencies.
    * **Health & DevOps Readiness**: Transparent 40/30/20/10 weighted score formula and 8-pillar DevOps radar.
    * **AI Code Assistant**: Contextual Q&A on repository architecture with source code citation.
    * **Deployment Automation**: Automated Dockerfile, Docker Compose, CI/CD pipelines, and Kubernetes manifests.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local frontend vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(repository_router)
app.include_router(analysis_router)
app.include_router(ai_router)
app.include_router(deployment_router)
app.include_router(security_router)
app.include_router(docker_security_router)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "DevSight AI API",
        "version": "1.0.0"
    }
