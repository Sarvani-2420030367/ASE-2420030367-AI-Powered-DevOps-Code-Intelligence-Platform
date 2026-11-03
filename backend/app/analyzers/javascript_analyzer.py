import re
from typing import List
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class JavaScriptAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return [".js", ".jsx", ".mjs"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        lines = content.splitlines()

        if len(lines) > 300:
            findings.append(NormalizedFinding(
                severity="LOW",
                type="MAINTAINABILITY",
                file=rel_path,
                line=1,
                title="Large Component/File",
                description=f"File exceeds 300 lines ({len(lines)} lines). Large files impact readability and testability.",
                recommendation="Split into composable custom hooks, sub-components, or utility modules."
            ))

        patterns = [
            (r'\beval\s*\(', "CRITICAL", "SECURITY", "Unsafe Dynamic Code Execution (eval)",
             "eval() allows arbitrary code execution and disables JavaScript engine optimizations.",
             "Avoid eval(); use JSON.parse or strict domain-specific mappings."),

            (r'dangerouslySetInnerHTML|(?:\.innerHTML\s*=)', "HIGH", "SECURITY", "Potential Cross-Site Scripting (XSS)",
             "Direct assignment to innerHTML or dangerouslySetInnerHTML can inject malicious HTML/scripts.",
             "Sanitize untrusted content with DOMPurify or use textContent/safe React rendering."),

            (r'document\.write\s*\(', "HIGH", "SECURITY", "Insecure document.write()",
             "document.write alters the active DOM and opens pathways for script injection.",
             "Use modern DOM manipulation methods or standard component rendering."),

            (r'(?i)(?:api_key|secret_key|auth_token|password)\s*[:=]\s*["\'][a-zA-Z0-9_\-\.]{10,}["\']',
             "HIGH", "SECURITY", "Possible Hardcoded Frontend Secret",
             "Exposing API keys or secret tokens in client-side code compromises security.",
             "Store secrets on the backend and consume via authenticated API endpoints."),

            (r'===?\s*null|!==?\s*null|==\s*(?:true|false|0|\'\'|"")', "LOW", "QUALITY", "Loose Type Equality (==)",
             "Using loose equality (==) causes unexpected type coercion bugs in JavaScript.",
             "Use strict equality (===) and strict inequality (!==)."),

            (r'console\.(log|debug|info)\(', "INFO", "MAINTAINABILITY", "Console Logging Statement in Code",
             "Leaving console statements in production code leaks internal state and clutters browser logs.",
             "Remove console statements or wrap them behind a dedicated logger with log level gates.")
        ]

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*"):
                continue

            for pattern, sev, typ, title, desc, rec in patterns:
                if re.search(pattern, line):
                    findings.append(NormalizedFinding(
                        severity=sev,
                        type=typ,
                        file=rel_path,
                        line=idx,
                        title=title,
                        description=desc,
                        recommendation=rec
                    ))

        return findings
