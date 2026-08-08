# Changelog

## 1.0.2

- Added bulk list transliteration extensions and top-level functions (`toDevanagariFromIastList`, `toGujaratiFromIastList`, `toPlainEnglishFromIastList`, `toCanonicalGujaratiFromDevanagariList`, `toCanonicalDevanagariFromGujaratiList`, `toExactDevanagariFromGujaratiList`, `toExactGujaratiFromDevanagariList`, `toDevanagariList`, `toGujaratiList`, `toPlainEnglishList`).
- Added primary package example `example/example.dart` and complete dartdoc comments to achieve 160/160 pub points score on pub.dev.
- Cleaned up obsolete Flutter references in package documentation and badges.

## 1.0.1

- Re-exported all public converters, models, options, and utilities from primary barrel file `package:lipimala/lipimala.dart`.
- Added comprehensive HTML API documentation and usage examples.

## 1.0.0

- Added canonical Devanagari/Gujarati script-to-script conversion options and policies.
- Preserved Vedic mark reattachment on canonical script transliterations.
- Standardized package manifests, author details, and release actions across all runtimes.
- Added the complete Node.js 20+/ES2023 port.
- Preserved `extendedIndic` as the default profile.
- Ported Devanagari and Gujarati forward conversion mappings and policies.
- Ported plain-English and Hunterian transcription policies.
- Ported canonical Devanagari/Gujarati reverse conversion.
- Ported Vedic accent handling and accent reattachment.
- Ported Unicode normalization controls.
- Ported the exact round-trip result envelope and JSON schema.
- Ported the invisible exact-source Unicode Tag trailer byte-for-byte.
- Added all 497 index-aligned corpus cases in five conversion directions.
- Added all 22 Vedic fixtures.
- Added five CLI-compatible output generators.
- Added Node built-in test-runner coverage with no runtime dependencies.
