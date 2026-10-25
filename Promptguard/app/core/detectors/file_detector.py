import os
import re
import base64

NAME = "Dangerous File"

# -------------------------------------------------------
# High-risk executable extensions
# -------------------------------------------------------

EXECUTABLES = {

    ".exe": 60,
    ".dll": 60,
    ".bat": 55,
    ".cmd": 55,
    ".ps1": 60,
    ".vbs": 60,
    ".js": 45,
    ".jar": 45,
    ".msi": 60,
    ".apk": 45,
    ".com": 60,
    ".scr": 65,
    ".pif": 65,
    ".hta": 60,
    ".sh": 45,
    ".bash": 45,
    ".zsh": 45,

}

# -------------------------------------------------------
# Office files containing macros
# -------------------------------------------------------

MACRO_FILES = {

    ".docm",
    ".xlsm",
    ".pptm",

}

# -------------------------------------------------------
# Archives
# -------------------------------------------------------

ARCHIVES = {

    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".xz",

}

# -------------------------------------------------------
# Script-like extensions
# -------------------------------------------------------

SCRIPT_FILES = {

    ".py",
    ".php",
    ".pl",
    ".rb",
    ".cgi",

}

# -------------------------------------------------------
# Suspicious names
# -------------------------------------------------------

BAD_NAMES = [

    "payload",
    "malware",
    "virus",
    "backdoor",
    "shell",
    "reverse_shell",
    "meterpreter",
    "implant",
    "loader",
    "dropper",
    "exploit",
    "keylogger",

]

# -------------------------------------------------------
# Path Traversal
# -------------------------------------------------------

PATH_TRAVERSAL = [

    "../",
    "..\\",
    "/etc/passwd",
    "c:\\windows",
    "/proc/",
    "/root/",

]

# -------------------------------------------------------

DOUBLE_EXTENSION = re.compile(

    r"\.(pdf|jpg|png|doc|docx|xls|xlsx|txt)\.(exe|bat|cmd|js|vbs|ps1|scr)$",

    re.IGNORECASE

)

# -------------------------------------------------------

HIDDEN_EXTENSION = re.compile(

    r"^\.[A-Za-z0-9]+"

)

# -------------------------------------------------------

HEX_FILENAME = re.compile(

    r"^[A-Fa-f0-9]{24,}$"

)

# -------------------------------------------------------

BASE64_FILENAME = re.compile(

    r"^[A-Za-z0-9+/=]{30,}$"

)

# -------------------------------------------------------
def decode_base64(text: str):
    try:
        return base64.b64decode(text, validate=True).decode(errors="ignore")
    except Exception:
        return None

def detect(prompt: str):

    texts = [prompt.lower()]

    decoded = decode_base64(prompt.strip())

    if decoded:
        texts.append(decoded.lower())

    findings = []

    score = 0

    # ----------------------------------------
    # Extension inspection
    # ----------------------------------------

    for text in texts:

        ext = os.path.splitext(text)[1]

        if ext in EXECUTABLES:
            score += EXECUTABLES[ext]
            findings.append(f"Executable: {ext}")

        if ext in MACRO_FILES:
            score += 45
            findings.append("Macro-enabled Office document")

        if ext in SCRIPT_FILES:
            score += 35
            findings.append("Script file")

        if ext in ARCHIVES:
            score += 20
            findings.append("Archive")

        if ext in EXECUTABLES:

            score += EXECUTABLES[ext]

            findings.append(f"Executable: {ext}")

        if ext in MACRO_FILES:

            score += 45

            findings.append("Macro-enabled Office document")

        if ext in SCRIPT_FILES:

            score += 35

            findings.append("Script file")

        if ext in ARCHIVES:

            score += 20

            findings.append("Archive")

    # ----------------------------------------
    # Double Extension
    # ----------------------------------------

    if DOUBLE_EXTENSION.search(text):

        score += 60

        findings.append("Double extension")

    # ----------------------------------------
    # Hidden extension
    # ----------------------------------------

    if HIDDEN_EXTENSION.match(text):

        score += 35

        findings.append("Hidden filename")

    # ----------------------------------------
    # Password-protected archive naming
    # ----------------------------------------

    if "password" in text and ext in ARCHIVES:

        score += 35

        findings.append("Password protected archive")

    # ----------------------------------------
    # Suspicious filename
    # ----------------------------------------

    for word in BAD_NAMES:

        if word in text:

            score += 20

            findings.append(f"Suspicious filename: {word}")

    # ----------------------------------------
    # Path Traversal
    # ----------------------------------------

    for p in PATH_TRAVERSAL:

        if p in text:

            score += 60

            findings.append("Path traversal")

    # ----------------------------------------
    # Encoded filename
    # ----------------------------------------

    filename = os.path.basename(text)

    if HEX_FILENAME.match(filename):

        score += 15

        findings.append("Hex encoded filename")

    if BASE64_FILENAME.match(filename):

        score += 20

        findings.append("Base64-like filename")

    score = min(score, 100)

    return {

        "type": NAME,

        "detected": score > 0,

        "score": score,

        "findings": findings

    }
    