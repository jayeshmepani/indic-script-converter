import {
    UnicodeNormalizationForm,
    hasEmbeddedExactSource,
    isBrahmicFormatControl,
    isGujaratiConsonantNukta,
    isSamavedaCantillationMark,
    isVedicNasalMark,
    isVedicSegmentalSign,
    isVedicToneCantillationMark,
    isVedicVisargaMark,
    isUnicodeCombiningMark,
    normalizeUnicode,
    recoverEmbeddedExactSource,
    stripExactSourceMetadata,
} from './transliteration-core.js';
import {
    FinalAPolicy,
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    toPlainEnglishFromIast,
} from './latn-iast-transcription.js';

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
    constructor({
        script,
        virama,
        nukta,
        independentVowels,
        vowelSigns,
        consonants,
        signs,
        digits,
    }) {
        this.script = script;
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

const GUJARATI_SUKUN = 'ૺ';
const GUJARATI_SHADDA = 'ૻ';
const GUJARATI_MADDAH = 'ૼ';
const SEMANTIC_OM = '\uE102';

function gujaratiClusterTransliteration(base, mark) {
    if (mark === '૾') {
        if (base === 'સ') return 'th';
        if (base === 'ઝ') return 'dh';
    }
    if (mark === '૿' && base === 'ઝ') return 'ẓ';
    if (mark === '૽') {
        return { ક: 'q', ખ: 'x', ગ: 'ġ', ત: 'ṭ', સ: 'ṣ', ઝ: 'ḍ' }[base] ?? null;
    }
    return null;
}

function vedicSegmentalLatin(cp) {
    if (isVedicVisargaMark(cp)) return 'ḥ';
    if (isVedicNasalMark(cp)) return 'ṃ';
    if (isVedicSegmentalSign(cp)) {
        if (cp === 0x1cf2 || cp === 0x1cf3) return 'ḥ';
        if (cp === 0x1cf5) return 'ḫ';
        return 'f';
    }
    if (cp >= 0xa8f2 && cp <= 0xa8f6) return cp === 0xa8f4 ? 'ṃṃ' : 'ṃ';
    if (cp === 0xa8f7) return "ṃ'";
    return null;
}

function lengthenCanonicalVowel(vowel) {
    return (
        {
            a: 'ā',
            i: 'ī',
            u: 'ū',
            e: 'ē',
            o: 'ō',
            ă: 'ā',
            ĕ: 'ē',
            ŏ: 'ō',
            ĭ: 'ī',
        }[vowel] ?? vowel
    );
}

/** Read one dependent vowel, including historic prishthamatra compositions. */
function readVowelSign(chars, index, config) {
    if (index >= chars.length) return null;
    const ch = chars[index];
    if (config.script === 'devanagari' && ch === 'ॎ') {
        const following = chars[index + 1];
        if (following === 'े') return { vowel: 'ai', width: 2 };
        if (following === 'ा') return { vowel: 'o', width: 2 };
        if (following === 'ो') return { vowel: 'au', width: 2 };
        return { vowel: 'e', width: 1 };
    }
    const vowel = config.vowelSigns[ch];
    return vowel === undefined ? null : { vowel, width: 1 };
}

class BrahmicToIast {
    static convert(inputText, config, options, inherentVowel = 'a', readableOverrides = null) {
        const visible = stripExactSourceMetadata(String(inputText));
        const normalized = normalizeUnicode(visible, options.inputNormalization);
        const chars = Array.from(normalized);
        const out = [];
        let i = 0;

        while (i < chars.length) {
            const ch = chars[i];

            const independent = config.independentVowels[ch];
            if (independent !== undefined) {
                let latin = readableOverrides?.independentVowels?.[ch] ?? independent;
                i += 1;
                if (config.script === 'gujarati' && ['અ', 'ઇ'].includes(ch) && chars[i] === '૽') {
                    latin = `ʿ${latin}`;
                    i += 1;
                }
                if (config.script === 'gujarati') {
                    while (i < chars.length) {
                        if (chars[i] === GUJARATI_MADDAH) {
                            latin = lengthenCanonicalVowel(latin);
                            i += 1;
                        } else if (chars[i] === GUJARATI_SUKUN) {
                            // On an independent vowel U+0AFA marks a pause, not vowel deletion.
                            i += 1;
                        } else {
                            break;
                        }
                    }
                }
                out.push(latin);
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
                let latin = readableOverrides?.consonants?.[consonantKey] ?? consonant;
                let cursor = i + consonantWidth;
                let geminated = false;
                let sukun = false;
                let maddah = false;

                // Gujarati Arabic-transliteration modifiers may stack. Accept
                // both canonical ordering and tolerant alternate ordering.
                if (config.script === 'gujarati') {
                    let scanning = true;
                    let specialNuktaSeen = false;
                    while (scanning && cursor < chars.length) {
                        const mark = chars[cursor];
                        if (!specialNuktaSeen && isGujaratiConsonantNukta(mark.codePointAt(0))) {
                            latin =
                                gujaratiClusterTransliteration(consonantKey, mark) ?? latin + mark;
                            specialNuktaSeen = true;
                            cursor += 1;
                        } else if (mark === GUJARATI_SHADDA) {
                            geminated = true;
                            cursor += 1;
                        } else if (mark === GUJARATI_SUKUN) {
                            sukun = true;
                            cursor += 1;
                        } else if (mark === GUJARATI_MADDAH) {
                            maddah = true;
                            cursor += 1;
                        } else {
                            scanning = false;
                        }
                    }
                }

                const vowelInfo = readVowelSign(chars, cursor, config);
                let explicitVowel = null;
                if (vowelInfo !== null) {
                    explicitVowel = vowelInfo.vowel;
                    cursor += vowelInfo.width;
                    // An explicit vowel wins over a preceding/tolerated sukun.
                    sukun = false;
                    // Maddah is attested after an explicit vowel sign (e.g. કુૼ).
                    if (config.script === 'gujarati' && chars[cursor] === GUJARATI_MADDAH) {
                        maddah = true;
                        cursor += 1;
                    }
                }

                let virama = false;
                if (chars[cursor] === config.virama) {
                    virama = true;
                    cursor += 1;
                }
                // Be tolerant of trailing Gujarati recitation marks after the vowel.
                if (config.script === 'gujarati') {
                    while (cursor < chars.length) {
                        const mark = chars[cursor];
                        if (mark === GUJARATI_MADDAH) {
                            maddah = true;
                            cursor += 1;
                        } else if (mark === GUJARATI_SUKUN) {
                            // With an explicit vowel this is a tolerated pause mark, not a killer.
                            if (explicitVowel === null) sukun = true;
                            cursor += 1;
                        } else if (mark === GUJARATI_SHADDA) {
                            geminated = true;
                            cursor += 1;
                        } else {
                            break;
                        }
                    }
                }

                out.push(latin);
                if (geminated) out.push(latin);
                i = cursor;

                if (virama || sukun) continue;
                if (geminated && explicitVowel === null && !maddah) continue;

                let vowel = explicitVowel ?? inherentVowel;
                if (maddah) vowel = lengthenCanonicalVowel(vowel === inherentVowel ? 'a' : vowel);
                out.push(vowel);
                continue;
            }

            const standaloneVowel = readVowelSign(chars, i, config);
            if (standaloneVowel !== null) {
                let vowel = standaloneVowel.vowel;
                i += standaloneVowel.width;
                if (config.script === 'gujarati' && chars[i] === GUJARATI_MADDAH) {
                    vowel = lengthenCanonicalVowel(vowel);
                    i += 1;
                }
                out.push(vowel);
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

            const segmental = vedicSegmentalLatin(ch.codePointAt(0));
            if (segmental !== null) {
                out.push(segmental);
                if (options.preserveEncodedVedicMarks) out.push(ch);
                i += 1;
                continue;
            }

            if (
                isVedicToneCantillationMark(ch.codePointAt(0)) ||
                isSamavedaCantillationMark(ch.codePointAt(0))
            ) {
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

            if (isBrahmicFormatControl(ch.codePointAt(0))) {
                i += 1;
                continue;
            }

            if (ch.codePointAt(0) === 0x25cc) {
                if (options.preserveUnmapped) out.push(ch);
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
        ]).has(ch.toLowerCase());
    }
}

const devanagari = new ScriptConfig({
    script: 'devanagari',
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
        '\u{A8FE}': 'aĭ',
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
        '\u{094E}': 'e',
        '\u{0955}': 'ē',
        '\u{A8FF}': 'aĭ',
    },
    consonants: {
        क: 'k',
        ख: 'kh',
        ग: 'g',
        घ: 'gh',
        ङ: 'ṅ',
        च: 'c',
        च़: 'ċ',
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
        ॻ: 'ɠ',
        ॼ: 'ʄ',
        ॾ: 'ɗ',
        ॿ: 'ɓ',
        ॽ: 'ʔ',
        '\u{0929}': 'ṉ',
        '\u{0931}': 'ṟ',
        '\u{0958}': 'q',
        '\u{0959}': 'x',
        '\u{095A}': 'ġ',
        '\u{095B}': 'z',
        '\u{095C}': 'ṛ',
        '\u{095D}': 'ṛh',
        '\u{095E}': 'f',
        '\u{095F}': 'ẏ',
        '\u{11B0A}': 'ɗ',
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
        '\u{0900}': '\u0310',
        '\u{0953}': '\u0300',
        '\u{0954}': '\u0301',
        '\u{0970}': '\u{0970}',
        '\u{0971}': '\u{0971}',
        '\u{A8FC}': '\u{A8FC}',
        '\u{A8FD}': 'oṃ',
        '\u{A8F8}': '\u{A8F8}',
        '\u{A8F9}': '\u{A8F9}',
        '\u{A8FA}': '\u{A8FA}',
        '\u{A8FB}': '\u{A8FB}',
        '\u{11B00}': '\u{11B00}',
        '\u{11B01}': '\u{11B01}',
        '\u{11B02}': '\u{11B02}',
        '\u{11B03}': '\u{11B03}',
        '\u{11B04}': '\u{11B04}',
        '\u{11B05}': '\u{11B05}',
        '\u{11B06}': '\u{11B06}',
        '\u{11B07}': '\u{11B07}',
        '\u{11B08}': '\u{11B08}',
        '\u{11B09}': '\u{11B09}',
        '\u{A830}': '\u{A830}',
        '\u{A831}': '\u{A831}',
        '\u{A832}': '\u{A832}',
        '\u{A833}': '\u{A833}',
        '\u{A834}': '\u{A834}',
        '\u{A835}': '\u{A835}',
        '\u{A836}': '\u{A836}',
        '\u{A837}': '\u{A837}',
        '\u{A838}': '\u{A838}',
        '\u{A839}': '\u{A839}',
    },
    digits: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [String.fromCodePoint(0x0966 + i), String(i)]),
    ),
});

const gujarati = new ScriptConfig({
    script: 'gujarati',
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
        '\u{0AF0}': '\u{0AF0}',
        '\u{0AF1}': '\u{0AF1}',
        '\u{A830}': '\u{A830}',
        '\u{A831}': '\u{A831}',
        '\u{A832}': '\u{A832}',
        '\u{A833}': '\u{A833}',
        '\u{A834}': '\u{A834}',
        '\u{A835}': '\u{A835}',
        '\u{A836}': '\u{A836}',
        '\u{A837}': '\u{A837}',
        '\u{A838}': '\u{A838}',
        '\u{A839}': '\u{A839}',
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

const INHERENT_SCHWA = '\uE100';
// A medial inherent vowel that natural mode deletes. It stays inside the word
// until vowel-length decisions, then it is removed. A virama cluster has no
// boundary; a deleted schwa does. Final schwa deletion does not emit one.
const SYLLABLE_BREAK = '\uE101';

export const BrahmicLanguage = Object.freeze({
    AUTO: 'auto',
    HINDI: 'hindi',
    GUJARATI: 'gujarati',
    SANSKRIT: 'sanskrit',
    auto: 'auto',
    hindi: 'hindi',
    gujarati: 'gujarati',
    sanskrit: 'sanskrit',
});

export const BrahmicSchwaDeletionPolicy = Object.freeze({
    NONE: 'none',
    FINAL: 'final',
    LANGUAGE: 'language',
    none: 'none',
    final: 'final',
    language: 'language',
});

export const BrahmicVowelLengthPolicy = Object.freeze({
    COLLAPSE: 'collapse',
    DOUBLE: 'double',
    SMART: 'smart',
    collapse: 'collapse',
    double: 'double',
    smart: 'smart',
});

export const BrahmicReadableStyle = Object.freeze({
    LEGACY: 'legacy',
    NATURAL: 'natural',
    legacy: 'legacy',
    natural: 'natural',
});

export const TerminalAnusvaraPolicy = Object.freeze({
    N: 'n',
    M: 'm',
    DROP: 'drop',
    n: 'n',
    m: 'm',
    drop: 'drop',
});

export const AynPolicy = Object.freeze({
    APOSTROPHE: 'apostrophe',
    DROP: 'drop',
    PRESERVE: 'preserve',
    apostrophe: 'apostrophe',
    drop: 'drop',
    preserve: 'preserve',
});

/**
 * Options for direct Brahmic -> readable Latin transcription.
 *
 * Canonical Brahmic -> IAST remains untouched. These options apply only to the
 * intentionally lossy, pronunciation-oriented Plain-English/Hunterian view.
 */
export class BrahmicPlainEnglishOptions {
    constructor(values = {}) {
        this.language = values.language ?? BrahmicLanguage.AUTO;
        this.schwaDeletion =
            values.schwaDeletion ?? values.schwa_deletion ?? BrahmicSchwaDeletionPolicy.LANGUAGE;
        this.schwa_deletion = this.schwaDeletion;
        this.vowelLength =
            values.vowelLength ?? values.vowel_length ?? BrahmicVowelLengthPolicy.DOUBLE;
        this.vowel_length = this.vowelLength;
        this.readableStyle =
            values.readableStyle ?? values.readable_style ?? BrahmicReadableStyle.LEGACY;
        this.readable_style = this.readableStyle;
        this.terminalAnusvara =
            values.terminalAnusvara ?? values.terminal_anusvara ?? TerminalAnusvaraPolicy.N;
        this.terminal_anusvara = this.terminalAnusvara;
        this.ayn = values.ayn ?? values.aynPolicy ?? values.ayn_policy ?? AynPolicy.APOSTROPHE;
        this.ayn_policy = this.ayn;
        this.jna = values.jna;
        this.nya = values.nya;
        this.glottalStop = values.glottalStop ?? values.glottal_stop;
        this.convertCToCh = values.convertCToCh ?? values.convert_c_to_ch;
        this.assimilateAnusvara = values.assimilateAnusvara ?? values.assimilate_anusvara;
        this.removeAvagraha = values.removeAvagraha ?? values.remove_avagraha;
        this.collapseWhitespace = values.collapseWhitespace ?? values.collapse_whitespace;
        this.preserveVedicAccentMarks =
            values.preserveVedicAccentMarks ?? values.preserve_vedic_accent_marks;
        this.useWForVAfterConsonants =
            values.useWForVAfterConsonants ?? values.use_w_for_v_after_consonants;
        this.capitalizeSentenceStarts =
            values.capitalizeSentenceStarts ?? values.capitalize_sentence_starts ?? false;
        this.capitalize_sentence_starts = this.capitalizeSentenceStarts;
        const readableWordOverrides =
            values.readableWordOverrides ?? values.readable_word_overrides ?? {};
        this.readableWordOverrides =
            readableWordOverrides instanceof Map
                ? Object.freeze(Object.fromEntries(readableWordOverrides))
                : Object.freeze({ ...readableWordOverrides });
        this.readable_word_overrides = this.readableWordOverrides;
        Object.freeze(this);
    }
}

function brahmicPlainOpts(value) {
    return value instanceof BrahmicPlainEnglishOptions
        ? value
        : new BrahmicPlainEnglishOptions(value);
}

function transcriptionChars(text) {
    return Array.from(text);
}

function isSourceLatinBase(ch) {
    const cp = ch.codePointAt(0);
    return (
        (cp >= 0x41 && cp <= 0x5a) ||
        (cp >= 0x61 && cp <= 0x7a) ||
        (cp >= 0x00c0 && cp <= 0x024f) ||
        (cp >= 0x0250 && cp <= 0x02ff) ||
        (cp >= 0x1e00 && cp <= 0x1eff)
    );
}

function isSourceLatinCombiningMark(ch) {
    const cp = ch.codePointAt(0);
    return (
        (cp >= 0x0300 && cp <= 0x036f) ||
        (cp >= 0x1ab0 && cp <= 0x1aff) ||
        (cp >= 0x1dc0 && cp <= 0x1dff) ||
        (cp >= 0xfe20 && cp <= 0xfe2f)
    );
}

function isSourceLatinPunctuation(ch) {
    return ch === '‘' || ch === '’';
}

function protectSourceLatin(text) {
    const source = String(text);
    const chars = Array.from(source);
    const spans = [];
    const out = [];
    let i = 0;
    let nextToken = 0xf0000;

    const allocateToken = () => {
        while (nextToken <= 0x10fffd) {
            // Skip the non-private gap between supplementary PUA planes.
            if (nextToken > 0xffffd && nextToken < 0x100000) nextToken = 0x100000;
            const token = String.fromCodePoint(nextToken);
            nextToken += 1;
            if (!source.includes(token)) return token;
        }
        throw new RangeError('Too many protected Latin spans in Brahmic transcription input.');
    };

    while (i < chars.length) {
        if (isSourceLatinPunctuation(chars[i])) {
            const token = allocateToken();
            spans.push([token, chars[i]]);
            out.push(token);
            i += 1;
            continue;
        }
        if (!isSourceLatinBase(chars[i])) {
            out.push(chars[i]);
            i += 1;
            continue;
        }

        const start = i;
        i += 1;
        while (
            i < chars.length &&
            (isSourceLatinBase(chars[i]) || isSourceLatinCombiningMark(chars[i]))
        ) {
            i += 1;
        }

        const token = allocateToken();
        spans.push([token, chars.slice(start, i).join('')]);
        out.push(token);
    }

    return { text: out.join(''), spans };
}

function restoreSourceLatin(text, spans) {
    let result = String(text);
    for (const [token, original] of spans) result = result.replaceAll(token, original);
    return result;
}

function isTranscriptionWordChar(ch) {
    if (ch === INHERENT_SCHWA || ch === SYLLABLE_BREAK) return true;
    const cp = ch.codePointAt(0);
    return (
        (cp >= 0x41 && cp <= 0x5a) ||
        (cp >= 0x61 && cp <= 0x7a) ||
        (cp >= 0x00c0 && cp <= 0x024f) ||
        (cp >= 0x0250 && cp <= 0x02ff) ||
        (cp >= 0x1e00 && cp <= 0x1eff) ||
        isUnicodeCombiningMark(ch)
    );
}

const IAST_VOWELS = new Set([
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
]);
const IAST_SIGNS = new Set(['ṃ', 'ṁ', 'ḥ']);
const ASPIRATED = ['kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh', 'ṛh'];

function tokenizeAnnotatedWord(word, separateVocalicRh = false) {
    const chars = Array.from(word);
    const tokens = [];
    let i = 0;
    while (i < chars.length) {
        const ch = chars[i];
        if (ch === INHERENT_SCHWA) {
            tokens.push({ type: 'vowel', text: 'a', implicit: true });
            i += 1;
            continue;
        }
        if (ch === SYLLABLE_BREAK) {
            tokens.push({ type: 'boundary', text: '' });
            i += 1;
            continue;
        }
        const pair = i + 1 < chars.length ? ch + chars[i + 1] : '';
        if (pair === 'ai' || pair === 'au') {
            tokens.push({ type: 'vowel', text: pair, implicit: false });
            i += 2;
            continue;
        }
        // ढ़ is the consonant sequence ṛh. Vocalic ṛ + ह/હ is the same
        // character sequence after a consonant (ગૃહ, गृह). Split that pair
        // only in natural mode so legacy 1.1 tokenization stays put.
        if (
            separateVocalicRh &&
            pair.toLowerCase() === 'ṛh' &&
            tokens.at(-1)?.type === 'consonant'
        ) {
            tokens.push({ type: 'vowel', text: ch, implicit: false });
            i += 1;
            continue;
        }
        if (ASPIRATED.includes(pair.toLowerCase())) {
            tokens.push({ type: 'consonant', text: pair });
            i += 2;
            continue;
        }
        if (IAST_VOWELS.has(ch.toLowerCase())) {
            tokens.push({ type: 'vowel', text: ch, implicit: false });
            i += 1;
            continue;
        }
        if (IAST_SIGNS.has(ch)) {
            tokens.push({ type: 'sign', text: ch });
            i += 1;
            continue;
        }
        if (isUnicodeCombiningMark(ch)) {
            if (tokens.length > 0) tokens.at(-1).text += ch;
            else tokens.push({ type: 'other', text: ch });
            i += 1;
            continue;
        }
        tokens.push({
            type: /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/u.test(ch) ? 'consonant' : 'other',
            text: ch,
        });
        i += 1;
    }
    return tokens;
}

function baseConsonant(token) {
    let s = token.text.toLowerCase().normalize('NFC');
    if (s.endsWith('h') && s.length > 1) s = s.slice(0, -1);
    return s;
}

function isAspiratedGha(token) {
    // baseConsonant folds ઘ/घ to g, so an allow-list key of n+g also matches
    // unaspirated નગર. The નારાયણઘાટે contraction is the aspirate only.
    return token?.text?.toLowerCase().normalize('NFC') === 'gh';
}

function isAspiratedDental(token) {
    // baseConsonant likewise folds થ/थ and ઠ/ठ to t. पति must keep its vowel;
    // only the aspirate (શાપથી) syncopates.
    const text = token?.text?.toLowerCase().normalize('NFC');
    return text === 'th' || text === 'ṭh';
}

function allowsSchwaCluster(left, right, language, readableStyle = BrahmicReadableStyle.LEGACY) {
    const a = baseConsonant(left);
    const b = baseConsonant(right);
    if (!a || !b) return false;

    if (language === BrahmicLanguage.GUJARATI) {
        // 1.1-compatible conservative Gujarati syncope.
        if (b === 'v') return true; // naṭavara -> naṭvara, besavā -> besvā
        if (b === 'n') return true; // gulābanā -> gulābnā, hīranī -> hīrnī

        const legacyClusters = new Set(['b+t', 'r+m', 'ś+m', 'ṣ+m', 's+m', 'ṇ+l', 'n+l']);
        if (legacyClusters.has(`${a}+${b}`)) return true;

        if (readableStyle !== BrahmicReadableStyle.NATURAL) return false;

        // ઘ is gh. Matching on base g would also swallow નગર (gandhinagar).
        if ((a === 'n' || a === 'ṇ') && isAspiratedGha(right)) return true;
        if (a === 'p' && isAspiratedDental(right)) return true;

        // Natural Gujarati prose permits additional productive contractions at
        // inflection/compound boundaries. Keep this inventory explicit rather
        // than applying the much broader Hindi rule wholesale.
        return new Set([
            't+l',
            'ṭ+l', // jeṭalāṃ -> jeṭlāṃ
            'ḍ+m', // brahmāṃḍamāṃ -> brahmāṃḍmāṃ
            'd+m',
            'm+m', // dhāmamāṃ -> dhāmmāṃ
            'm+d', // amadāvāda -> amdāvāda, rāmadeva -> rāmdeva
            't+d', // śvetadvīpa -> śvetdvīpa
            't+y', // satayuga -> satyuga
            'k+l', // śukalapakṣa -> śuklapakṣa
            'k+r', // dīkaro -> dīkro
            'j+k', // rājakōṭa -> rājkōṭa
            'r+d', // akṣaradhāma -> akṣardhāma
            'l+m',
            'ḷ+m',
            'ḻ+m', // kāḻamāṃ -> kāḻmāṃ
            'l+j',
            'ḷ+j',
            'ḻ+j', // kāḻajī -> kāḻjī
        ]).has(`${a}+${b}`);
    }

    // Hindi/Hindustani permits broader medial syncope. This is still guarded
    // by the V-Cə-CV environment and by a conservative cluster inventory.
    // Natural mode additionally enables the same cross-script compound
    // contractions used by modern readable Gujarati where the phonotactics
    // are shared (for example śvetadvīpa -> śvetdvīpa).
    if (
        readableStyle === BrahmicReadableStyle.NATURAL &&
        (a === 'n' || a === 'ṇ') &&
        isAspiratedGha(right)
    ) {
        return true;
    }
    if (readableStyle === BrahmicReadableStyle.NATURAL && a === 'p' && isAspiratedDental(right)) {
        return true;
    }
    if (
        readableStyle === BrahmicReadableStyle.NATURAL &&
        new Set([
            't+d',
            't+y',
            't+n', // jitanā -> jitnā
            'k+l',
            'r+d',
            'p+n', // apanā -> apnā
            'd+n',
            'd+m', // ādamī -> ādmī
            'ḍ+n',
            'ḍ+k', // laḍakā -> laḍkā
            'h+l', // pahalā -> pahlā
            'h+n', // kahanā -> kahnā
            'c+n', // racanā -> racnā
        ]).has(`${a}+${b}`)
    ) {
        return true;
    }
    if (new Set(['r', 'y', 'v']).has(b)) return true;
    if (a === 'r' && /^(?:k|kh|g|gh|c|ch|j|jh|t|th|d|dh|n|p|ph|b|bh|m|s|sh|h)$/u.test(b)) {
        return true;
    }
    if (new Set(['m', 'n']).has(a) && /^(?:k|g|c|j|t|d|p|b)$/u.test(b)) return true;

    return new Set([
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
    ]).has(`${a}+${b}`);
}

function isImplicitNagarSchwa(bearing, next, following) {
    // Hindi nasal+stop syncope turns गांधीनगर into gandhingar. Keep the schwa
    // when the next vowel is itself only a schwa (नगर). Explicit vowels such
    // as अनगिनत still syncopate.
    if (bearing?.type !== 'consonant' || next?.type !== 'consonant') return false;
    if (following?.implicit !== true || isAspiratedGha(next)) return false;
    if (baseConsonant(next) !== 'g') return false;
    const left = baseConsonant(bearing);
    return left === 'm' || left === 'n' || left === 'ṇ';
}

function isHindiNaSuffix(bearing, next, following) {
    // Hindi -ना deletes the stem-final schwa (देखना, बोलना, लिखना). A nasal
    // stem before another nasal stays open so गणना does not collapse into गन्ना.
    if (bearing?.type !== 'consonant' || next?.type !== 'consonant') return false;
    if (following?.type !== 'vowel' || following.implicit) return false;
    if (following.text.toLowerCase() !== 'ā') return false;
    const right = baseConsonant(next);
    if (right !== 'n' && right !== 'ṇ') return false;
    const left = baseConsonant(bearing);
    const nasal = new Set(['m', 'n', 'ṇ', 'ñ', 'ṅ']);
    return !(nasal.has(left) && nasal.has(right));
}

function isGujaratiThiSuffix(next, following) {
    if (next?.type !== 'consonant' || following?.type !== 'vowel') return false;
    const consonant = next.text.toLowerCase();
    const vowel = following.text.toLowerCase();
    return (consonant === 'th' || consonant === 'ṭh') && (vowel === 'ī' || vowel === 'i');
}

function isGujaratiMamSuffix(next, following, tokens, vowelIndex) {
    if (next?.type !== 'consonant' || following?.type !== 'vowel') return false;
    if (baseConsonant(next) !== 'm') return false;
    const vowel = following.text.toLowerCase();
    if (vowel !== 'ā' && vowel !== 'a') return false;
    let nasalIndex = vowelIndex + 1;
    while (nasalIndex < tokens.length && tokens[nasalIndex].deleted) nasalIndex += 1;
    const nasal = tokens[nasalIndex];
    return nasal?.type === 'sign' && (nasal.text === 'ṃ' || nasal.text === 'ṁ');
}

function hasSchwaLeftVowel(tokens, beforeIndex, allowCodaSkip) {
    const before = tokens[beforeIndex];
    if (before?.type === 'vowel') return true;
    if (!allowCodaSkip || before?.type !== 'consonant') return false;
    if (!new Set(['r', 'y', 'l', 'v']).has(baseConsonant(before))) return false;
    return tokens[beforeIndex - 1]?.type === 'vowel';
}

function shouldKeepFinalSchwa(tokens, lastIndex) {
    const bearing = tokens[lastIndex - 1];
    const previous = tokens[lastIndex - 2];
    if (bearing?.type !== 'consonant' || previous?.type !== 'consonant') return false;
    const pair = `${baseConsonant(previous)}+${baseConsonant(bearing)}`;
    return new Set(['r+y', 'l+y', 'n+y', 'm+y', 'g+y', 'ś+ṇ', 'ṣ+ṇ', 's+ṇ']).has(pair);
}

function naturalizeAnnotatedWord(
    word,
    language,
    schwaPolicy,
    readableStyle = BrahmicReadableStyle.LEGACY,
) {
    const tokens = tokenizeAnnotatedWord(word, readableStyle === BrahmicReadableStyle.NATURAL);
    if (schwaPolicy === BrahmicSchwaDeletionPolicy.NONE || language === BrahmicLanguage.SANSKRIT) {
        return tokens.map((t) => t.text).join('');
    }

    const vowelCount = () => tokens.filter((t) => t.type === 'vowel' && !t.deleted).length;
    let last = tokens.length - 1;
    while (last >= 0 && tokens[last].type === 'other') last -= 1;
    if (
        last >= 0 &&
        tokens[last].implicit &&
        vowelCount() > 1 &&
        !shouldKeepFinalSchwa(tokens, last)
    ) {
        tokens[last].deleted = true;
    }

    if (schwaPolicy === BrahmicSchwaDeletionPolicy.LANGUAGE) {
        for (let i = tokens.length - 2; i >= 2; i -= 1) {
            const schwa = tokens[i];
            if (!schwa.implicit || schwa.deleted) continue;
            const bearing = tokens[i - 1];
            let beforeIndex = i - 2;
            if (
                readableStyle === BrahmicReadableStyle.NATURAL &&
                language !== BrahmicLanguage.SANSKRIT
            ) {
                while (beforeIndex >= 0 && tokens[beforeIndex]?.type === 'sign') beforeIndex -= 1;
            }
            let nextIndex = i + 1;
            while (nextIndex < tokens.length && tokens[nextIndex].deleted) nextIndex += 1;
            let afterNext = nextIndex + 1;
            while (afterNext < tokens.length && tokens[afterNext].deleted) afterNext += 1;
            const next = tokens[nextIndex];
            const following = tokens[afterNext];
            const naturalModern =
                readableStyle === BrahmicReadableStyle.NATURAL &&
                language !== BrahmicLanguage.SANSKRIT;
            const mamSuffix =
                naturalModern &&
                language === BrahmicLanguage.GUJARATI &&
                isGujaratiMamSuffix(next, following, tokens, afterNext);
            const thiSuffix =
                naturalModern &&
                language === BrahmicLanguage.GUJARATI &&
                isGujaratiThiSuffix(next, following);
            const naSuffix =
                naturalModern &&
                language === BrahmicLanguage.HINDI &&
                isHindiNaSuffix(bearing, next, following);
            const keepNagarSchwa =
                naturalModern &&
                language === BrahmicLanguage.HINDI &&
                isImplicitNagarSchwa(bearing, next, following);
            let rightOnsetHasVowel = following?.type === 'vowel';
            if (
                !rightOnsetHasVowel &&
                readableStyle === BrahmicReadableStyle.NATURAL &&
                language !== BrahmicLanguage.SANSKRIT &&
                following?.type === 'consonant' &&
                new Set(['r', 'y', 'v', 'l']).has(baseConsonant(following))
            ) {
                let afterCluster = afterNext + 1;
                while (afterCluster < tokens.length && tokens[afterCluster].deleted) {
                    afterCluster += 1;
                }
                rightOnsetHasVowel = tokens[afterCluster]?.type === 'vowel';
            }
            if (
                bearing?.type === 'consonant' &&
                hasSchwaLeftVowel(tokens, beforeIndex, mamSuffix || thiSuffix) &&
                next?.type === 'consonant' &&
                rightOnsetHasVowel &&
                (thiSuffix ||
                    naSuffix ||
                    (!keepNagarSchwa && allowsSchwaCluster(bearing, next, language, readableStyle)))
            ) {
                schwa.deleted = true;
                // Only a medial deletion separates two syllables. The final
                // schwa above is absence, not a boundary inside the word.
                if (naturalModern) schwa.boundary = true;
            }
        }
    }

    return tokens
        .map((t) => {
            if (!t.deleted) return t.text;
            return t.boundary ? SYLLABLE_BREAK : '';
        })
        .join('');
}

function naturalizeAnnotatedIast(
    text,
    language,
    schwaPolicy,
    readableStyle = BrahmicReadableStyle.LEGACY,
) {
    const chars = transcriptionChars(text);
    const out = [];
    let i = 0;
    while (i < chars.length) {
        if (!isTranscriptionWordChar(chars[i])) {
            out.push(chars[i]);
            i += 1;
            continue;
        }
        const start = i;
        i += 1;
        while (i < chars.length && isTranscriptionWordChar(chars[i])) i += 1;
        out.push(
            naturalizeAnnotatedWord(
                chars.slice(start, i).join(''),
                language,
                schwaPolicy,
                readableStyle,
            ),
        );
    }
    return out.join('');
}

function mapTranscriptionWords(text, mapper) {
    const chars = transcriptionChars(text);
    const out = [];
    let i = 0;
    while (i < chars.length) {
        if (!isTranscriptionWordChar(chars[i])) {
            out.push(chars[i]);
            i += 1;
            continue;
        }
        const start = i;
        i += 1;
        while (i < chars.length && isTranscriptionWordChar(chars[i])) i += 1;
        out.push(mapper(chars.slice(start, i).join('')));
    }
    return out.join('');
}

function applyNaturalClusterSpellings(word, language) {
    if (language === BrahmicLanguage.SANSKRIT) return word;

    // Common readable spellings in modern Indo-Aryan Roman text. Keep this
    // deliberately cluster-scoped: a blanket v -> w rewrite would damage
    // forms such as manvantar, vasant, and ravivar.
    return word
        .replaceAll('śv', 'św')
        .replaceAll('Śv', 'Św')
        .replaceAll('ṣv', 'ṣw')
        .replaceAll('Ṣv', 'Ṣw')
        .replaceAll('sv', 'sw')
        .replaceAll('Sv', 'Sw')
        .replaceAll('dv', 'dw')
        .replaceAll('Dv', 'Dw');
}

function endsWithClosedResonant(word) {
    const chars = Array.from(word);
    if (chars.length < 2) return false;
    const last = chars.at(-1).toLowerCase();
    if (!'ryvw'.includes(last)) return false;
    const prev = chars.at(-2).toLowerCase();
    return !'aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ'.includes(prev);
}

function applyBrahmicNaturalMorphology(text, language) {
    return mapTranscriptionWords(text, (originalWord) => {
        let word = originalWord;

        if (language === BrahmicLanguage.GUJARATI) {
            // Productive Gujarati endings. These are morphology-aware rather
            // than generic "anusvara => n" replacements.
            word = word.replace(/māṃthī$/u, 'mathī');
            word = word.replace(/māṃ$/u, 'ma');
            // Plural -ાં drops when another vowel is present (જેટલાં, પધાર્યાં).
            // A lone āṃ is the locative ક્યાં/ત્યાં/જ્યાં and keeps its n.
            if (/[aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ].*āṃ$/u.test(word)) {
                word = word.replace(/āṃ$/u, 'ā');
            }
            word = word.replace(/uṃ$/u, 'u');
            // કંઈ is the nasalized diphthong ai, not kamī.
            word = word.replace(/a[ṃṁ][īi]/gu, 'ai');
        }

        word = applyNaturalClusterSpellings(word, language);

        // Hindi इए is the spoken -iye sequence (चाहिए, कहिए, किए) even when
        // य is not written. Gujarati ઈએ stays "ie" (જોઈએ -> joie).
        if (language === BrahmicLanguage.HINDI && /ie$/u.test(word)) {
            word = `${word.slice(0, -2)}iye`;
        } else if (language === BrahmicLanguage.HINDI && /IE$/u.test(word)) {
            word = `${word.slice(0, -2)}IYE`;
        }

        // A bare consonant + resonant coda is the chaitra pattern generalized:
        // mitr -> mitra, caitr -> caitra, śastr -> śastra, viśw -> viśwa.
        // Closed codas such as dharm and dwar stay closed.
        if (language !== BrahmicLanguage.SANSKRIT && endsWithClosedResonant(word)) {
            word = `${word}a`;
        }

        return word;
    });
}

function naturalReadableOverrides(config, language, readableStyle) {
    if (readableStyle !== BrahmicReadableStyle.NATURAL) return null;

    const consonants = {};
    const independentVowels = {};

    if (language !== BrahmicLanguage.SANSKRIT) {
        // Hindi flaps are written as d/dh in readable Roman text. Keeping
        // them on ṛ makes लड़का "laraka" and थोड़ा "thora".
        if (config.script === 'devanagari') {
            consonants['ड़'] = 'ḍ';
            consonants['ढ़'] = 'ḍh';
        } else if (config.script === 'gujarati') {
            consonants['ડ઼'] = 'ḍ';
            consonants['ઢ઼'] = 'ḍh';
        }
    }

    if (config.script === 'gujarati') {
        // Avoid the IAST ḷ ambiguity (vocalic l vs retroflex lateral) in the
        // readable path irrespective of the selected language.
        consonants['ળ'] = 'ḻ';
        if (language === BrahmicLanguage.GUJARATI) independentVowels['ઋ'] = 'ru';
    } else if (config.script === 'devanagari') {
        // The same structural disambiguation applies to Devanagari ळ. When
        // Gujarati language rules are explicitly selected for Devanagari text,
        // keep the Gujarati independent-R pronunciation too.
        consonants['ळ'] = 'ḻ';
        if (language === BrahmicLanguage.GUJARATI) independentVowels['ऋ'] = 'ru';
    }

    return Object.keys(consonants).length || Object.keys(independentVowels).length
        ? { consonants, independentVowels }
        : null;
}

function collapseReadableVowelLength(text) {
    return String(text)
        .replaceAll('ā', 'a')
        .replaceAll('Ā', 'A')
        .replaceAll('ī', 'i')
        .replaceAll('Ī', 'I')
        .replaceAll('ū', 'u')
        .replaceAll('Ū', 'U')
        .replaceAll('ē', 'e')
        .replaceAll('Ē', 'E')
        .replaceAll('ō', 'o')
        .replaceAll('Ō', 'O')
        .replaceAll('ṝ', 'ri')
        .replaceAll('Ṝ', 'Ri')
        .replaceAll('ḹ', 'li')
        .replaceAll('Ḹ', 'Li');
}

function doubleReadableVowelLength(text) {
    return String(text)
        .replaceAll('āī', 'aai')
        .replaceAll('Āī', 'Aai')
        .replaceAll('aī', 'ai')
        .replaceAll('Aī', 'Ai')
        .replaceAll('ā', 'aa')
        .replaceAll('Ā', 'Aa')
        .replaceAll('ī', 'ee')
        .replaceAll('Ī', 'Ee')
        .replaceAll('ū', 'oo')
        .replaceAll('Ū', 'Oo')
        .replaceAll('ē', 'ee')
        .replaceAll('Ē', 'Ee')
        .replaceAll('ō', 'oo')
        .replaceAll('Ō', 'Oo')
        .replaceAll('ṝ', 'ree')
        .replaceAll('Ṝ', 'Ree')
        .replaceAll('ḹ', 'lee')
        .replaceAll('Ḹ', 'Lee');
}

const LONG_VOWEL_COLLAPSE = new Map([
    ['ā', 'a'],
    ['Ā', 'A'],
    ['ī', 'i'],
    ['Ī', 'I'],
    ['ū', 'u'],
    ['Ū', 'U'],
    ['ē', 'e'],
    ['Ē', 'E'],
    ['ō', 'o'],
    ['Ō', 'O'],
    ['ṝ', 'ri'],
    ['Ṝ', 'Ri'],
    ['ḹ', 'li'],
    ['Ḹ', 'Li'],
]);

function collapseVowelToken(text) {
    const chars = Array.from(text);
    const short = LONG_VOWEL_COLLAPSE.get(chars[0]);
    if (!short) return text;
    return `${short}${chars.slice(1).join('')}`;
}

function isLongVowelToken(text) {
    const base = Array.from(text)[0];
    return LONG_VOWEL_COLLAPSE.has(base);
}

function isCentralLongVowel(text) {
    const base = Array.from(text)[0];
    return base === 'ā' || base === 'Ā';
}

function isPeripheralLongVowel(text) {
    return isLongVowelToken(text) && !isCentralLongVowel(text);
}

function isNasalSign(token) {
    return token?.type === 'sign' && (token.text === 'ṃ' || token.text === 'ṁ');
}

function codaWeight(tokens) {
    let weight = 0;
    for (const token of tokens) {
        if (token.type === 'consonant' || token.type === 'sign') weight += 1;
        else return null;
    }
    return weight;
}

// A liquid or glide on the far side of a deleted schwa joins the consonant
// before that schwa (dīkaro). An obstruent there leaves the syllables apart
// (kāḻajī, śāpathī).
function isClusterFormingResonant(token) {
    const base = baseConsonant(token);
    return base === 'r' || base === 'y' || base === 'l' || base === 'v';
}

// A final open syllable that begins with a nasal is a clitic of its own
// (karīne). Its onset does not close the vowel in front of it.
function isNasalConsonant(token) {
    const base = baseConsonant(token);
    return base === 'm' || base === 'n' || base === 'ṇ' || base === 'ñ' || base === 'ṅ';
}

function isLightSyllableContact(contact) {
    if (contact.length === 1 && contact[0].type === 'consonant') return true;
    if (contact.filter((token) => token.type === 'boundary').length !== 1) return false;
    const at = contact.findIndex((token) => token.type === 'boundary');
    const left = contact.slice(0, at);
    const right = contact.slice(at + 1);
    if (codaWeight(left) !== 1 || codaWeight(right) !== 1) return false;
    const rightConsonant = right.find((token) => token.type === 'consonant');
    return Boolean(rightConsonant) && !isClusterFormingResonant(rightConsonant);
}

// हूँगा writes n+g between ū and the next vowel. The nasal is the coda of ū
// and the stop is the next onset, so ū stays long. A stop+liquid pair is one
// onset (રાત્રે), and a non-nasal coda such as mūrti does not qualify.
function hasNasalCodaBeforeNext(tokens, vowelIndex, nextIndex) {
    const between = tokens.slice(vowelIndex + 1, nextIndex);
    if (between.some((token) => token.type !== 'consonant' && token.type !== 'sign')) return false;
    const consonantAt = [];
    between.forEach((token, index) => {
        if (token.type === 'consonant') consonantAt.push(index);
    });
    if (consonantAt.length === 0) return false;
    let onset = 1;
    const lastAt = consonantAt.at(-1);
    if (consonantAt.length >= 2) {
        const prevAt = consonantAt.at(-2);
        if (lastAt === prevAt + 1 && isClusterFormingResonant(between[lastAt])) onset = 2;
    }
    if (between.length <= onset) return false;
    const coda = between.slice(0, between.length - onset);
    if (codaWeight(coda) !== 1) return false;
    return isNasalConsonant(coda[0]) || isNasalSign(coda[0]);
}

function vowelIndexesOf(tokens) {
    const indexes = [];
    tokens.forEach((token, index) => {
        if (token.type === 'vowel') indexes.push(index);
    });
    return indexes;
}

// Where a final open syllable can leave the stem. A schwa boundary keeps the
// consonant before the break on the stem (svarūp + thī); a single onset
// consonant leaves with the ending (pāse + thī).
function finalOpenSyllableSplit(tokens) {
    const vowelIndexes = vowelIndexesOf(tokens);
    if (vowelIndexes.length < 3) return null;
    const last = vowelIndexes.at(-1);
    const previous = vowelIndexes.at(-2);
    if (codaWeight(tokens.slice(last + 1)) !== 0) return null;
    const contact = tokens.slice(previous + 1, last);
    if (!isLightSyllableContact(contact)) return null;
    const boundaryAt = contact.findIndex((token) => token.type === 'boundary');
    const start = boundaryAt >= 0 ? previous + 1 + boundaryAt : previous + 1;
    return { start, finalIsLong: isLongVowelToken(tokens[last].text) };
}

// A short ending is peeled only when the stem then keeps a peripheral vowel
// the full word would shorten (rūpama -> roopama). Saving only central ā
// (cāhiye) is not a reason to peel.
function peelSavesPeripheral(tokens, start) {
    const full = smartLengthKeepIndexes(tokens);
    const stem = smartLengthKeepIndexes(tokens.slice(0, start));
    for (const index of stem) {
        if (full.has(index)) continue;
        if (isPeripheralLongVowel(tokens[index].text)) return true;
    }
    return false;
}

function smartLengthKeepIndexes(tokens) {
    const keep = new Set();
    if (tokens.length === 0) return keep;
    // A word-initial long vowel has no consonant to carry it (āj, āvīne, ūpar).
    if (tokens[0].type === 'vowel' && isLongVowelToken(tokens[0].text)) keep.add(0);

    const vowelIndexes = vowelIndexesOf(tokens);
    if (vowelIndexes.length === 0) return keep;

    // A nasal coda before the next onset keeps a non-final peripheral vowel
    // (hūngā -> hoonga). Central ā stays short (kāṃṭhe -> kanthe).
    for (let n = 0; n < vowelIndexes.length - 1; n += 1) {
        const index = vowelIndexes[n];
        if (!isPeripheralLongVowel(tokens[index].text)) continue;
        if (hasNasalCodaBeforeNext(tokens, index, vowelIndexes[n + 1])) keep.add(index);
    }

    if (vowelIndexes.length === 1) {
        const index = vowelIndexes[0];
        const coda = tokens.slice(index + 1);
        // One coda keeps the vowel (cār, rūp, hūn, dūdh). An open syllable and
        // a true cluster (mārg, weight 2 or more) both shorten.
        if (
            !coda.some((token) => token.type === 'boundary') &&
            isLongVowelToken(tokens[index].text) &&
            codaWeight(coda) === 1
        ) {
            keep.add(index);
        }
        return keep;
    }

    const last = vowelIndexes.at(-1);
    const previous = vowelIndexes.at(-2);
    const lastCoda = tokens.slice(last + 1);

    if (vowelIndexes.length === 2 && isLongVowelToken(tokens[previous].text)) {
        const contact = tokens.slice(previous + 1, last);
        // Two nuclei, and the second syllable is open: māre, nīce, jā+nā,
        // cār plus a following open syllable across a schwa boundary.
        if (codaWeight(lastCoda) === 0 && isLightSyllableContact(contact)) keep.add(previous);
    }

    // The last syllable, closed by one consonant. ā shortens (gulāb).
    // ī/ū/ē/ō stay (svarūp, the final syllable of śvetadvīp, cālīs).
    if (
        !lastCoda.some((token) => token.type === 'boundary') &&
        codaWeight(lastCoda) === 1 &&
        isLongVowelToken(tokens[last].text) &&
        !isCentralLongVowel(tokens[last].text)
    ) {
        keep.add(last);
    }

    // A short vowel after one obstruent is a vocalic ending, so that obstruent
    // closes the syllable in front of it (svarūpe). Three or more nuclei, so
    // the disyllable rule above has not already decided.
    if (
        vowelIndexes.length > 2 &&
        !isLongVowelToken(tokens[last].text) &&
        codaWeight(lastCoda) === 0
    ) {
        const contact = tokens.slice(previous + 1, last);
        if (
            contact.length === 1 &&
            contact[0].type === 'consonant' &&
            !isClusterFormingResonant(contact[0]) &&
            !isNasalConsonant(contact[0]) &&
            isLongVowelToken(tokens[previous].text) &&
            !isCentralLongVowel(tokens[previous].text)
        ) {
            keep.add(previous);
        }
    }
    return keep;
}

function withoutSyllableBreaks(text) {
    return String(text).replaceAll(SYLLABLE_BREAK, '');
}

function renderSmartLengthTokens(tokens) {
    const keep = smartLengthKeepIndexes(tokens);
    return tokens
        .map((token, index) => {
            if (token.type === 'boundary') return '';
            if (token.type === 'vowel' && !keep.has(index)) return collapseVowelToken(token.text);
            return token.text;
        })
        .join('');
}

function renderCollapsedEnding(tokens) {
    return tokens
        .map((token) => {
            if (token.type === 'boundary') return '';
            if (token.type === 'vowel') return collapseVowelToken(token.text);
            return token.text;
        })
        .join('');
}

function smartReadableVowelLengthWord(originalWord, language) {
    // Sanskrit vowel length is phonemic. SMART therefore remains conservative
    // and exposes all encoded length instead of silently neutralising it.
    if (language === BrahmicLanguage.SANSKRIT) {
        return doubleReadableVowelLength(withoutSyllableBreaks(originalWord));
    }

    let stem = tokenizeAnnotatedWord(originalWord);
    let ending = '';
    // Long open endings stack (પાસેથીના). A short ending is removed only once,
    // and only when that keeps a peripheral vowel on the stem (રૂપમાં).
    while (stem.length > 0) {
        const split = finalOpenSyllableSplit(stem);
        if (!split) break;
        const shortOk = !split.finalIsLong && peelSavesPeripheral(stem, split.start);
        if (!split.finalIsLong && !shortOk) break;
        ending = renderCollapsedEnding(stem.slice(split.start)) + ending;
        stem = stem.slice(0, split.start);
        if (shortOk) break;
    }
    return doubleReadableVowelLength(renderSmartLengthTokens(stem) + ending);
}

function applyReadableVowelLength(
    text,
    policy,
    language = BrahmicLanguage.AUTO,
    readableStyle = BrahmicReadableStyle.LEGACY,
) {
    // Preserve 1.1 behavior exactly outside the opt-in natural layer.
    if (readableStyle !== BrahmicReadableStyle.NATURAL) {
        return policy === BrahmicVowelLengthPolicy.DOUBLE ? doubleReadableVowelLength(text) : text;
    }

    if (policy === BrahmicVowelLengthPolicy.DOUBLE) {
        return doubleReadableVowelLength(withoutSyllableBreaks(text));
    }
    if (policy === BrahmicVowelLengthPolicy.COLLAPSE) {
        return collapseReadableVowelLength(withoutSyllableBreaks(text));
    }
    if (policy === BrahmicVowelLengthPolicy.SMART) {
        return mapTranscriptionWords(text, (word) => smartReadableVowelLengthWord(word, language));
    }
    return withoutSyllableBreaks(text);
}

function applyTerminalAnusvara(text, policy) {
    const replacement =
        policy === TerminalAnusvaraPolicy.DROP
            ? ''
            : policy === TerminalAnusvaraPolicy.M
              ? 'm'
              : 'n';
    // U+E101 is a private syllable mark, still inside the word at this stage.
    return text.replace(/[ṃṁ](?=$|[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF\uE101])/gu, replacement);
}

function applyReadableCandrabindu(text, policy) {
    const replacement =
        policy === TerminalAnusvaraPolicy.DROP
            ? ''
            : policy === TerminalAnusvaraPolicy.M
              ? 'm'
              : 'n';
    // Candrabindu is vowel nasalization. In the ASCII-readable view, retain
    // that audible nasalization instead of silently discarding U+0310.
    return String(text).replace(/([aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ])\u0310/giu, `$1${replacement}`);
}

function stripDanglingBrahmicModifiers(text) {
    // These combining controls have no independent pronunciation. Valid
    // clusters are consumed by BrahmicToIast before this point; any remainder
    // is malformed/orphaned input and must not leak Brahmic glyphs into a
    // Plain-English/Hunterian result.
    return String(text).replace(/[़઼्્ૺૻૼ૽૾૿]/gu, '');
}

function applyAynPolicy(text, policy) {
    if (policy === AynPolicy.PRESERVE) return text;
    return String(text).replaceAll('ʿ', policy === AynPolicy.DROP ? '' : "'");
}

function applyReadableWordOverrides(text, overrides) {
    if (!overrides || Object.keys(overrides).length === 0) return text;
    return mapTranscriptionWords(text, (word) =>
        Object.hasOwn(overrides, word) ? String(overrides[word]) : word,
    );
}

function capitalizeReadableSentenceStarts(text) {
    let capitalizeNext = true;
    const chars = transcriptionChars(text);
    const out = [];

    for (const ch of chars) {
        if (capitalizeNext && /[a-z]/u.test(ch)) {
            out.push(ch.toUpperCase());
            capitalizeNext = false;
            continue;
        }
        out.push(ch);
        if (/[A-Za-z]/u.test(ch)) capitalizeNext = false;
        if (/[.!?।॥]/u.test(ch) || ch === '\n' || ch === '\r') capitalizeNext = true;
    }
    return out.join('');
}

function protectSemanticOm(text) {
    return String(text).replace(/[ॐૐꣽ]/gu, SEMANTIC_OM);
}

function restoreSemanticOm(text) {
    return String(text).replaceAll(SEMANTIC_OM, 'om');
}

function resolveBrahmicLanguage(requested, scriptLanguage) {
    return requested === BrahmicLanguage.AUTO ? scriptLanguage : requested;
}

function toPlainEnglishFromBrahmic(text, config, scriptLanguage, options, forcedProfile = null) {
    const resolved = brahmicPlainOpts(options);
    const language = resolveBrahmicLanguage(resolved.language, scriptLanguage);
    const protectedLatin = protectSourceLatin(text);
    const annotated = BrahmicToIast.convert(
        protectSemanticOm(protectedLatin.text),
        config,
        new ScriptToIastOptions({
            preserveEncodedVedicMarks: resolved.preserveVedicAccentMarks === true,
        }),
        INHERENT_SCHWA,
        naturalReadableOverrides(config, language, resolved.readableStyle),
    );
    let iast = stripDanglingBrahmicModifiers(
        naturalizeAnnotatedIast(
            annotated,
            language,
            resolved.schwaDeletion,
            resolved.readableStyle,
        ),
    );
    if (resolved.readableStyle === BrahmicReadableStyle.NATURAL) {
        iast = applyBrahmicNaturalMorphology(iast, language);
    }
    iast = applyReadableCandrabindu(iast, resolved.terminalAnusvara);
    iast = applyTerminalAnusvara(iast, resolved.terminalAnusvara);
    iast = applyReadableVowelLength(iast, resolved.vowelLength, language, resolved.readableStyle);

    const profile = forcedProfile ?? PlainEnglishRomanizationProfile.EXTENDED_INDIC;
    const naturalBrahmic = resolved.readableStyle === BrahmicReadableStyle.NATURAL;
    const naturalModernIndoAryan = naturalBrahmic && language !== BrahmicLanguage.SANSKRIT;
    const suppressHunterianAutoW =
        profile === PlainEnglishRomanizationProfile.HUNTERIAN &&
        (naturalModernIndoAryan ||
            (language === BrahmicLanguage.GUJARATI && !resolved.useWForVAfterConsonants));
    if (suppressHunterianAutoW) iast = applyHunterianVisargaAbsorption(iast);
    const engineProfile = suppressHunterianAutoW
        ? PlainEnglishRomanizationProfile.EXTENDED_INDIC
        : profile;

    let result = toPlainEnglishFromIast(
        iast,
        new IastPlainEnglishOptions({
            profile: engineProfile,
            finalA: FinalAPolicy.KEEP,
            jna: resolved.jna,
            nya: resolved.nya,
            glottalStop: resolved.glottalStop,
            convertCToCh: resolved.convertCToCh,
            assimilateAnusvara: resolved.assimilateAnusvara,
            removeAvagraha: resolved.removeAvagraha,
            collapseWhitespace: resolved.collapseWhitespace,
            preserveVedicAccentMarks: resolved.preserveVedicAccentMarks,
            useWForVAfterConsonants: naturalModernIndoAryan
                ? false
                : resolved.useWForVAfterConsonants,
            enableInternalSchwaSyncope: false,
        }),
    );
    result = applyAynPolicy(result, resolved.ayn);
    result = restoreSemanticOm(result);
    result = applyReadableWordOverrides(result, resolved.readableWordOverrides);
    if (resolved.capitalizeSentenceStarts) result = capitalizeReadableSentenceStarts(result);
    result = restoreSourceLatin(result, protectedLatin.spans);

    return result;
}

function applyHunterianVisargaAbsorption(text) {
    const cls = '[kKgGcCjJtTdDpPbBsSśŚṣṢhH]';
    return String(text)
        .replace(new RegExp(`ḥ(${cls})`, 'gu'), '$1')
        .replace(new RegExp(`Ḥ(${cls})`, 'gu'), '$1')
        .replace(new RegExp(`h\\u0323(${cls})`, 'gu'), '$1')
        .replace(new RegExp(`H\\u0323(${cls})`, 'gu'), '$1');
}

export function toPlainEnglishFromDevanagari(text, options = new BrahmicPlainEnglishOptions()) {
    return toPlainEnglishFromBrahmic(text, devanagari, BrahmicLanguage.HINDI, options);
}
export const to_plain_english_from_devanagari = toPlainEnglishFromDevanagari;

export function toHunterianFromDevanagari(text, options = {}) {
    const values = options instanceof BrahmicPlainEnglishOptions ? { ...options } : { ...options };
    if (values.vowelLength === undefined && values.vowel_length === undefined) {
        values.vowelLength = BrahmicVowelLengthPolicy.COLLAPSE;
    }
    return toPlainEnglishFromBrahmic(
        text,
        devanagari,
        BrahmicLanguage.HINDI,
        new BrahmicPlainEnglishOptions(values),
        PlainEnglishRomanizationProfile.HUNTERIAN,
    );
}
export const to_hunterian_from_devanagari = toHunterianFromDevanagari;

export function toPlainEnglishFromGujarati(text, options = new BrahmicPlainEnglishOptions()) {
    return toPlainEnglishFromBrahmic(text, gujarati, BrahmicLanguage.GUJARATI, options);
}
export const to_plain_english_from_gujarati = toPlainEnglishFromGujarati;

export function toHunterianFromGujarati(text, options = {}) {
    const values = options instanceof BrahmicPlainEnglishOptions ? { ...options } : { ...options };
    if (values.vowelLength === undefined && values.vowel_length === undefined) {
        values.vowelLength = BrahmicVowelLengthPolicy.COLLAPSE;
    }
    return toPlainEnglishFromBrahmic(
        text,
        gujarati,
        BrahmicLanguage.GUJARATI,
        new BrahmicPlainEnglishOptions(values),
        PlainEnglishRomanizationProfile.HUNTERIAN,
    );
}
export const to_hunterian_from_gujarati = toHunterianFromGujarati;

export function hasExactDevanagariIastSourceMetadata(text) {
    return hasEmbeddedExactSource(text);
}
export const has_exact_devanagari_iast_source_metadata = hasExactDevanagariIastSourceMetadata;
export function visibleDevanagariWithoutExactSourceMetadata(text) {
    return stripExactSourceMetadata(text);
}
export const visible_devanagari_without_exact_source_metadata =
    visibleDevanagariWithoutExactSourceMetadata;
export function hasExactGujaratiIastSourceMetadata(text) {
    return hasEmbeddedExactSource(text);
}
export const has_exact_gujarati_iast_source_metadata = hasExactGujaratiIastSourceMetadata;
export function visibleGujaratiWithoutExactSourceMetadata(text) {
    return stripExactSourceMetadata(text);
}
export const visible_gujarati_without_exact_source_metadata =
    visibleGujaratiWithoutExactSourceMetadata;

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
    toPlainEnglishFromDevanagari(options = new BrahmicPlainEnglishOptions()) {
        return toPlainEnglishFromDevanagari(String(this), options);
    }
    toHunterianFromDevanagari(options = {}) {
        return toHunterianFromDevanagari(String(this), options);
    }
    get hasExactDevanagariIastSourceMetadata() {
        return hasExactDevanagariIastSourceMetadata(String(this));
    }
    get has_exact_devanagari_iast_source_metadata() {
        return this.hasExactDevanagariIastSourceMetadata;
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
    toPlainEnglishFromGujarati(options = new BrahmicPlainEnglishOptions()) {
        return toPlainEnglishFromGujarati(String(this), options);
    }
    toHunterianFromGujarati(options = {}) {
        return toHunterianFromGujarati(String(this), options);
    }
    get hasExactGujaratiIastSourceMetadata() {
        return hasExactGujaratiIastSourceMetadata(String(this));
    }
    get has_exact_gujarati_iast_source_metadata() {
        return this.hasExactGujaratiIastSourceMetadata;
    }
    get visibleGujaratiWithoutExactSourceMetadata() {
        return visibleGujaratiWithoutExactSourceMetadata(String(this));
    }
    get visible_gujarati_without_exact_source_metadata() {
        return this.visibleGujaratiWithoutExactSourceMetadata;
    }
}
