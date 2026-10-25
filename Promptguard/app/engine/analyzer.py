"""
Prompt analysis engine.

Responsible for:
- Running detectors
- Normalizing detector results
- Aggregating findings
- Analyzing decoded content
- Calculating risk
- Making a decision
"""

from app.core.detectors.prompt_injection import detect as detect_prompt
from app.core.detectors.encoding_detector import detect as detect_encoding
from app.core.detectors.os_command_detector import detect as detect_os
from app.core.detectors.reverse_shell_detector import detect as detect_shell
from app.core.detectors.sqli_detector import detect as detect_sqli
from app.core.detectors.xss_detector import detect as detect_xss
from app.core.detectors.secrets_detector import detect as detect_secret
from app.core.detectors.obfuscation_detector import detect as detect_obfuscation
from app.core.detectors.image_detector import detect as detect_image
from app.core.detectors.file_detector import detect as detect_file

from app.engine.scoring import calculate_risk_score
from app.engine.decision import make_decision


DETECTORS = [
    detect_prompt,
    detect_encoding,
    detect_os,
    detect_shell,
    detect_sqli,
    detect_xss,
    detect_secret,
    detect_obfuscation,
    detect_image,
    detect_file,
]


DETECTOR_ALIASES = {
    "encoding_detector": "encoding",
    "os_command_detector": "os_command",
    "sql_injection": "sqli",
    "xss_detector": "xss",
    "Reverse Shell": "reverse_shell",
    "Secret Leakage": "secrets",
    "Obfuscation": "obfuscation",
    "Image Threat": "image",
    "Dangerous File": "file",
}


def normalize_detector_name(
    result: dict,
    detector,
) -> str:
    """
    Convert detector names into canonical engine names.
    """

    if result.get("detector"):
        name = result["detector"]

    elif result.get("type"):
        name = result["type"]

    else:
        name = detector.__name__

    if name in DETECTOR_ALIASES:
        return DETECTOR_ALIASES[name]

    return (
        name
        .lower()
        .replace("_detector", "")
        .replace(" ", "_")
    )


def _run_detectors(
    prompt: str,
    skip_encoding: bool = False,
) -> tuple[list[dict], dict, list]:
    """
    Run the detector pipeline against a piece of content.

    Returns:
        detector_results
        breakdown
        findings
    """

    detector_results = []
    breakdown = {}
    findings = []

    for detector in DETECTORS:

        # Encoding is responsible for discovering encoded
        # content. It does not need to run again on decoded
        # content because the engine controls recursion.
        if skip_encoding and detector is detect_encoding:
            continue

        result = detector(prompt)

        # Defensive protection: a broken detector must not
        # crash the entire security engine.
        if not isinstance(result, dict):
            result = {
                "detector": detector.__name__,
                "score": 0,
                "findings": [
                    f"Detector returned invalid result: "
                    f"{detector.__module__}.{detector.__name__}"
                ],
            }

        detector_name = normalize_detector_name(
            result,
            detector,
        )

        detector_score = result.get(
            "score",
            0,
        )

        result["detector"] = detector_name

        detector_results.append(result)

        breakdown[detector_name] = detector_score

        findings.extend(
            result.get(
                "findings",
                [],
            )
        )

    return (
        detector_results,
        breakdown,
        findings,
    )


def analyze_prompt(
    prompt: str,
    review_threshold: float = 30,
    block_threshold: float = 70,
) -> dict:
    """
    Analyze a prompt and any safely decoded representations.

    The original prompt is analyzed first.

    If the encoding detector discovers decoded payloads,
    those payloads are analyzed through the security detectors
    again. This prevents encoded attacks from bypassing the
    primary detectors.

    Decoded content is analyzed only once per discovered payload
    and the encoding detector itself is skipped during the second
    pass to avoid recursive scoring.
    """

    if not isinstance(prompt, str):
        prompt = str(prompt)

    # --------------------------------------------------
    # First pass: original content
    # --------------------------------------------------

    (
        detector_results,
        breakdown,
        findings,
    ) = _run_detectors(prompt)

    # --------------------------------------------------
    # Extract decoded content from encoding detector
    # --------------------------------------------------

    decoded_payloads = []

    for result in detector_results:

        if result.get("detector") != "encoding":
            continue

        payloads = result.get(
            "decoded_payloads",
            [],
        )

        if isinstance(payloads, list):
            decoded_payloads.extend(payloads)

    # --------------------------------------------------
    # Second pass: decoded content
    # --------------------------------------------------

    decoded_results = []

    seen_payloads = set()

    for decoded in decoded_payloads:

        if not isinstance(decoded, str):
            continue

        decoded = decoded.strip()

        if not decoded:
            continue

        # Prevent duplicate analysis.
        if decoded in seen_payloads:
            continue

        seen_payloads.add(decoded)

        (
            second_pass_results,
            second_pass_breakdown,
            second_pass_findings,
        ) = _run_detectors(
            decoded,
            skip_encoding=True,
        )

        decoded_results.append(
            {
                "content": decoded,
                "results": second_pass_results,
            }
        )

        # Merge detector scores.
        for detector_name, detector_score in (
            second_pass_breakdown.items()
        ):

            if not detector_score:
                continue

            current_score = breakdown.get(
                detector_name,
                0,
            )

            breakdown[detector_name] = max(
                current_score,
                detector_score,
            )

        # Add findings while avoiding duplicates.
        for finding in second_pass_findings:

            if finding not in findings:
                findings.append(finding)

    # --------------------------------------------------
    # Calculate final risk
    # --------------------------------------------------

    all_results = list(detector_results)

    for decoded_result in decoded_results:
        all_results.extend(
            decoded_result["results"]
        )

    score = calculate_risk_score(
        all_results
    )

    # --------------------------------------------------
    # Decision
    # --------------------------------------------------

    decision = make_decision(
        score=score,
        review_threshold=review_threshold,
        block_threshold=block_threshold,
    )

    return {
        "score": score,
        "decision": decision["decision"],
        "severity": decision["severity"],
        "breakdown": breakdown,
        "findings": findings,
        "results": detector_results,
        "decoded_results": decoded_results,
    }