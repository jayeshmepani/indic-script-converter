# lipimala — Indic Script Converter (Dart)

[![pub version](https://img.shields.io/pub/v/lipimala.svg?style=flat-square)](https://pub.dev/packages/lipimala/)
[![pub points](https://img.shields.io/pub/points/lipimala?style=flat-square)](https://pub.dev/packages/lipimala/)
[![likes](https://img.shields.io/pub/likes/lipimala?style=flat-square)](https://pub.dev/packages/lipimala/)
[![dart](https://img.shields.io/badge/dart-3.0%2B-blue.svg?style=flat-square)](https://dart.dev/)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

A high-fidelity Dart library that separates two concepts that cannot honestly be merged into a single Brahmic string:

1. **Exact source exact round-tripness** — Code-point-equivalent recovery of original Latin input, including capitalization, NFC/NFD form, alias choices, punctuation, and combining-mark order.
2. **Rendered transliteration view** — Visual output in Devanagari, Gujarati, Plain English, or Hunterian.

Because rendered Indic scripts cannot natively represent Latin capitalization or lossy alias selections (e.g., distinguishing `Kṛṣṇa` vs `kṛṣṇa` or `x` vs `ḫ`), this package provides **two robust strategies** for exact source recovery:

1. **`TransliterationResult` (Envelope Pattern):** Keeps metadata alongside the rendered view (ideal for JSON APIs and databases).
2. **Unicode Tag Trailer (Embedded Metadata Pattern):** Appends an invisible, checksummed Unicode tag sequence directly into the string output.

---

## Installation

Add the package to your `pubspec.yaml` or run:

```bash
dart pub add lipimala
```

Package link on pub.dev: [pub.dev/packages/lipimala](https://pub.dev/packages/lipimala/)

_This package uses `unorm_dart` for Unicode 17 NFC/NFD normalization and `unicode` for complete Unicode 17 Mn/Mc/Me mark classification._

---

## Bulk String List Transliteration

Convert a list of text values in a single call without manual iteration logic:

```dart
import 'package:lipimala/lipimala.dart';

final items = ['Kṛṣṇa', 'Rāma', 'jñāna'];

// Bulk convert to Devanagari script strings
final devaList = items.toDevanagariFromIast(); 
// -> ['कृष्ण', 'राम', 'ज्ञान']

// Bulk convert to Gujarati script strings
final gujrList = items.toGujaratiFromIast(); 
// -> ['કૃષ્ણ', 'રામ', 'જ્ઞાન']

// Bulk convert to Plain English strings
final plainList = items.toPlainEnglishFromIast(); 
// -> ['Krishna', 'Ram', 'gyan']

// Bulk convert to TransliterationResult envelopes
final envList = items.toDevanagari();
```

---

## Usage & Exact Recovery Modes

### Strategy 1: Envelope Pattern (`TransliterationResult`)

Recommended for database storage, network transport, and clean UI separation.

```dart
import 'dart:convert';
import 'package:lipimala/transliteration_result.dart';

void main() {
  const source = 'Kṛṣṇa ā́tman ḷa';

  // 1. Transliterate to an envelope object
  final result = source.toDevanagari();

  print(result.rendered);        // Output: कृष्ण आ॑त्मन् ऌअ
  print(result.restoreOriginal()); // Output: Kṛṣṇa ā́tman ḷa (Exact match)

  // 2. JSON Serialization
  final jsonString = jsonEncode(result.toJson());
  final restoredResult = TransliterationResult.fromJson(
    Map<String, Object?>.from(jsonDecode(jsonString) as Map),
  );

  assert(restoredResult.restoreOriginal() == source);
}
```

---

### Strategy 2: Embedded Metadata Pattern (In-String Unicode Tags)

Appends a hidden, checksummed Unicode-tag sequence containing original UTF-16 code units directly to the Brahmic string. The visible Brahmic text remains visually unchanged.

```dart
import 'package:lipimala/brahmic_to_latn_iast.dart';
import 'package:lipimala/latn_iast_to_deva.dart';
import 'package:lipimala/latn_iast_to_gujr.dart';

void main() {
  const source = 'Kṛṣṇa / Kr̥ṣṇa / ḫāna';

  // --- Devanagari ---
  final devanagari = source.toDevanagariFromIast(
    options: const IastToDevanagariOptions(
      embedExactSourceMetadata: true,
    ),
  );

  // Exact recovery using the invisible trailer
  final exactFromDevanagari = devanagari.toExactIastFromDevanagari();
  assert(exactFromDevanagari == source);

  // --- Gujarati ---
  final gujarati = source.toGujaratiFromIast(
    options: const IastToGujaratiOptions(
      embedExactSourceMetadata: true,
    ),
  );

  final exactFromGujarati = gujarati.toExactIastFromGujarati();
  assert(exactFromGujarati == source);
}
```

#### Reverse Transliteration APIs

When using embedded metadata, the reverse functions handle recovery gracefully:

| Method                                        | Behavior                                                                               |
| :-------------------------------------------- | :------------------------------------------------------------------------------------- |
| `toExactIastFromDevanagari()`                 | Requires valid embedded metadata; **throws** if absent or corrupted.                   |
| `toIastFromDevanagari()`                      | Prefers embedded metadata if present; falls back to canonical reverse transliteration. |
| `toCanonicalIastFromDevanagari()`             | Always ignores hidden metadata and performs canonical reverse transliteration.         |
| `visibleDevanagariWithoutExactSourceMetadata` | Extension getter that strips hidden metadata trailers, returning clean Brahmic text.   |

> ⚠️ **Transport Warning:** Embedded Unicode Tag characters are `default-ignorable`. Some sanitizers, search indexes, clipboard filters, or legacy databases may strip them. For unconditional persistence, retain the `TransliterationResult` envelope or store original keys in dedicated columns.

---

## Core Guarantees & Engine Features

### 1. Unicode Normalization

Parsing defaults to **NFD** and rendered output defaults to **NFC**. Both are configurable via `UnicodeNormalizationForm`.

### 2. Combining Mark Integrity

The parser recognizes all Unicode 17 combining-mark general categories (`Mn`, `Mc`, and `Me`) beyond standard diacritics (`U+0300–U+036F`). Residual or unmapped combining marks (e.g., combining underline on `a̱`) are retained on rendered outputs rather than silently dropped.

### 3. Extended-Letter Policy (Documented Many-to-One)

Approximated extended Latin mappings are explicitly defined in the
`iso15919Core` and `extendedIndic` profiles. `strictIast` preserves or
diagnoses non-IAST input instead of silently applying these extensions.

| Latin          | Devanagari / Gujarati | Policy                                    |
| :------------- | :-------------------- | :---------------------------------------- |
| `ṡ`            | स / સ                 | Approximates plain `s` (dot consumed)     |
| `ṙ`            | र / ર                 | Approximates plain `r` (dot consumed)     |
| `ḫ`, `k͟h`, `x` | ख़ / ખ઼               | Perso-Arabic aliases (many-to-one)        |
| `ṣ́`            | ष॑ / ષ॑               | Keeps retroflex `ṣ`; acute → Vedic udātta |

### 4. Dotted-Circle Carriers for Orphaned Nasals

Anusvāra and candrabindu marks (`ṃ`, `ṁ`, `m̐`) require a base syllable. When occurring word-initially, renderers introduce a **dotted-circle carrier** (`U+25CC`):

- `ṁaṅgala` → `◌ंअङ्गल` / `◌ંઅઙ્ગલ`
- `m̐tra` → `◌ᳪत्र` / `◌ᳪત્ર`

Post-vocalic forms map normally (`aham̐` → `अहᳪ`). Unsupported nasal extensions (e.g., `ṃ̄`) preserve residual marks on script nasals (`◌ं̄`).

### 5. Vedic Accent Preservation

Encoded Vedic accent ranges are preserved and mapped appropriately:

- `U+0951–U+0952`
- `U+A8E0–U+A8FF`
- `U+1CD0–U+1CFF`

Established Latin accent aliases (e.g., Yajurveda fixtures) map directly to Brahmic Vedic marks. Unmapped marks remain encoded and exact round-trip.

Canonical reverse transliteration renders script-order Vedic marks back into
Latin syllable order: `वः॑` → `váḥ`, `जुष्टं॑` → `juṣṭáṃ`, and `अहᳪ` →
`aham̐`. Script dandas reverse to the ASCII corpus convention (`।` → `|`,
`॥` / `।।` → `||`).

---

## Transliteration Profiles

The default profile for forward Devanagari, Gujarati, and plain transcription
is **`extendedIndic`**. Use `strictIast` explicitly when you want classical
Sanskrit IAST boundaries.

- **`strictIast`**: Strictly limits input processing to classical Sanskrit IAST inventory.
- **`iso15919Core`**: Table-driven ISO-style inventory.
- **`extendedIndic`**: Practical extensions, regional transcriptions, and common input aliases.
- **`hunterian`**: Explicitly lossy display view (Hunterian English rendering). Exact recovery remains available via envelope metadata.

---

## Devanagari ↔ Gujarati Direct Converter

This package includes a direct converter between Devanagari and Gujarati.

### Canonical visible conversion

```dart
import 'package:lipimala/deva_gujr_converter.dart';

void main() {
  print('कृष्ण'.toCanonicalGujaratiFromDevanagari()); // કૃષ્ણ
  print('કૃષ્ણ'.toCanonicalDevanagariFromGujarati()); // कृष्ण
}
```

### Exact exact round-trip round trip

The visible Gujarati and Devanagari repertoires are not one-to-one. Therefore, exact round-trip recovery uses a checksummed Unicode-tag trailer.

```dart
import 'package:lipimala/deva_gujr_converter.dart';

void main() {
  const source = 'ऄ ऎ ऍ ॲ ऒ ऑ ॵ ळ ऴ ग़ ॻ ड़ ॸ ॾ';
  const options = IndicScriptConversionOptions(
    embedExactSourceMetadata: true,
  );

  final taggedGujarati = source.toCanonicalGujaratiFromDevanagari(
    options: options,
  );

  assert(taggedGujarati.toExactDevanagariFromGujarati() == source);
}
```

### Smart exact-or-canonical APIs

These recover a correctly typed exact source trailer if present, and otherwise fall back to canonical visible conversion:

- `toDevanagariFromGujarati()`
- `toGujaratiFromDevanagari()`

Strict exact APIs throw when typed metadata is absent or damaged:

- `toExactDevanagariFromGujarati()`
- `toExactGujaratiFromDevanagari()`

---

## Standards Boundary & Disclaimers

1. **ISO 15919:** ISO 15919 is a normative, licensed publication. This package provides an `iso15919Core` profile based on common table definitions, but does **not** claim complete ISO conformance without independent audit against official ISO documentation.
2. **Hunterian & English Displays:** Renderings like Hunterian or plain English are inherently many-to-one and non-injective. Original source recovery is guaranteed **only** when retaining the envelope or metadata trailer.

---

## Testing & Verification

Run the primary test suite:

```bash
dart pub get
dart test
```

### Direct Script Execution & Corpus Workflows

For direct execution workflows, shared edge-case corpora are maintained under `tools/latn_iast_transliteration_verification/`:

```bash
# Individual script testing
dart tools/latn_iast_transliteration_verification/latn_iast_to_deva_test.dart > latn_iast_to_deva_output.txt
dart tools/latn_iast_transliteration_verification/latn_iast_to_gujr_test.dart > latn_iast_to_gujr_output.txt
dart tools/latn_iast_transliteration_verification/latn_iast_transcription_test.dart > latn_iast_transcription_output.txt
dart tools/latn_iast_transliteration_verification/deva_to_latn_iast_test.dart > deva_to_latn_iast_output.txt
dart tools/latn_iast_transliteration_verification/gujr_to_latn_iast_test.dart > gujr_to_latn_iast_output.txt
dart tools/latn_iast_transliteration_verification/deva_to_gujr_test.dart > deva_to_gujr_output.txt
dart tools/latn_iast_transliteration_verification/gujr_to_deva_test.dart > gujr_to_deva_output.txt

# Combined console suite execution
dart tools/latn_iast_transliteration_verification/latn_iast_to_deva_gujr_transcription_suite_test.dart
```

The five redirected output files are JSON Lines. Each physical line is a
complete JSON object with at least `type`, `source`, and `result`, so embedded
quotes and embedded newlines in samples remain machine-readable. The forward
Deva/Gujr sample streams use the default `extendedIndic` profile so extended
corpus entries render as script instead of mixed Latin passthrough;
strict/ISO/extended behavior is still listed explicitly in the `profile`
records.

The Deva/Gujr reverse runners use canonical IAST because their corpora are
normal visible script strings without embedded source metadata. Exact source
recovery is available for tagged outputs through `toExactIastFromDevanagari()`
and `toExactIastFromGujarati()`.

Before submitting changes or releases, ensure strict formatting and static code checks pass:

```bash
dart format --set-exit-if-changed .
dart analyze
dart test
```
