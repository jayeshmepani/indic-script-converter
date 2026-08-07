# Temporary consumer smoke tests

Isolated mini-projects that install **lipimala** the way real users will, then run one shared assertion (`Kṛṣṇa ā́tman` → Devanagari + exact restore).

## Install commands under test

| Runtime | Command |
| ------- | ------- |
| Python | `pip install lipimala` |
| JavaScript / Node.js | `npm install lipimala` |
| Dart / Flutter | `dart pub add lipimala` |
| PHP | `composer require jayeshmepani/lipimala` |

## Run everything

From the monorepo root:

```bash
# Default: install from this monorepo (local path packages)
./temp/run-all.sh
# or
./temp/run-all.sh local

# After packages are published to public registries
./temp/run-all.sh registry
```

## Run one runtime

### Python

```bash
cd temp/python
python3 -m venv .venv && source .venv/bin/activate
# local:
pip install ../../python
# registry:
# pip install lipimala
python smoke_test.py
```

### JavaScript / Node.js

```bash
cd temp/javascript
# local:
npm install ../../javascript
# registry:
# npm install lipimala
npm test
```

### Dart / Flutter

```bash
cd temp/dart
# local:
dart pub add 'lipimala:{"path":"../../dart"}'
# registry:
# dart pub add lipimala
dart run bin/smoke_test.dart
```

### PHP

```bash
cd temp/php
# local:
composer config repositories.lipimala path ../../php
composer require jayeshmepani/lipimala:@dev
# registry:
# composer require jayeshmepani/lipimala
php smoke_test.php
```

## Layout

```
temp/
  run-all.sh
  python/smoke_test.py
  javascript/{package.json,smoke_test.js}
  dart/{pubspec.yaml,bin/smoke_test.dart}
  php/{composer.json,smoke_test.php}
```

Install artifacts (`.venv`, `node_modules`, `vendor`, locks) are generated under `temp/` and ignored by git.
