import { toDevanagariFromIast } from './latn-iast-to-deva.js';
import { toGujaratiFromIast } from './latn-iast-to-gujr.js';
import { toPlainEnglishFromIast } from './latn-iast-transcription.js';
import {
    toIastFromDevanagari,
    toIastFromGujarati,
    toCanonicalIastFromDevanagari,
    toCanonicalIastFromGujarati,
    toExactIastFromDevanagari,
    toExactIastFromGujarati,
} from './brahmic-to-latn-iast.js';
import {
    toDevanagariFromGujarati,
    toGujaratiFromDevanagari,
    toCanonicalGujaratiFromDevanagari,
    toCanonicalDevanagariFromGujarati,
    toExactDevanagariFromGujarati,
    toExactGujaratiFromDevanagari,
} from './deva-gujr-converter.js';
import { toDevanagari, toGujarati, toPlainEnglish } from './transliteration-result.js';

/**
 * Bulk converts an array of IAST strings to Devanagari script strings.
 * @param {Array<string>} items Array of strings to convert.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of converted Devanagari strings.
 */
export function toDevanagariFromIastList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toDevanagariFromIast(item, options));
}

/**
 * Bulk converts an array of IAST strings to Gujarati script strings.
 * @param {Array<string>} items Array of strings to convert.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of converted Gujarati strings.
 */
export function toGujaratiFromIastList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toGujaratiFromIast(item, options));
}

/**
 * Bulk converts an array of IAST strings to Plain English strings.
 * @param {Array<string>} items Array of strings to convert.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of converted Plain English strings.
 */
export function toPlainEnglishFromIastList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toPlainEnglishFromIast(item, options));
}

/**
 * Smart converts an array of Devanagari strings back to IAST (recovers exact source if embedded metadata exists).
 * @param {Array<string>} items Array of Devanagari strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of IAST strings.
 */
export function toIastFromDevanagariList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toIastFromDevanagari(item, options));
}

/**
 * Smart converts an array of Gujarati strings back to IAST (recovers exact source if embedded metadata exists).
 * @param {Array<string>} items Array of Gujarati strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of IAST strings.
 */
export function toIastFromGujaratiList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toIastFromGujarati(item, options));
}

/**
 * Bulk converts an array of Devanagari strings back to canonical IAST.
 * @param {Array<string>} items Array of Devanagari strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of canonical IAST strings.
 */
export function toCanonicalIastFromDevanagariList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toCanonicalIastFromDevanagari(item, options));
}

/**
 * Bulk converts an array of Gujarati strings back to canonical IAST.
 * @param {Array<string>} items Array of Gujarati strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of canonical IAST strings.
 */
export function toCanonicalIastFromGujaratiList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toCanonicalIastFromGujarati(item, options));
}

/**
 * Bulk recovers exact original IAST strings from an array of Devanagari strings.
 * @param {Array<string>} items Array of Devanagari strings.
 * @returns {Array<string>} Array of exact IAST strings.
 */
export function toExactIastFromDevanagariList(items) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toExactIastFromDevanagari(item));
}

/**
 * Bulk recovers exact original IAST strings from an array of Gujarati strings.
 * @param {Array<string>} items Array of Gujarati strings.
 * @returns {Array<string>} Array of exact IAST strings.
 */
export function toExactIastFromGujaratiList(items) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toExactIastFromGujarati(item));
}

/**
 * Bulk converts an array of Devanagari strings to Gujarati strings (recovers exact source metadata if present).
 * @param {Array<string>} items Array of Devanagari strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of Gujarati strings.
 */
export function toGujaratiFromDevanagariList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toGujaratiFromDevanagari(item, options));
}

/**
 * Bulk converts an array of Gujarati strings to Devanagari strings (recovers exact source metadata if present).
 * @param {Array<string>} items Array of Gujarati strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of Devanagari strings.
 */
export function toDevanagariFromGujaratiList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toDevanagariFromGujarati(item, options));
}

/**
 * Bulk converts an array of Devanagari strings to canonical Gujarati strings.
 * @param {Array<string>} items Array of Devanagari strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of canonical Gujarati strings.
 */
export function toCanonicalGujaratiFromDevanagariList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toCanonicalGujaratiFromDevanagari(item, options));
}

/**
 * Bulk converts an array of Gujarati strings to canonical Devanagari strings.
 * @param {Array<string>} items Array of Gujarati strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<string>} Array of canonical Devanagari strings.
 */
export function toCanonicalDevanagariFromGujaratiList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toCanonicalDevanagariFromGujarati(item, options));
}

/**
 * Bulk recovers exact original Devanagari strings from an array of Gujarati strings.
 * @param {Array<string>} items Array of Gujarati strings.
 * @returns {Array<string>} Array of exact Devanagari strings.
 */
export function toExactDevanagariFromGujaratiList(items) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toExactDevanagariFromGujarati(item));
}

/**
 * Bulk recovers exact original Gujarati strings from an array of Devanagari strings.
 * @param {Array<string>} items Array of Devanagari strings.
 * @returns {Array<string>} Array of exact Gujarati strings.
 */
export function toExactGujaratiFromDevanagariList(items) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toExactGujaratiFromDevanagari(item));
}

/**
 * Bulk converts an array of IAST strings returning an array of Devanagari TransliterationResult envelopes.
 * @param {Array<string>} items Array of strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<TransliterationResult>} Array of result envelopes.
 */
export function toDevanagariList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toDevanagari(item, options));
}

/**
 * Bulk converts an array of IAST strings returning an array of Gujarati TransliterationResult envelopes.
 * @param {Array<string>} items Array of strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<TransliterationResult>} Array of result envelopes.
 */
export function toGujaratiList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toGujarati(item, options));
}

/**
 * Bulk converts an array of IAST strings returning an array of Plain English TransliterationResult envelopes.
 * @param {Array<string>} items Array of strings.
 * @param {object} [options] Conversion options.
 * @returns {Array<TransliterationResult>} Array of result envelopes.
 */
export function toPlainEnglishList(items, options) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of strings.');
    return items.map((item) => toPlainEnglish(item, options));
}
