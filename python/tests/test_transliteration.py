from __future__ import annotations

import json

from indic_script_converter import (
    IastToDevanagariOptions,
    IastToGujaratiOptions,
    TransliterationResult,
    has_embedded_exact_source,
    recover_embedded_exact_source,
    strip_exact_source_metadata,
    to_devanagari_from_iast,
    to_exact_iast_from_devanagari,
    to_exact_iast_from_gujarati,
    to_gujarati_from_iast,
    to_plain_english,
)
import pytest

SOURCES = [
    'Kṛṣṇa',
    'Kr̥ṣṇa',
    'KṚṢṆA',
    'Rāma',
    'ḫāna / k͟hāna / xaṇḍa',
    'ṣ́akti / ṣ́akti',
    'ṃ̄ / ṃ̄ / ṁaṅgala / ṁaṅgala / m̐tra',
    'emoji 😀 supplementary 𐍈',
    'combining-order a̐̄ ā̐',
    "quotes 'jñāna' and so'ham\n123",
]


@pytest.mark.parametrize('source', SOURCES)
def test_exact_devanagari_metadata_roundtrip(source: str) -> None:
    tagged = to_devanagari_from_iast(
        source,
        IastToDevanagariOptions(embed_exact_source_metadata=True),
    )
    assert has_embedded_exact_source(tagged)
    assert to_exact_iast_from_devanagari(tagged) == source
    assert recover_embedded_exact_source(tagged) == source


@pytest.mark.parametrize('source', SOURCES)
def test_exact_gujarati_metadata_roundtrip(source: str) -> None:
    tagged = to_gujarati_from_iast(
        source,
        IastToGujaratiOptions(embed_exact_source_metadata=True),
    )
    assert has_embedded_exact_source(tagged)
    assert to_exact_iast_from_gujarati(tagged) == source


def test_visible_tampering_invalidates_metadata() -> None:
    tagged = to_devanagari_from_iast(
        'Kṛṣṇa',
        IastToDevanagariOptions(embed_exact_source_metadata=True),
    )
    visible = strip_exact_source_metadata(tagged)
    tampered = 'X' + tagged[1:]
    assert visible == 'कृष्ण'
    assert not has_embedded_exact_source(tampered)


def test_metadata_tampering_invalidates_metadata() -> None:
    tagged = to_gujarati_from_iast(
        'Kṛṣṇa',
        IastToGujaratiOptions(embed_exact_source_metadata=True),
    )
    tampered = tagged[:-2] + chr(ord(tagged[-2]) + 1) + tagged[-1]
    assert not has_embedded_exact_source(tampered)


def test_envelope_json_roundtrip() -> None:
    result = to_plain_english('Kṛṣṇa ā́tman ḷa')
    encoded = json.dumps(result.to_json(), ensure_ascii=False)
    restored = TransliterationResult.from_json(json.loads(encoded))
    assert restored == result
    assert restored.restore_original() == 'Kṛṣṇa ā́tman ḷa'
