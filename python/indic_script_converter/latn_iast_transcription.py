from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import re

from .transliteration_core import (
    UnicodeNormalizationForm,
    is_encoded_vedic_mark,
    is_unicode_combining_mark,
    normalize_unicode,
)


class FinalAPolicy(str, Enum):
    KEEP = 'keep'
    DROP = 'drop'
    SMART = 'smart'
    keep = KEEP
    drop = DROP
    smart = SMART


class JnaPolicy(str, Enum):
    GYA = 'gya'
    JNYA = 'jnya'
    JNA = 'jna'
    gya = GYA
    jnya = JNYA
    jna = JNA


class NyaPolicy(str, Enum):
    NA = 'na'
    NYA = 'nya'
    GNA = 'gna'
    na = NA
    nya = NYA
    gna = GNA


class PlainEnglishRomanizationProfile(str, Enum):
    STRICT_IAST = 'strictIast'
    EXTENDED_INDIC = 'extendedIndic'
    HUNTERIAN = 'hunterian'
    strictIast = STRICT_IAST
    extendedIndic = EXTENDED_INDIC
    hunterian = HUNTERIAN


RomanizationProfile = PlainEnglishRomanizationProfile


class GlottalStopPolicy(str, Enum):
    REMOVE = 'remove'
    APOSTROPHE = 'apostrophe'
    remove = REMOVE
    apostrophe = APOSTROPHE


@dataclass(frozen=True, slots=True)
class IastPlainEnglishOptions:
    final_a: FinalAPolicy = FinalAPolicy.SMART
    jna: JnaPolicy = JnaPolicy.GYA
    nya: NyaPolicy = NyaPolicy.NA
    profile: PlainEnglishRomanizationProfile = PlainEnglishRomanizationProfile.EXTENDED_INDIC
    glottal_stop: GlottalStopPolicy = GlottalStopPolicy.REMOVE
    convert_c_to_ch: bool = True
    assimilate_anusvara: bool = True
    remove_avagraha: bool = True
    collapse_whitespace: bool = False
    enable_internal_schwa_syncope: bool = False
    use_w_for_v_after_consonants: bool = False
    preserve_vedic_accent_marks: bool = False
    keep_final_a_for_words: frozenset[str] = field(default_factory=frozenset)

    @property
    def finalA(self):
        return self.final_a

    @property
    def glottalStop(self):
        return self.glottal_stop

    @property
    def convertCToCh(self):
        return self.convert_c_to_ch

    @property
    def assimilateAnusvara(self):
        return self.assimilate_anusvara

    @property
    def removeAvagraha(self):
        return self.remove_avagraha

    @property
    def collapseWhitespace(self):
        return self.collapse_whitespace

    @property
    def enableInternalSchwaSyncope(self):
        return self.enable_internal_schwa_syncope

    @property
    def useWForVAfterConsonants(self):
        return self.use_w_for_v_after_consonants

    @property
    def preserveVedicAccentMarks(self):
        return self.preserve_vedic_accent_marks

    @property
    def keepFinalAForWords(self):
        return self.keep_final_a_for_words


class _Seg:
    __slots__ = ('is_vowel', 'text')

    def __init__(self, text: str, is_vowel: bool):
        self.text = text
        self.is_vowel = is_vowel


class _IastPlainEnglish:
    _avagraha_chars = re.compile(r'[ऽ’‘ʼʹ]')
    _inner_apostrophe = re.compile(
        r"([A-Za-z\u00C0-\u00FF\u0100-\u024F\u0250-\u02FF\u1E00-\u1EFF])'(?=[A-Za-z\u00C0-\u00FF\u0100-\u024F\u0250-\u02FF\u1E00-\u1EFF])"
    )
    _vowels = {'a', 'e', 'i', 'o', 'u'}
    _ph_chh = '\ue010'
    _ph_chh_cap = '\ue011'
    _ph_chh_all = '\ue012'

    @classmethod
    def convert(cls, input_text: str, options: IastPlainEnglishOptions) -> str:
        if not input_text:
            return input_text
        text = input_text
        if options.remove_avagraha:
            text = cls._avagraha_chars.sub('', text)
            text = cls._inner_apostrophe.sub(lambda m: m.group(1), text)
        out = []
        i = 0
        while i < len(text):
            ch = text[i]
            if not options.preserve_vedic_accent_marks and is_encoded_vedic_mark(ch):
                i += 1
                continue
            if cls._is_latin_char(ch):
                start = i
                i += 1
                while i < len(text) and cls._is_latin_char(text[i]):
                    i += 1
                out.append(cls._convert_latin_word(text[start:i], options))
                continue
            out.append(ch)
            i += 1
        result = ''.join(out)
        if options.collapse_whitespace:
            result = re.sub(r'\s+', ' ', result).strip()
        return result

    @staticmethod
    def _is_latin_char(ch: str) -> bool:
        cp = ord(ch)
        return (
            0x41 <= cp <= 0x5A
            or 0x61 <= cp <= 0x7A
            or 0x00C0 <= cp <= 0x00FF
            or 0x0100 <= cp <= 0x024F
            or 0x0250 <= cp <= 0x02FF
            or 0x1E00 <= cp <= 0x1EFF
            or is_unicode_combining_mark(ch)
        )

    @classmethod
    def _convert_latin_word(cls, word: str, options: IastPlainEnglishOptions) -> str:
        if not word:
            return word
        is_all_upper = cls._is_all_upper_word(word)
        ends_in_short_a = word[-1] in {'a', 'A'}
        keep_final_noisy = cls._contains_noisy_latin_letter(word)
        w = normalize_unicode(word, UnicodeNormalizationForm.NFD)
        w = cls._apply_profile(w, options.profile)
        w = cls._apply_jna(w, options.jna)
        if options.assimilate_anusvara:
            w = cls._resolve_anusvara(w)
        else:
            w = re.sub('[ṃṁ]', 'm', w)
            w = re.sub('[ṂṀ]', 'M', w)
        if options.convert_c_to_ch:
            w = cls._expand_c(w)
        if options.enable_internal_schwa_syncope and len(w) > 5:
            w = cls._apply_internal_schwa_syncope(w)
        w = cls._fold_letters(
            w, options.glottal_stop, options.nya, options.preserve_vedic_accent_marks
        )
        if (
            options.use_w_for_v_after_consonants
            or options.profile is PlainEnglishRomanizationProfile.HUNTERIAN
        ):
            w = re.sub(
                r'([^aeiou\s])v([aāiīuūeēoō])',
                lambda m: m.group(1) + 'w' + m.group(2),
                w,
                flags=re.I,
            )
        if options.final_a is not FinalAPolicy.KEEP and ends_in_short_a and not keep_final_noisy:
            w = cls._apply_final_a_rule(w, options)
        if is_all_upper:
            w = w.upper()
        return w

    @staticmethod
    def _is_all_upper_word(word: str) -> bool:
        cased = upper = 0
        for ch in word:
            if is_unicode_combining_mark(ch):
                continue
            if ch.upper() == ch.lower():
                continue
            cased += 1
            if ch == ch.upper():
                upper += 1
        return cased > 1 and cased == upper

    @staticmethod
    def _contains_noisy_latin_letter(word: str) -> bool:
        return any(
            ch
            in {'ç', 'Ç', 'ã', 'Ã', 'ï', 'Ï', 'œ', 'Œ', 'ø', 'Ø', 'ł', 'Ł', 'ß', 'þ', 'Þ', 'ð', 'Ð'}
            for ch in word
        )

    @classmethod
    def _apply_profile(cls, word: str, profile: PlainEnglishRomanizationProfile) -> str:
        word = (
            word.replace('x', 'kh')
            .replace('X', 'Kh')
            .replace('h\u032e', 'kh')
            .replace('H\u032e', 'Kh')
        )
        if profile is PlainEnglishRomanizationProfile.STRICT_IAST:
            return word
        word = re.sub(r'ṛh(?=[aāiīuūeêĕoôŏy])', 'rh', word)
        word = re.sub(r'Ṛh(?=[aāiīuūeêĕoôŏy])', 'Rh', word)
        word = re.sub(r'ṛ(?=[aāiīuūeêĕoôŏy])', 'r', word)
        word = re.sub(r'Ṛ(?=[aāiīuūeêĕoôŏy])', 'R', word)
        if profile is PlainEnglishRomanizationProfile.HUNTERIAN:
            clsset = r'[kKgGcCjJtTdDpPbBsSśŚṣṢhH]'
            word = re.sub(r'ḥ(' + clsset + r')', lambda m: m.group(1), word)
            word = re.sub(r'Ḥ(' + clsset + r')', lambda m: m.group(1), word)
            word = re.sub('h\u0323(' + clsset + r')', lambda m: m.group(1), word)
            word = re.sub('H\u0323(' + clsset + r')', lambda m: m.group(1), word)
        return word

    @classmethod
    def _apply_internal_schwa_syncope(cls, word: str) -> str:
        if len(word) <= 5:
            return word
        segments = []
        current = []
        parsing_vowel = None
        for ch in word:
            mark = 0x0300 <= ord(ch) <= 0x036F
            is_v = (
                parsing_vowel if mark and parsing_vowel is not None else cls._is_iast_vowel_char(ch)
            )
            if parsing_vowel is None:
                parsing_vowel = is_v
                current = [ch]
            elif parsing_vowel == is_v:
                current.append(ch)
            else:
                segments.append(_Seg(''.join(current), bool(parsing_vowel)))
                current = [ch]
                parsing_vowel = is_v
        if current and parsing_vowel is not None:
            segments.append(_Seg(''.join(current), bool(parsing_vowel)))
        vis = [i for i, s in enumerate(segments) if s.is_vowel]
        if len(vis) < 3:
            return word
        for k in range(len(vis) - 2, 0, -1):
            idx = vis[k]
            cand = segments[idx]
            if not cls._is_short_a_schwa(cand.text) or idx - 1 < 0 or idx + 1 >= len(segments):
                continue
            prev = segments[idx - 1]
            nxt = segments[idx + 1]
            if cls._count_consonants(prev.text) + cls._count_consonants(nxt.text) > 2:
                continue
            cand.text = ''
            prev.text += nxt.text
            nxt.text = ''
        return ''.join(s.text for s in segments)

    @staticmethod
    def _is_iast_vowel_char(ch: str) -> bool:
        return ch.lower() in {'a', 'ā', 'i', 'ī', 'u', 'ū', 'e', 'o', 'ṛ', 'ṝ', 'ḷ', 'ḹ', 'æ', 'œ'}

    @staticmethod
    def _is_short_a_schwa(text: str) -> bool:
        return re.sub(r'[\u0300-\u036F]', '', text).lower() == 'a'

    @staticmethod
    def _count_consonants(cluster: str) -> int:
        s = cluster.lower()
        for a, b in [
            ('kh', 'K'),
            ('gh', 'G'),
            ('ch', 'C'),
            ('jh', 'J'),
            ('th', 'T'),
            ('dh', 'D'),
            ('ph', 'P'),
            ('bh', 'B'),
            ('sh', 'S'),
            ('zh', 'Z'),
        ]:
            s = s.replace(a, b)
        return len(s)

    @staticmethod
    def _apply_jna(word: str, policy: JnaPolicy) -> str:
        reps = {
            JnaPolicy.GYA: {
                'jñ': 'gy',
                'Jñ': 'Gy',
                'JÑ': 'GY',
                'jÑ': 'gy',
                'jn\u0303': 'gy',
                'Jn\u0303': 'Gy',
                'JN\u0303': 'GY',
            },
            JnaPolicy.JNYA: {
                'jñ': 'jny',
                'Jñ': 'Jny',
                'JÑ': 'JNY',
                'jÑ': 'jny',
                'jn\u0303': 'jny',
                'Jn\u0303': 'Jny',
                'JN\u0303': 'JNY',
            },
            JnaPolicy.JNA: {
                'jñ': 'jn',
                'Jñ': 'Jn',
                'JÑ': 'JN',
                'jÑ': 'jn',
                'jn\u0303': 'jn',
                'Jn\u0303': 'Jn',
                'JN\u0303': 'JN',
            },
        }[policy]
        for k, v in reps.items():
            word = word.replace(k, v)
        return word

    _anusvara_pattern = re.compile(r'([mM](?:\u0307|\u0323|\u0310)|[ṃṁṂṀ])(.?)', re.S)

    @classmethod
    def _resolve_anusvara(cls, word: str) -> str:
        def repl(m: re.Match[str]) -> str:
            marker = m.group(1)
            nxt = m.group(2) or None
            is_upper = marker == marker.upper() and marker != marker.lower()
            if m.start() == 0 and '\u0310' in marker:
                return ('M' if is_upper else 'm') + (nxt or '')
            nasal = cls._anusvara_nasal(nxt)
            if is_upper:
                nasal = nasal.upper()
            return nasal + (nxt or '')

        return cls._anusvara_pattern.sub(repl, word)

    @staticmethod
    def _anusvara_nasal(nxt: str | None) -> str:
        if nxt is None:
            return 'm'
        lower = nxt.lower()
        if lower in {'k', 'g', 'c', 'j', 'ṭ', 'ḍ', 't', 'd', 'n', 'ṇ', 'ṅ', 'ñ'}:
            return 'n'
        if lower in {'p', 'b', 'm'}:
            return 'm'
        if lower in {'ś', 'ṣ', 's', 'h', 'y', 'v'}:
            return 'n'
        return 'm'

    @classmethod
    def _expand_c(cls, word: str) -> str:
        w = (
            word.replace('ch', cls._ph_chh)
            .replace('Ch', cls._ph_chh_cap)
            .replace('CH', cls._ph_chh_all)
        )
        w = re.sub('[cC]', lambda m: 'Ch' if m.group(0) == 'C' else 'ch', w)
        return (
            w.replace(cls._ph_chh, 'chh')
            .replace(cls._ph_chh_cap, 'Chh')
            .replace(cls._ph_chh_all, 'CHH')
        )

    @staticmethod
    def _is_english_vowel(ch: str | None) -> bool:
        return ch is not None and ch.lower() in {'a', 'e', 'i', 'o', 'u'}

    @staticmethod
    def _is_vedic_accent_rune(cp: int) -> bool:
        return is_encoded_vedic_mark(cp) or cp in {
            0x0301,
            0x0300,
            0x030D,
            0x030E,
            0x0302,
            0x0329,
            0x0331,
            0x0320,
        }

    @classmethod
    def _fold_letters(
        cls, word: str, glottal: GlottalStopPolicy, nya: NyaPolicy, preserve_vedic: bool
    ) -> str:
        out = []
        i = 0
        prev = None
        while i < len(word):
            base = word[i]
            i += 1
            marks = []
            while i < len(word) and is_unicode_combining_mark(word[i]):
                marks.append(ord(word[i]))
                i += 1
            next_base = word[i] if i < len(word) else None
            folded = cls._fold_marked_base(base, marks, glottal, nya, next_base, prev)
            if preserve_vedic and cls._is_vowel_output(folded):
                folded += ''.join(chr(cp) for cp in marks if cls._is_vedic_accent_rune(cp))
            out.append(folded)
            prev = folded[-1] if folded else None
        return ''.join(out)

    @classmethod
    def _is_vowel_output(cls, folded: str) -> bool:
        return bool(folded) and (folded[0].lower() in cls._vowels or folded.lower() in {'ri', 'li'})

    @classmethod
    def _fold_marked_base(
        cls,
        base: str,
        marks: list[int],
        glottal: GlottalStopPolicy,
        nya: NyaPolicy,
        next_base: str | None,
        prev: str | None,
    ) -> str:
        if not marks:
            return cls._fold_precomposed(base, glottal, nya, next_base, prev)
        folded_base = cls._fold_precomposed(base, glottal, nya, next_base, prev)
        lower = folded_base.lower()
        is_upper = folded_base == folded_base.upper() and folded_base != folded_base.lower()
        has_dot_below = 0x0323 in marks
        has_ring_below = 0x0325 in marks
        has_dot_above = 0x0307 in marks
        has_acute = 0x0301 in marks
        has_nasal = 0x0303 in marks or 0x0310 in marks
        out = None
        if lower in cls._vowels:
            out = lower
            if has_nasal and next_base is None and cls._is_long_a(base, marks):
                out = 'aa'
            if has_nasal and cls._nasalized_vowel_needs_n(next_base, prev):
                out += 'n'
        elif lower == 'r':
            if has_ring_below:
                out = 'ri'
            elif has_dot_below:
                out = 'r' if cls._is_english_vowel(prev) else 'ri'
        elif lower == 'l' and (has_dot_below or has_ring_below):
            out = 'l' if cls._is_vowel_base(next_base, prev) else 'li'
        elif lower == 's' and (has_acute or has_dot_below):
            out = 'sh'
        elif lower == 't' and has_dot_below:
            out = 't'
        elif lower == 'd' and has_dot_below:
            out = 'd'
        elif lower == 'n':
            if has_dot_above or has_dot_below:
                out = 'n'
            if has_nasal:
                out = cls._fold_nya(nya)
        elif lower == 'h' and has_dot_below:
            out = 'h'
        elif lower == 'm' and (has_dot_above or has_dot_below or has_nasal):
            out = 'm'
        out = out if out is not None else cls._fold_precomposed(base, glottal, nya, next_base, prev)
        return cls._match_case(is_upper, out)

    @classmethod
    def _nasalized_vowel_needs_n(cls, next_base: str | None, prev: str | None) -> bool:
        if next_base is None:
            return False
        nxt = cls._fold_precomposed(
            next_base, GlottalStopPolicy.REMOVE, NyaPolicy.NA, None, prev
        ).lower()
        if not nxt or nxt in cls._vowels:
            return False
        return nxt[0] not in {'m', 'n'}

    @staticmethod
    def _is_long_a(base: str, marks: list[int]) -> bool:
        return base in {'ā', 'Ā'} or (base.lower() == 'a' and 0x0304 in marks)

    @classmethod
    def _is_vowel_base(cls, base: str | None, prev: str | None) -> bool:
        if base is None:
            return False
        folded = cls._fold_precomposed(
            base, GlottalStopPolicy.REMOVE, NyaPolicy.NA, None, prev
        ).lower()
        return bool(folded) and folded[0] in cls._vowels

    @staticmethod
    def _fold_nya(policy: NyaPolicy) -> str:
        return {NyaPolicy.NA: 'n', NyaPolicy.NYA: 'ny', NyaPolicy.GNA: 'gn'}[policy]

    @staticmethod
    def _match_case(is_upper: bool, lower: str) -> str:
        return lower[:1].upper() + lower[1:] if is_upper and lower else lower

    @classmethod
    def _fold_precomposed(
        cls,
        ch: str,
        glottal: GlottalStopPolicy,
        nya: NyaPolicy,
        next_base: str | None = None,
        prev: str | None = None,
    ) -> str:
        groups = {
            'a': set('ăàáâãäå'),
            'A': set('ĂÀÁÂÃÄÅ'),
            'i': set('ìíîï'),
            'I': set('ÌÍÎÏ'),
            'e': set('ĕěēèéêë'),
            'E': set('ĔĚĒÈÉÊË'),
            'o': set('ŏòóôõöōø'),
            'O': set('ŌŎÒÓÔÕÖØ'),
            'u': set('ùúûü'),
            'U': set('ÙÚÛÜ'),
        }
        if ch == 'ā':
            return 'a'
        if ch == 'Ā':
            return 'A'
        if ch == 'ī':
            return 'i'
        if ch == 'Ī':
            return 'I'
        if ch == 'ū':
            return 'u'
        if ch == 'Ū':
            return 'U'
        for out, chars in groups.items():
            if ch in chars:
                return out
        if ch in {'Æ', 'Ǣ'}:
            return 'Ae'
        if ch == 'Œ':
            return 'Oe'
        if ch in {'æ', 'ǣ'}:
            return 'ae'
        if ch == 'œ':
            return 'oe'
        if ch in {'ṛ', 'ṝ'}:
            return 'r' if cls._is_english_vowel(prev) else 'ri'
        if ch in {'Ṛ', 'Ṝ'}:
            return 'R' if cls._is_english_vowel(prev) else 'Ri'
        if ch == 'ḷ':
            return 'l' if cls._is_vowel_base(next_base, prev) else 'li'
        if ch == 'Ḷ':
            return 'L' if cls._is_vowel_base(next_base, prev) else 'Li'
        if ch == 'ḹ':
            return 'li'
        if ch == 'Ḹ':
            return 'Li'
        table = {
            'ṅ': 'n',
            'Ṅ': 'N',
            'ŋ': 'n',
            'Ŋ': 'N',
            'ƞ': 'n',
            'Ƞ': 'N',
            'ṇ': 'n',
            'Ṇ': 'N',
            'ṉ': 'n',
            'Ṉ': 'N',
            'ṙ': 'r',
            'Ṙ': 'R',
            'ç': 'c',
            'Ç': 'C',
            'ł': 'l',
            'Ł': 'L',
            'ß': 'ss',
            'þ': 'th',
            'Þ': 'Th',
            'ð': 'd',
            'Ð': 'D',
            'ṭ': 't',
            'Ṭ': 'T',
            'ṯ': 't',
            'Ṯ': 'T',
            'ḳ': 'k',
            'ḵ': 'k',
            'Ḳ': 'K',
            'Ḵ': 'K',
            'ḍ': 'd',
            'Ḍ': 'D',
            'ḏ': 'd',
            'Ḏ': 'D',
            'ś': 'sh',
            'Ś': 'Sh',
            'ṣ': 'sh',
            'Ṣ': 'Sh',
            'ṡ': 's',
            'Ṡ': 'S',
            'ž': 'zh',
            'Ž': 'Zh',
            'ź': 'z',
            'ż': 'z',
            'Ź': 'Z',
            'Ż': 'Z',
            'ẓ': 'z',
            'Ẓ': 'Z',
            'ẏ': 'y',
            'Ẏ': 'Y',
            'ḻ': 'l',
            'Ḻ': 'L',
            'ṟ': 'r',
            'Ṟ': 'R',
            'ġ': 'g',
            'ǧ': 'g',
            'Ġ': 'G',
            'Ǧ': 'G',
            'ɓ': 'b',
            'Ɓ': 'B',
            'ɗ': 'd',
            'Ɗ': 'D',
            'ḥ': 'h',
            'Ḥ': 'H',
            'ħ': 'h',
            'ḫ': 'h',
            'ẖ': 'h',
            'Ħ': 'H',
            'Ḫ': 'H',
            'H̱': 'H',
            'ṃ': 'm',
            'Ṃ': 'M',
            'ṁ': 'm',
            'Ṁ': 'M',
        }
        if ch == 'ñ':
            return cls._fold_nya(nya)
        if ch == 'Ñ':
            return cls._match_case(True, cls._fold_nya(nya))
        if ch == 'ʔ':
            return '' if glottal is GlottalStopPolicy.REMOVE else "'"
        return table.get(ch, ch)

    @classmethod
    def _apply_final_a_rule(cls, word: str, options: IastPlainEnglishOptions) -> str:
        if len(word) <= 2:
            return word
        lower = word.lower()
        if not lower.endswith('a'):
            return word
        if lower[-2] in cls._vowels:
            return word
        if options.final_a is FinalAPolicy.DROP:
            return word[:-1]
        if lower in options.keep_final_a_for_words:
            return word
        if lower.endswith(('moksha', 'vriksha', 'ashvattha', 'simha', 'sinha')):
            return word
        if lower.endswith('ya'):
            return word
        if lower.endswith('ha') and len(lower) >= 3 and lower[-3] in cls._vowels:
            return word
        without = word[:-1]
        return word if cls._leaves_awkward_final_cluster(without) else without

    @classmethod
    def _leaves_awkward_final_cluster(cls, word: str) -> bool:
        normalized = cls._normalize_final_cluster(word.lower())
        positions = [normalized.rfind(v) for v in 'aeiou']
        last = max(positions)
        suffix = normalized[last + 1 :] if last >= 0 else normalized
        if len(suffix) <= 1:
            return False
        if suffix == 'ng':
            return False
        if len(suffix) >= 3:
            return True
        bad = {
            'tr',
            'dr',
            'gy',
            'kr',
            'gr',
            'jr',
            'rm',
            'hm',
            'ry',
            'ly',
            'ny',
            'my',
            'sv',
            'dv',
            'tv',
            'pn',
            'bn',
            'kn',
            'gn',
            'km',
            'gm',
            'pm',
            'bm',
            'tm',
            'dm',
            'dD',
            'hX',
        }
        if suffix in bad:
            return True
        return re.search(r'[CKSDTGHPBX][mnlrvy]$', suffix) is not None

    @staticmethod
    def _normalize_final_cluster(word: str) -> str:
        for a, b in [
            ('ksh', 'K'),
            ('chh', 'H'),
            ('ch', 'C'),
            ('sh', 'S'),
            ('gh', 'G'),
            ('dh', 'D'),
            ('th', 'T'),
            ('ph', 'P'),
            ('bh', 'B'),
            ('kh', 'X'),
        ]:
            word = word.replace(a, b)
        return word


def to_plain_english_from_iast(text: str, options: IastPlainEnglishOptions | None = None) -> str:
    return _IastPlainEnglish.convert(text, options or IastPlainEnglishOptions())


def toPlainEnglishFromIast(text: str, options: IastPlainEnglishOptions | None = None) -> str:
    return to_plain_english_from_iast(text, options)


class IastToPlainEnglish(str):
    def to_plain_english_from_iast(self, options: IastPlainEnglishOptions | None = None) -> str:
        return to_plain_english_from_iast(str(self), options)

    def toPlainEnglishFromIast(self, options: IastPlainEnglishOptions | None = None) -> str:
        return self.to_plain_english_from_iast(options)


__all__ = [
    'FinalAPolicy',
    'GlottalStopPolicy',
    'IastPlainEnglishOptions',
    'IastToPlainEnglish',
    'JnaPolicy',
    'NyaPolicy',
    'PlainEnglishRomanizationProfile',
    'RomanizationProfile',
    'toPlainEnglishFromIast',
    'to_plain_english_from_iast',
]
