import os
import re
from typing import Dict, Any, List
from app.analyzers.python_analyzer import PythonAnalyzer
from app.analyzers.javascript_analyzer import JavaScriptAnalyzer
from app.analyzers.typescript_analyzer import TypeScriptAnalyzer
from app.analyzers.java_analyzer import JavaAnalyzer
from app.analyzers.cpp_analyzer import CppAnalyzer
from app.analyzers.go_analyzer import GoAnalyzer
from app.analyzers.security_analyzer import SecurityAnalyzer
from app.analyzers.dependency_analyzer import DependencyAnalyzer
from app.analyzers.base import NormalizedFinding

IGNORE_DIRS = {
    ".git", "node_modules", "__pycache__", "venv", ".venv", "env",
    "dist", "build", ".next", ".nuxt", "target", "bin", "obj", ".idea", ".vscode"
}

EXTENSION_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".go": "Go",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".sql": "SQL",
    ".sh": "Shell",
    ".dockerfile": "Dockerfile",
    ".md": "Markdown"
}

class RepositoryAnalyzer:
    def __init__(self):
        self.analyzers = [
            PythonAnalyzer(),
            JavaScriptAnalyzer(),
            TypeScriptAnalyzer(),
            JavaAnalyzer(),
            CppAnalyzer(),
            GoAnalyzer(),
            SecurityAnalyzer(),
        ]
        self.dependency_analyzer = DependencyAnalyzer()

    def analyze_repository(self, repo_path: str) -> Dict[str, Any]:
        """
        Walks the repository directory, runs analyzers, extracts statistics,
        and returns consolidated findings and metadata.
        """
        repo_path = os.path.abspath(repo_path)
        if not os.path.exists(repo_path):
            raise FileNotFoundError(f"Repository directory does not exist: {repo_path}")

        file_count = 0
        total_lines = 0
        total_functions = 0
        total_classes = 0
        language_stats: Dict[str, Dict[str, int]] = {}
        all_dependencies: List[Dict[str, Any]] = []
        findings: List[NormalizedFinding] = []

        # DevOps indicators
        has_docker = False
        has_cicd = False
        has_k8s = False
        has_tests = False
        has_docs = False

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")

                # Check DevOps indicators
                lower_file = file.lower()
                if "dockerfile" in lower_file or "docker-compose" in lower_file:
                    has_docker = True
                if ".github/workflows" in rel_path or ".gitlab-ci" in rel_path:
                    has_cicd = True
                if "k8s" in rel_path or "kubernetes" in rel_path or lower_file.endswith(".yaml") and "deployment" in lower_file:
                    has_k8s = True
                if "test" in rel_path.lower() or "spec" in rel_path.lower():
                    has_tests = True
                if lower_file.startswith("readme") or lower_file.startswith("contributing") or "docs" in rel_path.lower():
                    has_docs = True

                _, ext = os.path.splitext(file)
                ext = ext.lower()
                if lower_file == "dockerfile":
                    ext = ".dockerfile"

                # Attempt to read text content
                content = None
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                except Exception:
                    continue

                if content is None:
                    continue

                file_count += 1
                lines = content.splitlines()
                line_count = len(lines)
                total_lines += line_count

                # Language metrics
                lang_name = EXTENSION_MAP.get(ext, "Other")
                if lang_name not in language_stats:
                    language_stats[lang_name] = {"files": 0, "lines": 0}
                language_stats[lang_name]["files"] += 1
                language_stats[lang_name]["lines"] += line_count

                # AST/Regex counts for functions and classes
                if ext == ".py":
                    total_functions += len(re.findall(r'^\s*(?:def|async def)\s+\w+', content, re.MULTILINE))
                    total_classes += len(re.findall(r'^\s*class\s+\w+', content, re.MULTILINE))
                elif ext in [".js", ".jsx", ".ts", ".tsx"]:
                    total_functions += len(re.findall(r'(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|\w+\s*\([^)]*\)\s*=>)', content))
                    total_classes += len(re.findall(r'class\s+\w+', content))
                elif ext in [".java", ".cpp", ".c", ".go"]:
                    total_functions += len(re.findall(r'(?:public|private|protected|func|\w+)\s+\w+\s*\([^)]*\)\s*\{', content))
                    total_classes += len(re.findall(r'(?:class|interface|struct)\s+\w+', content))

                # Extract dependencies
                if file in ["requirements.txt", "package.json", "go.mod"]:
                    extracted = self.dependency_analyzer.extract_dependencies(rel_path, content)
                    all_dependencies.extend(extracted)
                    dep_findings = self.dependency_analyzer.analyze(rel_path, content)
                    findings.extend(dep_findings)

                # Run matching analyzers
                for analyzer in self.analyzers:
                    if ext in analyzer.supported_extensions or (hasattr(analyzer, "supported_files") and file in getattr(analyzer, "supported_files", [])):
                        file_findings = analyzer.analyze(rel_path, content)
                        findings.extend(file_findings)

        # Primary language calculation
        primary_language = "Python"
        max_lines = -1
        for lang, stats in language_stats.items():
            if lang not in ["Markdown", "JSON", "YAML", "Other"] and stats["lines"] > max_lines:
                max_lines = stats["lines"]
                primary_language = lang

        return {
            "file_count": file_count,
            "line_count": total_lines,
            "functions_count": total_functions,
            "classes_count": total_classes,
            "primary_language": primary_language,
            "languages": language_stats,
            "dependencies": all_dependencies,
            "findings": findings,
            "devops_signals": {
                "has_docker": has_docker,
                "has_cicd": has_cicd,
                "has_k8s": has_k8s,
                "has_tests": has_tests,
                "has_docs": has_docs,
            }
        }
