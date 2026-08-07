import 'package:lipimala/latn_iast_to_deva.dart';
import '../latn_iast_transliteration_verification/example_latn_iast.dart' as ex;

void main() {
  const options = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
  );
  for (final (source, _, label) in ex.vedicRoundTripCases) {
    print('=== START $label ===');
    print(source.toDevanagariFromIast(options: options));
    print('=== END $label ===');
  }
}
