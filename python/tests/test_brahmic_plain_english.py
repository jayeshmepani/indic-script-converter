from __future__ import annotations

from lipimala import (
    BrahmicLanguage,
    BrahmicPlainEnglishOptions,
    BrahmicSchwaDeletionPolicy,
    BrahmicVowelLengthPolicy,
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    TerminalAnusvaraPolicy,
    to_canonical_iast_from_gujarati,
    to_hunterian_from_devanagari,
    to_hunterian_from_gujarati,
    to_hunterian_from_gujarati_list,
    to_hunterian_from_gujarati_result,
    to_plain_english_from_devanagari,
    to_plain_english_from_gujarati,
    to_plain_english_from_gujarati_list,
    to_plain_english_from_gujarati_result,
    to_plain_english_from_iast,
)


def test_gujarati_direct_plain_english_is_source_aware() -> None:
    cases = {
        'આજ': 'aaj',
        'મારે': 'maare',
        'ઓરડે': 'orade',
        'નટવર': 'natvar',
        'સમાચાર': 'samaachaar',
        'ધર્મકુમાર': 'dharmakumaar',
        'ગુલાબના': 'gulaabnaa',
        'હીરની': 'heernee',
        'અમૂલ્ય': 'amoolya',
        'ધન્ય': 'dhanya',
        'રૂમાલ': 'roomaal',
        'શું': 'shun',
        'ક્યાં': 'kyaan',
    }
    for source, expected in cases.items():
        assert to_plain_english_from_gujarati(source) == expected


def test_gujarati_direct_hunterian_does_not_apply_hindi_w_rule() -> None:
    cases = {
        'નટવર': 'natvar',
        'સમાચાર': 'samachar',
        'ધર્મકુમાર': 'dharmakumar',
        'સર્વે': 'sarve',
        'શોભતા': 'shobhta',
        'રેશમી': 'reshmi',
        'સૂંથણલી': 'sunthanli',
    }
    for source, expected in cases.items():
        assert to_hunterian_from_gujarati(source) == expected

    assert to_hunterian_from_gujarati('સર્વે swan twin') == 'sarve swan twin'
    assert to_hunterian_from_gujarati('દુઃખ') == 'dukh'


def test_direct_brahmic_transcription_preserves_preexisting_latin_spans() -> None:
    latin = 'cat chocolate camera JavaScript café Kṛṣṇa Kr̥ṣṇa John’s ‘quote’'
    assert to_plain_english_from_gujarati(f'ગુજરાત {latin}') == f'gujaraat {latin}'
    assert to_hunterian_from_gujarati(f'ગુજરાત {latin}') == f'gujarat {latin}'
    assert to_plain_english_from_devanagari(f'भारत {latin}') == f'bhaarat {latin}'
    assert to_hunterian_from_devanagari(f'भारत {latin}') == f'bharat {latin}'


def test_devanagari_direct_hindi_schwa_and_sanskrit_override() -> None:
    assert to_plain_english_from_devanagari('कानपुर') == 'kaanpur'
    assert to_plain_english_from_devanagari('सरकार') == 'sarkaar'
    assert to_plain_english_from_devanagari('अहमद') == 'ahmad'
    assert to_plain_english_from_devanagari('धर्म') == 'dharm'
    assert to_plain_english_from_gujarati('ધર્મ') == 'dharm'
    assert to_hunterian_from_devanagari('कानपुर') == 'kanpur'
    assert to_hunterian_from_devanagari('सरकार') == 'sarkar'

    sanskrit = BrahmicPlainEnglishOptions(language=BrahmicLanguage.SANSKRIT)
    assert to_plain_english_from_devanagari('कानपुर', sanskrit) == 'kaanapura'
    assert to_plain_english_from_devanagari('धर्म', sanskrit) == 'dharma'


def test_brahmic_direct_options() -> None:
    assert (
        to_plain_english_from_gujarati(
            'નટવર',
            BrahmicPlainEnglishOptions(schwa_deletion=BrahmicSchwaDeletionPolicy.NONE),
        )
        == 'natavara'
    )
    assert (
        to_plain_english_from_gujarati(
            'આજ',
            BrahmicPlainEnglishOptions(vowel_length=BrahmicVowelLengthPolicy.COLLAPSE),
        )
        == 'aj'
    )
    assert (
        to_plain_english_from_gujarati(
            'શું',
            BrahmicPlainEnglishOptions(terminal_anusvara=TerminalAnusvaraPolicy.DROP),
        )
        == 'shu'
    )


def test_bulk_direct_apis() -> None:
    assert to_plain_english_from_gujarati_list(['આજ', 'નટવર']) == ['aaj', 'natvar']
    assert to_hunterian_from_gujarati_list(['સમાચાર', 'સર્વે']) == ['samachar', 'sarve']


def test_canonical_and_legacy_iast_hunterian_stay_unchanged() -> None:
    assert to_canonical_iast_from_gujarati('સમાચાર') == 'samācāra'
    hunterian = IastPlainEnglishOptions(profile=PlainEnglishRomanizationProfile.HUNTERIAN)
    assert to_plain_english_from_iast('Sarasvatī', hunterian) == 'Saraswati'
    assert to_plain_english_from_iast('Rāma', hunterian) == 'Ram'


def test_direct_result_envelopes_retain_exact_brahmic_source() -> None:
    plain = to_plain_english_from_gujarati_result('આજ મારે')
    assert plain.original == 'આજ મારે'
    assert plain.restore_original() == 'આજ મારે'
    assert plain.rendered == 'aaj maare'
    assert plain.profile.value == 'plainEnglish'

    hunterian = to_hunterian_from_gujarati_result('સમાચાર')
    assert hunterian.restore_original() == 'સમાચાર'
    assert hunterian.rendered == 'samachar'
    assert hunterian.profile.value == 'hunterian'
