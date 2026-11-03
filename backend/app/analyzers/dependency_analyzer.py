import json
import re
from typing import List, Dict, Any, Tuple
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class DependencyAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return ["requirements.txt", "package.json", "pom.xml", "go.mod"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        filename = rel_path.replace("\\", "/").split("/")[-1]

        if filename == "requirements.txt":
            for idx, line in enumerate(content.splitlines(), start=1):
                clean_line = line.split("#")[0].strip()
                if not clean_line:
                    continue
                # Flag unpinned dependencies
                if not any(op in clean_line for op in ["==", ">=", "<=", "~="]):
                    findings.append(NormalizedFinding(
                        severity="LOW",
                        type="MAINTAINABILITY",
                        file=rel_path,
                        line=idx,
                        title=f"Unpinned Dependency ({clean_line})",
                        description=f"Package '{clean_line}' has no pinned version constraint, risking unexpected breaking changes upon deployment.",
                        recommendation="Pin dependencies to specific tested versions (e.g., package==1.2.3)."
                    ))

        elif filename == "package.json":
            try:
                pkg_data = json.loads(content)
                deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                for dep, ver in deps.items():
                    if ver in ("*", "latest"):
                        findings.append(NormalizedFinding(
                            severity="MEDIUM",
                            type="QUALITY",
                            file=rel_path,
                            line=1,
                            title=f"Wildcard Package Version ({dep})",
                            description=f"Dependency '{dep}' is configured with wildcard version '{ver}', preventing deterministic builds.",
                            recommendation="Lock dependencies to strict semver ranges (e.g., ^1.2.0 or 1.2.0)."
                        ))
            except Exception:
                pass

        return findings

    def extract_dependencies(self, rel_path: str, content: str) -> List[Dict[str, Any]]:
        """Parses dependency manifest into standardized list of packages."""
        deps = []
        filename = rel_path.replace("\\", "/").split("/")[-1]

        if filename == "requirements.txt":
            for line in content.splitlines():
                line = line.split("#")[0].strip()
                if not line:
                    continue
                match = re.match(r'^([a-zA-Z0-9_\-\.]+)(?:([=<>~]+)(.+))?', line)
                if match:
                    name, op, ver = match.groups()
                    deps.append({
                        "name": name,
                        "version": ver if ver else "unpinned",
                        "type": "pip",
                        "manifest": rel_path
                    })

        elif filename == "package.json":
            try:
                data = json.loads(content)
                for name, ver in data.get("dependencies", {}).items():
                    deps.append({"name": name, "version": ver, "type": "npm", "manifest": rel_path})
                for name, ver in data.get("devDependencies", {}).items():
                    deps.append({"name": name, "version": ver, "type": "npm-dev", "manifest": rel_path})
            except Exception:
                pass

        elif filename == "go.mod":
            for line in content.splitlines():
                line = line.strip()
                if line.startswith("require (") or line == ")":
                    continue
                parts = line.split()
                if len(parts) >= 2 and not line.startswith("//"):
                    pkg_name = parts[0].replace("require", "").strip()
                    ver = parts[1]
                    deps.append({"name": pkg_name, "version": ver, "type": "go", "manifest": rel_path})

        return deps
