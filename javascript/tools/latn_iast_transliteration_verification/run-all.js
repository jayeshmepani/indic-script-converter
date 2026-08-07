import { main as deva } from './latn-iast-to-deva-test.js';
import { main as gujr } from './latn-iast-to-gujr-test.js';
import { main as english } from './latn-iast-transcription-test.js';
import { main as devaReverse } from './deva-to-latn-iast-test.js';
import { main as gujrReverse } from './gujr-to-latn-iast-test.js';

console.log('================================================================');
console.log('       IAST SCRIPT TRANSLITERATORS UNIFIED JAVASCRIPT SUITE      ');
console.log('================================================================\n');
deva();
console.log('');
gujr();
console.log('');
english();
console.log('');
devaReverse();
console.log('');
gujrReverse();
