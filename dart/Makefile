format:
	dart format .

format-check:
	dart format --output=none --set-exit-if-changed .

lint:
	dart analyze --fatal-infos

modernize:
	dart fix --apply
	dart format .

modernize-dry:
	dart fix --dry-run

quality:
	dart format --output=none --set-exit-if-changed .
	dart analyze --fatal-infos
	dart test