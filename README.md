# lipimala — Indic Script Converter

[![pub version](https://img.shields.io/pub/v/lipimala.svg?style=flat-square)](https://pub.dev/packages/lipimala/)
[![PyPI version](https://img.shields.io/pypi/v/lipimala.svg?style=flat-square)](https://pypi.org/project/lipimala/)
[![npm version](https://img.shields.io/npm/v/lipimala.svg?style=flat-square)](https://www.npmjs.com/package/lipimala)
[![Latest Version on Packagist](https://img.shields.io/packagist/v/jayeshmepani/lipimala.svg?style=flat-square)](https://packagist.org/packages/jayeshmepani/lipimala)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

**lipimala** is a deterministic Indic transliteration suite focused on **exact Unicode source preservation**, canonical script rendering, Vedic-aware conversion, and synchronized behavior across **Dart, JavaScript/Node.js, Python, and PHP**.

It supports Latin/IAST-style input, Devanagari, Gujarati, canonical reverse conversion, direct Devanagari ↔ Gujarati conversion, and Plain-English/Hunterian transcription.

> **Design goal:** do not confuse a canonical reverse transliteration with the exact original source.  
> lipimala keeps those concepts separate and can recover the original source through a structured result envelope or checksummed Unicode-Tag metadata.

---

## Runtimes & registries

| Runtime | Package directory | Registry | Install | Primary import |
| --- | --- | --- | --- | --- |
| Dart 3.4+ | [`dart/`](./dart) | [pub.dev](https://pub.dev/packages/lipimala/) | `dart pub add lipimala` | `import 'package:lipimala/lipimala.dart';` |
| Node.js 20+ / ES2023+ | [`javascript/`](./javascript) | [npm](https://www.npmjs.com/package/lipimala) | `npm install lipimala` | `import { toDevanagari } from 'lipimala';` |
| Python 3.12+ | [`python/`](./python) | [PyPI](https://pypi.org/project/lipimala/) | `pip install lipimala` | `from lipimala import to_devanagari` |
| PHP 8.3+ | [`php/`](./php) | [Packagist](https://packagist.org/packages/jayeshmepani/lipimala) | `composer require jayeshmepani/lipimala` | `use function Lipimala\\toDevanagari;` |

The repository is a **feature-parity monorepo**. Each runtime has its own native implementation, package manifest, tests, examples, and quality tooling.

---

## Why lipimala?

Most transliteration APIs answer one question:

```text
source text → rendered text
```

lipimala also models the distinction between:

```text
canonical rendered representation
            ≠
exact original source identity
```

That matters whenever multiple source spellings or Unicode representations collapse to the same visible Brahmic text.

For example, a Devanagari rendering cannot naturally preserve Latin casing, source alias choice, or whether the caller supplied NFC or NFD. lipimala can retain those distinctions separately and restore the original source later.

### Two exact-recovery strategies

1. **`TransliterationResult` envelope**  
   Keeps the exact source, normalized input, rendered form, profile, normalization settings, diagnostics, and integrity information together.

2. **Checksummed Unicode-Tag trailer**  
   `embedExactSourceMetadata: true` appends an invisible `LIT1:` metadata payload to the rendered string so exact recovery can travel with that string.

> The metadata trailer is intended for controlled Unicode-preserving storage/transport. External systems may strip or sanitize Unicode Tag characters. For durable interchange, the structured result/JSON envelope is the safer choice.

---

## Core capabilities

### Metadata-backed exact source round-trip

lipimala can preserve and recover source-string distinctions that the visible destination script cannot represent, including:

- original case
- NFC vs NFD representation
- precomposed vs decomposed sequences
- accepted alias choice
- combining-mark ordering
- punctuation
- whitespace
- supplementary Unicode characters

This is **exact source recovery**, not a claim that every visible transliteration mapping is inherently bijective.

### Canonical, smart, and exact reverse APIs

Reverse conversion deliberately separates three behaviors:

- **Canonical** — derive canonical Latin from the visible Brahmic text.
- **Smart** — recover embedded exact source when valid metadata is present; otherwise use canonical reverse conversion.
- **Exact** — require valid exact-source metadata and fail when it is unavailable or invalid.

This distinction is available for Brahmic → IAST and for direct Devanagari ↔ Gujarati conversion.

### Direct Devanagari ↔ Gujarati conversion

The direct converter does **not** need to pivot through IAST.

It handles:

- direct script mapping
- nukta combinations
- script digits
- whitespace policy
- unknown-character policy
- Unicode normalization
- Vedic marks
- metadata-backed exact source recovery

Where the visible Gujarati and Devanagari repertoires are many-to-one, canonical conversion remains canonical while exact source identity is preserved separately when requested.

### Vedic-aware Unicode handling

Vedic marks are treated as a first-class requirement rather than discarded during ordinary conversion.

The suite preserves encoded Vedic accent marks and maintains the intended Unicode storage ordering around vowels/mātrās, bindu/visarga, and svara marks.

### Plain English / Hunterian transcription

Plain-English and Hunterian views are intentionally human-readable and may be intrinsically lossy as visible representations.

The result-envelope architecture allows the display form to be lossy while the original source can still remain recoverable.

### Four-runtime parity

Dart, JavaScript, Python, and PHP are maintained against the same behavior and shared verification material.

The current shared verification set contains:

- **497 transliteration cases**
- **22 Vedic fixtures**

Parity is verified against the shared corpus/golden outputs rather than inferred merely because the APIs have similar names.

---

## Supported directions

| Source | Target | Modes |
| --- | --- | --- |
| Latin / IAST / extended Indic | Devanagari | string, envelope, metadata-backed exact |
| Latin / IAST / extended Indic | Gujarati | string, envelope, metadata-backed exact |
| Latin / IAST | Plain English / Hunterian | string, envelope |
| Devanagari | IAST | canonical, smart, exact |
| Gujarati | IAST | canonical, smart, exact |
| Devanagari | Gujarati | canonical, smart, exact |
| Gujarati | Devanagari | canonical, smart, exact |

---

## Romanization profiles

Forward Latin → Brahmic conversion supports profile-scoped behavior.

### `strictIast`

Classical Sanskrit IAST inventory.

Use it when input should be interpreted strictly according to the supported IAST rules.

### `iso15919Core`

The explicitly implemented ISO-15919-style core profile.

Use it when you need the supported ISO-style distinctions beyond strict Sanskrit IAST.

### `extendedIndic`

The practical default profile.

It extends the accepted input inventory with regional/modern Indic and compatibility aliases, including supported nukta-oriented forms.

> The profile names describe the exact behavior implemented by lipimala. `iso15919Core` should not be interpreted as a claim to implement every possible ISO 15919 feature outside the documented table.

---

## Unicode normalization

The APIs expose explicit normalization control:

```text
preserve
nfc
nfd
```

Typical envelope defaults are:

```text
inputNormalization  = nfd
outputNormalization = nfc
```

Normalization used for parsing/rendering is kept conceptually separate from the exact original source stored by the lossless envelope/metadata path.

---

## Forward conversion options

The Devanagari and Gujarati forward converters expose corresponding option sets.

Key options include:

| Option | Purpose |
| --- | --- |
| `profile` | `strictIast`, `iso15919Core`, or `extendedIndic` |
| `unknownLatinPolicy` | preserve/pass through, bracket, or throw |
| `digitPolicy` | preserve ASCII digits or convert to script digits |
| `punctuationPolicy` | preserve punctuation or use Indic danda behavior |
| `omPolicy` | transliterate letters or use the script OM sign |
| `ambiguousLPolicy` | resolve ambiguous `ḷ` behavior |
| `acceptAsciiLongVowels` | accept ASCII long-vowel aliases |
| `acceptPlainSh` | accept plain `sh` compatibility input |
| `acceptPlainXAsKha` | compatibility handling for `x` |
| `acceptWAsVa` | compatibility handling for `w` |
| `preserveVedicAccentMarks` | preserve supported Vedic accents |
| `collapseWhitespace` | collapse whitespace runs |
| `embedExactSourceMetadata` | append exact-source Unicode-Tag metadata |

---

## Direct-script options

`IndicScriptConversionOptions` controls Devanagari ↔ Gujarati conversion.

| Option | Values / behavior |
| --- | --- |
| `inputNormalization` | `preserve`, `nfc`, `nfd` |
| `outputNormalization` | `preserve`, `nfc`, `nfd` |
| `unknownPolicy` | preserve or throw |
| `digitPolicy` | convert to target digits or preserve source digits |
| `collapseWhitespace` | collapse contiguous whitespace |
| `embedExactSourceMetadata` | append typed exact-source metadata |

---

## Quick start

### Dart

```dart
import 'package:lipimala/lipimala.dart';

void main() {
  final result = 'Kṛṣṇa ā́tman'.toDevanagari();

  print(result.rendered);          // कृष्ण आ॑त्मन्
  print(result.restoreOriginal()); // Kṛṣṇa ā́tman
}
```

### JavaScript / Node.js

```javascript
import { toDevanagari } from 'lipimala';

const result = toDevanagari('Kṛṣṇa ā́tman');

console.log(result.rendered);          // कृष्ण आ॑त्मन्
console.log(result.restoreOriginal()); // Kṛṣṇa ā́tman
```

### Python

```python
from lipimala import to_devanagari

result = to_devanagari('Kṛṣṇa ā́tman')

print(result.rendered)           # कृष्ण आ॑त्मन्
print(result.restore_original()) # Kṛṣṇa ā́tman
```

### PHP

```php
<?php

declare(strict_types=1);

use function Lipimala\toDevanagari;

$result = toDevanagari('Kṛṣṇa ā́tman');

echo $result->rendered, PHP_EOL;          // कृष्ण आ॑त्मन्
echo $result->restoreOriginal(), PHP_EOL; // Kṛṣṇa ā́tman
```

---

## Exact-source string workflow

When you need a single rendered string that can later recover its exact source, enable embedded metadata.

Conceptually:

```text
Kṛṣṇa
   ↓
कृष्ण + invisible checksummed Unicode-Tag metadata
   ↓
Kṛṣṇa
```

The visible text remains ordinary script text; the exact-source payload is non-rendering metadata.

Use the corresponding **exact** reverse API when exact provenance is mandatory, or the **smart** API when canonical fallback is acceptable.

---

## `TransliterationResult`

The structured envelope carries conversion state explicitly.

Its cross-runtime model includes fields/concepts equivalent to:

```text
original
normalizedInput
rendered
profile
inputNormalization
outputNormalization
renderingIsInjective
issues
originalCodePoints
```

and operations equivalent to:

```text
restoreOriginal()
hasErrors
toJson()
fromJson()
toJsonText()
fromJsonText()
```

The envelope makes it possible for a rendered view to be intentionally non-injective while the original source remains independently recoverable.

---

## Public API examples & technical documentation

Comprehensive examples exercise the public APIs and option permutations.

| Runtime | Example | Run |
| --- | --- | --- |
| Dart | [`dart/example/public_api_examples.dart`](./dart/example/public_api_examples.dart) | `cd dart && dart run example/public_api_examples.dart` |
| JavaScript | [`javascript/examples/public-api-examples.js`](./javascript/examples/public-api-examples.js) | `node javascript/examples/public-api-examples.js` |
| Python | [`python/examples/public_api_examples.py`](./python/examples/public_api_examples.py) | `PYTHONPATH=python python3 python/examples/public_api_examples.py` |
| PHP | [`php/examples/public_api_examples.php`](./php/examples/public_api_examples.php) | `php php/examples/public_api_examples.php` |

For the full API surface, reverse modes, metadata helpers, result structures, enums, and runtime-specific naming, see the project's API reference/documentation.

---

## Monorepo structure

```text
lipimala/
├── dart/
├── javascript/
├── python/
├── php/
├── shared/
│   └── verification-output/
├── README.md
├── CHANGELOG.md
└── LICENSE
```

Each runtime directory is independently packageable and contains its own implementation, examples, tests, and quality configuration.

The PHP package may also be synchronized to a PHP-only distribution mirror for Packagist while this monorepo remains the canonical source.

---

## Development & parity testing

Each implementation has its own quality command:

```text
Dart        cd dart       && make quality
JavaScript  cd javascript && npm run quality
Python      cd python     && make quality
PHP         cd php        && composer quality
```

The runtime suites validate behavior against the shared verification corpus and golden outputs.

When changing conversion behavior, update and verify **all four runtimes** so that a conversion performed by one implementation remains behaviorally aligned with the others.

---

## Project scope

lipimala deliberately prioritizes **fidelity over script count**.

It is designed for applications that care about:

- deterministic transliteration
- scholarly/structured Latin input
- exact source provenance
- Unicode normalization behavior
- Gujarati and Devanagari fidelity
- Vedic text handling
- cross-runtime reproducibility
- archival or round-trip workflows

It is **not** intended to compete with broad transliteration engines on total script or romanization-scheme count.

---

## Exactness terminology

In this project:

- **Canonical round-trip** means deriving the canonical source representation from visible script text.
- **Exact source round-trip** means recovering the original source string through preserved provenance.
- **Lossless envelope** means the structured result retains enough information to restore the original source independently of whether the rendered target is injective.
- **Integrity checked** means metadata/envelope consistency is validated before exact recovery; it does **not** mean cryptographic authentication.

---

## License

This project is licensed under the [MIT License](./LICENSE).