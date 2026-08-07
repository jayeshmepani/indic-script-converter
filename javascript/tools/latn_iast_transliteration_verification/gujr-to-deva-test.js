import { gujaratiSmokeSamples } from '../../src/example-gujr.js';
import { toCanonicalDevanagariFromGujarati } from '../../src/deva-gujr-converter.js';

console.log('----------------------------------------------------------------');
console.log(' GUJARATI TO DEVANAGARI SCRIPT CONVERSION');
console.log('----------------------------------------------------------------');

for (const source of gujaratiSmokeSamples) {
    const result = toCanonicalDevanagariFromGujarati(source);
    console.log(`"${source}" -> "${result}"`);
}
