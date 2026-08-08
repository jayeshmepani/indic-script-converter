# Exact Round-Trip Indic Transliteration — Python 3.12+ port

This directory is a Python port of the supplied Dart implementation. It keeps the Dart package's default **`extendedIndic`** behavior and ports all public conversion directions:

- Latin/IAST → Devanagari
- Latin/IAST → Gujarati
- Latin/IAST → plain English/Hunterian
- Devanagari → canonical Latin/IAST
- Gujarati → canonical Latin/IAST
- metadata-backed exact source recovery
- exact round-trip result envelopes and JSON serialization

The runtime has no third-party dependency. Python's standard `unicodedata` module supplies NFC/NFD normalization and Unicode mark categories.

## Install

```bash
cd python
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
```

For tests:

```bash
python -m pip install -e '.[dev]'
python -m pytest
```

## Basic conversions

```python
from lipimala import (
    to_devanagari_from_iast,
    to_gujarati_from_iast,
    to_plain_english_from_iast,
    to_canonical_iast_from_devanagari,
    to_canonical_iast_from_gujarati,
)

assert to_devanagari_from_iast('Kṛṣṇa') == 'कृष्ण'
assert to_gujarati_from_iast('Kṛṣṇa') == 'કૃષ્ણ'
assert to_plain_english_from_iast('Kṛṣṇa') == 'Krishna'
assert to_canonical_iast_from_devanagari('कृष्ण') == 'kṛṣṇa'
assert to_canonical_iast_from_gujarati('કૃષ્ણ') == 'kṛṣṇa'
```

## Exact original-key recovery

Visible Brahmic output is many-to-one. For example, aliases, case, and NFC/NFD forms can render identically. Exact recovery therefore uses the same checksummed invisible Unicode-tag trailer as the Dart implementation.

```python
from lipimala import (
    IastToDevanagariOptions,
    IastToGujaratiOptions,
    to_devanagari_from_iast,
    to_gujarati_from_iast,
    to_exact_iast_from_devanagari,
    to_exact_iast_from_gujarati,
)

source = 'Kṛṣṇa / Kr̥ṣṇa / ḫāna / ṣ́akti'

devanagari = to_devanagari_from_iast(
    source,
    IastToDevanagariOptions(embed_exact_source_metadata=True),
)
gujarati = to_gujarati_from_iast(
    source,
    IastToGujaratiOptions(embed_exact_source_metadata=True),
)

assert to_exact_iast_from_devanagari(devanagari) == source
assert to_exact_iast_from_gujarati(gujarati) == source
```

The metadata stores the exact UTF-16LE code-unit sequence and preserves:

- case
- precomposed versus decomposed spelling
- combining-mark order
- aliases
- punctuation and whitespace
- supplementary Unicode characters
- unpaired UTF-16 surrogates through Python's `surrogatepass` handling

The trailer is rejected if either the visible rendering or encoded source payload is modified.

## Exact Round-Trip envelope

```python
import json

from lipimala import (
    TransliterationResult,
    to_plain_english,
)

result = to_plain_english('Kṛṣṇa ā́tman ḷa')
assert result.restore_original() == 'Kṛṣṇa ā́tman ḷa'

encoded = json.dumps(result.to_json(), ensure_ascii=False)
restored = TransliterationResult.from_json(json.loads(encoded))
assert restored.restore_original() == result.original
```

## Devanagari ↔ Gujarati Direct Converter

This package includes a direct converter between Devanagari and Gujarati.

### Canonical visible conversion
```python
from lipimala import (
    to_canonical_gujarati_from_devanagari,
    to_canonical_devanagari_from_gujarati,
)

print(to_canonical_gujarati_from_devanagari('कृष्ण'))  # કૃષ્ણ
print(to_canonical_devanagari_from_gujarati('કૃષ્ણ'))  # कृष्ण
```

### Exact exact round-trip round trip
The visible Gujarati and Devanagari repertoires are not one-to-one. Therefore, exact round-trip recovery uses a checksummed Unicode-tag trailer.

```python
from lipimala.deva_gujr_converter import (
    IndicScriptConversionOptions,
    to_canonical_gujarati_from_devanagari,
    to_exact_devanagari_from_gujarati,
)

source = 'ऄ ऎ ऍ ॲ ऒ ऑ ॵ ळ ऴ ग़ ॻ ड़ ॸ ॾ'

tagged_gujarati = to_canonical_gujarati_from_devanagari(
    source,
    IndicScriptConversionOptions(embed_exact_source_metadata=True),
)

assert to_exact_devanagari_from_gujarati(tagged_gujarati) == source
```

The opposite Gujarati → Devanagari → exact Gujarati direction uses `to_exact_gujarati_from_devanagari`.

### Smart exact-or-canonical APIs
These recover a correctly typed exact source trailer if present, and otherwise fall back to canonical visible conversion:
- `to_devanagari_from_gujarati(text, options)`
- `to_gujarati_from_devanagari(text, options)`

Strict exact APIs throw when typed metadata is absent or damaged:
- `to_exact_devanagari_from_gujarati(text)`
- `to_exact_gujarati_from_devanagari(text)`

## Generate the verification outputs

Run from this directory after installation:

```bash
python3 -m tools.latn_iast_transliteration_verification.latn_iast_to_deva_test > latn_iast_to_deva_output.txt
python3 -m tools.latn_iast_transliteration_verification.latn_iast_to_gujr_test > latn_iast_to_gujr_output.txt
python3 -m tools.latn_iast_transliteration_verification.latn_iast_transcription_test > latn_iast_transcription_output.txt
python3 -m tools.latn_iast_transliteration_verification.deva_to_latn_iast_test > deva_to_latn_iast_output.txt
python3 -m tools.latn_iast_transliteration_verification.gujr_to_latn_iast_test > gujr_to_latn_iast_output.txt
python3 -m tools.latn_iast_transliteration_verification.deva_to_gujr_test > deva_to_gujr_output.txt
python3 -m tools.latn_iast_transliteration_verification.gujr_to_deva_test > gujr_to_deva_output.txt
```

## Verification performed

The automated parity suite compares the Python implementation against the five supplied Dart-generated output files:

- 497 Latin → Devanagari cases
- 497 Latin → Gujarati cases
- 497 Latin → plain-English cases
- 497 Devanagari → canonical IAST cases
- 497 Gujarati → canonical IAST cases

That is **2,485 exact result comparisons**, including the complete supplied Vedic corpus. Additional tests cover exact metadata recovery, normalization distinctions, combining-mark order, supplementary characters, JSON envelopes, and tamper rejection.

## Important distinction

`to_canonical_iast_from_devanagari()` and `to_canonical_iast_from_gujarati()` generate canonical reverse transliteration from visible text. They cannot infer the exact original alias or case. Use `embed_exact_source_metadata=True` plus `to_exact_iast_from_*()` when the exact original key must be recovered.
