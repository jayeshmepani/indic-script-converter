from lipimala import (
    to_canonical_devanagari_from_gujarati_list,
    to_canonical_gujarati_from_devanagari_list,
    to_canonical_iast_from_devanagari_list,
    to_canonical_iast_from_gujarati_list,
    to_devanagari_from_iast_list,
    to_devanagari_list,
    to_gujarati_from_iast_list,
    to_gujarati_list,
    to_plain_english_from_iast_list,
    to_plain_english_list,
)


def test_bulk_list_converters_all_directions():
    iast_items = ['Kṛṣṇa', 'Rāma', 'jñāna']

    # 1. Latin (IAST) → Devanagari / Gujarati / Plain English
    deva_list = to_devanagari_from_iast_list(iast_items)
    assert deva_list == ['कृष्ण', 'राम', 'ज्ञान']

    gujr_list = to_gujarati_from_iast_list(iast_items)
    assert gujr_list == ['કૃષ્ણ', 'રામ', 'જ્ઞાન']

    plain_list = to_plain_english_from_iast_list(iast_items)
    assert plain_list == ['Krishna', 'Ram', 'gyan']

    # 2. Brahmic → Latin IAST
    iast_from_deva = to_canonical_iast_from_devanagari_list(deva_list)
    assert iast_from_deva == ['kṛṣṇa', 'rāma', 'jñāna']

    iast_from_gujr = to_canonical_iast_from_gujarati_list(gujr_list)
    assert iast_from_gujr == ['kṛṣṇa', 'rāma', 'jñāna']

    # 3. Direct Devanagari ↔ Gujarati
    gujr_direct = to_canonical_gujarati_from_devanagari_list(deva_list)
    assert gujr_direct == ['કૃષ્ણ', 'રામ', 'જ્ઞાન']

    deva_direct = to_canonical_devanagari_from_gujarati_list(gujr_list)
    assert deva_direct == ['कृष्ण', 'राम', 'ज्ञान']

    # 4. Result Envelopes
    env_deva = to_devanagari_list(iast_items)
    assert len(env_deva) == 3
    assert env_deva[0].rendered == 'कृष्ण'
    assert env_deva[1].rendered == 'राम'

    env_gujr = to_gujarati_list(iast_items)
    assert len(env_gujr) == 3
    assert env_gujr[0].rendered == 'કૃષ્ણ'

    env_plain = to_plain_english_list(iast_items)
    assert len(env_plain) == 3
    assert env_plain[0].rendered == 'Krishna'


def test_bulk_list_converters_custom_options():
    from lipimala import (
        FinalAPolicy,
        IastPlainEnglishOptions,
        IastToDevanagariDigitPolicy,
        IastToDevanagariOptions,
    )

    items = ['Rāma 123', 'jñāna']

    deva_digits = to_devanagari_from_iast_list(
        items,
        options=IastToDevanagariOptions(digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT),
    )
    assert deva_digits == ['राम १२३', 'ज्ञान']

    plain_keep_final_a = to_plain_english_from_iast_list(
        items,
        options=IastPlainEnglishOptions(final_a=FinalAPolicy.KEEP),
    )
    assert plain_keep_final_a == ['Rama 123', 'gyana']
