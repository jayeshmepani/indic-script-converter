import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DevanagariRomanizationProfile,
    FinalAPolicy,
    GujaratiRomanizationProfile,
    IastPlainEnglishOptions,
    IastToDevanagariDigitPolicy,
    IastToDevanagariOmPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    IastToGujaratiDigitPolicy,
    IastToGujaratiOmPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    JnaPolicy,
    PlainEnglishRomanizationProfile,
    toDevanagariFromIast,
    toGujaratiFromIast,
    toPlainEnglishFromIast,
} from '../src/index.js';

test('default profiles are extendedIndic', () => {
    assert.equal(
        new IastToDevanagariOptions().profile,
        DevanagariRomanizationProfile.EXTENDED_INDIC,
    );
    assert.equal(new IastToGujaratiOptions().profile, GujaratiRomanizationProfile.EXTENDED_INDIC);
    assert.equal(
        new IastPlainEnglishOptions().profile,
        PlainEnglishRomanizationProfile.EXTENDED_INDIC,
    );
});

test('Devanagari profiles match Dart', () => {
    const samples = ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa'];
    const expected = new Map([
        [DevanagariRomanizationProfile.STRICT_IAST, ['ऋअक', 'ऋहण', 'ऌअ', 'लऋका', 'xअण्ड']],
        [DevanagariRomanizationProfile.ISO_15919_CORE, ['ड़क', 'ढ़ण', 'ळ', 'लड़का', 'ख़ण्ड']],
        [DevanagariRomanizationProfile.EXTENDED_INDIC, ['ड़क', 'ढ़ण', 'ळ', 'लड़का', 'ख़ण्ड']],
    ]);
    for (const [profile, values] of expected) {
        const options = new IastToDevanagariOptions({ profile });
        assert.deepEqual(
            samples.map((s) => toDevanagariFromIast(s, options)),
            values,
        );
    }
});

test('Gujarati profiles match Dart', () => {
    const samples = ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa'];
    const expected = new Map([
        [GujaratiRomanizationProfile.STRICT_IAST, ['ઋઅક', 'ઋહણ', 'ઌઅ', 'લઋકા', 'xઅણ્ડ']],
        [GujaratiRomanizationProfile.ISO_15919_CORE, ['ડ઼ક', 'ઢ઼ણ', 'ળ', 'લડ઼કા', 'ખ઼ણ્ડ']],
        [GujaratiRomanizationProfile.EXTENDED_INDIC, ['ડ઼ક', 'ઢ઼ણ', 'ળ', 'લડ઼કા', 'ખ઼ણ્ડ']],
    ]);
    for (const [profile, values] of expected) {
        const options = new IastToGujaratiOptions({ profile });
        assert.deepEqual(
            samples.map((s) => toGujaratiFromIast(s, options)),
            values,
        );
    }
});

test('digits, danda and OM options', () => {
    assert.equal(
        toDevanagariFromIast(
            '12345',
            new IastToDevanagariOptions({
                digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
            }),
        ),
        '१२३४५',
    );
    assert.equal(
        toGujaratiFromIast(
            '12345',
            new IastToGujaratiOptions({ digitPolicy: IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT }),
        ),
        '૧૨૩૪૫',
    );
    assert.equal(
        toDevanagariFromIast(
            'End. Double end..',
            new IastToDevanagariOptions({
                punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
            }),
        ),
        'एन्द्। दोउब्ले एन्द्।।',
    );
    assert.equal(
        toGujaratiFromIast(
            'End. Double end..',
            new IastToGujaratiOptions({
                punctuationPolicy: IastToGujaratiPunctuationPolicy.INDIC_DANDA,
            }),
        ),
        'એન્દ્। દોઉબ્લે એન્દ્।।',
    );
    assert.equal(
        toDevanagariFromIast(
            'oṃ namaḥ śivāya',
            new IastToDevanagariOptions({ omPolicy: IastToDevanagariOmPolicy.USE_OM_SIGN }),
        ),
        'ॐ नमः शिवाय',
    );
    assert.equal(
        toGujaratiFromIast(
            'oṃ namaḥ śivāya',
            new IastToGujaratiOptions({ omPolicy: IastToGujaratiOmPolicy.USE_OM_SIGN }),
        ),
        'ૐ નમઃ શિવાય',
    );
});

test('plain-English policies and Hunterian samples', () => {
    const keep = new IastPlainEnglishOptions({ finalA: FinalAPolicy.KEEP });
    const drop = new IastPlainEnglishOptions({ finalA: FinalAPolicy.DROP });
    const jna = new IastPlainEnglishOptions({ jna: JnaPolicy.JNA });
    const hunterian = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    });
    const base = ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā'];
    assert.deepEqual(
        base.map((s) => toPlainEnglishFromIast(s, keep)),
        ['Rama', 'vrata', 'Krishna', 'Lakshmana', 'yatra'],
    );
    assert.deepEqual(
        base.map((s) => toPlainEnglishFromIast(s, drop)),
        ['Ram', 'vrat', 'Krishn', 'Lakshman', 'yatra'],
    );
    assert.deepEqual(
        ['jñāna', 'yajña'].map((s) => toPlainEnglishFromIast(s, jna)),
        ['jnan', 'yajn'],
    );
    const samples = [
        'Rāma',
        'Kṛṣṇa',
        'Lakṣmaṇa',
        'laṛkā',
        'Rāmacandra',
        'Gorakhapura',
        'Sarasvatī',
        'Īśvara',
        'pañcāṅga',
        'duḥkha',
        'Devadatta',
        'Jaideva',
        'Kalyāṇapura',
        'Nārāyaṇapura',
        'Hariprasāda',
        'Kṛṣṇadāsa',
    ];
    const expected = [
        'Ram',
        'Krishna',
        'Lakshman',
        'larka',
        'Ramachandra',
        'Gorakhapur',
        'Saraswati',
        'Ishwar',
        'panchang',
        'dukh',
        'Devadatt',
        'Jaidev',
        'Kalyanapur',
        'Narayanapur',
        'Hariprasad',
        'Krishnadas',
    ];
    assert.deepEqual(
        samples.map((s) => toPlainEnglishFromIast(s, hunterian)),
        expected,
    );
});
