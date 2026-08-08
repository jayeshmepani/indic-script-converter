# lipimala v1.0.2 — Complete Bulk Transliteration API & 160/160 Pub Points

**`lipimala` v1.0.2** introduces full bulk array / list transliteration across all script conversion directions (with 100% options/profile customization support), maxes out pub.dev scoring requirements to **160 / 160 pub points**, standardizes target Python runtime references to **Python 3.12+**, and synchronizes versions across Dart, JavaScript, Python, and PHP.

---

### What's Changed in v1.0.2

- **Complete Bulk String Array / List Transliteration API**:
  - Bulk convert any list, array, or sequence of strings (`["Kṛṣṇa", "Rāma", "jñāna"]`) in a single call without manual loop logic.
  - **All Conversion Directions Supported**:
    - **Latin (IAST) → Devanagari / Gujarati / Plain English**: `toDevanagariFromIastList()`, `toGujaratiFromIastList()`, `toPlainEnglishFromIastList()`
    - **Brahmic → Latin (IAST)**: `toCanonicalIastFromDevanagariList()`, `toCanonicalIastFromGujaratiList()`, `toIastFromDevanagariList()`, `toIastFromGujaratiList()`
    - **Direct Devanagari ↔ Gujarati**: `toCanonicalGujaratiFromDevanagariList()`, `toCanonicalDevanagariFromGujaratiList()`, `toGujaratiFromDevanagariList()`, `toDevanagariFromGujaratiList()`
    - **Envelope Result Objects**: `toDevanagariList()`, `toGujaratiList()`, `toPlainEnglishList()`
  - **Full Custom Options & Profiles Support**: Every bulk function accepts optional options objects (`IastToDevanagariOptions`, `IastPlainEnglishOptions`, etc.) or profile flags to tweak digit policies, punctuation policies, OM policies, final-A policies, and normalization.

- **Pub.dev Score Maxing (160 / 160 Points)**:
  - Added primary package examples `example/example.dart` and `example/lipimala_example.dart` to hit 10/10 points for package example detection.
  - Added complete `///` dartdoc documentation comments across options, getters, and extension classes to hit 10/10 points for documentation comments.

- **Python Target Runtime Standardization**:
  - Standardized target Python version to **Python 3.12+** (removed all legacy 3.8 references across documentation and READMEs).

- **Documentation & Badges**:
  - Removed Flutter badge from `dart/README.md`.
  - Updated all 4 ecosystem `CHANGELOG.md` files, `package.json`, `pubspec.yaml`, `pyproject.toml`, `composer.json`, and `docs/index.html` to `1.0.2`.

---

### Bulk Transliteration Example Across Languages

#### Dart
```dart
import 'package:lipimala/lipimala.dart';

final items = ['Kṛṣṇa', 'Rāma', 'jñāna'];

// Bulk Latin -> Devanagari & Gujarati
final deva = items.toDevanagariFromIast(); // ['कृष्ण', 'राम', 'ज्ञान']
final gujr = items.toGujaratiFromIast();   // ['કૃષ્ણ', 'રામ', 'જ્ઞાન']

// Bulk Direct Devanagari -> Gujarati
final gujrDirect = deva.toCanonicalGujaratiFromDevanagari();

// Bulk with Custom Options
final devaDigits = ['Rāma 123'].toDevanagariFromIast(
  options: const IastToDevanagariOptions(
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
  ),
); // ['राम १२३']
```

#### JavaScript / Node.js
```javascript
import {
    toDevanagariFromIastList,
    toCanonicalGujaratiFromDevanagariList,
    toCanonicalIastFromDevanagariList,
} from 'lipimala';

const items = ['Kṛṣṇa', 'Rāma', 'jñāna'];

// 1. Latin -> Devanagari
const deva = toDevanagariFromIastList(items);

// 2. Devanagari -> Latin IAST
const iast = toCanonicalIastFromDevanagariList(deva);

// 3. Direct Devanagari -> Gujarati
const gujr = toCanonicalGujaratiFromDevanagariList(deva);
```

#### Python
```python
from lipimala import (
    to_canonical_iast_from_devanagari_list,
    to_devanagari_from_iast_list,
    to_gujarati_from_iast_list,
)

items = ["Kṛṣṇa", "Rāma", "jñāna"]

# 1. Latin -> Devanagari
deva = to_devanagari_from_iast_list(items)

# 2. Devanagari -> Latin IAST
iast = to_canonical_iast_from_devanagari_list(deva)
```

#### PHP
```php
use function Lipimala\toCanonicalGujaratiFromDevanagariList;
use function Lipimala\toDevanagariFromIastList;

$items = ['Kṛṣṇa', 'Rāma', 'jñāna'];

// 1. Latin -> Devanagari
$deva = toDevanagariFromIastList($items);

// 2. Direct Devanagari -> Gujarati
$gujr = toCanonicalGujaratiFromDevanagariList($deva);
```
