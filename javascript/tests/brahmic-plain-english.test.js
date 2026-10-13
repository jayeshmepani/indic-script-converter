import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BrahmicLanguage,
    BrahmicPlainEnglishOptions,
    BrahmicSchwaDeletionPolicy,
    BrahmicVowelLengthPolicy,
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    TerminalAnusvaraPolicy,
    toCanonicalIastFromGujarati,
    toHunterianFromDevanagari,
    toHunterianFromGujarati,
    toHunterianFromGujaratiList,
    toPlainEnglishFromDevanagari,
    toPlainEnglishFromGujarati,
    toPlainEnglishFromGujaratiList,
    toPlainEnglishFromGujaratiResult,
    toHunterianFromGujaratiResult,
    toPlainEnglishFromIast,
} from '../src/index.js';

test('Gujarati direct Plain-English keeps explicit vowels and deletes only appropriate inherent schwas', () => {
    const cases = new Map([
        ['આજ', 'aaj'],
        ['મારે', 'maare'],
        ['ઓરડે', 'orade'],
        ['નટવર', 'natvar'],
        ['સમાચાર', 'samaachaar'],
        ['ધર્મકુમાર', 'dharmakumaar'],
        ['ગુલાબના', 'gulaabnaa'],
        ['હીરની', 'heernee'],
        ['અમૂલ્ય', 'amoolya'],
        ['ધન્ય', 'dhanya'],
        ['રૂમાલ', 'roomaal'],
        ['શું', 'shun'],
        ['ક્યાં', 'kyaan'],
    ]);

    for (const [source, expected] of cases) {
        assert.equal(toPlainEnglishFromGujarati(source), expected, source);
    }
});

test('Gujarati direct Hunterian uses language-aware schwa deletion without Hindi v-to-w leakage', () => {
    const cases = new Map([
        ['નટવર', 'natvar'],
        ['સમાચાર', 'samachar'],
        ['ધર્મકુમાર', 'dharmakumar'],
        ['સર્વે', 'sarve'],
        ['શોભતા', 'shobhta'],
        ['રેશમી', 'reshmi'],
        ['સૂંથણલી', 'sunthanli'],
    ]);

    for (const [source, expected] of cases) {
        assert.equal(toHunterianFromGujarati(source), expected, source);
    }

    assert.equal(toHunterianFromGujarati('સર્વે swan twin'), 'sarve swan twin');
    assert.equal(toHunterianFromGujarati('દુઃખ'), 'dukh');
});

test('direct Brahmic transcription preserves pre-existing Latin spans exactly', () => {
    const latin = 'cat chocolate camera JavaScript café Kṛṣṇa Kr̥ṣṇa John’s ‘quote’';
    assert.equal(toPlainEnglishFromGujarati(`ગુજરાત ${latin}`), `gujaraat ${latin}`);
    assert.equal(toHunterianFromGujarati(`ગુજરાત ${latin}`), `gujarat ${latin}`);
    assert.equal(toPlainEnglishFromDevanagari(`भारत ${latin}`), `bhaarat ${latin}`);
    assert.equal(toHunterianFromDevanagari(`भारत ${latin}`), `bharat ${latin}`);
});

test('Devanagari direct transcription applies Hindi schwa deletion while Sanskrit can opt out', () => {
    assert.equal(toPlainEnglishFromDevanagari('कानपुर'), 'kaanpur');
    assert.equal(toPlainEnglishFromDevanagari('सरकार'), 'sarkaar');
    assert.equal(toPlainEnglishFromDevanagari('अहमद'), 'ahmad');
    assert.equal(toPlainEnglishFromDevanagari('धर्म'), 'dharm');
    assert.equal(toPlainEnglishFromGujarati('ધર્મ'), 'dharm');
    assert.equal(toHunterianFromDevanagari('कानपुर'), 'kanpur');
    assert.equal(toHunterianFromDevanagari('सरकार'), 'sarkar');

    const sanskrit = new BrahmicPlainEnglishOptions({ language: BrahmicLanguage.SANSKRIT });
    assert.equal(toPlainEnglishFromDevanagari('कानपुर', sanskrit), 'kaanapura');
    assert.equal(toPlainEnglishFromDevanagari('धर्म', sanskrit), 'dharma');
});

test('Brahmic direct options control schwa, vowel length and terminal anusvara', () => {
    assert.equal(
        toPlainEnglishFromGujarati(
            'નટવર',
            new BrahmicPlainEnglishOptions({
                schwaDeletion: BrahmicSchwaDeletionPolicy.NONE,
            }),
        ),
        'natavara',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            'આજ',
            new BrahmicPlainEnglishOptions({
                vowelLength: BrahmicVowelLengthPolicy.COLLAPSE,
            }),
        ),
        'aj',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            'શું',
            new BrahmicPlainEnglishOptions({ terminalAnusvara: TerminalAnusvaraPolicy.DROP }),
        ),
        'shu',
    );
});

test('bulk direct APIs are exported', () => {
    assert.deepEqual(toPlainEnglishFromGujaratiList(['આજ', 'નટવર']), ['aaj', 'natvar']);
    assert.deepEqual(toHunterianFromGujaratiList(['સમાચાર', 'સર્વે']), ['samachar', 'sarve']);
});

test('canonical Gujarati reverse and legacy IAST Hunterian behavior stay unchanged', () => {
    assert.equal(toCanonicalIastFromGujarati('સમાચાર'), 'samācāra');
    const hunterian = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    });
    assert.equal(toPlainEnglishFromIast('Sarasvatī', hunterian), 'Saraswati');
    assert.equal(toPlainEnglishFromIast('Rāma', hunterian), 'Ram');
});

test('direct result envelopes retain the exact Brahmic source', () => {
    const plain = toPlainEnglishFromGujaratiResult('આજ મારે');
    assert.equal(plain.original, 'આજ મારે');
    assert.equal(plain.restoreOriginal(), 'આજ મારે');
    assert.equal(plain.rendered, 'aaj maare');
    assert.equal(plain.profile, 'plainEnglish');

    const hunterian = toHunterianFromGujaratiResult('સમાચાર');
    assert.equal(hunterian.restoreOriginal(), 'સમાચાર');
    assert.equal(hunterian.rendered, 'samachar');
    assert.equal(hunterian.profile, 'hunterian');
});
