# Changelog

All notable changes to the **lipimala** monorepo (Dart, JavaScript, Python, PHP) are documented here.  
Package versions are synchronized across runtimes unless noted.

---

## 1.1.0

**lipimala v1.1.0 — Natural Brahmic → Plain-English / Hunterian**

- Added first-class **Devanagari/Gujarati → Plain-English and Hunterian** string APIs in Dart, JavaScript, Python, and PHP, plus bulk/list helpers.
- Added source-aware inherent-schwa tracking so pronunciation rules delete only implicit Brahmic schwas rather than explicit written vowels.
- Added language-aware schwa policies for **Gujarati**, **Hindi/Hindustani**, and a **Sanskrit** no-deletion mode.
- Added readable vowel-length and terminal-anusvara policies for direct Brahmic transcription.
- Prevented Gujarati Hunterian from inheriting Hindi-oriented automatic `v` → `w` behavior.
- Added direct Brahmic result-envelope APIs that retain the exact source while exposing a deliberately lossy readable Latin view.
- Preserved canonical Brahmic → IAST and legacy IAST → Plain-English/Hunterian behavior for backward compatibility.
- Added regression coverage for natural Gujarati/Hindi outputs, including cases such as `નટવર → natvar`, `સમાચાર → samaachaar`, `ધર્મકુમાર → dharmakumaar`, `કાનપુર → kaanpur`, and `सरकार → sarkaar`.

---

## 1.0.2

**lipimala v1.0.2 — Complete bulk transliteration API & 160/160 pub points**

- Added **bulk string list/array transliteration** across all conversion directions, with full options/profile support:
  - Latin/IAST → Devanagari / Gujarati / plain English  
    (`toDevanagariFromIastList`, `toGujaratiFromIastList`, `toPlainEnglishFromIastList`, and snake_case / Dart extension equivalents)
  - Brahmic → Latin/IAST  
    (`toCanonicalIastFromDevanagariList`, `toCanonicalIastFromGujaratiList`, `toIastFromDevanagariList`, `toIastFromGujaratiList`, …)
  - Direct Devanagari ↔ Gujarati  
    (`toCanonicalGujaratiFromDevanagariList`, `toCanonicalDevanagariFromGujaratiList`, exact and smart list variants, …)
  - Envelope results  
    (`toDevanagariList`, `toGujaratiList`, `toPlainEnglishList`, …)
- **Dart / pub.dev:** primary examples (`example/example.dart`, `example/lipimala_example.dart`) and expanded dartdoc for **160/160** pub points; removed obsolete Flutter badge/references.
- **JavaScript:** list converters export path; fixed ES module star-export collision in brahmic reverse module.
- **Python:** standardized runtime docs/targets to **Python 3.12+** (removed legacy 3.8 references).
- Synchronized version **1.0.2** across Dart, JavaScript, Python, PHP manifests, package changelogs, and docs.

---

## 1.0.1

**lipimala v1.0.1 — Module root exports & complete API coverage**

- Re-exported **direct Devanagari ↔ Gujarati** converters, options, and related helpers from each package **root** (no deep-import required for primary script-to-script APIs).
- Disambiguated metadata helper names for IAST-source trailers vs direct script-to-script trailers  
  (e.g. `hasExactDevanagariIastSourceMetadata` vs `hasExactDevanagariSourceMetadata` and runtime equivalents).
- Added exhaustive **public API example** runners for all four runtimes (options, enums, metadata, Unicode helpers).
- Updated HTML API reference and package READMEs.
- Synchronized package version **1.0.1** across all four ecosystems.

---

## 1.0.0

**lipimala v1.0.0 — Initial synchronized multi-runtime release**

- First stable release of feature-parity implementations for **Dart**, **JavaScript/Node.js**, **Python**, and **PHP**.
- Latin/IAST / extended Indic → Devanagari and Gujarati with profiles (`strictIast`, `iso15919Core`, `extendedIndic`).
- Canonical reverse conversion (Devanagari/Gujarati → IAST) and smart/exact recovery modes.
- Direct Devanagari ↔ Gujarati conversion with policies.
- Plain English and Hunterian transcription.
- Exact source recovery via checksummed Unicode Tag trailer; lossless round-trip result envelope.
- NFC/NFD controls, combining-mark and Vedic accent handling.
- Shared verification corpus: **497** cases + **22** Vedic fixtures; CLI-style output generators.
- Standardized package manifests, author metadata, and publish/test GitHub Actions across runtimes.
- Default forward profile: **`extendedIndic`**.

---

## Links

- Releases: https://github.com/jayeshmepani/indic-script-converter/releases  
- PHP package repo (submodule / Packagist source): https://github.com/jayeshmepani/indic-script-converter-php  
- Docs: https://jayeshmepani.github.io/indic-script-converter/
