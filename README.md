# lipimala

[![pub version](https://img.shields.io/pub/v/lipimala.svg?style=flat-square)](https://pub.dev/packages/lipimala/)
[![PyPI version](https://img.shields.io/pypi/v/lipimala.svg?style=flat-square)](https://pypi.org/project/lipimala/)
[![npm version](https://img.shields.io/npm/v/lipimala.svg?style=flat-square)](https://www.npmjs.com/package/lipimala)
[![Packagist version](https://img.shields.io/packagist/v/jayeshmepani/lipimala.svg?style=flat-square)](https://packagist.org/packages/jayeshmepani/lipimala)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

Transliterate between IAST-style Latin, Devanagari, and Gujarati in Dart, JavaScript, Python, and PHP. The library also provides canonical IAST conversion, direct Devanagari–Gujarati conversion, and readable Plain-English or Hunterian output.

## Install

| Language | Install | Runtime |
| --- | --- | --- |
| Dart | `dart pub add lipimala` | Dart 3.0+ |
| JavaScript | `npm install lipimala` | Node.js 20+; ES modules |
| Python | `pip install lipimala` | Python 3.12+ |
| PHP | `composer require jayeshmepani/lipimala` | PHP 8.3+ |

## Quick start

### Dart

```dart
import 'package:lipimala/lipimala.dart';

void main() {
  print('Kṛṣṇa'.toDevanagariFromIast()); // कृष्ण
  print('કૃષ્ણ'.toCanonicalIastFromGujarati()); // kṛṣṇa
  print('कानपुर'.toPlainEnglishFromDevanagari()); // kaanpur
}
```

### JavaScript

```js
import {
  toDevanagariFromIast,
  toCanonicalIastFromGujarati,
  toPlainEnglishFromDevanagari,
} from 'lipimala';

console.log(toDevanagariFromIast('Kṛṣṇa')); // कृष्ण
console.log(toCanonicalIastFromGujarati('કૃષ્ણ')); // kṛṣṇa
console.log(toPlainEnglishFromDevanagari('कानपुर')); // kaanpur
```

### Python

```python
from lipimala import (
    to_devanagari_from_iast,
    to_canonical_iast_from_gujarati,
    to_plain_english_from_devanagari,
)

print(to_devanagari_from_iast('Kṛṣṇa'))  # कृष्ण
print(to_canonical_iast_from_gujarati('કૃષ્ણ'))  # kṛṣṇa
print(to_plain_english_from_devanagari('कानपुर'))  # kaanpur
```

### PHP

```php
<?php

use function Lipimala\toDevanagariFromIast;
use function Lipimala\toCanonicalIastFromGujarati;
use function Lipimala\toPlainEnglishFromDevanagari;

echo toDevanagariFromIast('Kṛṣṇa'); // कृष्ण
echo toCanonicalIastFromGujarati('કૃષ્ણ'); // kṛṣṇa
echo toPlainEnglishFromDevanagari('कानपुर'); // kaanpur
```

## Supported conversions

| Input | Output |
| --- | --- |
| IAST-style and extended Latin | Devanagari or Gujarati |
| Devanagari or Gujarati | Canonical IAST |
| Devanagari or Gujarati | Plain English or Hunterian |
| Devanagari | Gujarati |
| Gujarati | Devanagari |

Forward Latin conversion supports the `strictIast`, `iso15919Core`, and `extendedIndic` profiles. The default is `extendedIndic`. Canonical reverse conversion represents the visible script text; Plain-English and Hunterian are pronunciation-oriented renderings with configurable language and schwa rules.

## Script coverage

The Brahmic converters support Devanagari and Gujarati, including their assigned characters and relevant auxiliary signs in these ranges:

- Devanagari: `U+0900–U+097F`
- Gujarati: `U+0A80–U+0AFF`
- Common Indic Number Forms: `U+A830–U+A839`
- Devanagari Extended: `U+A8E0–U+A8FF`
- Vedic Extensions: assigned characters in `U+1CD0–U+1CFA`
- Devanagari Extended-A: `U+11B00–U+11B0A`
- Formatting controls: ZWJ, ZWNJ, CGJ, and dotted circle

Vowels, consonants, nasal and visarga signs, Gujarati Arabic-transliteration marks, editorial signs, and numeric symbols are handled according to their role. Unknown or unassigned characters follow the selected unknown-character policy.

## Exact source recovery

Visible transliteration may not retain distinctions such as capitalization, input aliases, or Unicode normalization. Use a `TransliterationResult` envelope when source and rendered text should travel together:

```js
import { toDevanagari } from 'lipimala';

const result = toDevanagari('Kṛṣṇa');
console.log(result.rendered);          // कृष्ण
console.log(result.restoreOriginal()); // Kṛṣṇa
```

For a standalone rendered string, enable `embedExactSourceMetadata` and use the corresponding exact reverse function. The invisible Unicode-tag metadata may be removed by systems that sanitize default-ignorable characters; use the envelope when that is a concern.

Canonical reverse functions always derive IAST from visible Brahmic text. Smart reverse functions use valid embedded metadata when present and otherwise return canonical IAST. Exact reverse functions require valid metadata.

## Package documentation

- [Dart](./dart/README.md)
- [JavaScript](./javascript/README.md)
- [Python](./python/README.md)
- [PHP](./php/README.md)

## License

MIT. See [LICENSE](./LICENSE).
