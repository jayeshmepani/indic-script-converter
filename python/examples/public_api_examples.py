#!/usr/bin/env python3
"""Comprehensive public-API examples for lipimala (Python).

Covers envelope APIs, string converters, option permutations, reverse IAST,
direct Devanagari ↔ Gujarati, exact metadata recovery, and result envelopes.

Run from monorepo:
  pip install -e ../
  python public_api_examples.py
"""

from __future__ import annotations

from lipimala import (
    DevanagariRomanizationProfile,
    FinalAPolicy,
    GlottalStopPolicy,
    GujaratiRomanizationProfile,
    IastPlainEnglishOptions,
    IastToDevanagariAmbiguousLPolicy,
    IastToDevanagariDigitPolicy,
    IastToDevanagariOmPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    IastToDevanagariUnknownLatinPolicy,
    IastToGujaratiDigitPolicy,
    IastToGujaratiOmPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    JnaPolicy,
    NyaPolicy,
    PlainEnglishRomanizationProfile,
    ScriptToIastOptions,
    TransliterationResult,
    UnicodeNormalizationForm,
    embed_exact_source_metadata,
    has_embedded_exact_source,
    is_encoded_vedic_mark,
    is_unicode_combining_mark,
    normalize_unicode,
    recover_embedded_exact_source,
    strip_exact_source_metadata,
    to_canonical_iast_from_devanagari,
    to_canonical_iast_from_gujarati,
    to_devanagari,
    to_devanagari_from_iast,
    to_exact_iast_from_devanagari,
    to_exact_iast_from_gujarati,
    to_gujarati,
    to_gujarati_from_iast,
    to_iast_from_devanagari,
    to_iast_from_gujarati,
    to_plain_english,
    to_plain_english_from_iast,
    try_decode_exact_source_metadata,
)
from lipimala.deva_gujr_converter import (
    IndicScriptConversionOptions,
    IndicScriptDigitPolicy,
    IndicScriptUnknownPolicy,
    has_exact_devanagari_source_metadata,
    has_exact_gujarati_source_metadata,
    to_canonical_devanagari_from_gujarati,
    to_canonical_gujarati_from_devanagari,
    to_devanagari_from_gujarati,
    to_exact_devanagari_from_gujarati,
    to_exact_gujarati_from_devanagari,
    to_gujarati_from_devanagari,
    visible_without_exact_source_metadata,
)

IAST = 'Kṛṣṇa ā́tman'
VEDIC = 'vásōḥ'
DIGITS = 'Rāma 123'
PUNCT = 'namaḥ. śivāya.'
OM = 'oṃ'
AMBIG_L = 'kḷpta'
PLAIN = 'jñāna Rāma ñāna'
DEVA = 'कृष्ण'
GUJR = 'કૃષ્ણ'


def banner(title: str) -> None:
    print()
    print('=' * 72)
    print(title)
    print('=' * 72)


def show(label: str, value: object) -> None:
    print(f'  {label}: {value!r}' if not isinstance(value, str) else f'  {label}: {value}')


# ---------------------------------------------------------------------------
# 1. Envelope APIs → TransliterationResult
# ---------------------------------------------------------------------------
def examples_envelope() -> None:
    banner('1. Envelope APIs (TransliterationResult)')

    de = to_devanagari(IAST)
    gu = to_gujarati(IAST)
    en = to_plain_english(IAST)

    for name, result in [('to_devanagari', de), ('to_gujarati', gu), ('to_plain_english', en)]:
        print(f'\n[{name}]')
        show('rendered', result.rendered)
        show('profile', result.profile.value)
        show('normalized_input', result.normalized_input)
        show('restore_original()', result.restore_original())
        show('rendering_is_injective', result.rendering_is_injective)
        show('has_errors', result.has_errors)
        show('issues[0].code', result.issues[0].code if result.issues else None)

    # JSON envelope round-trip
    json_text = de.to_json_text()
    restored = TransliterationResult.from_json_text(json_text)
    show('JSON schema', restored.to_json()['schema'])
    show('from_json_text restore', restored.restore_original())

    # Normalization form permutations
    print('\n[normalization permutations]')
    for inp in (
        UnicodeNormalizationForm.NFD,
        UnicodeNormalizationForm.NFC,
        UnicodeNormalizationForm.PRESERVE,
    ):
        for out in (UnicodeNormalizationForm.NFC, UnicodeNormalizationForm.NFD):
            r = to_devanagari(IAST, input_normalization=inp, output_normalization=out)
            show(f'in={inp.value} out={out.value}', r.rendered)


# ---------------------------------------------------------------------------
# 2. IAST → Devanagari string API + option permutations
# ---------------------------------------------------------------------------
def examples_iast_to_deva() -> None:
    banner('2. IAST → Devanagari (string) + option permutations')

    show('default', to_devanagari_from_iast(IAST))

    for profile in DevanagariRomanizationProfile:
        out = to_devanagari_from_iast(IAST, IastToDevanagariOptions(profile=profile))
        show(f'profile={profile.value}', out)

    for dig in IastToDevanagariDigitPolicy:
        out = to_devanagari_from_iast(DIGITS, IastToDevanagariOptions(digit_policy=dig))
        show(f'digit_policy={dig.value}', out)

    for punc in IastToDevanagariPunctuationPolicy:
        out = to_devanagari_from_iast(PUNCT, IastToDevanagariOptions(punctuation_policy=punc))
        show(f'punctuation_policy={punc.value}', out)

    for om in IastToDevanagariOmPolicy:
        out = to_devanagari_from_iast(OM, IastToDevanagariOptions(om_policy=om))
        show(f'om_policy={om.value}', out)

    for amb in IastToDevanagariAmbiguousLPolicy:
        out = to_devanagari_from_iast(AMBIG_L, IastToDevanagariOptions(ambiguous_l_policy=amb))
        show(f'ambiguous_l_policy={amb.value}', out)

    for unk in IastToDevanagariUnknownLatinPolicy:
        try:
            out = to_devanagari_from_iast(
                'hello', IastToDevanagariOptions(unknown_latin_policy=unk)
            )
            show(f'unknown_latin_policy={unk.value}', out)
        except Exception as exc:
            show(f'unknown_latin_policy={unk.value}', f'RAISED {type(exc).__name__}: {exc}')

    show(
        'accept_ascii_long_vowels=True on aa',
        to_devanagari_from_iast('aa', IastToDevanagariOptions(accept_ascii_long_vowels=True)),
    )
    show(
        'collapse_whitespace=True',
        to_devanagari_from_iast('Kṛṣṇa   ā́tman', IastToDevanagariOptions(collapse_whitespace=True)),
    )
    show(
        'preserve_vedic_accent_marks=False',
        to_devanagari_from_iast(VEDIC, IastToDevanagariOptions(preserve_vedic_accent_marks=False)),
    )

    # Combined permutation example
    opts = IastToDevanagariOptions(
        profile=DevanagariRomanizationProfile.ISO_15919_CORE,
        digit_policy=IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
        punctuation_policy=IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        om_policy=IastToDevanagariOmPolicy.USE_OM_SIGN,
        accept_ascii_long_vowels=True,
        collapse_whitespace=True,
        embed_exact_source_metadata=True,
    )
    tagged = to_devanagari_from_iast('Om 12. Rāma', opts)
    show('combined options + metadata', strip_exact_source_metadata(tagged))
    show('has metadata', has_embedded_exact_source(tagged))
    show('exact reverse', to_exact_iast_from_devanagari(tagged))


# ---------------------------------------------------------------------------
# 3. IAST → Gujarati
# ---------------------------------------------------------------------------
def examples_iast_to_gujr() -> None:
    banner('3. IAST → Gujarati (string) + option permutations')

    show('default', to_gujarati_from_iast(IAST))

    for profile in GujaratiRomanizationProfile:
        show(
            f'profile={profile.value}',
            to_gujarati_from_iast(IAST, IastToGujaratiOptions(profile=profile)),
        )

    for dig in IastToGujaratiDigitPolicy:
        show(
            f'digit_policy={dig.value}',
            to_gujarati_from_iast(DIGITS, IastToGujaratiOptions(digit_policy=dig)),
        )

    for punc in IastToGujaratiPunctuationPolicy:
        show(
            f'punctuation_policy={punc.value}',
            to_gujarati_from_iast(PUNCT, IastToGujaratiOptions(punctuation_policy=punc)),
        )

    for om in IastToGujaratiOmPolicy:
        show(
            f'om_policy={om.value}', to_gujarati_from_iast(OM, IastToGujaratiOptions(om_policy=om))
        )

    tagged = to_gujarati_from_iast(
        IAST,
        IastToGujaratiOptions(embed_exact_source_metadata=True),
    )
    show('exact reverse from Gujr', to_exact_iast_from_gujarati(tagged))


# ---------------------------------------------------------------------------
# 4. IAST → plain English / Hunterian
# ---------------------------------------------------------------------------
def examples_plain_english() -> None:
    banner('4. IAST → plain English / Hunterian')

    show('default', to_plain_english_from_iast(PLAIN))

    for profile in PlainEnglishRomanizationProfile:
        show(
            f'profile={profile.value}',
            to_plain_english_from_iast(PLAIN, IastPlainEnglishOptions(profile=profile)),
        )

    for final_a in FinalAPolicy:
        show(
            f'final_a={final_a.value}',
            to_plain_english_from_iast('Rāma', IastPlainEnglishOptions(final_a=final_a)),
        )

    for jna in JnaPolicy:
        show(
            f'jna={jna.value}',
            to_plain_english_from_iast('jñāna', IastPlainEnglishOptions(jna=jna)),
        )

    for nya in NyaPolicy:
        show(
            f'nya={nya.value}',
            to_plain_english_from_iast('ñāna', IastPlainEnglishOptions(nya=nya)),
        )

    for gl in GlottalStopPolicy:
        show(
            f'glottal_stop={gl.value}',
            to_plain_english_from_iast('aʔa', IastPlainEnglishOptions(glottal_stop=gl)),
        )

    show(
        'convert_c_to_ch=False',
        to_plain_english_from_iast('ca', IastPlainEnglishOptions(convert_c_to_ch=False)),
    )
    show(
        'assimilate_anusvara=False',
        to_plain_english_from_iast('saṃskṛta', IastPlainEnglishOptions(assimilate_anusvara=False)),
    )
    show(
        'hunterian envelope',
        to_plain_english(
            PLAIN,
            IastPlainEnglishOptions(profile=PlainEnglishRomanizationProfile.HUNTERIAN),
        ).rendered,
    )


# ---------------------------------------------------------------------------
# 5. Reverse: Brahmic → IAST
# ---------------------------------------------------------------------------
def examples_reverse() -> None:
    banner('5. Reverse Brahmic → IAST (canonical / smart / exact)')

    show('canonical Deva→IAST', to_canonical_iast_from_devanagari(DEVA))
    show('canonical Gujr→IAST', to_canonical_iast_from_gujarati(GUJR))
    show('smart Deva→IAST (no trailer)', to_iast_from_devanagari(DEVA))
    show('smart Gujr→IAST (no trailer)', to_iast_from_gujarati(GUJR))

    tagged_de = to_devanagari_from_iast(
        'Kṛṣṇa',
        IastToDevanagariOptions(embed_exact_source_metadata=True),
    )
    tagged_gu = to_gujarati_from_iast(
        'Kṛṣṇa',
        IastToGujaratiOptions(embed_exact_source_metadata=True),
    )
    show('exact Deva→IAST', to_exact_iast_from_devanagari(tagged_de))
    show('exact Gujr→IAST', to_exact_iast_from_gujarati(tagged_gu))
    show('smart with trailer (prefers exact)', to_iast_from_devanagari(tagged_de))

    show(
        'ScriptToIastOptions preserve_unmapped=False path',
        to_canonical_iast_from_devanagari(
            DEVA + '!',
            ScriptToIastOptions(preserve_unmapped=True),
        ),
    )


# ---------------------------------------------------------------------------
# 6. Direct Devanagari ↔ Gujarati
# ---------------------------------------------------------------------------
def examples_direct_script() -> None:
    banner('6. Direct Devanagari ↔ Gujarati')

    show('canonical Deva→Gujr', to_canonical_gujarati_from_devanagari(DEVA))
    show('canonical Gujr→Deva', to_canonical_devanagari_from_gujarati(GUJR))
    show('smart Deva→Gujr', to_gujarati_from_devanagari(DEVA))
    show('smart Gujr→Deva', to_devanagari_from_gujarati(GUJR))

    for dig in IndicScriptDigitPolicy:
        out = to_canonical_gujarati_from_devanagari(
            '१२३',
            IndicScriptConversionOptions(digit_policy=dig),
        )
        show(f'digit_policy={dig.value} on १२३', out)

    for unk in IndicScriptUnknownPolicy:
        try:
            out = to_canonical_gujarati_from_devanagari(
                'कृष्ण X',
                IndicScriptConversionOptions(unknown_policy=unk),
            )
            show(f'unknown_policy={unk.value}', out)
        except Exception as exc:
            show(f'unknown_policy={unk.value}', f'RAISED {type(exc).__name__}')

    tagged = to_canonical_gujarati_from_devanagari(
        'ऄ ऎ ऍ',
        IndicScriptConversionOptions(embed_exact_source_metadata=True),
    )
    show('exact reverse Gujr→Deva', to_exact_devanagari_from_gujarati(tagged))

    tagged2 = to_canonical_devanagari_from_gujarati(
        GUJR,
        IndicScriptConversionOptions(embed_exact_source_metadata=True),
    )
    show('exact reverse Deva→Gujr', to_exact_gujarati_from_devanagari(tagged2))


# ---------------------------------------------------------------------------
# 7. Metadata helpers
# ---------------------------------------------------------------------------
def examples_metadata() -> None:
    banner('7. Exact-source metadata helpers & Unicode utilities')

    rendered = to_devanagari_from_iast(IAST)
    tagged = embed_exact_source_metadata(rendered, IAST)
    show('has_embedded_exact_source', has_embedded_exact_source(tagged))
    show('recover', recover_embedded_exact_source(tagged))
    show('strip', strip_exact_source_metadata(tagged))
    show('visible_without_exact_source_metadata', visible_without_exact_source_metadata(tagged))

    meta = try_decode_exact_source_metadata(tagged)
    if meta is not None:
        show('meta.original_source', meta.original_source)
        show('meta.visible_text', meta.visible_text)

    gujr_tagged = to_canonical_gujarati_from_devanagari(
        'ऄ ऎ ऍ', options=IndicScriptConversionOptions(embed_exact_source_metadata=True)
    )
    show('has_exact_gujarati_source_metadata', has_exact_gujarati_source_metadata(gujr_tagged))
    deva_tagged = to_canonical_devanagari_from_gujarati(
        'અ એ ઍ', options=IndicScriptConversionOptions(embed_exact_source_metadata=True)
    )
    show('has_exact_devanagari_source_metadata', has_exact_devanagari_source_metadata(deva_tagged))

    show('is_unicode_combining_mark(\\u0301)', is_unicode_combining_mark(ord('\u0301')))
    show('is_encoded_vedic_mark(\\u0951)', is_encoded_vedic_mark(0x0951))
    show('normalize NFC', normalize_unicode(IAST, UnicodeNormalizationForm.NFC))
    show('normalize NFD', normalize_unicode(IAST, UnicodeNormalizationForm.NFD))


def main() -> None:
    print('lipimala — Python public API examples')
    examples_envelope()
    examples_iast_to_deva()
    examples_iast_to_gujr()
    examples_plain_english()
    examples_reverse()
    examples_direct_script()
    examples_metadata()
    print()
    print('Done. All public-API example sections executed.')


if __name__ == '__main__':
    main()
