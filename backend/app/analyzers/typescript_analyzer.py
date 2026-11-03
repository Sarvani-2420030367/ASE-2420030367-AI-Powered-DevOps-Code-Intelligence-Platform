import re
from typing import List
from app.analyzers.javascript_analyzer import JavaScriptAnalyzer
from app.analyzers.base import NormalizedFinding

class TypeScriptAnalyzer(JavaScriptAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return [".ts", ".tsx"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings = super().analyze(rel_path, content)
        lines = content.splitlines()

        ts_patterns = [
            (r':\s*any\b|<any>|as\s+any\b', "MEDIUM", "QUALITY", "Excessive Use of 'any' Type",
             "Using 'any' circumvents TypeScript's compile-time safety and propagates untyped values.",
             "Define precise interfaces, union types, or use 'unknown' with type guards."),

            (r'//\s*@ts-ignore|//\s*@ts-nocheck', "HIGH", "MAINTAINABILITY", "Suppressed TypeScript Type Checking",
             "@ts-ignore or @ts-nocheck suppresses compiler diagnostic checks and hides underlying type bugs.",
             "Resolve the type mismatch or use @ts-expect-error with documented rationale."),

            (r'!\.|\w+!\(', "LOW", "QUALITY", "Non-null Assertion Operator (!)",
             "Using the non-null assertion operator disables null checks without guaranteeing runtime existence.",
             "Handle nullish cases explicitly using optional chaining (?.) or null checks.")
        ]

        for idx, line in enumerate(lines, start=1):
            for pattern, sev, typ, title, desc, rec in ts_patterns:
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
