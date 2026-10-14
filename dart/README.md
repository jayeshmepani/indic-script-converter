# lipimala for Dart

[![pub version](https://img.shields.io/pub/v/lipimala.svg?style=flat-square)](https://pub.dev/packages/lipimala)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

IAST-style transliteration for Devanagari and Gujarati, with canonical reverse conversion, direct script conversion, and Plain-English or Hunterian output.

## Install

```bash
dart pub add lipimala
```

Requires Dart 3.0 or newer.

## Use

```dart
import 'package:lipimala/lipimala.dart';

void main() {
  print('Kṛṣṇa'.toDevanagariFromIast()); // कृष्ण
  print('કૃષ્ણ'.toCanonicalIastFromGujarati()); // kṛṣṇa
  print('कानपुर'.toPlainEnglishFromDevanagari()); // kaanpur
  print('આજ મારે'.toPlainEnglishFromGujarati()); // aaj maare
  print('कृष्ण'.toCanonicalGujaratiFromDevanagari()); // કૃષ્ણ
}
```

Use `toHunterianFromDevanagari()` and `toHunterianFromGujarati()` for simplified ASCII Hunterian: one letter per long vowel and no consonant dots. That is the map and signboard spelling, not the 1954 macron form (`jān`). See the [API reference](https://jayeshmepani.github.io/indic-script-converter/#hunterian-form). List extensions such as `toDevanagariFromIast()` also work on `List<String>`.

## Profiles and options

Forward conversion accepts `strictIast`, `iso15919Core`, or `extendedIndic` profiles. The default is `extendedIndic`. Options control normalization, unknown input, digits, punctuation, Vedic accents, whitespace, and exact-source metadata.

Direct Devanagari and Gujarati reading accepts `BrahmicPlainEnglishOptions`. Defaults stay the 1.1 output. `1.2.0` adds an opt-in natural reading. Examples are in the [API reference](https://jayeshmepani.github.io/indic-script-converter/#plain-examples).

## Preserve the original input

The rendered script may not encode the original Latin spelling, capitalization, or normalization. A result envelope keeps the original alongside the rendered value:

```dart
final result = 'Kṛṣṇa'.toDevanagari();
print(result.rendered);          // कृष्ण
print(result.restoreOriginal()); // Kṛṣṇa
```

For a standalone string, set `embedExactSourceMetadata: true` in the conversion options and use an exact reverse method such as `toExactIastFromDevanagari()`. Unicode-tag metadata can be removed by systems that sanitize invisible characters.

## License

MIT. See [LICENSE](LICENSE).
