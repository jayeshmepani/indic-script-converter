import { ForwardConverter, ForwardScriptConfig } from './forward.js';

export const GujaratiRomanizationProfile = Object.freeze({
    STRICT_IAST: 'strictIast',
    ISO_15919_CORE: 'iso15919Core',
    EXTENDED_INDIC: 'extendedIndic',
    strictIast: 'strictIast',
    iso15919Core: 'iso15919Core',
    extendedIndic: 'extendedIndic',
});
export const RomanizationProfile = GujaratiRomanizationProfile;
export const IastToGujaratiUnknownLatinPolicy = Object.freeze({
    PASS_THROUGH: 'passThrough',
    BRACKET: 'bracket',
    THROW_ERROR: 'throwError',
    passThrough: 'passThrough',
    bracket: 'bracket',
    throwError: 'throwError',
});
export const IastToGujaratiDigitPolicy = Object.freeze({
    PRESERVE_ASCII: 'preserveAscii',
    CONVERT_TO_SCRIPT: 'convertToScript',
    preserveAscii: 'preserveAscii',
    convertToScript: 'convertToScript',
});
export const IastToGujaratiPunctuationPolicy = Object.freeze({
    PRESERVE: 'preserve',
    INDIC_DANDA: 'indicDanda',
    preserve: 'preserve',
    indicDanda: 'indicDanda',
});
export const IastToGujaratiOmPolicy = Object.freeze({
    TRANSLITERATE_LETTERS: 'transliterateLetters',
    USE_OM_SIGN: 'useOmSign',
    transliterateLetters: 'transliterateLetters',
    useOmSign: 'useOmSign',
});
export const IastToGujaratiAmbiguousLPolicy = Object.freeze({
    CONTEXT: 'context',
    PREFER_VOCALIC: 'preferVocalic',
    PREFER_CONSONANT: 'preferConsonant',
    context: 'context',
    preferVocalic: 'preferVocalic',
    preferConsonant: 'preferConsonant',
});

export class IastToGujaratiOptions {
    constructor(values = {}) {
        this.profile = values.profile ?? GujaratiRomanizationProfile.EXTENDED_INDIC;
        this.unknownLatinPolicy =
            values.unknownLatinPolicy ??
            values.unknown_latin_policy ??
            IastToGujaratiUnknownLatinPolicy.PASS_THROUGH;
        this.unknown_latin_policy = this.unknownLatinPolicy;
        this.digitPolicy =
            values.digitPolicy ?? values.digit_policy ?? IastToGujaratiDigitPolicy.PRESERVE_ASCII;
        this.digit_policy = this.digitPolicy;
        this.punctuationPolicy =
            values.punctuationPolicy ??
            values.punctuation_policy ??
            IastToGujaratiPunctuationPolicy.PRESERVE;
        this.punctuation_policy = this.punctuationPolicy;
        this.omPolicy =
            values.omPolicy ?? values.om_policy ?? IastToGujaratiOmPolicy.TRANSLITERATE_LETTERS;
        this.om_policy = this.omPolicy;
        this.ambiguousLPolicy =
            values.ambiguousLPolicy ??
            values.ambiguous_l_policy ??
            IastToGujaratiAmbiguousLPolicy.CONTEXT;
        this.ambiguous_l_policy = this.ambiguousLPolicy;
        this.acceptAsciiLongVowels =
            values.acceptAsciiLongVowels ?? values.accept_ascii_long_vowels ?? false;
        this.accept_ascii_long_vowels = this.acceptAsciiLongVowels;
        this.acceptPlainSh = values.acceptPlainSh ?? values.accept_plain_sh ?? true;
        this.accept_plain_sh = this.acceptPlainSh;
        this.acceptPlainXAsKha = values.acceptPlainXAsKha ?? values.accept_plain_x_as_kha ?? true;
        this.accept_plain_x_as_kha = this.acceptPlainXAsKha;
        this.acceptWAsVa = values.acceptWAsVa ?? values.accept_w_as_va ?? true;
        this.accept_w_as_va = this.acceptWAsVa;
        this.preserveVedicAccentMarks =
            values.preserveVedicAccentMarks ?? values.preserve_vedic_accent_marks ?? true;
        this.preserve_vedic_accent_marks = this.preserveVedicAccentMarks;
        this.collapseWhitespace = values.collapseWhitespace ?? values.collapse_whitespace ?? false;
        this.collapse_whitespace = this.collapseWhitespace;
        this.embedExactSourceMetadata =
            values.embedExactSourceMetadata ?? values.embed_exact_source_metadata ?? false;
        this.embed_exact_source_metadata = this.embedExactSourceMetadata;
        Object.freeze(this);
    }
}

const independentVowels = {
    a: 'અ',
    ā: 'આ',
    i: 'ઇ',
    ī: 'ઈ',
    u: 'ઉ',
    ū: 'ઊ',
    ṛ: 'ઋ',
    ṝ: 'ૠ',
    ḷ: 'ઌ',
    ḹ: 'ૡ',
    e: 'એ',
    ē: 'એ',
    ai: 'ઐ',
    o: 'ઓ',
    ō: 'ઓ',
    au: 'ઔ',
    ă: 'અ',
    ĕ: 'ઍ',
    ê: 'ઍ',
    æ: 'ઍ',
    ŏ: 'ઑ',
    ô: 'ઑ',
    oe: 'ઓએ',
    ōe: 'ઓએ',
    ooe: 'ઓએ',
    aw: 'ઑ',
    ue: 'ઉએ',
    ūe: 'ઊએ',
    uue: 'ઊએ',
};
const vowelSigns = {
    a: '',
    ā: 'ા',
    i: 'િ',
    ī: 'ી',
    u: 'ુ',
    ū: 'ૂ',
    ṛ: 'ૃ',
    ṝ: 'ૄ',
    ḷ: 'ૢ',
    ḹ: 'ૣ',
    e: 'ે',
    ē: 'ે',
    ai: 'ૈ',
    o: 'ો',
    ō: 'ો',
    au: 'ૌ',
    ă: '',
    ĕ: 'ૅ',
    ê: 'ૅ',
    æ: 'ૅ',
    ŏ: 'ૉ',
    ô: 'ૉ',
    oe: 'ોએ',
    ōe: 'ોએ',
    ooe: 'ોએ',
    aw: 'ૉ',
    ue: 'ુએ',
    ūe: 'ૂએ',
    uue: 'ૂએ',
};
const consonants = {
    k: 'ક',
    kh: 'ખ',
    g: 'ગ',
    gh: 'ઘ',
    ṅ: 'ઙ',
    c: 'ચ',
    ch: 'છ',
    j: 'જ',
    jh: 'ઝ',
    ñ: 'ઞ',
    ṭ: 'ટ',
    ṭh: 'ઠ',
    ḍ: 'ડ',
    ḍh: 'ઢ',
    ṇ: 'ણ',
    t: 'ત',
    th: 'થ',
    d: 'દ',
    dh: 'ધ',
    n: 'ન',
    ŋ: 'ન',
    ƞ: 'ન',
    p: 'પ',
    ph: 'ફ',
    b: 'બ',
    bh: 'ભ',
    m: 'મ',
    y: 'ય',
    r: 'ર',
    l: 'લ',
    v: 'વ',
    w: 'વ',
    ś: 'શ',
    sh: 'શ',
    ṣ: 'ષ',
    s: 'સ',
    ṡ: 'સ',
    h: 'હ',
    ħ: 'હ',
    ḫ: 'ખ઼',
    ḷ: 'ળ',
    ḻ: 'ળ',
    ṟ: 'ર઼',
    ṙ: 'ર',
    ṉ: 'ન઼',
    q: 'ક઼',
    ḳ: 'ક઼',
    ḵh: 'ખ઼',
    x: 'ખ઼',
    ġ: 'ગ઼',
    z: 'જ઼',
    ż: 'જ઼',
    ẓ: 'જ઼',
    ṛ: 'ડ઼',
    ṛh: 'ઢ઼',
    f: 'ફ઼',
    ẏ: 'ય઼',
    ž: 'જ઼',
    zh: 'ૹ',
    ǧ: 'ગ઼',
    gg: 'ગ઼',
    jj: 'જ઼',
    ddd: 'ડ઼',
    ɗ: 'ડ઼',
    bb: 'બ઼',
    ɓ: 'બ઼',
    ḍḍ: 'ડ઼',
    yy: 'ય઼',
    ʔ: 'ઽ',
    ṯ: 'ત઼',
    ḏ: 'દ઼',
    ẖ: 'હ઼',
    s̱: 'સ઼',
    ẕ: 'જ઼',
    g̱: 'ગ઼',
    ḵ: 'ખ઼',
};
const signs = {
    m̐: 'ᳪ',
    '̃': 'ઁ',
    '\u0310': 'ઁ',
    ṃ: 'ં',
    ṁ: 'ં',
    ḥ: 'ઃ',
    "'": 'ઽ',
    '‘': 'ઽ',
    '’': 'ઽ',
    ʼ: 'ઽ',
    '\u0301': '॑',
    '\u0300': '॒',
    '\u030D': '॑',
    '\u030E': '᳚',
    '\u0302': '᳚',
    '\u0320': '॒',
    '\u0AFA': '\u0AFA',
    '\u0AFB': '\u0AFB',
    '\u0AFC': '\u0AFC',
    '\u0AFD': '\u0AFD',
    '\u0AFE': '\u0AFE',
    '\u0AFF': '\u0AFF',
    '\u0B70': '૰',
    '\u0AF1': '૱',
};
const digits = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [String(i), String.fromCodePoint(0x0ae6 + i)]),
);
const strictIastVowels = new Set([
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
    'ai',
    'o',
    'au',
]);
const strictIastConsonants = new Set([
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
]);

const config = new ForwardScriptConfig({
    virama: '્',
    omSign: 'ૐ',
    danda: '।',
    doubleDanda: '।।',
    dottedCircle: '◌',
    independentVowels,
    vowelSigns,
    consonants,
    signs,
    digits,
    strictIastVowels,
    strictIastConsonants,
});
const converter = new ForwardConverter(config, () => new IastToGujaratiOptions());

export function toGujaratiFromIast(text, options = new IastToGujaratiOptions()) {
    return converter.convert(text, options);
}
export const to_gujarati_from_iast = toGujaratiFromIast;

export class IastToGujaratiString extends String {
    toGujaratiFromIast(options = new IastToGujaratiOptions()) {
        return toGujaratiFromIast(String(this), options);
    }
    to_gujarati_from_iast(options = new IastToGujaratiOptions()) {
        return this.toGujaratiFromIast(options);
    }
}
