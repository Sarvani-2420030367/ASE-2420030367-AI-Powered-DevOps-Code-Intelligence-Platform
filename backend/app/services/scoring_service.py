from typing import List, Dict, Any
from app.analyzers.base import NormalizedFinding

DEDUCTIONS = {
    "CRITICAL": 15.0,
    "HIGH": 10.0,
    "MEDIUM": 5.0,
    "LOW": 2.0,
    "INFO": 0.0
}

def clamp(val: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, round(val, 1)))

class ScoringService:
    @staticmethod
    def calculate_scores(findings: List[NormalizedFinding], devops_signals: Dict[str, bool]) -> Dict[str, Any]:
        """
        Calculates Quality, Security, Maintainability, Architecture scores,
        Overall Health Score, and the 8-pillar DevOps Readiness Score.
        """
        quality_score = 100.0
        security_score = 100.0
        maintainability_score = 100.0
        architecture_score = 100.0

        for f in findings:
            penalty = DEDUCTIONS.get(f.severity.upper(), 2.0)
            finding_type = f.type.upper()

            if finding_type == "QUALITY":
                quality_score -= penalty
            elif finding_type == "SECURITY":
                security_score -= penalty
            elif finding_type == "MAINTAINABILITY":
                maintainability_score -= penalty
            elif finding_type == "ARCHITECTURE":
                architecture_score -= penalty

        # Normalize pillars
        q = clamp(quality_score)
        s = clamp(security_score)
        m = clamp(maintainability_score)
        a = clamp(architecture_score)

        # Health score formula: 40% Quality + 30% Security + 20% Maintainability + 10% Architecture
        overall_health = round((0.40 * q) + (0.30 * s) + (0.20 * m) + (0.10 * a), 1)

        # DevOps Readiness: 8 Pillars (0-100 each)
        testing_score = 85.0 if devops_signals.get("has_tests") else 25.0
        container_score = 90.0 if devops_signals.get("has_docker") else 30.0
        cicd_score = 95.0 if devops_signals.get("has_cicd") else 20.0
        docs_score = 90.0 if devops_signals.get("has_docs") else 40.0
        k8s_score = 90.0 if devops_signals.get("has_k8s") else 25.0
        observability_score = 65.0  # standard baseline for telemetry/logging detection

        devops_pillars = {
            "Code Quality": q,
            "Security": s,
            "Testing": testing_score,
            "Containerization": container_score,
            "CI/CD": cicd_score,
            "Documentation": docs_score,
            "Observability": observability_score,
            "Kubernetes": k8s_score
        }

        devops_readiness_score = round(sum(devops_pillars.values()) / len(devops_pillars), 1)

        return {
            "health_score": overall_health,
            "quality_score": q,
            "security_score": s,
            "maintainability_score": m,
            "architecture_score": a,
            "devops_readiness_score": devops_readiness_score,
            "devops_pillars": devops_pillars
        }
