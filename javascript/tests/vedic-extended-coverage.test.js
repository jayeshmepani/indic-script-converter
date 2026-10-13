import test from 'node:test';
import assert from 'node:assert/strict';
import {
    AynPolicy,
    BrahmicPlainEnglishOptions,
    ScriptToIastOptions,
    UnicodeNormalizationForm,
    toCanonicalIastFromDevanagari,
    toCanonicalIastFromGujarati,
    toDevanagariFromIast,
    toHunterianFromDevanagari,
    toHunterianFromGujarati,
    toPlainEnglishFromDevanagari,
    toPlainEnglishFromGujarati,
    toPlainEnglishFromIast,
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
} from '../src/index.js';

test('precomposed nukta consonants map canonically', () => {
    assert.equal(toCanonicalIastFromDevanagari('ऩ'), 'ṉa');
    assert.equal(toCanonicalIastFromDevanagari('ऱ'), 'ṟa');
    assert.equal(toCanonicalIastFromDevanagari('क़'), 'qa');
    assert.equal(toCanonicalIastFromDevanagari('ख़'), 'xa');
    assert.equal(toCanonicalIastFromDevanagari('ग़'), 'ġa');
    assert.equal(toCanonicalIastFromDevanagari('ज़'), 'za');
    assert.equal(toCanonicalIastFromDevanagari('ड़'), 'ṛa');
    assert.equal(toCanonicalIastFromDevanagari('ढ़'), 'ṛha');
    assert.equal(toCanonicalIastFromDevanagari('फ़'), 'fa');
    assert.equal(toCanonicalIastFromDevanagari('य़'), 'ẏa');
    assert.equal(toCanonicalIastFromDevanagari('च़'), 'ċa');
    assert.equal(toPlainEnglishFromDevanagari('च़'), 'tsa');
    assert.equal(toHunterianFromDevanagari('च़'), 'tsa');
    assert.equal(toDevanagariFromIast('ċa'), 'च़');
});

test('precomposed nuktas work under preserve normalization', () => {
    const options = new ScriptToIastOptions({
        inputNormalization: UnicodeNormalizationForm.PRESERVE,
    });
    assert.equal(toCanonicalIastFromDevanagari('क़', options), 'qa');
    assert.equal(toCanonicalIastFromDevanagari('ड़', options), 'ṛa');
});

test('obsolete accents, abbreviation and spacing signs', () => {
    assert.equal(toCanonicalIastFromDevanagari('ऀ'), '\u0310');
    assert.equal(toCanonicalIastFromDevanagari('॓'), '̀');
    assert.equal(toCanonicalIastFromDevanagari('॔'), '́');
    assert.equal(toCanonicalIastFromDevanagari('ॕ'), 'ē');
    assert.equal(toPlainEnglishFromDevanagari('ऻ'), 'ooe');
    assert.equal(toPlainEnglishFromDevanagari('ॕ'), 'ee');
    assert.equal(toPlainEnglishFromDevanagari('ॴ'), 'ooe');
    assert.equal(toPlainEnglishFromDevanagari('॒॑᳚'), '');
    assert.equal(toCanonicalIastFromDevanagari('कॎ'), 'ke');
    assert.equal(toCanonicalIastFromDevanagari('कॎे'), 'kai');
    assert.equal(toCanonicalIastFromDevanagari('कॎा'), 'ko');
    assert.equal(toCanonicalIastFromDevanagari('कॎो'), 'kau');
    assert.equal(toPlainEnglishFromDevanagari('कॎे'), 'kai');
    assert.equal(toHunterianFromDevanagari('कॎो'), 'kau');
    assert.equal(toCanonicalIastFromDevanagari('॰'), '॰');
    assert.equal(toCanonicalIastFromDevanagari('ॱ'), 'ॱ');
});

test('candrabindu nasalization remains audible in readable output', () => {
    assert.equal(toPlainEnglishFromDevanagari('हाँ'), 'haan');
    assert.equal(toHunterianFromDevanagari('हाँ'), 'han');
    assert.equal(toPlainEnglishFromGujarati('હાઁ'), 'haan');
});

test('dangling Brahmic combining modifiers never leak into readable Latin', () => {
    assert.equal(toPlainEnglishFromDevanagari('़्'), '');
    assert.equal(toPlainEnglishFromGujarati('઼્ૺૻૼ૽૾૿'), '');
});

test('AY vowels are phonemic, not decorations', () => {
    assert.equal(toCanonicalIastFromDevanagari('ꣾ'), 'aĭ');
    assert.equal(toCanonicalIastFromDevanagari('कꣿ'), 'kaĭ');
    assert.equal(toPlainEnglishFromDevanagari('कꣿ'), 'kai');
    assert.equal(toPlainEnglishFromDevanagari('ꣾ'), 'ai');
    assert.equal(toHunterianFromDevanagari('ꣾ'), 'ai');
});

test('sacred signs keep their meaning', () => {
    assert.equal(toCanonicalIastFromDevanagari('ꣽ'), 'oṃ');
    assert.equal(toPlainEnglishFromDevanagari('ꣽ'), 'om');
    assert.equal(toPlainEnglishFromDevanagari('ॐ'), 'om');
    assert.equal(toPlainEnglishFromGujarati('ૐ'), 'om');
    assert.equal(toHunterianFromDevanagari('ॐ'), 'om');
    assert.equal(toCanonicalIastFromDevanagari('a꣼b'), 'a꣼b');
});

test('cantillation is preserved canonically, omitted in Plain unless requested', () => {
    assert.equal(toCanonicalIastFromDevanagari('a꣡'), 'a꣡');
    assert.equal(toPlainEnglishFromGujarati('a꣡'), 'a');
    assert.equal(toHunterianFromGujarati('a꣡'), 'a');

    const preserve = new BrahmicPlainEnglishOptions({ preserveVedicAccentMarks: true });
    assert.equal(toCanonicalIastFromDevanagari('क⃰'), 'ka⃰');
    assert.equal(toPlainEnglishFromDevanagari('क⃰'), 'ka');
    assert.equal(toPlainEnglishFromDevanagari('क⃰', preserve), 'ka⃰');
    assert.equal(toPlainEnglishFromDevanagari('क॑', preserve), 'ká');
});

test('specialized nasalization signs carry nasal pronunciation', () => {
    assert.equal(toCanonicalIastFromDevanagari('ꣲ'), 'ṃꣲ');
    assert.equal(toCanonicalIastFromDevanagari('ꣴ'), 'ṃṃꣴ');
    assert.equal(toCanonicalIastFromDevanagari('ꣷ'), "ṃ'ꣷ");
    assert.equal(toPlainEnglishFromDevanagari('कꣲ'), 'kan');
    assert.equal(toHunterianFromDevanagari('कꣴ'), 'kann');
    assert.ok(!/[ꣲ-ꣷ]/u.test(toPlainEnglishFromDevanagari('कꣲꣴꣷ')));
});

test('editorial signs never join schwa parsing', () => {
    assert.equal(toCanonicalIastFromDevanagari('राम꣸'), 'rāma꣸');
    assert.equal(toPlainEnglishFromDevanagari('राम꣸'), 'raam꣸');
});

test('tone marks preserve canonically, drop in Plain', () => {
    assert.equal(toCanonicalIastFromDevanagari('क᳐'), 'ka᳐');
    assert.equal(toPlainEnglishFromDevanagari('क᳐'), 'ka');
});

test('visarga modifiers keep their segment', () => {
    const canonical = toCanonicalIastFromDevanagari('देवः᳣');
    assert.ok(canonical.includes('ḥ'));
    assert.ok(canonical.includes('᳣'));
    assert.ok(!toPlainEnglishFromDevanagari('देवः᳣').includes('᳣'));
});

test('nasal signs keep their nasal segment', () => {
    assert.equal(toCanonicalIastFromDevanagari('ᳩ'), 'ṃᳩ');
    assert.equal(toCanonicalIastFromDevanagari('ᳺ'), 'ṃᳺ');
});

test('ardhavisarga, jihvamuliya and upadhmaniya are phonological', () => {
    assert.equal(toCanonicalIastFromDevanagari('ᳲ'), 'ḥᳲ');
    assert.equal(toCanonicalIastFromDevanagari('ᳵ'), 'ḫᳵ');
    assert.equal(toCanonicalIastFromDevanagari('ᳶ'), 'fᳶ');
    assert.ok(!toPlainEnglishFromDevanagari('ᳶ').includes('ᳶ'));
});

test('Sindhi implosives and alternate DDDA keep phonemic identity', () => {
    assert.equal(toCanonicalIastFromDevanagari('ॻ'), 'ɠa');
    assert.equal(toCanonicalIastFromDevanagari('ॼ'), 'ʄa');
    assert.equal(toCanonicalIastFromDevanagari('ॾ'), 'ɗa');
    assert.equal(toCanonicalIastFromDevanagari('ॿ'), 'ɓa');
    assert.equal(toCanonicalIastFromDevanagari('𑬊'), 'ɗa');
    assert.equal(toPlainEnglishFromDevanagari('ॻॼॾॿ'), 'gajadab');
    assert.equal(toDevanagariFromIast('ɠa'), 'ॻ');
    assert.equal(toDevanagariFromIast('ʄa'), 'ॼ');
});

test('manuscript signs and fractions are preserved', () => {
    assert.equal(toCanonicalIastFromDevanagari('𑬀'), '𑬀');
    assert.equal(toCanonicalIastFromDevanagari('꠱'), '꠱');
    assert.equal(toCanonicalIastFromDevanagari('राम꠱'), 'rāma꠱');
    assert.equal(toPlainEnglishFromDevanagari('राम꠱'), 'raam꠱');
});

test('ZWJ and ZWNJ are phonetically silent', () => {
    assert.equal(toCanonicalIastFromDevanagari('क‍'), 'ka');
    assert.equal(toCanonicalIastFromDevanagari('क‌'), 'ka');
    assert.equal(toPlainEnglishFromGujarati('ક‍'), 'ka');
});

test('sukun silences consonant schwa but is a non-segmental pause on vowels', () => {
    assert.equal(toCanonicalIastFromGujarati('કૺ'), 'k');
    assert.equal(toPlainEnglishFromGujarati('કૺ'), 'k');
    assert.equal(toHunterianFromGujarati('કૺ'), 'k');
    assert.equal(toCanonicalIastFromGujarati('અૺ'), 'a');
    assert.equal(toPlainEnglishFromGujarati('અૺ'), 'a');
    // Tolerate non-standard placement after a vowel sign without deleting that vowel.
    assert.equal(toCanonicalIastFromGujarati('કુૺ'), 'ku');
    assert.equal(toPlainEnglishFromGujarati('કુૺ'), 'ku');
});

test('shadda geminates the consonant', () => {
    assert.equal(toCanonicalIastFromGujarati('નૻ'), 'nn');
    assert.equal(toPlainEnglishFromGujarati('નૻ'), 'nn');
});

test('maddah elongates the vowel', () => {
    assert.equal(toCanonicalIastFromGujarati('કૼ'), 'kā');
    assert.equal(toPlainEnglishFromGujarati('કૼ'), 'kaa');
    assert.equal(toHunterianFromGujarati('કૼ'), 'ka');
    assert.equal(toCanonicalIastFromGujarati('કુૼ'), 'kū');
    assert.equal(toPlainEnglishFromGujarati('કુૼ'), 'koo');
    assert.equal(toHunterianFromGujarati('કુૼ'), 'ku');
});

test('documented cluster mappings resolve phonetically', () => {
    assert.equal(toCanonicalIastFromGujarati('સ૾'), 'tha');
    assert.equal(toCanonicalIastFromGujarati('ઝ૾'), 'dha');
    assert.equal(toCanonicalIastFromGujarati('ઝ૿'), 'ẓa');
    assert.equal(toCanonicalIastFromGujarati('ક૽'), 'qa');
    assert.equal(toPlainEnglishFromGujarati('સ૾'), 'tha');
    assert.equal(toHunterianFromGujarati('ઝ૿'), 'za');
    assert.equal(toCanonicalIastFromGujarati('ક૽ુ'), 'qu');
    assert.equal(toCanonicalIastFromGujarati('ક૽ૺ'), 'q');
    assert.equal(toCanonicalIastFromGujarati('સ૾ૻ'), 'thth');
});

test('Gujarati ayn has canonical identity and configurable readable output', () => {
    assert.equal(toCanonicalIastFromGujarati('અ૽'), 'ʿa');
    assert.equal(toCanonicalIastFromGujarati('ઇ૽'), 'ʿi');
    assert.equal(toPlainEnglishFromGujarati('અ૽'), "'a");
    assert.equal(
        toPlainEnglishFromGujarati('અ૽', new BrahmicPlainEnglishOptions({ ayn: AynPolicy.DROP })),
        'a',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            'અ૽',
            new BrahmicPlainEnglishOptions({ ayn: AynPolicy.PRESERVE }),
        ),
        'ʿa',
    );
});

test('abbreviation and rupee signs are preserved', () => {
    assert.equal(toCanonicalIastFromGujarati('૰'), '૰');
    assert.equal(toCanonicalIastFromGujarati('૱'), '૱');
});

test('legacy IAST Hunterian behavior stays unchanged', () => {
    const hunterian = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    });
    assert.equal(toPlainEnglishFromIast('Sarasvatī', hunterian), 'Saraswati');
    assert.equal(toHunterianFromGujarati('નટવર'), 'natvar');
});
