from lipimala import (
    to_canonical_devanagari_from_gujarati_list,
    to_canonical_gujarati_from_devanagari_list,
    to_devanagari_from_iast_list,
    to_devanagari_list,
    to_gujarati_from_iast_list,
    to_plain_english_from_iast_list,
)


def test_bulk_list_converters():
    items = ['Kṛṣṇa', 'Rāma', 'jñāna']

    deva_list = to_devanagari_from_iast_list(items)
    assert deva_list == ['कृष्ण', 'राम', 'ज्ञान']

    gujr_list = to_gujarati_from_iast_list(items)
    assert gujr_list == ['કૃષ્ણ', 'રામ', 'જ્ઞાન']

    plain_list = to_plain_english_from_iast_list(items)
    assert plain_list == ['Krishna', 'Ram', 'gyan']

    gujr_direct = to_canonical_gujarati_from_devanagari_list(deva_list)
    assert gujr_direct == ['કૃષ્ણ', 'રામ', 'જ્ઞાન']

    deva_direct = to_canonical_devanagari_from_gujarati_list(gujr_list)
    assert deva_direct == ['कृष्ण', 'राम', 'ज्ञान']

    env_list = to_devanagari_list(items)
    assert len(env_list) == 3
    assert env_list[0].rendered == 'कृष्ण'
    assert env_list[1].rendered == 'राम'
