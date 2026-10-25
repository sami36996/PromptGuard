import base64
import binascii
import html
import math
import re
import urllib.parse


DETECTOR_NAME = "encoding_detector"


# --------------------------------------------------
# Configuration
# --------------------------------------------------

MAX_DECODED_PAYLOAD_SIZE = 1024 * 1024  # 1 MB

MIN_LONG_BASE64_LENGTH = 20
MIN_SHORT_BASE64_LENGTH = 8

PRINTABLE_RATIO_THRESHOLD = 0.85


# --------------------------------------------------
# Base64
# --------------------------------------------------

# Long Base64 blobs can safely be detected inside
# larger text.
BASE64_RE = re.compile(
    r"(?<![A-Za-z0-9+/])"
    r"(?:[A-Za-z0-9+/]{4}){2,}"
    r"(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?"
    r"(?![A-Za-z0-9+/])"
)

# Candidate Base64 token.
#
# This is intentionally broader than BASE64_RE.
# We only use it after applying additional validation.
BASE64_TOKEN_RE = re.compile(
    r"(?<![A-Za-z0-9+/])"
    r"[A-Za-z0-9+/]{8,}={0,2}"
    r"(?![A-Za-z0-9+/])"
)


# --------------------------------------------------
# Other Encoding Patterns
# --------------------------------------------------

HEX_RE = re.compile(
    r"^(?:[0-9A-Fa-f]{2})+$"
)

BINARY_RE = re.compile(
    r"^(?:[01]{8}\s*)+$"
)

URL_RE = re.compile(
    r"%[0-9A-Fa-f]{2}"
)

UNICODE_RE = re.compile(
    r"(\\u[0-9a-fA-F]{4})+"
)

HTML_ENTITY_RE = re.compile(
    r"&(?:#\d+|#x[0-9a-fA-F]+|\w+);"
)

JWT_RE = re.compile(
    r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$"
)


# --------------------------------------------------
# Suspicious decoded indicators
# --------------------------------------------------

SUSPICIOUS_WORDS = [
    "ignore",
    "system",
    "prompt",
    "bypass",
    "powershell",
    "cmd",
    "bash",
    "curl",
    "wget",
    "nc",
    "rm -rf",
    "eval",
    "<script>",
    "select",
    "union",
]


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def entropy(text: str) -> float:

    if not text:
        return 0.0

    frequency = {}

    for char in text:
        frequency[char] = frequency.get(char, 0) + 1

    result = 0.0

    length = len(text)

    for count in frequency.values():

        probability = count / length

        result -= probability * math.log2(
            probability
        )

    return result


def _is_printable_text(text: str) -> bool:

    if not text:
        return False

    printable = sum(
        32 <= ord(char) <= 126
        or char in "\n\r\t"
        for char in text
    )

    ratio = printable / len(text)

    return ratio >= PRINTABLE_RATIO_THRESHOLD


def safe_base64_decode(text: str):

    if not text:
        return None

    if len(text) > MAX_DECODED_PAYLOAD_SIZE * 2:
        return None

    try:

        decoded_bytes = base64.b64decode(
            text,
            validate=True,
        )

    except (
        ValueError,
        binascii.Error,
    ):
        return None

    if len(decoded_bytes) > MAX_DECODED_PAYLOAD_SIZE:
        return None

    try:

        decoded = decoded_bytes.decode(
            "utf-8",
            errors="strict",
        )

    except UnicodeDecodeError:

        try:

            decoded = decoded_bytes.decode(
                errors="ignore"
            )

        except Exception:

            return None

    if not decoded:
        return None

    return decoded


def _looks_like_base64(text: str) -> bool:

    if not text:
        return False

    if len(text) < MIN_SHORT_BASE64_LENGTH:
        return False

    # Base64 length must be compatible with
    # normal 4-byte blocks.
    if len(text) % 4 != 0:
        return False

    if not re.fullmatch(
        r"[A-Za-z0-9+/]+={0,2}",
        text,
    ):
        return False

    # Padding can only appear at the end.
    if "=" in text[:-2]:
        return False

    return True


def _decoded_is_suspicious(text: str) -> bool:

    lower = text.lower()

    for word in SUSPICIOUS_WORDS:

        if word in lower:
            return True

    return False


def _add_decoded_payload(
    decoded_payloads: list[str],
    decoded: str,
) -> None:

    decoded = decoded.strip()

    if not decoded:
        return

    if decoded in decoded_payloads:
        return

    decoded_payloads.append(decoded)


# --------------------------------------------------
# Main Detector
# --------------------------------------------------

def detect(prompt: str):

    if not isinstance(prompt, str):

        prompt = str(prompt)

    score = 0

    findings = []

    decoded_payloads = []

    stripped = prompt.strip()


    # ==================================================
    # Base64 — Long Embedded Blobs
    # ==================================================

    detected_base64 = set()

    for match in BASE64_RE.finditer(prompt):

        blob = match.group()

        if blob in detected_base64:
            continue

        detected_base64.add(blob)

        decoded = safe_base64_decode(blob)

        if not decoded:
            continue

        if not _is_printable_text(decoded):
            continue

        score += 20

        findings.append(
            "Base64 encoded payload"
        )

        _add_decoded_payload(
            decoded_payloads,
            decoded,
        )


    # ==================================================
    # Base64 — Short / Medium Tokens
    # ==================================================
    #
    # Short Base64 is handled separately because
    # requiring 20+ characters can miss valid attacks.
    #
    # We do NOT flag every short Base64 string.
    # A short token must decode into printable text,
    # and suspicious decoded content receives stronger
    # evidence.
    # ==================================================

    for match in BASE64_TOKEN_RE.finditer(prompt):

        blob = match.group()

        if blob in detected_base64:
            continue

        if len(blob) < MIN_SHORT_BASE64_LENGTH:
            continue

        if len(blob) < MIN_LONG_BASE64_LENGTH:

            if not _looks_like_base64(blob):
                continue

        decoded = safe_base64_decode(blob)

        if not decoded:
            continue

        if not _is_printable_text(decoded):
            continue

        lower_decoded = decoded.lower()

        suspicious = _decoded_is_suspicious(
            decoded
        )

        # Short benign Base64 should not create
        # a finding merely because it is Base64.
        if len(blob) < MIN_LONG_BASE64_LENGTH:

            if not suspicious:
                continue

        detected_base64.add(blob)

        if suspicious:

            score += 20

            findings.append(
                "Base64 encoded payload"
            )

            _add_decoded_payload(
                decoded_payloads,
                decoded,
            )


    # ==================================================
    # Hex
    # ==================================================

    if HEX_RE.fullmatch(stripped):

        try:

            decoded = bytes.fromhex(
                stripped
            ).decode(
                "utf-8",
                errors="ignore",
            )

            if decoded and _is_printable_text(decoded):

                score += 20

                findings.append(
                    "Hex encoded payload"
                )

                _add_decoded_payload(
                    decoded_payloads,
                    decoded,
                )

        except (
            ValueError,
            binascii.Error,
        ):
            pass


    # ==================================================
    # Binary
    # ==================================================

    if BINARY_RE.fullmatch(stripped):

        try:

            chars = []

            for byte in stripped.split():

                chars.append(
                    chr(int(byte, 2))
                )

            decoded = "".join(chars)

            if decoded and _is_printable_text(decoded):

                score += 20

                findings.append(
                    "Binary encoded payload"
                )

                _add_decoded_payload(
                    decoded_payloads,
                    decoded,
                )

        except (
            ValueError,
            TypeError,
        ):
            pass


    # ==================================================
    # URL Encoding
    # ==================================================

    if URL_RE.search(prompt):

        decoded = urllib.parse.unquote(
            prompt
        )

        if decoded != prompt:

            score += 15

            findings.append(
                "URL encoded payload"
            )

            _add_decoded_payload(
                decoded_payloads,
                decoded,
            )


    # ==================================================
    # HTML Entity Encoding
    # ==================================================

    if HTML_ENTITY_RE.search(prompt):

        decoded = html.unescape(
            prompt
        )

        if decoded != prompt:

            score += 15

            findings.append(
                "HTML entity encoding"
            )

            _add_decoded_payload(
                decoded_payloads,
                decoded,
            )


    # ==================================================
    # Unicode Escapes
    # ==================================================

    if UNICODE_RE.search(prompt):

        try:

            decoded = (
                prompt
                .encode("utf-8")
                .decode("unicode_escape")
            )

            if decoded != prompt:

                score += 15

                findings.append(
                    "Unicode escape encoding"
                )

                _add_decoded_payload(
                    decoded_payloads,
                    decoded,
                )

        except (
            UnicodeDecodeError,
            UnicodeError,
        ):
            pass


    # ==================================================
    # JWT
    # ==================================================

    if JWT_RE.fullmatch(stripped):

        score += 15

        findings.append(
            "JWT token detected"
        )


    # ==================================================
    # High Entropy
    # ==================================================
    #
    # IMPORTANT:
    # Entropy is supporting evidence only.
    # It does NOT independently increase score.
    # ==================================================

    ent = entropy(prompt)

    if ent > 4.7:

        findings.append(
            f"High entropy ({ent:.2f})"
        )


    # ==================================================
    # Inspect Decoded Content
    # ==================================================

    for payload in decoded_payloads:

        lower = payload.lower()

        for word in SUSPICIOUS_WORDS:

            if word in lower:

                score += 15

                findings.append(
                    f"Decoded payload contains '{word}'"
                )


    # ==================================================
    # Nested Base64
    # ==================================================

    for payload in decoded_payloads:

        nested = payload.strip()

        if not _looks_like_base64(nested):
            continue

        nested_decoded = safe_base64_decode(
            nested
        )

        if not nested_decoded:
            continue

        if not _is_printable_text(
            nested_decoded
        ):
            continue

        score += 15

        findings.append(
            "Nested Base64 detected"
        )

        _add_decoded_payload(
            decoded_payloads,
            nested_decoded,
        )


    # ==================================================
    # Oversized Encoded Blob
    # ==================================================

    if len(prompt) > MAX_DECODED_PAYLOAD_SIZE:

        findings.append(
            "Input exceeds encoding analysis size limit"
        )


    # ==================================================
    # Remove Duplicate Findings
    # ==================================================

    findings = list(
        dict.fromkeys(findings)
    )


    # ==================================================
    # Final Score
    # ==================================================

    score = min(
        max(score, 0),
        100,
    )

    confidence = round(
        score / 100,
        2,
    )


    # ==================================================
    # Severity
    # ==================================================

    if score >= 80:

        severity = "Critical"

    elif score >= 60:

        severity = "High"

    elif score >= 30:

        severity = "Medium"

    else:

        severity = "Low"


    # ==================================================
    # Result
    # ==================================================

    return {

        "detector": DETECTOR_NAME,

        "score": score,

        "severity": severity,

        "confidence": confidence,

        "findings": findings,

        "decoded_payloads": decoded_payloads,

    }