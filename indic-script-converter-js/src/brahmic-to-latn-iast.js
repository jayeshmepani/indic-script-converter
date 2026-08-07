import {
    LosslessTransliterationResult,
    TransliterationIssue,
    TransliterationIssueSeverity,
    TransliterationProfile,
    UnicodeNormalizationForm,
    hasEmbeddedExactSource,
    isEncodedVedicMark,
    isUnicodeCombiningMark,
    normalizeUnicode,
    recoverEmbeddedExactSource,
    stripExactSourceMetadata,
} from './transliteration-core.js';

export class ScriptToIastOptions {
    constructor(values = {}) {
        this.inputNormalization =
            values.inputNormalization ?? values.input_normalization ?? UnicodeNormalizationForm.NFD;
        this.input_normalization = this.inputNormalization;
        this.outputNormalization =
            values.outputNormalization ??
            values.output_normalization ??
            UnicodeNormalizationForm.NFC;
        this.output_normalization = this.outputNormalization;
        this.preserveUnmapped = values.preserveUnmapped ?? values.preserve_unmapped ?? true;
        this.preserve_unmapped = this.preserveUnmapped;
        this.preserveEncodedVedicMarks =
            values.preserveEncodedVedicMarks ?? values.preserve_encoded_vedic_marks ?? true;
        this.preserve_encoded_vedic_marks = this.preserveEncodedVedicMarks;
        Object.freeze(this);
    }
}

class ScriptConfig {
    constructor({ virama, nukta, independentVowels, vowelSigns, consonants, signs, digits }) {
        this.virama = virama;
        this.nukta = nukta;
        this.independentVowels = Object.freeze({ ...independentVowels });
        this.vowelSigns = Object.freeze({ ...vowelSigns });
        this.consonants = Object.freeze({ ...consonants });
        this.signs = Object.freeze({ ...signs });
        this.digits = Object.freeze({ ...digits });
        Object.freeze(this);
    }
}

class BrahmicToIast {
    static convert(inputText, config, options) {
        const visible = stripExactSourceMetadata(String(inputText));
        const normalized = normalizeUnicode(visible, options.inputNormalization);
        const chars = Array.from(normalized);
        const out = [];
        let i = 0;

        while (i < chars.length) {
            const ch = chars[i];

            const independent = config.independentVowels[ch];
            if (independent !== undefined) {
                out.push(independent);
                i += 1;
                continue;
            }

            let consonantKey = ch;
            let consonantWidth = 1;
            if (i + 1 < chars.length && chars[i + 1] === config.nukta) {
                const withNukta = ch + config.nukta;
                if (Object.hasOwn(config.consonants, withNukta)) {
                    consonantKey = withNukta;
                    consonantWidth = 2;
                }
            }

            const consonant = config.consonants[consonantKey];
            if (consonant !== undefined) {
                out.push(consonant);
                i += consonantWidth;
                if (i < chars.length) {
                    const next = chars[i];
                    const vowel = config.vowelSigns[next];
                    if (vowel !== undefined) {
                        out.push(vowel);
                        i += 1;
                        continue;
                    }
                    if (next === config.virama) {
                        i += 1;
                        continue;
                    }
                }
                out.push('a');
                continue;
            }

            const standaloneVowel = config.vowelSigns[ch];
            if (standaloneVowel !== undefined) {
                out.push(standaloneVowel);
                i += 1;
                continue;
            }

            const sign = config.signs[ch];
            if (sign !== undefined) {
                out.push(sign);
                i += 1;
                continue;
            }

            const digit = config.digits[ch];
            if (digit !== undefined) {
                out.push(digit);
                i += 1;
                continue;
            }

            if (isEncodedVedicMark(ch)) {
                if (options.preserveEncodedVedicMarks) {
                    const cp = ch.codePointAt(0);
                    out.push(
                        cp === 0x0951
                            ? '\u0301'
                            : cp === 0x0952
                              ? '\u0300'
                              : cp === 0x1cda
                                ? '\u0302'
                                : ch,
                    );
                }
                i += 1;
                continue;
            }

            if (options.preserveUnmapped) out.push(ch);
            i += 1;
        }

        const canonical = BrahmicToIast.reattachVedicAccentsToVowels(out.join(''));
        return normalizeUnicode(canonical, options.outputNormalization);
    }

    static reattachVedicAccentsToVowels(text) {
        const chars = Array.from(text);
        let i = 0;
        while (i < chars.length) {
            const ch = chars[i];
            if (!BrahmicToIast.isLatinVedicAccent(ch)) {
                i += 1;
                continue;
            }
            const target = BrahmicToIast.findAccentVowelTarget(chars, i);
            if (target === null) {
                i += 1;
                continue;
            }
            const [accent] = chars.splice(i, 1);
            chars.splice(target + 1, 0, accent);
            i += 1;
        }
        return chars.join('');
    }

    static findAccentVowelTarget(chars, accentIndex) {
        let target = accentIndex - 1;
        if (target < 0) return null;
        if (chars[target] === '\u0310' && target - 1 >= 0 && chars[target - 1] === 'm') {
            target -= 2;
        } else if (chars[target] === 'ḥ' || chars[target] === 'ṃ') {
            target -= 1;
        }
        while (target >= 0 && BrahmicToIast.isNonAccentCombiningMark(chars[target])) {
            target -= 1;
        }
        if (target < 0) return null;
        return BrahmicToIast.isLatinVowel(chars[target]) ? target : null;
    }

    static isLatinVedicAccent(ch) {
        return ['\u0301', '\u0300', '\u0302'].includes(ch);
    }

    static isNonAccentCombiningMark(ch) {
        return isUnicodeCombiningMark(ch) && !BrahmicToIast.isLatinVedicAccent(ch);
    }

    static isLatinVowel(ch) {
        return new Set([
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
        ]).has(ch.toLowerCase());
    }
}

const devanagari = new ScriptConfig({
    virama: '्',
    nukta: '़',
    independentVowels: {
        अ: 'a',
        आ: 'ā',
        इ: 'i',
        ई: 'ī',
        उ: 'u',
        ऊ: 'ū',
        ऋ: 'ṛ',
        ॠ: 'ṝ',
        ऌ: 'ḷ',
        ॡ: 'ḹ',
        ऄ: 'ă',
        ऍ: 'ê',
        ऎ: 'ĕ',
        ए: 'e',
        ऐ: 'ai',
        ऑ: 'ô',
        ऒ: 'ŏ',
        ओ: 'o',
        औ: 'au',
        ॲ: 'æ',
        ॳ: 'oe',
        ॴ: 'ōe',
        ॵ: 'aw',
        ॶ: 'ue',
        ॷ: 'ūe',
    },
    vowelSigns: {
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
    consonants: {
        क: 'k',
        ख: 'kh',
        ग: 'g',
        घ: 'gh',
        ङ: 'ṅ',
        च: 'c',
        छ: 'ch',
        ज: 'j',
        झ: 'jh',
        ञ: 'ñ',
        ट: 'ṭ',
        ठ: 'ṭh',
        ड: 'ḍ',
        ढ: 'ḍh',
        ण: 'ṇ',
        त: 't',
        थ: 'th',
        द: 'd',
        ध: 'dh',
        न: 'n',
        प: 'p',
        फ: 'ph',
        ब: 'b',
        भ: 'bh',
        म: 'm',
        य: 'y',
        र: 'r',
        ल: 'l',
        व: 'v',
        श: 'ś',
        ष: 'ṣ',
        स: 's',
        ह: 'h',
        ऴ: 'ḻ',
        ळ: 'ḷ',
        ऴ: 'ḻ',
        क़: 'q',
        ख़: 'x',
        ग़: 'ġ',
        ज़: 'z',
        ड़: 'ṛ',
        ढ़: 'ṛh',
        फ़: 'f',
        य़: 'ẏ',
        ऩ: 'ṉ',
        ऱ: 'ṟ',
        त़: 'ṯ',
        द़: 'ḏ',
        ह़: 'ẖ',
        स़: 's̱',
        ॸ: 'ḍḍ',
        ॹ: 'ž',
        ॺ: 'yy',
        ॻ: 'gg',
        ॼ: 'jj',
        ॾ: 'ddd',
        ॿ: 'bb',
        ॽ: 'ʔ',
    },
    signs: {
        'ँ': '\u0310',
        'ं': 'ṃ',
        'ः': 'ḥ',
        ऽ: "'",
        ॐ: 'oṃ',
        '॑': '\u0301',
        '॒': '\u0300',
        '᳚': '\u0302',
        ᳪ: 'm\u0310',
        '।': '|',
        '॥': '||',
    },
    digits: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [String.fromCodePoint(0x0966 + i), String(i)]),
    ),
});

const gujarati = new ScriptConfig({
    virama: '્',
    nukta: '઼',
    independentVowels: {
        અ: 'a',
        આ: 'ā',
        ઇ: 'i',
        ઈ: 'ī',
        ઉ: 'u',
        ઊ: 'ū',
        ઋ: 'ṛ',
        ૠ: 'ṝ',
        ઌ: 'ḷ',
        ૡ: 'ḹ',
        ઍ: 'ĕ',
        એ: 'e',
        ઐ: 'ai',
        ઑ: 'ŏ',
        ઓ: 'o',
        ઔ: 'au',
    },
    vowelSigns: {
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
    consonants: {
        ક: 'k',
        ખ: 'kh',
        ગ: 'g',
        ઘ: 'gh',
        ઙ: 'ṅ',
        ચ: 'c',
        છ: 'ch',
        જ: 'j',
        ઝ: 'jh',
        ઞ: 'ñ',
        ટ: 'ṭ',
        ઠ: 'ṭh',
        ડ: 'ḍ',
        ઢ: 'ḍh',
        ણ: 'ṇ',
        ત: 't',
        થ: 'th',
        દ: 'd',
        ધ: 'dh',
        ન: 'n',
        પ: 'p',
        ફ: 'ph',
        બ઼: 'ɓ',
        બ: 'b',
        ભ: 'bh',
        મ: 'm',
        ય: 'y',
        ર: 'r',
        લ: 'l',
        વ: 'v',
        શ: 'ś',
        ષ: 'ṣ',
        સ: 's',
        હ: 'h',
        ળ: 'ḷ',
        ૹ: 'ḻ',
        ક઼: 'q',
        ખ઼: 'x',
        ગ઼: 'ġ',
        જ઼: 'z',
        ડ઼: 'ṛ',
        ઢ઼: 'ṛh',
        ફ઼: 'f',
        ય઼: 'ẏ',
        ન઼: 'ṉ',
        ર઼: 'ṟ',
        ત઼: 'ṯ',
        દ઼: 'ḏ',
        હ઼: 'ẖ',
        સ઼: 's̱',
    },
    signs: {
        'ઁ': '\u0310',
        'ં': 'ṃ',
        'ઃ': 'ḥ',
        ઽ: "'",
        ૐ: 'oṃ',
        '॑': '\u0301',
        '॒': '\u0300',
        '᳚': '\u0302',
        ᳪ: 'm\u0310',
        '।': '|',
        '॥': '||',
    },
    digits: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [String.fromCodePoint(0x0ae6 + i), String(i)]),
    ),
});

function opts(value) {
    return value instanceof ScriptToIastOptions ? value : new ScriptToIastOptions(value);
}

export function toIastFromDevanagari(text, options = new ScriptToIastOptions()) {
    return (
        recoverEmbeddedExactSource(text) ?? BrahmicToIast.convert(text, devanagari, opts(options))
    );
}
export const to_iast_from_devanagari = toIastFromDevanagari;

export function toExactIastFromDevanagari(text) {
    if (String(text).length === 0) return '';
    const exact = recoverEmbeddedExactSource(text);
    if (exact === null) {
        throw new TypeError(
            'No valid embedded exact-source metadata was found. Convert with IastToDevanagariOptions(embedExactSourceMetadata: true).',
        );
    }
    return exact;
}
export const to_exact_iast_from_devanagari = toExactIastFromDevanagari;

export function toCanonicalIastFromDevanagari(text, options = new ScriptToIastOptions()) {
    return BrahmicToIast.convert(text, devanagari, opts(options));
}
export const to_canonical_iast_from_devanagari = toCanonicalIastFromDevanagari;

export function toIastFromGujarati(text, options = new ScriptToIastOptions()) {
    return recoverEmbeddedExactSource(text) ?? BrahmicToIast.convert(text, gujarati, opts(options));
}
export const to_iast_from_gujarati = toIastFromGujarati;

export function toExactIastFromGujarati(text) {
    if (String(text).length === 0) return '';
    const exact = recoverEmbeddedExactSource(text);
    if (exact === null) {
        throw new TypeError(
            'No valid embedded exact-source metadata was found. Convert with IastToGujaratiOptions(embedExactSourceMetadata: true).',
        );
    }
    return exact;
}
export const to_exact_iast_from_gujarati = toExactIastFromGujarati;

export function toCanonicalIastFromGujarati(text, options = new ScriptToIastOptions()) {
    return BrahmicToIast.convert(text, gujarati, opts(options));
}
export const to_canonical_iast_from_gujarati = toCanonicalIastFromGujarati;

export function hasExactDevanagariSourceMetadata(text) {
    return hasEmbeddedExactSource(text);
}
export const has_exact_devanagari_source_metadata = hasExactDevanagariSourceMetadata;
export function visibleDevanagariWithoutExactSourceMetadata(text) {
    return stripExactSourceMetadata(text);
}
export const visible_devanagari_without_exact_source_metadata =
    visibleDevanagariWithoutExactSourceMetadata;
export function hasExactGujaratiSourceMetadata(text) {
    return hasEmbeddedExactSource(text);
}
export const has_exact_gujarati_source_metadata = hasExactGujaratiSourceMetadata;
export function visibleGujaratiWithoutExactSourceMetadata(text) {
    return stripExactSourceMetadata(text);
}
export const visible_gujarati_without_exact_source_metadata =
    visibleGujaratiWithoutExactSourceMetadata;

export function toLosslessCanonicalIastFromDevanagari(text, options = new ScriptToIastOptions()) {
    const resolved = opts(options);
    const visible = stripExactSourceMetadata(text);
    const normalized = normalizeUnicode(visible, resolved.inputNormalization);
    return new LosslessTransliterationResult({
        original: String(text),
        normalizedInput: normalized,
        rendered: BrahmicToIast.convert(visible, devanagari, resolved),
        profile: TransliterationProfile.STRICT_IAST,
        inputNormalization: resolved.inputNormalization,
        outputNormalization: resolved.outputNormalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: 'CANONICAL_REVERSE_DOES_NOT_RECREATE_LATIN_ALIASES',
                message:
                    'Canonical IAST is generated. Use toExactIastFromDevanagari() for a metadata-backed exact source key.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}
export const to_lossless_canonical_iast_from_devanagari = toLosslessCanonicalIastFromDevanagari;

export function toLosslessCanonicalIastFromGujarati(text, options = new ScriptToIastOptions()) {
    const resolved = opts(options);
    const visible = stripExactSourceMetadata(text);
    const normalized = normalizeUnicode(visible, resolved.inputNormalization);
    return new LosslessTransliterationResult({
        original: String(text),
        normalizedInput: normalized,
        rendered: BrahmicToIast.convert(visible, gujarati, resolved),
        profile: TransliterationProfile.STRICT_IAST,
        inputNormalization: resolved.inputNormalization,
        outputNormalization: resolved.outputNormalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: 'CANONICAL_REVERSE_DOES_NOT_RECREATE_LATIN_ALIASES',
                message:
                    'Canonical IAST is generated. Use toExactIastFromGujarati() for a metadata-backed exact source key.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}
export const to_lossless_canonical_iast_from_gujarati = toLosslessCanonicalIastFromGujarati;

export class DevanagariToIast extends String {
    toIastFromDevanagari(options = new ScriptToIastOptions()) {
        return toIastFromDevanagari(String(this), options);
    }
    to_iast_from_devanagari(options = new ScriptToIastOptions()) {
        return this.toIastFromDevanagari(options);
    }
    toExactIastFromDevanagari() {
        return toExactIastFromDevanagari(String(this));
    }
    to_exact_iast_from_devanagari() {
        return this.toExactIastFromDevanagari();
    }
    toCanonicalIastFromDevanagari(options = new ScriptToIastOptions()) {
        return toCanonicalIastFromDevanagari(String(this), options);
    }
    to_canonical_iast_from_devanagari(options = new ScriptToIastOptions()) {
        return this.toCanonicalIastFromDevanagari(options);
    }
    get hasExactDevanagariSourceMetadata() {
        return hasExactDevanagariSourceMetadata(String(this));
    }
    get has_exact_devanagari_source_metadata() {
        return this.hasExactDevanagariSourceMetadata;
    }
    get visibleDevanagariWithoutExactSourceMetadata() {
        return visibleDevanagariWithoutExactSourceMetadata(String(this));
    }
    get visible_devanagari_without_exact_source_metadata() {
        return this.visibleDevanagariWithoutExactSourceMetadata;
    }
}

export class GujaratiToIast extends String {
    toIastFromGujarati(options = new ScriptToIastOptions()) {
        return toIastFromGujarati(String(this), options);
    }
    to_iast_from_gujarati(options = new ScriptToIastOptions()) {
        return this.toIastFromGujarati(options);
    }
    toExactIastFromGujarati() {
        return toExactIastFromGujarati(String(this));
    }
    to_exact_iast_from_gujarati() {
        return this.toExactIastFromGujarati();
    }
    toCanonicalIastFromGujarati(options = new ScriptToIastOptions()) {
        return toCanonicalIastFromGujarati(String(this), options);
    }
    to_canonical_iast_from_gujarati(options = new ScriptToIastOptions()) {
        return this.toCanonicalIastFromGujarati(options);
    }
    get hasExactGujaratiSourceMetadata() {
        return hasExactGujaratiSourceMetadata(String(this));
    }
    get has_exact_gujarati_source_metadata() {
        return this.hasExactGujaratiSourceMetadata;
    }
    get visibleGujaratiWithoutExactSourceMetadata() {
        return visibleGujaratiWithoutExactSourceMetadata(String(this));
    }
    get visible_gujarati_without_exact_source_metadata() {
        return this.visibleGujaratiWithoutExactSourceMetadata;
    }
}
