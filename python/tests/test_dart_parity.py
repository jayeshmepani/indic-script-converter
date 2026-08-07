from __future__ import annotations

from lipimala.brahmic_to_latn_iast import (
    to_canonical_iast_from_devanagari,
    to_canonical_iast_from_gujarati,
)
from lipimala.latn_iast_to_deva import (
    IastToDevanagariDigitPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    to_devanagari_from_iast,
)
from lipimala.latn_iast_to_gujr import (
    IastToGujaratiDigitPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    to_gujarati_from_iast,
)
from lipimala.latn_iast_transcription import to_plain_english_from_iast

from .oracle_data import (
    DEVA_SOURCE,
    EXPECTED_DEVA,
    EXPECTED_DEVA_REVERSE,
    EXPECTED_GUJR,
    EXPECTED_GUJR_REVERSE,
    EXPECTED_PLAIN,
    GUJR_SOURCE,
    LATIN,
)


def test_all_497_latin_to_devanagari_outputs_match_dart() -> None:
    options = IastToDevanagariOptions(
        punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    )
    actual = [to_devanagari_from_iast(item, options) for item in LATIN]
    assert actual == EXPECTED_DEVA


def test_all_497_latin_to_gujarati_outputs_match_dart() -> None:
    options = IastToGujaratiOptions(
        punctuation_policy=IastToGujaratiPunctuationPolicy.INDIC_DANDA,
        digit_policy=IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT,
    )
    actual = [to_gujarati_from_iast(item, options) for item in LATIN]
    assert actual == EXPECTED_GUJR


def test_all_497_plain_english_outputs_match_dart() -> None:
    actual = [to_plain_english_from_iast(item) for item in LATIN]
    assert actual == EXPECTED_PLAIN


def test_all_497_devanagari_reverse_outputs_match_dart() -> None:
    actual = [to_canonical_iast_from_devanagari(item) for item in DEVA_SOURCE]
    assert actual == EXPECTED_DEVA_REVERSE


def test_all_497_gujarati_reverse_outputs_match_dart() -> None:
    actual = [to_canonical_iast_from_gujarati(item) for item in GUJR_SOURCE]
    assert actual == EXPECTED_GUJR_REVERSE
