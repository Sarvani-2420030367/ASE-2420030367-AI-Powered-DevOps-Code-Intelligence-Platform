import json
import re
import shutil
import subprocess
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/projects/{project_id}/docker-security",
    tags=["Docker Image Security"]
)


def find_trivy():
    """Locate the Trivy executable."""

    executable = shutil.which("trivy")

    if executable:
        return executable

    windows_path = (
        Path.home()
        / "AppData/Local/Microsoft/WinGet/Packages/"
        / "AquaSecurity.Trivy_Microsoft.Winget.Source_8wekyb3d8bbwe/"
        / "trivy.exe"
    )

    if windows_path.is_file():
        return str(windows_path)

    return None


@router.post("/scan")
def scan_docker_image(
    project_id: str,
    image: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify project ownership.
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate image name.
    image = image.strip()

    if (
        not image
        or len(image) > 255
        or not re.fullmatch(
            r"[a-zA-Z0-9][a-zA-Z0-9._/:@-]*",
            image
        )
        or image.startswith("-")
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid Docker image name"
        )

    trivy = find_trivy()

    if not trivy:
        raise HTTPException(
            status_code=503,
            detail="Trivy is not installed or cannot be located"
        )

    try:
        result = subprocess.run(
            [
                trivy,
                "image",
                "--format",
                "json",
                "--quiet",
                image
            ],
            capture_output=True,
            text=True,
            timeout=600
        )

        if not result.stdout.strip():
            raise HTTPException(
                status_code=500,
                detail=result.stderr[-2000:] or "Trivy returned no output"
            )

        report = json.loads(result.stdout)

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail="Docker image scan timed out"
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Unable to parse Trivy scan report"
        )

    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Trivy executable could not be started"
        )

    # Extract vulnerabilities.
    findings = []

    for result_item in report.get("Results", []):
        target = result_item.get("Target", "Unknown")
        vulnerabilities = result_item.get("Vulnerabilities") or []

        for vuln in vulnerabilities:
            findings.append({
                "target": target,
                "package": vuln.get("PkgName", "Unknown"),
                "installed_version": vuln.get("InstalledVersion", "Unknown"),
                "fixed_version": vuln.get("FixedVersion", "Not available"),
                "vulnerability_id": vuln.get("VulnerabilityID", "Unknown"),
                "severity": vuln.get("Severity", "UNKNOWN").upper(),
                "title": vuln.get("Title", ""),
                "primary_url": vuln.get("PrimaryURL", "")
            })

    # Calculate severity summary.
    summary = {
        "total": len(findings),
        "critical": sum(1 for x in findings if x["severity"] == "CRITICAL"),
        "high": sum(1 for x in findings if x["severity"] == "HIGH"),
        "medium": sum(1 for x in findings if x["severity"] == "MEDIUM"),
        "low": sum(1 for x in findings if x["severity"] == "LOW"),
        "unknown": sum(1 for x in findings if x["severity"] == "UNKNOWN")
    }

    return {
        "project_id": project.id,
        "project_name": project.name,
        "image": image,
        "scan_status": "completed",
        "summary": summary,
        "findings": findings
    }