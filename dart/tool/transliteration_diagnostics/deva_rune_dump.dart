import 'package:lipimala/latn_iast_to_deva.dart';

void main() {
  const s1 = 'sādayā̀myàdítyā';
  final out = s1.toDevanagariFromIast();
  print('Output: $out');
  for (var i = 0; i < out.length; i++) {
    print(
      "  [$i] U+${out.codeUnitAt(i).toRadixString(16).padLeft(4, '0')} ${out[i]}",
    );
  }
}
