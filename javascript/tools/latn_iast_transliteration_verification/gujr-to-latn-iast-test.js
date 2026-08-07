import { gujaratiSmokeSamples, toCanonicalIastFromGujarati } from '../../src/index.js';

export function main() {
    console.log('----------------------------------------------------------------');
    console.log(' GUJARATI TO LATN IAST TRANSLITERATION');
    console.log('----------------------------------------------------------------');
    for (const source of gujaratiSmokeSamples) {
        console.log(`"${source}" -> "${toCanonicalIastFromGujarati(source)}"`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
