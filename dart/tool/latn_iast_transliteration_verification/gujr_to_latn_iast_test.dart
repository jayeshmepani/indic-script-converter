// ignore_for_file: avoid_print

import 'package:lipimala/brahmic_to_latn_iast.dart';
import 'example_gujr.dart' as examples;

void main() {
  print('----------------------------------------------------------------');
  print(' GUJARATI TO LATN IAST TRANSLITERATION');
  print('----------------------------------------------------------------');

  for (final source in examples.gujaratiSmokeSamples) {
    final result = source.toCanonicalIastFromGujarati();

    print('"$source" -> "$result"');
  }
}
