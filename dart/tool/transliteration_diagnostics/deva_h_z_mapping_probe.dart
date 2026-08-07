import 'package:indic_script_converter/latn_iast_to_deva.dart';

void main() {
  // What codepoints is ż?
  for (final s in [
    'ż',
    'z\u0307',
    'ẓ',
    'ज़',
    'ज़',
    'ḥ',
    'h\u0323',
    'ṣ́',
    's\u0323\u0301',
    'ś',
    's\u0301',
  ]) {
    print(
      '$s runes: ${s.runes.map((r) => r.toRadixString(16)).join(' ')} nfd: $s',
    );
  }
  // after conversion
  print('---');
  print('za: ${'za'.toDevanagariFromIast()}');
  print('ża: ${'ża'.toDevanagariFromIast()}');
  print(
    'żikr: ${'żikr'.toDevanagariFromIast()} codes ${'żikr'.toDevanagariFromIast().runes.map((r) => r.toRadixString(16)).join(' ')}',
  );
  print('hṛdaya: ${'hṛdaya'.toDevanagariFromIast()}');
  print('ḥṛdaya: ${'ḥṛdaya'.toDevanagariFromIast()}');
  print('kaḥ: ${'kaḥ'.toDevanagariFromIast()}');
  print('namaḥ: ${'namaḥ'.toDevanagariFromIast()}');

  // if we treat final without virama for zikr by adding a?
  print('żikra: ${'żikra'.toDevanagariFromIast()}');
}
