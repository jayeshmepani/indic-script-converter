import test from 'node:test';
import assert from 'node:assert/strict';

import {
    toDevanagariFromIastList,
    toGujaratiFromIastList,
    toPlainEnglishFromIastList,
    toCanonicalGujaratiFromDevanagariList,
    toCanonicalDevanagariFromGujaratiList,
    toDevanagariList,
} from '../src/index.js';

test('bulk list converters operate on array of strings', () => {
    const input = ['Kṛṣṇa', 'Rāma', 'jñāna'];

    const devaList = toDevanagariFromIastList(input);
    assert.deepEqual(devaList, ['कृष्ण', 'राम', 'ज्ञान']);

    const gujrList = toGujaratiFromIastList(input);
    assert.deepEqual(gujrList, ['કૃષ્ણ', 'રામ', 'જ્ઞાન']);

    const plainList = toPlainEnglishFromIastList(input);
    assert.deepEqual(plainList, ['Krishna', 'Ram', 'gyan']);

    const gujrDirect = toCanonicalGujaratiFromDevanagariList(devaList);
    assert.deepEqual(gujrDirect, ['કૃષ્ણ', 'રામ', 'જ્ઞાન']);

    const devaDirect = toCanonicalDevanagariFromGujaratiList(gujrList);
    assert.deepEqual(devaDirect, ['कृष्ण', 'राम', 'ज्ञान']);

    const envList = toDevanagariList(input);
    assert.equal(envList.length, 3);
    assert.equal(envList[0].rendered, 'कृष्ण');
    assert.equal(envList[1].rendered, 'राम');
});
