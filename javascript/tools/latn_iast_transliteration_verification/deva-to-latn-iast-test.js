import { devanagariSmokeSamples, toCanonicalIastFromDevanagari } from '../../src/index.js';

export function main() {
    console.log('----------------------------------------------------------------');
    console.log(' DEVANAGARI TO LATN IAST TRANSLITERATION');
    console.log('----------------------------------------------------------------');
    for (const source of devanagariSmokeSamples) {
        console.log(`"${source}" -> "${toCanonicalIastFromDevanagari(source)}"`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
