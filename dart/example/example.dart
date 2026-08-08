import 'package:lipimala/lipimala.dart';

void main() {
  // 1. Convert Latin/IAST to Devanagari
  final devaResult = 'Kṛṣṇa'.toDevanagari();
  print('Devanagari: ${devaResult.rendered}'); // कृष्ण

  // 2. Convert Latin/IAST to Gujarati
  final gujrResult = 'Kṛṣṇa'.toGujarati();
  print('Gujarati: ${gujrResult.rendered}'); // કૃષ્ણ

  // 3. Direct Devanagari to Gujarati
  final gujrDirect = 'कृष्ण १२३'.toCanonicalGujaratiFromDevanagari();
  print('Direct Gujarati: $gujrDirect'); // કૃષ્ણ ૧૨૩

  // 4. Exact source recovery with embedded metadata
  final taggedGujr = 'ऄ ऎ ऍ'.toCanonicalGujaratiFromDevanagari(
    options: const IndicScriptConversionOptions(embedExactSourceMetadata: true),
  );
  print('Has metadata: ${hasExactDevanagariSourceMetadata(taggedGujr)}');
  print(
      'Exact original: ${taggedGujr.toExactDevanagariFromGujarati()}'); // ऄ ऎ ऍ

  // 5. Bulk List conversion
  final iastList = ['Kṛṣṇa', 'Rāma', 'jñāna'];
  final devaList = iastList.toDevanagariFromIast();
  print('Bulk converted: $devaList'); // [कृष्ण, राम, ज्ञान]
}
