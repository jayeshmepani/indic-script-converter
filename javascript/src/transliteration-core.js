/**
 * Core exact round-trip transliteration primitives.
 *
 * This module intentionally mirrors the Dart/Python envelope schema and the
 * invisible Unicode Tag metadata format byte-for-byte.
 */

export const UnicodeNormalizationForm = Object.freeze({
    PRESERVE: 'preserve',
    NFC: 'nfc',
    NFD: 'nfd',
    preserve: 'preserve',
    nfc: 'nfc',
    nfd: 'nfd',
});

export const TransliterationProfile = Object.freeze({
    STRICT_IAST: 'strictIast',
    ISO_15919_CORE: 'iso15919Core',
    EXTENDED_INDIC: 'extendedIndic',
    HUNTERIAN: 'hunterian',
    PLAIN_ENGLISH: 'plainEnglish',
    strictIast: 'strictIast',
    iso15919Core: 'iso15919Core',
    extendedIndic: 'extendedIndic',
    hunterian: 'hunterian',
    plainEnglish: 'plainEnglish',
});

export const TransliterationIssueSeverity = Object.freeze({
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    info: 'info',
    warning: 'warning',
    error: 'error',
});

export class TransliterationIssue {
    constructor({
        code,
        message,
        severity = TransliterationIssueSeverity.WARNING,
        sourceRuneOffset = null,
        source_rune_offset = sourceRuneOffset,
    }) {
        this.code = String(code);
        this.message = String(message);
        this.severity = severity;
        this.sourceRuneOffset = source_rune_offset;
        this.source_rune_offset = source_rune_offset;
        Object.freeze(this);
    }

    toJson() {
        return {
            code: this.code,
            message: this.message,
            severity: this.severity,
            sourceRuneOffset: this.sourceRuneOffset,
        };
    }

    to_json() {
        return this.toJson();
    }

    static fromJson(value) {
        return new TransliterationIssue({
            code: value.code,
            message: value.message,
            severity: value.severity,
            sourceRuneOffset: value.sourceRuneOffset ?? null,
        });
    }

    static from_json(value) {
        return TransliterationIssue.fromJson(value);
    }
}

export class TransliterationResult {
    constructor({
        original,
        normalizedInput,
        normalized_input = normalizedInput,
        rendered,
        profile,
        inputNormalization,
        input_normalization = inputNormalization,
        outputNormalization,
        output_normalization = outputNormalization,
        renderingIsInjective,
        rendering_is_injective = renderingIsInjective,
        issues = [],
    }) {
        this.original = String(original);
        this.normalizedInput = String(normalized_input);
        this.normalized_input = this.normalizedInput;
        this.rendered = String(rendered);
        this.profile = profile;
        this.inputNormalization = input_normalization;
        this.input_normalization = this.inputNormalization;
        this.outputNormalization = output_normalization;
        this.output_normalization = this.outputNormalization;
        this.renderingIsInjective = Boolean(rendering_is_injective);
        this.rendering_is_injective = this.renderingIsInjective;
        this.issues = Object.freeze(Array.from(issues));
        Object.freeze(this);
    }

    get originalCodePoints() {
        return Array.from(this.original, (ch) => ch.codePointAt(0));
    }

    get original_code_points() {
        return this.originalCodePoints;
    }

    restoreOriginal() {
        return this.original;
    }

    restore_original() {
        return this.original;
    }

    get exactSourceRecoveryAvailable() {
        return true;
    }

    get exact_source_recovery_available() {
        return true;
    }

    get hasErrors() {
        return this.issues.some((issue) => issue.severity === TransliterationIssueSeverity.ERROR);
    }

    get has_errors() {
        return this.hasErrors;
    }

    toJson() {
        return {
            schema: 'exact round-trip-indic-transliteration/1',
            original: this.original,
            originalCodePoints: this.originalCodePoints,
            normalizedInput: this.normalizedInput,
            rendered: this.rendered,
            profile: this.profile,
            inputNormalization: this.inputNormalization,
            outputNormalization: this.outputNormalization,
            renderingIsInjective: this.renderingIsInjective,
            issues: this.issues.map((issue) =>
                issue instanceof TransliterationIssue ? issue.toJson() : issue,
            ),
        };
    }

    to_json() {
        return this.toJson();
    }

    toJsonText(space = 0) {
        return JSON.stringify(this.toJson(), null, space);
    }

    to_json_text(space = 0) {
        return this.toJsonText(space);
    }

    static fromJson(value) {
        if (value?.schema !== 'exact round-trip-indic-transliteration/1') {
            throw new TypeError('Unsupported transliteration envelope.');
        }

        const original = String(value.original);
        const encodedCodePoints = Array.from(value.originalCodePoints, Number);
        const actualCodePoints = Array.from(original, (ch) => ch.codePointAt(0));
        if (!sameIntegers(encodedCodePoints, actualCodePoints)) {
            throw new TypeError('Envelope source code-point integrity check failed.');
        }

        return new TransliterationResult({
            original,
            normalizedInput: String(value.normalizedInput),
            rendered: String(value.rendered),
            profile: value.profile,
            inputNormalization: value.inputNormalization,
            outputNormalization: value.outputNormalization,
            renderingIsInjective: Boolean(value.renderingIsInjective),
            issues: Array.from(value.issues ?? [], (item) => TransliterationIssue.fromJson(item)),
        });
    }

    static from_json(value) {
        return TransliterationResult.fromJson(value);
    }

    static fromJsonText(text) {
        const value = JSON.parse(text);
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            throw new TypeError('Transliteration envelope must be a JSON object.');
        }
        return TransliterationResult.fromJson(value);
    }

    static from_json_text(text) {
        return TransliterationResult.fromJsonText(text);
    }
}

function sameIntegers(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function normalizeUnicode(input, form) {
    const text = String(input);
    switch (form) {
        case UnicodeNormalizationForm.PRESERVE:
            return text;
        case UnicodeNormalizationForm.NFC:
            return text.normalize('NFC');
        case UnicodeNormalizationForm.NFD:
            return text.normalize('NFD');
        default:
            throw new RangeError(`Unsupported normalization form: ${String(form)}`);
    }
}

export const normalize_unicode = normalizeUnicode;

const COMBINING_MARK_RE = /^\p{M}$/u;

export function isUnicodeCombiningMark(value) {
    let ch;
    if (typeof value === 'number') {
        try {
            ch = String.fromCodePoint(value);
        } catch {
            return false;
        }
    } else {
        ch = String(value);
    }
    return Array.from(ch).length === 1 && COMBINING_MARK_RE.test(ch);
}

export const is_unicode_combining_mark = isUnicodeCombiningMark;

export function isEncodedVedicMark(value) {
    const cp = typeof value === 'number' ? value : String(value).codePointAt(0);
    return (
        cp === 0x0951 ||
        cp === 0x0952 ||
        (cp >= 0x1cd0 && cp <= 0x1cff) ||
        (cp >= 0xa8e0 && cp <= 0xa8ff)
    );
}

export const is_encoded_vedic_mark = isEncodedVedicMark;

export class EmbeddedExactSource {
    constructor({
        visibleText,
        visible_text = visibleText,
        originalSource,
        original_source = originalSource,
    }) {
        this.visibleText = String(visible_text);
        this.visible_text = this.visibleText;
        this.originalSource = String(original_source);
        this.original_source = this.originalSource;
        Object.freeze(this);
    }
}

const EXACT_SOURCE_START_TAG = 0xe0001;
const EXACT_SOURCE_END_TAG = 0xe007f;
const EXACT_SOURCE_MAGIC = 'LIT1:';

function stringToUtf16Le(text) {
    return Buffer.from(String(text), 'utf16le');
}

function stringFromUtf16Le(bytes) {
    const buffer = Buffer.from(bytes);
    if (buffer.length % 2 !== 0) {
        throw new TypeError('Invalid UTF-16LE source payload length.');
    }
    return buffer.toString('utf16le');
}

function fnv1a32(bytes) {
    let hash = 0x811c9dc5;
    for (const byte of bytes) {
        hash ^= byte;
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
}

function checksumHex(bytes) {
    return fnv1a32(bytes).toString(16).padStart(8, '0');
}

function codePointsToString(points) {
    const chunks = [];
    const chunkSize = 8192;
    for (let i = 0; i < points.length; i += chunkSize) {
        chunks.push(String.fromCodePoint(...points.slice(i, i + chunkSize)));
    }
    return chunks.join('');
}

export function embedExactSourceMetadata(rendered, originalSource) {
    const visible = String(rendered);
    const source = String(originalSource);
    const bytes = stringToUtf16Le(source);
    const encoded = bytes.toString('base64url');
    const sourceChecksum = checksumHex(bytes);
    const renderedChecksum = checksumHex(stringToUtf16Le(visible));
    const payload = `${EXACT_SOURCE_MAGIC}${encoded}:${sourceChecksum}:${renderedChecksum}`;

    const taggedPayload = [EXACT_SOURCE_START_TAG];
    for (const unit of Array.from(payload, (ch) => ch.codePointAt(0))) {
        if (unit < 0x20 || unit > 0x7e) {
            throw new Error('Exact-source payload unexpectedly contains non-ASCII.');
        }
        taggedPayload.push(0xe0000 + unit);
    }
    taggedPayload.push(EXACT_SOURCE_END_TAG);
    return visible + codePointsToString(taggedPayload);
}

export const embed_exact_source_metadata = embedExactSourceMetadata;

export function tryDecodeExactSourceMetadata(text) {
    const sourceText = String(text);
    const runes = Array.from(sourceText, (ch) => ch.codePointAt(0));
    if (runes.length === 0 || runes.at(-1) !== EXACT_SOURCE_END_TAG) return null;

    let start = runes.length - 2;
    while (start >= 0 && runes[start] !== EXACT_SOURCE_START_TAG) start -= 1;
    if (start < 0) return null;

    const payloadUnits = [];
    for (let i = start + 1; i < runes.length - 1; i += 1) {
        const rune = runes[i];
        if (rune < 0xe0020 || rune > 0xe007e) return null;
        payloadUnits.push(rune - 0xe0000);
    }

    const payload = codePointsToString(payloadUnits);
    if (!payload.startsWith(EXACT_SOURCE_MAGIC)) return null;

    const body = payload.slice(EXACT_SOURCE_MAGIC.length);
    const renderedSplit = body.lastIndexOf(':');
    if (renderedSplit <= 0 || renderedSplit === body.length - 1) return null;
    const sourceSplit = body.lastIndexOf(':', renderedSplit - 1);
    if (sourceSplit <= 0 || sourceSplit === renderedSplit - 1) return null;

    const encoded = body.slice(0, sourceSplit);
    const sourceChecksumText = body.slice(sourceSplit + 1, renderedSplit);
    const renderedChecksumText = body.slice(renderedSplit + 1);
    if (!/^[0-9a-f]{8}$/.test(sourceChecksumText)) return null;
    if (!/^[0-9a-f]{8}$/.test(renderedChecksumText)) return null;

    try {
        const bytes = Buffer.from(encoded, 'base64url');
        if (checksumHex(bytes) !== sourceChecksumText) return null;
        const originalSource = stringFromUtf16Le(bytes);
        const visibleText = codePointsToString(runes.slice(0, start));
        if (checksumHex(stringToUtf16Le(visibleText)) !== renderedChecksumText) {
            return null;
        }
        return new EmbeddedExactSource({ visibleText, originalSource });
    } catch {
        return null;
    }
}

export const try_decode_exact_source_metadata = tryDecodeExactSourceMetadata;

export function stripExactSourceMetadata(text) {
    return tryDecodeExactSourceMetadata(text)?.visibleText ?? String(text);
}

export const strip_exact_source_metadata = stripExactSourceMetadata;

export function recoverEmbeddedExactSource(text) {
    return tryDecodeExactSourceMetadata(text)?.originalSource ?? null;
}

export const recover_embedded_exact_source = recoverEmbeddedExactSource;

export function hasEmbeddedExactSource(text) {
    return tryDecodeExactSourceMetadata(text) !== null;
}

export const has_embedded_exact_source = hasEmbeddedExactSource;
