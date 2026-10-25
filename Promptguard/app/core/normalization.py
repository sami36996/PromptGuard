"""
PromptGuard Normalization Pipeline

Decodes Base64, URL encoding, HTML entities, hex escapes.
Strips zero-width chars. Normalizes Unicode homoglyphs (NFKC).
"""

import base64
import html
import re
import urllib.parse
import unicodedata
from typing import Tuple, List


def normalize_text(text: str, max_depth: int = 3) -> Tuple[str, List[str]]:
    """
    Recursively normalize text through encoding layers.
    
    Args:
        text: Raw input prompt
        max_depth: Max recursive decoding depth (prevents zip bomb attacks)
    
    Returns:
        (canonical_text, list_of_transformations_applied)
    """
    transformations = []
    current = text
    
    for depth in range(max_depth):
        original = current
        step_transforms = []
        
        # 1. Strip null bytes, BOM, zero-width characters
        cleaned = re.sub(r'[\u0000-\u001F\u200B-\u200D\uFEFF]', '', current)
        if cleaned != current:
            step_transforms.append(f"strip_control_chars_d{depth}")
            current = cleaned
        
        # 2. Unicode NFKC normalization (Cyrillic 'і' → 'i', etc.)
        normalized = unicodedata.normalize('NFKC', current)
        if normalized != current:
            step_transforms.append(f"unicode_nfkc_d{depth}")
            current = normalized
        
        # 3. Whitespace canonicalization
        spaced = ' '.join(current.split())
        if spaced != current:
            step_transforms.append(f"whitespace_canon_d{depth}")
            current = spaced
        
        # 4. Encoding detection and decoding
        decoded = None
        
        # 4a: Base64 (strict validation)
        try:
            stripped = re.sub(r'\s+', '', current)
            if (re.match(r'^[A-Za-z0-9+/]+={0,2}$', stripped) and 
                len(stripped) % 4 == 0 and 
                8 <= len(stripped) <= 10000):
                decoded = base64.b64decode(stripped).decode('utf-8')
                step_transforms.append(f"base64_decode_d{depth}")
        except Exception:
            pass
        
        # 4b: URL encoding
        if decoded is None:
            try:
                unquoted = urllib.parse.unquote(current)
                if unquoted != current:
                    decoded = unquoted
                    step_transforms.append(f"url_decode_d{depth}")
            except Exception:
                pass
        
        # 4c: HTML entities
        if decoded is None:
            unescaped = html.unescape(current)
            if unescaped != current:
                decoded = unescaped
                step_transforms.append(f"html_unescape_d{depth}")
        
        # 4d: Hex escapes (\x41, \u0041)
        if decoded is None:
            hex_decoded = current
            hex_decoded = re.sub(
                r'\\x([0-9a-fA-F]{2})',
                lambda m: chr(int(m.group(1), 16)),
                hex_decoded
            )
            hex_decoded = re.sub(
                r'\\u([0-9a-fA-F]{4})',
                lambda m: chr(int(m.group(1), 16)),
                hex_decoded
            )
            if hex_decoded != current:
                decoded = hex_decoded
                step_transforms.append(f"hex_unescape_d{depth}")
        
        transformations.extend(step_transforms)
        
        if decoded is None:
            break  # No more transformations possible
            
        current = decoded
    
    return current, transformations