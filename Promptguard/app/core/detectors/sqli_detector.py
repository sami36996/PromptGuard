
import re

DETECTOR_NAME = "sql_injection"


# --------------------------------------------------
# High-Confidence SQL Injection Keywords
# --------------------------------------------------

KEYWORDS = {
    "union select": 45,
    "union all select": 50,

    "information_schema": 45,
    "mysql.user": 45,
    "sqlite_master": 40,
    "pg_catalog": 40,
    "sysobjects": 40,

    "drop table": 60,
    "truncate table": 55,
    "delete from": 45,
    "insert into": 35,
    "update set": 35,

    "sleep(": 40,
    "benchmark(": 40,
    "waitfor delay": 45,

    "load_file(": 45,
    "into outfile": 45,

    "xp_cmdshell": 60,
    "sp_executesql": 50,
}


# --------------------------------------------------
# High-Confidence SQL Injection Regex
# --------------------------------------------------

REGEX_RULES = [

    # Boolean-based SQLi
    (r"\bor\s+1\s*=\s*1\b", 50),
    (r"\band\s+1\s*=\s*1\b", 35),

    (r"\bor\s+'1'\s*=\s*'1'\b", 50),
    (r"\band\s+'1'\s*=\s*'1'\b", 35),

    # UNION-based SQLi
    (r"\bunion\s+(?:all\s+)?select\b", 50),

    # Destructive SQL
    (r"\bdrop\s+table\b", 60),
    (r"\btruncate\s+table\b", 55),
    (r"\bdelete\s+from\b", 45),
    (r"\binsert\s+into\b", 35),
    (r"\bupdate\s+.+\s+set\b", 30),

    # Time-based SQLi
    (r"\bsleep\s*\(", 40),
    (r"\bbenchmark\s*\(", 40),
    (r"\bwaitfor\s+delay\b", 45),

    # Database enumeration
    (r"\binformation_schema\b", 45),
    (r"\b@@version\b", 40),
    (r"\bcurrent_user\s*\(", 35),

    # File access
    (r"\bload_file\s*\(", 45),
    (r"\binto\s+outfile\b", 45),

    # Command execution through SQL
    (r"\bxp_cmdshell\b", 60),
    (r"\bsp_executesql\b", 50),
]


# --------------------------------------------------
# SQL Comment Patterns
# --------------------------------------------------

SQL_COMMENT_PATTERNS = [

    # SQL comment followed by SQL-like payload
    re.compile(
        r"(?:--|#)\s*(?:or|and|union|select|drop|delete|insert|update)",
        re.IGNORECASE,
    ),

    # Block comment containing SQL keywords
    re.compile(
        r"/\*.*?(?:select|union|or|and|drop|delete|insert|update).*?\*/",
        re.IGNORECASE | re.DOTALL,
    ),
]


# --------------------------------------------------
# SQL Functions
# --------------------------------------------------

FUNCTIONS = [
    "concat(",
    "char(",
    "ascii(",
    "substring(",
    "hex(",
    "unhex(",
    "load_file(",
    "database(",
    "current_user(",
    "version(",
]


# --------------------------------------------------
# Encoded SQL Indicators
# --------------------------------------------------

ENCODING = [
    "%27",       # '
    "%22",       # "
    "0x",
]


# --------------------------------------------------
# Database Enumeration
# --------------------------------------------------

ENUM = [
    "information_schema",
    "mysql.user",
    "sqlite_master",
    "pg_catalog",
    "sysobjects",
    "current_user",
    "@@version",
]


# --------------------------------------------------
# Helper
# --------------------------------------------------

def _add_finding(findings, finding):
    """Add a finding only once."""
    if finding not in findings:
        findings.append(finding)


# --------------------------------------------------
# Main Detector
# --------------------------------------------------

def detect(prompt: str):

    text = prompt.lower()

    score = 0
    findings = []

    # --------------------------------------------------
    # High-Confidence Keywords
    # --------------------------------------------------

    for keyword, risk in KEYWORDS.items():

        if keyword in text:

            score += risk

            _add_finding(
                findings,
                f"Keyword: {keyword}"
            )


    # --------------------------------------------------
    # Regex Rules
    # --------------------------------------------------

    for regex, risk in REGEX_RULES:

        if re.search(regex, text):

            score += risk

            _add_finding(
                findings,
                f"Pattern: {regex}"
            )


    # --------------------------------------------------
    # SQL Comment Injection
    # --------------------------------------------------
    #
    # IMPORTANT:
    # A "#" or "--" by itself is NOT SQL injection.
    #
    # We only score comments when they are associated
    # with SQL-like manipulation.
    # --------------------------------------------------

    for pattern in SQL_COMMENT_PATTERNS:

        if pattern.search(text):

            score += 20

            _add_finding(
                findings,
                "SQL comment used with SQL expression"
            )

            break


    # --------------------------------------------------
    # SQL Functions
    # --------------------------------------------------

    function_matches = 0

    for fn in FUNCTIONS:

        if fn in text:

            function_matches += 1

            _add_finding(
                findings,
                f"SQL function: {fn}"
            )

    # Only add function risk when functions are present.
    if function_matches:

        score += min(function_matches * 10, 30)


    # --------------------------------------------------
    # Encoded SQL Indicators
    # --------------------------------------------------

    encoded_matches = 0

    for encoded in ENCODING:

        if encoded in text:

            encoded_matches += 1

    # Encoding alone is weak evidence.
    # Require SQL context before assigning substantial risk.
    if encoded_matches:

        sql_context = any(
            keyword in text
            for keyword in (
                "select",
                "union",
                "insert",
                "update",
                "delete",
                "drop",
                "where",
                "or ",
                "and ",
            )
        )

        if sql_context:

            score += min(encoded_matches * 8, 20)

            _add_finding(
                findings,
                "Encoded SQL payload"
            )


    # --------------------------------------------------
    # Database Enumeration
    # --------------------------------------------------

    enum_matches = 0

    for item in ENUM:

        if item in text:

            enum_matches += 1

    if enum_matches:

        score += min(enum_matches * 12, 36)

        _add_finding(
            findings,
            "Database enumeration"
        )


    # --------------------------------------------------
    # Multiple SELECT Statements
    # --------------------------------------------------

    selects = len(
        re.findall(
            r"\bselect\b",
            text
        )
    )

    if selects > 1:

        score += min(selects * 6, 18)

        _add_finding(
            findings,
            "Multiple SELECT statements"
        )


    # --------------------------------------------------
    # SQL Structure
    # --------------------------------------------------
    #
    # Generic "select" or "from" should not be enough.
    # Look for a combination suggesting an actual query.
    # --------------------------------------------------

    has_select = bool(
        re.search(r"\bselect\b", text)
    )

    has_from = bool(
        re.search(r"\bfrom\b", text)
    )

    has_where = bool(
        re.search(r"\bwhere\b", text)
    )

    has_sql_operator = bool(
        re.search(
            r"\b(?:or|and)\b\s+[\w'\"$]+",
            text
        )
    )

    if has_select and has_from:

        score += 10

        _add_finding(
            findings,
            "SQL SELECT/FROM structure"
        )

    if has_where and has_sql_operator:

        score += 10

        _add_finding(
            findings,
            "SQL conditional expression"
        )


    # --------------------------------------------------
    # Final Score
    # --------------------------------------------------

    score = min(score, 100)

    confidence = round(
        score / 100,
        2
    )


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


    return {

        "detector": DETECTOR_NAME,

        "score": score,

        "severity": severity,

        "confidence": confidence,

        "findings": findings,

    }

