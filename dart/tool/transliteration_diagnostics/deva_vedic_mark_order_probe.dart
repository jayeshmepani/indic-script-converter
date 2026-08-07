import 'package:lipimala/latn_iast_to_deva.dart';

void show(String src) {
  final out = src.toDevanagariFromIast();
  final codes = out.runes
      .map((r) => 'U+${r.toRadixString(16).toUpperCase().padLeft(4, '0')}')
      .join(' ');
  print('$src => $out');
  print('  $codes');
  // Find relative order of matra/visarga/accent where present
  final list = out.runes.toList();
  for (final name in ['visarga ः', 'udatta ॑', 'anudatta ॒']) {
    // just print positions
  }
  final v = list.indexOf(0x0903);
  final u = list.indexOf(0x0951);
  final a = list.indexOf(0x0952);
  if (v >= 0 && u >= 0) {
    print(
      '  visarga@$v udatta@$u order=${v < u ? "visarga→accent OK" : "WRONG"}',
    );
  }
  if (v >= 0 && a >= 0) {
    print(
      '  visarga@$v anudatta@$a order=${v < a ? "visarga→accent OK" : "WRONG"}',
    );
  }
  print('');
}

void main() {
  for (final s in [
    'sóḥ',
    'soḥ́',
    'vasóḥ',
    'budhnàḥ',
    'namaḥ',
    'dhū́tam̐',
    'vádhūtàm̐',
  ]) {
    show(s);
  }
}
