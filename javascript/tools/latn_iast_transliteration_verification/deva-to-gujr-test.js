import { devanagariSmokeSamples } from '../../src/example-deva.js';
import { toCanonicalGujaratiFromDevanagari } from '../../src/deva-gujr-converter.js';

console.log('----------------------------------------------------------------');
console.log(' DEVANAGARI TO GUJARATI SCRIPT CONVERSION');
console.log('----------------------------------------------------------------');

for (const source of devanagariSmokeSamples) {
    const result = toCanonicalGujaratiFromDevanagari(source);
    console.log(`"${source}" -> "${result}"`);
}
