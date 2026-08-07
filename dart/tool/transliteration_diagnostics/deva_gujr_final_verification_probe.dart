import 'package:lipimala/latn_iast_to_deva.dart';
import 'package:lipimala/latn_iast_to_gujr.dart';

void main() {
  const d = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
  );
  const g = IastToGujaratiOptions(
    punctuationPolicy: IastToGujaratiPunctuationPolicy.indicDanda,
  );

  final cases = <(String, String, String?)>{
    ('śrī.kṛṣṇa', 'श्री.कृष्ण', 'શ્રી.કૃષ્ણ'),
    ('...saṃsāra...', '...संसार...', '...સંસાર...'),
    ("'jñāna'", "'ज्ञान'", "'જ્ઞાન'"),
    ("so'ham", 'सोऽहम्', 'સોઽહમ્'),
    ("tathā'pi", 'तथाऽपि', null),
    ('ḥṛdaya', 'हृदय', 'હૃદય'),
    ('ṣ́akti', 'शक्ति', 'શક્તિ'),
    ('vasóḥ', 'वसोः॑', null),
    ('sóḥ', 'सोः॑', null),
  };

  for (final (src, expDev, expGuj) in cases) {
    final gotDev = src.toDevanagariFromIast(options: d);
    final okDev = gotDev == expDev;
    print(
      '${okDev ? "OK" : "FAIL"} DEV $src => $gotDev ${okDev ? "" : "(want $expDev)"}',
    );
    if (expGuj != null) {
      final gotGuj = src.toGujaratiFromIast(options: g);
      final okGuj = gotGuj == expGuj;
      print(
        '${okGuj ? "OK" : "FAIL"} GUJ $src => $gotGuj ${okGuj ? "" : "(want $expGuj)"}',
      );
    }
  }

  final z = 'żikr'.toDevanagariFromIast();
  print(
    'żikr => $z codes ${z.runes.map((r) => r.toRadixString(16)).join(" ")}',
  );
  print('żikra => ${'żikra'.toDevanagariFromIast()}');
}
