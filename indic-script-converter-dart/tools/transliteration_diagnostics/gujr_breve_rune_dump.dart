import 'package:indic_script_converter/latn_iast_to_gujr.dart';

void main() {
  const s = 'ĕkānta';
  print('Runes of input:');
  for (final cp in s.runes) {
    print(
      "  U+${cp.toRadixString(16).padLeft(4, '0')} (${String.fromCharCode(cp)})",
    );
  }
}
