from __future__ import annotations

from collections.abc import Iterable

from .brahmic_to_latn_iast import (
    to_canonical_iast_from_devanagari,
    to_canonical_iast_from_gujarati,
    to_exact_iast_from_devanagari,
    to_exact_iast_from_gujarati,
)
from .deva_gujr_converter import (
    to_canonical_devanagari_from_gujarati,
    to_canonical_gujarati_from_devanagari,
    to_devanagari_from_gujarati,
    to_exact_devanagari_from_gujarati,
    to_exact_gujarati_from_devanagari,
    to_gujarati_from_devanagari,
)
from .latn_iast_to_deva import to_devanagari_from_iast
from .latn_iast_to_gujr import to_gujarati_from_iast
from .latn_iast_transcription import to_plain_english_from_iast
from .transliteration_result import (
    TransliterationResult,
    to_devanagari,
    to_gujarati,
    to_plain_english,
)


def to_devanagari_from_iast_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of IAST strings to Devanagari script strings."""
    return [to_devanagari_from_iast(item, options=options) for item in items]


def to_gujarati_from_iast_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of IAST strings to Gujarati script strings."""
    return [to_gujarati_from_iast(item, options=options) for item in items]


def to_plain_english_from_iast_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of IAST strings to Plain English strings."""
    return [to_plain_english_from_iast(item, options=options) for item in items]


def to_canonical_iast_from_devanagari_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of Devanagari strings back to canonical IAST."""
    return [to_canonical_iast_from_devanagari(item, options=options) for item in items]


def to_canonical_iast_from_gujarati_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of Gujarati strings back to canonical IAST."""
    return [to_canonical_iast_from_gujarati(item, options=options) for item in items]


def to_canonical_gujarati_from_devanagari_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of Devanagari strings to canonical Gujarati."""
    return [to_canonical_gujarati_from_devanagari(item, options=options) for item in items]


def to_canonical_devanagari_from_gujarati_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of Gujarati strings to canonical Devanagari."""
    return [to_canonical_devanagari_from_gujarati(item, options=options) for item in items]


def to_devanagari_from_gujarati_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of Gujarati strings to Devanagari with exact metadata recovery."""
    return [to_devanagari_from_gujarati(item, options=options) for item in items]


def to_gujarati_from_devanagari_list(items: Iterable[str], options=None) -> list[str]:
    """Bulk converts a sequence of Devanagari strings to Gujarati with exact metadata recovery."""
    return [to_gujarati_from_devanagari(item, options=options) for item in items]


def to_exact_devanagari_from_gujarati_list(items: Iterable[str]) -> list[str]:
    """Bulk recovers exact original Devanagari from a sequence of Gujarati strings."""
    return [to_exact_devanagari_from_gujarati(item) for item in items]


def to_exact_gujarati_from_devanagari_list(items: Iterable[str]) -> list[str]:
    """Bulk recovers exact original Gujarati from a sequence of Devanagari strings."""
    return [to_exact_gujarati_from_devanagari(item) for item in items]


def to_exact_iast_from_devanagari_list(items: Iterable[str]) -> list[str]:
    """Bulk recovers exact original IAST from a sequence of Devanagari strings."""
    return [to_exact_iast_from_devanagari(item) for item in items]


def to_exact_iast_from_gujarati_list(items: Iterable[str]) -> list[str]:
    """Bulk recovers exact original IAST from a sequence of Gujarati strings."""
    return [to_exact_iast_from_gujarati(item) for item in items]


def to_devanagari_list(items: Iterable[str], profile=None) -> list[TransliterationResult]:
    """Bulk converts a sequence of IAST strings returning a list of Devanagari TransliterationResult envelopes."""
    if profile is not None:
        return [to_devanagari(item, profile=profile) for item in items]
    return [to_devanagari(item) for item in items]


def to_gujarati_list(items: Iterable[str], profile=None) -> list[TransliterationResult]:
    """Bulk converts a sequence of IAST strings returning a list of Gujarati TransliterationResult envelopes."""
    if profile is not None:
        return [to_gujarati(item, profile=profile) for item in items]
    return [to_gujarati(item) for item in items]


def to_plain_english_list(items: Iterable[str], profile=None) -> list[TransliterationResult]:
    """Bulk converts a sequence of IAST strings returning a list of Plain English TransliterationResult envelopes."""
    if profile is not None:
        return [to_plain_english(item, profile=profile) for item in items]
    return [to_plain_english(item) for item in items]
