import {
    DevanagariRomanizationProfile,
    IastToDevanagariDigitPolicy,
    IastToDevanagariOptions,
    IastToDevanagariPunctuationPolicy,
    IastToDevanagariOmPolicy,
    toDevanagariFromIast,
    transliterationSmokeSamples,
    vedicRoundTripCases,
} from '../../src/index.js';

export function main() {
    console.log('----------------------------------------------------------------');
    console.log(' 1. DEVANAGARI TRANSLITERATOR SAMPLES');
    console.log('----------------------------------------------------------------');

    const defaultOptions = new IastToDevanagariOptions({
        punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    });

    for (const source of transliterationSmokeSamples) {
        console.log(`"${source}" -> "${toDevanagariFromIast(source, defaultOptions)}"`);
    }

    runOptionTests();
    runProfileTests();
    runVedicRoundTripTests();
}

function runOptionTests() {
    console.log('\n[Devanagari Option: Digits Policy (convertToScript)]');
    const digitOptions = new IastToDevanagariOptions({
        digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    });
    const digitSample = '12345';
    console.log(`  "${digitSample}" -> "${toDevanagariFromIast(digitSample, digitOptions)}"`);

    console.log('\n[Devanagari Option: Danda Policy (indicDanda)]');
    const dandaOptions = new IastToDevanagariOptions({
        punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
    });
    const punctuationSample = 'End. Double end..';
    console.log(
        `  "${punctuationSample}" -> "${toDevanagariFromIast(punctuationSample, dandaOptions)}"`,
    );

    console.log('\n[Devanagari Option: OM Policy (useOmSign)]');
    const omOptions = new IastToDevanagariOptions({
        omPolicy: IastToDevanagariOmPolicy.USE_OM_SIGN,
    });
    const omSample = 'oṃ namaḥ śivāya';
    console.log(`  "${omSample}" -> "${toDevanagariFromIast(omSample, omOptions)}"`);
}

function runProfileTests() {
    console.log('\n[Devanagari Profiles: strictIast / iso15919Core / extendedIndic]');
    const strict = new IastToDevanagariOptions({
        profile: DevanagariRomanizationProfile.STRICT_IAST,
    });
    const iso = new IastToDevanagariOptions({
        profile: DevanagariRomanizationProfile.ISO_15919_CORE,
    });
    const extended = new IastToDevanagariOptions({
        profile: DevanagariRomanizationProfile.EXTENDED_INDIC,
    });

    for (const source of ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']) {
        console.log(`  "${source}" (strictIast)    -> "${toDevanagariFromIast(source, strict)}"`);
        console.log(`  "${source}" (iso15919Core) -> "${toDevanagariFromIast(source, iso)}"`);
        console.log(`  "${source}" (extendedIndic)-> "${toDevanagariFromIast(source, extended)}"`);
    }
}

function runVedicRoundTripTests() {
    console.log('\n================================================================');
    console.log(' VEDIC FIXTURES: IAST → Devanagari vs expected Devanagari');
    console.log('================================================================');

    const options = new IastToDevanagariOptions({
        punctuationPolicy: IastToDevanagariPunctuationPolicy.INDIC_DANDA,
        digitPolicy: IastToDevanagariDigitPolicy.CONVERT_TO_SCRIPT,
    });

    let passed = 0;
    let failed = 0;

    for (const [iast, expected, label] of vedicRoundTripCases) {
        const actual = toDevanagariFromIast(iast, options);
        if (actual === expected) {
            passed += 1;
            console.log(`  ✓ ${label}`);
            continue;
        }

        failed += 1;
        console.log(`  ✗ ${label}`);
        console.log(`    DIFF: ${runeDiff(actual, expected)}`);
        console.log(`    GOT: ${actual}`);
        console.log(`    EXP: ${expected}`);
    }

    console.log(
        `\n  Result: ${passed} passed, ${failed} failed out of ${vedicRoundTripCases.length} fixtures.`,
    );

    if (failed > 0) {
        throw new Error(`${failed} Vedic fixture(s) failed.`);
    }
}

function runeDiff(actual, expected) {
    const actualRunes = [...actual].map((c) => c.codePointAt(0));
    const expectedRunes = [...expected].map((c) => c.codePointAt(0));
    const length = Math.max(actualRunes.length, expectedRunes.length);
    const output = [];

    for (let index = 0; index < length; index++) {
        const actualRune = index < actualRunes.length ? actualRunes[index] : null;
        const expectedRune = index < expectedRunes.length ? expectedRunes[index] : null;
        if (actualRune === expectedRune) continue;

        output.push(`[${formatRune(actualRune)}|${formatRune(expectedRune)}@${index}]`);
    }

    return output.join(' ');
}

function formatRune(rune) {
    if (rune === null) return 'END';
    return `U+${rune.toString(16).toUpperCase().padStart(4, '0')}`;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
