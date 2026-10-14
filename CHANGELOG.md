# Changelog

All notable changes to the **lipimala** monorepo (Dart, JavaScript, Python, PHP) are documented here.  
Package versions are synchronized across runtimes unless noted.

---

## 1.2.0

**lipimala v1.2.0 — natural Brahmic readable Latin**

1.1.0 made Brahmic → readable Latin technically correct and Unicode-aware. 1.2.0 makes that readable Latin linguistically natural. The new layer is opt-in, so an existing 1.1 call keeps its previous output.

- Added `BrahmicReadableStyle` for the currently supported Devanagari and Gujarati scripts. `LEGACY` remains the default. `NATURAL` opts into the morphology and phonology layer.
- Added `BrahmicVowelLengthPolicy::SMART` beside `COLLAPSE` and `DOUBLE`. `SMART` is syllable spelling for modern Gujarati and Hindi. Closed one-syllable words keep length (`aaj`, `chaar`, `maas`, `naam`, `hoon`, `swaroop`). Open particles and heavy clusters shorten (`ka`, `marg`, `dharan`, `karine`, `ekadashi`). An open ending keeps length the stem already earned (`swaroopama`, `paasethi`, `shwetdweepthi`). A nasal coda keeps a peripheral vowel (`hoonga`). Sanskrit SMART stays conservative because vowel length is phonemic (`shvetadveepa`, `svaroopa`).
- Separated script parsing, language naturalization (`AUTO`, `HINDI`, `GUJARATI`, `SANSKRIT`), vowel rendering, Plain/Hunterian folding, and presentation. A Devanagari string can use Gujarati pronunciation, so `ऋतु` is `ritu` in Hindi and `rutu` in Gujarati.
- Expanded natural medial schwa contraction and Gujarati ending patterns, including `જેટલાં → jetla`, `બ્રહ્માંડમાં → brahmandma`, `વિષ્ણુપુરમાંથી → vishnupurmathi`, `સતયુગ → satyug`, and `શુકલપક્ષ → shuklapaksh`.
- Added contextual `sv` / `śv` / `ṣv` / `dv` cluster spelling (`shwetdweep`, `swaroop`) while leaving `manvantar`, `vasant`, and `ravivar` unchanged.
- Natural schwa between `p` and unaspirated `t` stays, so Hindi `राष्ट्रपति` is `rashtrapati`. Aspirated `થ` / `थ` still contracts (`શાપથી` → `shaapthi`). Legacy `गांधीनगर` stays `gaandheengar`; natural Hindi is `gandhinagar`.
- Added optional presentation controls: `capitalizeSentenceStarts` and exact `readableWordOverrides`. Proper-name capitalization is supplied by the caller.
- Plain-English defaults to doubled vowel length. Hunterian defaults to collapsed length when vowel length is omitted, so the same legacy Gujarati text is `brahmaand` in Plain and `brahmand` in Hunterian. With `NATURAL` + `SMART` on both calls, Gujarati Plain and Hunterian match. Gujarati, and modern `NATURAL` Hindi, do not apply Hunterian's blanket consonant-plus-`v` → `w` rule.
- Named the Hunterian profile as simplified ASCII Hunterian, the map and signboard spelling. A long vowel is one letter (`जान` → `jan`) and consonant dots are removed. The 1954 macron form (`jān`) and the 19th-century acute accent (`ján`) are not emitted. Canonical IAST remains the precise spelling.
- Canonical Brahmic → IAST, exact-source recovery, direct Devanagari ↔ Gujarati conversion, and the pre-1.2 `IastPlainEnglishOptions` constructor stay unchanged. New `BrahmicPlainEnglishOptions` fields are appended, so old positional constructors stay valid.
- A call that leaves `readableStyle` at `LEGACY` keeps the 1.1 readable output. Each runtime's Brahmic plain-English suite locks that default path, the golden Gujarati paragraph, Sanskrit conservatism, and the `NATURAL` + `SMART` syllable cases.

---

## 1.1.0

**lipimala v1.1.0 — Brahmic transcription and Unicode 18 coverage**

- Added first-class **Devanagari/Gujarati → Plain-English and Hunterian** string APIs in Dart, JavaScript, Python, and PHP, plus bulk/list helpers.
- Added source-aware inherent-schwa tracking so pronunciation rules delete only implicit Brahmic schwas rather than explicit written vowels.
- Added language-aware schwa policies for **Gujarati**, **Hindi/Hindustani**, and a **Sanskrit** no-deletion mode.
- Added readable vowel-length and terminal-anusvara policies for direct Brahmic transcription.
- Prevented Gujarati Hunterian from inheriting Hindi-oriented automatic `v` → `w` behavior.
- Added direct Brahmic result-envelope APIs that retain the exact source while exposing a deliberately lossy readable Latin view.
- Expanded Devanagari and Gujarati handling across their assigned Unicode 18 repertoires, applicable Vedic signs, Devanagari Extended and Extended-A, and Common Indic Number Forms.
- Added semantic handling for Gujarati Arabic-transliteration signs, historic vowels, Vedic nasal and visarga signs, sacred signs, and pronunciation-neutral editorial marks.
- Added ZWJ, ZWNJ, combining grapheme joiner, and dotted-circle handling in Brahmic parsing and transcription.
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
