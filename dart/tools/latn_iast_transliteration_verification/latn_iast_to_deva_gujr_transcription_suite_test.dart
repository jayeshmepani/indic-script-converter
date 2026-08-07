// ignore_for_file: avoid_print

import 'deva_to_latn_iast_test.dart' as devaToIast;
import 'gujr_to_latn_iast_test.dart' as gujrToIast;
import 'latn_iast_to_deva_test.dart' as devanagari;
import 'latn_iast_to_gujr_test.dart' as gujarati;
import 'latn_iast_transcription_test.dart' as english;

void main() {
  print('================================================================');
  print('          IAST SCRIPT TRANSLITERATORS UNIFIED TEST SUITE         ');
  print('================================================================\n');

  devanagari.main();
  print('');
  gujarati.main();
  print('');
  english.main();
  print('');
  devaToIast.main();
  print('');
  gujrToIast.main();
}
