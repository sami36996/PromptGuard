import re

TYPE = "Secret Leakage"


# ------------------------------------------------------
# Secret Patterns
# ------------------------------------------------------

PATTERNS = [
    # AWS
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), 80, "AWS Access Key"),
    (re.compile(r"\bASIA[0-9A-Z]{16}\b"), 80, "AWS Temporary Access Key"),
    (
        re.compile(r"(?i)aws(.{0,20})?(secret|access).{0,10}[=: ]+[A-Za-z0-9/+=]{40}"),
        90,
        "AWS Secret Key",
    ),
    # OpenAI
    (re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"), 80, "OpenAI API Key"),
    # GitHub
    (re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,255}\b"), 80, "GitHub Token"),
    # Google
    (re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b"), 80, "Google API Key"),
    # Slack
    (re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"), 80, "Slack Token"),
    # Stripe
    (re.compile(r"\bsk_live_[A-Za-z0-9]{20,}\b"), 85, "Stripe Live Key"),
    (re.compile(r"\bpk_live_[A-Za-z0-9]{20,}\b"), 70, "Stripe Public Key"),
    # Discord
    (re.compile(r"mfa\.[A-Za-z0-9_-]{80,}"), 90, "Discord MFA Token"),
    # JWT
    (
        re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b"),
        60,
        "JWT Token",
    ),
    # SSH
    (re.compile(r"-----BEGIN OPENSSH PRIVATE KEY-----"), 100, "OpenSSH Private Key"),
    (re.compile(r"-----BEGIN RSA PRIVATE KEY-----"), 100, "RSA Private Key"),
    (re.compile(r"-----BEGIN EC PRIVATE KEY-----"), 100, "EC Private Key"),
    (re.compile(r"-----BEGIN PRIVATE KEY-----"), 100, "Private Key"),
    # Azure
    (
        re.compile(r"DefaultEndpointsProtocol=https;AccountName=.*?AccountKey=.*?;"),
        95,
        "Azure Storage Key",
    ),
    # Generic API keys
    (
        re.compile(
            r"(?i)(api[_-]?key|apikey)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}['\"]?"
        ),
        45,
        "API Key",
    ),
    (
        re.compile(r"(?i)(access[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9_\-.]{20,}['\"]?"),
        45,
        "Access Token",
    ),
    (
        re.compile(r"(?i)(secret[_-]?key)\s*[:=]\s*['\"]?[A-Za-z0-9/+=]{20,}['\"]?"),
        60,
        "Secret Key",
    ),
    (
        re.compile(r"(?i)(client[_-]?secret)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{20,}['\"]?"),
        60,
        "Client Secret",
    ),
    (re.compile(r"(?i)\bBearer\s+[A-Za-z0-9\-_.=]{20,}\b"), 50, "Bearer Token"),
    # Password assignment
    (
        re.compile(r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]?.{6,}['\"]?"),
        40,
        "Password",
    ),
]


# ------------------------------------------------------
# Detection
# ------------------------------------------------------


def detect(prompt: str):

    findings = []
    score = 0

    # --------------------------------------------------
    # Pattern matching
    # --------------------------------------------------

    for regex, risk, label in PATTERNS:

        if regex.search(prompt):

            findings.append(label)

            # Keep the highest-confidence secret finding.
            score = max(score, risk)

    # --------------------------------------------------
    # Suspicious combinations
    # --------------------------------------------------

    lower = prompt.lower()

    # --------------------------------------------------


# Credential Assignment Pair
# --------------------------------------------------

    credential_assignment = re.search(
        r"(?i)\busername\s*[:=]\s*['\"]?[^'\"\s]+['\"]?"
        r".{0,80}"
        r"\bpassword\s*[:=]\s*['\"]?.{6,}['\"]?",
        prompt,
    )

    if credential_assignment:

        findings.append("Credentials Pair")

        score = max(score, 70)

    if "token" in lower and "secret" in lower:

        findings.append("Secret + Token")

        score = max(score, 80)

    if "private key" in lower:

        findings.append("Private Key Mention")

        score = max(score, 90)

    # --------------------------------------------------
    # Decision
    # --------------------------------------------------

    decision = "block" if score >= 80 else "review" if score >= 40 else "allow"

    # --------------------------------------------------
    # IMPORTANT: always return a dictionary
    # --------------------------------------------------

    return {
        "type": TYPE,
        "detected": score > 0,
        "score": score,
        "decision": decision,
        "findings": findings,
    }
