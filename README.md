# lipimala — Indic Script Converter

[![pub version](https://img.shields.io/pub/v/lipimala.svg?style=flat-square)](https://pub.dev/packages/lipimala/)
[![PyPI version](https://img.shields.io/pypi/v/lipimala.svg?style=flat-square)](https://pypi.org/project/lipimala/)
[![npm version](https://img.shields.io/npm/v/lipimala.svg?style=flat-square)](https://www.npmjs.com/package/lipimala)
[![Latest Version on Packagist](https://img.shields.io/packagist/v/jayeshmepani/lipimala.svg?style=flat-square)](https://packagist.org/packages/jayeshmepani/lipimala)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

A premium, exact round-trip transliteration suite for Indian scripts (`lipimala`). It provides bit-exact, true round-trip conversion between Latin (IAST/ISO-15919), Devanagari, Gujarati, and plain English transcription while preserving Vedic accents and formatting across **four different programming language runtimes**.

This repository is structured as a **monorepo** containing independent, feature-parity implementations for Dart, JavaScript, Python, and PHP.

---

## Runtimes & Registries

| Package Directory | Target Registry | Package Link | Primary Import |
| ----------------- | --------------- | ------------ | -------------- |
| [`dart/`](./dart) | [pub.dev](https://pub.dev/packages/lipimala/) | [`pub.dev/packages/lipimala`](https://pub.dev/packages/lipimala/) | `import 'package:lipimala/lipimala.dart';` |
| [`javascript/`](./javascript) | [npm](https://www.npmjs.com/package/lipimala) | [`npmjs.com/package/lipimala`](https://www.npmjs.com/package/lipimala) | `import { ... } from 'lipimala';` |
| [`python/`](./python) | [PyPI](https://pypi.org/project/lipimala/) | [`pypi.org/project/lipimala`](https://pypi.org/project/lipimala/) | `from lipimala import ...` |
| [`php/`](./php) | [Packagist](https://packagist.org/packages/jayeshmepani/lipimala) | [`packagist.org/packages/jayeshmepani/lipimala`](https://packagist.org/packages/jayeshmepani/lipimala) | `use Lipimala\...;` |

---

## Core Features

- **True Exact Round-Trip Exact Round-Trip Transliteration**: Encodes non-rendering formatting, casing anomalies, and trailing characters into invisible Unicode Tag-based metadata envelopes. Enables exact restoration of the original source string.
- **Vedic Accents Preservation**: Keeps Vedic accents (svara marks like udatta, anudatta, and dirgha svarita) intact, correctly mapping and reattaching them during script-to-script conversions.
- **Direct Script-to-Script Conversion**: Enables high-fidelity Devanagari $\leftrightarrow$ Gujarati conversion, preserving nukta combinations and spacing constraints.
- **Unbound Support Constraints**: Optimized package manifests with no upper bound version constraints, supporting future runtime environments.
- **100% Behavioral Parity**: Enforced via a shared test database and identical golden outputs in [`shared/verification-output/`](./shared/verification-output).

---

## API Configuration & Options

Across all four runtimes, the core transliteration methods support options to fine-tune conversion behavior:

### 1. Romanization Profiles (`RomanizationProfile`)
- **`strictIast`**: Strictly follows academic Sanskrit IAST transliteration (e.g. mapping `ḷ` to Vocalic L (ऌ)).
- **`iso15919Core`**: Standard ISO 15919 rules (e.g. mapping `ḷ` to Retroflex Lateral Flap (ळ / ળ)).
- **`extendedIndic`**: Standard ISO 15919 rules with modern extended Nukta characters (e.g. `q`, `z`, `f`).

### 2. Script-to-Script Options (`IndicScriptConversionOptions`)
- **`inputNormalization` / `outputNormalization`**: Options to set normalization behavior (`preserve`, `nfc`, `nfd`).
- **`unknownPolicy`**: Defines how to handle unrecognized characters (`preserve` / literal keep or `throwError`).
- **`digitPolicy`**: Controls numeric translation (`convertToTarget` script or `preserveSource` digits).
- **`collapseWhitespace`**: Collapses contiguous whitespaces down to a single space.
- **`embedExactSourceMetadata`**: When enabled, serializes the original source text into invisible trailer bytes appended to the output string.

---

## Quick Start Examples

### Dart
```dart
import 'package:lipimala/transliteration_result.dart';

void main() {
  const iast = 'Kṛṣṇa ā́tman';
  final result = iast.toDevanagari();
  print(result.rendered); // Output: कृष्ण आ॑त्मन्
  print(result.restoreOriginal()); // Output: Kṛṣṇa ā́tman
}
```

### JavaScript
```javascript
import { IndicTransliteration } from 'lipimala';

const iast = 'Kṛṣṇa ā́tman';
const result = IndicTransliteration.toDevanagari(iast);
console.log(result.rendered); // Output: कृष्ण आ॑त्मन्
console.log(result.restoreOriginal()); // Output: Kṛṣṇa ā́tman
```

### Python
```python
from lipimala import to_devanagari

iast = 'Kṛṣṇa ā́tman'
result = to_devanagari(iast)
print(result.rendered) # Output: कृष्ण आ॑त्मन्
print(result.restore_original()) # Output: Kṛṣṇa ā́tman
```

### PHP
```php
use function Lipimala\toDevanagari;

$iast = 'Kṛṣṇa ā́tman';
$result = toDevanagari($iast);
echo $result->rendered; // Output: कृष्ण आ॑त्मन्
echo $result->restoreOriginal(); // Output: Kṛṣṇa ā́tman
```

---

## Bulk String List / Array Transliteration

Convert a list or array of text values in a single call without manual iteration logic:

```dart
// Dart
final list = ['Kṛṣṇa', 'Rāma', 'jñāna'].toDevanagariFromIast();
// -> ['कृष्ण', 'राम', 'ज्ञान']
```

```javascript
// JavaScript
import { toDevanagariFromIastList } from 'lipimala';
const list = toDevanagariFromIastList(['Kṛṣṇa', 'Rāma', 'jñāna']);
// -> ['कृष्ण', 'राम', 'ज्ञान']
```

```python
# Python
from lipimala import to_devanagari_from_iast_list
items = to_devanagari_from_iast_list(['Kṛṣṇa', 'Rāma', 'jñāna'])
# -> ['कृष्ण', 'राम', 'ज्ञान']
```

```php
// PHP
use function Lipimala\toDevanagariFromIastList;
$items = toDevanagariFromIastList(['Kṛṣṇa', 'Rāma', 'jñāna']);
// -> ['कृष्ण', 'राम', 'ज्ञान']
```

---

## Public API examples & technical docs

Comprehensive examples exercise **all public user-facing APIs** with option permutations (profiles, digits, punctuation, OM, reverse modes, Deva↔Gujr, metadata):

| Language | Example file | Run |
| -------- | ------------ | --- |
| Dart | [`dart/example/public_api_examples.dart`](./dart/example/public_api_examples.dart) | `cd dart && dart run example/public_api_examples.dart` |
| JavaScript | [`javascript/examples/public-api-examples.js`](./javascript/examples/public-api-examples.js) | `node javascript/examples/public-api-examples.js` |
| Python | [`python/examples/public_api_examples.py`](./python/examples/public_api_examples.py) | `PYTHONPATH=python python3 python/examples/public_api_examples.py` |
| PHP | [`php/examples/public_api_examples.php`](./php/examples/public_api_examples.php) | `php php/examples/public_api_examples.php` |


## Development & Parity Testing

For developers contributing to the transliteration engine, each language folder contains its own self-contained test suite and quality tooling:

- **Dart**: Run `make quality` in `dart/`
- **JavaScript**: Run `npm run quality` in `javascript/`
- **Python**: Run `make quality` in `python/`
- **PHP**: Run `composer quality` in `php/`

All four suites validate behavior against the identical test corpus.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
