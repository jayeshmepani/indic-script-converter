import 'package:indic_script_converter/latn_iast_to_deva.dart';
import '../latn_iast_transliteration_verification/example_latn_iast.dart' as ex;

void main() {
  const options = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
  );
  final case14 = ex.vedicRoundTripCases.last;
  final source = case14.$1;
  final expected = case14.$2;
  final actual = source.toDevanagariFromIast(options: options);
  print('SOURCE: $source');
  print('ACT: $actual');
  print('EXP: $expected');
  print('--- diffs ---');
  final a = actual.runes.toList();
  final e = expected.runes.toList();
  final n = a.length < e.length ? a.length : e.length;
  for (var i = 0; i < n; i++) {
    if (a[i] != e[i]) {
      final start = i > 10 ? i - 10 : 0;
      print('diff at $i');
      print(
        '  act around: ${String.fromCharCodes(a.sublist(start, (i + 10).clamp(0, a.length)))}  codes: ${a.sublist(start, (i + 10).clamp(0, a.length)).map((r) => r.toRadixString(16)).join(' ')}',
      );
      print(
        '  exp around: ${String.fromCharCodes(e.sublist(start, (i + 10).clamp(0, e.length)))}  codes: ${e.sublist(start, (i + 10).clamp(0, e.length)).map((r) => r.toRadixString(16)).join(' ')}',
      );
    }
  }
  if (a.length != e.length) print('length act=${a.length} exp=${e.length}');

  // specific cases
  for (final s in [
    "arā́tayo 'dítyā",
    "arātayo 'dityā",
    "yó'smān",
    'dhū́tam̐',
    'dhū́taṃ',
    'budhnàḥ',
    'ḥṛdaya',
    'ṣ́akti',
    's\u0323\u0301akti', // s + underdot + acute
    'żikr',
    'zikr',
  ]) {
    print('$s -> ${s.toDevanagariFromIast(options: options)}');
  }
}
