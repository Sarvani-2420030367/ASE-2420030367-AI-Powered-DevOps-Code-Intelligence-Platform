import os
import json
import shutil
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.project import Project
from app.models.repository import Repository
from app.models.analysis import Analysis
from app.models.finding import Finding
from app.models.artifact import Artifact
from app.analyzers.repository_analyzer import RepositoryAnalyzer
from app.services.scoring_service import ScoringService
from app.ai.llm_service import llm_service
from app.utils.security import get_password_hash

DEMO_REPO_SOURCE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo_repo"))

class DemoService:
    @staticmethod
    def get_or_create_demo_user(db: Session) -> User:
        user = db.query(User).filter(User.email == "demo@devsight.ai").first()
        if not user:
            user = User(
                name="Demo Engineer",
                email="demo@devsight.ai",
                password_hash=get_password_hash("DevSightDemo2026!")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def load_demo_project(db: Session, user: User) -> Project:
        # Check if demo project already exists
        existing_project = db.query(Project).filter(
            Project.user_id == user.id,
            Project.name == "E-Commerce Cloud API"
        ).first()
        if existing_project:
            return existing_project

        # Create new demo project
        project = Project(
            user_id=user.id,
            name="E-Commerce Cloud API",
            description="Production distributed order lifecycle and checkout gateway microservice.",
            repository_url="https://github.com/devsight-demo/ecommerce-api",
            primary_language="Python"
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # Copy demo repository to unique extracted project folder
        generated_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "generated", "repos", project.id))
        os.makedirs(generated_dir, exist_ok=True)
        shutil.copytree(DEMO_REPO_SOURCE, generated_dir, dirs_exist_ok=True)

        # Run Real Analysis on Demo Repository
        analyzer = RepositoryAnalyzer()
        results = analyzer.analyze_repository(generated_dir)

        # Calculate Scores
        scores = ScoringService.calculate_scores(results["findings"], results["devops_signals"])

        # Generate AI Insights
        insights = llm_service.generate_repository_insights({
            "primary_language": results["primary_language"],
            "devops_signals": results["devops_signals"],
            "findings": [f.__dict__ for f in results["findings"]]
        })

        # Persist Repository metadata
        repo = Repository(
            project_id=project.id,
            file_count=results["file_count"],
            line_count=results["line_count"],
            languages=json.dumps(results["languages"]),
            dependencies=json.dumps(results["dependencies"]),
            extracted_path=generated_dir
        )
        db.add(repo)

        # Persist Analysis
        analysis = Analysis(
            project_id=project.id,
            health_score=scores["health_score"],
            quality_score=scores["quality_score"],
            security_score=scores["security_score"],
            maintainability_score=scores["maintainability_score"],
            architecture_score=scores["architecture_score"],
            devops_readiness_score=scores["devops_readiness_score"],
            devops_readiness_details=json.dumps(scores["devops_pillars"]),
            insights=json.dumps(insights)
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # Persist Findings
        for f in results["findings"]:
            finding_record = Finding(
                analysis_id=analysis.id,
                type=f.type,
                severity=f.severity,
                file_path=f.file,
                line_number=f.line,
                title=f.title,
                description=f.description,
                recommendation=f.recommendation
            )
            db.add(finding_record)

        # Add initial sample artifacts
        dockerfile_content = """# Multi-stage Python Production Container
FROM python:3.11-slim as builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
USER 1001
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
"""
        compose_content = """version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=secret_env_pass
    depends_on:
      - db
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret_env_pass
      MYSQL_DATABASE: devsight
    ports:
      - "3306:3306"
"""
        db.add(Artifact(project_id=project.id, artifact_type="dockerfile", filename="Dockerfile", content=dockerfile_content))
        db.add(Artifact(project_id=project.id, artifact_type="docker-compose", filename="docker-compose.yml", content=compose_content))

        db.commit()
        db.refresh(project)
        return project

demo_service = DemoService()
