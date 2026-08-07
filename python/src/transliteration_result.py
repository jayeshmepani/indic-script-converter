from __future__ import annotations

from .brahmic_to_latn_iast import *
from .latn_iast_to_deva import *
from .latn_iast_to_gujr import *
from .latn_iast_transcription import *
from .transliteration_core import *


def to_devanagari(
    text: str,
    options: IastToDevanagariOptions | None = None,
    input_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFD,
    output_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFC,
) -> TransliterationResult:
    opts = options or IastToDevanagariOptions()
    normalized_input = normalize_unicode(text, input_normalization)
    directly_rendered = to_devanagari_from_iast(normalized_input, opts)
    normalized_visible = normalize_unicode(
        strip_exact_source_metadata(directly_rendered), output_normalization
    )
    rendered = (
        embed_exact_source_metadata(normalized_visible, text)
        if opts.embed_exact_source_metadata
        else normalized_visible
    )
    profile = {
        DevanagariRomanizationProfile.STRICT_IAST: TransliterationProfile.STRICT_IAST,
        DevanagariRomanizationProfile.ISO_15919_CORE: TransliterationProfile.ISO_15919_CORE,
        DevanagariRomanizationProfile.EXTENDED_INDIC: TransliterationProfile.EXTENDED_INDIC,
    }[opts.profile]
    return TransliterationResult(
        original=text,
        normalized_input=normalized_input,
        rendered=rendered,
        profile=profile,
        input_normalization=input_normalization,
        output_normalization=output_normalization,
        rendering_is_injective=False,
        issues=(
            TransliterationIssue(
                code='SOURCE_METADATA_REQUIRED_FOR_EXACT_REVERSE',
                message='Keep this envelope to recover exact source case, aliases, and code points.',
                severity=TransliterationIssueSeverity.INFO,
            ),
        ),
    )


def to_gujarati(
    text: str,
    options: IastToGujaratiOptions | None = None,
    input_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFD,
    output_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFC,
) -> TransliterationResult:
    opts = options or IastToGujaratiOptions()
    normalized_input = normalize_unicode(text, input_normalization)
    directly_rendered = to_gujarati_from_iast(normalized_input, opts)
    normalized_visible = normalize_unicode(
        strip_exact_source_metadata(directly_rendered), output_normalization
    )
    rendered = (
        embed_exact_source_metadata(normalized_visible, text)
        if opts.embed_exact_source_metadata
        else normalized_visible
    )
    profile = {
        GujaratiRomanizationProfile.STRICT_IAST: TransliterationProfile.STRICT_IAST,
        GujaratiRomanizationProfile.ISO_15919_CORE: TransliterationProfile.ISO_15919_CORE,
        GujaratiRomanizationProfile.EXTENDED_INDIC: TransliterationProfile.EXTENDED_INDIC,
    }[opts.profile]
    return TransliterationResult(
        original=text,
        normalized_input=normalized_input,
        rendered=rendered,
        profile=profile,
        input_normalization=input_normalization,
        output_normalization=output_normalization,
        rendering_is_injective=False,
        issues=(
            TransliterationIssue(
                code='SOURCE_METADATA_REQUIRED_FOR_EXACT_REVERSE',
                message='Keep this envelope to recover exact source case, aliases, and code points.',
                severity=TransliterationIssueSeverity.INFO,
            ),
        ),
    )


def to_plain_english(
    text: str,
    options: IastPlainEnglishOptions | None = None,
    input_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFD,
    output_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFC,
) -> TransliterationResult:
    opts = options or IastPlainEnglishOptions()
    normalized_input = normalize_unicode(text, input_normalization)
    rendered = normalize_unicode(
        to_plain_english_from_iast(normalized_input, opts), output_normalization
    )
    hunterian = opts.profile is PlainEnglishRomanizationProfile.HUNTERIAN
    return TransliterationResult(
        original=text,
        normalized_input=normalized_input,
        rendered=rendered,
        profile=(
            TransliterationProfile.HUNTERIAN if hunterian else TransliterationProfile.PLAIN_ENGLISH
        ),
        input_normalization=input_normalization,
        output_normalization=output_normalization,
        rendering_is_injective=False,
        issues=(
            TransliterationIssue(
                code=(
                    'HUNTERIAN_VIEW_IS_INTRINSICALLY_LOSSY'
                    if hunterian
                    else 'PLAIN_ENGLISH_VIEW_IS_INTRINSICALLY_LOSSY'
                ),
                message=(
                    'Hunterian merges vowel length, place of articulation, and other distinctions. Exact recovery uses the retained source envelope.'
                    if hunterian
                    else 'Plain-English rendering merges scholarly distinctions. Exact recovery uses the retained source envelope.'
                ),
                severity=TransliterationIssueSeverity.INFO,
            ),
        ),
    )


# Dart-style aliases
toDevanagari = to_devanagari
toGujarati = to_gujarati
toPlainEnglish = to_plain_english


__all__ = [name for name in globals() if not name.startswith('_')]
