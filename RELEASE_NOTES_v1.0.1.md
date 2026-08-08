# GitHub Release v1.0.1 Copy-Paste File

Copy the **Release Title** and **Markdown Content** below directly into GitHub's release form.

---

## 1. Main Monorepo Repository (`jayeshmepani/indic-script-converter`)

### Release Title
```text
lipimala v1.0.1 — Module Root Exports & Complete API Coverage
```

### Release Description (Markdown)
```markdown
**`lipimala` v1.0.1** brings direct root module exports, function name disambiguation for metadata helpers, expanded public API coverage, and synchronized package versions across all 4 runtimes (Dart, JavaScript, Python, PHP).

---

### What's Changed in v1.0.1

- **Root Module Exports**: Direct Devanagari ↔ Gujarati conversion functions (`toDevanagariFromGujarati`, `toGujaratiFromDevanagari`, `toCanonicalGujaratiFromDevanagari`, `toCanonicalDevanagariFromGujarati`, `hasExactGujaratiSourceMetadata`, `hasExactDevanagariSourceMetadata`, `visibleWithoutExactSourceMetadata`, options classes) can now be imported directly from the primary package root (`lipimala`) in JavaScript, Python, Dart, and PHP.
- **Function Disambiguation**: Resolved extension conflicts between IAST-source trailers (`hasExactDevanagariIastSourceMetadata` / `hasExactGujaratiIastSourceMetadata`) and direct script-to-script trailers (`hasExactDevanagariSourceMetadata` / `hasExactGujaratiSourceMetadata`).
- **Comprehensive API Example Suites**: Expanded example runner scripts across all 4 runtimes exercising 100% of all 35 core APIs, options, enums, metadata decoders, and Unicode 17.0.0 classifiers:
  - `dart run example/public_api_examples.dart`
  - `node javascript/examples/public-api-examples.js`
  - `PYTHONPATH=python python3 python/examples/public_api_examples.py`
  - `php php/examples/public_api_examples.php`
- **Updated Documentation**: Fully updated HTML API reference (`docs/index.html`) and package README files.

---

### Installation Commands

| Platform | Package | Install Command |
|---|---|---|
| **Python** | `lipimala` | `pip install lipimala==1.0.1` |
| **JavaScript / Node.js** | `lipimala` | `npm install lipimala@1.0.1` |
| **Dart / Flutter** | `lipimala` | `dart pub add lipimala:^1.0.1` |
| **PHP** | `jayeshmepani/lipimala` | `composer require jayeshmepani/lipimala:^1.0.1` |

---

### Quick Example

```python
from lipimala import (
    to_devanagari_from_iast,
    to_gujarati_from_devanagari,
    to_exact_devanagari_from_gujarati,
    IndicScriptConversionOptions,
)

# 1. Latin/IAST -> Devanagari
deva = to_devanagari_from_iast("Kṛṣṇa")  # 'कृष्ण'

# 2. Direct Devanagari -> Gujarati with exact source metadata
gujr = to_gujarati_from_devanagari(
    "ऄ ऎ ऍ",
    options=IndicScriptConversionOptions(embed_exact_source_metadata=True)
)

# 3. Exact original Devanagari recovery
exact_deva = to_exact_devanagari_from_gujarati(gujr)  # 'ऄ ऎ ऍ'
```
```

---

## 2. PHP Mirror Repository (`jayeshmepani/indic-script-converter-php`)

### Release Title
```text
lipimala PHP v1.0.1 — Root Exports & Disambiguated Metadata
```

### Release Description (Markdown)
```markdown
**`jayeshmepani/lipimala` v1.0.1** updates the PHP runtime with clean namespaced root exports, resolved function redeclaration compatibility, and top-level direct-script metadata helpers.

---

### What's Changed in v1.0.1

- **Root Namespace Cleanliness**: All functions, options classes, and result models are available directly under the `Lipimala` namespace (`use function Lipimala\toDevanagariFromIast;`, `use function Lipimala\toGujaratiFromDevanagari;`).
- **Function Redeclaration Fix**: Renamed IAST-source trailer checkers in `BrahmicToLatnIast.php` to `hasExactDevanagariIastSourceMetadata` and `hasExactGujaratiIastSourceMetadata` to prevent function collisions with direct Devanagari ↔ Gujarati trailer checkers in `DevaGujrConverter.php`.
- **Top-Level Direct Metadata Helpers**: Added `hasExactGujaratiSourceMetadata()`, `hasExactDevanagariSourceMetadata()`, and `visibleWithoutExactSourceMetadata()` standalone functions.
- **Zero Dependencies**: Retains 100% native PHP 8.3 implementation with bundled Unicode 17.0.0 normalization data tables (no `mbstring` or `intl` extensions required).

---

### Installation via Composer

```bash
composer require jayeshmepani/lipimala:^1.0.1
```

---

### Quick Example

```php
<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use function Lipimala\toDevanagariFromIast;
use function Lipimala\toCanonicalGujaratiFromDevanagari;
use function Lipimala\toExactDevanagariFromGujarati;
use Lipimala\IndicScriptConversionOptions;

$deva = toDevanagariFromIast('Kṛṣṇa'); // 'कृष्ण'

$taggedGujr = toCanonicalGujaratiFromDevanagari(
    'ऄ ऎ ऍ',
    new IndicScriptConversionOptions(embedExactSourceMetadata: true)
);

$exactDeva = toExactDevanagariFromGujarati($taggedGujr); // 'ऄ ऎ ऍ'
```
```
