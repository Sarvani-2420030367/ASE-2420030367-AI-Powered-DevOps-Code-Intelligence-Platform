import ast
import re
from typing import List
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class PythonAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        return [".py"]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        lines = content.splitlines()

        # Check total file size
        if len(lines) > 300:
            findings.append(NormalizedFinding(
                severity="LOW",
                type="MAINTAINABILITY",
                file=rel_path,
                line=1,
                title="Large File Detected",
                description=f"File has {len(lines)} lines of code. Large files violate single responsibility and impede maintainability.",
                recommendation="Refactor into smaller modular modules or separate service layers."
            ))

        # AST Parsing
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                # 1. Long functions & too many arguments
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    start_line = getattr(node, "lineno", 1)
                    end_line = getattr(node, "end_lineno", start_line)
                    func_len = end_line - start_line

                    if func_len > 50:
                        findings.append(NormalizedFinding(
                            severity="MEDIUM",
                            type="QUALITY",
                            file=rel_path,
                            line=start_line,
                            title=f"Excessive Function Length ({node.name})",
                            description=f"Function '{node.name}' spans {func_len} lines. Long functions increase cognitive complexity and defect density.",
                            recommendation="Break down logic into smaller, testable helper functions."
                        ))

                    arg_count = len(node.args.args)
                    if arg_count > 6:
                        findings.append(NormalizedFinding(
                            severity="LOW",
                            type="MAINTAINABILITY",
                            file=rel_path,
                            line=start_line,
                            title=f"Too Many Parameters ({node.name})",
                            description=f"Function '{node.name}' takes {arg_count} parameters.",
                            recommendation="Encapsulate parameters into a dedicated data class, Pydantic model, or configuration dictionary."
                        ))

                # 2. Bare except or empty catch
                elif isinstance(node, ast.ExceptHandler):
                    line_no = getattr(node, "lineno", 1)
                    if node.type is None:
                        findings.append(NormalizedFinding(
                            severity="MEDIUM",
                            type="QUALITY",
                            file=rel_path,
                            line=line_no,
                            title="Bare Except Clause",
                            description="Catching all exceptions with a bare 'except:' masks critical errors like KeyboardInterrupt and MemoryError.",
                            recommendation="Specify precise exception types (e.g., except (ValueError, KeyError):)."
                        ))
                    elif len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                        findings.append(NormalizedFinding(
                            severity="HIGH",
                            type="QUALITY",
                            file=rel_path,
                            line=line_no,
                            title="Silently Swallowed Exception",
                            description="The exception block contains only 'pass', swallowing runtime failures without logging.",
                            recommendation="Log the exception with traceback using logger.error(e, exc_info=True) or re-raise."
                        ))

                # 3. eval() and exec()
                elif isinstance(node, ast.Call):
                    line_no = getattr(node, "lineno", 1)
                    func_name = ""
                    if isinstance(node.func, ast.Name):
                        func_name = node.func.id
                    elif isinstance(node.func, ast.Attribute):
                        func_name = node.func.attr

                    if func_name in ("eval", "exec"):
                        findings.append(NormalizedFinding(
                            severity="CRITICAL",
                            type="SECURITY",
                            file=rel_path,
                            line=line_no,
                            title=f"Dangerous Dynamic Code Execution ({func_name})",
                            description=f"Use of '{func_name}()' allows arbitrary code execution if user inputs reach this invocation.",
                            recommendation="Eliminate eval/exec. Use safe parsers (like ast.literal_eval, json.loads) or dispatch tables."
                        ))

                    # Subprocess with shell=True
                    if func_name in ("call", "Popen", "run", "check_output", "system"):
                        for kw in node.keywords:
                            if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                                findings.append(NormalizedFinding(
                                    severity="HIGH",
                                    type="SECURITY",
                                    file=rel_path,
                                    line=line_no,
                                    title="Unsafe Subprocess with shell=True",
                                    description="Executing subprocess commands with shell=True is susceptible to Shell Command Injection.",
                                    recommendation="Pass arguments as a list of strings and set shell=False."
                                ))

                    # Dangerous deserialization
                    if func_name in ("loads", "load"):
                        if isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
                            mod_name = node.func.value.id
                            if mod_name == "pickle":
                                findings.append(NormalizedFinding(
                                    severity="CRITICAL",
                                    type="SECURITY",
                                    file=rel_path,
                                    line=line_no,
                                    title="Unsafe Deserialization with Pickle",
                                    description="pickle.load/loads can execute arbitrary code during unpickling untrusted data.",
                                    recommendation="Use safe serialization formats like JSON, Protobuf, or MsgPack."
                                ))

                # 4. Debug mode enabled in config / app.run
                elif isinstance(node, ast.keyword) and node.arg == "debug":
                    line_no = getattr(node, "lineno", 1)
                    if isinstance(node.value, ast.Constant) and node.value.value is True:
                        findings.append(NormalizedFinding(
                            severity="HIGH",
                            type="SECURITY",
                            file=rel_path,
                            line=line_no,
                            title="Debug Mode Enabled in Code",
                            description="Running with debug=True in production exposes interactive debuggers and system internals.",
                            recommendation="Configure debug mode via environment variables (e.g., DEBUG=False)."
                        ))

        except SyntaxError:
            findings.append(NormalizedFinding(
                severity="HIGH",
                type="QUALITY",
                file=rel_path,
                line=1,
                title="Python Syntax Error",
                description="The file could not be parsed by Python's AST parser due to a syntax error.",
                recommendation="Fix python syntax error before deployment."
            ))

        # Line-by-line regex checks
        secret_patterns = [
            (r'(?i)(jwt_secret|secret_key|api_key|password|db_pass|auth_token)\s*=\s*["\']([a-zA-Z0-9_\-\.]{8,})["\']', "Possible Hardcoded Secret"),
            (r'(?i)SELECT\s+.*\s+FROM\s+.*(%s|\+)\s*', "Potential Raw SQL String Concatenation"),
            (r'http://[a-zA-Z0-9\-\.]+', "Insecure Plaintext HTTP Protocol")
        ]

        for idx, line in enumerate(lines, start=1):
            for pattern, title in secret_patterns:
                if re.search(pattern, line):
                    # Skip common test/mock strings or comments
                    if "# test" in line.lower() or "example" in line.lower():
                        continue
                    sev = "HIGH" if "Secret" in title or "SQL" in title else "LOW"
                    typ = "SECURITY"
                    rec = "Store sensitive credentials in environment variables or a secret vault." if "Secret" in title else (
                        "Use parameterized queries or ORM query builders." if "SQL" in title else "Enforce HTTPS communication."
                    )
                    findings.append(NormalizedFinding(
                        severity=sev,
                        type=typ,
                        file=rel_path,
                        line=idx,
                        title=title,
                        description=f"Detected pattern '{title}' at line {idx}.",
                        recommendation=rec
                    ))

        return findings
