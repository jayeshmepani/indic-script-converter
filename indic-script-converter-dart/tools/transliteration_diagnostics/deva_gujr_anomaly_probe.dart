import 'package:indic_script_converter/latn_iast_to_deva.dart';
import 'package:indic_script_converter/latn_iast_to_gujr.dart';

void dump(String s) {
  print(s);
  print('  DEV: ${s.toDevanagariFromIast()}');
  print('  GUJ: ${s.toGujaratiFromIast()}');
}

void main() {
  for (final s in [
    'ṁaṅgala',
    'm\u0307aṅgala',
    'ṃ̄',
    'm\u0323\u0304',
    'aṃ̄',
    'm̐tra',
    'aham̐',
    'Om̐',
    'a\u0331tman',
    'a\u0332nanta',
    'ṡakti',
    'ṙṣi',
    'kaṃ',
    'aṃ',
  ]) {
    dump(s);
  }
}
