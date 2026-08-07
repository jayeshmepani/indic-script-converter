#!/usr/bin/env node
/** Consumer smoke test for lipimala (JavaScript / Node.js). */

import { toDevanagari, toGujarati } from 'lipimala';

const IAST = 'Kṛṣṇa ā́tman';
const EXPECTED_DEVA = 'कृष्ण आ॑त्मन्';

const de = toDevanagari(IAST);
const gu = toGujarati(IAST);

console.log('package: lipimala');
console.log(`input:   ${IAST}`);
console.log(`deva:    ${de.rendered}`);
console.log(`gujr:    ${gu.rendered}`);
console.log(`restore: ${de.restoreOriginal()}`);

if (de.rendered !== EXPECTED_DEVA) {
    throw new Error(`unexpected Devanagari: ${JSON.stringify(de.rendered)}`);
}
if (de.restoreOriginal() !== IAST) {
    throw new Error('exact restore failed');
}

console.log('OK: JavaScript consumer smoke test passed');
