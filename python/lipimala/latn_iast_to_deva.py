from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from ._forward import ForwardConverter, ForwardScriptConfig


class DevanagariRomanizationProfile(str, Enum):
    STRICT_IAST = 'strictIast'
    ISO_15919_CORE = 'iso15919Core'
    EXTENDED_INDIC = 'extendedIndic'
    strictIast = STRICT_IAST
    iso15919Core = ISO_15919_CORE
    extendedIndic = EXTENDED_INDIC


RomanizationProfile = DevanagariRomanizationProfile


class IastToDevanagariUnknownLatinPolicy(str, Enum):
    PASS_THROUGH = 'passThrough'
    BRACKET = 'bracket'
    THROW_ERROR = 'throwError'
    passThrough = PASS_THROUGH
    bracket = BRACKET
    throwError = THROW_ERROR


class IastToDevanagariDigitPolicy(str, Enum):
    PRESERVE_ASCII = 'preserveAscii'
    CONVERT_TO_SCRIPT = 'convertToScript'
    preserveAscii = PRESERVE_ASCII
    convertToScript = CONVERT_TO_SCRIPT


class IastToDevanagariPunctuationPolicy(str, Enum):
    PRESERVE = 'preserve'
    INDIC_DANDA = 'indicDanda'
    preserve = PRESERVE
    indicDanda = INDIC_DANDA


class IastToDevanagariOmPolicy(str, Enum):
    TRANSLITERATE_LETTERS = 'transliterateLetters'
    USE_OM_SIGN = 'useOmSign'
    transliterateLetters = TRANSLITERATE_LETTERS
    useOmSign = USE_OM_SIGN


class IastToDevanagariAmbiguousLPolicy(str, Enum):
    CONTEXT = 'context'
    PREFER_VOCALIC = 'preferVocalic'
    PREFER_CONSONANT = 'preferConsonant'
    context = CONTEXT
    preferVocalic = PREFER_VOCALIC
    preferConsonant = PREFER_CONSONANT


@dataclass(frozen=True, slots=True)
class IastToDevanagariOptions:
    profile: DevanagariRomanizationProfile = DevanagariRomanizationProfile.EXTENDED_INDIC
    unknown_latin_policy: IastToDevanagariUnknownLatinPolicy = (
        IastToDevanagariUnknownLatinPolicy.PASS_THROUGH
    )
    digit_policy: IastToDevanagariDigitPolicy = IastToDevanagariDigitPolicy.PRESERVE_ASCII
    punctuation_policy: IastToDevanagariPunctuationPolicy = (
        IastToDevanagariPunctuationPolicy.PRESERVE
    )
    om_policy: IastToDevanagariOmPolicy = IastToDevanagariOmPolicy.TRANSLITERATE_LETTERS
    ambiguous_l_policy: IastToDevanagariAmbiguousLPolicy = IastToDevanagariAmbiguousLPolicy.CONTEXT
    accept_ascii_long_vowels: bool = False
    accept_plain_sh: bool = True
    accept_plain_x_as_kha: bool = True
    accept_w_as_va: bool = True
    preserve_vedic_accent_marks: bool = True
    collapse_whitespace: bool = False
    embed_exact_source_metadata: bool = False

    # Dart-style property aliases
    @property
    def unknownLatinPolicy(self):
        return self.unknown_latin_policy

    @property
    def digitPolicy(self):
        return self.digit_policy

    @property
    def punctuationPolicy(self):
        return self.punctuation_policy

    @property
    def omPolicy(self):
        return self.om_policy

    @property
    def ambiguousLPolicy(self):
        return self.ambiguous_l_policy

    @property
    def acceptAsciiLongVowels(self):
        return self.accept_ascii_long_vowels

    @property
    def acceptPlainSh(self):
        return self.accept_plain_sh

    @property
    def acceptPlainXAsKha(self):
        return self.accept_plain_x_as_kha

    @property
    def acceptWAsVa(self):
        return self.accept_w_as_va

    @property
    def preserveVedicAccentMarks(self):
        return self.preserve_vedic_accent_marks

    @property
    def collapseWhitespace(self):
        return self.collapse_whitespace

    @property
    def embedExactSourceMetadata(self):
        return self.embed_exact_source_metadata


_INDEPENDENT_VOWELS = {
    'a': 'अ',
    'ā': 'आ',
    'i': 'इ',
    'ī': 'ई',
    'u': 'उ',
    'ū': 'ऊ',
    'ṛ': 'ऋ',
    'ṝ': 'ॠ',
    'ḷ': 'ऌ',
    'ḹ': 'ॡ',
    'e': 'ए',
    'ē': 'ए',
    'ai': 'ऐ',
    'o': 'ओ',
    'ō': 'ओ',
    'au': 'औ',
    'ă': 'ऄ',
    'ĕ': 'ऎ',
    'ê': 'ऍ',
    'ĕ': 'ऎ',
    'æ': 'ॲ',
    'ŏ': 'ऒ',
    'ô': 'ऑ',
    'ŏ': 'ऒ',
    'oe': 'ॳ',
    'ōe': 'ॴ',
    'ooe': 'ॴ',
    'aw': 'ॵ',
    'ue': 'ॶ',
    'ūe': 'ॷ',
    'uue': 'ॷ',
}
_VOWEL_SIGNS = {
    'a': '',
    'ā': 'ा',
    'i': 'ि',
    'ī': 'ी',
    'u': 'ु',
    'ū': 'ू',
    'ṛ': 'ृ',
    'ṝ': 'ॄ',
    'ḷ': 'ॢ',
    'ḹ': 'ॣ',
    'e': 'े',
    'ē': 'े',
    'ai': 'ै',
    'o': 'ो',
    'ō': 'ो',
    'au': 'ौ',
    'ă': '',
    'ĕ': 'ॆ',
    'ê': 'ॅ',
    'ĕ': 'ॆ',
    'æ': 'ॅ',
    'ŏ': 'ॊ',
    'ô': 'ॉ',
    'ŏ': 'ॊ',
    'oe': 'ऺ',
    'ōe': 'ऻ',
    'ooe': 'ऻ',
    'aw': 'ॏ',
    'ue': 'ॖ',
    'ūe': 'ॗ',
    'uue': 'ॗ',
}
_CONSONANTS = {
    'k': 'क',
    'kh': 'ख',
    'g': 'ग',
    'gh': 'घ',
    'ṅ': 'ङ',
    'c': 'च',
    'ch': 'छ',
    'j': 'ज',
    'jh': 'झ',
    'ñ': 'ञ',
    'ṭ': 'ट',
    'ṭh': 'ठ',
    'ḍ': 'ड',
    'ḍh': 'ढ',
    'ṇ': 'ण',
    't': 'त',
    'th': 'थ',
    'd': 'द',
    'dh': 'ध',
    'n': 'न',
    'ŋ': 'न',
    'ƞ': 'न',
    'p': 'प',
    'ph': 'फ',
    'b': 'ब',
    'bh': 'भ',
    'm': 'म',
    'y': 'य',
    'r': 'र',
    'l': 'ल',
    'v': 'व',
    'w': 'व',
    'ś': 'श',
    'sh': 'श',
    'ṣ': 'ष',
    's': 'स',
    'ṡ': 'स',
    'h': 'ह',
    'ħ': 'ह',
    'ḫ': 'ख़',
    'ḷ': 'ळ',
    'ḻ': 'ऴ',
    'ṟ': 'ऱ',
    'ṙ': 'र',
    'ṉ': 'ऩ',
    'q': 'क़',
    'ḳ': 'क़',
    'ḵh': 'ख़',
    'x': 'ख़',
    'ġ': 'ग़',
    'z': 'ज़',
    'ż': 'ज़',
    'ẓ': 'ज़',
    'ṛ': 'ड़',
    'ṛh': 'ढ़',
    'f': 'फ़',
    'ẏ': 'य़',
    'ž': 'ज़',
    'zh': 'ॹ',
    'ǧ': 'ॻ',
    'gg': 'ॻ',
    'jj': 'ॼ',
    'ddd': 'ॾ',
    'ɗ': 'ॾ',
    'bb': 'ॿ',
    'ɓ': 'ॿ',
    'ḍḍ': 'ॸ',
    'yy': 'ॺ',
    'ʔ': 'ॽ',
    'ṯ': 'त़',
    'ḏ': 'द़',
    'ẖ': 'ह़',
    's̱': 'स़',
    'ẕ': 'ज़',
    'g̱': 'ग़',
    'ḵ': 'ख़',
}
_SIGNS = {
    'm̐': 'ᳪ',
    '̃': 'ँ',
    '\u0310': 'ँ',
    'ṃ': 'ं',
    'ṁ': 'ं',
    'ḥ': 'ः',
    "'": 'ऽ',
    '‘': 'ऽ',
    '’': 'ऽ',
    'ʼ': 'ऽ',
    '\u0301': '॑',
    '\u0300': '॒',
    '\u030d': '॑',
    '\u030e': '᳚',
    '\u0302': '᳚',
    '\u0320': '॒',
    '\u0900': 'ऀ',
    '\u0970': '॰',
    '\u0971': 'ॱ',
}
_DIGITS = {str(i): chr(0x0966 + i) for i in range(10)}
_STRICT_VOWELS = frozenset({'a', 'ā', 'i', 'ī', 'u', 'ū', 'ṛ', 'ṝ', 'ḷ', 'ḹ', 'e', 'ai', 'o', 'au'})
_STRICT_CONSONANTS = frozenset(
    {
        'k',
        'kh',
        'g',
        'gh',
        'ṅ',
        'c',
        'ch',
        'j',
        'jh',
        'ñ',
        'ṭ',
        'ṭh',
        'ḍ',
        'ḍh',
        'ṇ',
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
        'y',
        'r',
        'l',
        'v',
        'ś',
        'ṣ',
        's',
        'h',
    }
)

_CONFIG = ForwardScriptConfig(
    virama='्',
    om_sign='ॐ',
    danda='।',
    double_danda='।।',
    dotted_circle='◌',
    independent_vowels=_INDEPENDENT_VOWELS,
    vowel_signs=_VOWEL_SIGNS,
    consonants=_CONSONANTS,
    signs=_SIGNS,
    digits=_DIGITS,
    strict_iast_vowels=_STRICT_VOWELS,
    strict_iast_consonants=_STRICT_CONSONANTS,
)
_CONVERTER = ForwardConverter(_CONFIG)
_CONVERTER.default_options_factory = IastToDevanagariOptions


def to_devanagari_from_iast(text: str, options: IastToDevanagariOptions | None = None) -> str:
    return _CONVERTER.convert(text, options or IastToDevanagariOptions())


def toDevanagariFromIast(text: str, options: IastToDevanagariOptions | None = None) -> str:
    return to_devanagari_from_iast(text, options)


class IastToDevanagariString(str):
    def to_devanagari_from_iast(self, options: IastToDevanagariOptions | None = None) -> str:
        return to_devanagari_from_iast(str(self), options)

    def toDevanagariFromIast(self, options: IastToDevanagariOptions | None = None) -> str:
        return self.to_devanagari_from_iast(options)


__all__ = [
    'DevanagariRomanizationProfile',
    'IastToDevanagariAmbiguousLPolicy',
    'IastToDevanagariDigitPolicy',
    'IastToDevanagariOmPolicy',
    'IastToDevanagariOptions',
    'IastToDevanagariPunctuationPolicy',
    'IastToDevanagariString',
    'IastToDevanagariUnknownLatinPolicy',
    'RomanizationProfile',
    'toDevanagariFromIast',
    'to_devanagari_from_iast',
]
