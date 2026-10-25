"""
Centralized security detection metadata.

The detectors detect threats.
This module defines how the engine interprets them.
"""

DETECTOR_WEIGHTS = {
    "prompt_injection": 1.5,

    # Encoding is supporting evidence.
    # It should not independently cause a
    # benign webpage to become high risk.
    "encoding": 0.2,

    "os_command": 1.8,
    "reverse_shell": 2.0,
    "sqli": 1.4,
    "xss": 1.2,
    "secrets": 1.3,

    # Obfuscation is also supporting evidence.
    "obfuscation": 0.5,

    "image": 0.8,
    "file": 0.8,
}


DETECTOR_CATEGORIES = {
    "prompt_injection": "prompt_attack",
    "encoding": "obfuscation",
    "os_command": "system_command",
    "reverse_shell": "system_command",
    "sqli": "injection",
    "xss": "injection",
    "secrets": "credential_exposure",
    "obfuscation": "obfuscation",
    "image": "multimodal",
    "file": "file_attack",
}


def get_detector_weight(detector_name: str) -> float:
    return DETECTOR_WEIGHTS.get(
        detector_name.lower(),
        1.0
    )


def get_detector_category(detector_name: str) -> str:
    return DETECTOR_CATEGORIES.get(
        detector_name.lower(),
        "unknown"
    )