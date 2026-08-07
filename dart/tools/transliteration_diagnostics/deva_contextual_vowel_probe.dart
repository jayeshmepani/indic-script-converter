import 'package:indic_script_converter/latn_iast_to_deva.dart';

void main() {
  // Check if ò is recognized after normalize of preceding word
  const s = "arā́tayò 'dítyā̀";
  print(s.toDevanagariFromIast());
  // code units around ò
  final idx = s.indexOf('ò');
  print('ò at $idx code ${s.codeUnitAt(idx).toRadixString(16)}');
  print('ò nfd: ${'ò'.runes.map((r) => r.toRadixString(16)).join()}');
}
