# Unicode Handling Specification

This document details the Unicode representation rules, normalization forms (NFD/NFC), combining mark sorting, and tag-based metadata encoding utilized by the Indic Script Converter.

---

## 1. NFD & Combining Marks

In Latin-script transliterations, complex characters are often represented as a base letter followed by one or more combining marks (diacritics).

- **Canonical Representation**: base letter + diacritics.
- **Decomposed Form (NFD)**: Re-orders combining characters into a canonical sequence based on their Unicode combining class. For example:
  - `ṛ́` is decomposed into Base `r` (U+0072) + Combining Dot Below `◌̣` (U+0323) + Combining Acute `◌́` (U+0301).
- **Combined Form (NFC)**: Merges base letters and combining marks into single precomposed characters where available (e.g. `ṛ` U+1E5B).

### normalisationForm Options
The transliteration engine supports three normalization policies:
1. `preserve`: Keeps the input string's normalization exactly as-is.
2. `nfc`: Normalizes all outputs to Unicode NFC.
3. `nfd`: Normalizes all outputs to Unicode NFD.

---

## 2. Exact Round-Trip Metadata Encoding (Unicode Tag Trailer)

To guarantee true exact round-trip reverse conversion (e.g. restoring original casing, custom punctuation, or lossy character mappings), the transliteration engine embeds metadata directly into the output string using **invisible Unicode Tag characters**.

### The tag block
Unicode defines Tag characters in the range `U+E0000` to `U+E007F`, which are designed to be completely invisible and ignored by layout engines.

### Encoding Protocol
1. The metadata representing original capitalization, alias choices, or dropped characters is structured as a compact JSON payload.
2. The JSON string is compressed or converted to a byte sequence.
3. Each byte is shifted into the Unicode Tag range by adding `0xE0000`.
4. A CRC-32 checksum is appended to ensure tamper detection.
5. The resulting tag string is appended as an invisible trailer to the transliterated text.

During reverse conversion, the engine extracts this trailer, shifts the tags back to standard bytes, validates the checksum, and reconstructs the exact original source string.
