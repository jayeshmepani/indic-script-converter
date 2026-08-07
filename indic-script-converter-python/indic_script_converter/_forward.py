from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
import re

from .transliteration_core import (
    UnicodeNormalizationForm,
    embed_exact_source_metadata,
    is_encoded_vedic_mark,
    is_unicode_combining_mark,
    normalize_unicode,
)


@dataclass(frozen=True, slots=True)
class ForwardScriptConfig:
    virama: str
    om_sign: str
    danda: str
    double_danda: str
    dotted_circle: str
    independent_vowels: Mapping[str, str]
    vowel_signs: Mapping[str, str]
    consonants: Mapping[str, str]
    signs: Mapping[str, str]
    digits: Mapping[str, str]
    strict_iast_vowels: frozenset[str]
    strict_iast_consonants: frozenset[str]


class ForwardConverter:
    def __init__(self, config: ForwardScriptConfig) -> None:
        self.c = config
        self.vowel_keys = self._sort_keys(config.vowel_signs)
        self.independent_vowel_keys = self._sort_keys(config.independent_vowels)
        self.consonant_keys = self._sort_keys(config.consonants)
        self.sign_keys = self._sort_keys(config.signs)

    @staticmethod
    def _sort_keys(mapping: Mapping[str, str]) -> tuple[str, ...]:
        return tuple(sorted(mapping, key=len, reverse=True))

    @staticmethod
    def _enum_value(value: object) -> str:
        return str(getattr(value, 'value', value))

    def convert(self, input_text: str, options: object) -> str:
        if not input_text:
            return input_text

        text = input_text
        if self._enum_value(options.om_policy) == 'useOmSign':
            text = self._protect_om_words(text)

        out: list[str] = []
        i = 0
        while i < len(text):
            ch = text[i]
            cp = ord(ch)

            if not options.preserve_vedic_accent_marks and is_encoded_vedic_mark(cp):
                i += 1
                continue

            if ch == '\ue100':
                out.append(self.c.om_sign)
                i += 1
                continue

            if self._is_latin_char(ch):
                start = i
                i += 1
                while i < len(text) and self._is_latin_char(text[i]):
                    i += 1
                token = text[start:i]

                idx = start - 1
                while idx >= 0 and text[idx] in ' \t\n\r':
                    idx -= 1
                while idx >= 0 and is_unicode_combining_mark(text[idx]):
                    idx -= 1
                preceded_by_vowel = idx >= 0 and self._starts_with_vowel(text, idx)
                out.append(self._convert_latin_word(token, options, preceded_by_vowel))
                continue

            if self._enum_value(options.digit_policy) == 'convertToScript' and ch in self.c.digits:
                out.append(self.c.digits[ch])
            elif self._enum_value(options.punctuation_policy) == 'indicDanda' and ch in '.|':
                if ch == '|':
                    if i + 1 < len(text) and text[i + 1] == '|':
                        out.append(self.c.double_danda)
                        i += 1
                    else:
                        out.append(self.c.danda)
                else:
                    dot_count = 1
                    while i + dot_count < len(text) and text[i + dot_count] == '.':
                        dot_count += 1
                    if dot_count >= 3:
                        out.append('.' * dot_count)
                        i += dot_count - 1
                    else:
                        after_idx = i + dot_count
                        is_boundary = after_idx >= len(text) or text[after_idx] in ' \n\r\t'
                        if is_boundary:
                            out.append(self.c.double_danda if dot_count == 2 else self.c.danda)
                        else:
                            out.append('.' * dot_count)
                        i += dot_count - 1
            else:
                out.append(ch)
            i += 1

        result = ''.join(out)
        if options.collapse_whitespace:
            result = re.sub(r'\s+', ' ', result).strip()
        if options.embed_exact_source_metadata:
            return embed_exact_source_metadata(result, input_text)
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
            or cp in {0x27, 0x2018, 0x2019, 0x02BC}
        )

    @staticmethod
    def _is_alphabetic_latin_char(ch: str) -> bool:
        cp = ord(ch)
        return (
            0x41 <= cp <= 0x5A
            or 0x61 <= cp <= 0x7A
            or 0x00C0 <= cp <= 0x00FF
            or 0x0100 <= cp <= 0x024F
            or 0x0250 <= cp <= 0x02FF
            or 0x1E00 <= cp <= 0x1EFF
        )

    def _convert_latin_word(self, word: str, options: object, preceded_by_vowel: bool) -> str:
        text = self._normalize_and_lowercase(word, options)
        out: list[str] = []
        i = 0
        pending_consonant = False
        after_vowel = False
        deferred_accents: list[str] = []

        while i < len(text):
            ch = text[i]

            if pending_consonant:
                vowel = self._match_contextual_vowel(text, i, options, True)
                if vowel is not None:
                    if vowel != 'a':
                        out.append(self.c.vowel_signs[vowel])
                    after_vowel = True
                    if not self._next_is_visarga_or_anusvara(text, i + len(vowel)):
                        if deferred_accents:
                            out.extend(deferred_accents)
                            deferred_accents.clear()
                    i += len(vowel)
                    pending_consonant = False
                    continue

                sign = self._match_key(text, i, self.sign_keys)
                if sign is not None:
                    if sign in {"'", '‘', '’', 'ʼ'}:
                        if not self._is_avagraha_context(text, i, preceded_by_vowel):
                            out.append(sign)
                            i += len(sign)
                            pending_consonant = False
                            after_vowel = False
                            continue
                        if deferred_accents:
                            out.extend(deferred_accents)
                            deferred_accents.clear()

                    if self._is_vedic_accent(sign):
                        deferred_accents.append(self._get_script_sign(sign, options))
                        i += len(sign)
                        continue

                    if self._is_dependent_nasal_sign(sign):
                        extra = self._following_combining_marks(text, i + len(sign))
                        if extra:
                            accent_marks = self._vedic_accent_marks_to_script(extra, options)
                            if accent_marks is not None:
                                out.append(self._get_script_sign(sign, options))
                                if deferred_accents:
                                    out.extend(deferred_accents)
                                    deferred_accents.clear()
                                out.append(accent_marks)
                                i += len(sign) + len(extra)
                                pending_consonant = False
                                after_vowel = False
                                continue
                            out.append(self._get_script_sign(sign, options))
                            if deferred_accents:
                                out.extend(deferred_accents)
                                deferred_accents.clear()
                            out.append(extra)
                            i += len(sign) + len(extra)
                            pending_consonant = False
                            after_vowel = False
                            continue

                    out.append(self._get_script_sign(sign, options))
                    if sign == 'ḥ' or self._is_dependent_nasal_sign(sign):
                        if deferred_accents:
                            out.extend(deferred_accents)
                            deferred_accents.clear()
                    i += len(sign)
                    pending_consonant = False
                    after_vowel = False
                    continue

                next_consonant = self._match_contextual_consonant(text, i, options, True)
                if next_consonant is not None:
                    out.append(self.c.virama)
                    if deferred_accents:
                        out.extend(deferred_accents)
                        deferred_accents.clear()
                    pending_consonant = False
                    after_vowel = False
                    continue

                if is_unicode_combining_mark(ch):
                    if options.preserve_vedic_accent_marks or not is_encoded_vedic_mark(ch):
                        out.append(self._handle_unknown_mark(ch, options))
                    i += 1
                    continue

                out.append(self.c.virama)
                pending_consonant = False
                after_vowel = False
                continue

            sign = self._match_key(text, i, self.sign_keys)
            if sign is not None:
                if sign in {"'", '‘', '’', 'ʼ'}:
                    if not self._is_avagraha_context(text, i, preceded_by_vowel):
                        out.append(sign)
                        i += len(sign)
                        after_vowel = False
                        continue
                    if deferred_accents:
                        out.extend(deferred_accents)
                        deferred_accents.clear()

                if self._is_vedic_accent(sign):
                    deferred_accents.append(self._get_script_sign(sign, options))
                    i += len(sign)
                    continue

                if sign == 'ḥ' and not after_vowel:
                    out.append(self.c.consonants['h'])
                    i += len(sign)
                    pending_consonant = True
                    after_vowel = False
                    continue

                if self._is_dependent_nasal_sign(sign):
                    extra = self._following_combining_marks(text, i + len(sign))
                    if extra:
                        accent_marks = self._vedic_accent_marks_to_script(extra, options)
                        if accent_marks is not None:
                            out.append(self._get_script_sign(sign, options))
                            if deferred_accents:
                                out.extend(deferred_accents)
                                deferred_accents.clear()
                            out.append(accent_marks)
                            i += len(sign) + len(extra)
                            after_vowel = False
                            continue
                        if not after_vowel:
                            out.append(self.c.dotted_circle)
                        out.append(self._get_script_sign(sign, options))
                        out.append(extra)
                        i += len(sign) + len(extra)
                        after_vowel = False
                        continue
                    if not after_vowel:
                        out.append(self.c.dotted_circle)
                        out.append(self._get_script_sign(sign, options))
                        i += len(sign)
                        after_vowel = False
                        continue

                out.append(self._get_script_sign(sign, options))
                if sign == 'ḥ' or self._is_dependent_nasal_sign(sign):
                    if deferred_accents:
                        out.extend(deferred_accents)
                        deferred_accents.clear()
                    after_vowel = False
                i += len(sign)
                continue

            consonant = self._match_contextual_consonant(text, i, options, False)
            if consonant is not None:
                if deferred_accents:
                    out.extend(deferred_accents)
                    deferred_accents.clear()
                out.append(self.c.consonants[consonant])
                i += len(consonant)
                keeps_inherent_a = (
                    consonant in {'ṛ', 'ṛh'}
                    and self._enum_value(options.profile) != 'strictIast'
                    and not self._starts_with_vowel(text, i)
                )
                pending_consonant = not keeps_inherent_a
                after_vowel = keeps_inherent_a
                continue

            vowel = self._match_contextual_vowel(text, i, options, False)
            if vowel is not None:
                out.append(self.c.independent_vowels[vowel])
                after_vowel = True
                if not self._next_is_visarga_or_anusvara(text, i + len(vowel)):
                    if deferred_accents:
                        out.extend(deferred_accents)
                        deferred_accents.clear()
                i += len(vowel)
                continue

            if is_unicode_combining_mark(ch):
                if options.preserve_vedic_accent_marks or not is_encoded_vedic_mark(ch):
                    out.append(self._handle_unknown_mark(ch, options))
                i += 1
                continue

            out.append(self._handle_unknown_latin(ch, options))
            i += 1
            after_vowel = False

        if pending_consonant:
            out.append(self.c.virama)
        if deferred_accents:
            out.extend(deferred_accents)
        return ''.join(out)

    def _next_is_visarga_or_anusvara(self, text: str, start: int) -> bool:
        idx = start
        while idx < len(text):
            sign = self._match_key(text, idx, self.sign_keys)
            if sign is not None and self._is_vedic_accent(sign):
                idx += len(sign)
            else:
                break
        if idx < len(text):
            next_sign = self._match_key(text, idx, self.sign_keys)
            return next_sign in {'ḥ', 'ṃ', 'm̐', '\u0310'}
        return False

    def _match_contextual_vowel(
        self, text: str, i: int, options: object, pending_consonant: bool
    ) -> str | None:
        if i >= len(text):
            return None
        profile = self._enum_value(options.profile)

        l_match = self._match_l_variant(text, i)
        if l_match is not None:
            if profile == 'strictIast':
                return l_match
            if self._starts_with_vowel(text, i + len(l_match)):
                return None
            policy = self._enum_value(options.ambiguous_l_policy)
            if policy == 'preferVocalic':
                return l_match
            if policy == 'preferConsonant':
                return None
            if not self._starts_with_vowel(text, i + len(l_match)):
                return l_match
            return None

        r_match = self._match_r_variant(text, i)
        if r_match is not None:
            if profile == 'strictIast':
                return r_match
            if pending_consonant:
                return r_match
            if not self._starts_with_vowel(
                text, i + len(r_match)
            ) and not self._previous_starts_with_vowel(text, i):
                return r_match
            return None

        keys = self.vowel_keys if pending_consonant else self.independent_vowel_keys
        match = self._match_key(text, i, keys)
        if (
            match is not None
            and profile == 'strictIast'
            and self._enum_value(options.unknown_latin_policy) == 'throwError'
            and match not in self.c.strict_iast_vowels
        ):
            return None
        return match

    def _match_contextual_consonant(
        self, text: str, i: int, options: object, pending_consonant: bool
    ) -> str | None:
        if i >= len(text):
            return None
        match = self._match_key(text, i, self.consonant_keys)
        if match is None:
            return None

        profile = self._enum_value(options.profile)
        if profile == 'strictIast' and match not in self.c.strict_iast_consonants:
            return None

        if match in {'ṛ', 'ṛh'}:
            if profile == 'strictIast':
                return None
            if not self._starts_with_vowel(
                text, i + len(match)
            ) and not self._previous_starts_with_vowel(text, i):
                return None

        if match == 'ḷ':
            if profile == 'strictIast':
                return None
            if self._starts_with_vowel(text, i + 1):
                return 'ḷ'
            policy = self._enum_value(options.ambiguous_l_policy)
            if policy == 'preferConsonant':
                return 'ḷ'
            if policy == 'context' and self._starts_with_vowel(text, i + 1):
                return 'ḷ'
            return None

        if match == 'x' and not options.accept_plain_x_as_kha:
            return None
        if match == 'w' and not options.accept_w_as_va:
            return None
        if match in {'sh', 'zh'} and not options.accept_plain_sh:
            return None
        return match

    @staticmethod
    def _match_l_variant(text: str, i: int) -> str | None:
        if text.startswith('ḹ', i):
            return 'ḹ'
        if text.startswith('ḷ', i):
            return 'ḷ'
        return None

    @staticmethod
    def _match_r_variant(text: str, i: int) -> str | None:
        if text.startswith('ṝ', i):
            return 'ṝ'
        if text.startswith('ṛ', i):
            return 'ṛ'
        return None

    def _starts_with_vowel(self, text: str, i: int) -> bool:
        if i < 0 or i >= len(text):
            return False
        if (
            self._match_key(text, i, self.vowel_keys) is not None
            or self._match_key(text, i, self.independent_vowel_keys) is not None
        ):
            return True
        folded = self._normalize_and_lowercase(text[i : i + 12], self._default_options_factory())
        return (
            self._match_key(folded, 0, self.vowel_keys) is not None
            or self._match_key(folded, 0, self.independent_vowel_keys) is not None
        )

    def _default_options_factory(self) -> object:
        # Assigned by public module after constructing the converter.
        factory = getattr(self, 'default_options_factory', None)
        if factory is None:
            raise RuntimeError('Forward converter has no default options factory.')
        return factory()

    def _is_avagraha_context(self, text: str, i: int, preceded_by_vowel: bool) -> bool:
        if i >= len(text) - 1 or not self._is_alphabetic_latin_char(text[i + 1]):
            return False
        if i == 0:
            return preceded_by_vowel
        prev = i - 1
        while prev >= 0 and is_unicode_combining_mark(text[prev]):
            prev -= 1
        return prev >= 0 and self._starts_with_vowel(text, prev)

    def _previous_starts_with_vowel(self, text: str, i: int) -> bool:
        prev = i - 1
        while prev >= 0 and is_unicode_combining_mark(text[prev]):
            prev -= 1
        return prev >= 0 and self._starts_with_vowel(text, prev)

    @staticmethod
    def _match_key(text: str, i: int, keys: Sequence[str]) -> str | None:
        for key in keys:
            if text.startswith(key, i):
                return key
        return None

    def _normalize_and_lowercase(self, word: str, options: object) -> str:
        nfd = normalize_unicode(word, UnicodeNormalizationForm.NFD)
        out: list[str] = []
        i = 0
        while i < len(nfd):
            base = nfd[i]
            i += 1
            marks: list[int] = []
            while i < len(nfd) and is_unicode_combining_mark(nfd[i]):
                marks.append(ord(nfd[i]))
                i += 1
            out.append(self._fold_marked_base(base, marks, allow_compatibility_folding=True))
        s = ''.join(out).lower()
        if options.accept_ascii_long_vowels:
            s = (
                s.replace('aa', 'ā')
                .replace('ii', 'ī')
                .replace('uu', 'ū')
                .replace('rr', 'ṝ')
                .replace('ll', 'ḹ')
            )
        return s

    @staticmethod
    def _fold_marked_base(base: str, marks: list[int], *, allow_compatibility_folding: bool) -> str:
        folded_base = (
            ForwardConverter._fold_precomposed(base) if allow_compatibility_folding else base
        )
        lower = folded_base.lower()
        if not marks:
            return folded_base

        has_dot_below = 0x0323 in marks
        has_ring_below = 0x0325 in marks
        has_dot_above = 0x0307 in marks
        has_acute = 0x0301 in marks
        has_nasal = 0x0303 in marks or 0x0310 in marks
        has_macron = 0x0304 in marks
        has_line_below = 0x0331 in marks or 0x035F in marks
        has_breve_below = 0x032E in marks
        has_caron = 0x030C in marks

        out: str | None = None
        consumed: set[int] = set()

        def take(token: str, codes: Sequence[int]) -> None:
            nonlocal out
            out = token
            consumed.update(codes)

        line_below = [cp for cp in (0x0331, 0x035F) if cp in marks]

        if lower == 'r' and (has_dot_below or has_ring_below):
            take(
                'ṝ' if has_macron else 'ṛ',
                [
                    cp
                    for cp, ok in (
                        (0x0323, has_dot_below),
                        (0x0325, has_ring_below),
                        (0x0304, has_macron),
                    )
                    if ok
                ],
            )
        elif lower == 'r' and has_dot_above:
            take('ṙ', [0x0307])
        elif lower == 'r' and has_line_below:
            take('ṟ', line_below)
        elif lower == 'l' and (has_dot_below or has_ring_below):
            take(
                'ḹ' if has_macron else 'ḷ',
                [
                    cp
                    for cp, ok in (
                        (0x0323, has_dot_below),
                        (0x0325, has_ring_below),
                        (0x0304, has_macron),
                    )
                    if ok
                ],
            )
        elif lower == 'l' and (has_line_below or 0x0324 in marks):
            take('ḻ', line_below + ([0x0324] if 0x0324 in marks else []))
        elif lower == 'h' and has_breve_below:
            take('ḫ', [0x032E])
        elif lower == 'h' and has_dot_below:
            take('ḥ', [0x0323])
        elif lower == 'h' and has_line_below:
            take('ẖ', line_below)
        elif lower == 's' and has_dot_below:
            take('ṣ', [0x0323])
        elif lower == 's' and has_acute:
            take('ś', [0x0301])
        elif lower == 's' and has_dot_above:
            take('ṡ', [0x0307])
        elif lower == 's' and has_line_below:
            take('s̱', line_below)
        elif lower == 't' and has_dot_below:
            take('ṭ', [0x0323])
        elif lower == 't' and has_line_below:
            take('ṯ', line_below)
        elif lower == 'd' and has_dot_below:
            take('ḍ', [0x0323])
        elif lower == 'd' and has_line_below:
            take('ḏ', line_below)
        elif lower == 'n' and has_dot_below:
            take('ṇ', [0x0323])
        elif lower == 'n' and has_dot_above:
            take('ṅ', [0x0307])
        elif lower == 'n' and has_nasal:
            take('ñ', [cp for cp in (0x0303, 0x0310) if cp in marks])
        elif lower == 'n' and has_line_below:
            take('ṉ', line_below)
        elif lower == 'z' and has_dot_below:
            take('ẓ', [0x0323])
        elif lower == 'z' and has_caron:
            take('ž', [0x030C])
        elif lower == 'z' and has_dot_above:
            take('ż', [0x0307])
        elif lower == 'z' and has_line_below:
            take('ẕ', line_below)
        elif lower == 'k' and has_dot_below:
            take('ḳ', [0x0323])
        elif lower == 'k' and has_line_below:
            take('ḵ', line_below)
        elif lower == 'g' and has_caron:
            take('ǧ', [0x030C])
        elif lower == 'g' and has_dot_above:
            take('ġ', [0x0307])
        elif lower == 'g' and has_line_below:
            take('g̱', line_below)
        elif lower == 'm' and 0x0310 in marks:
            take('m̐', [0x0310])
        elif lower == 'm' and (has_dot_below or has_dot_above):
            take('ṃ', [cp for cp, ok in ((0x0323, has_dot_below), (0x0307, has_dot_above)) if ok])
        elif lower == 'y' and has_dot_above:
            take('ẏ', [0x0307])
        elif has_macron:
            token = {'a': 'ā', 'i': 'ī', 'u': 'ū', 'e': 'ē', 'o': 'ō'}.get(lower)
            if token:
                take(token, [0x0304])
        elif 0x0306 in marks:
            token = {'a': 'ă', 'e': 'ĕ', 'o': 'ŏ'}.get(lower)
            if token:
                take(token, [0x0306])
        elif 0x0302 in marks:
            token = {'e': 'ê', 'o': 'ô'}.get(lower)
            if token:
                take(token, [0x0302])

        return (out or folded_base) + ''.join(chr(cp) for cp in marks if cp not in consumed)

    @staticmethod
    def _fold_precomposed(ch: str) -> str:
        mapping = {
            'á': 'a\u0301',
            'à': 'a\u0300',
            'â': 'a',
            'ã': 'a',
            'ä': 'a',
            'å': 'a',
            'é': 'e\u0301',
            'è': 'e\u0300',
            'ë': 'e',
            'í': 'i\u0301',
            'ì': 'i\u0300',
            'î': 'i',
            'ï': 'i',
            'ó': 'o\u0301',
            'ò': 'o\u0300',
            'õ': 'o',
            'ö': 'o',
            'ø': 'o',
            'ú': 'u\u0301',
            'ù': 'u\u0300',
            'û': 'u',
            'ü': 'u',
            'ç': 's',
            'Ç': 'S',
            'ł': 'l',
            'Ł': 'L',
            'ß': 'ss',
            'þ': 'th',
            'Þ': 'Th',
            'ð': 'd',
            'Ð': 'D',
            'Æ': 'ae',
            'æ': 'ae',
            'Œ': 'oe',
            'œ': 'oe',
            'ź': 'z',
            'Ź': 'Z',
        }
        return mapping.get(ch, ch)

    def _get_script_sign(self, sign: str, options: object) -> str:
        if not options.preserve_vedic_accent_marks and self._is_vedic_accent(sign):
            return ''
        return self.c.signs.get(sign, sign)

    @staticmethod
    def _is_vedic_accent(sign: str) -> bool:
        return sign in {'\u0301', '\u0300', '\u030d', '\u030e', '\u0302', '\u0320'}

    @staticmethod
    def _is_dependent_nasal_sign(sign: str) -> bool:
        return sign in {'ṃ', 'ṁ', 'm̐', '\u0310', '̃'}

    def _vedic_accent_marks_to_script(self, marks: str, options: object) -> str | None:
        out: list[str] = []
        for mark in marks:
            if not self._is_vedic_accent(mark):
                return None
            out.append(self._get_script_sign(mark, options))
        return ''.join(out)

    @staticmethod
    def _following_combining_marks(text: str, start: int) -> str:
        i = start
        while i < len(text) and is_unicode_combining_mark(text[i]):
            i += 1
        return text[start:i]

    def _handle_unknown_mark(self, ch: str, options: object) -> str:
        policy = self._enum_value(options.unknown_latin_policy)
        if policy == 'passThrough':
            return ch
        if policy == 'bracket':
            return f'[{ch}]'
        raise ValueError(f'Unknown combining mark: U+{ord(ch):04X}')

    def _handle_unknown_latin(self, ch: str, options: object) -> str:
        policy = self._enum_value(options.unknown_latin_policy)
        if policy == 'passThrough':
            return ch
        if policy == 'bracket':
            return f'[{ch}]'
        raise ValueError(f'Unknown Latin token: {ch}')

    @staticmethod
    def _protect_om_words(text: str) -> str:
        pattern = re.compile(
            r'(?<![A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F])'
            r'(oṃ|oṁ|oṁ|aum)'
            r'(?![A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F])',
            re.IGNORECASE,
        )
        return pattern.sub('\ue100', text)
