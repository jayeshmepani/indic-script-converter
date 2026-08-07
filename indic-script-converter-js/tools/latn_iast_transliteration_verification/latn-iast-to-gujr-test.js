import {
    GujaratiRomanizationProfile,
    IastToGujaratiDigitPolicy,
    IastToGujaratiOptions,
    IastToGujaratiPunctuationPolicy,
    IastToGujaratiOmPolicy,
    toGujaratiFromIast,
    transliterationSmokeSamples,
} from '../../src/index.js';

export function main() {
    console.log('----------------------------------------------------------------');
    console.log(' 2. GUJARATI TRANSLITERATOR SAMPLES');
    console.log('----------------------------------------------------------------');

    const defaultOptions = new IastToGujaratiOptions({
        punctuationPolicy: IastToGujaratiPunctuationPolicy.INDIC_DANDA,
        digitPolicy: IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT,
    });

    for (const source of transliterationSmokeSamples) {
        console.log(`"${source}" -> "${toGujaratiFromIast(source, defaultOptions)}"`);
    }

    runOptionTests();
    runProfileTests();
}

function runOptionTests() {
    console.log('\n[Gujarati Option: Digits Policy (convertToScript)]');
    const digitOptions = new IastToGujaratiOptions({
        digitPolicy: IastToGujaratiDigitPolicy.CONVERT_TO_SCRIPT,
    });
    const digitSample = '12345';
    console.log(`  "${digitSample}" -> "${toGujaratiFromIast(digitSample, digitOptions)}"`);

    console.log('\n[Gujarati Option: Danda Policy (indicDanda)]');
    const dandaOptions = new IastToGujaratiOptions({
        punctuationPolicy: IastToGujaratiPunctuationPolicy.INDIC_DANDA,
    });
    const punctuationSample = 'End. Double end..';
    console.log(
        `  "${punctuationSample}" -> "${toGujaratiFromIast(punctuationSample, dandaOptions)}"`,
    );

    console.log('\n[Gujarati Option: OM Policy (useOmSign)]');
    const omOptions = new IastToGujaratiOptions({
        omPolicy: IastToGujaratiOmPolicy.USE_OM_SIGN,
    });
    const omSample = 'oṃ namaḥ śivāya';
    console.log(`  "${omSample}" -> "${toGujaratiFromIast(omSample, omOptions)}"`);
}

function runProfileTests() {
    console.log('\n[Gujarati Profiles: strictIast / iso15919Core / extendedIndic]');
    const strict = new IastToGujaratiOptions({
        profile: GujaratiRomanizationProfile.STRICT_IAST,
    });
    const iso = new IastToGujaratiOptions({
        profile: GujaratiRomanizationProfile.ISO_15919_CORE,
    });
    const extended = new IastToGujaratiOptions({
        profile: GujaratiRomanizationProfile.EXTENDED_INDIC,
    });

    for (const source of ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']) {
        console.log(`  "${source}" (strictIast)    -> "${toGujaratiFromIast(source, strict)}"`);
        console.log(`  "${source}" (iso15919Core) -> "${toGujaratiFromIast(source, iso)}"`);
        console.log(`  "${source}" (extendedIndic)-> "${toGujaratiFromIast(source, extended)}"`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
