from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum
import re

from .latn_iast_transcription import (
    FinalAPolicy,
    GlottalStopPolicy,
    IastPlainEnglishOptions,
    JnaPolicy,
    NyaPolicy,
    PlainEnglishRomanizationProfile,
    to_plain_english_from_iast,
)
from .transliteration_core import (
    UnicodeNormalizationForm,
    has_embedded_exact_source,
    is_brahmic_format_control,
    is_gujarati_consonant_nukta,
    is_samaveda_cantillation_mark,
    is_unicode_combining_mark,
    is_vedic_nasal_mark,
    is_vedic_segmental_sign,
    is_vedic_tone_cantillation_mark,
    is_vedic_visarga_mark,
    normalize_unicode,
    recover_embedded_exact_source,
    strip_exact_source_metadata,
)

_GUJARATI_SUKUN = 'ૺ'
_GUJARATI_SHADDA = 'ૻ'
_GUJARATI_MADDAH = 'ૼ'
_SEMANTIC_OM = '\ue102'


def _gujarati_cluster_transliteration(base: str, mark: str) -> str | None:
    if mark == '૽':
        return {
            'ક': 'q',
            'ખ': 'x',
            'ગ': 'ġ',
            'ત': 'ṭ',
            'સ': 'ṣ',
            'ઝ': 'ḍ',
        }.get(base)
    if mark == '૾':
        if base == 'સ':
            return 'th'
        if base == 'ઝ':
            return 'dh'
    if mark == '૿' and base == 'ઝ':
        return 'ẓ'
    return None


def _vedic_segmental_latin(cp: int) -> str | None:
    if is_vedic_visarga_mark(cp):
        return 'ḥ'
    if is_vedic_nasal_mark(cp):
        return 'ṃ'
    if is_vedic_segmental_sign(cp):
        if cp in {0x1CF2, 0x1CF3}:
            return 'ḥ'
        if cp == 0x1CF5:
            return 'ḫ'
        return 'f'
    if 0xA8F2 <= cp <= 0xA8F6:
        return 'ṃṃ' if cp == 0xA8F4 else 'ṃ'
    if cp == 0xA8F7:
        return "ṃ'"
    return None


def _lengthen_canonical_vowel(vowel: str) -> str:
    return {
        'a': 'ā',
        'i': 'ī',
        'u': 'ū',
        'e': 'ē',
        'o': 'ō',
        'ă': 'ā',
        'ĕ': 'ē',
        'ŏ': 'ō',
        'ĭ': 'ī',
    }.get(vowel, vowel)


def _read_vowel_sign(chars: str, index: int, config: _ScriptConfig) -> tuple[str, int] | None:
    if index >= len(chars):
        return None
    ch = chars[index]
    if config.script == 'devanagari' and ch == 'ॎ':
        following = chars[index + 1] if index + 1 < len(chars) else None
        if following == 'े':
            return ('ai', 2)
        if following == 'ा':
            return ('o', 2)
        if following == 'ो':
            return ('au', 2)
        return ('e', 1)
    vowel = config.vowel_signs.get(ch)
    return None if vowel is None else (vowel, 1)


@dataclass(frozen=True, slots=True)
class ScriptToIastOptions:
    input_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFD
    output_normalization: UnicodeNormalizationForm = UnicodeNormalizationForm.NFC
    preserve_unmapped: bool = True
    preserve_encoded_vedic_marks: bool = True

    @property
    def inputNormalization(self):
        return self.input_normalization

    @property
    def outputNormalization(self):
        return self.output_normalization

    @property
    def preserveUnmapped(self):
        return self.preserve_unmapped

    @property
    def preserveEncodedVedicMarks(self):
        return self.preserve_encoded_vedic_marks


@dataclass(frozen=True, slots=True)
class _ScriptConfig:
    script: str
    virama: str
    nukta: str
    independent_vowels: Mapping[str, str]
    vowel_signs: Mapping[str, str]
    consonants: Mapping[str, str]
    signs: Mapping[str, str]
    digits: Mapping[str, str]


class _BrahmicToIast:
    @staticmethod
    def convert(
        input_text: str,
        config: _ScriptConfig,
        options: ScriptToIastOptions,
        inherent_vowel: str = 'a',
        readable_overrides: Mapping[str, Mapping[str, str]] | None = None,
    ) -> str:
        visible = strip_exact_source_metadata(input_text)
        normalized = normalize_unicode(visible, options.input_normalization)
        out: list[str] = []
        i = 0
        while i < len(normalized):
            ch = normalized[i]

            independent = config.independent_vowels.get(ch)
            if independent is not None:
                latin = (
                    readable_overrides.get('independent_vowels', {}).get(ch, independent)
                    if readable_overrides is not None
                    else independent
                )
                i += 1
                if (
                    config.script == 'gujarati'
                    and ch in {'અ', 'ઇ'}
                    and i < len(normalized)
                    and normalized[i] == '૽'
                ):
                    latin = 'ʿ' + latin
                    i += 1
                if config.script == 'gujarati':
                    while i < len(normalized):
                        if normalized[i] == _GUJARATI_MADDAH:
                            latin = _lengthen_canonical_vowel(latin)
                            i += 1
                        elif normalized[i] == _GUJARATI_SUKUN:
                            # On an independent vowel U+0AFA is a pause mark, not vowel deletion.
                            i += 1
                        else:
                            break
                out.append(latin)
                continue

            consonant_key = ch
            consonant_width = 1
            if i + 1 < len(normalized) and normalized[i + 1] == config.nukta:
                with_nukta = ch + config.nukta
                if with_nukta in config.consonants:
                    consonant_key = with_nukta
                    consonant_width = 2

            consonant = config.consonants.get(consonant_key)
            if consonant is not None:
                latin = (
                    readable_overrides.get('consonants', {}).get(consonant_key, consonant)
                    if readable_overrides is not None
                    else consonant
                )
                cursor = i + consonant_width
                geminated = False
                sukun = False
                maddah = False
                if config.script == 'gujarati':
                    special_nukta_seen = False
                    while cursor < len(normalized):
                        mark = normalized[cursor]
                        if not special_nukta_seen and is_gujarati_consonant_nukta(mark):
                            latin = (
                                _gujarati_cluster_transliteration(consonant_key, mark)
                                or latin + mark
                            )
                            special_nukta_seen = True
                            cursor += 1
                        elif mark == _GUJARATI_SHADDA:
                            geminated = True
                            cursor += 1
                        elif mark == _GUJARATI_SUKUN:
                            sukun = True
                            cursor += 1
                        elif mark == _GUJARATI_MADDAH:
                            maddah = True
                            cursor += 1
                        else:
                            break

                vowel_info = _read_vowel_sign(normalized, cursor, config)
                explicit_vowel: str | None = None
                if vowel_info is not None:
                    explicit_vowel, width = vowel_info
                    cursor += width
                    # An explicit vowel wins over a preceding/tolerated sukun.
                    sukun = False
                    if (
                        config.script == 'gujarati'
                        and cursor < len(normalized)
                        and normalized[cursor] == _GUJARATI_MADDAH
                    ):
                        maddah = True
                        cursor += 1

                virama = False
                if cursor < len(normalized) and normalized[cursor] == config.virama:
                    virama = True
                    cursor += 1
                if config.script == 'gujarati':
                    while cursor < len(normalized):
                        mark = normalized[cursor]
                        if mark == _GUJARATI_MADDAH:
                            maddah = True
                            cursor += 1
                        elif mark == _GUJARATI_SUKUN:
                            # With an explicit vowel this is a tolerated pause mark, not a killer.
                            if explicit_vowel is None:
                                sukun = True
                            cursor += 1
                        elif mark == _GUJARATI_SHADDA:
                            geminated = True
                            cursor += 1
                        else:
                            break

                out.append(latin)
                if geminated:
                    out.append(latin)
                i = cursor
                if virama or sukun:
                    continue
                if geminated and explicit_vowel is None and not maddah:
                    continue
                vowel = explicit_vowel if explicit_vowel is not None else inherent_vowel
                if maddah:
                    vowel = _lengthen_canonical_vowel('a' if vowel == inherent_vowel else vowel)
                out.append(vowel)
                continue

            standalone_vowel = _read_vowel_sign(normalized, i, config)
            if standalone_vowel is not None:
                vowel, width = standalone_vowel
                i += width
                if (
                    config.script == 'gujarati'
                    and i < len(normalized)
                    and normalized[i] == _GUJARATI_MADDAH
                ):
                    vowel = _lengthen_canonical_vowel(vowel)
                    i += 1
                out.append(vowel)
                continue

            sign = config.signs.get(ch)
            if sign is not None:
                out.append(sign)
                i += 1
                continue

            digit = config.digits.get(ch)
            if digit is not None:
                out.append(digit)
                i += 1
                continue

            segmental = _vedic_segmental_latin(ord(ch))
            if segmental is not None:
                out.append(segmental)
                if options.preserve_encoded_vedic_marks:
                    out.append(ch)
                i += 1
                continue

            if is_vedic_tone_cantillation_mark(ch) or is_samaveda_cantillation_mark(ch):
                if options.preserve_encoded_vedic_marks:
                    out.append(
                        {0x0951: '\u0301', 0x0952: '\u0300', 0x1CDA: '\u0302'}.get(ord(ch), ch)
                    )
                i += 1
                continue

            if is_brahmic_format_control(ch):
                i += 1
                continue

            if ord(ch) == 0x25CC:
                if options.preserve_unmapped:
                    out.append(ch)
                i += 1
                continue

            if options.preserve_unmapped:
                out.append(ch)
            i += 1

        canonical = _BrahmicToIast._reattach_vedic_accents_to_vowels(''.join(out))
        return normalize_unicode(canonical, options.output_normalization)

    @staticmethod
    def _reattach_vedic_accents_to_vowels(text: str) -> str:
        chars = list(text)
        i = 0
        while i < len(chars):
            ch = chars[i]
            if not _BrahmicToIast._is_latin_vedic_accent(ch):
                i += 1
                continue
            target = _BrahmicToIast._find_accent_vowel_target(chars, i)
            if target is None:
                i += 1
                continue
            accent = chars.pop(i)
            chars.insert(target + 1, accent)
            i += 1
        return ''.join(chars)

    @staticmethod
    def _find_accent_vowel_target(chars: list[str], accent_index: int) -> int | None:
        target = accent_index - 1
        if target < 0:
            return None
        if chars[target] == '\u0310' and target - 1 >= 0 and chars[target - 1] == 'm':
            target -= 2
        elif chars[target] in {'ḥ', 'ṃ'}:
            target -= 1
        while target >= 0 and _BrahmicToIast._is_non_accent_combining_mark(chars[target]):
            target -= 1
        if target < 0:
            return None
        return target if _BrahmicToIast._is_latin_vowel(chars[target]) else None

    @staticmethod
    def _is_latin_vedic_accent(ch: str) -> bool:
        return ch in {'\u0301', '\u0300', '\u0302'}

    @staticmethod
    def _is_non_accent_combining_mark(ch: str) -> bool:
        return is_unicode_combining_mark(ch) and not _BrahmicToIast._is_latin_vedic_accent(ch)

    @staticmethod
    def _is_latin_vowel(ch: str) -> bool:
        return ch.lower() in {
            'a',
            'ā',
            'i',
            'ī',
            'u',
            'ū',
            'ṛ',
            'ṝ',
            'ḷ',
            'ḹ',
            'e',
            'ē',
            'o',
            'ō',
            'ă',
            'ê',
            'ĕ',
            'ĭ',
            'ô',
            'ŏ',
            'æ',
            'œ',
        }


_DEVANAGARI = _ScriptConfig(
    script='devanagari',
    virama='्',
    nukta='़',
    independent_vowels={
        'अ': 'a',
        'आ': 'ā',
        'इ': 'i',
        'ई': 'ī',
        'उ': 'u',
        'ऊ': 'ū',
        'ऋ': 'ṛ',
        'ॠ': 'ṝ',
        'ऌ': 'ḷ',
        'ॡ': 'ḹ',
        'ऄ': 'ă',
        'ऍ': 'ê',
        'ऎ': 'ĕ',
        'ए': 'e',
        'ऐ': 'ai',
        'ऑ': 'ô',
        'ऒ': 'ŏ',
        'ओ': 'o',
        'औ': 'au',
        'ॲ': 'æ',
        'ॳ': 'oe',
        'ॴ': 'ōe',
        'ॵ': 'aw',
        'ॶ': 'ue',
        'ॷ': 'ūe',
        '\ua8fe': 'aĭ',
    },
    vowel_signs={
        'ा': 'ā',
        'ि': 'i',
        'ी': 'ī',
        'ु': 'u',
        'ू': 'ū',
        'ृ': 'ṛ',
        'ॄ': 'ṝ',
        'ॢ': 'ḷ',
        'ॣ': 'ḹ',
        'ॅ': 'ê',
        'ॆ': 'ĕ',
        'े': 'e',
        'ै': 'ai',
        'ॉ': 'ô',
        'ॊ': 'ŏ',
        'ो': 'o',
        'ौ': 'au',
        'ऺ': 'oe',
        'ऻ': 'ōe',
        'ॏ': 'aw',
        'ॖ': 'ue',
        'ॗ': 'ūe',
        '\u094e': 'e',
        '\u0955': 'ē',
        '\ua8ff': 'aĭ',
    },
    consonants={
        'क': 'k',
        'ख': 'kh',
        'ग': 'g',
        'घ': 'gh',
        'ङ': 'ṅ',
        'च': 'c',
        'च़': 'ċ',
        'छ': 'ch',
        'ज': 'j',
        'झ': 'jh',
        'ञ': 'ñ',
        'ट': 'ṭ',
        'ठ': 'ṭh',
        'ड': 'ḍ',
        'ढ': 'ḍh',
        'ण': 'ṇ',
        'त': 't',
        'थ': 'th',
        'द': 'd',
        'ध': 'dh',
        'न': 'n',
        'प': 'p',
        'फ': 'ph',
        'ब': 'b',
        'भ': 'bh',
        'म': 'm',
        'य': 'y',
        'र': 'r',
        'ल': 'l',
        'व': 'v',
        'श': 'ś',
        'ष': 'ṣ',
        'स': 's',
        'ह': 'h',
        'ऴ': 'ḻ',
        'ळ': 'ḷ',
        'ऴ': 'ḻ',
        'क़': 'q',
        'ख़': 'x',
        'ग़': 'ġ',
        'ज़': 'z',
        'ड़': 'ṛ',
        'ढ़': 'ṛh',
        'फ़': 'f',
        'य़': 'ẏ',
        'ऩ': 'ṉ',
        'ऱ': 'ṟ',
        'त़': 'ṯ',
        'द़': 'ḏ',
        'ह़': 'ẖ',
        'स़': 's̱',
        'ॸ': 'ḍḍ',
        'ॹ': 'ž',
        'ॺ': 'yy',
        'ॻ': 'ɠ',
        'ॼ': 'ʄ',
        'ॾ': 'ɗ',
        'ॿ': 'ɓ',
        'ॽ': 'ʔ',
        '\u0929': 'ṉ',
        '\u0931': 'ṟ',
        '\u0958': 'q',
        '\u0959': 'x',
        '\u095a': 'ġ',
        '\u095b': 'z',
        '\u095c': 'ṛ',
        '\u095d': 'ṛh',
        '\u095e': 'f',
        '\u095f': 'ẏ',
        '\U00011b0a': 'ɗ',
    },
    signs={
        'ँ': '\u0310',
        'ं': 'ṃ',
        'ः': 'ḥ',
        'ऽ': "'",
        'ॐ': 'oṃ',
        '॑': '\u0301',
        '॒': '\u0300',
        '᳚': '\u0302',
        'ᳪ': 'm\u0310',
        '।': '|',
        '॥': '||',
        '\u0900': '\u0310',
        '\u0953': '\u0300',
        '\u0954': '\u0301',
        '\u0970': '॰',
        '\u0971': 'ॱ',
        '꣼': '꣼',
        'ꣽ': 'oṃ',
        '꣸': '꣸',
        '꣹': '꣹',
        '꣺': '꣺',
        'ꣻ': 'ꣻ',
        '\U00011b00': '𑬀',
        '\U00011b01': '𑬁',
        '\U00011b02': '𑬂',
        '\U00011b03': '𑬃',
        '\U00011b04': '𑬄',
        '\U00011b05': '𑬅',
        '\U00011b06': '𑬆',
        '\U00011b07': '𑬇',
        '\U00011b08': '𑬈',
        '\U00011b09': '𑬉',
        '꠰': '꠰',
        '꠱': '꠱',
        '꠲': '꠲',
        '꠳': '꠳',
        '꠴': '꠴',
        '꠵': '꠵',
        '꠶': '꠶',
        '꠷': '꠷',
        '꠸': '꠸',
        '꠹': '꠹',
    },
    digits={chr(0x0966 + i): str(i) for i in range(10)},
)

_GUJARATI = _ScriptConfig(
    script='gujarati',
    virama='્',
    nukta='઼',
    independent_vowels={
        'અ': 'a',
        'આ': 'ā',
        'ઇ': 'i',
        'ઈ': 'ī',
        'ઉ': 'u',
        'ઊ': 'ū',
        'ઋ': 'ṛ',
        'ૠ': 'ṝ',
        'ઌ': 'ḷ',
        'ૡ': 'ḹ',
        'ઍ': 'ĕ',
        'એ': 'e',
        'ઐ': 'ai',
        'ઑ': 'ŏ',
        'ઓ': 'o',
        'ઔ': 'au',
    },
    vowel_signs={
        'ા': 'ā',
        'િ': 'i',
        'ી': 'ī',
        'ુ': 'u',
        'ૂ': 'ū',
        'ૃ': 'ṛ',
        'ૄ': 'ṝ',
        'ૢ': 'ḷ',
        'ૣ': 'ḹ',
        'ૅ': 'ĕ',
        'ે': 'e',
        'ૈ': 'ai',
        'ૉ': 'ŏ',
        'ો': 'o',
        'ૌ': 'au',
    },
    consonants={
        'ક': 'k',
        'ખ': 'kh',
        'ગ': 'g',
        'ઘ': 'gh',
        'ઙ': 'ṅ',
        'ચ': 'c',
        'છ': 'ch',
        'જ': 'j',
        'ઝ': 'jh',
        'ઞ': 'ñ',
        'ટ': 'ṭ',
        'ઠ': 'ṭh',
        'ડ': 'ḍ',
        'ઢ': 'ḍh',
        'ણ': 'ṇ',
        'ત': 't',
        'થ': 'th',
        'દ': 'd',
        'ધ': 'dh',
        'ન': 'n',
        'પ': 'p',
        'ફ': 'ph',
        'બ઼': 'ɓ',
        'બ': 'b',
        'ભ': 'bh',
        'મ': 'm',
        'ય': 'y',
        'ર': 'r',
        'લ': 'l',
        'વ': 'v',
        'શ': 'ś',
        'ષ': 'ṣ',
        'સ': 's',
        'હ': 'h',
        'ળ': 'ḷ',
        'ૹ': 'ḻ',
        'ક઼': 'q',
        'ખ઼': 'x',
        'ગ઼': 'ġ',
        'જ઼': 'z',
        'ડ઼': 'ṛ',
        'ઢ઼': 'ṛh',
        'ફ઼': 'f',
        'ય઼': 'ẏ',
        'ન઼': 'ṉ',
        'ર઼': 'ṟ',
        'ત઼': 'ṯ',
        'દ઼': 'ḏ',
        'હ઼': 'ẖ',
        'સ઼': 's̱',
    },
    signs={
        'ઁ': '\u0310',
        'ં': 'ṃ',
        'ઃ': 'ḥ',
        'ઽ': "'",
        'ૐ': 'oṃ',
        '॑': '\u0301',
        '॒': '\u0300',
        '᳚': '\u0302',
        'ᳪ': 'm\u0310',
        '।': '|',
        '॥': '||',
        '\u0af0': '૰',
        '\u0af1': '૱',
        '꠰': '꠰',
        '꠱': '꠱',
        '꠲': '꠲',
        '꠳': '꠳',
        '꠴': '꠴',
        '꠵': '꠵',
        '꠶': '꠶',
        '꠷': '꠷',
        '꠸': '꠸',
        '꠹': '꠹',
    },
    digits={chr(0x0AE6 + i): str(i) for i in range(10)},
)


def to_iast_from_devanagari(text: str, options: ScriptToIastOptions | None = None) -> str:
    exact = recover_embedded_exact_source(text)
    return (
        exact
        if exact is not None
        else _BrahmicToIast.convert(text, _DEVANAGARI, options or ScriptToIastOptions())
    )


def to_exact_iast_from_devanagari(text: str) -> str:
    if not text:
        return ''
    exact = recover_embedded_exact_source(text)
    if exact is None:
        raise ValueError(
            'No valid embedded exact-source metadata was found. Convert with IastToDevanagariOptions(embed_exact_source_metadata=True).'
        )
    return exact


def to_canonical_iast_from_devanagari(text: str, options: ScriptToIastOptions | None = None) -> str:
    return _BrahmicToIast.convert(text, _DEVANAGARI, options or ScriptToIastOptions())


def to_iast_from_gujarati(text: str, options: ScriptToIastOptions | None = None) -> str:
    exact = recover_embedded_exact_source(text)
    return (
        exact
        if exact is not None
        else _BrahmicToIast.convert(text, _GUJARATI, options or ScriptToIastOptions())
    )


def to_exact_iast_from_gujarati(text: str) -> str:
    if not text:
        return ''
    exact = recover_embedded_exact_source(text)
    if exact is None:
        raise ValueError(
            'No valid embedded exact-source metadata was found. Convert with IastToGujaratiOptions(embed_exact_source_metadata=True).'
        )
    return exact


def to_canonical_iast_from_gujarati(text: str, options: ScriptToIastOptions | None = None) -> str:
    return _BrahmicToIast.convert(text, _GUJARATI, options or ScriptToIastOptions())


_INHERENT_SCHWA = '\ue100'
# Medial schwa deleted by natural mode. Stays inside the word until vowel length.
_SYLLABLE_BREAK = '\ue101'


class BrahmicLanguage(str, Enum):
    AUTO = 'auto'
    HINDI = 'hindi'
    GUJARATI = 'gujarati'
    SANSKRIT = 'sanskrit'
    auto = AUTO
    hindi = HINDI
    gujarati = GUJARATI
    sanskrit = SANSKRIT


class BrahmicSchwaDeletionPolicy(str, Enum):
    NONE = 'none'
    FINAL = 'final'
    LANGUAGE = 'language'
    none = NONE
    final = FINAL
    language = LANGUAGE


class BrahmicVowelLengthPolicy(str, Enum):
    COLLAPSE = 'collapse'
    DOUBLE = 'double'
    SMART = 'smart'
    collapse = COLLAPSE
    double = DOUBLE
    smart = SMART


class BrahmicReadableStyle(str, Enum):
    LEGACY = 'legacy'
    NATURAL = 'natural'
    legacy = LEGACY
    natural = NATURAL


class TerminalAnusvaraPolicy(str, Enum):
    N = 'n'
    M = 'm'
    DROP = 'drop'
    n = N
    m = M
    drop = DROP


class AynPolicy(str, Enum):
    APOSTROPHE = 'apostrophe'
    DROP = 'drop'
    PRESERVE = 'preserve'
    apostrophe = APOSTROPHE
    drop = DROP
    preserve = PRESERVE


@dataclass(frozen=True, slots=True)
class BrahmicPlainEnglishOptions:
    language: BrahmicLanguage = BrahmicLanguage.AUTO
    schwa_deletion: BrahmicSchwaDeletionPolicy = BrahmicSchwaDeletionPolicy.LANGUAGE
    vowel_length: BrahmicVowelLengthPolicy = BrahmicVowelLengthPolicy.DOUBLE
    terminal_anusvara: TerminalAnusvaraPolicy = TerminalAnusvaraPolicy.N
    ayn: AynPolicy = AynPolicy.APOSTROPHE
    jna: JnaPolicy = JnaPolicy.GYA
    nya: NyaPolicy = NyaPolicy.NA
    glottal_stop: GlottalStopPolicy = GlottalStopPolicy.REMOVE
    convert_c_to_ch: bool = True
    assimilate_anusvara: bool = True
    remove_avagraha: bool = True
    collapse_whitespace: bool = False
    preserve_vedic_accent_marks: bool = False
    use_w_for_v_after_consonants: bool | None = None
    readable_style: BrahmicReadableStyle = BrahmicReadableStyle.LEGACY
    capitalize_sentence_starts: bool = False
    readable_word_overrides: Mapping[str, str] | None = None

    @property
    def schwaDeletion(self):
        return self.schwa_deletion

    @property
    def vowelLength(self):
        return self.vowel_length

    @property
    def readableStyle(self):
        return self.readable_style

    @property
    def terminalAnusvara(self):
        return self.terminal_anusvara

    @property
    def capitalizeSentenceStarts(self):
        return self.capitalize_sentence_starts

    @property
    def readableWordOverrides(self):
        return self.readable_word_overrides


_IAST_VOWELS = {
    'a',
    'ā',
    'i',
    'ī',
    'u',
    'ū',
    'e',
    'ē',
    'o',
    'ō',
    'ṛ',
    'ṝ',
    'ḷ',
    'ḹ',
    'ă',
    'ê',
    'ĕ',
    'ĭ',
    'ô',
    'ŏ',
    'æ',
    'œ',
}
_IAST_SIGNS = {'ṃ', 'ṁ', 'ḥ'}
_ASPIRATED = {'kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh', 'ṛh'}


def _is_source_latin_base(ch: str) -> bool:
    cp = ord(ch)
    return (
        0x41 <= cp <= 0x5A
        or 0x61 <= cp <= 0x7A
        or 0x00C0 <= cp <= 0x024F
        or 0x0250 <= cp <= 0x02FF
        or 0x1E00 <= cp <= 0x1EFF
    )


def _is_source_latin_combining_mark(ch: str) -> bool:
    cp = ord(ch)
    return (
        0x0300 <= cp <= 0x036F
        or 0x1AB0 <= cp <= 0x1AFF
        or 0x1DC0 <= cp <= 0x1DFF
        or 0xFE20 <= cp <= 0xFE2F
    )


def _is_source_latin_punctuation(ch: str) -> bool:
    return ch in {'‘', '’'}


def _protect_source_latin(text: str) -> tuple[str, list[tuple[str, str]]]:
    source = str(text)
    chars = list(source)
    spans: list[tuple[str, str]] = []
    out: list[str] = []
    i = 0
    next_token = 0xF0000

    def allocate_token() -> str:
        nonlocal next_token
        while next_token <= 0x10FFFD:
            if 0xFFFFD < next_token < 0x100000:
                next_token = 0x100000
            token = chr(next_token)
            next_token += 1
            if token not in source:
                return token
        raise ValueError('Too many protected Latin spans in Brahmic transcription input.')

    while i < len(chars):
        if _is_source_latin_punctuation(chars[i]):
            token = allocate_token()
            spans.append((token, chars[i]))
            out.append(token)
            i += 1
            continue
        if not _is_source_latin_base(chars[i]):
            out.append(chars[i])
            i += 1
            continue

        start = i
        i += 1
        while i < len(chars) and (
            _is_source_latin_base(chars[i]) or _is_source_latin_combining_mark(chars[i])
        ):
            i += 1

        token = allocate_token()
        spans.append((token, ''.join(chars[start:i])))
        out.append(token)

    return ''.join(out), spans


def _restore_source_latin(text: str, spans: list[tuple[str, str]]) -> str:
    result = text
    for token, original in spans:
        result = result.replace(token, original)
    return result


def _is_transcription_word_char(ch: str) -> bool:
    if ch in (_INHERENT_SCHWA, _SYLLABLE_BREAK):
        return True
    cp = ord(ch)
    return (
        0x41 <= cp <= 0x5A
        or 0x61 <= cp <= 0x7A
        or 0x00C0 <= cp <= 0x024F
        or 0x0250 <= cp <= 0x02FF
        or 0x1E00 <= cp <= 0x1EFF
        or is_unicode_combining_mark(ch)
    )


def _tokenize_annotated_word(
    word: str, separate_vocalic_rh: bool = False
) -> list[dict[str, object]]:
    chars = list(word)
    tokens: list[dict[str, object]] = []
    i = 0
    while i < len(chars):
        ch = chars[i]
        if ch == _INHERENT_SCHWA:
            tokens.append({'type': 'vowel', 'text': 'a', 'implicit': True, 'deleted': False})
            i += 1
            continue
        if ch == _SYLLABLE_BREAK:
            tokens.append({'type': 'boundary', 'text': '', 'implicit': False, 'deleted': False})
            i += 1
            continue
        pair = ch + chars[i + 1] if i + 1 < len(chars) else ''
        if pair in {'ai', 'au'}:
            tokens.append({'type': 'vowel', 'text': pair, 'implicit': False, 'deleted': False})
            i += 2
            continue
        previous = tokens[-1] if tokens else None
        if (
            separate_vocalic_rh
            and pair.lower() == 'ṛh'
            and previous is not None
            and previous['type'] == 'consonant'
        ):
            tokens.append({'type': 'vowel', 'text': ch, 'implicit': False, 'deleted': False})
            i += 1
            continue
        if pair.lower() in _ASPIRATED:
            tokens.append({'type': 'consonant', 'text': pair, 'implicit': False, 'deleted': False})
            i += 2
            continue
        if ch.lower() in _IAST_VOWELS:
            tokens.append({'type': 'vowel', 'text': ch, 'implicit': False, 'deleted': False})
            i += 1
            continue
        if ch in _IAST_SIGNS:
            tokens.append({'type': 'sign', 'text': ch, 'implicit': False, 'deleted': False})
            i += 1
            continue
        if is_unicode_combining_mark(ch):
            if tokens:
                tokens[-1]['text'] = str(tokens[-1]['text']) + ch
            else:
                tokens.append({'type': 'other', 'text': ch, 'implicit': False, 'deleted': False})
            i += 1
            continue
        is_letter = bool(re.match(r'[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]', ch))
        tokens.append(
            {
                'type': 'consonant' if is_letter else 'other',
                'text': ch,
                'implicit': False,
                'deleted': False,
            }
        )
        i += 1
    return tokens


def _base_consonant(token: dict[str, object]) -> str:
    value = str(token['text']).lower()
    if value.endswith('h') and len(value) > 1:
        value = value[:-1]
    return value


def _is_aspirated_gha(token: dict[str, object]) -> bool:
    return str(token['text']).lower() == 'gh'


def _is_aspirated_dental(token: dict[str, object]) -> bool:
    # base_consonant folds થ/थ and ઠ/ठ to t. पति keeps its vowel; only the
    # aspirate (શાપથી) syncopates.
    text = str(token['text']).lower()
    return text == 'th' or text == 'ṭh'


def _allows_schwa_cluster(
    left: dict[str, object],
    right: dict[str, object],
    language: BrahmicLanguage,
    readable_style: BrahmicReadableStyle = BrahmicReadableStyle.LEGACY,
) -> bool:
    a = _base_consonant(left)
    b = _base_consonant(right)
    if not a or not b:
        return False

    if language is BrahmicLanguage.GUJARATI:
        if b == 'v':
            return True
        if b == 'n':
            return True
        pair = f'{a}+{b}'
        if pair in {'b+t', 'r+m', 'ś+m', 'ṣ+m', 's+m', 'ṇ+l', 'n+l'}:
            return True
        if readable_style is not BrahmicReadableStyle.NATURAL:
            return False
        if a in {'n', 'ṇ'} and _is_aspirated_gha(right):
            return True
        if a == 'p' and _is_aspirated_dental(right):
            return True
        return pair in {
            't+l',
            'ṭ+l',
            'ḍ+m',
            'd+m',
            'm+m',
            'm+d',
            't+d',
            't+y',
            'k+l',
            'k+r',
            'j+k',
            'r+d',
            'l+m',
            'ḷ+m',
            'ḻ+m',
            'l+j',
            'ḷ+j',
            'ḻ+j',
        }

    pair = f'{a}+{b}'
    if (
        readable_style is BrahmicReadableStyle.NATURAL
        and a in {'n', 'ṇ'}
        and _is_aspirated_gha(right)
    ):
        return True
    if readable_style is BrahmicReadableStyle.NATURAL and a == 'p' and _is_aspirated_dental(right):
        return True
    if readable_style is BrahmicReadableStyle.NATURAL and pair in {
        't+d',
        't+y',
        't+n',
        'k+l',
        'r+d',
        'p+n',
        'd+n',
        'd+m',
        'ḍ+n',
        'ḍ+k',
        'h+l',
        'h+n',
        'c+n',
    }:
        return True
    if b in {'r', 'y', 'v'}:
        return True
    if a == 'r' and b in {
        'k',
        'kh',
        'g',
        'gh',
        'c',
        'ch',
        'j',
        'jh',
        't',
        'th',
        'd',
        'dh',
        'n',
        'p',
        'ph',
        'b',
        'bh',
        'm',
        's',
        'sh',
        'h',
    }:
        return True
    if a in {'m', 'n'} and b in {'k', 'g', 'c', 'j', 't', 'd', 'p', 'b'}:
        return True
    return f'{a}+{b}' in {
        'k+t',
        'k+s',
        'g+d',
        'g+n',
        't+r',
        't+y',
        't+v',
        'd+r',
        'd+y',
        'd+v',
        'p+r',
        'p+y',
        'p+v',
        'b+r',
        'b+y',
        'b+v',
        'b+t',
        'h+m',
        's+t',
        's+k',
        's+p',
        's+m',
        's+n',
        's+l',
        's+v',
        'j+v',
        'c+v',
        'l+y',
        'n+y',
        'm+y',
    }


def _is_implicit_nagar_schwa(
    bearing: dict[str, object] | None,
    next_token: dict[str, object] | None,
    following: dict[str, object] | None,
) -> bool:
    if bearing is None or next_token is None or following is None:
        return False
    if bearing['type'] != 'consonant' or next_token['type'] != 'consonant':
        return False
    if following.get('implicit') is not True or _is_aspirated_gha(next_token):
        return False
    if _base_consonant(next_token) != 'g':
        return False
    return _base_consonant(bearing) in {'m', 'n', 'ṇ'}


def _is_hindi_na_suffix(
    bearing: dict[str, object] | None,
    next_token: dict[str, object] | None,
    following: dict[str, object] | None,
) -> bool:
    if bearing is None or next_token is None or following is None:
        return False
    if bearing['type'] != 'consonant' or next_token['type'] != 'consonant':
        return False
    if following['type'] != 'vowel' or following.get('implicit'):
        return False
    if str(following['text']).lower() != 'ā':
        return False
    right = _base_consonant(next_token)
    if right not in {'n', 'ṇ'}:
        return False
    left = _base_consonant(bearing)
    nasal = {'m', 'n', 'ṇ', 'ñ', 'ṅ'}
    return not (left in nasal and right in nasal)


def _is_gujarati_thi_suffix(
    next_token: dict[str, object] | None,
    following: dict[str, object] | None,
) -> bool:
    if next_token is None or following is None:
        return False
    if next_token['type'] != 'consonant' or following['type'] != 'vowel':
        return False
    consonant = str(next_token['text']).lower()
    vowel = str(following['text']).lower()
    return consonant in {'th', 'ṭh'} and vowel in {'ī', 'i'}


def _is_gujarati_mam_suffix(
    next_token: dict[str, object] | None,
    following: dict[str, object] | None,
    tokens: list[dict[str, object]],
    vowel_index: int,
) -> bool:
    if next_token is None or following is None:
        return False
    if next_token['type'] != 'consonant' or following['type'] != 'vowel':
        return False
    if _base_consonant(next_token) != 'm':
        return False
    vowel = str(following['text']).lower()
    if vowel not in {'ā', 'a'}:
        return False
    nasal_index = vowel_index + 1
    while nasal_index < len(tokens) and tokens[nasal_index]['deleted']:
        nasal_index += 1
    if nasal_index >= len(tokens):
        return False
    nasal = tokens[nasal_index]
    return nasal['type'] == 'sign' and nasal['text'] in {'ṃ', 'ṁ'}


def _has_schwa_left_vowel(
    tokens: list[dict[str, object]],
    before_index: int,
    allow_coda_skip: bool,
) -> bool:
    if before_index < 0 or before_index >= len(tokens):
        return False
    before = tokens[before_index]
    if before['type'] == 'vowel':
        return True
    if not allow_coda_skip or before['type'] != 'consonant':
        return False
    if _base_consonant(before) not in {'r', 'y', 'l', 'v'}:
        return False
    return before_index - 1 >= 0 and tokens[before_index - 1]['type'] == 'vowel'


def _should_keep_final_schwa(tokens: list[dict[str, object]], last_index: int) -> bool:
    if last_index < 2:
        return False
    bearing = tokens[last_index - 1]
    previous = tokens[last_index - 2]
    if bearing['type'] != 'consonant' or previous['type'] != 'consonant':
        return False
    pair = f'{_base_consonant(previous)}+{_base_consonant(bearing)}'
    return pair in {'r+y', 'l+y', 'n+y', 'm+y', 'g+y', 'ś+ṇ', 'ṣ+ṇ', 's+ṇ'}


def _naturalize_annotated_word(
    word: str,
    language: BrahmicLanguage,
    schwa_policy: BrahmicSchwaDeletionPolicy,
    readable_style: BrahmicReadableStyle = BrahmicReadableStyle.LEGACY,
) -> str:
    tokens = _tokenize_annotated_word(word, readable_style is BrahmicReadableStyle.NATURAL)
    if schwa_policy is BrahmicSchwaDeletionPolicy.NONE or language is BrahmicLanguage.SANSKRIT:
        return ''.join(str(t['text']) for t in tokens)

    def vowel_count() -> int:
        return sum(1 for t in tokens if t['type'] == 'vowel' and not t['deleted'])

    last = len(tokens) - 1
    while last >= 0 and tokens[last]['type'] == 'other':
        last -= 1
    if (
        last >= 0
        and tokens[last]['implicit']
        and vowel_count() > 1
        and not _should_keep_final_schwa(tokens, last)
    ):
        tokens[last]['deleted'] = True

    if schwa_policy is BrahmicSchwaDeletionPolicy.LANGUAGE:
        for i in range(len(tokens) - 2, 1, -1):
            schwa = tokens[i]
            if not schwa['implicit'] or schwa['deleted']:
                continue
            bearing = tokens[i - 1]
            before_index = i - 2
            if (
                readable_style is BrahmicReadableStyle.NATURAL
                and language is not BrahmicLanguage.SANSKRIT
            ):
                while before_index >= 0 and tokens[before_index]['type'] == 'sign':
                    before_index -= 1
            next_index = i + 1
            while next_index < len(tokens) and tokens[next_index]['deleted']:
                next_index += 1
            after_next = next_index + 1
            while after_next < len(tokens) and tokens[after_next]['deleted']:
                after_next += 1
            next_token = tokens[next_index] if next_index < len(tokens) else None
            following = tokens[after_next] if after_next < len(tokens) else None
            natural_modern = (
                readable_style is BrahmicReadableStyle.NATURAL
                and language is not BrahmicLanguage.SANSKRIT
            )
            mam_suffix = (
                natural_modern
                and language is BrahmicLanguage.GUJARATI
                and _is_gujarati_mam_suffix(next_token, following, tokens, after_next)
            )
            thi_suffix = (
                natural_modern
                and language is BrahmicLanguage.GUJARATI
                and _is_gujarati_thi_suffix(next_token, following)
            )
            na_suffix = (
                natural_modern
                and language is BrahmicLanguage.HINDI
                and _is_hindi_na_suffix(bearing, next_token, following)
            )
            keep_nagar_schwa = (
                natural_modern
                and language is BrahmicLanguage.HINDI
                and _is_implicit_nagar_schwa(bearing, next_token, following)
            )
            right_onset_has_vowel = following is not None and following['type'] == 'vowel'
            if (
                not right_onset_has_vowel
                and readable_style is BrahmicReadableStyle.NATURAL
                and language is not BrahmicLanguage.SANSKRIT
                and following is not None
                and following['type'] == 'consonant'
                and _base_consonant(following) in {'r', 'y', 'v', 'l'}
            ):
                after_cluster = after_next + 1
                while after_cluster < len(tokens) and tokens[after_cluster]['deleted']:
                    after_cluster += 1
                right_onset_has_vowel = (
                    after_cluster < len(tokens) and tokens[after_cluster]['type'] == 'vowel'
                )
            if (
                bearing['type'] == 'consonant'
                and _has_schwa_left_vowel(tokens, before_index, mam_suffix or thi_suffix)
                and next_token is not None
                and next_token['type'] == 'consonant'
                and right_onset_has_vowel
                and (
                    thi_suffix
                    or na_suffix
                    or (
                        not keep_nagar_schwa
                        and _allows_schwa_cluster(bearing, next_token, language, readable_style)
                    )
                )
            ):
                schwa['deleted'] = True
                if natural_modern:
                    schwa['boundary'] = True

    def render(token: dict[str, object]) -> str:
        if not token['deleted']:
            return str(token['text'])
        return _SYLLABLE_BREAK if token.get('boundary') else ''

    return ''.join(render(t) for t in tokens)


def _naturalize_annotated_iast(
    text: str,
    language: BrahmicLanguage,
    schwa_policy: BrahmicSchwaDeletionPolicy,
    readable_style: BrahmicReadableStyle = BrahmicReadableStyle.LEGACY,
) -> str:
    chars = list(text)
    out: list[str] = []
    i = 0
    while i < len(chars):
        if not _is_transcription_word_char(chars[i]):
            out.append(chars[i])
            i += 1
            continue
        start = i
        i += 1
        while i < len(chars) and _is_transcription_word_char(chars[i]):
            i += 1
        out.append(
            _naturalize_annotated_word(
                ''.join(chars[start:i]),
                language,
                schwa_policy,
                readable_style,
            )
        )
    return ''.join(out)


def _map_transcription_words(text: str, mapper) -> str:
    chars = list(text)
    out: list[str] = []
    i = 0
    while i < len(chars):
        if not _is_transcription_word_char(chars[i]):
            out.append(chars[i])
            i += 1
            continue
        start = i
        i += 1
        while i < len(chars) and _is_transcription_word_char(chars[i]):
            i += 1
        out.append(mapper(''.join(chars[start:i])))
    return ''.join(out)


def _apply_natural_cluster_spellings(word: str, language: BrahmicLanguage) -> str:
    if language is BrahmicLanguage.SANSKRIT:
        return word
    for source, target in (
        ('śv', 'św'),
        ('Śv', 'Św'),
        ('ṣv', 'ṣw'),
        ('Ṣv', 'Ṣw'),
        ('sv', 'sw'),
        ('Sv', 'Sw'),
        ('dv', 'dw'),
        ('Dv', 'Dw'),
    ):
        word = word.replace(source, target)
    return word


def _ends_with_closed_resonant(word: str) -> bool:
    chars = list(word)
    if len(chars) < 2:
        return False
    last = chars[-1].lower()
    if last not in 'ryvw':
        return False
    prev = chars[-2].lower()
    return prev not in set('aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ')


def _apply_brahmic_natural_morphology(text: str, language: BrahmicLanguage) -> str:
    def naturalize_word(original_word: str) -> str:
        word = original_word

        if language is BrahmicLanguage.GUJARATI:
            word = re.sub(r'māṃthī$', 'mathī', word)
            word = re.sub(r'māṃ$', 'ma', word)
            if re.search(r'[aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ].*āṃ$', word):
                word = re.sub(r'āṃ$', 'ā', word)
            word = re.sub(r'uṃ$', 'u', word)
            word = re.sub(r'a[ṃṁ][īi]', 'ai', word)

        word = _apply_natural_cluster_spellings(word, language)

        if language is BrahmicLanguage.HINDI and word.endswith('ie'):
            word = word[:-2] + 'iye'
        elif language is BrahmicLanguage.HINDI and word.endswith('IE'):
            word = word[:-2] + 'IYE'

        if language is not BrahmicLanguage.SANSKRIT and _ends_with_closed_resonant(word):
            word += 'a'

        return word

    return _map_transcription_words(text, naturalize_word)


def _natural_readable_overrides(
    config: _ScriptConfig,
    language: BrahmicLanguage,
    readable_style: BrahmicReadableStyle,
) -> Mapping[str, Mapping[str, str]] | None:
    if readable_style is not BrahmicReadableStyle.NATURAL:
        return None

    independent_vowels: dict[str, str] = {}
    consonants: dict[str, str] = {}

    if language is not BrahmicLanguage.SANSKRIT:
        if config.script == 'devanagari':
            consonants['ड़'] = 'ḍ'
            consonants['ढ़'] = 'ḍh'
        elif config.script == 'gujarati':
            consonants['ડ઼'] = 'ḍ'
            consonants['ઢ઼'] = 'ḍh'

    if config.script == 'gujarati':
        consonants['ળ'] = 'ḻ'
        if language is BrahmicLanguage.GUJARATI:
            independent_vowels['ઋ'] = 'ru'
    elif config.script == 'devanagari':
        consonants['ळ'] = 'ḻ'
        if language is BrahmicLanguage.GUJARATI:
            independent_vowels['ऋ'] = 'ru'

    if not independent_vowels and not consonants:
        return None
    return {
        'independent_vowels': independent_vowels,
        'consonants': consonants,
    }


def _collapse_readable_vowel_length(text: str) -> str:
    for source, target in (
        ('ā', 'a'),
        ('Ā', 'A'),
        ('ī', 'i'),
        ('Ī', 'I'),
        ('ū', 'u'),
        ('Ū', 'U'),
        ('ē', 'e'),
        ('Ē', 'E'),
        ('ō', 'o'),
        ('Ō', 'O'),
        ('ṝ', 'ri'),
        ('Ṝ', 'Ri'),
        ('ḹ', 'li'),
        ('Ḹ', 'Li'),
    ):
        text = text.replace(source, target)
    return text


def _double_readable_vowel_length(text: str) -> str:
    for source, target in (
        ('āī', 'aai'),
        ('Āī', 'Aai'),
        ('aī', 'ai'),
        ('Aī', 'Ai'),
        ('ā', 'aa'),
        ('Ā', 'Aa'),
        ('ī', 'ee'),
        ('Ī', 'Ee'),
        ('ū', 'oo'),
        ('Ū', 'Oo'),
        ('ē', 'ee'),
        ('Ē', 'Ee'),
        ('ō', 'oo'),
        ('Ō', 'Oo'),
        ('ṝ', 'ree'),
        ('Ṝ', 'Ree'),
        ('ḹ', 'lee'),
        ('Ḹ', 'Lee'),
    ):
        text = text.replace(source, target)
    return text


_LONG_VOWEL_COLLAPSE = {
    'ā': 'a',
    'Ā': 'A',
    'ī': 'i',
    'Ī': 'I',
    'ū': 'u',
    'Ū': 'U',
    'ē': 'e',
    'Ē': 'E',
    'ō': 'o',
    'Ō': 'O',
    'ṝ': 'ri',
    'Ṝ': 'Ri',
    'ḹ': 'li',
    'Ḹ': 'Li',
}


def _collapse_vowel_token(text: str) -> str:
    chars = list(text)
    if not chars:
        return text
    short = _LONG_VOWEL_COLLAPSE.get(chars[0])
    if short is None:
        return text
    chars[0] = short
    return ''.join(chars)


def _is_long_vowel_token(text: str) -> bool:
    chars = list(text)
    return bool(chars) and chars[0] in _LONG_VOWEL_COLLAPSE


def _is_central_long_vowel(text: str) -> bool:
    chars = list(text)
    return bool(chars) and chars[0] in {'ā', 'Ā'}


def _is_peripheral_long_vowel(text: str) -> bool:
    return _is_long_vowel_token(text) and not _is_central_long_vowel(text)


def _is_nasal_sign(token: dict[str, object]) -> bool:
    return token['type'] == 'sign' and str(token['text']) in {'ṃ', 'ṁ'}


def _coda_weight(tokens: list[dict[str, object]]) -> int | None:
    weight = 0
    for token in tokens:
        if token['type'] in {'consonant', 'sign'}:
            weight += 1
        else:
            return None
    return weight


def _is_cluster_forming_resonant(token: dict[str, object]) -> bool:
    # A liquid or glide across a deleted schwa joins the preceding consonant.
    base = _base_consonant(token)
    return base == 'r' or base == 'y' or base == 'l' or base == 'v'


def _is_nasal_consonant(token: dict[str, object]) -> bool:
    # A final open syllable that begins with a nasal is its own clitic.
    base = _base_consonant(token)
    return base == 'm' or base == 'n' or base == 'ṇ' or base == 'ñ' or base == 'ṅ'


def _is_light_syllable_contact(contact: list[dict[str, object]]) -> bool:
    if len(contact) == 1 and contact[0]['type'] == 'consonant':
        return True
    boundary_at = [index for index, token in enumerate(contact) if token['type'] == 'boundary']
    if len(boundary_at) != 1:
        return False
    at = boundary_at[0]
    left = contact[:at]
    right = contact[at + 1 :]
    if _coda_weight(left) != 1 or _coda_weight(right) != 1:
        return False
    right_consonant = next((token for token in right if token['type'] == 'consonant'), None)
    return right_consonant is not None and not _is_cluster_forming_resonant(right_consonant)


def _coda_has_boundary(tokens: list[dict[str, object]]) -> bool:
    return any(token['type'] == 'boundary' for token in tokens)


def _has_nasal_coda_before_next(
    tokens: list[dict[str, object]],
    vowel_index: int,
    next_index: int,
) -> bool:
    # हूँगा writes n+g between ū and the next vowel. The nasal is the coda and
    # the stop is the next onset. A stop+liquid pair is one onset (રાત્રે).
    between = tokens[vowel_index + 1 : next_index]
    consonant_at: list[int] = []
    for index, token in enumerate(between):
        if token['type'] not in {'consonant', 'sign'}:
            return False
        if token['type'] == 'consonant':
            consonant_at.append(index)
    if not consonant_at:
        return False
    onset = 1
    last_at = consonant_at[-1]
    if len(consonant_at) >= 2:
        prev_at = consonant_at[-2]
        if last_at == prev_at + 1 and _is_cluster_forming_resonant(between[last_at]):
            onset = 2
    if len(between) <= onset:
        return False
    coda = between[: len(between) - onset]
    if _coda_weight(coda) != 1:
        return False
    return _is_nasal_consonant(coda[0]) or _is_nasal_sign(coda[0])


def _smart_length_keep_indexes(tokens: list[dict[str, object]]) -> set[int]:
    keep: set[int] = set()
    if not tokens:
        return keep
    # A word-initial long vowel has no consonant to carry it (āj, āvīne, ūpar).
    if tokens[0]['type'] == 'vowel' and _is_long_vowel_token(str(tokens[0]['text'])):
        keep.add(0)

    vowel_indexes = [index for index, token in enumerate(tokens) if token['type'] == 'vowel']
    if not vowel_indexes:
        return keep

    # A nasal coda before the next onset keeps a non-final peripheral vowel
    # (hūngā). Central ā stays short (kāṃṭhe).
    for position in range(len(vowel_indexes) - 1):
        index = vowel_indexes[position]
        if not _is_peripheral_long_vowel(str(tokens[index]['text'])):
            continue
        if _has_nasal_coda_before_next(tokens, index, vowel_indexes[position + 1]):
            keep.add(index)

    if len(vowel_indexes) == 1:
        index = vowel_indexes[0]
        coda = tokens[index + 1 :]
        # One coda keeps the vowel (cār, rūp, hūn, dūdh). An open syllable and a
        # true cluster (mārg) both shorten.
        text = str(tokens[index]['text'])
        if not _coda_has_boundary(coda) and _is_long_vowel_token(text) and _coda_weight(coda) == 1:
            keep.add(index)
        return keep

    last = vowel_indexes[-1]
    previous = vowel_indexes[-2]
    last_coda = tokens[last + 1 :]
    if len(vowel_indexes) == 2 and _is_long_vowel_token(str(tokens[previous]['text'])):
        contact = tokens[previous + 1 : last]
        # Two nuclei and an open second syllable: māre, nīce, cār plus an open syllable.
        if _coda_weight(last_coda) == 0 and _is_light_syllable_contact(contact):
            keep.add(previous)

    last_text = str(tokens[last]['text'])
    # The last syllable, closed by one consonant. ā shortens. ī/ū/ē/ō stay.
    if (
        not _coda_has_boundary(last_coda)
        and _coda_weight(last_coda) == 1
        and _is_long_vowel_token(last_text)
        and not _is_central_long_vowel(last_text)
    ):
        keep.add(last)

    # A short vowel after one obstruent is a vocalic ending (svarūpe).
    if (
        len(vowel_indexes) > 2
        and not _is_long_vowel_token(last_text)
        and _coda_weight(last_coda) == 0
    ):
        contact = tokens[previous + 1 : last]
        previous_text = str(tokens[previous]['text'])
        if (
            len(contact) == 1
            and contact[0]['type'] == 'consonant'
            and not _is_cluster_forming_resonant(contact[0])
            and not _is_nasal_consonant(contact[0])
            and _is_long_vowel_token(previous_text)
            and not _is_central_long_vowel(previous_text)
        ):
            keep.add(previous)
    return keep


def _without_syllable_breaks(text: str) -> str:
    return text.replace(_SYLLABLE_BREAK, '')


def _final_open_syllable_split(tokens: list[dict[str, object]]) -> tuple[int, bool] | None:
    # A schwa boundary keeps the consonant before the break on the stem
    # (svarūp + thī). A single onset consonant leaves with the ending.
    vowel_indexes = [index for index, token in enumerate(tokens) if token['type'] == 'vowel']
    if len(vowel_indexes) < 3:
        return None
    last = vowel_indexes[-1]
    previous = vowel_indexes[-2]
    if _coda_weight(tokens[last + 1 :]) != 0:
        return None
    contact = tokens[previous + 1 : last]
    if not _is_light_syllable_contact(contact):
        return None
    boundary_at = next(
        (index for index, token in enumerate(contact) if token['type'] == 'boundary'),
        None,
    )
    start = previous + 1 + boundary_at if boundary_at is not None else previous + 1
    return start, _is_long_vowel_token(str(tokens[last]['text']))


def _peel_saves_peripheral(tokens: list[dict[str, object]], start: int) -> bool:
    # A short ending is peeled only when the stem then keeps a peripheral vowel
    # the full word would shorten (rūpama). Saving only central ā is not enough.
    full = _smart_length_keep_indexes(tokens)
    stem = _smart_length_keep_indexes(tokens[:start])
    for index in stem:
        if index in full:
            continue
        if _is_peripheral_long_vowel(str(tokens[index]['text'])):
            return True
    return False


def _render_smart_length_tokens(tokens: list[dict[str, object]]) -> str:
    keep = _smart_length_keep_indexes(tokens)
    parts: list[str] = []
    for index, token in enumerate(tokens):
        if token['type'] == 'boundary':
            continue
        text = str(token['text'])
        if token['type'] == 'vowel' and index not in keep:
            text = _collapse_vowel_token(text)
        parts.append(text)
    return ''.join(parts)


def _render_collapsed_ending(tokens: list[dict[str, object]]) -> str:
    parts: list[str] = []
    for token in tokens:
        if token['type'] == 'boundary':
            continue
        text = str(token['text'])
        if token['type'] == 'vowel':
            text = _collapse_vowel_token(text)
        parts.append(text)
    return ''.join(parts)


def _smart_readable_vowel_length_word(word: str, language: BrahmicLanguage) -> str:
    if language is BrahmicLanguage.SANSKRIT:
        return _double_readable_vowel_length(_without_syllable_breaks(word))

    stem = _tokenize_annotated_word(word)
    ending = ''
    # Long open endings stack (પાસેથીના). A short ending is removed only once,
    # and only when that keeps a peripheral vowel on the stem (રૂપમાં).
    while stem:
        split = _final_open_syllable_split(stem)
        if split is None:
            break
        start, final_is_long = split
        short_ok = not final_is_long and _peel_saves_peripheral(stem, start)
        if not final_is_long and not short_ok:
            break
        ending = _render_collapsed_ending(stem[start:]) + ending
        stem = stem[:start]
        if short_ok:
            break
    return _double_readable_vowel_length(_render_smart_length_tokens(stem) + ending)


def _apply_readable_vowel_length(
    text: str,
    policy: BrahmicVowelLengthPolicy,
    language: BrahmicLanguage = BrahmicLanguage.AUTO,
    readable_style: BrahmicReadableStyle = BrahmicReadableStyle.LEGACY,
) -> str:
    if readable_style is not BrahmicReadableStyle.NATURAL:
        return (
            _double_readable_vowel_length(text)
            if policy is BrahmicVowelLengthPolicy.DOUBLE
            else text
        )
    if policy is BrahmicVowelLengthPolicy.DOUBLE:
        return _double_readable_vowel_length(_without_syllable_breaks(text))
    if policy is BrahmicVowelLengthPolicy.COLLAPSE:
        return _collapse_readable_vowel_length(_without_syllable_breaks(text))
    if policy is BrahmicVowelLengthPolicy.SMART:
        return _map_transcription_words(
            text,
            lambda word: _smart_readable_vowel_length_word(word, language),
        )
    return _without_syllable_breaks(text)


def _apply_terminal_anusvara(text: str, policy: TerminalAnusvaraPolicy) -> str:
    replacement = (
        ''
        if policy is TerminalAnusvaraPolicy.DROP
        else ('m' if policy is TerminalAnusvaraPolicy.M else 'n')
    )
    return re.sub(r'[ṃṁ](?=$|[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF\uE101])', replacement, text)


def _apply_readable_candrabindu(text: str, policy: TerminalAnusvaraPolicy) -> str:
    replacement = (
        ''
        if policy is TerminalAnusvaraPolicy.DROP
        else ('m' if policy is TerminalAnusvaraPolicy.M else 'n')
    )
    return re.sub(
        r'([aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ])\u0310',
        lambda match: match.group(1) + replacement,
        text,
        flags=re.IGNORECASE,
    )


def _strip_dangling_brahmic_modifiers(text: str) -> str:
    return re.sub(r'[़઼्્ૺૻૼ૽૾૿]', '', text)


def _apply_ayn_policy(text: str, policy: AynPolicy) -> str:
    if policy is AynPolicy.PRESERVE:
        return text
    return text.replace('ʿ', '' if policy is AynPolicy.DROP else "'")


def _apply_readable_word_overrides(text: str, overrides: Mapping[str, str] | None) -> str:
    if not overrides:
        return text
    return _map_transcription_words(text, lambda word: str(overrides.get(word, word)))


def _capitalize_readable_sentence_starts(text: str) -> str:
    capitalize_next = True
    out: list[str] = []
    for ch in text:
        if capitalize_next and 'a' <= ch <= 'z':
            out.append(ch.upper())
            capitalize_next = False
            continue
        out.append(ch)
        if ('A' <= ch <= 'Z') or ('a' <= ch <= 'z'):
            capitalize_next = False
        if ch in '.!?।॥\n\r':
            capitalize_next = True
    return ''.join(out)


def _protect_semantic_om(text: str) -> str:
    return re.sub(r'[ॐૐꣽ]', _SEMANTIC_OM, text)


def _restore_semantic_om(text: str) -> str:
    return text.replace(_SEMANTIC_OM, 'om')


def _to_plain_english_from_brahmic(
    text: str,
    config: _ScriptConfig,
    script_language: BrahmicLanguage,
    options: BrahmicPlainEnglishOptions | None,
    forced_profile: PlainEnglishRomanizationProfile | None = None,
) -> str:
    resolved = options or BrahmicPlainEnglishOptions()
    language = script_language if resolved.language is BrahmicLanguage.AUTO else resolved.language
    protected_text, protected_latin = _protect_source_latin(text)
    annotated = _BrahmicToIast.convert(
        _protect_semantic_om(protected_text),
        config,
        ScriptToIastOptions(preserve_encoded_vedic_marks=resolved.preserve_vedic_accent_marks),
        _INHERENT_SCHWA,
        _natural_readable_overrides(config, language, resolved.readable_style),
    )
    iast = _strip_dangling_brahmic_modifiers(
        _naturalize_annotated_iast(
            annotated,
            language,
            resolved.schwa_deletion,
            resolved.readable_style,
        )
    )
    natural_brahmic = resolved.readable_style is BrahmicReadableStyle.NATURAL
    natural_modern_indo_aryan = natural_brahmic and language is not BrahmicLanguage.SANSKRIT
    if natural_brahmic:
        iast = _apply_brahmic_natural_morphology(iast, language)
    iast = _apply_readable_candrabindu(iast, resolved.terminal_anusvara)
    iast = _apply_terminal_anusvara(iast, resolved.terminal_anusvara)
    iast = _apply_readable_vowel_length(
        iast,
        resolved.vowel_length,
        language,
        resolved.readable_style,
    )
    profile = forced_profile or PlainEnglishRomanizationProfile.EXTENDED_INDIC
    use_w = (
        False
        if resolved.use_w_for_v_after_consonants is None
        else resolved.use_w_for_v_after_consonants
    )
    suppress_hunterian_auto_w = profile is PlainEnglishRomanizationProfile.HUNTERIAN and (
        natural_modern_indo_aryan or (language is BrahmicLanguage.GUJARATI and not use_w)
    )
    if suppress_hunterian_auto_w:
        iast = _apply_hunterian_visarga_absorption(iast)
    engine_profile = (
        PlainEnglishRomanizationProfile.EXTENDED_INDIC if suppress_hunterian_auto_w else profile
    )
    result = to_plain_english_from_iast(
        iast,
        IastPlainEnglishOptions(
            profile=engine_profile,
            final_a=FinalAPolicy.KEEP,
            jna=resolved.jna,
            nya=resolved.nya,
            glottal_stop=resolved.glottal_stop,
            convert_c_to_ch=resolved.convert_c_to_ch,
            assimilate_anusvara=resolved.assimilate_anusvara,
            remove_avagraha=resolved.remove_avagraha,
            collapse_whitespace=resolved.collapse_whitespace,
            preserve_vedic_accent_marks=resolved.preserve_vedic_accent_marks,
            use_w_for_v_after_consonants=False if natural_modern_indo_aryan else use_w,
            enable_internal_schwa_syncope=False,
        ),
    )
    result = _apply_ayn_policy(result, resolved.ayn)
    result = _restore_semantic_om(result)
    result = _apply_readable_word_overrides(result, resolved.readable_word_overrides)
    if resolved.capitalize_sentence_starts:
        result = _capitalize_readable_sentence_starts(result)
    return _restore_source_latin(result, protected_latin)


def _apply_hunterian_visarga_absorption(text: str) -> str:
    cls = r'[kKgGcCjJtTdDpPbBsSśŚṣṢhH]'
    return re.sub(rf'(?:ḥ|Ḥ|h\u0323|H\u0323)({cls})', r'\1', text)


def to_plain_english_from_devanagari(
    text: str, options: BrahmicPlainEnglishOptions | None = None
) -> str:
    return _to_plain_english_from_brahmic(text, _DEVANAGARI, BrahmicLanguage.HINDI, options)


def to_hunterian_from_devanagari(
    text: str, options: BrahmicPlainEnglishOptions | None = None
) -> str:
    resolved = options or BrahmicPlainEnglishOptions(vowel_length=BrahmicVowelLengthPolicy.COLLAPSE)
    if options is not None and options.vowel_length is BrahmicVowelLengthPolicy.DOUBLE:
        resolved = options
    return _to_plain_english_from_brahmic(
        text,
        _DEVANAGARI,
        BrahmicLanguage.HINDI,
        resolved,
        PlainEnglishRomanizationProfile.HUNTERIAN,
    )


def to_plain_english_from_gujarati(
    text: str, options: BrahmicPlainEnglishOptions | None = None
) -> str:
    return _to_plain_english_from_brahmic(text, _GUJARATI, BrahmicLanguage.GUJARATI, options)


def to_hunterian_from_gujarati(text: str, options: BrahmicPlainEnglishOptions | None = None) -> str:
    resolved = options or BrahmicPlainEnglishOptions(vowel_length=BrahmicVowelLengthPolicy.COLLAPSE)
    if options is not None and options.vowel_length is BrahmicVowelLengthPolicy.DOUBLE:
        resolved = options
    return _to_plain_english_from_brahmic(
        text,
        _GUJARATI,
        BrahmicLanguage.GUJARATI,
        resolved,
        PlainEnglishRomanizationProfile.HUNTERIAN,
    )


toPlainEnglishFromDevanagari = to_plain_english_from_devanagari
toHunterianFromDevanagari = to_hunterian_from_devanagari
toPlainEnglishFromGujarati = to_plain_english_from_gujarati
toHunterianFromGujarati = to_hunterian_from_gujarati


def has_exact_devanagari_source_metadata(text: str) -> bool:
    return has_embedded_exact_source(text)


def visible_devanagari_without_exact_source_metadata(text: str) -> str:
    return strip_exact_source_metadata(text)


def has_exact_gujarati_source_metadata(text: str) -> bool:
    return has_embedded_exact_source(text)


def visible_gujarati_without_exact_source_metadata(text: str) -> str:
    return strip_exact_source_metadata(text)


# Dart-style aliases
toIastFromDevanagari = to_iast_from_devanagari
toExactIastFromDevanagari = to_exact_iast_from_devanagari
toCanonicalIastFromDevanagari = to_canonical_iast_from_devanagari
toIastFromGujarati = to_iast_from_gujarati
toExactIastFromGujarati = to_exact_iast_from_gujarati
toCanonicalIastFromGujarati = to_canonical_iast_from_gujarati


__all__ = [
    'AynPolicy',
    'BrahmicLanguage',
    'BrahmicPlainEnglishOptions',
    'BrahmicReadableStyle',
    'BrahmicSchwaDeletionPolicy',
    'BrahmicVowelLengthPolicy',
    'ScriptToIastOptions',
    'TerminalAnusvaraPolicy',
    'has_exact_devanagari_source_metadata',
    'has_exact_gujarati_source_metadata',
    'toCanonicalIastFromDevanagari',
    'toCanonicalIastFromGujarati',
    'toExactIastFromDevanagari',
    'toExactIastFromGujarati',
    'toHunterianFromDevanagari',
    'toHunterianFromGujarati',
    'toIastFromDevanagari',
    'toIastFromGujarati',
    'toPlainEnglishFromDevanagari',
    'toPlainEnglishFromGujarati',
    'to_canonical_iast_from_devanagari',
    'to_canonical_iast_from_gujarati',
    'to_exact_iast_from_devanagari',
    'to_exact_iast_from_gujarati',
    'to_hunterian_from_devanagari',
    'to_hunterian_from_gujarati',
    'to_iast_from_devanagari',
    'to_iast_from_gujarati',
    'to_plain_english_from_devanagari',
    'to_plain_english_from_gujarati',
    'visible_devanagari_without_exact_source_metadata',
    'visible_gujarati_without_exact_source_metadata',
]


class DevanagariToIast(str):
    def to_iast_from_devanagari(self, options: ScriptToIastOptions | None = None) -> str:
        return to_iast_from_devanagari(str(self), options)

    def toIastFromDevanagari(self, options: ScriptToIastOptions | None = None) -> str:
        return self.to_iast_from_devanagari(options)

    def to_exact_iast_from_devanagari(self) -> str:
        return to_exact_iast_from_devanagari(str(self))

    def toExactIastFromDevanagari(self) -> str:
        return self.to_exact_iast_from_devanagari()

    def to_canonical_iast_from_devanagari(self, options: ScriptToIastOptions | None = None) -> str:
        return to_canonical_iast_from_devanagari(str(self), options)

    def toCanonicalIastFromDevanagari(self, options: ScriptToIastOptions | None = None) -> str:
        return self.to_canonical_iast_from_devanagari(options)

    def to_plain_english_from_devanagari(
        self, options: BrahmicPlainEnglishOptions | None = None
    ) -> str:
        return to_plain_english_from_devanagari(str(self), options)

    def toPlainEnglishFromDevanagari(
        self, options: BrahmicPlainEnglishOptions | None = None
    ) -> str:
        return self.to_plain_english_from_devanagari(options)

    def to_hunterian_from_devanagari(
        self, options: BrahmicPlainEnglishOptions | None = None
    ) -> str:
        return to_hunterian_from_devanagari(str(self), options)

    def toHunterianFromDevanagari(self, options: BrahmicPlainEnglishOptions | None = None) -> str:
        return self.to_hunterian_from_devanagari(options)

    @property
    def has_exact_devanagari_source_metadata(self) -> bool:
        return has_exact_devanagari_source_metadata(str(self))

    @property
    def hasExactDevanagariSourceMetadata(self) -> bool:
        return self.has_exact_devanagari_source_metadata

    @property
    def visible_devanagari_without_exact_source_metadata(self) -> str:
        return visible_devanagari_without_exact_source_metadata(str(self))

    @property
    def visibleDevanagariWithoutExactSourceMetadata(self) -> str:
        return self.visible_devanagari_without_exact_source_metadata


class GujaratiToIast(str):
    def to_iast_from_gujarati(self, options: ScriptToIastOptions | None = None) -> str:
        return to_iast_from_gujarati(str(self), options)

    def toIastFromGujarati(self, options: ScriptToIastOptions | None = None) -> str:
        return self.to_iast_from_gujarati(options)

    def to_exact_iast_from_gujarati(self) -> str:
        return to_exact_iast_from_gujarati(str(self))

    def toExactIastFromGujarati(self) -> str:
        return self.to_exact_iast_from_gujarati()

    def to_canonical_iast_from_gujarati(self, options: ScriptToIastOptions | None = None) -> str:
        return to_canonical_iast_from_gujarati(str(self), options)

    def toCanonicalIastFromGujarati(self, options: ScriptToIastOptions | None = None) -> str:
        return self.to_canonical_iast_from_gujarati(options)

    def to_plain_english_from_gujarati(
        self, options: BrahmicPlainEnglishOptions | None = None
    ) -> str:
        return to_plain_english_from_gujarati(str(self), options)

    def toPlainEnglishFromGujarati(self, options: BrahmicPlainEnglishOptions | None = None) -> str:
        return self.to_plain_english_from_gujarati(options)

    def to_hunterian_from_gujarati(self, options: BrahmicPlainEnglishOptions | None = None) -> str:
        return to_hunterian_from_gujarati(str(self), options)

    def toHunterianFromGujarati(self, options: BrahmicPlainEnglishOptions | None = None) -> str:
        return self.to_hunterian_from_gujarati(options)

    @property
    def has_exact_gujarati_source_metadata(self) -> bool:
        return has_exact_gujarati_source_metadata(str(self))

    @property
    def hasExactGujaratiSourceMetadata(self) -> bool:
        return self.has_exact_gujarati_source_metadata

    @property
    def visible_gujarati_without_exact_source_metadata(self) -> str:
        return visible_gujarati_without_exact_source_metadata(str(self))

    @property
    def visibleGujaratiWithoutExactSourceMetadata(self) -> str:
        return self.visible_gujarati_without_exact_source_metadata


__all__.extend(['DevanagariToIast', 'GujaratiToIast'])
