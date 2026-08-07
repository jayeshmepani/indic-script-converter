# lipimala — JavaScript

A complete Node.js/ES2023 port of the supplied Dart and Python Indic-script conversion libraries.

The implementation preserves the same conversion inventory, defaults, profile boundaries, normalization behavior, Vedic handling, canonical reverse conversion, exact round-trip result envelope and invisible exact-source metadata format.

## Runtime

- Node.js 20 or newer
- ECMAScript modules
- ES2023 syntax
- No runtime dependencies

## Included conversions

- Latin/IAST and extended Indic → Devanagari
- Latin/IAST and extended Indic → Gujarati
- Latin/IAST and extended Indic → plain English
- Explicit Hunterian view
- Devanagari → canonical IAST
- Gujarati → canonical IAST
- Metadata-backed exact original-key recovery
- Exact Round-Trip JSON envelope serialization

The default forward profile is `extendedIndic`, matching the source libraries.

## Installation

```bash
npm install
```

For a local package checkout:

```bash
npm install /path/to/lipimala-js
```

## Basic usage

```js
import {
    toDevanagariFromIast,
    toGujaratiFromIast,
    toPlainEnglishFromIast,
    toCanonicalIastFromDevanagari,
    toCanonicalIastFromGujarati,
} from 'lipimala';

console.log(toDevanagariFromIast('Kṛṣṇa')); // कृष्ण
console.log(toGujaratiFromIast('Kṛṣṇa')); // કૃષ્ણ
console.log(toPlainEnglishFromIast('Kṛṣṇa')); // Krishna

console.log(toCanonicalIastFromDevanagari('कृष्ण')); // kṛṣṇa
console.log(toCanonicalIastFromGujarati('કૃષ્ણ')); // kṛṣṇa
```

## Exact original-key recovery

Visible script conversion is many-to-one: case, aliases, NFC/NFD choice and equivalent extended spellings can collapse into the same script output. Exact recovery therefore uses the same checksummed invisible Unicode Tag trailer as the Dart/Python implementations.

```js
import { IastToDevanagariOptions, toDevanagariFromIast, toExactIastFromDevanagari } from 'lipimala';

const source = 'Kṛṣṇa / Kr̥ṣṇa / ḫāna / ṣ́akti';

const tagged = toDevanagariFromIast(
    source,
    new IastToDevanagariOptions({
        embedExactSourceMetadata: true,
    }),
);

console.assert(toExactIastFromDevanagari(tagged) === source);
```

Gujarati uses the corresponding APIs:

```js
IastToGujaratiOptions;
toGujaratiFromIast;
toExactIastFromGujarati;
```

The trailer preserves the exact JavaScript UTF-16 code-unit sequence, including:

- uppercase and lowercase;
- NFC versus NFD;
- precomposed versus decomposed characters;
- combining-mark order;
- extended aliases;
- punctuation, whitespace and newlines;
- supplementary characters;
- unpaired UTF-16 code units.

The source and visible rendering each have an independent FNV-1a checksum. Editing either part invalidates exact recovery.

## Exact Round-Trip envelope

```js
import { TransliterationResult, toPlainEnglish } from 'lipimala';

const result = toPlainEnglish('Kṛṣṇa ā́tman ḷa');
const json = JSON.stringify(result.toJson());
const restored = TransliterationResult.fromJson(JSON.parse(json));

console.assert(restored.restoreOriginal() === 'Kṛṣṇa ā́tman ḷa');
```

The JSON schema remains:

```text
exact round-trip-indic-transliteration/1
```

## Profiles

```js
import {
    DevanagariRomanizationProfile,
    IastToDevanagariOptions,
    toDevanagariFromIast,
} from 'lipimala';

const extended = new IastToDevanagariOptions({
    profile: DevanagariRomanizationProfile.EXTENDED_INDIC,
});

const strict = new IastToDevanagariOptions({
    profile: DevanagariRomanizationProfile.STRICT_IAST,
});

console.log(toDevanagariFromIast('laṛkā', extended)); // लड़का
console.log(toDevanagariFromIast('laṛkā', strict)); // लऋका
```

Available forward profiles:

- `strictIast`
- `iso15919Core`
- `extendedIndic` — default

Plain-English profiles:

- `strictIast`
- `extendedIndic` — default
- `hunterian`

## Options

The port accepts both JavaScript camelCase and Python-style snake_case keys.

```js
new IastToDevanagariOptions({
    profile: 'extendedIndic',
    unknownLatinPolicy: 'passThrough',
    digitPolicy: 'preserveAscii',
    punctuationPolicy: 'preserve',
    omPolicy: 'transliterateLetters',
    ambiguousLPolicy: 'context',
    acceptAsciiLongVowels: false,
    acceptPlainSh: true,
    acceptPlainXAsKha: true,
    acceptWAsVa: true,
    preserveVedicAccentMarks: true,
    collapseWhitespace: false,
    embedExactSourceMetadata: false,
});
```

Gujarati exposes the equivalent options. Plain English additionally exposes final-`a`, `jñ`, standalone-`ñ`, glottal-stop, anusvāra-assimilation, Hunterian schwa and `v`→`w` policies.

---

## Devanagari ↔ Gujarati Direct Converter

This package includes a direct converter between Devanagari and Gujarati.

### Canonical visible conversion

```js
import {
    toCanonicalGujaratiFromDevanagari,
    toCanonicalDevanagariFromGujarati,
} from './src/deva-gujr-converter.js';

console.log(toCanonicalGujaratiFromDevanagari('कृष्ण')); // કૃષ્ણ
console.log(toCanonicalDevanagariFromGujarati('કૃષ્ણ')); // krishna
```

### Exact exact round-trip round trip

The visible Gujarati and Devanagari repertoires are not one-to-one. Therefore, exact round-trip recovery uses a checksummed Unicode-tag trailer.

```js
import {
    IndicScriptConversionOptions,
    toCanonicalGujaratiFromDevanagari,
    toExactDevanagariFromGujarati,
} from './src/deva-gujr-converter.js';

const source = 'ऄ ऎ ऍ ॲ ऒ ऑ ॵ ळ ऴ ग़ ॻ ड़ ॸ ॾ';

const taggedGujarati = toCanonicalGujaratiFromDevanagari(
    source,
    new IndicScriptConversionOptions({
        embedExactSourceMetadata: true,
    }),
);

console.assert(toExactDevanagariFromGujarati(taggedGujarati) === source);
```

The opposite Gujarati → Devanagari → exact Gujarati direction uses `toExactGujaratiFromDevanagari`.

### Smart exact-or-canonical APIs

These recover a correctly typed exact source trailer if present, and otherwise fall back to canonical visible conversion:

- `toDevanagariFromGujarati(text, options)`
- `toGujaratiFromDevanagari(text, options)`

Strict exact APIs throw when typed metadata is absent or damaged:

- `toExactDevanagariFromGujarati(text)`
- `toExactGujaratiFromDevanagari(text)`

---

## Generate all output files

```bash
npm run outputs
```

This writes:

```text
latn_iast_to_deva_output.txt
latn_iast_to_gujr_output.txt
latn_iast_transcription_output.txt
deva_to_latn_iast_output.txt
gujr_to_latn_iast_output.txt
deva_to_gujr_output.txt
gujr_to_deva_output.txt
```

Individual commands:

```bash
node tools/latn_iast_transliteration_verification/latn-iast-to-deva-test.js > latn_iast_to_deva_output.txt

node tools/latn_iast_transliteration_verification/latn-iast-to-gujr-test.js > latn_iast_to_gujr_output.txt

node tools/latn_iast_transliteration_verification/latn-iast-transcription-test.js > latn_iast_transcription_output.txt

node tools/latn_iast_transliteration_verification/deva-to-latn-iast-test.js > deva_to_latn_iast_output.txt

node tools/latn_iast_transliteration_verification/gujr-to-latn-iast-test.js > gujr_to_latn_iast_output.txt

node tools/latn_iast_transliteration_verification/deva-to-gujr-test.js > deva_to_gujr_output.txt

node tools/latn_iast_transliteration_verification/gujr-to-deva-test.js > gujr_to_deva_output.txt
```

The output runners use JSON string escaping so embedded quotes and newlines remain unambiguous.

## Verification

```bash
npm test
npm run verify
```

The test suite covers:

- 497 Latin/IAST → Devanagari oracle comparisons;
- 497 Latin/IAST → Gujarati oracle comparisons;
- 497 Latin/IAST → plain-English oracle comparisons;
- 497 Devanagari → canonical IAST oracle comparisons;
- 497 Gujarati → canonical IAST oracle comparisons;
- all 22 Vedic Devanagari fixtures;
- profile boundaries and default `extendedIndic` behavior;
- digits, danda and OM options;
- plain-English and Hunterian policies;
- exact metadata round trips;
- source and visible-text tamper rejection;
- JSON envelope integrity;
- byte-for-byte metadata compatibility with the Python/Dart format.

See [PORT_VERIFICATION.md](./PORT_VERIFICATION.md) for the executed verification record.

## Source correspondence

| Dart/Python source                              | JavaScript port                                 |
| ----------------------------------------------- | ----------------------------------------------- |
| `transliteration_core`                          | `src/transliteration-core.js`                   |
| shared forward engine / Latin→script converters | `src/forward.js`                                |
| `latn_iast_to_deva`                             | `src/latn-iast-to-deva.js`                      |
| `latn_iast_to_gujr`                             | `src/latn-iast-to-gujr.js`                      |
| `latn_iast_transcription`                       | `src/latn-iast-transcription.js`                |
| `brahmic_to_latn_iast`                          | `src/brahmic-to-latn-iast.js`                   |
| `transliteration_result`                        | `src/transliteration-result.js`                 |
| example corpora                                 | `src/example-*.js`                              |
| verification runners                            | `tools/latn_iast_transliteration_verification/` |
