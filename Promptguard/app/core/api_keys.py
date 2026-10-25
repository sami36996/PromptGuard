import hashlib
import secrets


def generate_api_key() -> str:
    """
    Generate a cryptographically secure API key.
    """
    return f"pg_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key using SHA-256.
    """
    return hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()
