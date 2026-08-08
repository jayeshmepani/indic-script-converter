#!/usr/bin/env node
/**
 * Comprehensive public-API examples for lipimala (JavaScript / Node.js).
 *
 * Covers envelope APIs, string converters, option permutations, reverse IAST,
 * direct Devanagari ↔ Gujarati, exact metadata recovery, and result envelopes.
 *
 * Run:
 *   node examples/public-api-examples.js
 *   # or from package root after npm install .
 */

import {
    DevanagariRomanizationProfile,
    FinalAPolicy,
    GlottalStopPolicy,
    GujaratiRomanizationProfile,
    IastPlainEnglishOptions,
    IastToDevanagariAmbiguousLPolicy,
    IastToDevanagariDigitPolicy,
    IastToDevanagariOmPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    IastToDevanagariUnknownLatinPolicy,
    IastToGujaratiDigitPolicy,
    IastToGujaratiOmPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    JnaPolicy,
    NyaPolicy,
    PlainEnglishRomanizationProfile,
    ScriptToIastOptions,
    TransliterationResult,
    UnicodeNormalizationForm,
    embedExactSourceMetadata,
    hasEmbeddedExactSource,
    normalizeUnicode,
    recoverEmbeddedExactSource,
    stripExactSourceMetadata,
    tryDecodeExactSourceMetadata,
    isUnicodeCombiningMark,
    isEncodedVedicMark,
    toCanonicalIastFromDevanagari,
    toCanonicalIastFromGujarati,
    toDevanagari,
    toDevanagariFromIast,
    toExactIastFromDevanagari,
    toExactIastFromGujarati,
    toGujarati,
    toGujaratiFromIast,
    toIastFromDevanagari,
    toIastFromGujarati,
    toPlainEnglish,
    toPlainEnglishFromIast,
} from '../src/index.js';

// Direct Deva↔Gujr is a deep import (not on package main exports map).
import {
    IndicScriptConversionOptions,
    IndicScriptDigitPolicy,
    IndicScriptUnknownPolicy,
    hasExactDevanagariSourceMetadata,
    hasExactGujaratiSourceMetadata,
    toCanonicalDevanagariFromGujarati,
    toCanonicalGujaratiFromDevanagari,
    toDevanagariFromGujarati,
    toExactDevanagariFromGujarati,
    toExactGujaratiFromDevanagari,
    toGujaratiFromDevanagari,
    visibleWithoutExactSourceMetadata,
} from '../src/deva-gujr-converter.js';

const IAST = 'Kṛṣṇa ā́tman';
const VEDIC = 'vásōḥ';
const DIGITS = 'Rāma 123';
const PUNCT = 'namaḥ. śivāya.';
const OM = 'oṃ';
const AMBIG_L = 'kḷpta';
const PLAIN = 'jñāna Rāma ñāna';
const DEVA = 'कृष्ण';
const GUJR = 'કૃષ્ણ';

function banner(title) {
    console.log('');
    console.log('='.repeat(72));
    console.log(title);
    console.log('='.repeat(72));
}

function show(label, value) {
    console.log(`  ${label}: ${value}`);
}

function valuesOf(obj) {
    return [...new Set(Object.values(obj))];
}

// ---------------------------------------------------------------------------
// 1. Envelope APIs
// ---------------------------------------------------------------------------
function examplesEnvelope() {
    banner('1. Envelope APIs (TransliterationResult)');

    const de = toDevanagari(IAST);
    const gu = toGujarati(IAST);
    const en = toPlainEnglish(IAST);

    for (const [name, result] of [
        ['toDevanagari', de],
        ['toGujarati', gu],
        ['toPlainEnglish', en],
    ]) {
        console.log(`\n[${name}]`);
        show('rendered', result.rendered);
        show('profile', result.profile);
        show('normalizedInput', result.normalizedInput);
        show('restoreOriginal()', result.restoreOriginal());
        show('renderingIsInjective', result.renderingIsInjective);
        show('hasErrors', result.hasErrors);
        show('issues[0].code', result.issues[0]?.code);
    }

    const jsonText = de.toJsonText();
    const restored = TransliterationResult.fromJsonText(jsonText);
    show('JSON schema', restored.toJson().schema);
    show('fromJsonText restore', restored.restoreOriginal());

    console.log('\n[normalization permutations]');
    for (const inp of valuesOf(UnicodeNormalizationForm)) {
        for (const out of [UnicodeNormalizationForm.NFC, UnicodeNormalizationForm.NFD]) {
            const r = toDevanagari(IAST, {
                inputNormalization: inp,
                outputNormalization: out,
            });
            show(`in=${inp} out=${out}`, r.rendered);
        }
    }
}

// ---------------------------------------------------------------------------
// 2. IAST → Devanagari
// ---------------------------------------------------------------------------
function examplesIastToDeva() {
    banner('2. IAST → Devanagari (string) + option permutations');

    show('default', toDevanagariFromIast(IAST));

    for (const profile of valuesOf(DevanagariRomanizationProfile)) {
        show(
            `profile=${profile}`,
            toDevanagariFromIast(IAST, new IastToDevanagariOptions({ profile })),
        );
    }

    for (const digitPolicy of valuesOf(IastToDevanagariDigitPolicy)) {
        show(
            `digitPolicy=${digitPolicy}`,
            toDevanagariFromIast(DIGITS, new IastToDevanagariOptions({ digitPolicy })),
        );
    }

    for (const punctuationPolicy of valuesOf(IastToDevanagariPunctuationPolicy)) {
        show(
            `punctuationPolicy=${punctuationPolicy}`,
            toDevanagariFromIast(PUNCT, new IastToDevanagariOptions({ punctuationPolicy })),
        );
    }

    for (const omPolicy of valuesOf(IastToDevanagariOmPolicy)) {
        show(
            `omPolicy=${omPolicy}`,
            toDevanagariFromIast(OM, new IastToDevanagariOptions({ omPolicy })),
        );
    }

    for (const ambiguousLPolicy of valuesOf(IastToDevanagariAmbiguousLPolicy)) {
        show(
            `ambiguousLPolicy=${ambiguousLPolicy}`,
            toDevanagariFromIast(AMBIG_L, new IastToDevanagariOptions({ ambiguousLPolicy })),
        );
    }

    for (const unknownLatinPolicy of valuesOf(IastToDevanagariUnknownLatinPolicy)) {
        try {
            show(
                `unknownLatinPolicy=${unknownLatinPolicy}`,
                toDevanagariFromIast('hello', new IastToDevanagariOptions({ unknownLatinPolicy })),
            );
        } catch (err) {
            show(`unknownLatinPolicy=${unknownLatinPolicy}`, `RAISED ${err.name}: ${err.message}`);
        }
    }

    show(
        'acceptAsciiLongVowels=true on aa',
        toDevanagariFromIast('aa', new IastToDevanagariOptions({ acceptAsciiLongVowels: true })),
    );
    show(
        'collapseWhitespace=true',
        toDevanagariFromIast(
            'Kṛṣṇa   ā́tman',
            new IastToDevanagariOptions({ collapseWhitespace: true }),
        ),
    );
    show(
        'preserveVedicAccentMarks=false',
        toDevanagariFromIast(
            VEDIC,
            new IastToDevanagariOptions({ preserveVedicAccentMarks: false }),
        ),
    );

    const tagged = toDevanagariFromIast(
        'Om 12. Rāma',
        new IastToDevanagariOptions({
            profile: DevanagariRomanizationProfile.ISO_15919_CORE,
            digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
            punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
            omPolicy: IastToDevanagariOmPolicy.USE_OM_SIGN,
            acceptAsciiLongVowels: true,
            collapseWhitespace: true,
            embedExactSourceMetadata: true,
        }),
    );
    show('combined options visible', stripExactSourceMetadata(tagged));
    show('has metadata', hasEmbeddedExactSource(tagged));
    show('exact reverse', toExactIastFromDevanagari(tagged));
}

// ---------------------------------------------------------------------------
// 3. IAST → Gujarati
// ---------------------------------------------------------------------------
function examplesIastToGujr() {
    banner('3. IAST → Gujarati (string) + option permutations');

    show('default', toGujaratiFromIast(IAST));

    for (const profile of valuesOf(GujaratiRomanizationProfile)) {
        show(
            `profile=${profile}`,
            toGujaratiFromIast(IAST, new IastToGujaratiOptions({ profile })),
        );
    }

    for (const digitPolicy of valuesOf(IastToGujaratiDigitPolicy)) {
        show(
            `digitPolicy=${digitPolicy}`,
            toGujaratiFromIast(DIGITS, new IastToGujaratiOptions({ digitPolicy })),
        );
    }

    for (const punctuationPolicy of valuesOf(IastToGujaratiPunctuationPolicy)) {
        show(
            `punctuationPolicy=${punctuationPolicy}`,
            toGujaratiFromIast(PUNCT, new IastToGujaratiOptions({ punctuationPolicy })),
        );
    }

    for (const omPolicy of valuesOf(IastToGujaratiOmPolicy)) {
        show(
            `omPolicy=${omPolicy}`,
            toGujaratiFromIast(OM, new IastToGujaratiOptions({ omPolicy })),
        );
    }

    const tagged = toGujaratiFromIast(
        IAST,
        new IastToGujaratiOptions({ embedExactSourceMetadata: true }),
    );
    show('exact reverse from Gujr', toExactIastFromGujarati(tagged));
}

// ---------------------------------------------------------------------------
// 4. Plain English / Hunterian
// ---------------------------------------------------------------------------
function examplesPlainEnglish() {
    banner('4. IAST → plain English / Hunterian');

    show('default', toPlainEnglishFromIast(PLAIN));

    for (const profile of valuesOf(PlainEnglishRomanizationProfile)) {
        show(
            `profile=${profile}`,
            toPlainEnglishFromIast(PLAIN, new IastPlainEnglishOptions({ profile })),
        );
    }

    for (const finalA of valuesOf(FinalAPolicy)) {
        show(
            `finalA=${finalA}`,
            toPlainEnglishFromIast('Rāma', new IastPlainEnglishOptions({ finalA })),
        );
    }

    for (const jna of valuesOf(JnaPolicy)) {
        show(`jna=${jna}`, toPlainEnglishFromIast('jñāna', new IastPlainEnglishOptions({ jna })));
    }

    for (const nya of valuesOf(NyaPolicy)) {
        show(`nya=${nya}`, toPlainEnglishFromIast('ñāna', new IastPlainEnglishOptions({ nya })));
    }

    for (const glottalStop of valuesOf(GlottalStopPolicy)) {
        show(
            `glottalStop=${glottalStop}`,
            toPlainEnglishFromIast('aʔa', new IastPlainEnglishOptions({ glottalStop })),
        );
    }

    show(
        'convertCToCh=false',
        toPlainEnglishFromIast('ca', new IastPlainEnglishOptions({ convertCToCh: false })),
    );
    show(
        'hunterian envelope',
        toPlainEnglish(PLAIN, {
            options: new IastPlainEnglishOptions({
                profile: PlainEnglishRomanizationProfile.HUNTERIAN,
            }),
        }).rendered,
    );
}

// ---------------------------------------------------------------------------
// 5. Reverse
// ---------------------------------------------------------------------------
function examplesReverse() {
    banner('5. Reverse Brahmic → IAST (canonical / smart / exact)');

    show('canonical Deva→IAST', toCanonicalIastFromDevanagari(DEVA));
    show('canonical Gujr→IAST', toCanonicalIastFromGujarati(GUJR));
    show('smart Deva→IAST (no trailer)', toIastFromDevanagari(DEVA));
    show('smart Gujr→IAST (no trailer)', toIastFromGujarati(GUJR));

    const taggedDe = toDevanagariFromIast(
        'Kṛṣṇa',
        new IastToDevanagariOptions({ embedExactSourceMetadata: true }),
    );
    const taggedGu = toGujaratiFromIast(
        'Kṛṣṇa',
        new IastToGujaratiOptions({ embedExactSourceMetadata: true }),
    );
    show('exact Deva→IAST', toExactIastFromDevanagari(taggedDe));
    show('exact Gujr→IAST', toExactIastFromGujarati(taggedGu));
    show('smart with trailer', toIastFromDevanagari(taggedDe));
    show(
        'ScriptToIastOptions preserveUnmapped',
        toCanonicalIastFromDevanagari(
            `${DEVA}!`,
            new ScriptToIastOptions({ preserveUnmapped: true }),
        ),
    );
}

// ---------------------------------------------------------------------------
// 6. Direct script
// ---------------------------------------------------------------------------
function examplesDirectScript() {
    banner('6. Direct Devanagari ↔ Gujarati');

    show('canonical Deva→Gujr', toCanonicalGujaratiFromDevanagari(DEVA));
    show('canonical Gujr→Deva', toCanonicalDevanagariFromGujarati(GUJR));
    show('smart Deva→Gujr', toGujaratiFromDevanagari(DEVA));
    show('smart Gujr→Deva', toDevanagariFromGujarati(GUJR));

    for (const digitPolicy of valuesOf(IndicScriptDigitPolicy)) {
        show(
            `digitPolicy=${digitPolicy} on १२३`,
            toCanonicalGujaratiFromDevanagari(
                '१२३',
                new IndicScriptConversionOptions({ digitPolicy }),
            ),
        );
    }

    for (const unknownPolicy of valuesOf(IndicScriptUnknownPolicy)) {
        try {
            show(
                `unknownPolicy=${unknownPolicy}`,
                toCanonicalGujaratiFromDevanagari(
                    'कृष्ण X',
                    new IndicScriptConversionOptions({ unknownPolicy }),
                ),
            );
        } catch (err) {
            show(`unknownPolicy=${unknownPolicy}`, `RAISED ${err.name}`);
        }
    }

    const tagged = toCanonicalGujaratiFromDevanagari(
        'ऄ ऎ ऍ',
        new IndicScriptConversionOptions({ embedExactSourceMetadata: true }),
    );
    show('exact reverse Gujr→Deva', toExactDevanagariFromGujarati(tagged));

    const tagged2 = toCanonicalDevanagariFromGujarati(
        GUJR,
        new IndicScriptConversionOptions({ embedExactSourceMetadata: true }),
    );
    show('exact reverse Deva→Gujr', toExactGujaratiFromDevanagari(tagged2));
}

// ---------------------------------------------------------------------------
// 7. Metadata helpers
// ---------------------------------------------------------------------------
function examplesMetadata() {
    banner('7. Exact-source metadata helpers & Unicode utilities');

    const rendered = toDevanagariFromIast(IAST);
    const tagged = embedExactSourceMetadata(rendered, IAST);
    show('hasEmbeddedExactSource', hasEmbeddedExactSource(tagged));
    show('recover', recoverEmbeddedExactSource(tagged));
    show('strip', stripExactSourceMetadata(tagged));
    show('visibleWithoutExactSourceMetadata', visibleWithoutExactSourceMetadata(tagged));

    const meta = tryDecodeExactSourceMetadata(tagged);
    if (meta) {
        show('meta.originalSource', meta.originalSource);
        show('meta.visibleText', meta.visibleText);
    }

    const gujrTagged = toCanonicalGujaratiFromDevanagari('ऄ ऎ ऍ', {
        embedExactSourceMetadata: true,
    });
    show('hasExactGujaratiSourceMetadata', hasExactGujaratiSourceMetadata(gujrTagged));
    const devaTagged = toCanonicalDevanagariFromGujarati('અ એ ઍ', {
        embedExactSourceMetadata: true,
    });
    show('hasExactDevanagariSourceMetadata', hasExactDevanagariSourceMetadata(devaTagged));

    show('isUnicodeCombiningMark(\u0301)', isUnicodeCombiningMark('\u0301'));
    show('isEncodedVedicMark(\u0951)', isEncodedVedicMark('\u0951'));
    show('normalize NFC', normalizeUnicode(IAST, UnicodeNormalizationForm.NFC));
    show('normalize NFD', normalizeUnicode(IAST, UnicodeNormalizationForm.NFD));
}

console.log('lipimala — JavaScript public API examples');
examplesEnvelope();
examplesIastToDeva();
examplesIastToGujr();
examplesPlainEnglish();
examplesReverse();
examplesDirectScript();
examplesMetadata();
console.log('');
console.log('Done. All public-API example sections executed.');
