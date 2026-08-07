/// Consumer smoke test for lipimala (Dart).
import 'package:lipimala/transliteration_result.dart';

void main() {
  const iast = 'Kṛṣṇa ā́tman';
  const expectedDeva = 'कृष्ण आ॑त्मन्';

  final de = iast.toDevanagari();
  final gu = iast.toGujarati();

  print('package: lipimala');
  print('input:   $iast');
  print('deva:    ${de.rendered}');
  print('gujr:    ${gu.rendered}');
  print('restore: ${de.restoreOriginal()}');

  if (de.rendered != expectedDeva) {
    throw StateError('unexpected Devanagari: ${de.rendered}');
  }
  if (de.restoreOriginal() != iast) {
    throw StateError('exact restore failed');
  }

  print('OK: Dart consumer smoke test passed');
}
