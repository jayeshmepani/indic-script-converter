from __future__ import annotations

from indic_script_converter.latn_iast_to_deva import (
    DevanagariRomanizationProfile,
    IastToDevanagariDigitPolicy,
    IastToDevanagariOmPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    to_devanagari_from_iast,
)
from indic_script_converter.tools.example_latn_iast import (
    transliteration_smoke_samples,
    vedic_round_trip_cases,
)


def main() -> None:
    print('----------------------------------------------------------------')
    print(' 1. DEVANAGARI TRANSLITERATOR SAMPLES')
    print('----------------------------------------------------------------')

    default_options = IastToDevanagariOptions(
        punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    )

    for source in transliteration_smoke_samples:
        result = to_devanagari_from_iast(source, default_options)
        print(f'"{source}" -> "{result}"')

    _run_option_tests()
    _run_profile_tests()
    _run_vedic_round_trip_tests()


def _run_option_tests() -> None:
    print('\n[Devanagari Option: Digits Policy (convertToScript)]')
    digit_options = IastToDevanagariOptions(
        digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    )
    digit_sample = '12345'
    print(f'  "{digit_sample}" -> "{to_devanagari_from_iast(digit_sample, options=digit_options)}"')

    print('\n[Devanagari Option: Danda Policy (indicDanda)]')
    danda_options = IastToDevanagariOptions(
        punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA,
    )
    punctuation_sample = 'End. Double end..'
    print(
        f'  "{punctuation_sample}" -> '
        f'"{to_devanagari_from_iast(punctuation_sample, options=danda_options)}"'
    )

    print('\n[Devanagari Option: OM Policy (useOmSign)]')
    om_options = IastToDevanagariOptions(
        om_policy=IastToDevanagariOmPolicy.USE_OM_SIGN,
    )
    om_sample = 'oṃ namaḥ śivāya'
    print(f'  "{om_sample}" -> "{to_devanagari_from_iast(om_sample, options=om_options)}"')


def _run_profile_tests() -> None:
    print('\n[Devanagari Profiles: strictIast / iso15919Core / extendedIndic]')
    strict = IastToDevanagariOptions(
        profile=DevanagariRomanizationProfile.STRICT_IAST,
    )
    iso = IastToDevanagariOptions(
        profile=DevanagariRomanizationProfile.ISO_15919_CORE,
    )
    extended = IastToDevanagariOptions(
        profile=DevanagariRomanizationProfile.EXTENDED_INDIC,
    )

    for source in ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']:
        print(
            f'  "{source}" (strictIast)    -> "{to_devanagari_from_iast(source, options=strict)}"'
        )
        print(f'  "{source}" (iso15919Core) -> "{to_devanagari_from_iast(source, options=iso)}"')
        print(
            f'  "{source}" (extendedIndic)-> "{to_devanagari_from_iast(source, options=extended)}"'
        )


def _run_vedic_round_trip_tests() -> None:
    print('\n================================================================')
    print(' VEDIC FIXTURES: IAST → Devanagari vs expected Devanagari')
    print('================================================================')

    options = IastToDevanagariOptions(
        punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    )

    passed = 0
    failed = 0

    for iast, expected, label in vedic_round_trip_cases:
        actual = to_devanagari_from_iast(iast, options=options)
        if actual == expected:
            passed += 1
            print(f'  ✓ {label}')
            continue

        failed += 1
        print(f'  ✗ {label}')
        print(f'    DIFF: {_rune_diff(actual, expected)}')
        print(f'    GOT: {actual}')
        print(f'    EXP: {expected}')

    print(
        f'\n  Result: {passed} passed, {failed} failed out of '
        f'{len(vedic_round_trip_cases)} fixtures.'
    )

    if failed > 0:
        raise ValueError(f'{failed} Vedic fixture(s) failed.')


def _rune_diff(actual: str, expected: str) -> str:
    actual_runes = [ord(ch) for ch in actual]
    expected_runes = [ord(ch) for ch in expected]
    length = max(len(actual_runes), len(expected_runes))
    output = []

    for index in range(length):
        actual_rune = actual_runes[index] if index < len(actual_runes) else None
        expected_rune = expected_runes[index] if index < len(expected_runes) else None
        if actual_rune == expected_rune:
            continue

        output.append(f'[{_format_rune(actual_rune)}|{_format_rune(expected_rune)}@{index}]')

    return ' '.join(output)


def _format_rune(rune: int | None) -> str:
    if rune is None:
        return 'END'
    return f'U+{hex(rune)[2:].upper().zfill(4)}'


if __name__ == '__main__':
    main()
