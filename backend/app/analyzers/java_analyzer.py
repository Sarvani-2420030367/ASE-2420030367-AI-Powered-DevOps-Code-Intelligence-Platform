import re
from typing import List
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class JavaAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return [".java"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        lines = content.splitlines()

        patterns = [
            (r'(?i)SELECT\s+.*\s+FROM\s+.*\+\s*\w+', "CRITICAL", "SECURITY", "Potential SQL Injection Concatenation",
             "Concatenating variables into SQL queries exposes the database to SQL injection attacks.",
             "Use PreparedStatement with parameterized '?' placeholders."),

            (r'Runtime\.getRuntime\(\)\.exec\(', "CRITICAL", "SECURITY", "Unsafe Command Execution (Runtime.exec)",
             "Runtime.exec() executes system commands and is vulnerable to command injection if unvalidated inputs are passed.",
             "Use ProcessBuilder with argument array validation or replace with standard Java APIs."),

            (r'\.printStackTrace\(', "MEDIUM", "QUALITY", "Standard Error Stack Trace Printing",
             "e.printStackTrace() outputs stack traces to stdout/stderr rather than structured loggers.",
             "Use a logging framework like SLF4J/Logback (e.g., logger.error(\"Error\", e))."),

            (r'catch\s*\([A-Za-z0-9_]+\s+[A-Za-z0-9_]+\)\s*\{\s*\}', "HIGH", "QUALITY", "Empty Catch Block",
             "Catching an exception without handling or logging it silences application errors.",
             "Properly handle or rethrow the exception, or log it at WARN/ERROR level."),

            (r'new\s+Random\(', "LOW", "SECURITY", "Weak Pseudorandom Number Generator",
             "java.util.Random is predictable and not cryptographically secure.",
             "Use java.security.SecureRandom for security-sensitive tokens, salts, or IDs.")
        ]

        for idx, line in enumerate(lines, start=1):
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
