import {
    LosslessTransliterationResult,
    TransliterationIssue,
    TransliterationIssueSeverity,
    TransliterationProfile,
    UnicodeNormalizationForm,
    embedExactSourceMetadata,
    normalizeUnicode,
    stripExactSourceMetadata,
} from './transliteration-core.js';
import {
    DevanagariRomanizationProfile,
    IastToDevanagariOptions,
    toDevanagariFromIast,
} from './latn-iast-to-deva.js';
import {
    GujaratiRomanizationProfile,
    IastToGujaratiOptions,
    toGujaratiFromIast,
} from './latn-iast-to-gujr.js';
import {
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    toPlainEnglishFromIast,
} from './latn-iast-transcription.js';

function devanagariProfile(profile) {
    if (profile === DevanagariRomanizationProfile.STRICT_IAST) {
        return TransliterationProfile.STRICT_IAST;
    }
    if (profile === DevanagariRomanizationProfile.ISO_15919_CORE) {
        return TransliterationProfile.ISO_15919_CORE;
    }
    return TransliterationProfile.EXTENDED_INDIC;
}

function gujaratiProfile(profile) {
    if (profile === GujaratiRomanizationProfile.STRICT_IAST) {
        return TransliterationProfile.STRICT_IAST;
    }
    if (profile === GujaratiRomanizationProfile.ISO_15919_CORE) {
        return TransliterationProfile.ISO_15919_CORE;
    }
    return TransliterationProfile.EXTENDED_INDIC;
}

export function toLosslessDevanagari(
    text,
    {
        options = new IastToDevanagariOptions(),
        inputNormalization = UnicodeNormalizationForm.NFD,
        input_normalization = inputNormalization,
        outputNormalization = UnicodeNormalizationForm.NFC,
        output_normalization = outputNormalization,
    } = {},
) {
    const source = String(text);
    const resolvedOptions =
        options instanceof IastToDevanagariOptions ? options : new IastToDevanagariOptions(options);
    const normalizedInput = normalizeUnicode(source, input_normalization);
    const directlyRendered = toDevanagariFromIast(normalizedInput, resolvedOptions);
    const normalizedVisible = normalizeUnicode(
        stripExactSourceMetadata(directlyRendered),
        output_normalization,
    );
    const rendered = resolvedOptions.embedExactSourceMetadata
        ? embedExactSourceMetadata(normalizedVisible, source)
        : normalizedVisible;

    return new LosslessTransliterationResult({
        original: source,
        normalizedInput,
        rendered,
        profile: devanagariProfile(resolvedOptions.profile),
        inputNormalization: input_normalization,
        outputNormalization: output_normalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: 'SOURCE_METADATA_REQUIRED_FOR_EXACT_REVERSE',
                message:
                    'Keep this envelope to recover exact source case, aliases, and code points.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}
export const to_lossless_devanagari = toLosslessDevanagari;

export function toLosslessGujarati(
    text,
    {
        options = new IastToGujaratiOptions(),
        inputNormalization = UnicodeNormalizationForm.NFD,
        input_normalization = inputNormalization,
        outputNormalization = UnicodeNormalizationForm.NFC,
        output_normalization = outputNormalization,
    } = {},
) {
    const source = String(text);
    const resolvedOptions =
        options instanceof IastToGujaratiOptions ? options : new IastToGujaratiOptions(options);
    const normalizedInput = normalizeUnicode(source, input_normalization);
    const directlyRendered = toGujaratiFromIast(normalizedInput, resolvedOptions);
    const normalizedVisible = normalizeUnicode(
        stripExactSourceMetadata(directlyRendered),
        output_normalization,
    );
    const rendered = resolvedOptions.embedExactSourceMetadata
        ? embedExactSourceMetadata(normalizedVisible, source)
        : normalizedVisible;

    return new LosslessTransliterationResult({
        original: source,
        normalizedInput,
        rendered,
        profile: gujaratiProfile(resolvedOptions.profile),
        inputNormalization: input_normalization,
        outputNormalization: output_normalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: 'SOURCE_METADATA_REQUIRED_FOR_EXACT_REVERSE',
                message:
                    'Keep this envelope to recover exact source case, aliases, and code points.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}
export const to_lossless_gujarati = toLosslessGujarati;

export function toLosslessPlainEnglish(
    text,
    {
        options = new IastPlainEnglishOptions(),
        inputNormalization = UnicodeNormalizationForm.NFD,
        input_normalization = inputNormalization,
        outputNormalization = UnicodeNormalizationForm.NFC,
        output_normalization = outputNormalization,
    } = {},
) {
    const source = String(text);
    const resolvedOptions =
        options instanceof IastPlainEnglishOptions ? options : new IastPlainEnglishOptions(options);
    const normalizedInput = normalizeUnicode(source, input_normalization);
    const rendered = normalizeUnicode(
        toPlainEnglishFromIast(normalizedInput, resolvedOptions),
        output_normalization,
    );
    const isHunterian = resolvedOptions.profile === PlainEnglishRomanizationProfile.HUNTERIAN;
    return new LosslessTransliterationResult({
        original: source,
        normalizedInput,
        rendered,
        profile: isHunterian
            ? TransliterationProfile.HUNTERIAN
            : TransliterationProfile.PLAIN_ENGLISH,
        inputNormalization: input_normalization,
        outputNormalization: output_normalization,
        renderingIsInjective: false,
        issues: [
            new TransliterationIssue({
                code: isHunterian
                    ? 'HUNTERIAN_VIEW_IS_INTRINSICALLY_LOSSY'
                    : 'PLAIN_ENGLISH_VIEW_IS_INTRINSICALLY_LOSSY',
                message: isHunterian
                    ? 'Hunterian merges vowel length, place of articulation, and other distinctions. Exact recovery uses the retained source envelope.'
                    : 'Plain-English rendering merges scholarly distinctions. Exact recovery uses the retained source envelope.',
                severity: TransliterationIssueSeverity.INFO,
            }),
        ],
    });
}
export const to_lossless_plain_english = toLosslessPlainEnglish;
