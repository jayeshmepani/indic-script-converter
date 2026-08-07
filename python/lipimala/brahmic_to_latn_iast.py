from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from .transliteration_core import (
    UnicodeNormalizationForm,
    has_embedded_exact_source,
    is_encoded_vedic_mark,
    is_unicode_combining_mark,
    normalize_unicode,
    recover_embedded_exact_source,
    strip_exact_source_metadata,
)


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
    virama: str
    nukta: str
    independent_vowels: Mapping[str, str]
    vowel_signs: Mapping[str, str]
    consonants: Mapping[str, str]
    signs: Mapping[str, str]
    digits: Mapping[str, str]


class _BrahmicToIast:
    @staticmethod
    def convert(input_text: str, config: _ScriptConfig, options: ScriptToIastOptions) -> str:
        visible = strip_exact_source_metadata(input_text)
        normalized = normalize_unicode(visible, options.input_normalization)
        out: list[str] = []
        i = 0
        while i < len(normalized):
            ch = normalized[i]

            independent = config.independent_vowels.get(ch)
            if independent is not None:
                out.append(independent)
                i += 1
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
                out.append(consonant)
                i += consonant_width
                if i < len(normalized):
                    nxt = normalized[i]
                    vowel = config.vowel_signs.get(nxt)
                    if vowel is not None:
                        out.append(vowel)
                        i += 1
                        continue
                    if nxt == config.virama:
                        i += 1
                        continue
                out.append('a')
                continue

            standalone_vowel = config.vowel_signs.get(ch)
            if standalone_vowel is not None:
                out.append(standalone_vowel)
                i += 1
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

            if is_encoded_vedic_mark(ch):
                if options.preserve_encoded_vedic_marks:
                    out.append(
                        {0x0951: '\u0301', 0x0952: '\u0300', 0x1CDA: '\u0302'}.get(ord(ch), ch)
                    )
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
            'o',
            'ă',
            'ê',
            'ĕ',
            'ô',
            'ŏ',
            'æ',
            'œ',
        }


_DEVANAGARI = _ScriptConfig(
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
    },
    consonants={
        'क': 'k',
        'ख': 'kh',
        'ग': 'g',
        'घ': 'gh',
        'ङ': 'ṅ',
        'च': 'c',
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
        'ॻ': 'gg',
        'ॼ': 'jj',
        'ॾ': 'ddd',
        'ॿ': 'bb',
        'ॽ': 'ʔ',
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
    },
    digits={chr(0x0966 + i): str(i) for i in range(10)},
)

_GUJARATI = _ScriptConfig(
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
    'ScriptToIastOptions',
    'has_exact_devanagari_source_metadata',
    'has_exact_gujarati_source_metadata',
    'toCanonicalIastFromDevanagari',
    'toCanonicalIastFromGujarati',
    'toExactIastFromDevanagari',
    'toExactIastFromGujarati',
    'toIastFromDevanagari',
    'toIastFromGujarati',
    'to_canonical_iast_from_devanagari',
    'to_canonical_iast_from_gujarati',
    'to_exact_iast_from_devanagari',
    'to_exact_iast_from_gujarati',
    'to_iast_from_devanagari',
    'to_iast_from_gujarati',
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
