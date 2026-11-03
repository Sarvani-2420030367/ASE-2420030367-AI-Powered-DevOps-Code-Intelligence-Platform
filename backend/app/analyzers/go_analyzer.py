import re
from typing import List
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class GoAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return [".go"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        lines = content.splitlines()

        patterns = [
            (r'unsafe\.Pointer', "HIGH", "QUALITY", "Usage of unsafe.Pointer",
             "unsafe.Pointer bypasses Go's type safety and memory management guarantees.",
             "Avoid unsafe packages; refactor to idiomatic type-safe Go constructs."),

            (r'(?i)fmt\.Sprintf\(\s*["\']SELECT\s+.*%[sv]', "CRITICAL", "SECURITY", "SQL Query Formatting via Sprintf",
             "Formatting SQL statements using fmt.Sprintf opens the application to SQL injection.",
             "Use parameterized queries with db.Query(query, args...)."),

            (r'_\s*=\s*(?:err|.*Err)', "MEDIUM", "QUALITY", "Explicitly Ignored Error Return",
             "Ignoring error returns with the blank identifier (_) hides runtime failures and causes unpredictable panics.",
             "Handle errors explicitly using `if err != nil { return err }`."),

            (r'panic\(', "LOW", "MAINTAINABILITY", "Explicit panic() in Application Code",
             "panics abruptly crash goroutines and disrupt HTTP request handling.",
             "Return formatted error objects up the stack instead of panicking.")
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
