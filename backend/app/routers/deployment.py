import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from app.models.repository import Repository
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.artifact import Artifact
from app.schemas.artifact import ArtifactOut, GenerateDockerRequest, GenerateCicdRequest, GenerateK8sRequest
from app.utils.security import get_current_user

router = APIRouter(tags=["Deployment & Manifest Generation"])

def save_or_update_artifact(project_id: str, artifact_type: str, filename: str, content: str, db: Session) -> Artifact:
    artifact = db.query(Artifact).filter(
        Artifact.project_id == project_id,
        Artifact.filename == filename
    ).first()
    if not artifact:
        artifact = Artifact(project_id=project_id, artifact_type=artifact_type, filename=filename, content=content)
        db.add(artifact)
    else:
        artifact.content = content
        artifact.artifact_type = artifact_type
    db.commit()
    db.refresh(artifact)
    return artifact

@router.post("/api/projects/{project_id}/generate/docker", response_model=List[ArtifactOut], summary="Generate production Dockerfile, Docker Compose, and .dockerignore")
def generate_docker(
    project_id: str,
    payload: Optional[GenerateDockerRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    lang = (project.primary_language or "Python").lower()
    port = (payload.port if payload and payload.port else 8000)

    # 1. Multi-stage Dockerfile based on language
    if "python" in lang:
      dockerfile_content = """# DevSight AI - Python Streamlit Application

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install application dependencies
RUN pip install --no-cache-dir streamlit pandas streamlit-authenticator

# Copy project files
COPY . .

# Streamlit port
EXPOSE 8501

# Start Streamlit application
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0", "--server.port=8501", "--server.headless=true"]
"""
    elif "node" in lang or "javascript" in lang or "typescript" in lang:
        dockerfile_content = f"""# syntax=docker/dockerfile:1
# Multi-stage Node.js / React Production Container
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE {port if port != 8000 else 80}
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget --quiet --tries=1 --spider http://localhost:{port if port != 8000 else 80}/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
"""
    elif "java" in lang:
        dockerfile_content = f"""# Multi-stage Java / Spring Boot Container
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-jammy AS runner
WORKDIR /app
RUN useradd -u 1001 appuser
COPY --from=builder /app/target/*.jar app.jar
EXPOSE {port}
USER appuser
CMD ["java", "-jar", "app.jar"]
"""
    elif "go" in lang:
        dockerfile_content = f"""# Multi-stage Go Binary Container
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /server .

FROM gcr.io/distroless/static-debian12
WORKDIR /
COPY --from=builder /server /server
EXPOSE {port}
USER nonroot:nonroot
CMD ["/server"]
"""
    else:
        dockerfile_content = f"""FROM alpine:3.19
WORKDIR /app
COPY . .
EXPOSE {port}
CMD ["echo", "DevSight customized container ready"]
"""

    # 2. docker-compose.yml
    compose_content = f"""version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: {project.name.lower().replace(' ', '-')}-service
    restart: unless-stopped
    ports:
      - "{port}:{port}"
    environment:
      - APP_ENV=production
      - PORT={port}
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=devsight
      - DB_USER=root
      - DB_PASSWORD=db_root_secret
    depends_on:
      db:
        condition: service_healthy

  db:
    image: mysql:8.0
    container_name: {project.name.lower().replace(' ', '-')}-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: db_root_secret
      MYSQL_DATABASE: devsight
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db_data:
    driver: local
"""

    # 3. .dockerignore
    dockerignore_content = """.git
.gitignore
.env
__pycache__
*.pyc
*.pyo
*.pyd
node_modules
dist
build
.vscode
.idea
.DS_Store
*.log
coverage/
"""

    art1 = save_or_update_artifact(project.id, "dockerfile", "Dockerfile", dockerfile_content, db)
    art2 = save_or_update_artifact(project.id, "docker-compose", "docker-compose.yml", compose_content, db)
    art3 = save_or_update_artifact(project.id, "dockerignore", ".dockerignore", dockerignore_content, db)

    return [ArtifactOut.model_validate(a) for a in [art1, art2, art3]]

@router.post(
    "/api/projects/{project_id}/docker/build",
    summary="Build a Docker image for the uploaded project"
)
def build_project_docker_image(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # 2. Find the uploaded repository
    repo = db.query(Repository).filter(
        Repository.project_id == project.id
    ).first()

    if not repo or not repo.extracted_path:
        raise HTTPException(
            status_code=400,
            detail="Please upload a repository before building a Docker image"
        )

    repo_path = Path(repo.extracted_path).resolve()
    print("\n========== APPLICATION DETAILS ==========")

    for filename in ["requirements", "requirements.txt", "app.py", "README.md", "How to run.txt"]:
        file_path = repo_path / filename

        if file_path.is_file():
            print(f"\n--- {filename} ---")

            try:
                content = file_path.read_text(
                    encoding="utf-8",
                    errors="ignore"
                )

                print(content[:2500])
            except Exception as e:
                print("Could not read:", e)

        elif file_path.is_dir():
            print(f"{filename} is a DIRECTORY")
        else:
            print(f"{filename} does not exist")

    print("========================================\n")
    print("\n========== PROJECT DOCKER STRUCTURE ==========")
    print("Project:", project.name)
    print("Repository path:", repo_path)

    for root, dirs, files in os.walk(repo_path):
        level = os.path.relpath(root, repo_path).count(os.sep)

        if level >= 3:
            dirs[:] = []
            continue

        print("\nFolder:", os.path.relpath(root, repo_path))
        print("Files:", files)

    print("==============================================\n")

    if not repo_path.is_dir():
        raise HTTPException(
            status_code=400,
            detail="Uploaded repository directory does not exist"
        )

    # 3. Retrieve generated Dockerfile
    docker_artifact = db.query(Artifact).filter(
        Artifact.project_id == project.id,
        Artifact.filename == "Dockerfile"
    ).first()

    if not docker_artifact or not docker_artifact.content:
        raise HTTPException(
            status_code=400,
            detail="Dockerfile not generated. Generate Docker artifacts first."
        )

    # 4. Locate Docker CLI
    docker = shutil.which("docker")

    if not docker:
        raise HTTPException(
            status_code=503,
            detail="Docker CLI not found. Check Docker Desktop installation."
        )

    # 5. Generate unique image name for this project
    safe_project_id = re.sub(
        r"[^a-z0-9_.-]",
        "-",
        str(project.id).lower()
    )

    image_tag = f"devsight-{safe_project_id}:latest"

    try:
        # 6. Create an isolated temporary build context
        with tempfile.TemporaryDirectory(
            prefix="devsight-build-"
        ) as temp_dir:

            build_context = Path(temp_dir) / "context"
            build_context.mkdir()

            # Copy repository source files
            shutil.copytree(
                repo_path,
                build_context,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(
                    ".git",
                    ".env",
                    ".venv",
                    "venv",
                    "__pycache__",
                    "*.pyc",
                    "node_modules",
                    "dist",
                    "build"
                )
            )

            # Write generated Dockerfile
            (build_context / "Dockerfile").write_text(
                docker_artifact.content,
                encoding="utf-8"
            )

            # Write generated .dockerignore
            ignore_artifact = db.query(Artifact).filter(
                Artifact.project_id == project.id,
                Artifact.filename == ".dockerignore"
            ).first()

            if ignore_artifact:
                (build_context / ".dockerignore").write_text(
                    ignore_artifact.content,
                    encoding="utf-8"
                )

            # 7. Build Docker image
            result = subprocess.run(
                [
                    docker,
                    "build",
                    "--progress=plain",
                    "-t",
                    image_tag,
                    "-f",
                    str(build_context / "Dockerfile"),
                    str(build_context)
                ],
                capture_output=True,
                text=True,
                timeout=900
            )

            if result.returncode != 0:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "message": "Docker image build failed",
                        "logs": (result.stderr or result.stdout)[-5000:]
                    }
                )

        # 8. Return build information
        return {
            "project_id": project.id,
            "project_name": project.name,
            "image": image_tag,
            "build_status": "completed",
            "message": "Docker image built successfully"
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail="Docker image build timed out"
        )

    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Docker executable could not be started"
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Docker build failed: {str(e)}"
        )

@router.post("/api/projects/{project_id}/generate/cicd", response_model=ArtifactOut, summary="Generate automated CI/CD pipeline workflow")
def generate_cicd(
    project_id: str,
    payload: GenerateCicdRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    platform = payload.platform.lower()

    if platform == "gitlab":
        content = """stages:
  - test
  - security
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""

lint_and_unit_tests:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pytest tests/ --junitxml=report.xml
  artifacts:
    reports:
      junit: report.xml

security_sast_scan:
  stage: security
  image: returntocorp/semgrep:latest
  script:
    - semgrep scan --config=auto --error

build_container_image:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy_staging:
  stage: deploy
  script:
    - echo "Deploying to production cluster via Kubernetes..."
    - kubectl apply -f k8s/
  only:
    - main
"""
        filename = ".gitlab-ci.yml"
        art_type = "cicd-gitlab"
    else:
        # Default GitHub Actions
        content = f"""name: DevSight CI/CD Pipeline

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]

permissions:
  contents: read
  security-events: write

jobs:
  checkout-and-test:
    name: Lint & Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code Repository
        uses: actions/checkout@v4

      - name: Setup Python Runtime
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Project Dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run Static Code Analysis & Linting
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Run Automated Test Suites
        run: |
          pip install pytest pytest-cov
          pytest --cov=. --cov-report=xml

  security-scan:
    name: Security Vulnerability Scan
    runs-on: ubuntu-latest
    needs: checkout-and-test
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Trivy Security Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

  build-and-push:
    name: Container Build & Push
    runs-on: ubuntu-latest
    needs: security-scan
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: actions/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          username: ${{{{ secrets.DOCKERHUB_USERNAME }}}}
          password: ${{{{ secrets.DOCKERHUB_TOKEN }}}}

      - name: Build & Publish Production Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: devsight/{project.name.lower().replace(' ', '-')}:${{{{ github.sha }}}},devsight/{project.name.lower().replace(' ', '-')}:latest

  deploy-kubernetes:
    name: Deploy to Kubernetes Cluster
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout Manifests
        uses: actions/checkout@v4

      - name: Apply Kubernetes Configurations
        run: |
          echo "Deploying production workloads..."
          # kubectl apply -f k8s/
"""
        filename = ".github/workflows/ci.yml"
        art_type = "cicd-github"

    artifact = save_or_update_artifact(project.id, art_type, filename, content, db)
    return ArtifactOut.model_validate(artifact)

@router.post("/api/projects/{project_id}/generate/kubernetes", response_model=List[ArtifactOut], summary="Generate complete set of production Kubernetes manifests")
def generate_kubernetes(
    project_id: str,
    payload: GenerateK8sRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    app_name = (payload.app_name or project.name.lower().replace(" ", "-"))
    port = payload.port or 8000
    replicas = payload.replicas or 2
    cpu_limit = payload.cpu_limit or "500m"
    mem_limit = payload.memory_limit or "512Mi"

    # 1. deployment.yaml
    deployment = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: {app_name}-deployment
  namespace: default
  labels:
    app: {app_name}
    managed-by: devsight-ai
spec:
  replicas: {replicas}
  selector:
    matchLabels:
      app: {app_name}
  template:
    metadata:
      labels:
        app: {app_name}
    spec:
      containers:
      - name: {app_name}
        image: {app_name}:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: {port}
          name: http
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: {cpu_limit}
            memory: {mem_limit}
        livenessProbe:
          httpGet:
            path: /health
            port: {port}
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /health
            port: {port}
          initialDelaySeconds: 5
          periodSeconds: 10
        envFrom:
        - configMapRef:
            name: {app_name}-config
        - secretRef:
            name: {app_name}-secrets
"""

    # 2. service.yaml
    service = f"""apiVersion: v1
kind: Service
metadata:
  name: {app_name}-service
  namespace: default
  labels:
    app: {app_name}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: {port}
    protocol: TCP
    name: http
  selector:
    app: {app_name}
"""

    # 3. configmap.yaml
    configmap = f"""apiVersion: v1
kind: ConfigMap
metadata:
  name: {app_name}-config
  namespace: default
data:
  APP_ENV: "production"
  PORT: "{port}"
  LOG_LEVEL: "INFO"
"""

    # 4. secret.yaml
    secret = f"""apiVersion: v1
kind: Secret
metadata:
  name: {app_name}-secrets
  namespace: default
type: Opaque
stringData:
  DATABASE_URL: "mysql+pymysql://app_user:prod_secure_password@db-cluster:3306/{app_name}_db"
  JWT_SECRET: "replace_with_vault_injected_secret_key"
"""

    # 5. ingress.yaml
    ingress = f"""apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {app_name}-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - {app_name}.devsight.cloud
    secretName: {app_name}-tls-cert
  rules:
  - host: {app_name}.devsight.cloud
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {app_name}-service
            port:
              number: 80
"""

    manifests = [
        ("deployment.yaml", deployment, "kubernetes"),
        ("service.yaml", service, "kubernetes"),
        ("configmap.yaml", configmap, "kubernetes"),
        ("secret.yaml", secret, "kubernetes"),
        ("ingress.yaml", ingress, "kubernetes"),
    ]

    saved = []
    for fn, ct, typ in manifests:
        art = save_or_update_artifact(project.id, typ, fn, ct, db)
        saved.append(ArtifactOut.model_validate(art))

    return saved

@router.get("/api/projects/{project_id}/artifacts", response_model=List[ArtifactOut], summary="List all generated artifacts for a project")
def list_artifacts(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    artifacts = db.query(Artifact).filter(Artifact.project_id == project.id).order_by(Artifact.created_at.desc()).all()
    return [ArtifactOut.model_validate(a) for a in artifacts]

@router.get("/api/artifacts/{artifact_id}", response_model=ArtifactOut, summary="Retrieve a single artifact content")
def get_artifact(artifact_id: str, db: Session = Depends(get_db)):
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return ArtifactOut.model_validate(artifact)
