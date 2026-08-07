# JavaScript Port Verification

## Source baseline

The JavaScript implementation was ported from the supplied Dart source and the corresponding 1:1 Python implementation. The source inventory includes forward Devanagari/Gujarati conversion, plain-English/Hunterian transcription, canonical Brahmic reverse conversion, Unicode normalization, the lossless envelope and exact-source metadata.

## Runtime used

```text
Node.js v22.16.0
npm 10.9.2
```

The package declares Node.js `>=20` and uses ES2023-compatible language features only.

## Executed tests

```bash
npm test
```

Result:

```text
35 tests passed
0 failed
```

## Corpus parity

| Direction                   |     Exact matches |
| --------------------------- | ----------------: |
| Latin/IAST → Devanagari     |         497 / 497 |
| Latin/IAST → Gujarati       |         497 / 497 |
| Latin/IAST → plain English  |         497 / 497 |
| Devanagari → canonical IAST |         497 / 497 |
| Gujarati → canonical IAST   |         497 / 497 |
| **Total**                   | **2,485 / 2,485** |

Every comparison uses exact JavaScript string equality, including whitespace, punctuation, combining marks, Vedic characters and script digits.

## Vedic verification

```text
22 / 22 fixtures passed
```

The output preserves the source implementation’s Unicode order for Brahmic syllables and relocates reverse Latin Vedic accents to their vowel targets exactly as implemented by the Dart/Python source.

## Exact metadata interoperability

The following checks passed:

1. JavaScript encoded metadata was decoded by the Python port and restored the exact source.
2. A Python-generated metadata vector was reproduced byte-for-byte by JavaScript.
3. Visible-text edits invalidate the rendered checksum.
4. Trailer edits invalidate metadata decoding.
5. NFC/NFD distinctions, aliases, combining-mark order and supplementary characters survive round trips.

## Output generation

```bash
npm run outputs
```

Successfully generated all five verification files in the package root.

## Dependency audit

```text
runtime dependencies: 0
npm audit vulnerabilities: 0
```
