import 'package:indic_script_converter/latn_iast_to_deva.dart';
import 'package:indic_script_converter/latn_iast_to_gujr.dart';

void dump(String label, String s) {
  print('$label: $s');
  print(
    '  codes: ${s.runes.map((r) => 'U+${r.toRadixString(16).toUpperCase().padLeft(4, '0')}').join(' ')}',
  );
}

void main() {
  const opts = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
  );
  const gopts = IastToGujaratiOptions(
    punctuationPolicy: IastToGujaratiPunctuationPolicy.indicDanda,
  );
  const defaultOpts = IastToDevanagariOptions();
  const extOpts = IastToDevanagariOptions(
    profile: DevanagariRomanizationProfile.extendedIndic,
  );

  final cases = [
    'śrī.kṛṣṇa',
    '...saṃsāra...',
    'saṃsāra.',
    'saṃsāra..',
    'śrī. kṛṣṇa',
    'namaḥ.',
    "'jñāna'",
    "so'ham",
    "tathā'pi",
    'ḥṛdaya',
    'hṛdaya',
    'żikr',
    'ṣ́akti',
    'śakti',
    'soḥ́',
    'vasóḥ',
    'sóḥ',
  ];

  for (final c in cases) {
    print('=== IN: $c ===');
    dump('DEV(danda)', c.toDevanagariFromIast(options: opts));
    dump('DEV(def)', c.toDevanagariFromIast(options: defaultOpts));
    dump('DEV(ext)', c.toDevanagariFromIast(options: extOpts));
    dump('GUJ(danda)', c.toGujaratiFromIast(options: gopts));
  }
}
