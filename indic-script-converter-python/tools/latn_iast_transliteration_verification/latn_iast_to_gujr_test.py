from __future__ import annotations

from indic_script_converter.latn_iast_to_gujr import (
    GujaratiRomanizationProfile,
    IastToGujaratiDigitPolicy,
    IastToGujaratiOmPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    to_gujarati_from_iast,
)
from indic_script_converter.tools.example_latn_iast import transliteration_smoke_samples


def main() -> None:
    print('----------------------------------------------------------------')
    print(' 2. GUJARATI TRANSLITERATOR SAMPLES')
    print('----------------------------------------------------------------')

    default_options = IastToGujaratiOptions(
        punctuation_policy=IastToGujaratiPunctuationPolicy.INDIC_DANDA,
        digit_policy=IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT,
    )

    for source in transliteration_smoke_samples:
        result = to_gujarati_from_iast(source, default_options)
        print(f'"{source}" -> "{result}"')

    _run_option_tests()
    _run_profile_tests()


def _run_option_tests() -> None:
    print('\n[Gujarati Option: Digits Policy (convertToScript)]')
    digit_options = IastToGujaratiOptions(
        digit_policy=IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT,
    )
    digit_sample = '12345'
    print(f'  "{digit_sample}" -> "{to_gujarati_from_iast(digit_sample, options=digit_options)}"')

    print('\n[Gujarati Option: Danda Policy (indicDanda)]')
    danda_options = IastToGujaratiOptions(
        punctuation_policy=IastToGujaratiPunctuationPolicy.INDIC_DANDA,
    )
    punctuation_sample = 'End. Double end..'
    print(
        f'  "{punctuation_sample}" -> '
        f'"{to_gujarati_from_iast(punctuation_sample, options=danda_options)}"'
    )

    print('\n[Gujarati Option: OM Policy (useOmSign)]')
    om_options = IastToGujaratiOptions(
        om_policy=IastToGujaratiOmPolicy.USE_OM_SIGN,
    )
    om_sample = 'oṃ namaḥ śivāya'
    print(f'  "{om_sample}" -> "{to_gujarati_from_iast(om_sample, options=om_options)}"')


def _run_profile_tests() -> None:
    print('\n[Gujarati Profiles: strictIast / iso15919Core / extendedIndic]')
    strict = IastToGujaratiOptions(
        profile=GujaratiRomanizationProfile.STRICT_IAST,
    )
    iso = IastToGujaratiOptions(
        profile=GujaratiRomanizationProfile.ISO_15919_CORE,
    )
    extended = IastToGujaratiOptions(
        profile=GujaratiRomanizationProfile.EXTENDED_INDIC,
    )

    for source in ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']:
        print(f'  "{source}" (strictIast)    -> "{to_gujarati_from_iast(source, options=strict)}"')
        print(f'  "{source}" (iso15919Core) -> "{to_gujarati_from_iast(source, options=iso)}"')
        print(f'  "{source}" (extendedIndic)-> "{to_gujarati_from_iast(source, options=extended)}"')


if __name__ == '__main__':
    main()
