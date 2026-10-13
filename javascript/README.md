# lipimala for JavaScript

[![npm version](https://img.shields.io/npm/v/lipimala.svg?style=flat-square)](https://www.npmjs.com/package/lipimala)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

IAST-style transliteration for Devanagari and Gujarati, with canonical reverse conversion, direct script conversion, and Plain-English or Hunterian output.

## Install

```bash
npm install lipimala
```

Requires Node.js 20 or newer and uses ECMAScript modules.

## Use

```js
import {
    toDevanagariFromIast,
    toCanonicalIastFromGujarati,
    toPlainEnglishFromDevanagari,
    toPlainEnglishFromGujarati,
    toCanonicalGujaratiFromDevanagari,
} from 'lipimala';

console.log(toDevanagariFromIast('Kṛṣṇa')); // कृष्ण
console.log(toCanonicalIastFromGujarati('કૃષ્ણ')); // kṛṣṇa
console.log(toPlainEnglishFromDevanagari('कानपुर')); // kaanpur
console.log(toPlainEnglishFromGujarati('આજ મારે')); // aaj maare
console.log(toCanonicalGujaratiFromDevanagari('कृष्ण')); // કૃષ્ણ
```

Use `toHunterianFromDevanagari()` and `toHunterianFromGujarati()` for Hunterian output. Array helpers such as `toDevanagariFromIastList()` convert lists of strings.

## Profiles and options

Forward conversion accepts `strictIast`, `iso15919Core`, or `extendedIndic` profiles. The default is `extendedIndic`. Options control normalization, unknown input, digits, punctuation, Vedic accents, whitespace, and exact-source metadata.

Direct Brahmic transcription accepts `BrahmicPlainEnglishOptions` for language selection, schwa deletion, vowel length, terminal anusvara, Gujarati ʿayn, and other pronunciation choices.

## Preserve the original input

The rendered script may not encode the original Latin spelling, capitalization, or normalization. A result envelope keeps the source beside the rendered value:

```js
import { toDevanagari } from 'lipimala';

const result = toDevanagari('Kṛṣṇa');
console.log(result.rendered); // कृष्ण
console.log(result.restoreOriginal()); // Kṛṣṇa
```

For a standalone string, set `embedExactSourceMetadata: true` in the conversion options and use an exact reverse function such as `toExactIastFromDevanagari()`. Unicode-tag metadata can be removed by systems that sanitize invisible characters.

## License

MIT. See [LICENSE](LICENSE).
