import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    IastToDevanagariOptions,
    IastToGujaratiOptions,
    LosslessTransliterationResult,
    embedExactSourceMetadata,
    hasEmbeddedExactSource,
    recoverEmbeddedExactSource,
    stripExactSourceMetadata,
    toDevanagariFromIast,
    toExactIastFromDevanagari,
    toExactIastFromGujarati,
    toGujaratiFromIast,
    toLosslessPlainEnglish,
} from '../src/index.js';

const sources = [
    'Kṛṣṇa',
    'Kr̥ṣṇa',
    'KṚṢṆA',
    'Rāma',
    'ḫāna / k͟hāna / xaṇḍa',
    'ṣ́akti / ṣ́akti',
    'ṃ̄ / ṃ̄ / ṁaṅgala / ṁaṅgala / m̐tra',
    'emoji 😀 supplementary 𐍈',
    'combining-order a̐̄ ā̐',
    "quotes 'jñāna' and so'ham\n123",
];

for (const source of sources) {
    test(`exact Devanagari metadata round-trip: ${JSON.stringify(source)}`, () => {
        const tagged = toDevanagariFromIast(
            source,
            new IastToDevanagariOptions({ embedExactSourceMetadata: true }),
        );
        assert.equal(hasEmbeddedExactSource(tagged), true);
        assert.equal(toExactIastFromDevanagari(tagged), source);
        assert.equal(recoverEmbeddedExactSource(tagged), source);
    });

    test(`exact Gujarati metadata round-trip: ${JSON.stringify(source)}`, () => {
        const tagged = toGujaratiFromIast(
            source,
            new IastToGujaratiOptions({ embedExactSourceMetadata: true }),
        );
        assert.equal(hasEmbeddedExactSource(tagged), true);
        assert.equal(toExactIastFromGujarati(tagged), source);
    });
}

test('visible-text tampering invalidates metadata', () => {
    const tagged = toDevanagariFromIast(
        'Kṛṣṇa',
        new IastToDevanagariOptions({ embedExactSourceMetadata: true }),
    );
    const visible = stripExactSourceMetadata(tagged);
    const chars = Array.from(tagged);
    chars[0] = 'X';
    assert.equal(visible, 'कृष्ण');
    assert.equal(hasEmbeddedExactSource(chars.join('')), false);
});

test('metadata tampering invalidates metadata', () => {
    const tagged = toGujaratiFromIast(
        'Kṛṣṇa',
        new IastToGujaratiOptions({ embedExactSourceMetadata: true }),
    );
    const chars = Array.from(tagged);
    chars[chars.length - 2] = String.fromCodePoint(chars.at(-2).codePointAt(0) + 1);
    assert.equal(hasEmbeddedExactSource(chars.join('')), false);
});

test('envelope JSON round-trip', () => {
    const result = toLosslessPlainEnglish('Kṛṣṇa ā́tman ḷa');
    const restored = LosslessTransliterationResult.fromJson(
        JSON.parse(JSON.stringify(result.toJson())),
    );
    assert.deepEqual(restored.toJson(), result.toJson());
    assert.equal(restored.restoreOriginal(), 'Kṛṣṇa ā́tman ḷa');
});

test('metadata encoding is byte-for-byte compatible with the Python/Dart format', () => {
    const vector = JSON.parse(
        fs.readFileSync(new URL('./metadata-vector.json', import.meta.url), 'utf8'),
    );
    assert.equal(embedExactSourceMetadata(vector.rendered, vector.source), vector.tagged);
    assert.equal(recoverEmbeddedExactSource(vector.tagged), vector.source);
});
