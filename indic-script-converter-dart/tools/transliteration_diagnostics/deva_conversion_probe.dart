import 'package:indic_script_converter/latn_iast_to_deva.dart';

void main() {
  const s1 = 'sādayā̀myàdítyā';
  const s2 = 'sādayā̀myàdítīyā';
  print('s1: ${s1.toDevanagariFromIast()}');
  print('s2: ${s2.toDevanagariFromIast()}');
}
