import re

TYPE = "Reverse Shell"

# ---------------------------------------
# High Confidence Reverse Shell Patterns
# ---------------------------------------

PATTERNS = [

    # Bash
    (
        re.compile(
            r"bash\s+-i.*?/dev/tcp/\d+\.\d+\.\d+\.\d+/\d+",
            re.IGNORECASE
        ),
        100,
        "Bash Reverse Shell"
    ),

    (
        re.compile(
            r"/dev/tcp/\d+\.\d+\.\d+\.\d+/\d+",
            re.IGNORECASE
        ),
        95,
        "Linux TCP Device"
    ),

    # Netcat

    (
        re.compile(
            r"\bnc\b.*?-e",
            re.IGNORECASE
        ),
        100,
        "Netcat -e"
    ),

    (
        re.compile(
            r"\bncat\b.*?--exec",
            re.IGNORECASE
        ),
        100,
        "Ncat Exec"
    ),

    (
        re.compile(
            r"\bnc\s+\d+\.\d+\.\d+\.\d+\s+\d+",
            re.IGNORECASE
        ),
        60,
        "Netcat Connection"
    ),

    # Python

    (
        re.compile(
            r"socket\.socket",
            re.IGNORECASE
        ),
        45,
        "Python Socket"
    ),

    (
        re.compile(
            r"os\.dup2",
            re.IGNORECASE
        ),
        55,
        "Python dup2"
    ),

    (
        re.compile(
            r"subprocess\.call",
            re.IGNORECASE
        ),
        55,
        "Python subprocess"
    ),

    (
        re.compile(
            r"pty\.spawn",
            re.IGNORECASE
        ),
        65,
        "Python PTY Spawn"
    ),

    # PHP

    (
        re.compile(
            r"fsockopen",
            re.IGNORECASE
        ),
        65,
        "PHP fsockopen"
    ),

    (
        re.compile(
            r"proc_open",
            re.IGNORECASE
        ),
        65,
        "PHP proc_open"
    ),

    (
        re.compile(
            r"shell_exec",
            re.IGNORECASE
        ),
        60,
        "PHP shell_exec"
    ),

    # Perl

    (
        re.compile(
            r"Socket;",
            re.IGNORECASE
        ),
        45,
        "Perl Socket"
    ),

    (
        re.compile(
            r"perl\s+-e",
            re.IGNORECASE
        ),
        60,
        "Perl Inline"
    ),

    # Ruby

    (
        re.compile(
            r"TCPSocket\.new",
            re.IGNORECASE
        ),
        65,
        "Ruby TCPSocket"
    ),

    # PowerShell

    (
        re.compile(
            r"powershell.*?System\.Net\.Sockets",
            re.IGNORECASE
        ),
        90,
        "PowerShell Socket"
    ),

    (
        re.compile(
            r"Invoke-Expression",
            re.IGNORECASE
        ),
        55,
        "Invoke Expression"
    ),

    (
        re.compile(
            r"IEX\s*\(",
            re.IGNORECASE
        ),
        55,
        "PowerShell IEX"
    ),

    # Socat

    (
        re.compile(
            r"socat\s+TCP",
            re.IGNORECASE
        ),
        90,
        "Socat Reverse Shell"
    ),

    # Misc

    (
        re.compile(
            r"connect\(",
            re.IGNORECASE
        ),
        25,
        "Socket Connect"
    ),

    (
        re.compile(
            r"dup2",
            re.IGNORECASE
        ),
        25,
        "dup2"
    ),

    (
        re.compile(
            r"/bin/sh",
            re.IGNORECASE
        ),
        20,
        "Shell Invocation"
    ),

    (
        re.compile(
            r"/bin/bash",
            re.IGNORECASE
        ),
        20,
        "Bash Invocation"
    ),

]

# ---------------------------------------
# Detection Engine
# ---------------------------------------

def detect(prompt: str):

    findings = []

    score = 0

    for regex, risk, label in PATTERNS:

        if regex.search(prompt):

            findings.append(label)

            score = max(score, risk)

    decision = (
        "block"
        if score >= 80
        else "review"
        if score >= 40
        else "allow"
    )

    return {

        "type": TYPE,

        "detected": score > 0,

        "score": score,

        "decision": decision,

        "findings": findings

    }