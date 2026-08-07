import 'package:lipimala/latn_iast_to_deva.dart';
import 'package:lipimala/latn_iast_to_gujr.dart';

void dump(String s) {
  final d = s.toDevanagariFromIast();
  final g = s.toGujaratiFromIast();
  print(s);
  print('  DEV: $d  [${d.runes.map((r) => r.toRadixString(16)).join(' ')}]');
  print('  GUJ: $g  [${g.runes.map((r) => r.toRadixString(16)).join(' ')}]');
}

void main() {
  for (final s in [
    'ḳarma',
    'k\u0323arma',
    'ẓamāna',
    'z\u0323amāna',
    'ṡakti',
    's\u0307akti',
    'ṙṣi',
    'r\u0307ṣi',
    'ǧana',
    'g\u030Cana',
    'žaṭa',
    'z\u030Caṭa',
    'žaṇa',
    'ṣ́akti',
    's\u0323\u0301akti',
    'ṃ̄',
    'm\u0323\u0304',
    'm\u0304\u0323',
    'ṁaṅgala',
    'm\u0307aṅgala',
    'ḫāna',
    'k͟hāna',
    'xaṇḍa',
    'ṛṣi',
    'ṙa',
  ]) {
    dump(s);
  }
}
