import re

DETECTOR_NAME = "prompt_injection"


# --------------------------------------------------
# Exact keyword attacks
# --------------------------------------------------

KEYWORDS = {

    "ignore previous instructions": 40,
    "ignore all previous instructions": 45,
    "forget previous instructions": 40,
    "forget everything": 30,
    "ignore the system prompt": 45,
    "ignore system instructions": 45,
    "ignore developer instructions": 45,
    "ignore safety": 40,
    "ignore all rules": 40,
    "ignore your rules": 35,
    "disable safety": 50,
    "disable security": 50,
    "disable moderation": 50,

    "bypass safety": 45,
    "bypass filters": 45,
    "bypass moderation": 45,
    "bypass restrictions": 45,

    "developer mode": 45,
    "dan mode": 50,
    "jailbreak": 50,
    "god mode": 45,
    "root mode": 45,
    "unrestricted ai": 45,

    "system prompt": 25,
    "developer prompt": 25,
    "hidden prompt": 25,
    "hidden instructions": 25,

    "reveal system prompt": 45,
    "show system prompt": 45,
    "print system prompt": 45,
    "display system prompt": 45,

    "show hidden instructions": 40,
    "reveal hidden instructions": 40,

    "show your instructions": 35,
    "show your rules": 30,
    "print your rules": 30,

    "act as root": 35,
    "act as administrator": 35,
    "act as system": 30,
    "pretend to be": 15,
    "you are no longer": 20,

    "execute this command": 25,
    "execute the following": 25,
    "do not refuse": 20,
    "never refuse": 20,

}


# --------------------------------------------------
# Regex attacks
# --------------------------------------------------

REGEX_PATTERNS = [

    (r"ignore.{0,25}instruction",30),

    (r"forget.{0,25}instruction",30),

    (r"ignore.{0,25}rule",30),

    (r"bypass.{0,25}safety",40),

    (r"bypass.{0,25}filter",40),

    (r"reveal.{0,25}prompt",35),

    (r"show.{0,25}prompt",35),

    (r"print.{0,25}prompt",35),

    (r"system.{0,20}prompt",20),

    (r"developer.{0,20}prompt",20),

    (r"act as.{0,25}admin",25),

    (r"pretend.{0,20}developer",25),

    (r"override.{0,20}instruction",40),

    (r"new instructions",20),

]


# --------------------------------------------------
# Suspicious role changes
# --------------------------------------------------

ROLE_CHANGE = [

    "you are now",

    "from now on",

    "instead you are",

    "pretend you are",

    "roleplay as",

    "simulate being",

]


def detect(prompt: str):

    text = prompt.lower()

    score = 0

    findings = []


    # ---------------------------------
    # Keyword Matching
    # ---------------------------------

    for keyword, risk in KEYWORDS.items():

        if keyword in text:

            score += risk

            findings.append(f"Keyword: {keyword}")


    # ---------------------------------
    # Regex Matching
    # ---------------------------------

    for pattern, risk in REGEX_PATTERNS:

        if re.search(pattern, text):

            score += risk

            findings.append(f"Pattern: {pattern}")


    # ---------------------------------
    # Role Changes
    # ---------------------------------

    role_hits = 0

    for phrase in ROLE_CHANGE:

        if phrase in text:

            role_hits += 1

            findings.append(f"Role change: {phrase}")

    score += role_hits * 15


    # ---------------------------------
    # Multiple Ignore Attempts
    # ---------------------------------

    ignore_count = text.count("ignore")

    if ignore_count >= 2:

        score += ignore_count * 10

        findings.append(f"Repeated ignore attempts ({ignore_count})")


    # ---------------------------------
    # Confidence
    # ---------------------------------

    confidence = min(score / 100,1.0)

    score = min(score,100)


    # ---------------------------------
    # Severity
    # ---------------------------------

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

        "confidence": round(confidence,2),

        "findings": findings

    }