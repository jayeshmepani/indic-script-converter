import {
    FinalAPolicy,
    IastPlainEnglishOptions,
    JnaPolicy,
    PlainEnglishRomanizationProfile,
    toPlainEnglishFromIast,
    transliterationSmokeSamples,
} from '../../src/index.js';

export function main() {
    console.log('----------------------------------------------------------------');
    console.log(' 3. PLAIN ENGLISH TRANSLITERATOR SAMPLES (DEFAULT OPTIONS)');
    console.log('----------------------------------------------------------------');

    for (const source of transliterationSmokeSamples) {
        console.log(`"${source}" -> "${toPlainEnglishFromIast(source)}"`);
    }

    runPolicyTests();
    runProfileTests();
}

function runPolicyTests() {
    console.log('\n[Plain English Option: Keep Final "a" (scholarly)]');
    const keepA = new IastPlainEnglishOptions({ finalA: FinalAPolicy.KEEP });
    for (const source of ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']) {
        console.log(`  "${source}" -> "${toPlainEnglishFromIast(source, keepA)}"`);
    }

    console.log('\n[Plain English Option: Always Drop Final "a" (Hindi-style)]');
    const dropA = new IastPlainEnglishOptions({ finalA: FinalAPolicy.DROP });
    for (const source of ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']) {
        console.log(`  "${source}" -> "${toPlainEnglishFromIast(source, dropA)}"`);
    }

    console.log('\n[Plain English Option: jñ as "jna"]');
    const jna = new IastPlainEnglishOptions({ jna: JnaPolicy.JNA });
    for (const source of ['jñāna', 'yajña']) {
        console.log(`  "${source}" -> "${toPlainEnglishFromIast(source, jna)}"`);
    }
}

function runProfileTests() {
    console.log('\n[Plain English Profile: extendedIndic]');
    const extended = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.EXTENDED_INDIC,
    });
    for (const source of ['xaṇḍa', 'xaiva', 'qaum']) {
        console.log(`  "${source}" -> "${toPlainEnglishFromIast(source, extended)}"`);
    }

    console.log('\n[Plain English Profile: Hunterian (explicitly lossy view)]');
    const hunterian = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    });
    for (const source of [
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
    ]) {
        console.log(`  "${source}" -> "${toPlainEnglishFromIast(source, hunterian)}"`);
    }

    console.log('\n[Plain English Profile: strictIast blocks Hunterian-only rules]');
    const strict = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.STRICT_IAST,
    });
    for (const source of ['Sarasvatī', 'Rāmacandra', 'duḥkha']) {
        console.log(`  "${source}" -> "${toPlainEnglishFromIast(source, strict)}"`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
