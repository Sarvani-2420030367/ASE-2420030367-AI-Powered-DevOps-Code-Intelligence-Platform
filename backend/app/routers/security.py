import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.utils.security import get_current_user
from app.services.vulnerability_scanner import VulnerabilityScanner


router = APIRouter(
    prefix="/api/projects/{project_id}/security",
    tags=["Vulnerability Scanning"]
)


EXCLUDED_DIRECTORIES = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build"
}


@router.post("/dependencies")
def scan_dependencies(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify that the project belongs to the logged-in user.
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # 2. Get the uploaded repository.
    repository = project.repository

    if not repository or not repository.extracted_path:
        raise HTTPException(
            status_code=400,
            detail="No uploaded repository found for this project"
        )

    repo_path = Path(os.path.realpath(repository.extracted_path))

    if not repo_path.is_dir():
        raise HTTPException(
            status_code=400,
            detail="Repository directory does not exist"
        )

    # 3. Find dependency manifests.
    requirements_files = []
    npm_directories = []

    for root, directories, files in os.walk(repo_path):
        directories[:] = [
            directory for directory in directories
            if directory not in EXCLUDED_DIRECTORIES
        ]

        current_path = Path(root)

        if "requirements.txt" in files:
            requirements_files.append(
                current_path / "requirements.txt"
            )

        if (
            "package.json" in files
            and "package-lock.json" in files
        ):
            npm_directories.append(current_path)

    # 4. Run vulnerability scans.
    all_findings = []

    try:
        for requirements_file in requirements_files:
            all_findings.extend(
                VulnerabilityScanner.scan_python(str(requirements_file))
            )

        for npm_directory in npm_directories:
            all_findings.extend(
                VulnerabilityScanner.scan_npm(str(npm_directory))
            )

    except RuntimeError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    # 5. Calculate summary.
    summary = {
        "total": len(all_findings),
        "critical": sum(
            1 for item in all_findings
            if item["severity"] == "CRITICAL"
        ),
        "high": sum(
            1 for item in all_findings
            if item["severity"] == "HIGH"
        ),
        "medium": sum(
            1 for item in all_findings
            if item["severity"] == "MEDIUM"
        ),
        "low": sum(
            1 for item in all_findings
            if item["severity"] == "LOW"
        ),
        "unknown": sum(
            1 for item in all_findings
            if item["severity"] == "UNKNOWN"
        )
    }

    return {
        "project_id": project.id,
        "project_name": project.name,
        "summary": summary,
        "findings": all_findings
    }