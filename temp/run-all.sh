#!/usr/bin/env bash
# Install and smoke-test lipimala across Python, JavaScript, Dart, and PHP.
#
# Usage:
#   ./temp/run-all.sh              # install from this monorepo (default)
#   ./temp/run-all.sh local        # same as above
#   ./temp/run-all.sh registry     # pip/npm/pub/composer public registries
#
# Registry mode uses:
#   pip install lipimala
#   npm install lipimala
#   dart pub add lipimala
#   composer require jayeshmepani/lipimala

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-local}"

if [[ "$MODE" != "local" && "$MODE" != "registry" ]]; then
  echo "Usage: $0 [local|registry]" >&2
  exit 2
fi

pass=0
fail=0

section() {
  echo
  echo "================================================================"
  echo " $1"
  echo "================================================================"
}

ok() {
  echo "✓ $1"
  pass=$((pass + 1))
}

bad() {
  echo "✗ $1" >&2
  fail=$((fail + 1))
}

run_python() {
  section "Python  (pip install lipimala)"
  cd "$TEMP/python"
  rm -rf .venv
  python3 -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  python -m pip install --upgrade pip >/dev/null

  if [[ "$MODE" == "registry" ]]; then
    echo "\$ pip install lipimala"
    pip install lipimala
  else
    echo "\$ pip install \"$ROOT/python\""
    pip install "$ROOT/python"
  fi

  python smoke_test.py
  deactivate
}

run_javascript() {
  section "JavaScript / Node.js  (npm install lipimala)"
  cd "$TEMP/javascript"
  rm -rf node_modules package-lock.json

  if [[ "$MODE" == "registry" ]]; then
    echo "\$ npm install lipimala"
    npm install lipimala
  else
    echo "\$ npm install \"$ROOT/javascript\""
    npm install "$ROOT/javascript"
  fi

  npm test
}

run_dart() {
  section "Dart / Flutter  (dart pub add lipimala)"
  cd "$TEMP/dart"
  rm -rf .dart_tool .packages pubspec.lock

  cat > pubspec.yaml <<'EOF'
name: lipimala_consumer_smoke
description: Temporary consumer smoke test for lipimala.
publish_to: none
environment:
  sdk: ">=3.0.0 <4.0.0"
EOF

  if [[ "$MODE" == "registry" ]]; then
    echo "\$ dart pub add lipimala"
    dart pub add lipimala
  else
    echo "\$ dart pub add 'lipimala:{\"path\":\"$ROOT/dart\"}'"
    dart pub add "lipimala:{\"path\":\"$ROOT/dart\"}"
  fi

  dart run bin/smoke_test.dart
}

run_php() {
  section "PHP  (composer require jayeshmepani/lipimala)"
  cd "$TEMP/php"
  rm -rf vendor composer.lock

  cat > composer.json <<'EOF'
{
  "name": "lipimala/consumer-smoke",
  "description": "Temporary consumer smoke test for jayeshmepani/lipimala",
  "type": "project",
  "require": {
    "php": ">=8.3"
  },
  "config": {
    "sort-packages": true,
    "allow-plugins": {}
  }
}
EOF

  if [[ "$MODE" == "registry" ]]; then
    echo "\$ composer require jayeshmepani/lipimala"
    composer require jayeshmepani/lipimala --no-interaction
  else
    echo "\$ composer config repositories.lipimala path $ROOT/php"
    echo "\$ composer require jayeshmepani/lipimala:@dev"
    composer config repositories.lipimala path "$ROOT/php"
    # Prefer source symlink so local composer.json autoload changes apply immediately.
    composer config repositories.lipimala --unset 2>/dev/null || true
    composer config repositories.lipimala path "$ROOT/php"
    composer require jayeshmepani/lipimala:@dev --no-interaction
  fi

  php smoke_test.php
}

echo "lipimala consumer smoke suite"
echo "mode: $MODE"
echo "repo: $ROOT"

if run_python; then ok "Python"; else bad "Python"; fi
if run_javascript; then ok "JavaScript"; else bad "JavaScript"; fi
if run_dart; then ok "Dart"; else bad "Dart"; fi
if run_php; then ok "PHP"; else bad "PHP"; fi

section "Summary"
echo "passed: $pass"
echo "failed: $fail"
echo "mode:   $MODE"

if [[ $fail -ne 0 ]]; then
  exit 1
fi

echo
echo "All consumer smoke tests passed."
