// ignore_for_file: avoid_print

import 'package:indic_script_converter/latn_iast_to_deva.dart';
import 'example_latn_iast.dart' as ex;

export '../../lib/latn_iast_to_deva.dart';

void main() {
  print('----------------------------------------------------------------');
  print(' 1. DEVANAGARI TRANSLITERATOR SAMPLES');
  print('----------------------------------------------------------------');

  const defaultOptions = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
  );

  for (final source in ex.transliterationSmokeSamples) {
    print(
      '"$source" -> "${source.toDevanagariFromIast(options: defaultOptions)}"',
    );
  }

  _runOptionTests();
  _runProfileTests();
  _runVedicRoundTripTests();
}

void _runOptionTests() {
  print('\n[Devanagari Option: Digits Policy (convertToScript)]');
  const digitOptions = IastToDevanagariOptions(
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
  );
  const digitSample = '12345';
  print(
    '  "$digitSample" -> '
    '"${digitSample.toDevanagariFromIast(options: digitOptions)}"',
  );

  print('\n[Devanagari Option: Danda Policy (indicDanda)]');
  const dandaOptions = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
  );
  const punctuationSample = 'End. Double end..';
  print(
    '  "$punctuationSample" -> '
    '"${punctuationSample.toDevanagariFromIast(options: dandaOptions)}"',
  );

  print('\n[Devanagari Option: OM Policy (useOmSign)]');
  const omOptions = IastToDevanagariOptions(
    omPolicy: IastToDevanagariOmPolicy.useOmSign,
  );
  const omSample = 'oṃ namaḥ śivāya';
  print(
    '  "$omSample" -> '
    '"${omSample.toDevanagariFromIast(options: omOptions)}"',
  );
}

void _runProfileTests() {
  print('\n[Devanagari Profiles: strictIast / iso15919Core / extendedIndic]');
  const strict = IastToDevanagariOptions(
    profile: DevanagariRomanizationProfile.strictIast,
  );
  const iso = IastToDevanagariOptions(
    profile: DevanagariRomanizationProfile.iso15919Core,
  );
  const extended = IastToDevanagariOptions();

  for (final source in ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']) {
    print(
      '  "$source" (strictIast)    -> '
      '"${source.toDevanagariFromIast(options: strict)}"',
    );
    print(
      '  "$source" (iso15919Core) -> '
      '"${source.toDevanagariFromIast(options: iso)}"',
    );
    print(
      '  "$source" (extendedIndic)-> '
      '"${source.toDevanagariFromIast()}"',
    );
  }
}

void _runVedicRoundTripTests() {
  print('\n================================================================');
  print(' VEDIC FIXTURES: IAST → Devanagari vs expected Devanagari');
  print('================================================================');

  const options = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
  );

  var passed = 0;
  var failed = 0;

  for (final (iast, expected, label) in ex.vedicRoundTripCases) {
    final actual = iast.toDevanagariFromIast(options: options);
    if (actual == expected) {
      passed++;
      print('  ✓ $label');
      continue;
    }

    failed++;
    print('  ✗ $label');
    print('    DIFF: ${_runeDiff(actual, expected)}');
    print('    GOT: $actual');
    print('    EXP: $expected');
  }

  print(
    '\n  Result: $passed passed, $failed failed out of '
    '${ex.vedicRoundTripCases.length} fixtures.',
  );

  if (failed > 0) {
    // Preserve complete output while making CI/shell automation detect failure.
    throw StateError('$failed Vedic fixture(s) failed.');
  }
}

String _runeDiff(String actual, String expected) {
  final actualRunes = actual.runes.toList(growable: false);
  final expectedRunes = expected.runes.toList(growable: false);
  final length = actualRunes.length > expectedRunes.length
      ? actualRunes.length
      : expectedRunes.length;
  final output = StringBuffer();

  for (var index = 0; index < length; index++) {
    final actualRune = index < actualRunes.length ? actualRunes[index] : null;
    final expectedRune =
        index < expectedRunes.length ? expectedRunes[index] : null;
    if (actualRune == expectedRune) continue;

    if (output.isNotEmpty) output.write(' ');
    output.write(
      '[${_formatRune(actualRune)}|${_formatRune(expectedRune)}@$index]',
    );
  }

  return output.toString();
}

String _formatRune(int? rune) {
  if (rune == null) return 'END';
  return 'U+${rune.toRadixString(16).toUpperCase().padLeft(4, '0')}';
}
