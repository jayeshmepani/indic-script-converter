from __future__ import annotations

from indic_script_converter.deva_gujr_converter import (
    IndicScriptConversionOptions,
    to_canonical_devanagari_from_gujarati,
    to_canonical_gujarati_from_devanagari,
    to_devanagari_from_gujarati,
    to_exact_devanagari_from_gujarati,
    to_exact_gujarati_from_devanagari,
    to_gujarati_from_devanagari,
)
from indic_script_converter.latn_iast_to_gujr import (
    IastToGujaratiOptions,
    to_gujarati_from_iast,
)
from indic_script_converter.tools.example_deva import devanagari_smoke_samples
from indic_script_converter.tools.example_gujr import gujarati_smoke_samples
import pytest


def test_core_canonical_script_conversion() -> None:
    assert to_canonical_gujarati_from_devanagari('कृष्ण') == 'કૃષ્ણ'
    assert to_canonical_devanagari_from_gujarati('કૃષ્ણ') == 'कृष्ण'
    assert to_canonical_gujarati_from_devanagari('१२३') == '૧૨૩'
    assert to_canonical_devanagari_from_gujarati('૧૨૩') == '१२३'
    assert to_canonical_gujarati_from_devanagari('वसोः॑') == 'વસોઃ॑'
    assert to_canonical_devanagari_from_gujarati('વસોઃ॑') == 'वसोः॑'


def test_nukta_and_extended_mappings_are_whole_tokens() -> None:
    assert to_canonical_gujarati_from_devanagari('क़ ख़ ग़ ज़ फ़') == 'ક઼ ખ઼ ગ઼ જ઼ ફ઼'
    assert to_canonical_devanagari_from_gujarati('ક઼ ખ઼ ગ઼ જ઼ ફ઼') == 'क़ ख़ ग़ ज़ फ़'
    assert to_canonical_gujarati_from_devanagari('ॿक्ति') == 'બ઼ક્તિ'
    assert to_canonical_devanagari_from_gujarati('બ઼ક્તિ') == 'ॿक्ति'
    assert to_canonical_gujarati_from_devanagari('ॹ') == 'ૹ'
    assert to_canonical_devanagari_from_gujarati('ૹ') == 'ॹ'


def test_exact_metadata_round_trips_devanagari_corpus() -> None:
    options = IndicScriptConversionOptions(embed_exact_source_metadata=True)
    for source in devanagari_smoke_samples:
        tagged = to_canonical_gujarati_from_devanagari(source, options)
        assert to_exact_devanagari_from_gujarati(tagged) == source
        assert to_devanagari_from_gujarati(tagged) == source


def test_exact_metadata_round_trips_gujarati_corpus() -> None:
    options = IndicScriptConversionOptions(embed_exact_source_metadata=True)
    for source in gujarati_smoke_samples:
        tagged = to_canonical_devanagari_from_gujarati(source, options)
        assert to_exact_gujarati_from_devanagari(tagged) == source
        assert to_gujarati_from_devanagari(tagged) == source


def test_visible_tampering_invalidates_metadata() -> None:
    options = IndicScriptConversionOptions(embed_exact_source_metadata=True)
    tagged = to_canonical_gujarati_from_devanagari('कृष्ण', options)
    tampered = tagged.replace('કૃષ્ણ', 'રામ')
    with pytest.raises(ValueError):
        to_exact_devanagari_from_gujarati(tampered)


def test_typed_metadata_rejects_unrelated_latin_source_trailer() -> None:
    tagged_from_latin = to_gujarati_from_iast(
        'Kṛṣṇa',
        IastToGujaratiOptions(embed_exact_source_metadata=True),
    )
    with pytest.raises(ValueError):
        to_exact_devanagari_from_gujarati(tagged_from_latin)
