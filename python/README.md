# lipimala for Python

[![PyPI version](https://img.shields.io/pypi/v/lipimala.svg?style=flat-square)](https://pypi.org/project/lipimala/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

IAST-style transliteration for Devanagari and Gujarati, with canonical reverse conversion, direct script conversion, and Plain-English or Hunterian output.

## Install

```bash
pip install lipimala
```

Requires Python 3.12 or newer. The package has no runtime dependencies.

## Use

```python
from lipimala import (
    to_devanagari_from_iast,
    to_canonical_iast_from_gujarati,
    to_plain_english_from_devanagari,
    to_plain_english_from_gujarati,
    to_canonical_gujarati_from_devanagari,
)

print(to_devanagari_from_iast('Kṛṣṇa'))  # कृष्ण
print(to_canonical_iast_from_gujarati('કૃષ્ણ'))  # kṛṣṇa
print(to_plain_english_from_devanagari('कानपुर'))  # kaanpur
print(to_plain_english_from_gujarati('આજ મારે'))  # aaj maare
print(to_canonical_gujarati_from_devanagari('कृष्ण'))  # કૃષ્ણ
```

Use `to_hunterian_from_devanagari()` and `to_hunterian_from_gujarati()` for simplified ASCII Hunterian: one letter per long vowel and no consonant dots. That is the map and signboard spelling, not the 1954 macron form (`jān`). See the [API reference](https://jayeshmepani.github.io/indic-script-converter/#hunterian-form). List helpers such as `to_devanagari_from_iast_list()` convert sequences of strings.

## Profiles and options

Forward conversion accepts `strictIast`, `iso15919Core`, or `extendedIndic` profiles. The default is `extendedIndic`. Options control normalization, unknown input, digits, punctuation, Vedic accents, whitespace, and exact-source metadata.

Direct Devanagari and Gujarati reading accepts `BrahmicPlainEnglishOptions`. Defaults stay the 1.1 output. `1.2.0` adds an opt-in natural reading. Examples are in the [API reference](https://jayeshmepani.github.io/indic-script-converter/#plain-examples).

## Preserve the original input

The rendered script may not encode the original Latin spelling, capitalization, or normalization. A result envelope keeps the source beside the rendered value:

```python
from lipimala import to_devanagari

result = to_devanagari('Kṛṣṇa')
print(result.rendered)  # कृष्ण
print(result.restore_original())  # Kṛṣṇa
```

For a standalone string, set `embed_exact_source_metadata=True` in the conversion options and use an exact reverse function such as `to_exact_iast_from_devanagari()`. Unicode-tag metadata can be removed by systems that sanitize invisible characters.

## License

MIT. See [LICENSE](LICENSE).
