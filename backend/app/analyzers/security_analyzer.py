import re
from typing import List
from app.analyzers.base import BaseAnalyzer, NormalizedFinding

class SecurityAnalyzer(BaseAnalyzer):
    @property
    def supported_extensions(self) -> List[str]:
        # Runs across all source and config files
        return [
            ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".c", ".cpp",
            ".json", ".yaml", ".yml", ".env", ".toml", ".ini", ".conf"
        ]

    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        findings: List[NormalizedFinding] = []
        lines = content.splitlines()

        # Regular expressions for generic high-risk secrets and vulnerabilities
        rules = [
            # AWS Access Key
            (r'(?i)(AKIA[0-9A-Z]{16})', "CRITICAL", "SECURITY", "Exposed AWS Access Key",
             "Found an apparent AWS Access Key ID. Compromised keys lead to full cloud resource takeover.",
             "Revoke this key immediately in AWS IAM, rotate credentials, and use IAM roles."),

            # Generic Private Keys
            (r'-----BEGIN\s+(?:RSA|OPENSSH|DSA|EC)?\s*PRIVATE KEY-----', "CRITICAL", "SECURITY", "Hardcoded Private Key",
             "Cryptographic private keys must never be committed to source repositories.",
             "Revoke and re-generate this key; inject via environment variables or cloud secret managers."),

            # GitHub Token
            (r'(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})', "CRITICAL", "SECURITY", "Hardcoded GitHub Personal Access Token",
             "Exposed GitHub token allows unauthorized repository and organization access.",
             "Revoke token on GitHub Settings -> Developer Settings and rotate immediately."),

            # Stripe Secret Key
            (r'(sk_live_[0-9a-zA-Z]{24,34})', "CRITICAL", "SECURITY", "Exposed Stripe Live Secret Key",
             "Exposed Stripe secret key permits unauthorized charges and access to customer payment data.",
             "Roll key in the Stripe Dashboard and store as an environment variable."),

            # JWT Secret / Generic Secret in assignment
            (r'(?i)(?:jwt_secret|secret_key|api_secret|session_secret)\s*[:=]\s*["\']([a-zA-Z0-9_\-\.]{12,})["\']',
             "HIGH", "SECURITY", "Potential Hardcoded Secret Key",
             "Hardcoded secret keys undermine authentication and signature verification algorithms.",
             "Read secrets dynamically from system environment variables (e.g., os.environ.get)."),

            # Plaintext passwords
            (r'(?i)(?:password|passwd|db_pass|admin_pass)\s*[:=]\s*["\']([^"\'\s]{6,})["\']',
             "HIGH", "SECURITY", "Hardcoded Plaintext Password",
             "Storing passwords in cleartext within code enables credential harvesting.",
             "Remove cleartext passwords. Inject via environment variables or AWS Secrets Manager / HashiCorp Vault."),

            # Insecure HTTP
            (r'http://(?:api\.|auth\.|login\.|backend\.|secure\.)[a-zA-Z0-9\-\.]+',
             "MEDIUM", "SECURITY", "Insecure Plaintext HTTP URL",
             "Transmitting credentials or sensitive data over unencrypted HTTP exposes traffic to eavesdropping and MITM attacks.",
             "Enforce TLS/HTTPS across all endpoints."),

            # MD5 or SHA1 in security context
            (r'(?i)\b(hashlib\.(?:md5|sha1)|MessageDigest\.getInstance\(["\'](?:MD5|SHA-1)["\']\)|crypto\.createHash\(["\'](?:md5|sha1)["\']\))',
             "MEDIUM", "SECURITY", "Weak Cryptographic Hash Algorithm",
             "MD5 and SHA-1 suffer from collision vulnerabilities and are unsuitable for digital signatures or passwords.",
             "Upgrade to SHA-256, SHA-512, bcrypt, or Argon2.")
        ]

        for idx, line in enumerate(lines, start=1):
            for pattern, sev, typ, title, desc, rec in rules:
                if re.search(pattern, line):
                    # Skip markdown files, documentation examples or git commits
                    if rel_path.endswith(".md") or "EXAMPLE" in line or "dummy" in line.lower():
                        continue
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
