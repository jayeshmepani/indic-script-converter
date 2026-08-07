import { ForwardConverter, ForwardScriptConfig } from './forward.js';

export const DevanagariRomanizationProfile = Object.freeze({
    STRICT_IAST: 'strictIast',
    ISO_15919_CORE: 'iso15919Core',
    EXTENDED_INDIC: 'extendedIndic',
    strictIast: 'strictIast',
    iso15919Core: 'iso15919Core',
    extendedIndic: 'extendedIndic',
});
export const RomanizationProfile = DevanagariRomanizationProfile;

export const IastToDevanagariUnknownLatinPolicy = Object.freeze({
    PASS_THROUGH: 'passThrough',
    BRACKET: 'bracket',
    THROW_ERROR: 'throwError',
    passThrough: 'passThrough',
    bracket: 'bracket',
    throwError: 'throwError',
});
export const IastToDevanagariDigitPolicy = Object.freeze({
    PRESERVE_ASCII: 'preserveAscii',
    CONVERT_TO_SCRIPT: 'convertToScript',
    preserveAscii: 'preserveAscii',
    convertToScript: 'convertToScript',
});
export const IastToDevanagariPunctuationPolicy = Object.freeze({
    PRESERVE: 'preserve',
    INDIC_DANDA: 'indicDanda',
    preserve: 'preserve',
    indicDanda: 'indicDanda',
});
export const IastToDevanagariOmPolicy = Object.freeze({
    TRANSLITERATE_LETTERS: 'transliterateLetters',
    USE_OM_SIGN: 'useOmSign',
    transliterateLetters: 'transliterateLetters',
    useOmSign: 'useOmSign',
});
export const IastToDevanagariAmbiguousLPolicy = Object.freeze({
    CONTEXT: 'context',
    PREFER_VOCALIC: 'preferVocalic',
    PREFER_CONSONANT: 'preferConsonant',
    context: 'context',
    preferVocalic: 'preferVocalic',
    preferConsonant: 'preferConsonant',
});

export class IastToDevanagariOptions {
    constructor(values = {}) {
        this.profile = values.profile ?? DevanagariRomanizationProfile.EXTENDED_INDIC;
        this.unknownLatinPolicy =
            values.unknownLatinPolicy ??
            values.unknown_latin_policy ??
            IastToDevanagariUnknownLatinPolicy.PASS_THROUGH;
        this.unknown_latin_policy = this.unknownLatinPolicy;
        this.digitPolicy =
            values.digitPolicy ?? values.digit_policy ?? IastToDevanagariDigitPolicy.PRESERVE_ASCII;
        this.digit_policy = this.digitPolicy;
        this.punctuationPolicy =
            values.punctuationPolicy ??
            values.punctuation_policy ??
            IastToDevanagariPunctuationPolicy.PRESERVE;
        this.punctuation_policy = this.punctuationPolicy;
        this.omPolicy =
            values.omPolicy ?? values.om_policy ?? IastToDevanagariOmPolicy.TRANSLITERATE_LETTERS;
        this.om_policy = this.omPolicy;
        this.ambiguousLPolicy =
            values.ambiguousLPolicy ??
            values.ambiguous_l_policy ??
            IastToDevanagariAmbiguousLPolicy.CONTEXT;
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
    a: 'अ',
    ā: 'आ',
    i: 'इ',
    ī: 'ई',
    u: 'उ',
    ū: 'ऊ',
    ṛ: 'ऋ',
    ṝ: 'ॠ',
    ḷ: 'ऌ',
    ḹ: 'ॡ',
    e: 'ए',
    ē: 'ए',
    ai: 'ऐ',
    o: 'ओ',
    ō: 'ओ',
    au: 'औ',
    ă: 'ऄ',
    ĕ: 'ऎ',
    ê: 'ऍ',
    ĕ: 'ऎ',
    æ: 'ॲ',
    ŏ: 'ऒ',
    ô: 'ऑ',
    ŏ: 'ऒ',
    oe: 'ॳ',
    ōe: 'ॴ',
    ooe: 'ॴ',
    aw: 'ॵ',
    ue: 'ॶ',
    ūe: 'ॷ',
    uue: 'ॷ',
};
const vowelSigns = {
    a: '',
    ā: 'ा',
    i: 'ि',
    ī: 'ी',
    u: 'ु',
    ū: 'ू',
    ṛ: 'ृ',
    ṝ: 'ॄ',
    ḷ: 'ॢ',
    ḹ: 'ॣ',
    e: 'े',
    ē: 'े',
    ai: 'ै',
    o: 'ो',
    ō: 'ो',
    au: 'ौ',
    ă: '',
    ĕ: 'ॆ',
    ê: 'ॅ',
    ĕ: 'ॆ',
    æ: 'ॅ',
    ŏ: 'ॊ',
    ô: 'ॉ',
    ŏ: 'ॊ',
    oe: 'ऺ',
    ōe: 'ऻ',
    ooe: 'ऻ',
    aw: 'ॏ',
    ue: 'ॖ',
    ūe: 'ॗ',
    uue: 'ॗ',
};
const consonants = {
    k: 'क',
    kh: 'ख',
    g: 'ग',
    gh: 'घ',
    ṅ: 'ङ',
    c: 'च',
    ch: 'छ',
    j: 'ज',
    jh: 'झ',
    ñ: 'ञ',
    ṭ: 'ट',
    ṭh: 'ठ',
    ḍ: 'ड',
    ḍh: 'ढ',
    ṇ: 'ण',
    t: 'त',
    th: 'थ',
    d: 'द',
    dh: 'ध',
    n: 'न',
    ŋ: 'न',
    ƞ: 'न',
    p: 'प',
    ph: 'फ',
    b: 'ब',
    bh: 'भ',
    m: 'म',
    y: 'य',
    r: 'र',
    l: 'ल',
    v: 'व',
    w: 'व',
    ś: 'श',
    sh: 'श',
    ṣ: 'ष',
    s: 'स',
    ṡ: 'स',
    h: 'ह',
    ħ: 'ह',
    ḫ: 'ख़',
    ḷ: 'ळ',
    ḻ: 'ऴ',
    ṟ: 'ऱ',
    ṙ: 'र',
    ṉ: 'ऩ',
    q: 'क़',
    ḳ: 'क़',
    ḵh: 'ख़',
    x: 'ख़',
    ġ: 'ग़',
    z: 'ज़',
    ż: 'ज़',
    ẓ: 'ज़',
    ṛ: 'ड़',
    ṛh: 'ढ़',
    f: 'फ़',
    ẏ: 'य़',
    ž: 'ज़',
    zh: 'ॹ',
    ǧ: 'ॻ',
    gg: 'ॻ',
    jj: 'ॼ',
    ddd: 'ॾ',
    ɗ: 'ॾ',
    bb: 'ॿ',
    ɓ: 'ॿ',
    ḍḍ: 'ॸ',
    yy: 'ॺ',
    ʔ: 'ॽ',
    ṯ: 'त़',
    ḏ: 'द़',
    ẖ: 'ह़',
    s̱: 'स़',
    ẕ: 'ज़',
    g̱: 'ग़',
    ḵ: 'ख़',
};
const signs = {
    m̐: 'ᳪ',
    '̃': 'ँ',
    '\u0310': 'ँ',
    ṃ: 'ं',
    ṁ: 'ं',
    ḥ: 'ः',
    "'": 'ऽ',
    '‘': 'ऽ',
    '’': 'ऽ',
    ʼ: 'ऽ',
    '\u0301': '॑',
    '\u0300': '॒',
    '\u030D': '॑',
    '\u030E': '᳚',
    '\u0302': '᳚',
    '\u0320': '॒',
    '\u0900': 'ऀ',
    '\u0970': '॰',
    '\u0971': 'ॱ',
};
const digits = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [String(i), String.fromCodePoint(0x0966 + i)]),
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
    virama: '्',
    omSign: 'ॐ',
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
const converter = new ForwardConverter(config, () => new IastToDevanagariOptions());

export function toDevanagariFromIast(text, options = new IastToDevanagariOptions()) {
    return converter.convert(text, options);
}
export const to_devanagari_from_iast = toDevanagariFromIast;

export class IastToDevanagariString extends String {
    toDevanagariFromIast(options = new IastToDevanagariOptions()) {
        return toDevanagariFromIast(String(this), options);
    }
    to_devanagari_from_iast(options = new IastToDevanagariOptions()) {
        return this.toDevanagariFromIast(options);
    }
}
