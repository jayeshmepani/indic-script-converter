# Changelog

## 1.0.2

- Added bulk sequence transliteration functions (`to_devanagari_from_iast_list`, `to_gujarati_from_iast_list`, `to_plain_english_from_iast_list`, `to_canonical_gujarati_from_devanagari_list`, `to_canonical_devanagari_from_gujarati_list`, `to_exact_devanagari_from_gujarati_list`, `to_exact_gujarati_from_devanagari_list`, `to_devanagari_list`, `to_gujarati_list`, `to_plain_english_list`).
- Standardized target Python runtime references to Python 3.12+.

## 1.0.1

- Synchronized package version across all runtimes to 1.0.1.
- Re-exported direct script converters from root module (`from lipimala import ...`).
- Added top-level metadata helpers (`has_exact_gujarati_source_metadata`, `has_exact_devanagari_source_metadata`, `visible_without_exact_source_metadata`).
- Added exhaustive public API example runner exercising all 35 core functions, options, and enums.

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
