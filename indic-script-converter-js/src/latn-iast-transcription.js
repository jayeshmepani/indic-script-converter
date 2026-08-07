import {
    UnicodeNormalizationForm,
    isEncodedVedicMark,
    isUnicodeCombiningMark,
    normalizeUnicode,
} from './transliteration-core.js';

export const FinalAPolicy = Object.freeze({
    KEEP: 'keep',
    DROP: 'drop',
    SMART: 'smart',
    keep: 'keep',
    drop: 'drop',
    smart: 'smart',
});
export const JnaPolicy = Object.freeze({
    GYA: 'gya',
    JNYA: 'jnya',
    JNA: 'jna',
    gya: 'gya',
    jnya: 'jnya',
    jna: 'jna',
});
export const NyaPolicy = Object.freeze({
    NA: 'na',
    NYA: 'nya',
    GNA: 'gna',
    na: 'na',
    nya: 'nya',
    gna: 'gna',
});
export const PlainEnglishRomanizationProfile = Object.freeze({
    STRICT_IAST: 'strictIast',
    EXTENDED_INDIC: 'extendedIndic',
    HUNTERIAN: 'hunterian',
    strictIast: 'strictIast',
    extendedIndic: 'extendedIndic',
    hunterian: 'hunterian',
});
export const RomanizationProfile = PlainEnglishRomanizationProfile;
export const GlottalStopPolicy = Object.freeze({
    REMOVE: 'remove',
    APOSTROPHE: 'apostrophe',
    remove: 'remove',
    apostrophe: 'apostrophe',
});

export class IastPlainEnglishOptions {
    constructor(values = {}) {
        this.finalA = values.finalA ?? values.final_a ?? FinalAPolicy.SMART;
        this.final_a = this.finalA;
        this.jna = values.jna ?? JnaPolicy.GYA;
        this.nya = values.nya ?? NyaPolicy.NA;
        this.profile = values.profile ?? PlainEnglishRomanizationProfile.EXTENDED_INDIC;
        this.glottalStop = values.glottalStop ?? values.glottal_stop ?? GlottalStopPolicy.REMOVE;
        this.glottal_stop = this.glottalStop;
        this.convertCToCh = values.convertCToCh ?? values.convert_c_to_ch ?? true;
        this.convert_c_to_ch = this.convertCToCh;
        this.assimilateAnusvara = values.assimilateAnusvara ?? values.assimilate_anusvara ?? true;
        this.assimilate_anusvara = this.assimilateAnusvara;
        this.removeAvagraha = values.removeAvagraha ?? values.remove_avagraha ?? true;
        this.remove_avagraha = this.removeAvagraha;
        this.collapseWhitespace = values.collapseWhitespace ?? values.collapse_whitespace ?? false;
        this.collapse_whitespace = this.collapseWhitespace;
        this.enableInternalSchwaSyncope =
            values.enableInternalSchwaSyncope ?? values.enable_internal_schwa_syncope ?? false;
        this.enable_internal_schwa_syncope = this.enableInternalSchwaSyncope;
        this.useWForVAfterConsonants =
            values.useWForVAfterConsonants ?? values.use_w_for_v_after_consonants ?? false;
        this.use_w_for_v_after_consonants = this.useWForVAfterConsonants;
        this.preserveVedicAccentMarks =
            values.preserveVedicAccentMarks ?? values.preserve_vedic_accent_marks ?? false;
        this.preserve_vedic_accent_marks = this.preserveVedicAccentMarks;
        this.keepFinalAForWords = new Set(
            values.keepFinalAForWords ?? values.keep_final_a_for_words ?? [],
        );
        this.keep_final_a_for_words = this.keepFinalAForWords;
        Object.freeze(this);
    }
}

class Segment {
    constructor(text, isVowel) {
        this.text = text;
        this.isVowel = isVowel;
    }
}

class IastPlainEnglish {
    static avagrahaChars = /[ऽ’‘ʼʹ]/gu;
    static innerApostrophe =
        /([A-Za-z\u00C0-\u00FF\u0100-\u024F\u0250-\u02FF\u1E00-\u1EFF])'(?=[A-Za-z\u00C0-\u00FF\u0100-\u024F\u0250-\u02FF\u1E00-\u1EFF])/gu;
    static vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    static phChh = '\uE010';
    static phChhCap = '\uE011';
    static phChhAll = '\uE012';

    static convert(inputText, options) {
        const input = String(inputText);
        if (!input) return input;
        let text = input;
        if (options.removeAvagraha) {
            text = text.replace(IastPlainEnglish.avagrahaChars, '');
            text = text.replace(IastPlainEnglish.innerApostrophe, '$1');
        }
        const chars = Array.from(text);
        const out = [];
        let i = 0;
        while (i < chars.length) {
            const ch = chars[i];
            if (!options.preserveVedicAccentMarks && isEncodedVedicMark(ch)) {
                i += 1;
                continue;
            }
            if (IastPlainEnglish.isLatinChar(ch)) {
                const start = i;
                i += 1;
                while (i < chars.length && IastPlainEnglish.isLatinChar(chars[i])) i += 1;
                out.push(
                    IastPlainEnglish.convertLatinWord(chars.slice(start, i).join(''), options),
                );
                continue;
            }
            out.push(ch);
            i += 1;
        }
        let result = out.join('');
        if (options.collapseWhitespace) result = result.replace(/\s+/gu, ' ').trim();
        return result;
    }

    static isLatinChar(ch) {
        const cp = ch.codePointAt(0);
        return (
            (cp >= 0x41 && cp <= 0x5a) ||
            (cp >= 0x61 && cp <= 0x7a) ||
            (cp >= 0x00c0 && cp <= 0x00ff) ||
            (cp >= 0x0100 && cp <= 0x024f) ||
            (cp >= 0x0250 && cp <= 0x02ff) ||
            (cp >= 0x1e00 && cp <= 0x1eff) ||
            isUnicodeCombiningMark(ch)
        );
    }

    static convertLatinWord(word, options) {
        if (!word) return word;
        const isAllUpper = IastPlainEnglish.isAllUpperWord(word);
        const last = Array.from(word).at(-1);
        const endsInShortA = last === 'a' || last === 'A';
        const keepFinalNoisy = IastPlainEnglish.containsNoisyLatinLetter(word);
        let w = normalizeUnicode(word, UnicodeNormalizationForm.NFD);
        w = IastPlainEnglish.applyProfile(w, options.profile);
        w = IastPlainEnglish.applyJna(w, options.jna);
        if (options.assimilateAnusvara) w = IastPlainEnglish.resolveAnusvara(w);
        else w = w.replace(/[ṃṁ]/gu, 'm').replace(/[ṂṀ]/gu, 'M');
        if (options.convertCToCh) w = IastPlainEnglish.expandC(w);
        if (options.enableInternalSchwaSyncope && w.length > 5) {
            w = IastPlainEnglish.applyInternalSchwaSyncope(w);
        }
        w = IastPlainEnglish.foldLetters(
            w,
            options.glottalStop,
            options.nya,
            options.preserveVedicAccentMarks,
        );
        if (
            options.useWForVAfterConsonants ||
            options.profile === PlainEnglishRomanizationProfile.HUNTERIAN
        ) {
            w = w.replace(/([^aeiou\s])v([aāiīuūeēoō])/giu, '$1w$2');
        }
        if (options.finalA !== FinalAPolicy.KEEP && endsInShortA && !keepFinalNoisy) {
            w = IastPlainEnglish.applyFinalARule(w, options);
        }
        if (isAllUpper) w = w.toUpperCase();
        return w;
    }

    static isAllUpperWord(word) {
        let cased = 0;
        let upper = 0;
        for (const ch of Array.from(word)) {
            if (isUnicodeCombiningMark(ch)) continue;
            if (ch.toUpperCase() === ch.toLowerCase()) continue;
            cased += 1;
            if (ch === ch.toUpperCase()) upper += 1;
        }
        return cased > 1 && cased === upper;
    }

    static containsNoisyLatinLetter(word) {
        const noisy = new Set([
            'ç',
            'Ç',
            'ã',
            'Ã',
            'ï',
            'Ï',
            'œ',
            'Œ',
            'ø',
            'Ø',
            'ł',
            'Ł',
            'ß',
            'þ',
            'Þ',
            'ð',
            'Ð',
        ]);
        return Array.from(word).some((ch) => noisy.has(ch));
    }

    static applyProfile(word, profile) {
        let result = word
            .replaceAll('x', 'kh')
            .replaceAll('X', 'Kh')
            .replaceAll('h\u032E', 'kh')
            .replaceAll('H\u032E', 'Kh');
        if (profile === PlainEnglishRomanizationProfile.STRICT_IAST) return result;
        result = result
            .replace(/ṛh(?=[aāiīuūeêĕoôŏy])/gu, 'rh')
            .replace(/Ṛh(?=[aāiīuūeêĕoôŏy])/gu, 'Rh')
            .replace(/ṛ(?=[aāiīuūeêĕoôŏy])/gu, 'r')
            .replace(/Ṛ(?=[aāiīuūeêĕoôŏy])/gu, 'R');
        if (profile === PlainEnglishRomanizationProfile.HUNTERIAN) {
            const cls = '[kKgGcCjJtTdDpPbBsSśŚṣṢhH]';
            result = result
                .replace(new RegExp(`ḥ(${cls})`, 'gu'), '$1')
                .replace(new RegExp(`Ḥ(${cls})`, 'gu'), '$1')
                .replace(new RegExp(`h\\u0323(${cls})`, 'gu'), '$1')
                .replace(new RegExp(`H\\u0323(${cls})`, 'gu'), '$1');
        }
        return result;
    }

    static applyInternalSchwaSyncope(word) {
        if (word.length <= 5) return word;
        const segments = [];
        let current = [];
        let parsingVowel = null;
        for (const ch of Array.from(word)) {
            const cp = ch.codePointAt(0);
            const mark = cp >= 0x0300 && cp <= 0x036f;
            const isVowel =
                mark && parsingVowel !== null ? parsingVowel : IastPlainEnglish.isIastVowelChar(ch);
            if (parsingVowel === null) {
                parsingVowel = isVowel;
                current = [ch];
            } else if (parsingVowel === isVowel) {
                current.push(ch);
            } else {
                segments.push(new Segment(current.join(''), Boolean(parsingVowel)));
                current = [ch];
                parsingVowel = isVowel;
            }
        }
        if (current.length > 0 && parsingVowel !== null) {
            segments.push(new Segment(current.join(''), Boolean(parsingVowel)));
        }
        const vowelIndices = [];
        for (let i = 0; i < segments.length; i += 1) {
            if (segments[i].isVowel) vowelIndices.push(i);
        }
        if (vowelIndices.length < 3) return word;
        for (let k = vowelIndices.length - 2; k >= 1; k -= 1) {
            const idx = vowelIndices[k];
            const candidate = segments[idx];
            if (
                !IastPlainEnglish.isShortASchwa(candidate.text) ||
                idx - 1 < 0 ||
                idx + 1 >= segments.length
            ) {
                continue;
            }
            const prev = segments[idx - 1];
            const next = segments[idx + 1];
            if (
                IastPlainEnglish.countConsonants(prev.text) +
                    IastPlainEnglish.countConsonants(next.text) >
                2
            ) {
                continue;
            }
            candidate.text = '';
            prev.text += next.text;
            next.text = '';
        }
        return segments.map((segment) => segment.text).join('');
    }

    static isIastVowelChar(ch) {
        return new Set(['a', 'ā', 'i', 'ī', 'u', 'ū', 'e', 'o', 'ṛ', 'ṝ', 'ḷ', 'ḹ', 'æ', 'œ']).has(
            ch.toLowerCase(),
        );
    }

    static isShortASchwa(text) {
        return text.replace(/[\u0300-\u036F]/gu, '').toLowerCase() === 'a';
    }

    static countConsonants(cluster) {
        let s = cluster.toLowerCase();
        for (const [from, to] of [
            ['kh', 'K'],
            ['gh', 'G'],
            ['ch', 'C'],
            ['jh', 'J'],
            ['th', 'T'],
            ['dh', 'D'],
            ['ph', 'P'],
            ['bh', 'B'],
            ['sh', 'S'],
            ['zh', 'Z'],
        ]) {
            s = s.replaceAll(from, to);
        }
        return Array.from(s).length;
    }

    static applyJna(word, policy) {
        const sets = {
            [JnaPolicy.GYA]: {
                jñ: 'gy',
                Jñ: 'Gy',
                JÑ: 'GY',
                jÑ: 'gy',
                'jn\u0303': 'gy',
                'Jn\u0303': 'Gy',
                'JN\u0303': 'GY',
            },
            [JnaPolicy.JNYA]: {
                jñ: 'jny',
                Jñ: 'Jny',
                JÑ: 'JNY',
                jÑ: 'jny',
                'jn\u0303': 'jny',
                'Jn\u0303': 'Jny',
                'JN\u0303': 'JNY',
            },
            [JnaPolicy.JNA]: {
                jñ: 'jn',
                Jñ: 'Jn',
                JÑ: 'JN',
                jÑ: 'jn',
                'jn\u0303': 'jn',
                'Jn\u0303': 'Jn',
                'JN\u0303': 'JN',
            },
        };
        let result = word;
        for (const [from, to] of Object.entries(sets[policy])) result = result.replaceAll(from, to);
        return result;
    }

    static resolveAnusvara(word) {
        return word.replace(
            /([mM](?:\u0307|\u0323|\u0310)|[ṃṁṂṀ])(.?)/gsu,
            (all, marker, next, offset) => {
                const following = next || null;
                const isUpper = marker === marker.toUpperCase() && marker !== marker.toLowerCase();
                if (offset === 0 && marker.includes('\u0310')) {
                    return `${isUpper ? 'M' : 'm'}${following ?? ''}`;
                }
                let nasal = IastPlainEnglish.anusvaraNasal(following);
                if (isUpper) nasal = nasal.toUpperCase();
                return nasal + (following ?? '');
            },
        );
    }

    static anusvaraNasal(next) {
        if (next === null) return 'm';
        const lower = next.toLowerCase();
        if (new Set(['k', 'g', 'c', 'j', 'ṭ', 'ḍ', 't', 'd', 'n', 'ṇ', 'ṅ', 'ñ']).has(lower)) {
            return 'n';
        }
        if (new Set(['p', 'b', 'm']).has(lower)) return 'm';
        if (new Set(['ś', 'ṣ', 's', 'h', 'y', 'v']).has(lower)) return 'n';
        return 'm';
    }

    static expandC(word) {
        let w = word
            .replaceAll('ch', IastPlainEnglish.phChh)
            .replaceAll('Ch', IastPlainEnglish.phChhCap)
            .replaceAll('CH', IastPlainEnglish.phChhAll);
        w = w.replace(/[cC]/gu, (m) => (m === 'C' ? 'Ch' : 'ch'));
        return w
            .replaceAll(IastPlainEnglish.phChh, 'chh')
            .replaceAll(IastPlainEnglish.phChhCap, 'Chh')
            .replaceAll(IastPlainEnglish.phChhAll, 'CHH');
    }

    static isEnglishVowel(ch) {
        return (
            ch !== null &&
            ch !== undefined &&
            new Set(['a', 'e', 'i', 'o', 'u']).has(ch.toLowerCase())
        );
    }

    static isVedicAccentRune(cp) {
        return (
            isEncodedVedicMark(cp) ||
            new Set([0x0301, 0x0300, 0x030d, 0x030e, 0x0302, 0x0329, 0x0331, 0x0320]).has(cp)
        );
    }

    static foldLetters(word, glottal, nya, preserveVedic) {
        const chars = Array.from(word);
        const out = [];
        let i = 0;
        let prev = null;
        while (i < chars.length) {
            const base = chars[i];
            i += 1;
            const marks = [];
            while (i < chars.length && isUnicodeCombiningMark(chars[i])) {
                marks.push(chars[i].codePointAt(0));
                i += 1;
            }
            const nextBase = i < chars.length ? chars[i] : null;
            let folded = IastPlainEnglish.foldMarkedBase(base, marks, glottal, nya, nextBase, prev);
            if (preserveVedic && IastPlainEnglish.isVowelOutput(folded)) {
                folded += marks
                    .filter((cp) => IastPlainEnglish.isVedicAccentRune(cp))
                    .map(String.fromCodePoint)
                    .join('');
            }
            out.push(folded);
            prev = folded ? Array.from(folded).at(-1) : null;
        }
        return out.join('');
    }

    static isVowelOutput(folded) {
        if (!folded) return false;
        const first = Array.from(folded)[0].toLowerCase();
        return IastPlainEnglish.vowels.has(first) || ['ri', 'li'].includes(folded.toLowerCase());
    }

    static foldMarkedBase(base, marks, glottal, nya, nextBase, prev) {
        if (marks.length === 0) {
            return IastPlainEnglish.foldPrecomposed(base, glottal, nya, nextBase, prev);
        }
        const foldedBase = IastPlainEnglish.foldPrecomposed(base, glottal, nya, nextBase, prev);
        const lower = foldedBase.toLowerCase();
        const isUpper =
            foldedBase === foldedBase.toUpperCase() && foldedBase !== foldedBase.toLowerCase();
        const hasDotBelow = marks.includes(0x0323);
        const hasRingBelow = marks.includes(0x0325);
        const hasDotAbove = marks.includes(0x0307);
        const hasAcute = marks.includes(0x0301);
        const hasNasal = marks.includes(0x0303) || marks.includes(0x0310);
        let output = null;
        if (IastPlainEnglish.vowels.has(lower)) {
            output = lower;
            if (hasNasal && nextBase === null && IastPlainEnglish.isLongA(base, marks)) {
                output = 'aa';
            }
            if (hasNasal && IastPlainEnglish.nasalizedVowelNeedsN(nextBase, prev)) output += 'n';
        } else if (lower === 'r') {
            if (hasRingBelow) output = 'ri';
            else if (hasDotBelow) output = IastPlainEnglish.isEnglishVowel(prev) ? 'r' : 'ri';
        } else if (lower === 'l' && (hasDotBelow || hasRingBelow)) {
            output = IastPlainEnglish.isVowelBase(nextBase, prev) ? 'l' : 'li';
        } else if (lower === 's' && (hasAcute || hasDotBelow)) {
            output = 'sh';
        } else if (lower === 't' && hasDotBelow) {
            output = 't';
        } else if (lower === 'd' && hasDotBelow) {
            output = 'd';
        } else if (lower === 'n') {
            if (hasDotAbove || hasDotBelow) output = 'n';
            if (hasNasal) output = IastPlainEnglish.foldNya(nya);
        } else if (lower === 'h' && hasDotBelow) {
            output = 'h';
        } else if (lower === 'm' && (hasDotAbove || hasDotBelow || hasNasal)) {
            output = 'm';
        }
        output ??= IastPlainEnglish.foldPrecomposed(base, glottal, nya, nextBase, prev);
        return IastPlainEnglish.matchCase(isUpper, output);
    }

    static nasalizedVowelNeedsN(nextBase, prev) {
        if (nextBase === null) return false;
        const next = IastPlainEnglish.foldPrecomposed(
            nextBase,
            GlottalStopPolicy.REMOVE,
            NyaPolicy.NA,
            null,
            prev,
        ).toLowerCase();
        if (!next || IastPlainEnglish.vowels.has(next)) return false;
        return !['m', 'n'].includes(Array.from(next)[0]);
    }

    static isLongA(base, marks) {
        return (
            base === 'ā' || base === 'Ā' || (base.toLowerCase() === 'a' && marks.includes(0x0304))
        );
    }

    static isVowelBase(base, prev) {
        if (base === null) return false;
        const folded = IastPlainEnglish.foldPrecomposed(
            base,
            GlottalStopPolicy.REMOVE,
            NyaPolicy.NA,
            null,
            prev,
        ).toLowerCase();
        return Boolean(folded) && IastPlainEnglish.vowels.has(Array.from(folded)[0]);
    }

    static foldNya(policy) {
        return { [NyaPolicy.NA]: 'n', [NyaPolicy.NYA]: 'ny', [NyaPolicy.GNA]: 'gn' }[policy];
    }

    static matchCase(isUpper, lower) {
        if (!isUpper || !lower) return lower;
        const chars = Array.from(lower);
        return chars[0].toUpperCase() + chars.slice(1).join('');
    }

    static foldPrecomposed(ch, glottal, nya, nextBase = null, prev = null) {
        if (ch === 'ā') return 'a';
        if (ch === 'Ā') return 'A';
        if (ch === 'ī') return 'i';
        if (ch === 'Ī') return 'I';
        if (ch === 'ū') return 'u';
        if (ch === 'Ū') return 'U';
        const groups = {
            a: new Set(Array.from('ăàáâãäå')),
            A: new Set(Array.from('ĂÀÁÂÃÄÅ')),
            i: new Set(Array.from('ìíîï')),
            I: new Set(Array.from('ÌÍÎÏ')),
            e: new Set(Array.from('ĕěēèéêë')),
            E: new Set(Array.from('ĔĚĒÈÉÊË')),
            o: new Set(Array.from('ŏòóôõöōø')),
            O: new Set(Array.from('ŌŎÒÓÔÕÖØ')),
            u: new Set(Array.from('ùúûü')),
            U: new Set(Array.from('ÙÚÛÜ')),
        };
        for (const [output, chars] of Object.entries(groups)) if (chars.has(ch)) return output;
        if (ch === 'Æ' || ch === 'Ǣ') return 'Ae';
        if (ch === 'Œ') return 'Oe';
        if (ch === 'æ' || ch === 'ǣ') return 'ae';
        if (ch === 'œ') return 'oe';
        if (ch === 'ṛ' || ch === 'ṝ') return IastPlainEnglish.isEnglishVowel(prev) ? 'r' : 'ri';
        if (ch === 'Ṛ' || ch === 'Ṝ') return IastPlainEnglish.isEnglishVowel(prev) ? 'R' : 'Ri';
        if (ch === 'ḷ') return IastPlainEnglish.isVowelBase(nextBase, prev) ? 'l' : 'li';
        if (ch === 'Ḷ') return IastPlainEnglish.isVowelBase(nextBase, prev) ? 'L' : 'Li';
        if (ch === 'ḹ') return 'li';
        if (ch === 'Ḹ') return 'Li';
        if (ch === 'ñ') return IastPlainEnglish.foldNya(nya);
        if (ch === 'Ñ') return IastPlainEnglish.matchCase(true, IastPlainEnglish.foldNya(nya));
        if (ch === 'ʔ') return glottal === GlottalStopPolicy.REMOVE ? '' : "'";
        const table = {
            ṅ: 'n',
            Ṅ: 'N',
            ŋ: 'n',
            Ŋ: 'N',
            ƞ: 'n',
            Ƞ: 'N',
            ṇ: 'n',
            Ṇ: 'N',
            ṉ: 'n',
            Ṉ: 'N',
            ṙ: 'r',
            Ṙ: 'R',
            ç: 'c',
            Ç: 'C',
            ł: 'l',
            Ł: 'L',
            ß: 'ss',
            þ: 'th',
            Þ: 'Th',
            ð: 'd',
            Ð: 'D',
            ṭ: 't',
            Ṭ: 'T',
            ṯ: 't',
            Ṯ: 'T',
            ḳ: 'k',
            ḵ: 'k',
            Ḳ: 'K',
            Ḵ: 'K',
            ḍ: 'd',
            Ḍ: 'D',
            ḏ: 'd',
            Ḏ: 'D',
            ś: 'sh',
            Ś: 'Sh',
            ṣ: 'sh',
            Ṣ: 'Sh',
            ṡ: 's',
            Ṡ: 'S',
            ž: 'zh',
            Ž: 'Zh',
            ź: 'z',
            ż: 'z',
            Ź: 'Z',
            Ż: 'Z',
            ẓ: 'z',
            Ẓ: 'Z',
            ẏ: 'y',
            Ẏ: 'Y',
            ḻ: 'l',
            Ḻ: 'L',
            ṟ: 'r',
            Ṟ: 'R',
            ġ: 'g',
            ǧ: 'g',
            Ġ: 'G',
            Ǧ: 'G',
            ɓ: 'b',
            Ɓ: 'B',
            ɗ: 'd',
            Ɗ: 'D',
            ḥ: 'h',
            Ḥ: 'H',
            ħ: 'h',
            ḫ: 'h',
            ẖ: 'h',
            Ħ: 'H',
            Ḫ: 'H',
            H̱: 'H',
            ṃ: 'm',
            Ṃ: 'M',
            ṁ: 'm',
            Ṁ: 'M',
        };
        return table[ch] ?? ch;
    }

    static applyFinalARule(word, options) {
        if (word.length <= 2) return word;
        const lower = word.toLowerCase();
        if (!lower.endsWith('a')) return word;
        if (IastPlainEnglish.vowels.has(lower.at(-2))) return word;
        if (options.finalA === FinalAPolicy.DROP) return word.slice(0, -1);
        if (options.keepFinalAForWords.has(lower)) return word;
        if (
            ['moksha', 'vriksha', 'ashvattha', 'simha', 'sinha'].some((ending) =>
                lower.endsWith(ending),
            )
        ) {
            return word;
        }
        if (lower.endsWith('ya')) return word;
        if (
            lower.endsWith('ha') &&
            lower.length >= 3 &&
            IastPlainEnglish.vowels.has(lower.at(-3))
        ) {
            return word;
        }
        const without = word.slice(0, -1);
        return IastPlainEnglish.leavesAwkwardFinalCluster(without) ? word : without;
    }

    static leavesAwkwardFinalCluster(word) {
        const normalized = IastPlainEnglish.normalizeFinalCluster(word.toLowerCase());
        let last = -1;
        for (const vowel of 'aeiou') last = Math.max(last, normalized.lastIndexOf(vowel));
        const suffix = last >= 0 ? normalized.slice(last + 1) : normalized;
        if (suffix.length <= 1) return false;
        if (suffix === 'ng') return false;
        if (suffix.length >= 3) return true;
        const bad = new Set([
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
        ]);
        if (bad.has(suffix)) return true;
        return /[CKSDTGHPBX][mnlrvy]$/u.test(suffix);
    }

    static normalizeFinalCluster(word) {
        let result = word;
        for (const [from, to] of [
            ['ksh', 'K'],
            ['chh', 'H'],
            ['ch', 'C'],
            ['sh', 'S'],
            ['gh', 'G'],
            ['dh', 'D'],
            ['th', 'T'],
            ['ph', 'P'],
            ['bh', 'B'],
            ['kh', 'X'],
        ]) {
            result = result.replaceAll(from, to);
        }
        return result;
    }
}

export function toPlainEnglishFromIast(text, options = new IastPlainEnglishOptions()) {
    const resolved =
        options instanceof IastPlainEnglishOptions ? options : new IastPlainEnglishOptions(options);
    return IastPlainEnglish.convert(text, resolved);
}
export const to_plain_english_from_iast = toPlainEnglishFromIast;

export class IastToPlainEnglish extends String {
    toPlainEnglishFromIast(options = new IastPlainEnglishOptions()) {
        return toPlainEnglishFromIast(String(this), options);
    }
    to_plain_english_from_iast(options = new IastPlainEnglishOptions()) {
        return this.toPlainEnglishFromIast(options);
    }
}
