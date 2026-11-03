import re
from typing import List
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class CppAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        lines = content.splitlines()

        patterns = [
            (r'\bgets\s*\(', "CRITICAL", "SECURITY", "Vulnerable Function: gets()",
             "gets() cannot check buffer bounds and inherently causes buffer overflows (deprecated in C99, removed in C11).",
             "Use fgets() with explicit buffer length constraints."),

            (r'\bstrcpy\s*\(', "HIGH", "SECURITY", "Insecure Function: strcpy()",
             "strcpy() does not verify destination buffer size, risking memory corruption and buffer overflow vulnerabilities.",
             "Replace with strncpy(), snprintf(), or std::string in C++."),

            (r'\bsprintf\s*\(', "HIGH", "SECURITY", "Unbounded String Formatting: sprintf()",
             "sprintf() writes unbounded output into character buffers without boundary protection.",
             "Use snprintf() or std::format / std::stringstream."),

            (r'\bgoto\s+[A-Za-z0-9_]+', "LOW", "MAINTAINABILITY", "Use of 'goto' Statement",
             "goto statements create unstructured control flow, making code difficult to reason about and maintain.",
             "Refactor into structured loops, early returns, or RAII control blocks.")
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
