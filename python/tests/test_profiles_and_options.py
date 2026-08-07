from __future__ import annotations

from indic_script_converter import (
    DevanagariRomanizationProfile,
    FinalAPolicy,
    GujaratiRomanizationProfile,
    IastPlainEnglishOptions,
    IastToDevanagariDigitPolicy,
    IastToDevanagariOmPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    IastToGujaratiDigitPolicy,
    IastToGujaratiOmPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    JnaPolicy,
    PlainEnglishRomanizationProfile,
    to_devanagari_from_iast,
    to_gujarati_from_iast,
    to_plain_english_from_iast,
)
from indic_script_converter.tools.example_latn_iast import vedic_round_trip_cases


def test_default_profiles_are_extended_indic() -> None:
    assert IastToDevanagariOptions().profile is DevanagariRomanizationProfile.EXTENDED_INDIC
    assert IastToGujaratiOptions().profile is GujaratiRomanizationProfile.EXTENDED_INDIC
    assert IastPlainEnglishOptions().profile is PlainEnglishRomanizationProfile.EXTENDED_INDIC


def test_devanagari_profiles_match_dart() -> None:
    samples = ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']
    expected = {
        DevanagariRomanizationProfile.STRICT_IAST: ['ऋअक', 'ऋहण', 'ऌअ', 'लऋका', 'xअण्ड'],
        DevanagariRomanizationProfile.ISO_15919_CORE: ['ड़क', 'ढ़ण', 'ळ', 'लड़का', 'ख़ण्ड'],
        DevanagariRomanizationProfile.EXTENDED_INDIC: ['ड़क', 'ढ़ण', 'ळ', 'लड़का', 'ख़ण्ड'],
    }
    for profile, values in expected.items():
        options = IastToDevanagariOptions(profile=profile)
        assert [to_devanagari_from_iast(s, options) for s in samples] == values


def test_gujarati_profiles_match_dart() -> None:
    samples = ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']
    expected = {
        GujaratiRomanizationProfile.STRICT_IAST: ['ઋઅક', 'ઋહણ', 'ઌઅ', 'લઋકા', 'xઅણ્ડ'],
        GujaratiRomanizationProfile.ISO_15919_CORE: ['ડ઼ક', 'ઢ઼ણ', 'ળ', 'લડ઼કા', 'ખ઼ણ્ડ'],
        GujaratiRomanizationProfile.EXTENDED_INDIC: ['ડ઼ક', 'ઢ઼ણ', 'ળ', 'લડ઼કા', 'ખ઼ણ્ડ'],
    }
    for profile, values in expected.items():
        options = IastToGujaratiOptions(profile=profile)
        assert [to_gujarati_from_iast(s, options) for s in samples] == values


def test_digits_danda_and_om_options() -> None:
    assert (
        to_devanagari_from_iast(
            '12345',
            IastToDevanagariOptions(digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT),
        )
        == '१२३४५'
    )
    assert (
        to_gujarati_from_iast(
            '12345', IastToGujaratiOptions(digit_policy=IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT)
        )
        == '૧૨૩૪૫'
    )
    assert (
        to_devanagari_from_iast(
            'End. Double end..',
            IastToDevanagariOptions(
                punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA
            ),
        )
        == 'एन्द्। दोउब्ले एन्द्।।'
    )
    assert (
        to_gujarati_from_iast(
            'End. Double end..',
            IastToGujaratiOptions(punctuation_policy=IastToGujaratiPunctuationPolicy.INDIC_DANDA),
        )
        == 'એન્દ્। દોઉબ્લે એન્દ્।।'
    )
    assert (
        to_devanagari_from_iast(
            'oṃ namaḥ śivāya',
            IastToDevanagariOptions(om_policy=IastToDevanagariOmPolicy.USE_OM_SIGN),
        )
        == 'ॐ नमः शिवाय'
    )
    assert (
        to_gujarati_from_iast(
            'oṃ namaḥ śivāya', IastToGujaratiOptions(om_policy=IastToGujaratiOmPolicy.USE_OM_SIGN)
        )
        == 'ૐ નમઃ શિવાય'
    )


def test_all_22_vedic_fixtures_match_dart() -> None:
    options = IastToDevanagariOptions(
        punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    )
    for iast, expected, label in vedic_round_trip_cases:
        assert to_devanagari_from_iast(iast, options) == expected, label


def test_plain_english_policy_and_hunterian_samples() -> None:
    keep = IastPlainEnglishOptions(final_a=FinalAPolicy.KEEP)
    drop = IastPlainEnglishOptions(final_a=FinalAPolicy.DROP)
    jna = IastPlainEnglishOptions(jna=JnaPolicy.JNA)
    hunterian = IastPlainEnglishOptions(profile=PlainEnglishRomanizationProfile.HUNTERIAN)

    assert [
        to_plain_english_from_iast(s, keep) for s in ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']
    ] == ['Rama', 'vrata', 'Krishna', 'Lakshmana', 'yatra']
    assert [
        to_plain_english_from_iast(s, drop) for s in ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']
    ] == ['Ram', 'vrat', 'Krishn', 'Lakshman', 'yatra']
    assert [to_plain_english_from_iast(s, jna) for s in ['jñāna', 'yajña']] == ['jnan', 'yajn']
    samples = [
        'Rāma',
        'Kṛṣṇa',
        'Lakṣmaṇa',
        'laṛkā',
        'Rāmacandra',
        'Gorakhapura',
        'Sarasvatī',
        'Īśvara',
        'pañcāṅga',
        'duḥkha',
        'Devadatta',
        'Jaideva',
        'Kalyāṇapura',
        'Nārāyaṇapura',
        'Hariprasāda',
        'Kṛṣṇadāsa',
    ]
    expected = [
        'Ram',
        'Krishna',
        'Lakshman',
        'larka',
        'Ramachandra',
        'Gorakhapur',
        'Saraswati',
        'Ishwar',
        'panchang',
        'dukh',
        'Devadatt',
        'Jaidev',
        'Kalyanapur',
        'Narayanapur',
        'Hariprasad',
        'Krishnadas',
    ]
    assert [to_plain_english_from_iast(s, hunterian) for s in samples] == expected
