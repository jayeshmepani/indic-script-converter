from __future__ import annotations

from indic_script_converter.latn_iast_transcription import (
    FinalAPolicy,
    IastPlainEnglishOptions,
    JnaPolicy,
    PlainEnglishRomanizationProfile,
    to_plain_english_from_iast,
)
from indic_script_converter.tools.example_latn_iast import transliteration_smoke_samples


def main() -> None:
    print('----------------------------------------------------------------')
    print(' 3. PLAIN ENGLISH TRANSLITERATOR SAMPLES (DEFAULT OPTIONS)')
    print('----------------------------------------------------------------')

    for source in transliteration_smoke_samples:
        print(f'"{source}" -> "{to_plain_english_from_iast(source)}"')

    _run_policy_tests()
    _run_profile_tests()


def _run_policy_tests() -> None:
    print('\n[Plain English Option: Keep Final "a" (scholarly)]')
    keep_a = IastPlainEnglishOptions(final_a=FinalAPolicy.KEEP)
    for source in ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']:
        print(f'  "{source}" -> "{to_plain_english_from_iast(source, options=keep_a)}"')

    print('\n[Plain English Option: Always Drop Final "a" (Hindi-style)]')
    drop_a = IastPlainEnglishOptions(final_a=FinalAPolicy.DROP)
    for source in ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']:
        print(f'  "{source}" -> "{to_plain_english_from_iast(source, options=drop_a)}"')

    print('\n[Plain English Option: jñ as "jna"]')
    jna = IastPlainEnglishOptions(jna=JnaPolicy.JNA)
    for source in ['jñāna', 'yajña']:
        print(f'  "{source}" -> "{to_plain_english_from_iast(source, options=jna)}"')


def _run_profile_tests() -> None:
    print('\n[Plain English Profile: extendedIndic]')
    extended = IastPlainEnglishOptions(
        profile=PlainEnglishRomanizationProfile.EXTENDED_INDIC,
    )
    for source in ['xaṇḍa', 'xaiva', 'qaum']:
        print(f'  "{source}" -> "{to_plain_english_from_iast(source, options=extended)}"')

    print('\n[Plain English Profile: Hunterian (explicitly lossy view)]')
    hunterian = IastPlainEnglishOptions(
        profile=PlainEnglishRomanizationProfile.HUNTERIAN,
    )
    for source in [
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
    ]:
        print(f'  "{source}" -> "{to_plain_english_from_iast(source, options=hunterian)}"')

    print('\n[Plain English Profile: strictIast blocks Hunterian-only rules]')
    strict = IastPlainEnglishOptions(
        profile=PlainEnglishRomanizationProfile.STRICT_IAST,
    )
    for source in ['Sarasvatī', 'Rāmacandra', 'duḥkha']:
        print(f'  "{source}" -> "{to_plain_english_from_iast(source, options=strict)}"')


if __name__ == '__main__':
    main()
