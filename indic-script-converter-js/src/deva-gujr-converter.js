/**
 * Direct Gujarati <-> Devanagari conversion.
 *
 * Visible conversion is canonical and necessarily non-injective where the two
 * Unicode repertoires differ. Exact source recovery uses the package's existing
 * checksummed invisible metadata trailer.
 *
 * Node.js >=20, ES2023, no runtime dependencies beyond this package.
 */

import {
    LosslessTransliterationResult,
    TransliterationIssue,
    TransliterationIssueSeverity,
    TransliterationProfile,
    UnicodeNormalizationForm,
    embedExactSourceMetadata,
    normalizeUnicode,
    recoverEmbeddedExactSource,
    stripExactSourceMetadata,
} from './transliteration-core.js';

export const IndicScriptUnknownPolicy = Object.freeze({
    PRESERVE: 'preserve',
    THROW_ERROR: 'throwError',
    preserve: 'preserve',
    throwError: 'throwError',
});

export const IndicScriptDigitPolicy = Object.freeze({
    CONVERT_TO_TARGET: 'convertToTarget',
    PRESERVE_SOURCE: 'preserveSource',
    convertToTarget: 'convertToTarget',
    preserveSource: 'preserveSource',
});

function pickOption(value, camelName, snakeName, fallback) {
    if (value && Object.hasOwn(value, camelName)) return value[camelName];
    if (value && Object.hasOwn(value, snakeName)) return value[snakeName];
    return fallback;
}

export class IndicScriptConversionOptions {
    constructor(value = {}) {
        this.inputNormalization = pickOption(
            value,
            'inputNormalization',
            'input_normalization',
            UnicodeNormalizationForm.NFD,
        );
        this.outputNormalization = pickOption(
            value,
            'outputNormalization',
            'output_normalization',
            UnicodeNormalizationForm.NFC,
        );
        this.unknownPolicy = pickOption(
            value,
            'unknownPolicy',
            'unknown_policy',
            IndicScriptUnknownPolicy.PRESERVE,
        );
        this.digitPolicy = pickOption(
            value,
            'digitPolicy',
            'digit_policy',
            IndicScriptDigitPolicy.CONVERT_TO_TARGET,
        );
        this.collapseWhitespace = Boolean(
            pickOption(value, 'collapseWhitespace', 'collapse_whitespace', false),
        );
        this.embedExactSourceMetadata = Boolean(
            pickOption(value, 'embedExactSourceMetadata', 'embed_exact_source_metadata', false),
        );

        this.input_normalization = this.inputNormalization;
        this.output_normalization = this.outputNormalization;
        this.unknown_policy = this.unknownPolicy;
        this.digit_policy = this.digitPolicy;
        this.collapse_whitespace = this.collapseWhitespace;
        this.embed_exact_source_metadata = this.embedExactSourceMetadata;

        Object.freeze(this);
    }
}

function entriesToFrozenObject(entries) {
    return Object.freeze(Object.fromEntries(entries));
}

function offsetEntries(start, end, delta) {
    const out = [];
    for (let cp = start; cp <= end; cp += 1) {
        out.push([String.fromCodePoint(cp), String.fromCodePoint(cp + delta)]);
    }
    return out;
}

// Standard Unicode positions shared by Devanagari and Gujarati.
const DEVA_TO_GUJR_OFFSET_ENTRIES = [
    ...offsetEntries(0x0901, 0x0903, 0x0180),
    ...offsetEntries(0x0905, 0x090c, 0x0180),
    ...offsetEntries(0x090f, 0x0910, 0x0180),
    ...offsetEntries(0x0913, 0x0928, 0x0180),
    ...offsetEntries(0x092a, 0x0930, 0x0180),
    ...offsetEntries(0x0932, 0x0933, 0x0180),
    ...offsetEntries(0x0935, 0x0939, 0x0180),
    ...offsetEntries(0x093c, 0x0945, 0x0180),
    ...offsetEntries(0x0947, 0x0949, 0x0180),
    ...offsetEntries(0x094b, 0x094d, 0x0180),
    ['ॐ', 'ૐ'],
    ...offsetEntries(0x0960, 0x0963, 0x0180),
    ...offsetEntries(0x0966, 0x0971, 0x0180),
];

const GUJR_TO_DEVA_OFFSET_ENTRIES = [
    ...offsetEntries(0x0a81, 0x0a83, -0x0180),
    ...offsetEntries(0x0a85, 0x0a8c, -0x0180),
    ...offsetEntries(0x0a8f, 0x0a90, -0x0180),
    ...offsetEntries(0x0a93, 0x0aa8, -0x0180),
    ...offsetEntries(0x0aaa, 0x0ab0, -0x0180),
    ...offsetEntries(0x0ab2, 0x0ab3, -0x0180),
    ...offsetEntries(0x0ab5, 0x0ab9, -0x0180),
    ...offsetEntries(0x0abc, 0x0ac5, -0x0180),
    ...offsetEntries(0x0ac7, 0x0ac9, -0x0180),
    ...offsetEntries(0x0acb, 0x0acd, -0x0180),
    ['ૐ', 'ॐ'],
    ...offsetEntries(0x0ae0, 0x0ae3, -0x0180),
    ...offsetEntries(0x0ae6, 0x0af1, -0x0180),
];

const DEVA_TO_GUJR_SINGLE = entriesToFrozenObject([
    ...DEVA_TO_GUJR_OFFSET_ENTRIES,

    // Gujarati has no one-code-point counterparts for these Devanagari vowels.
    ['ऄ', 'અ'],
    ['ऍ', 'ઍ'],
    ['ऎ', 'ઍ'],
    ['ऑ', 'ઑ'],
    ['ऒ', 'ઑ'],
    ['ॲ', 'ઍ'],
    ['ॳ', 'ઓએ'],
    ['ॴ', 'ઓએ'],
    ['ॵ', 'ઑ'],
    ['ॶ', 'ઉએ'],
    ['ॷ', 'ઊએ'],

    // Vowel-sign repertoire differences.
    ['ऺ', 'ોએ'],
    ['ऻ', 'ોએ'],
    ['ॆ', 'ૅ'],
    ['ॊ', 'ૉ'],
    ['ॏ', 'ૉ'],
    ['ॖ', 'ુએ'],
    ['ॗ', 'ૂએ'],

    // Precomposed/nukta letters when input normalization is PRESERVE.
    ['ऩ', 'ન઼'],
    ['ऱ', 'ર઼'],
    ['ऴ', 'ળ'],
    ['क़', 'ક઼'],
    ['ख़', 'ખ઼'],
    ['ग़', 'ગ઼'],
    ['ज़', 'જ઼'],
    ['ड़', 'ડ઼'],
    ['ढ़', 'ઢ઼'],
    ['फ़', 'ફ઼'],
    ['य़', 'ય઼'],

    // Devanagari Extended letters and their closest Gujarati renderings.
    ['ॸ', 'ડ઼'],
    ['ॹ', 'ૹ'],
    ['ॺ', 'ય઼'],
    ['ॻ', 'ગ઼'],
    ['ॼ', 'જ઼'],
    ['ॽ', 'ઽ'],
    ['ॾ', 'ડ઼'],
    ['ॿ', 'બ઼'],
]);

const GUJR_TO_DEVA_SINGLE = entriesToFrozenObject([
    ...GUJR_TO_DEVA_OFFSET_ENTRIES,

    // Canonical targets for Gujarati repertoire collapses.
    ['ઍ', 'ऎ'],
    ['ઑ', 'ऒ'],
    ['ૅ', 'ॆ'],
    ['ૉ', 'ॊ'],

    // Gujarati ZHA has a direct Devanagari Extended counterpart.
    ['ૹ', 'ॹ'],
]);

const DEVA_TO_GUJR_SEQUENCES = entriesToFrozenObject([
    ['ऩ', 'ન઼'],
    ['ऱ', 'ર઼'],
    ['ऴ', 'ળ'],
    ['क़', 'ક઼'],
    ['ख़', 'ખ઼'],
    ['ग़', 'ગ઼'],
    ['ज़', 'જ઼'],
    ['ड़', 'ડ઼'],
    ['ढ़', 'ઢ઼'],
    ['फ़', 'ફ઼'],
    ['य़', 'ય઼'],
    ['त़', 'ત઼'],
    ['द़', 'દ઼'],
    ['ह़', 'હ઼'],
    ['स़', 'સ઼'],
    ['ब़', 'બ઼'],
]);

const GUJR_TO_DEVA_SEQUENCES = entriesToFrozenObject([
    ['ન઼', 'ऩ'],
    ['ર઼', 'ऱ'],
    ['ક઼', 'क़'],
    ['ખ઼', 'ख़'],
    ['ગ઼', 'ग़'],
    ['જ઼', 'ज़'],
    ['ડ઼', 'ड़'],
    ['ઢ઼', 'ढ़'],
    ['ફ઼', 'फ़'],
    ['ય઼', 'य़'],
    ['ત઼', 'त़'],
    ['દ઼', 'द़'],
    ['હ઼', 'ह़'],
    ['સ઼', 'स़'],
    ['બ઼', 'ॿ'],
]);

const DEVA_DIGIT_START = 0x0966;
const DEVA_DIGIT_END = 0x096f;
const GUJR_DIGIT_START = 0x0ae6;
const GUJR_DIGIT_END = 0x0aef;

const DEVA_SOURCE_METADATA_PREFIX = '\u0000ISC:D:';
const GUJR_SOURCE_METADATA_PREFIX = '\u0000ISC:G:';

function codePointLength(text) {
    return Array.from(text).length;
}

function sortedSequenceEntries(mapping) {
    return Object.entries(mapping).sort(([a], [b]) => codePointLength(b) - codePointLength(a));
}

const DEVA_TO_GUJR_SEQUENCE_ENTRIES = sortedSequenceEntries(DEVA_TO_GUJR_SEQUENCES);
const GUJR_TO_DEVA_SEQUENCE_ENTRIES = sortedSequenceEntries(GUJR_TO_DEVA_SEQUENCES);

function startsWithCodePoints(runes, index, keyRunes) {
    if (index + keyRunes.length > runes.length) return false;
    for (let offset = 0; offset < keyRunes.length; offset += 1) {
        if (runes[index + offset] !== keyRunes[offset]) return false;
    }
    return true;
}

function handleUnknown(ch, options, sourceName, index) {
    if (options.unknownPolicy === IndicScriptUnknownPolicy.PRESERVE) return ch;
    if (options.unknownPolicy === IndicScriptUnknownPolicy.THROW_ERROR) {
        const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        throw new TypeError(
            `Unmapped ${sourceName} character U+${cp} at code-point offset ${index}.`,
        );
    }
    throw new RangeError(`Unsupported unknown policy: ${options.unknownPolicy}`);
}

function convertCanonical(
    input,
    options,
    {
        sourceName,
        singleMap,
        sequenceEntries,
        sourceDigitStart,
        sourceDigitEnd,
        targetDigitStart,
        metadataSourcePrefix,
    },
) {
    const visibleInput = stripExactSourceMetadata(String(input));
    const normalized = normalizeUnicode(visibleInput, options.inputNormalization);
    const runes = Array.from(normalized);
    const out = [];

    let index = 0;
    while (index < runes.length) {
        let matched = false;
        for (const [key, replacement] of sequenceEntries) {
            const keyRunes = Array.from(key);
            if (!startsWithCodePoints(runes, index, keyRunes)) continue;
            out.push(replacement);
            index += keyRunes.length;
            matched = true;
            break;
        }
        if (matched) continue;

        const ch = runes[index];
        const cp = ch.codePointAt(0);

        if (cp >= sourceDigitStart && cp <= sourceDigitEnd) {
            if (options.digitPolicy === IndicScriptDigitPolicy.PRESERVE_SOURCE) {
                out.push(ch);
            } else if (options.digitPolicy === IndicScriptDigitPolicy.CONVERT_TO_TARGET) {
                out.push(String.fromCodePoint(targetDigitStart + (cp - sourceDigitStart)));
            } else {
                throw new RangeError(`Unsupported digit policy: ${options.digitPolicy}`);
            }
            index += 1;
            continue;
        }

        const replacement = singleMap[ch];
        out.push(replacement ?? handleUnknown(ch, options, sourceName, index));
        index += 1;
    }

    let rendered = normalizeUnicode(out.join(''), options.outputNormalization);
    if (options.collapseWhitespace) {
        rendered = rendered.replace(/\s+/gu, ' ').trim();
    }

    return options.embedExactSourceMetadata
        ? embedExactSourceMetadata(rendered, `${metadataSourcePrefix}${visibleInput}`)
        : rendered;
}

function normalizeOptions(options) {
    return options instanceof IndicScriptConversionOptions
        ? options
        : new IndicScriptConversionOptions(options);
}

function recoverTypedExactSource(input, expectedPrefix) {
    const recovered = recoverEmbeddedExactSource(String(input));
    if (recovered === null || !recovered.startsWith(expectedPrefix)) return null;
    return recovered.slice(expectedPrefix.length);
}

/**
 * Always performs visible canonical Gujarati -> Devanagari conversion.
 * Embedded metadata on the input is ignored/stripped.
 */
export function toCanonicalDevanagariFromGujarati(input, options = {}) {
    const resolved = normalizeOptions(options);
    return convertCanonical(input, resolved, {
        sourceName: 'Gujarati',
        singleMap: GUJR_TO_DEVA_SINGLE,
        sequenceEntries: GUJR_TO_DEVA_SEQUENCE_ENTRIES,
        sourceDigitStart: GUJR_DIGIT_START,
        sourceDigitEnd: GUJR_DIGIT_END,
        targetDigitStart: DEVA_DIGIT_START,
        metadataSourcePrefix: GUJR_SOURCE_METADATA_PREFIX,
    });
}

export const to_canonical_devanagari_from_gujarati = toCanonicalDevanagariFromGujarati;

/**
 * Returns an exact embedded Devanagari source when present; otherwise performs
 * canonical Gujarati -> Devanagari conversion.
 */
export function toDevanagariFromGujarati(input, options = {}) {
    return (
        recoverTypedExactSource(input, DEVA_SOURCE_METADATA_PREFIX) ??
        toCanonicalDevanagariFromGujarati(input, options)
    );
}

export const to_devanagari_from_gujarati = toDevanagariFromGujarati;

/** Requires metadata embedded by a previous Devanagari -> Gujarati conversion. */
export function toExactDevanagariFromGujarati(input) {
    const text = String(input);
    if (text.length === 0) return '';
    const exact = recoverTypedExactSource(text, DEVA_SOURCE_METADATA_PREFIX);
    if (exact === null) {
        throw new TypeError(
            'No valid embedded exact-source metadata was found. Convert with ' +
                'IndicScriptConversionOptions({ embedExactSourceMetadata: true }).',
        );
    }
    return exact;
}

export const to_exact_devanagari_from_gujarati = toExactDevanagariFromGujarati;

/**
 * Always performs visible canonical Devanagari -> Gujarati conversion.
 * Embedded metadata on the input is ignored/stripped.
 */
export function toCanonicalGujaratiFromDevanagari(input, options = {}) {
    const resolved = normalizeOptions(options);
    return convertCanonical(input, resolved, {
        sourceName: 'Devanagari',
        singleMap: DEVA_TO_GUJR_SINGLE,
        sequenceEntries: DEVA_TO_GUJR_SEQUENCE_ENTRIES,
        sourceDigitStart: DEVA_DIGIT_START,
        sourceDigitEnd: DEVA_DIGIT_END,
        targetDigitStart: GUJR_DIGIT_START,
        metadataSourcePrefix: DEVA_SOURCE_METADATA_PREFIX,
    });
}

export const to_canonical_gujarati_from_devanagari = toCanonicalGujaratiFromDevanagari;

/**
 * Returns an exact embedded Gujarati source when present; otherwise performs
 * canonical Devanagari -> Gujarati conversion.
 */
export function toGujaratiFromDevanagari(input, options = {}) {
    return (
        recoverTypedExactSource(input, GUJR_SOURCE_METADATA_PREFIX) ??
        toCanonicalGujaratiFromDevanagari(input, options)
    );
}

export const to_gujarati_from_devanagari = toGujaratiFromDevanagari;

/** Requires metadata embedded by a previous Gujarati -> Devanagari conversion. */
export function toExactGujaratiFromDevanagari(input) {
    const text = String(input);
    if (text.length === 0) return '';
    const exact = recoverTypedExactSource(text, GUJR_SOURCE_METADATA_PREFIX);
    if (exact === null) {
        throw new TypeError(
            'No valid embedded exact-source metadata was found. Convert with ' +
                'IndicScriptConversionOptions({ embedExactSourceMetadata: true }).',
        );
    }
    return exact;
}

export const to_exact_gujarati_from_devanagari = toExactGujaratiFromDevanagari;

export function hasExactGujaratiSourceMetadata(input) {
    return recoverTypedExactSource(input, GUJR_SOURCE_METADATA_PREFIX) !== null;
}

export const has_exact_gujarati_source_metadata = hasExactGujaratiSourceMetadata;

export function hasExactDevanagariSourceMetadata(input) {
    return recoverTypedExactSource(input, DEVA_SOURCE_METADATA_PREFIX) !== null;
}

export const has_exact_devanagari_source_metadata = hasExactDevanagariSourceMetadata;

export function visibleWithoutExactSourceMetadata(input) {
    return stripExactSourceMetadata(String(input));
}

export const visible_without_exact_source_metadata = visibleWithoutExactSourceMetadata;

export function toLosslessDevanagariFromGujarati(input, options = {}) {
    const resolved = normalizeOptions(options);
    const original = String(input);
    const visibleInput = stripExactSourceMetadata(original);
    const normalizedInput = normalizeUnicode(visibleInput, resolved.inputNormalization);
    const rendered = toCanonicalDevanagariFromGujarati(visibleInput, resolved);

    return new LosslessTransliterationResult({
        original,
        normalizedInput,
        rendered,
        profile: TransliterationProfile.EXTENDED_INDIC,
        inputNormalization: resolved.inputNormalization,
        outputNormalization: resolved.outputNormalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: 'SOURCE_METADATA_REQUIRED_FOR_EXACT_SCRIPT_REVERSE',
                message:
                    'Gujarati and Devanagari have unequal repertoires. Keep this envelope or enable exact-source metadata for exact recovery.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}

export const to_lossless_devanagari_from_gujarati = toLosslessDevanagariFromGujarati;

export function toLosslessGujaratiFromDevanagari(input, options = {}) {
    const resolved = normalizeOptions(options);
    const original = String(input);
    const visibleInput = stripExactSourceMetadata(original);
    const normalizedInput = normalizeUnicode(visibleInput, resolved.inputNormalization);
    const rendered = toCanonicalGujaratiFromDevanagari(visibleInput, resolved);

    return new LosslessTransliterationResult({
        original,
        normalizedInput,
        rendered,
        profile: TransliterationProfile.EXTENDED_INDIC,
        inputNormalization: resolved.inputNormalization,
        outputNormalization: resolved.outputNormalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: 'SOURCE_METADATA_REQUIRED_FOR_EXACT_SCRIPT_REVERSE',
                message:
                    'Devanagari and Gujarati have unequal repertoires. Keep this envelope or enable exact-source metadata for exact recovery.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}

export const to_lossless_gujarati_from_devanagari = toLosslessGujaratiFromDevanagari;
