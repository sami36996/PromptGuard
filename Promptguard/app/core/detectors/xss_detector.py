import re

DETECTOR_NAME = "xss_detector"


# --------------------------------------------------
# High-Risk HTML Tags
# --------------------------------------------------

DANGEROUS_TAGS = {
    "<script": 50,
    "<iframe": 35,
    "<object": 35,
    "<embed": 35,
    "<svg": 25,
    "<math": 20,
}


# --------------------------------------------------
# Dangerous JavaScript Functions
# --------------------------------------------------

JS_FUNCTIONS = {
    "alert(": 30,
    "confirm(": 25,
    "prompt(": 25,
    "eval(": 40,
    "settimeout(": 20,
    "setinterval(": 20,
    "fetch(": 20,
    "xmlhttprequest": 30,
    "document.cookie": 45,
    "window.location": 30,
    "document.write": 25,
    "innerhtml": 25,
    "outerhtml": 20,
    "localstorage": 20,
    "sessionstorage": 20,
}


# --------------------------------------------------
# Event Handlers
# --------------------------------------------------

EVENT_HANDLER_RE = re.compile(
    r"\bon[a-z]+\s*=",
    re.IGNORECASE,
)


# --------------------------------------------------
# Dangerous URI Schemes
# --------------------------------------------------

URI_SCHEMES = [
    "javascript:",
    "vbscript:",
    "data:text/html",
    "data:image/svg+xml",
]


# --------------------------------------------------
# Cookie Theft
# --------------------------------------------------

COOKIE_PATTERNS = [
    "document.cookie",
    "cookie=",
    "set-cookie",
]


# --------------------------------------------------
# DOM Manipulation
# --------------------------------------------------

DOM_PATTERNS = [
    "innerhtml",
    "outerhtml",
    "appendchild",
    "createelement",
    "document.write",
]


# --------------------------------------------------
# Encoded XSS
# --------------------------------------------------

ENCODED_XSS = [
    "&lt;script",
    "&#60;script",
    "%3cscript",
    "%3csvg",
]


# --------------------------------------------------
# Helper
# --------------------------------------------------

def _has_html(text: str) -> bool:
    return bool(re.search(r"<[a-zA-Z][^>]*>", text))


# --------------------------------------------------
# Main Detector
# --------------------------------------------------

def detect(prompt: str):

    text = prompt.lower()

    score = 0
    findings = []

    # --------------------------------------------------
    # Dangerous HTML Tags
    # --------------------------------------------------

    for tag, risk in DANGEROUS_TAGS.items():

        if tag in text:

            score += risk
            findings.append(f"Dangerous HTML tag: {tag}")


    # --------------------------------------------------
    # JavaScript Functions
    # --------------------------------------------------

    for js, risk in JS_FUNCTIONS.items():

        if js in text:

            score += risk
            findings.append(f"JavaScript: {js}")


    # --------------------------------------------------
    # Event Handlers
    # --------------------------------------------------

    event_matches = EVENT_HANDLER_RE.findall(text)

    if event_matches:

        score += min(len(event_matches) * 30, 60)

        for event in sorted(set(event_matches)):

            findings.append(
                f"Event handler: {event}"
            )


    # --------------------------------------------------
    # Dangerous URI Schemes
    # --------------------------------------------------

    for uri in URI_SCHEMES:

        if uri in text:

            score += 40

            findings.append(
                f"Dangerous URI: {uri}"
            )


    # --------------------------------------------------
    # Cookie Access
    # --------------------------------------------------

    cookie_matches = 0

    for pattern in COOKIE_PATTERNS:

        if pattern in text:

            cookie_matches += 1

    if cookie_matches:

        score += min(cookie_matches * 20, 40)

        findings.append("Cookie access")


    # --------------------------------------------------
    # DOM Manipulation
    # --------------------------------------------------

    dom_matches = 0

    for pattern in DOM_PATTERNS:

        if pattern in text:

            dom_matches += 1

    if dom_matches:

        score += min(dom_matches * 12, 30)

        findings.append("DOM manipulation")


    # --------------------------------------------------
    # Encoded XSS
    # --------------------------------------------------

    for encoded in ENCODED_XSS:

        if encoded in text:

            score += 30

            findings.append(
                f"Encoded XSS payload: {encoded}"
            )


    # --------------------------------------------------
    # Contextual Escalation
    # --------------------------------------------------
    #
    # A dangerous tag by itself is suspicious.
    # A dangerous tag + executable JavaScript
    # is much more serious.
    # --------------------------------------------------

    has_dangerous_tag = any(
        tag in text
        for tag in DANGEROUS_TAGS
    )

    has_javascript = any(
        js in text
        for js in JS_FUNCTIONS
    )

    has_event_handler = bool(
        EVENT_HANDLER_RE.search(text)
    )

    has_dangerous_uri = any(
        uri in text
        for uri in URI_SCHEMES
    )

    if (
        has_dangerous_tag
        and (
            has_javascript
            or has_event_handler
            or has_dangerous_uri
        )
    ):

        score += 25

        findings.append(
            "Executable behavior associated with HTML"
        )


    # --------------------------------------------------
    # Cap
    # --------------------------------------------------

    score = min(score, 100)


    # --------------------------------------------------
    # Severity
    # --------------------------------------------------

    if score >= 80:
        severity = "Critical"

    elif score >= 60:
        severity = "High"

    elif score >= 30:
        severity = "Medium"

    else:
        severity = "Low"


    confidence = round(score / 100, 2)


    return {

        "detector": DETECTOR_NAME,

        "score": score,

        "severity": severity,

        "confidence": confidence,

        "findings": findings,

    }