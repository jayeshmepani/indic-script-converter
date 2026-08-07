import 'package:indic_script_converter/latn_iast_to_deva.dart';
import 'package:indic_script_converter/latn_iast_to_gujr.dart';
import 'package:indic_script_converter/latn_iast_transcription.dart';
import 'package:test/test.dart';

import '../tools/latn_iast_transliteration_verification/example_latn_iast.dart'
    as ex;

void main() {
  group('shared example_latn_iast.dart corpus', () {
    test('every smoke sample completes in all three views', () {
      for (final source in ex.transliterationSmokeSamples) {
        expect(
          source.toDevanagariFromIast,
          returnsNormally,
          reason: 'Devanagari failed for: $source',
        );
        expect(
          source.toGujaratiFromIast,
          returnsNormally,
          reason: 'Gujarati failed for: $source',
        );
        expect(
          source.toPlainEnglishFromIast,
          returnsNormally,
          reason: 'Plain English failed for: $source',
        );
      }
    });

    test('all Vedic Devanagari fixtures match exactly', () {
      const options = IastToDevanagariOptions(
        punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
        digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
      );

      for (final (source, expected, label) in ex.vedicRoundTripCases) {
        expect(
          source.toDevanagariFromIast(options: options),
          expected,
          reason: label,
        );
      }
    });
  });
}
