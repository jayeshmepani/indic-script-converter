from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from ._forward import ForwardConverter, ForwardScriptConfig


class GujaratiRomanizationProfile(str, Enum):
    STRICT_IAST = 'strictIast'
    ISO_15919_CORE = 'iso15919Core'
    EXTENDED_INDIC = 'extendedIndic'
    strictIast = STRICT_IAST
    iso15919Core = ISO_15919_CORE
    extendedIndic = EXTENDED_INDIC


RomanizationProfile = GujaratiRomanizationProfile


class IastToGujaratiUnknownLatinPolicy(str, Enum):
    PASS_THROUGH = 'passThrough'
    BRACKET = 'bracket'
    THROW_ERROR = 'throwError'
    passThrough = PASS_THROUGH
    bracket = BRACKET
    throwError = THROW_ERROR


class IastToGujaratiDigitPolicy(str, Enum):
    PRESERVE_ASCII = 'preserveAscii'
    CONVERT_TO_SCRIPT = 'convertToScript'
    preserveAscii = PRESERVE_ASCII
    convertToScript = CONVERT_TO_SCRIPT


class IastToGujaratiPunctuationPolicy(str, Enum):
    PRESERVE = 'preserve'
    INDIC_DANDA = 'indicDanda'
    preserve = PRESERVE
    indicDanda = INDIC_DANDA


class IastToGujaratiOmPolicy(str, Enum):
    TRANSLITERATE_LETTERS = 'transliterateLetters'
    USE_OM_SIGN = 'useOmSign'
    transliterateLetters = TRANSLITERATE_LETTERS
    useOmSign = USE_OM_SIGN


class IastToGujaratiAmbiguousLPolicy(str, Enum):
    CONTEXT = 'context'
    PREFER_VOCALIC = 'preferVocalic'
    PREFER_CONSONANT = 'preferConsonant'
    context = CONTEXT
    preferVocalic = PREFER_VOCALIC
    preferConsonant = PREFER_CONSONANT


@dataclass(frozen=True, slots=True)
class IastToGujaratiOptions:
    profile: GujaratiRomanizationProfile = GujaratiRomanizationProfile.EXTENDED_INDIC
    unknown_latin_policy: IastToGujaratiUnknownLatinPolicy = (
        IastToGujaratiUnknownLatinPolicy.PASS_THROUGH
    )
    digit_policy: IastToGujaratiDigitPolicy = IastToGujaratiDigitPolicy.PRESERVE_ASCII
    punctuation_policy: IastToGujaratiPunctuationPolicy = IastToGujaratiPunctuationPolicy.PRESERVE
    om_policy: IastToGujaratiOmPolicy = IastToGujaratiOmPolicy.TRANSLITERATE_LETTERS
    ambiguous_l_policy: IastToGujaratiAmbiguousLPolicy = IastToGujaratiAmbiguousLPolicy.CONTEXT
    accept_ascii_long_vowels: bool = False
    accept_plain_sh: bool = True
    accept_plain_x_as_kha: bool = True
    accept_w_as_va: bool = True
    preserve_vedic_accent_marks: bool = True
    collapse_whitespace: bool = False
    embed_exact_source_metadata: bool = False

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
    'a': 'અ',
    'ā': 'આ',
    'i': 'ઇ',
    'ī': 'ઈ',
    'u': 'ઉ',
    'ū': 'ઊ',
    'ṛ': 'ઋ',
    'ṝ': 'ૠ',
    'ḷ': 'ઌ',
    'ḹ': 'ૡ',
    'e': 'એ',
    'ē': 'એ',
    'ai': 'ઐ',
    'o': 'ઓ',
    'ō': 'ઓ',
    'au': 'ઔ',
    'ă': 'અ',
    'ĕ': 'ઍ',
    'ê': 'ઍ',
    'æ': 'ઍ',
    'ŏ': 'ઑ',
    'ô': 'ઑ',
    'oe': 'ઓએ',
    'ōe': 'ઓએ',
    'ooe': 'ઓએ',
    'aw': 'ઑ',
    'ue': 'ઉએ',
    'ūe': 'ઊએ',
    'uue': 'ઊએ',
}
_VOWEL_SIGNS = {
    'a': '',
    'ā': 'ા',
    'i': 'િ',
    'ī': 'ી',
    'u': 'ુ',
    'ū': 'ૂ',
    'ṛ': 'ૃ',
    'ṝ': 'ૄ',
    'ḷ': 'ૢ',
    'ḹ': 'ૣ',
    'e': 'ે',
    'ē': 'ે',
    'ai': 'ૈ',
    'o': 'ો',
    'ō': 'ો',
    'au': 'ૌ',
    'ă': '',
    'ĕ': 'ૅ',
    'ê': 'ૅ',
    'æ': 'ૅ',
    'ŏ': 'ૉ',
    'ô': 'ૉ',
    'oe': 'ોએ',
    'ōe': 'ોએ',
    'ooe': 'ોએ',
    'aw': 'ૉ',
    'ue': 'ુએ',
    'ūe': 'ૂએ',
    'uue': 'ૂએ',
}
_CONSONANTS = {
    'k': 'ક',
    'kh': 'ખ',
    'g': 'ગ',
    'gh': 'ઘ',
    'ṅ': 'ઙ',
    'c': 'ચ',
    'ch': 'છ',
    'j': 'જ',
    'jh': 'ઝ',
    'ñ': 'ઞ',
    'ṭ': 'ટ',
    'ṭh': 'ઠ',
    'ḍ': 'ડ',
    'ḍh': 'ઢ',
    'ṇ': 'ણ',
    't': 'ત',
    'th': 'થ',
    'd': 'દ',
    'dh': 'ધ',
    'n': 'ન',
    'ŋ': 'ન',
    'ƞ': 'ન',
    'p': 'પ',
    'ph': 'ફ',
    'b': 'બ',
    'bh': 'ભ',
    'm': 'મ',
    'y': 'ય',
    'r': 'ર',
    'l': 'લ',
    'v': 'વ',
    'w': 'વ',
    'ś': 'શ',
    'sh': 'શ',
    'ṣ': 'ષ',
    's': 'સ',
    'ṡ': 'સ',
    'h': 'હ',
    'ħ': 'હ',
    'ḫ': 'ખ઼',
    'ḷ': 'ળ',
    'ḻ': 'ળ',
    'ṟ': 'ર઼',
    'ṙ': 'ર',
    'ṉ': 'ન઼',
    'q': 'ક઼',
    'ḳ': 'ક઼',
    'ḵh': 'ખ઼',
    'x': 'ખ઼',
    'ġ': 'ગ઼',
    'z': 'જ઼',
    'ż': 'જ઼',
    'ẓ': 'જ઼',
    'ṛ': 'ડ઼',
    'ṛh': 'ઢ઼',
    'f': 'ફ઼',
    'ẏ': 'ય઼',
    'ž': 'જ઼',
    'zh': 'ૹ',
    'ǧ': 'ગ઼',
    'gg': 'ગ઼',
    'jj': 'જ઼',
    'ddd': 'ડ઼',
    'ɗ': 'ડ઼',
    'bb': 'બ઼',
    'ɓ': 'બ઼',
    'ḍḍ': 'ડ઼',
    'yy': 'ય઼',
    'ʔ': 'ઽ',
    'ṯ': 'ત઼',
    'ḏ': 'દ઼',
    'ẖ': 'હ઼',
    's̱': 'સ઼',
    'ẕ': 'જ઼',
    'g̱': 'ગ઼',
    'ḵ': 'ખ઼',
}
_SIGNS = {
    'm̐': 'ᳪ',
    '̃': 'ઁ',
    '\u0310': 'ઁ',
    'ṃ': 'ં',
    'ṁ': 'ં',
    'ḥ': 'ઃ',
    "'": 'ઽ',
    '‘': 'ઽ',
    '’': 'ઽ',
    'ʼ': 'ઽ',
    '\u0301': '॑',
    '\u0300': '॒',
    '\u030d': '॑',
    '\u030e': '᳚',
    '\u0302': '᳚',
    '\u0320': '॒',
    '\u0afa': '\u0afa',
    '\u0afb': '\u0afb',
    '\u0afc': '\u0afc',
    '\u0afd': '\u0afd',
    '\u0afe': '\u0afe',
    '\u0aff': '\u0aff',
    '\u0b70': '૰',
    '\u0af1': '૱',
}
_DIGITS = {str(i): chr(0x0AE6 + i) for i in range(10)}
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
    virama='્',
    om_sign='ૐ',
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
_CONVERTER.default_options_factory = IastToGujaratiOptions


def to_gujarati_from_iast(text: str, options: IastToGujaratiOptions | None = None) -> str:
    return _CONVERTER.convert(text, options or IastToGujaratiOptions())


def toGujaratiFromIast(text: str, options: IastToGujaratiOptions | None = None) -> str:
    return to_gujarati_from_iast(text, options)


class IastToGujaratiString(str):
    def to_gujarati_from_iast(self, options: IastToGujaratiOptions | None = None) -> str:
        return to_gujarati_from_iast(str(self), options)

    def toGujaratiFromIast(self, options: IastToGujaratiOptions | None = None) -> str:
        return self.to_gujarati_from_iast(options)


__all__ = [
    'GujaratiRomanizationProfile',
    'IastToGujaratiAmbiguousLPolicy',
    'IastToGujaratiDigitPolicy',
    'IastToGujaratiOmPolicy',
    'IastToGujaratiOptions',
    'IastToGujaratiPunctuationPolicy',
    'IastToGujaratiString',
    'IastToGujaratiUnknownLatinPolicy',
    'RomanizationProfile',
    'toGujaratiFromIast',
    'to_gujarati_from_iast',
]
