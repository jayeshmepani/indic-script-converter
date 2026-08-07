"""Direct Gujarati <-> Devanagari conversion.

Visible conversion is canonical and necessarily non-injective where the two
Unicode repertoires differ. Exact source recovery uses the package's existing
checksummed invisible metadata trailer.

Python 3.12+.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .transliteration_core import (
    LosslessTransliterationResult,
    TransliterationIssue,
    TransliterationIssueSeverity,
    TransliterationProfile,
    UnicodeNormalizationForm,
    embed_exact_source_metadata,
    normalize_unicode,
    recover_embedded_exact_source,
    strip_exact_source_metadata,
)


class IndicScriptUnknownPolicy(str, Enum):
    PRESERVE = 'preserve'
    THROW_ERROR = 'throwError'

    preserve = PRESERVE
    throwError = THROW_ERROR


class IndicScriptDigitPolicy(str, Enum):
    CONVERT_TO_TARGET = 'convertToTarget'
    PRESERVE_SOURCE = 'preserveSource'

    convertToTarget = CONVERT_TO_TARGET
    preserveSource = PRESERVE_SOURCE


@dataclass(frozen=True, slots=True)
class IndicScriptConversionOptions:
    input_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFD
    output_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFC
    unknown_policy: IndicScriptUnknownPolicy = IndicScriptUnknownPolicy.PRESERVE
    digit_policy: IndicScriptDigitPolicy = IndicScriptDigitPolicy.CONVERT_TO_TARGET
    collapse_whitespace: bool = False
    embed_exact_source_metadata: bool = False

    @property
    def inputNormalization(self) -> UnicodeNormalizationForm:
        return self.input_normalization

    @property
    def outputNormalization(self) -> UnicodeNormalizationForm:
        return self.output_normalization

    @property
    def unknownPolicy(self) -> IndicScriptUnknownPolicy:
        return self.unknown_policy

    @property
    def digitPolicy(self) -> IndicScriptDigitPolicy:
        return self.digit_policy

    @property
    def collapseWhitespace(self) -> bool:
        return self.collapse_whitespace

    @property
    def embedExactSourceMetadata(self) -> bool:
        return self.embed_exact_source_metadata


def _offset_entries(start: int, end: int, delta: int) -> list[tuple[str, str]]:
    return [(chr(cp), chr(cp + delta)) for cp in range(start, end + 1)]


_DEVA_TO_GUJR_OFFSET_ENTRIES: list[tuple[str, str]] = [
    *_offset_entries(0x0901, 0x0903, 0x0180),
    *_offset_entries(0x0905, 0x090C, 0x0180),
    *_offset_entries(0x090F, 0x0910, 0x0180),
    *_offset_entries(0x0913, 0x0928, 0x0180),
    *_offset_entries(0x092A, 0x0930, 0x0180),
    *_offset_entries(0x0932, 0x0933, 0x0180),
    *_offset_entries(0x0935, 0x0939, 0x0180),
    *_offset_entries(0x093C, 0x0945, 0x0180),
    *_offset_entries(0x0947, 0x0949, 0x0180),
    *_offset_entries(0x094B, 0x094D, 0x0180),
    ('ॐ', 'ૐ'),
    *_offset_entries(0x0960, 0x0963, 0x0180),
    *_offset_entries(0x0966, 0x0971, 0x0180),
]

_GUJR_TO_DEVA_OFFSET_ENTRIES: list[tuple[str, str]] = [
    *_offset_entries(0x0A81, 0x0A83, -0x0180),
    *_offset_entries(0x0A85, 0x0A8C, -0x0180),
    *_offset_entries(0x0A8F, 0x0A90, -0x0180),
    *_offset_entries(0x0A93, 0x0AA8, -0x0180),
    *_offset_entries(0x0AAA, 0x0AB0, -0x0180),
    *_offset_entries(0x0AB2, 0x0AB3, -0x0180),
    *_offset_entries(0x0AB5, 0x0AB9, -0x0180),
    *_offset_entries(0x0ABC, 0x0AC5, -0x0180),
    *_offset_entries(0x0AC7, 0x0AC9, -0x0180),
    *_offset_entries(0x0ACB, 0x0ACD, -0x0180),
    ('ૐ', 'ॐ'),
    *_offset_entries(0x0AE0, 0x0AE3, -0x0180),
    *_offset_entries(0x0AE6, 0x0AF1, -0x0180),
]

_DEVA_TO_GUJR_SINGLE: dict[str, str] = dict(
    [
        *_DEVA_TO_GUJR_OFFSET_ENTRIES,
        ('ऄ', 'અ'),
        ('ऍ', 'ઍ'),
        ('ऎ', 'ઍ'),
        ('ऑ', 'ઑ'),
        ('ऒ', 'ઑ'),
        ('ॲ', 'ઍ'),
        ('ॳ', 'ઓએ'),
        ('ॴ', 'ઓએ'),
        ('ॵ', 'ઑ'),
        ('ॶ', 'ઉએ'),
        ('ॷ', 'ઊએ'),
        ('ऺ', 'ોએ'),
        ('ऻ', 'ોએ'),
        ('ॆ', 'ૅ'),
        ('ॊ', 'ૉ'),
        ('ॏ', 'ૉ'),
        ('ॖ', 'ુએ'),
        ('ॗ', 'ૂએ'),
        ('ऩ', 'ન઼'),
        ('ऱ', 'ર઼'),
        ('ऴ', 'ળ'),
        ('क़', 'ક઼'),
        ('ख़', 'ખ઼'),
        ('ग़', 'ગ઼'),
        ('ज़', 'જ઼'),
        ('ड़', 'ડ઼'),
        ('ढ़', 'ઢ઼'),
        ('फ़', 'ફ઼'),
        ('य़', 'ય઼'),
        ('ॸ', 'ડ઼'),
        ('ॹ', 'ૹ'),
        ('ॺ', 'ય઼'),
        ('ॻ', 'ગ઼'),
        ('ॼ', 'જ઼'),
        ('ॽ', 'ઽ'),
        ('ॾ', 'ડ઼'),
        ('ॿ', 'બ઼'),
    ]
)

_GUJR_TO_DEVA_SINGLE: dict[str, str] = dict(
    [
        *_GUJR_TO_DEVA_OFFSET_ENTRIES,
        ('ઍ', 'ऎ'),
        ('ઑ', 'ऒ'),
        ('ૅ', 'ॆ'),
        ('ૉ', 'ॊ'),
        ('ૹ', 'ॹ'),
    ]
)

_DEVA_TO_GUJR_SEQUENCES: dict[str, str] = {
    'ऩ': 'ન઼',
    'ऱ': 'ર઼',
    'ऴ': 'ળ',
    'क़': 'ક઼',
    'ख़': 'ખ઼',
    'ग़': 'ગ઼',
    'ज़': 'જ઼',
    'ड़': 'ડ઼',
    'ढ़': 'ઢ઼',
    'फ़': 'ફ઼',
    'य़': 'ય઼',
    'त़': 'ત઼',
    'द़': 'દ઼',
    'ह़': 'હ઼',
    'स़': 'સ઼',
    'ब़': 'બ઼',
}

_GUJR_TO_DEVA_SEQUENCES: dict[str, str] = {
    'ન઼': 'ऩ',
    'ર઼': 'ऱ',
    'ક઼': 'क़',
    'ખ઼': 'ख़',
    'ગ઼': 'ग़',
    'જ઼': 'ज़',
    'ડ઼': 'ड़',
    'ઢ઼': 'ढ़',
    'ફ઼': 'फ़',
    'ય઼': 'य़',
    'ત઼': 'त़',
    'દ઼': 'द़',
    'હ઼': 'ह़',
    'સ઼': 'स़',
    'બ઼': 'ॿ',
}

_DEVA_TO_GUJR_SEQUENCE_ENTRIES = sorted(
    _DEVA_TO_GUJR_SEQUENCES.items(), key=lambda item: len(item[0]), reverse=True
)
_GUJR_TO_DEVA_SEQUENCE_ENTRIES = sorted(
    _GUJR_TO_DEVA_SEQUENCES.items(), key=lambda item: len(item[0]), reverse=True
)

_DEVA_DIGIT_START = 0x0966
_DEVA_DIGIT_END = 0x096F
_GUJR_DIGIT_START = 0x0AE6
_GUJR_DIGIT_END = 0x0AEF

_DEVA_SOURCE_METADATA_PREFIX = '\x00ISC:D:'
_GUJR_SOURCE_METADATA_PREFIX = '\x00ISC:G:'


def _resolve_options(
    options: IndicScriptConversionOptions | None,
) -> IndicScriptConversionOptions:
    return options if options is not None else IndicScriptConversionOptions()


def _handle_unknown(
    ch: str,
    options: IndicScriptConversionOptions,
    source_name: str,
    index: int,
) -> str:
    if options.unknown_policy is IndicScriptUnknownPolicy.PRESERVE:
        return ch
    if options.unknown_policy is IndicScriptUnknownPolicy.THROW_ERROR:
        raise ValueError(
            f'Unmapped {source_name} character U+{ord(ch):04X} at code-point offset {index}.'
        )
    raise ValueError(f'Unsupported unknown policy: {options.unknown_policy!r}')


def _convert_canonical(
    text: str,
    options: IndicScriptConversionOptions,
    *,
    source_name: str,
    single_map: dict[str, str],
    sequence_entries: list[tuple[str, str]],
    source_digit_start: int,
    source_digit_end: int,
    target_digit_start: int,
    metadata_source_prefix: str,
) -> str:
    visible_input = strip_exact_source_metadata(str(text))
    normalized = normalize_unicode(visible_input, options.input_normalization)
    out: list[str] = []
    index = 0

    while index < len(normalized):
        for key, replacement in sequence_entries:
            if normalized.startswith(key, index):
                out.append(replacement)
                index += len(key)
                break
        else:
            ch = normalized[index]
            cp = ord(ch)

            if source_digit_start <= cp <= source_digit_end:
                if options.digit_policy is IndicScriptDigitPolicy.PRESERVE_SOURCE:
                    out.append(ch)
                elif options.digit_policy is IndicScriptDigitPolicy.CONVERT_TO_TARGET:
                    out.append(chr(target_digit_start + (cp - source_digit_start)))
                else:
                    raise ValueError(f'Unsupported digit policy: {options.digit_policy!r}')
                index += 1
                continue

            out.append(single_map.get(ch) or _handle_unknown(ch, options, source_name, index))
            index += 1

    rendered = normalize_unicode(''.join(out), options.output_normalization)
    if options.collapse_whitespace:
        rendered = ' '.join(rendered.split())

    if options.embed_exact_source_metadata:
        return embed_exact_source_metadata(rendered, f'{metadata_source_prefix}{visible_input}')
    return rendered


def _recover_typed_exact_source(text: str, expected_prefix: str) -> str | None:
    recovered = recover_embedded_exact_source(str(text))
    if recovered is None or not recovered.startswith(expected_prefix):
        return None
    return recovered[len(expected_prefix) :]


def to_canonical_devanagari_from_gujarati(
    text: str,
    options: IndicScriptConversionOptions | None = None,
) -> str:
    resolved = _resolve_options(options)
    return _convert_canonical(
        text,
        resolved,
        source_name='Gujarati',
        single_map=_GUJR_TO_DEVA_SINGLE,
        sequence_entries=_GUJR_TO_DEVA_SEQUENCE_ENTRIES,
        source_digit_start=_GUJR_DIGIT_START,
        source_digit_end=_GUJR_DIGIT_END,
        target_digit_start=_DEVA_DIGIT_START,
        metadata_source_prefix=_GUJR_SOURCE_METADATA_PREFIX,
    )


toCanonicalDevanagariFromGujarati = to_canonical_devanagari_from_gujarati


def to_devanagari_from_gujarati(
    text: str,
    options: IndicScriptConversionOptions | None = None,
) -> str:
    exact = _recover_typed_exact_source(text, _DEVA_SOURCE_METADATA_PREFIX)
    return exact if exact is not None else to_canonical_devanagari_from_gujarati(text, options)


toDevanagariFromGujarati = to_devanagari_from_gujarati


def to_exact_devanagari_from_gujarati(text: str) -> str:
    if text == '':
        return ''
    exact = _recover_typed_exact_source(text, _DEVA_SOURCE_METADATA_PREFIX)
    if exact is None:
        raise ValueError(
            'No valid embedded exact-source metadata was found. Convert with '
            'IndicScriptConversionOptions(embed_exact_source_metadata=True).'
        )
    return exact


toExactDevanagariFromGujarati = to_exact_devanagari_from_gujarati


def to_canonical_gujarati_from_devanagari(
    text: str,
    options: IndicScriptConversionOptions | None = None,
) -> str:
    resolved = _resolve_options(options)
    return _convert_canonical(
        text,
        resolved,
        source_name='Devanagari',
        single_map=_DEVA_TO_GUJR_SINGLE,
        sequence_entries=_DEVA_TO_GUJR_SEQUENCE_ENTRIES,
        source_digit_start=_DEVA_DIGIT_START,
        source_digit_end=_DEVA_DIGIT_END,
        target_digit_start=_GUJR_DIGIT_START,
        metadata_source_prefix=_DEVA_SOURCE_METADATA_PREFIX,
    )


toCanonicalGujaratiFromDevanagari = to_canonical_gujarati_from_devanagari


def to_gujarati_from_devanagari(
    text: str,
    options: IndicScriptConversionOptions | None = None,
) -> str:
    exact = _recover_typed_exact_source(text, _GUJR_SOURCE_METADATA_PREFIX)
    return exact if exact is not None else to_canonical_gujarati_from_devanagari(text, options)


toGujaratiFromDevanagari = to_gujarati_from_devanagari


def to_exact_gujarati_from_devanagari(text: str) -> str:
    if text == '':
        return ''
    exact = _recover_typed_exact_source(text, _GUJR_SOURCE_METADATA_PREFIX)
    if exact is None:
        raise ValueError(
            'No valid embedded exact-source metadata was found. Convert with '
            'IndicScriptConversionOptions(embed_exact_source_metadata=True).'
        )
    return exact


toExactGujaratiFromDevanagari = to_exact_gujarati_from_devanagari


def has_exact_gujarati_source_metadata(text: str) -> bool:
    return _recover_typed_exact_source(text, _GUJR_SOURCE_METADATA_PREFIX) is not None


hasExactGujaratiSourceMetadata = has_exact_gujarati_source_metadata


def has_exact_devanagari_source_metadata(text: str) -> bool:
    return _recover_typed_exact_source(text, _DEVA_SOURCE_METADATA_PREFIX) is not None


hasExactDevanagariSourceMetadata = has_exact_devanagari_source_metadata


def visible_without_exact_source_metadata(text: str) -> str:
    return strip_exact_source_metadata(text)


visibleWithoutExactSourceMetadata = visible_without_exact_source_metadata


def to_lossless_devanagari_from_gujarati(
    text: str,
    options: IndicScriptConversionOptions | None = None,
) -> LosslessTransliterationResult:
    resolved = _resolve_options(options)
    original = str(text)
    visible_input = strip_exact_source_metadata(original)
    normalized_input = normalize_unicode(visible_input, resolved.input_normalization)
    rendered = to_canonical_devanagari_from_gujarati(visible_input, resolved)
    return LosslessTransliterationResult(
        original=original,
        normalized_input=normalized_input,
        rendered=rendered,
        profile=TransliterationProfile.EXTENDED_INDIC,
        input_normalization=resolved.input_normalization,
        output_normalization=resolved.output_normalization,
        rendering_is_injective=False,
        issues=(
            TransliterationIssue(
                code='SOURCE_METADATA_REQUIRED_FOR_EXACT_SCRIPT_REVERSE',
                message=(
                    'Gujarati and Devanagari have unequal repertoires. Keep this '
                    'envelope or enable exact-source metadata for exact recovery.'
                ),
                severity=TransliterationIssueSeverity.INFO,
            ),
        ),
    )


toLosslessDevanagariFromGujarati = to_lossless_devanagari_from_gujarati


def to_lossless_gujarati_from_devanagari(
    text: str,
    options: IndicScriptConversionOptions | None = None,
) -> LosslessTransliterationResult:
    resolved = _resolve_options(options)
    original = str(text)
    visible_input = strip_exact_source_metadata(original)
    normalized_input = normalize_unicode(visible_input, resolved.input_normalization)
    rendered = to_canonical_gujarati_from_devanagari(visible_input, resolved)
    return LosslessTransliterationResult(
        original=original,
        normalized_input=normalized_input,
        rendered=rendered,
        profile=TransliterationProfile.EXTENDED_INDIC,
        input_normalization=resolved.input_normalization,
        output_normalization=resolved.output_normalization,
        rendering_is_injective=False,
        issues=(
            TransliterationIssue(
                code='SOURCE_METADATA_REQUIRED_FOR_EXACT_SCRIPT_REVERSE',
                message=(
                    'Devanagari and Gujarati have unequal repertoires. Keep this '
                    'envelope or enable exact-source metadata for exact recovery.'
                ),
                severity=TransliterationIssueSeverity.INFO,
            ),
        ),
    )


toLosslessGujaratiFromDevanagari = to_lossless_gujarati_from_devanagari


__all__ = [
    'IndicScriptConversionOptions',
    'IndicScriptDigitPolicy',
    'IndicScriptUnknownPolicy',
    'hasExactDevanagariSourceMetadata',
    'hasExactGujaratiSourceMetadata',
    'has_exact_devanagari_source_metadata',
    'has_exact_gujarati_source_metadata',
    'toCanonicalDevanagariFromGujarati',
    'toCanonicalGujaratiFromDevanagari',
    'toDevanagariFromGujarati',
    'toExactDevanagariFromGujarati',
    'toExactGujaratiFromDevanagari',
    'toGujaratiFromDevanagari',
    'toLosslessDevanagariFromGujarati',
    'toLosslessGujaratiFromDevanagari',
    'to_canonical_devanagari_from_gujarati',
    'to_canonical_gujarati_from_devanagari',
    'to_devanagari_from_gujarati',
    'to_exact_devanagari_from_gujarati',
    'to_exact_gujarati_from_devanagari',
    'to_gujarati_from_devanagari',
    'to_lossless_devanagari_from_gujarati',
    'to_lossless_gujarati_from_devanagari',
    'visibleWithoutExactSourceMetadata',
    'visible_without_exact_source_metadata',
]
