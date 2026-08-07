import {
    UnicodeNormalizationForm,
    embedExactSourceMetadata,
    isEncodedVedicMark,
    isUnicodeCombiningMark,
    normalizeUnicode,
} from './transliteration-core.js';

export class ForwardScriptConfig {
    constructor({
        virama,
        omSign,
        om_sign = omSign,
        danda,
        doubleDanda,
        double_danda = doubleDanda,
        dottedCircle,
        dotted_circle = dottedCircle,
        independentVowels,
        independent_vowels = independentVowels,
        vowelSigns,
        vowel_signs = vowelSigns,
        consonants,
        signs,
        digits,
        strictIastVowels,
        strict_iast_vowels = strictIastVowels,
        strictIastConsonants,
        strict_iast_consonants = strictIastConsonants,
    }) {
        this.virama = virama;
        this.omSign = om_sign;
        this.om_sign = om_sign;
        this.danda = danda;
        this.doubleDanda = double_danda;
        this.double_danda = double_danda;
        this.dottedCircle = dotted_circle;
        this.dotted_circle = dotted_circle;
        this.independentVowels = Object.freeze({ ...independent_vowels });
        this.independent_vowels = this.independentVowels;
        this.vowelSigns = Object.freeze({ ...vowel_signs });
        this.vowel_signs = this.vowelSigns;
        this.consonants = Object.freeze({ ...consonants });
        this.signs = Object.freeze({ ...signs });
        this.digits = Object.freeze({ ...digits });
        this.strictIastVowels = new Set(strict_iast_vowels);
        this.strict_iast_vowels = this.strictIastVowels;
        this.strictIastConsonants = new Set(strict_iast_consonants);
        this.strict_iast_consonants = this.strictIastConsonants;
        Object.freeze(this);
    }
}

function option(options, camel, snake = null) {
    if (Object.hasOwn(options, camel) || options[camel] !== undefined) {
        return options[camel];
    }
    return snake ? options[snake] : undefined;
}

export class ForwardConverter {
    constructor(config, defaultOptionsFactory = null) {
        this.c = config;
        this.vowelKeys = this.#sortKeys(config.vowelSigns);
        this.independentVowelKeys = this.#sortKeys(config.independentVowels);
        this.consonantKeys = this.#sortKeys(config.consonants);
        this.signKeys = this.#sortKeys(config.signs);
        this.defaultOptionsFactory = defaultOptionsFactory;
    }

    #sortKeys(mapping) {
        return Object.keys(mapping).sort((a, b) => b.length - a.length);
    }

    #enumValue(value) {
        return value?.value ?? value;
    }

    convert(inputText, options) {
        const input = String(inputText);
        if (input.length === 0) return input;

        let text = input;
        if (this.#enumValue(option(options, 'omPolicy', 'om_policy')) === 'useOmSign') {
            text = this.#protectOmWords(text);
        }

        const chars = Array.from(text);
        const out = [];
        let i = 0;
        while (i < chars.length) {
            const ch = chars[i];
            const cp = ch.codePointAt(0);

            if (
                !option(options, 'preserveVedicAccentMarks', 'preserve_vedic_accent_marks') &&
                isEncodedVedicMark(cp)
            ) {
                i += 1;
                continue;
            }

            if (ch === '\uE100') {
                out.push(this.c.omSign);
                i += 1;
                continue;
            }

            if (this.#isLatinChar(ch)) {
                const start = i;
                i += 1;
                while (i < chars.length && this.#isLatinChar(chars[i])) i += 1;
                const token = chars.slice(start, i).join('');

                let idx = start - 1;
                while (idx >= 0 && ' \t\n\r'.includes(chars[idx])) idx -= 1;
                while (idx >= 0 && isUnicodeCombiningMark(chars[idx])) idx -= 1;
                const precedingText = chars.join('');
                const precedingOffset = idx >= 0 ? chars.slice(0, idx).join('').length : -1;
                const precededByVowel =
                    idx >= 0 && this.#startsWithVowel(precedingText, precedingOffset);
                out.push(this.#convertLatinWord(token, options, precededByVowel));
                continue;
            }

            if (
                this.#enumValue(option(options, 'digitPolicy', 'digit_policy')) ===
                    'convertToScript' &&
                Object.hasOwn(this.c.digits, ch)
            ) {
                out.push(this.c.digits[ch]);
            } else if (
                this.#enumValue(option(options, 'punctuationPolicy', 'punctuation_policy')) ===
                    'indicDanda' &&
                (ch === '.' || ch === '|')
            ) {
                if (ch === '|') {
                    if (i + 1 < chars.length && chars[i + 1] === '|') {
                        out.push(this.c.doubleDanda);
                        i += 1;
                    } else {
                        out.push(this.c.danda);
                    }
                } else {
                    let dotCount = 1;
                    while (i + dotCount < chars.length && chars[i + dotCount] === '.') {
                        dotCount += 1;
                    }
                    if (dotCount >= 3) {
                        out.push('.'.repeat(dotCount));
                        i += dotCount - 1;
                    } else {
                        const afterIdx = i + dotCount;
                        const isBoundary =
                            afterIdx >= chars.length || ' \n\r\t'.includes(chars[afterIdx]);
                        if (isBoundary) {
                            out.push(dotCount === 2 ? this.c.doubleDanda : this.c.danda);
                        } else {
                            out.push('.'.repeat(dotCount));
                        }
                        i += dotCount - 1;
                    }
                }
            } else {
                out.push(ch);
            }
            i += 1;
        }

        let result = out.join('');
        if (option(options, 'collapseWhitespace', 'collapse_whitespace')) {
            result = result.replace(/\s+/gu, ' ').trim();
        }
        if (option(options, 'embedExactSourceMetadata', 'embed_exact_source_metadata')) {
            return embedExactSourceMetadata(result, input);
        }
        return result;
    }

    #isLatinChar(ch) {
        const cp = ch.codePointAt(0);
        return (
            (cp >= 0x41 && cp <= 0x5a) ||
            (cp >= 0x61 && cp <= 0x7a) ||
            (cp >= 0x00c0 && cp <= 0x00ff) ||
            (cp >= 0x0100 && cp <= 0x024f) ||
            (cp >= 0x0250 && cp <= 0x02ff) ||
            (cp >= 0x1e00 && cp <= 0x1eff) ||
            isUnicodeCombiningMark(ch) ||
            [0x27, 0x2018, 0x2019, 0x02bc].includes(cp)
        );
    }

    #isAlphabeticLatinChar(ch) {
        const cp = ch.codePointAt(0);
        return (
            (cp >= 0x41 && cp <= 0x5a) ||
            (cp >= 0x61 && cp <= 0x7a) ||
            (cp >= 0x00c0 && cp <= 0x00ff) ||
            (cp >= 0x0100 && cp <= 0x024f) ||
            (cp >= 0x0250 && cp <= 0x02ff) ||
            (cp >= 0x1e00 && cp <= 0x1eff)
        );
    }

    #convertLatinWord(word, options, precededByVowel) {
        const text = this.#normalizeAndLowercase(word, options);
        const out = [];
        let i = 0;
        let pendingConsonant = false;
        let afterVowel = false;
        const deferredAccents = [];

        while (i < text.length) {
            const ch = text[i];

            if (pendingConsonant) {
                const vowel = this.#matchContextualVowel(text, i, options, true);
                if (vowel !== null) {
                    if (vowel !== 'a') out.push(this.c.vowelSigns[vowel]);
                    afterVowel = true;
                    if (!this.#nextIsVisargaOrAnusvara(text, i + vowel.length)) {
                        if (deferredAccents.length > 0) {
                            out.push(...deferredAccents.splice(0));
                        }
                    }
                    i += vowel.length;
                    pendingConsonant = false;
                    continue;
                }

                const sign = this.#matchKey(text, i, this.signKeys);
                if (sign !== null) {
                    if (["'", '‘', '’', 'ʼ'].includes(sign)) {
                        if (!this.#isAvagrahaContext(text, i, precededByVowel)) {
                            out.push(sign);
                            i += sign.length;
                            pendingConsonant = false;
                            afterVowel = false;
                            continue;
                        }
                        if (deferredAccents.length > 0) {
                            out.push(...deferredAccents.splice(0));
                        }
                    }

                    if (this.#isVedicAccent(sign)) {
                        deferredAccents.push(this.#getScriptSign(sign, options));
                        i += sign.length;
                        continue;
                    }

                    if (this.#isDependentNasalSign(sign)) {
                        const extra = this.#followingCombiningMarks(text, i + sign.length);
                        if (extra.length > 0) {
                            const accentMarks = this.#vedicAccentMarksToScript(extra, options);
                            if (accentMarks !== null) {
                                out.push(this.#getScriptSign(sign, options));
                                if (deferredAccents.length > 0) {
                                    out.push(...deferredAccents.splice(0));
                                }
                                out.push(accentMarks);
                                i += sign.length + extra.length;
                                pendingConsonant = false;
                                afterVowel = false;
                                continue;
                            }
                            out.push(this.#getScriptSign(sign, options));
                            if (deferredAccents.length > 0) {
                                out.push(...deferredAccents.splice(0));
                            }
                            out.push(extra);
                            i += sign.length + extra.length;
                            pendingConsonant = false;
                            afterVowel = false;
                            continue;
                        }
                    }

                    out.push(this.#getScriptSign(sign, options));
                    if (sign === 'ḥ' || this.#isDependentNasalSign(sign)) {
                        if (deferredAccents.length > 0) {
                            out.push(...deferredAccents.splice(0));
                        }
                    }
                    i += sign.length;
                    pendingConsonant = false;
                    afterVowel = false;
                    continue;
                }

                const nextConsonant = this.#matchContextualConsonant(text, i, options, true);
                if (nextConsonant !== null) {
                    out.push(this.c.virama);
                    if (deferredAccents.length > 0) {
                        out.push(...deferredAccents.splice(0));
                    }
                    pendingConsonant = false;
                    afterVowel = false;
                    continue;
                }

                if (isUnicodeCombiningMark(ch)) {
                    if (
                        option(
                            options,
                            'preserveVedicAccentMarks',
                            'preserve_vedic_accent_marks',
                        ) ||
                        !isEncodedVedicMark(ch)
                    ) {
                        out.push(this.#handleUnknownMark(ch, options));
                    }
                    i += 1;
                    continue;
                }

                out.push(this.c.virama);
                pendingConsonant = false;
                afterVowel = false;
                continue;
            }

            const sign = this.#matchKey(text, i, this.signKeys);
            if (sign !== null) {
                if (["'", '‘', '’', 'ʼ'].includes(sign)) {
                    if (!this.#isAvagrahaContext(text, i, precededByVowel)) {
                        out.push(sign);
                        i += sign.length;
                        afterVowel = false;
                        continue;
                    }
                    if (deferredAccents.length > 0) {
                        out.push(...deferredAccents.splice(0));
                    }
                }

                if (this.#isVedicAccent(sign)) {
                    deferredAccents.push(this.#getScriptSign(sign, options));
                    i += sign.length;
                    continue;
                }

                if (sign === 'ḥ' && !afterVowel) {
                    out.push(this.c.consonants.h);
                    i += sign.length;
                    pendingConsonant = true;
                    afterVowel = false;
                    continue;
                }

                if (this.#isDependentNasalSign(sign)) {
                    const extra = this.#followingCombiningMarks(text, i + sign.length);
                    if (extra.length > 0) {
                        const accentMarks = this.#vedicAccentMarksToScript(extra, options);
                        if (accentMarks !== null) {
                            out.push(this.#getScriptSign(sign, options));
                            if (deferredAccents.length > 0) {
                                out.push(...deferredAccents.splice(0));
                            }
                            out.push(accentMarks);
                            i += sign.length + extra.length;
                            afterVowel = false;
                            continue;
                        }
                        if (!afterVowel) out.push(this.c.dottedCircle);
                        out.push(this.#getScriptSign(sign, options));
                        out.push(extra);
                        i += sign.length + extra.length;
                        afterVowel = false;
                        continue;
                    }
                    if (!afterVowel) {
                        out.push(this.c.dottedCircle);
                        out.push(this.#getScriptSign(sign, options));
                        i += sign.length;
                        afterVowel = false;
                        continue;
                    }
                }

                out.push(this.#getScriptSign(sign, options));
                if (sign === 'ḥ' || this.#isDependentNasalSign(sign)) {
                    if (deferredAccents.length > 0) {
                        out.push(...deferredAccents.splice(0));
                    }
                    afterVowel = false;
                }
                i += sign.length;
                continue;
            }

            const consonant = this.#matchContextualConsonant(text, i, options, false);
            if (consonant !== null) {
                if (deferredAccents.length > 0) {
                    out.push(...deferredAccents.splice(0));
                }
                out.push(this.c.consonants[consonant]);
                i += consonant.length;
                const keepsInherentA =
                    ['ṛ', 'ṛh'].includes(consonant) &&
                    this.#enumValue(option(options, 'profile')) !== 'strictIast' &&
                    !this.#startsWithVowel(text, i);
                pendingConsonant = !keepsInherentA;
                afterVowel = keepsInherentA;
                continue;
            }

            const vowel = this.#matchContextualVowel(text, i, options, false);
            if (vowel !== null) {
                out.push(this.c.independentVowels[vowel]);
                afterVowel = true;
                if (!this.#nextIsVisargaOrAnusvara(text, i + vowel.length)) {
                    if (deferredAccents.length > 0) {
                        out.push(...deferredAccents.splice(0));
                    }
                }
                i += vowel.length;
                continue;
            }

            if (isUnicodeCombiningMark(ch)) {
                if (
                    option(options, 'preserveVedicAccentMarks', 'preserve_vedic_accent_marks') ||
                    !isEncodedVedicMark(ch)
                ) {
                    out.push(this.#handleUnknownMark(ch, options));
                }
                i += 1;
                continue;
            }

            out.push(this.#handleUnknownLatin(ch, options));
            i += 1;
            afterVowel = false;
        }

        if (pendingConsonant) out.push(this.c.virama);
        if (deferredAccents.length > 0) out.push(...deferredAccents);
        return out.join('');
    }

    #nextIsVisargaOrAnusvara(text, start) {
        let idx = start;
        while (idx < text.length) {
            const sign = this.#matchKey(text, idx, this.signKeys);
            if (sign !== null && this.#isVedicAccent(sign)) idx += sign.length;
            else break;
        }
        if (idx < text.length) {
            const nextSign = this.#matchKey(text, idx, this.signKeys);
            return ['ḥ', 'ṃ', 'm̐', '\u0310', '̐'].includes(nextSign);
        }
        return false;
    }

    #matchContextualVowel(text, i, options, pendingConsonant) {
        if (i >= text.length) return null;
        const profile = this.#enumValue(option(options, 'profile'));

        const lMatch = this.#matchLVariant(text, i);
        if (lMatch !== null) {
            if (profile === 'strictIast') return lMatch;
            if (this.#startsWithVowel(text, i + lMatch.length)) return null;
            const policy = this.#enumValue(
                option(options, 'ambiguousLPolicy', 'ambiguous_l_policy'),
            );
            if (policy === 'preferVocalic') return lMatch;
            if (policy === 'preferConsonant') return null;
            if (!this.#startsWithVowel(text, i + lMatch.length)) return lMatch;
            return null;
        }

        const rMatch = this.#matchRVariant(text, i);
        if (rMatch !== null) {
            if (profile === 'strictIast') return rMatch;
            if (pendingConsonant) return rMatch;
            if (
                !this.#startsWithVowel(text, i + rMatch.length) &&
                !this.#previousStartsWithVowel(text, i)
            ) {
                return rMatch;
            }
            return null;
        }

        const keys = pendingConsonant ? this.vowelKeys : this.independentVowelKeys;
        const match = this.#matchKey(text, i, keys);
        if (
            match !== null &&
            profile === 'strictIast' &&
            this.#enumValue(option(options, 'unknownLatinPolicy', 'unknown_latin_policy')) ===
                'throwError' &&
            !this.c.strictIastVowels.has(match)
        ) {
            return null;
        }
        return match;
    }

    #matchContextualConsonant(text, i, options, pendingConsonant) {
        if (i >= text.length) return null;
        const match = this.#matchKey(text, i, this.consonantKeys);
        if (match === null) return null;

        const profile = this.#enumValue(option(options, 'profile'));
        if (profile === 'strictIast' && !this.c.strictIastConsonants.has(match)) {
            return null;
        }

        if (['ṛ', 'ṛh'].includes(match)) {
            if (profile === 'strictIast') return null;
            if (
                !this.#startsWithVowel(text, i + match.length) &&
                !this.#previousStartsWithVowel(text, i)
            ) {
                return null;
            }
        }

        if (match === 'ḷ') {
            if (profile === 'strictIast') return null;
            if (this.#startsWithVowel(text, i + 1)) return 'ḷ';
            const policy = this.#enumValue(
                option(options, 'ambiguousLPolicy', 'ambiguous_l_policy'),
            );
            if (policy === 'preferConsonant') return 'ḷ';
            if (policy === 'context' && this.#startsWithVowel(text, i + 1)) {
                return 'ḷ';
            }
            return null;
        }

        if (match === 'x' && !option(options, 'acceptPlainXAsKha', 'accept_plain_x_as_kha')) {
            return null;
        }
        if (match === 'w' && !option(options, 'acceptWAsVa', 'accept_w_as_va')) {
            return null;
        }
        if (['sh', 'zh'].includes(match) && !option(options, 'acceptPlainSh', 'accept_plain_sh')) {
            return null;
        }
        void pendingConsonant;
        return match;
    }

    #matchLVariant(text, i) {
        if (text.startsWith('ḹ', i)) return 'ḹ';
        if (text.startsWith('ḷ', i)) return 'ḷ';
        return null;
    }

    #matchRVariant(text, i) {
        if (text.startsWith('ṝ', i)) return 'ṝ';
        if (text.startsWith('ṛ', i)) return 'ṛ';
        return null;
    }

    #startsWithVowel(text, i) {
        if (i < 0 || i >= text.length) return false;
        if (
            this.#matchKey(text, i, this.vowelKeys) !== null ||
            this.#matchKey(text, i, this.independentVowelKeys) !== null
        ) {
            return true;
        }
        if (typeof this.defaultOptionsFactory !== 'function') {
            throw new Error('Forward converter has no default options factory.');
        }
        const folded = this.#normalizeAndLowercase(
            text.slice(i, i + 12),
            this.defaultOptionsFactory(),
        );
        return (
            this.#matchKey(folded, 0, this.vowelKeys) !== null ||
            this.#matchKey(folded, 0, this.independentVowelKeys) !== null
        );
    }

    #isAvagrahaContext(text, i, precededByVowel) {
        if (i >= text.length - 1 || !this.#isAlphabeticLatinChar(text[i + 1])) {
            return false;
        }
        if (i === 0) return precededByVowel;
        let prev = i - 1;
        while (prev >= 0 && isUnicodeCombiningMark(text[prev])) prev -= 1;
        return prev >= 0 && this.#startsWithVowel(text, prev);
    }

    #previousStartsWithVowel(text, i) {
        let prev = i - 1;
        while (prev >= 0 && isUnicodeCombiningMark(text[prev])) prev -= 1;
        return prev >= 0 && this.#startsWithVowel(text, prev);
    }

    #matchKey(text, i, keys) {
        for (const key of keys) {
            if (text.startsWith(key, i)) return key;
        }
        return null;
    }

    #normalizeAndLowercase(word, options) {
        const nfd = normalizeUnicode(word, UnicodeNormalizationForm.NFD);
        const chars = Array.from(nfd);
        const out = [];
        let i = 0;
        while (i < chars.length) {
            const base = chars[i];
            i += 1;
            const marks = [];
            while (i < chars.length && isUnicodeCombiningMark(chars[i])) {
                marks.push(chars[i].codePointAt(0));
                i += 1;
            }
            out.push(this.#foldMarkedBase(base, marks, true));
        }

        let result = out.join('').toLowerCase();
        if (option(options, 'acceptAsciiLongVowels', 'accept_ascii_long_vowels')) {
            result = result
                .replaceAll('aa', 'ā')
                .replaceAll('ii', 'ī')
                .replaceAll('uu', 'ū')
                .replaceAll('rr', 'ṝ')
                .replaceAll('ll', 'ḹ');
        }
        return result;
    }

    #foldMarkedBase(base, marks, allowCompatibilityFolding) {
        const foldedBase = allowCompatibilityFolding ? this.#foldPrecomposed(base) : base;
        const lower = foldedBase.toLowerCase();
        if (marks.length === 0) return foldedBase;

        const hasDotBelow = marks.includes(0x0323);
        const hasRingBelow = marks.includes(0x0325);
        const hasDotAbove = marks.includes(0x0307);
        const hasAcute = marks.includes(0x0301);
        const hasNasal = marks.includes(0x0303) || marks.includes(0x0310);
        const hasMacron = marks.includes(0x0304);
        const hasLineBelow = marks.includes(0x0331) || marks.includes(0x035f);
        const hasBreveBelow = marks.includes(0x032e);
        const hasCaron = marks.includes(0x030c);

        let output = null;
        const consumed = new Set();
        const take = (token, codes) => {
            output = token;
            for (const code of codes) consumed.add(code);
        };
        const lineBelow = [0x0331, 0x035f].filter((cp) => marks.includes(cp));

        if (lower === 'r' && (hasDotBelow || hasRingBelow)) {
            take(hasMacron ? 'ṝ' : 'ṛ', [
                ...(hasDotBelow ? [0x0323] : []),
                ...(hasRingBelow ? [0x0325] : []),
                ...(hasMacron ? [0x0304] : []),
            ]);
        } else if (lower === 'r' && hasDotAbove) {
            take('ṙ', [0x0307]);
        } else if (lower === 'r' && hasLineBelow) {
            take('ṟ', lineBelow);
        } else if (lower === 'l' && (hasDotBelow || hasRingBelow)) {
            take(hasMacron ? 'ḹ' : 'ḷ', [
                ...(hasDotBelow ? [0x0323] : []),
                ...(hasRingBelow ? [0x0325] : []),
                ...(hasMacron ? [0x0304] : []),
            ]);
        } else if (lower === 'l' && (hasLineBelow || marks.includes(0x0324))) {
            take('ḻ', [...lineBelow, ...(marks.includes(0x0324) ? [0x0324] : [])]);
        } else if (lower === 'h' && hasBreveBelow) {
            take('ḫ', [0x032e]);
        } else if (lower === 'h' && hasDotBelow) {
            take('ḥ', [0x0323]);
        } else if (lower === 'h' && hasLineBelow) {
            take('ẖ', lineBelow);
        } else if (lower === 's' && hasDotBelow) {
            take('ṣ', [0x0323]);
        } else if (lower === 's' && hasAcute) {
            take('ś', [0x0301]);
        } else if (lower === 's' && hasDotAbove) {
            take('ṡ', [0x0307]);
        } else if (lower === 's' && hasLineBelow) {
            take('s̱', lineBelow);
        } else if (lower === 't' && hasDotBelow) {
            take('ṭ', [0x0323]);
        } else if (lower === 't' && hasLineBelow) {
            take('ṯ', lineBelow);
        } else if (lower === 'd' && hasDotBelow) {
            take('ḍ', [0x0323]);
        } else if (lower === 'd' && hasLineBelow) {
            take('ḏ', lineBelow);
        } else if (lower === 'n' && hasDotBelow) {
            take('ṇ', [0x0323]);
        } else if (lower === 'n' && hasDotAbove) {
            take('ṅ', [0x0307]);
        } else if (lower === 'n' && hasNasal) {
            take(
                'ñ',
                [0x0303, 0x0310].filter((cp) => marks.includes(cp)),
            );
        } else if (lower === 'n' && hasLineBelow) {
            take('ṉ', lineBelow);
        } else if (lower === 'z' && hasDotBelow) {
            take('ẓ', [0x0323]);
        } else if (lower === 'z' && hasCaron) {
            take('ž', [0x030c]);
        } else if (lower === 'z' && hasDotAbove) {
            take('ż', [0x0307]);
        } else if (lower === 'z' && hasLineBelow) {
            take('ẕ', lineBelow);
        } else if (lower === 'k' && hasDotBelow) {
            take('ḳ', [0x0323]);
        } else if (lower === 'k' && hasLineBelow) {
            take('ḵ', lineBelow);
        } else if (lower === 'g' && hasCaron) {
            take('ǧ', [0x030c]);
        } else if (lower === 'g' && hasDotAbove) {
            take('ġ', [0x0307]);
        } else if (lower === 'g' && hasLineBelow) {
            take('g̱', lineBelow);
        } else if (lower === 'm' && marks.includes(0x0310)) {
            take('m̐', [0x0310]);
        } else if (lower === 'm' && (hasDotBelow || hasDotAbove)) {
            take('ṃ', [...(hasDotBelow ? [0x0323] : []), ...(hasDotAbove ? [0x0307] : [])]);
        } else if (lower === 'y' && hasDotAbove) {
            take('ẏ', [0x0307]);
        } else if (hasMacron) {
            const token = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' }[lower];
            if (token) take(token, [0x0304]);
        } else if (marks.includes(0x0306)) {
            const token = { a: 'ă', e: 'ĕ', o: 'ŏ' }[lower];
            if (token) take(token, [0x0306]);
        } else if (marks.includes(0x0302)) {
            const token = { e: 'ê', o: 'ô' }[lower];
            if (token) take(token, [0x0302]);
        }

        return (
            (output ?? foldedBase) +
            marks
                .filter((cp) => !consumed.has(cp))
                .map((cp) => String.fromCodePoint(cp))
                .join('')
        );
    }

    #foldPrecomposed(ch) {
        const mapping = {
            á: 'a\u0301',
            à: 'a\u0300',
            â: 'a',
            ã: 'a',
            ä: 'a',
            å: 'a',
            é: 'e\u0301',
            è: 'e\u0300',
            ë: 'e',
            í: 'i\u0301',
            ì: 'i\u0300',
            î: 'i',
            ï: 'i',
            ó: 'o\u0301',
            ò: 'o\u0300',
            õ: 'o',
            ö: 'o',
            ø: 'o',
            ú: 'u\u0301',
            ù: 'u\u0300',
            û: 'u',
            ü: 'u',
            ç: 's',
            Ç: 'S',
            ł: 'l',
            Ł: 'L',
            ß: 'ss',
            þ: 'th',
            Þ: 'Th',
            ð: 'd',
            Ð: 'D',
            Æ: 'ae',
            æ: 'ae',
            Œ: 'oe',
            œ: 'oe',
            ź: 'z',
            Ź: 'Z',
        };
        return mapping[ch] ?? ch;
    }

    #getScriptSign(sign, options) {
        if (
            !option(options, 'preserveVedicAccentMarks', 'preserve_vedic_accent_marks') &&
            this.#isVedicAccent(sign)
        ) {
            return '';
        }
        return this.c.signs[sign] ?? sign;
    }

    #isVedicAccent(sign) {
        return ['\u0301', '\u0300', '\u030D', '\u030E', '\u0302', '\u0320'].includes(sign);
    }

    #isDependentNasalSign(sign) {
        return ['ṃ', 'ṁ', 'm̐', '\u0310', '̐', '̃'].includes(sign);
    }

    #vedicAccentMarksToScript(marks, options) {
        const out = [];
        for (const mark of Array.from(marks)) {
            if (!this.#isVedicAccent(mark)) return null;
            out.push(this.#getScriptSign(mark, options));
        }
        return out.join('');
    }

    #followingCombiningMarks(text, start) {
        let i = start;
        while (i < text.length && isUnicodeCombiningMark(text[i])) i += 1;
        return text.slice(start, i);
    }

    #handleUnknownMark(ch, options) {
        const policy = this.#enumValue(
            option(options, 'unknownLatinPolicy', 'unknown_latin_policy'),
        );
        if (policy === 'passThrough') return ch;
        if (policy === 'bracket') return `[${ch}]`;
        throw new TypeError(
            `Unknown combining mark: U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
        );
    }

    #handleUnknownLatin(ch, options) {
        const policy = this.#enumValue(
            option(options, 'unknownLatinPolicy', 'unknown_latin_policy'),
        );
        if (policy === 'passThrough') return ch;
        if (policy === 'bracket') return `[${ch}]`;
        throw new TypeError(`Unknown Latin token: ${ch}`);
    }

    #protectOmWords(text) {
        return text.replace(
            /(?<![A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F])(oṃ|oṁ|oṁ|aum)(?![A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F])/giu,
            '\uE100',
        );
    }
}
