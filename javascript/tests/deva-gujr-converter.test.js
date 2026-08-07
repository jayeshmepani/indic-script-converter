import assert from 'node:assert/strict';
import test from 'node:test';

import { devanagariSmokeSamples } from '../src/example-deva.js';
import { gujaratiSmokeSamples } from '../src/example-gujr.js';
import {
    IndicScriptConversionOptions,
    toCanonicalDevanagariFromGujarati,
    toCanonicalGujaratiFromDevanagari,
    toDevanagariFromGujarati,
    toExactDevanagariFromGujarati,
    toExactGujaratiFromDevanagari,
    toGujaratiFromDevanagari,
} from '../src/deva-gujr-converter.js';
import { IastToGujaratiOptions, toGujaratiFromIast } from '../src/latn-iast-to-gujr.js';

test('core canonical script conversion', () => {
    assert.equal(toCanonicalGujaratiFromDevanagari('कृष्ण'), 'કૃષ્ણ');
    assert.equal(toCanonicalDevanagariFromGujarati('કૃષ્ણ'), 'कृष्ण');
    assert.equal(toCanonicalGujaratiFromDevanagari('१२३'), '૧૨૩');
    assert.equal(toCanonicalDevanagariFromGujarati('૧૨૩'), '१२३');
    assert.equal(toCanonicalGujaratiFromDevanagari('वसोः॑'), 'વસોઃ॑');
    assert.equal(toCanonicalDevanagariFromGujarati('વસોઃ॑'), 'वसोः॑');
});

test('nukta and extended mappings are consumed as whole tokens', () => {
    assert.equal(toCanonicalGujaratiFromDevanagari('क़ ख़ ग़ ज़ फ़'), 'ક઼ ખ઼ ગ઼ જ઼ ફ઼');
    assert.equal(toCanonicalDevanagariFromGujarati('ક઼ ખ઼ ગ઼ જ઼ ફ઼'), 'क़ ख़ ग़ ज़ फ़');
    assert.equal(toCanonicalGujaratiFromDevanagari('ॿक्ति'), 'બ઼ક્તિ');
    assert.equal(toCanonicalDevanagariFromGujarati('બ઼ક્તિ'), 'ॿक्ति');
    assert.equal(toCanonicalGujaratiFromDevanagari('ॹ'), 'ૹ');
    assert.equal(toCanonicalDevanagariFromGujarati('ૹ'), 'ॹ');
});

test('exact metadata round trips every Devanagari corpus item', () => {
    const options = new IndicScriptConversionOptions({
        embedExactSourceMetadata: true,
    });
    for (const source of devanagariSmokeSamples) {
        const taggedGujarati = toCanonicalGujaratiFromDevanagari(source, options);
        assert.equal(toExactDevanagariFromGujarati(taggedGujarati), source);
        assert.equal(toDevanagariFromGujarati(taggedGujarati), source);
    }
});

test('exact metadata round trips every Gujarati corpus item', () => {
    const options = new IndicScriptConversionOptions({
        embedExactSourceMetadata: true,
    });
    for (const source of gujaratiSmokeSamples) {
        const taggedDevanagari = toCanonicalDevanagariFromGujarati(source, options);
        assert.equal(toExactGujaratiFromDevanagari(taggedDevanagari), source);
        assert.equal(toGujaratiFromDevanagari(taggedDevanagari), source);
    }
});

test('visible-script tampering invalidates exact recovery', () => {
    const options = new IndicScriptConversionOptions({
        embedExactSourceMetadata: true,
    });
    const tagged = toCanonicalGujaratiFromDevanagari('कृष्ण', options);
    const tampered = tagged.replace('કૃષ્ણ', 'રામ');
    assert.throws(() => toExactDevanagariFromGujarati(tampered), TypeError);
});

test('typed metadata rejects unrelated Latin-source trailers', () => {
    const taggedFromLatin = toGujaratiFromIast(
        'Kṛṣṇa',
        new IastToGujaratiOptions({ embedExactSourceMetadata: true }),
    );
    assert.throws(() => toExactDevanagariFromGujarati(taggedFromLatin), TypeError);
});
