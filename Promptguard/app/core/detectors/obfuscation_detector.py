# app/core/detectors/obfuscation_detector.py

import re
import math
from collections import Counter

TYPE = "Obfuscation"


# -----------------------------
# Regex Patterns
# -----------------------------
PATTERNS = [

    # Python chr()
    (re.compile(r"chr\s*\(\s*\d+\s*\)", re.I), 25, "python_chr"),

    # PowerShell [char]65
    (re.compile(r"\[char\]\s*\d+", re.I), 25, "powershell_char"),

    # Unicode escapes
    (re.compile(r"(\\u[0-9a-fA-F]{4}){2,}"), 25, "unicode_escape"),

    # Hex escapes
    (re.compile(r"(\\x[0-9a-fA-F]{2}){3,}"), 25, "hex_escape"),

    # URL Encoding
    (re.compile(r"(%[0-9a-fA-F]{2}){4,}"), 20, "url_encoding"),

    # String concatenation
    (re.compile(r"(\".*?\"\s*\+\s*\")"), 15, "string_concat"),

    (re.compile(r"('.*?'\s*\+\s*')"), 15, "string_concat"),

    # Python join()
    (re.compile(r"\.join\s*\(", re.I), 15, "join_function"),

    # eval / exec
    (re.compile(r"\b(eval|exec)\b", re.I), 25, "dynamic_execution"),

    # Base64 decode
    (re.compile(r"base64", re.I), 15, "base64_reference"),

    # FromCharCode
    (re.compile(r"fromcharcode", re.I), 25, "js_charcode"),

    # PowerShell invoke expression
    (re.compile(r"iex\s*\(", re.I), 35, "invoke_expression"),

    (re.compile(r"invoke-expression", re.I), 35, "invoke_expression"),

    # Shell variable expansion abuse
    (re.compile(r"\$\{.*?\}"), 10, "variable_expansion"),

    # Backticks
    (re.compile(r"`.+?`"), 20, "backticks"),

    # Many escape characters
    (re.compile(r"(\\\\){6,}"), 20, "heavy_escape"),

]


# -----------------------------
# Shannon Entropy
# -----------------------------
def entropy(text):

    if not text:
        return 0

    counter = Counter(text)

    length = len(text)

    entropy = 0

    for count in counter.values():

        p = count / length

        entropy -= p * math.log2(p)

    return entropy


# -----------------------------
# Main Detector
# -----------------------------
def detect(prompt: str):

    findings = []

    score = 0

    text = prompt.strip()

    lower = text.lower()

    # -----------------------------
    # Regex Patterns
    # -----------------------------

    for regex, risk, label in PATTERNS:

        if regex.search(text):

            findings.append(label)

            score += risk

    # -----------------------------
    # Mixed Encoding
    # -----------------------------

    encodings = 0

    if "\\x" in text:
        encodings += 1

    if "\\u" in text:
        encodings += 1

    if "%" in text:
        encodings += 1

    if "base64" in lower:
        encodings += 1

    if encodings >= 2:

        findings.append("multiple_encodings")

        score += 20

    # -----------------------------
    # High Entropy
    # -----------------------------

    e = entropy(text)

    if len(text) > 60 and e > 4.7:

        findings.append(f"high_entropy:{round(e,2)}")

        score += 20

    # -----------------------------
    # Too many symbols
    # -----------------------------

    symbols = len(re.findall(r"[\\%{}\[\]();`]", text))

    if symbols > 25:

        findings.append("symbol_density")

        score += 15

    # -----------------------------
    # Very long encoded token
    # -----------------------------

    for token in text.split():

        if len(token) > 120:

            findings.append("very_long_token")

            score += 20

            break

    # -----------------------------
    # Final
    # -----------------------------

    score = min(score, 100)

    if score >= 80:
        decision = "block"

    elif score >= 45:
        decision = "review"

    else:
        decision = "allow"

    return {

        "type": TYPE,

        "detected": score > 0,

        "score": score,

        "decision": decision,

        "findings": findings

    }