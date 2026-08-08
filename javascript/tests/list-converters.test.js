import test from 'node:test';
import assert from 'node:assert/strict';

import {
    toDevanagariFromIastList,
    toGujaratiFromIastList,
    toPlainEnglishFromIastList,
    toCanonicalIastFromDevanagariList,
    toCanonicalIastFromGujaratiList,
    toCanonicalGujaratiFromDevanagariList,
    toCanonicalDevanagariFromGujaratiList,
    toDevanagariList,
    toGujaratiList,
    toPlainEnglishList,
} from '../src/index.js';

test('bulk list converters operate on array of strings across all directions', () => {
    const iastItems = ['Kṛṣṇa', 'Rāma', 'jñāna'];

    // 1. Latin (IAST) → Devanagari / Gujarati / Plain English
    const devaList = toDevanagariFromIastList(iastItems);
    assert.deepEqual(devaList, ['कृष्ण', 'राम', 'ज्ञान']);

    const gujrList = toGujaratiFromIastList(iastItems);
    assert.deepEqual(gujrList, ['કૃષ્ણ', 'રામ', 'જ્ઞાન']);

    const plainList = toPlainEnglishFromIastList(iastItems);
    assert.deepEqual(plainList, ['Krishna', 'Ram', 'gyan']);

    // 2. Brahmic → Latin IAST
    const iastFromDeva = toCanonicalIastFromDevanagariList(devaList);
    assert.deepEqual(iastFromDeva, ['kṛṣṇa', 'rāma', 'jñāna']);

    const iastFromGujr = toCanonicalIastFromGujaratiList(gujrList);
    assert.deepEqual(iastFromGujr, ['kṛṣṇa', 'rāma', 'jñāna']);

    // 3. Direct Devanagari ↔ Gujarati
    const gujrDirect = toCanonicalGujaratiFromDevanagariList(devaList);
    assert.deepEqual(gujrDirect, ['કૃષ્ણ', 'રામ', 'જ્ઞાન']);

    const devaDirect = toCanonicalDevanagariFromGujaratiList(gujrList);
    assert.deepEqual(devaDirect, ['कृष्ण', 'राम', 'ज्ञान']);

    // 4. Result Envelopes
    const envDeva = toDevanagariList(iastItems);
    assert.equal(envDeva.length, 3);
    assert.equal(envDeva[0].rendered, 'कृष्ण');
    assert.equal(envDeva[1].rendered, 'राम');

    const envGujr = toGujaratiList(iastItems);
    assert.equal(envGujr.length, 3);
    assert.equal(envGujr[0].rendered, 'કૃષ્ણ');

    const envPlain = toPlainEnglishList(iastItems);
    assert.equal(envPlain.length, 3);
    assert.equal(envPlain[0].rendered, 'Krishna');
});

test('bulk list converters support custom options and parameters', () => {
    const items = ['Rāma 123', 'jñāna'];

    const devaDigits = toDevanagariFromIastList(items, { digitPolicy: 'convertToScript' });
    assert.deepEqual(devaDigits, ['राम १२३', 'ज्ञान']);

    const plainKeepFinalA = toPlainEnglishFromIastList(items, { finalA: 'keep' });
    assert.deepEqual(plainKeepFinalA, ['Rama 123', 'gyana']);
});
