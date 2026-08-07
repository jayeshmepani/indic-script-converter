// ignore_for_file: avoid_print

import 'package:lipimala/latn_iast_to_gujr.dart';
import 'example_latn_iast.dart' as ex;

export '../../lib/latn_iast_to_gujr.dart';

void main() {
  print('----------------------------------------------------------------');
  print(' 2. GUJARATI TRANSLITERATOR SAMPLES');
  print('----------------------------------------------------------------');

  const defaultOptions = IastToGujaratiOptions(
    punctuationPolicy: IastToGujaratiPunctuationPolicy.indicDanda,
    digitPolicy: IastToGujaratiDigitPolicy.convertToScript,
  );

  for (final source in ex.transliterationSmokeSamples) {
    print(
      '"$source" -> "${source.toGujaratiFromIast(options: defaultOptions)}"',
    );
  }

  _runOptionTests();
  _runProfileTests();
}

void _runOptionTests() {
  print('\n[Gujarati Option: Digits Policy (convertToScript)]');
  const digitOptions = IastToGujaratiOptions(
    digitPolicy: IastToGujaratiDigitPolicy.convertToScript,
  );
  const digitSample = '12345';
  print(
    '  "$digitSample" -> '
    '"${digitSample.toGujaratiFromIast(options: digitOptions)}"',
  );

  print('\n[Gujarati Option: Danda Policy (indicDanda)]');
  const dandaOptions = IastToGujaratiOptions(
    punctuationPolicy: IastToGujaratiPunctuationPolicy.indicDanda,
  );
  const punctuationSample = 'End. Double end..';
  print(
    '  "$punctuationSample" -> '
    '"${punctuationSample.toGujaratiFromIast(options: dandaOptions)}"',
  );

  print('\n[Gujarati Option: OM Policy (useOmSign)]');
  const omOptions = IastToGujaratiOptions(
    omPolicy: IastToGujaratiOmPolicy.useOmSign,
  );
  const omSample = 'oṃ namaḥ śivāya';
  print(
    '  "$omSample" -> "${omSample.toGujaratiFromIast(options: omOptions)}"',
  );
}

void _runProfileTests() {
  print('\n[Gujarati Profiles: strictIast / iso15919Core / extendedIndic]');
  const strict = IastToGujaratiOptions(
    profile: GujaratiRomanizationProfile.strictIast,
  );
  const iso = IastToGujaratiOptions(
    profile: GujaratiRomanizationProfile.iso15919Core,
  );
  const extended = IastToGujaratiOptions();

  for (final source in ['ṛaka', 'ṛhaṇa', 'ḷa', 'laṛkā', 'xaṇḍa']) {
    print(
      '  "$source" (strictIast)    -> '
      '"${source.toGujaratiFromIast(options: strict)}"',
    );
    print(
      '  "$source" (iso15919Core) -> '
      '"${source.toGujaratiFromIast(options: iso)}"',
    );
    print(
      '  "$source" (extendedIndic)-> '
      '"${source.toGujaratiFromIast()}"',
    );
  }
}
