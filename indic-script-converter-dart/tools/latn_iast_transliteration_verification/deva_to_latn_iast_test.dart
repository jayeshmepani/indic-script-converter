// ignore_for_file: avoid_print

import 'package:indic_script_converter/brahmic_to_latn_iast.dart';
import 'example_deva.dart' as examples;

void main() {
  print('----------------------------------------------------------------');
  print(' DEVANAGARI TO LATN IAST TRANSLITERATION');
  print('----------------------------------------------------------------');

  for (final source in examples.devanagariSmokeSamples) {
    final result = source.toCanonicalIastFromDevanagari();

    print('"$source" -> "$result"');
  }
}
