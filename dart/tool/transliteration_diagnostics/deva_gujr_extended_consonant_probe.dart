import 'package:lipimala/latn_iast_to_deva.dart';
import 'package:lipimala/latn_iast_to_gujr.dart';

void dump(String label, String s) {
  print(
    '$label: $s  codes=${s.runes.map((r) => r.toRadixString(16)).join(' ')}',
  );
}

void main() {
  for (final s in [
    'ḻīlā',
    'ḫāna',
    'ṟa',
    'ṉa',
    'ḻa',
    'ḫa',
    'l\u0331īlā',
    'h\u032Eāna',
    'r\u0331a',
    'n\u0331a',
  ]) {
    dump('DEV $s', s.toDevanagariFromIast());
    dump('GUJ $s', s.toGujaratiFromIast());
  }
  // char identity
  for (final c in [
    'ḻ',
    'ḫ',
    'ṟ',
    'ṉ',
    'ऴ',
    'ऱ',
    'ऩ',
    'ख़',
    'ળ',
    'ખ઼',
    'ર઼',
    'ન઼',
  ]) {
    print('char $c = ${c.runes.map((r) => r.toRadixString(16)).join(' ')}');
  }
}
