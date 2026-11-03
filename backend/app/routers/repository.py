import os
import json
import shutil
import re
import tempfile
import urllib.request
import urllib.error
import urllib.parse
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.repository import Repository
from app.models.analysis import Analysis
from app.models.finding import Finding
from app.schemas.repository import RepositoryOut, RepositoryUploadResponse
from app.utils.security import get_current_user
from app.utils.zip_security import safe_extract_zip
from app.analyzers.repository_analyzer import RepositoryAnalyzer
from app.services.scoring_service import ScoringService
from app.ai.llm_service import llm_service

router = APIRouter(prefix="/api/projects/{project_id}/repository", tags=["Repository Analysis"])

def run_full_analysis(project: Project, repo_dir: str, db: Session) -> Dict[str, Any]:
    analyzer = RepositoryAnalyzer()
    results = analyzer.analyze_repository(repo_dir)

    # Scoring
    scores = ScoringService.calculate_scores(results["findings"], results["devops_signals"])

    # AI Insights
    insights = llm_service.generate_repository_insights({
        "primary_language": results["primary_language"],
        "devops_signals": results["devops_signals"],
        "findings": [f.__dict__ for f in results["findings"]]
    })

    # Update or create repository
    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    if not repo:
        repo = Repository(project_id=project.id)
        db.add(repo)

    repo.file_count = results["file_count"]
    repo.line_count = results["line_count"]
    repo.languages = json.dumps(results["languages"])
    repo.dependencies = json.dumps(results["dependencies"])
    repo.extracted_path = repo_dir

    project.primary_language = results["primary_language"]

    # Create new analysis entry
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

    # Remove old findings if any
    db.query(Finding).filter(Finding.analysis_id == analysis.id).delete()

    # Add findings
    for f in results["findings"]:
        finding = Finding(
            analysis_id=analysis.id,
            type=f.type,
            severity=f.severity,
            file_path=f.file,
            line_number=f.line,
            title=f.title,
            description=f.description,
            recommendation=f.recommendation
        )
        db.add(finding)

    db.commit()
    return {"repository": repo, "analysis": analysis, "results": results}

@router.post("/upload", response_model=RepositoryUploadResponse, summary="Upload and analyze a repository ZIP archive")
async def upload_repository(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip repository archives are supported")

    upload_folder = os.path.abspath(os.path.join(settings.UPLOAD_DIR, project.id))
    os.makedirs(upload_folder, exist_ok=True)
    temp_zip = os.path.join(upload_folder, "uploaded.zip")

    # Save uploaded file
    try:
        with open(temp_zip, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {str(e)}")

    # Extract securely
    extract_target = os.path.abspath(os.path.join(settings.UPLOAD_DIR, "..", "repos", project.id))
    os.makedirs(extract_target, exist_ok=True)

    success, err_msg, count = safe_extract_zip(temp_zip, extract_target)
    if not success:
        raise HTTPException(status_code=400, detail=f"Extraction failed: {err_msg}")

    # Check if files were extracted into a single top-level folder
    items = os.listdir(extract_target)
    scan_path = extract_target
    if len(items) == 1 and os.path.isdir(os.path.join(extract_target, items[0])):
        scan_path = os.path.join(extract_target, items[0])

    # Run Analysis
    data = run_full_analysis(project, scan_path, db)
    repo = data["repository"]

    return RepositoryUploadResponse(
        message="Repository uploaded and analyzed successfully",
        project_id=project.id,
        repository_id=repo.id,
        file_count=repo.file_count,
        line_count=repo.line_count,
        primary_language=project.primary_language
    )
@router.post(
    "/github-import",
    response_model=RepositoryUploadResponse,
    summary="Import and analyze a public GitHub repository"
)
def import_github_repository(
    project_id: str,
    github_url: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate the GitHub URL
    try:
        parsed = urllib.parse.urlsplit(github_url.strip())

        if parsed.scheme not in ("https", "http") or parsed.hostname != "github.com":
            raise ValueError("Invalid GitHub host")

        parts = [part for part in parsed.path.strip("/").split("/") if part]

        if len(parts) != 2:
            raise ValueError("Enter a repository URL like https://github.com/owner/repository")

        owner = parts[0]
        repo_name = parts[1].removesuffix(".git")

        if not re.fullmatch(r"[A-Za-z0-9_.-]+", owner):
            raise ValueError("Invalid GitHub owner name")

        if not re.fullmatch(r"[A-Za-z0-9_.-]+", repo_name):
            raise ValueError("Invalid GitHub repository name")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    normalized_url = f"https://github.com/{owner}/{repo_name}"

    github_token = os.getenv("GITHUB_TOKEN")

    if not github_token:
        raise HTTPException(
            status_code=500,
            detail="GitHub token not configured. Please set the GITHUB_TOKEN environment variable."
        )

    headers = {
        "User-Agent": "DevSight-AI-Repository-Importer",
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {github_token}",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    temp_zip = None

    try:
        # Get repository details and its default branch
        api_url = f"https://api.github.com/repos/{owner}/{repo_name}"

        request = urllib.request.Request(api_url, headers=headers)

        with urllib.request.urlopen(request, timeout=30) as response:
            repo_info = json.loads(response.read().decode("utf-8"))

        default_branch = repo_info.get("default_branch")

        if not default_branch:
            raise HTTPException(
                status_code=400,
                detail="Could not determine the repository's default branch."
            )

        # Download the repository archive
        archive_url = (
            f"https://api.github.com/repos/{owner}/{repo_name}"
            f"/zipball/{urllib.parse.quote(default_branch, safe='')}"
        )

        archive_request = urllib.request.Request(
            archive_url,
            headers=headers
        )

        upload_folder = os.path.abspath(
            os.path.join(settings.UPLOAD_DIR, project.id)
        )
        os.makedirs(upload_folder, exist_ok=True)

        with tempfile.NamedTemporaryFile(
            mode="wb",
            suffix=".zip",
            dir=upload_folder,
            delete=False
        ) as temp_file:
            temp_zip = temp_file.name

            with urllib.request.urlopen(
                archive_request,
                timeout=60
            ) as response:

                max_size = 50 * 1024 * 1024
                total_size = 0

                while True:
                    chunk = response.read(1024 * 1024)

                    if not chunk:
                        break

                    total_size += len(chunk)

                    if total_size > max_size:
                        raise HTTPException(
                            status_code=413,
                            detail="GitHub repository archive exceeds the 50 MB limit."
                        )

                    temp_file.write(chunk)

        # Extract repository securely
        extract_target = os.path.abspath(
            os.path.join(settings.UPLOAD_DIR, "..", "repos", project.id)
        )

        if os.path.exists(extract_target):
            shutil.rmtree(extract_target)

        os.makedirs(extract_target, exist_ok=True)

        success, err_msg, count = safe_extract_zip(
            temp_zip,
            extract_target
        )

        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"GitHub repository extraction failed: {err_msg}"
            )

        # GitHub archives contain one top-level folder
        items = os.listdir(extract_target)
        scan_path = extract_target

        if (
            len(items) == 1
            and os.path.isdir(os.path.join(extract_target, items[0]))
        ):
            scan_path = os.path.join(extract_target, items[0])

        # Reuse the existing repository analysis engine
        project.repository_url = normalized_url

        data = run_full_analysis(
            project,
            scan_path,
            db
        )

        repo = data["repository"]

        return RepositoryUploadResponse(
            message="GitHub repository imported and analyzed successfully",
            project_id=project.id,
            repository_id=repo.id,
            file_count=repo.file_count,
            line_count=repo.line_count,
            primary_language=project.primary_language
        )

    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise HTTPException(
                status_code=404,
                detail="GitHub repository not found or it is private. Only public repositories are supported currently."
            )

        if e.code == 403:
            raise HTTPException(
                status_code=429,
                detail="GitHub API rate limit reached. Please try again later."
            )

        raise HTTPException(
            status_code=502,
            detail=f"GitHub returned an HTTP error: {e.code}"
        )

    except urllib.error.URLError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to GitHub. Check your internet connection."
        )

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"GitHub import failed: {str(e)}"
        )

    finally:
        if temp_zip and os.path.exists(temp_zip):
            os.remove(temp_zip)

@router.post("/analyze", summary="Trigger re-analysis of repository")
def trigger_analysis(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    if not repo or not repo.extracted_path or not os.path.exists(repo.extracted_path):
        raise HTTPException(status_code=400, detail="No uploaded repository found to re-analyze")

    data = run_full_analysis(project, repo.extracted_path, db)
    return {"status": "success", "message": "Repository re-analysis completed"}

@router.get("", response_model=RepositoryOut, summary="Get repository overview and language breakdown")
def get_repository(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not yet analyzed")

    return RepositoryOut(
        id=repo.id,
        project_id=repo.project_id,
        file_count=repo.file_count,
        line_count=repo.line_count,
        languages=json.loads(repo.languages) if repo.languages else {},
        dependencies=json.loads(repo.dependencies) if repo.dependencies else [],
        uploaded_at=repo.uploaded_at
    )

@router.get("/files", summary="Get directory file tree for repository explorer")
def get_file_tree(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    if not repo or not repo.extracted_path or not os.path.exists(repo.extracted_path):
        return []

    # Build nested tree
    def build_tree(current_path: str, base_path: str):
        tree = []
        ignore = {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build"}
        try:
            entries = sorted(os.scandir(current_path), key=lambda e: (not e.is_dir(), e.name.lower()))
            for entry in entries:
                if entry.name in ignore:
                    continue
                rel_path = os.path.relpath(entry.path, base_path).replace("\\", "/")
                if entry.is_dir():
                    children = build_tree(entry.path, base_path)
                    tree.append({
                        "name": entry.name,
                        "path": rel_path,
                        "type": "directory",
                        "children": children
                    })
                else:
                    size = os.path.getsize(entry.path)
                    tree.append({
                        "name": entry.name,
                        "path": rel_path,
                        "type": "file",
                        "size": size
                    })
        except Exception:
            pass
        return tree

    return build_tree(repo.extracted_path, repo.extracted_path)

@router.get("/file-content", summary="Get file text content and associated inline findings")
def get_file_content(
    project_id: str,
    path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo = db.query(Repository).filter(Repository.project_id == project.id).first()
    if not repo or not repo.extracted_path:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Prevent path traversal
    normalized_path = os.path.normpath(path).lstrip("/\\")
    full_target = os.path.abspath(os.path.join(repo.extracted_path, normalized_path))
    if not full_target.startswith(os.path.abspath(repo.extracted_path)):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not os.path.exists(full_target) or os.path.isdir(full_target):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(full_target, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read file: {str(e)}")

    # Retrieve findings for this specific file
    latest_analysis = db.query(Analysis).filter(Analysis.project_id == project.id).order_by(Analysis.created_at.desc()).first()
    file_findings = []
    if latest_analysis:
        norm_req_path = normalized_path.replace("\\", "/")
        db_findings = db.query(Finding).filter(Finding.analysis_id == latest_analysis.id).all()
        for f in db_findings:
            f_norm = f.file_path.replace("\\", "/").lstrip("./")
            if f_norm == norm_req_path or f_norm.endswith("/" + norm_req_path) or norm_req_path.endswith("/" + f_norm):
                file_findings.append({
                    "id": f.id,
                    "line": f.line_number,
                    "severity": f.severity,
                    "type": f.type,
                    "title": f.title,
                    "description": f.description,
                    "recommendation": f.recommendation
                })

    return {
        "path": normalized_path,
        "content": content,
        "lines": len(content.splitlines()),
        "findings": file_findings
    }
