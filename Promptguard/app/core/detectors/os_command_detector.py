import re

DETECTOR_NAME = "os_command_detector"

# --------------------------------------------------
# Linux Commands
# --------------------------------------------------

LINUX_COMMANDS = {
    "rm": 25,
    "rm -rf": 60,
    "mv": 15,
    "cp": 15,
    "chmod": 25,
    "chown": 20,
    "sudo": 30,
    "bash": 25,
    "sh": 20,
    "zsh": 20,
    "wget": 25,
    "curl": 25,
    "scp": 25,
    "ssh": 25,
    "find": 15,
    "locate": 15,
    "kill": 20,
    "killall": 25,
    "systemctl": 25,
    "service": 20,
    "iptables": 30,
    "netstat": 20,
    "ss": 15,
    "nc": 40,
    "ncat": 40,
    "python -c": 35,
    "perl -e": 35,
    "php -r": 35,
}

# --------------------------------------------------
# Windows Commands
# --------------------------------------------------

WINDOWS_COMMANDS = {
    "cmd.exe": 30,
    "powershell": 35,
    "pwsh": 35,
    "reg add": 30,
    "reg delete": 30,
    "taskkill": 25,
    "wmic": 30,
    "certutil": 35,
    "bitsadmin": 35,
    "schtasks": 30,
    "sc.exe": 25,
    "net user": 25,
    "whoami": 15,
    "ipconfig": 15,
    "netsh": 25,
    "diskpart": 35,
}

# --------------------------------------------------
# Dangerous Operations
# --------------------------------------------------

DANGEROUS_PATTERNS = [
    (r"\brm\s+-rf\b", 60),
    (r"\bshutdown\b", 40),
    (r"\breboot\b", 40),
    (r"\bmkfs\b", 60),
    (r"\bdd\s+if=", 50),
    (r"\bformat\s+c:", 60),
    (r"\bdel\s+/f", 50),
    (r"\berase\b", 40),
    (r"\bchmod\s+777", 40),
    (r"\bchown\b", 25),
]

# --------------------------------------------------
# Download & Execute
# --------------------------------------------------

DOWNLOAD_EXEC = [
    r"curl.+\|\s*(?:bash|sh|zsh)\b",
    r"wget.+\|\s*(?:bash|sh|zsh)\b",
    r"powershell.+\bdownload",
    r"invoke-webrequest",
    r"invoke-expression",
]

# --------------------------------------------------
# PowerShell Encoded
# --------------------------------------------------

POWERSHELL = [
    "invoke-expression",
    "iex",
    "-enc",
    "-encodedcommand",
    "downloadstring",
    "invoke-webrequest",
]

# --------------------------------------------------
# LOLBins
# --------------------------------------------------

LOLBINS = [
    "certutil",
    "mshta",
    "rundll32",
    "regsvr32",
    "wmic",
    "bitsadmin",
    "installutil",
]

# --------------------------------------------------
# Shell Operators
# --------------------------------------------------

OPERATORS = [
    "&&",
    "||",
    "|",
    ";",
    "$(",
    "`",
]

# These tokens appear in ordinary documentation. Score them
# only when surrounding text looks like command execution.
CONTEXT_REQUIRED_LINUX_COMMANDS = {
    "rm",
    "mv",
    "cp",
    "chmod",
    "chown",
    "sudo",
    "bash",
    "sh",
    "zsh",
    "wget",
    "curl",
    "scp",
    "ssh",
    "find",
    "locate",
    "kill",
    "killall",
    "systemctl",
    "service",
    "iptables",
    "netstat",
    "ss",
}


def _has_execution_context(text: str, match: re.Match) -> bool:
    start, end = match.span()
    before = text[max(0, start - 24):start]
    after = text[end:end + 40]

    if re.search(r"^\s+[-/]", after):
        return True

    if re.search(r"[|&;`$]|\$\(|&&|\|\|", before + after):
        return True

    if re.search(r"(?:run|execute|exec|invoke|type)\s+$", before):
        return True

    return False

# --------------------------------------------------
# Environment Variables
# --------------------------------------------------

ENVIRONMENT = [
    "$home",
    "$path",
    "$user",
    "$shell",
    "%temp%",
    "%appdata%",
    "%systemroot%",
    "%windir%",
]


def detect(prompt: str):

    text = prompt.lower()

    score = 0

    findings = []

    # ----------------------------------
    # Linux
    # ----------------------------------

    # ----------------------------------
    # Linux
    # ----------------------------------

    for cmd, risk in sorted(
        LINUX_COMMANDS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):

        # Match the command as a standalone token.
        # Longer commands such as "rm -rf" are checked
        # before shorter commands such as "rm".
        pattern = r"(?<![\w-])" + re.escape(cmd.strip()) + r"(?![\w-])"

        match = re.search(pattern, text)

        if not match:
            continue

        if (
            cmd in CONTEXT_REQUIRED_LINUX_COMMANDS
            and not _has_execution_context(text, match)
        ):
            continue

        score += risk

        findings.append(f"Linux command: {cmd}")

    # ----------------------------------
    # Windows
    # ----------------------------------

    # ----------------------------------
    # Windows
    # ----------------------------------

    for cmd, risk in sorted(
        WINDOWS_COMMANDS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):

        pattern = r"\b" + re.escape(cmd.strip()) + r"\b"

        if re.search(pattern, text):

            score += risk

            findings.append(f"Windows command: {cmd}")

    # ----------------------------------
    # Dangerous Patterns
    # ----------------------------------

    for regex, risk in DANGEROUS_PATTERNS:

        if re.search(regex, text):

            score += risk

            findings.append(f"Dangerous operation: {regex}")

    # ----------------------------------
    # Download & Execute
    # ----------------------------------

    for pattern in DOWNLOAD_EXEC:

        if re.search(pattern, text):

            score += 40

            findings.append("Download-and-execute detected")

    # ----------------------------------
    # PowerShell
    # ----------------------------------

    for cmd in POWERSHELL:

        pattern = r"\b" + re.escape(cmd) + r"\b"

        if re.search(pattern, text):

            score += 30

            findings.append(f"PowerShell execution: {cmd}")

    # ----------------------------------
    # LOLBins
    # ----------------------------------

    for tool in LOLBINS:
        pattern = r"\b" + re.escape(tool) + r"\b"

        if re.search(pattern, text):

            score += 35

            findings.append(f"LOLBin usage: {tool}")

        # ----------------------------------
    # Shell Operators
    # ----------------------------------
    #
    # Shell operators by themselves are NOT
    # sufficient evidence of OS command execution.
    #
    # Characters such as | and ; are extremely
    # common in HTML, CSS, JavaScript and normal
    # text. Only score them when they appear in
    # a command-execution context.
    # ----------------------------------

    command_context_patterns = [
        r"\b(?:bash|sh|zsh)\s+-c\b",
        r"\bcurl\b.+\|\s*(?:bash|sh|zsh)\b",
        r"\bwget\b.+\|\s*(?:bash|sh|zsh)\b",
        r"\brm\s+-rf\b.+[;&|]",
        r"\bsudo\b.+[;&|]",
        r"\b(?:python|python3|perl|php)\s+-[cer]\b.+[;&|]",
        r"\bpowershell\b.+(?:;|&&|\|\|)",
        r"\bcmd(?:\.exe)?\b.+(?:&|&&|\|\|)",
    ]

    command_context_matches = 0

    for pattern in command_context_patterns:

        if re.search(pattern, text, re.IGNORECASE):

            command_context_matches += 1

    if command_context_matches:

        score += min(command_context_matches * 20, 40)

        findings.append(f"Command chaining ({command_context_matches})")

    # ----------------------------------
    # Environment Variables
    # ----------------------------------

    env = 0

    for e in ENVIRONMENT:

        if e in text:

            env += 1

    if env:

        score += env * 8

        findings.append("Environment variable access")

    # ----------------------------------
    # Confidence
    # ----------------------------------

    score = min(score, 100)

    confidence = round(score / 100, 2)

    if score >= 80:

        severity = "Critical"

    elif score >= 60:

        severity = "High"

    elif score >= 30:

        severity = "Medium"

    else:

        severity = "Low"

    return {
        "detector": DETECTOR_NAME,
        "score": score,
        "severity": severity,
        "confidence": confidence,
        "findings": findings,
    }
