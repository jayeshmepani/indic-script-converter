import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    IastToDevanagariOptions,
    IastToDevanagariDigitPolicy,
    IastToDevanagariPunctuationPolicy,
    IastToGujaratiOptions,
    IastToGujaratiDigitPolicy,
    IastToGujaratiPunctuationPolicy,
    toDevanagariFromIast,
    toGujaratiFromIast,
    toPlainEnglishFromIast,
    toCanonicalIastFromDevanagari,
    toCanonicalIastFromGujarati,
} from '../src/index.js';

const oracle = JSON.parse(fs.readFileSync(new URL('./oracle-data.json', import.meta.url), 'utf8'));

function assertCorpus(label, sources, expected, convert) {
    assert.equal(sources.length, expected.length, `${label}: source/expected length`);
    for (let i = 0; i < sources.length; i += 1) {
        const actual = convert(sources[i]);
        assert.equal(
            actual,
            expected[i],
            `${label} mismatch at index ${i}: ${JSON.stringify(sources[i])}`,
        );
    }
}

test('Latin/IAST → Devanagari matches the 497-case Dart oracle', () => {
    const options = new IastToDevanagariOptions({
        punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    });
    assertCorpus('deva', oracle.latin, oracle.expectedDeva, (s) =>
        toDevanagariFromIast(s, options),
    );
});

test('Latin/IAST → Gujarati matches the 497-case Dart oracle', () => {
    const options = new IastToGujaratiOptions({
        punctuationPolicy: IastToGujaratiPunctuationPolicy.INDIC_DANDA,
        digitPolicy: IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT,
    });
    assertCorpus('gujr', oracle.latin, oracle.expectedGujr, (s) => toGujaratiFromIast(s, options));
});

test('Latin/IAST → plain English matches the 497-case Dart oracle', () => {
    assertCorpus('plain', oracle.latin, oracle.expectedPlain, toPlainEnglishFromIast);
});

test('Devanagari → canonical IAST matches the 497-case Dart oracle', () => {
    assertCorpus(
        'deva reverse',
        oracle.devaSource,
        oracle.expectedDevaReverse,
        toCanonicalIastFromDevanagari,
    );
});

test('Gujarati → canonical IAST matches the 497-case Dart oracle', () => {
    assertCorpus(
        'gujr reverse',
        oracle.gujrSource,
        oracle.expectedGujrReverse,
        toCanonicalIastFromGujarati,
    );
});

test('all 22 Vedic Devanagari fixtures match exactly', () => {
    const options = new IastToDevanagariOptions({
        punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    });
    for (const [iast, expected, label] of oracle.vedicRoundTripCases) {
        assert.equal(toDevanagariFromIast(iast, options), expected, label);
    }
});
