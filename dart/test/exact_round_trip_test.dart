import 'package:indic_script_converter/brahmic_to_latn_iast.dart';
import 'package:indic_script_converter/latn_iast_to_deva.dart';
import 'package:indic_script_converter/latn_iast_to_gujr.dart';
import 'package:indic_script_converter/transliteration_core.dart';
import 'package:test/test.dart';

void main() {
  const devanagariOptions = IastToDevanagariOptions(
    digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
    embedExactSourceMetadata: true,
  );

  const gujaratiOptions = IastToGujaratiOptions(
    digitPolicy: IastToGujaratiDigitPolicy.convertToScript,
    punctuationPolicy: IastToGujaratiPunctuationPolicy.indicDanda,
    embedExactSourceMetadata: true,
  );

  const exactKeys = <String>[
    'Kṛṣṇa',
    'kṛṣṇa',
    'Kr̥ṣṇa',
    'Rāma',
    'Ra\u0304ma',
    'ḳarma',
    'qara',
    'ḫāna',
    'k͟hāna',
    'xaṇḍa',
    'ḷa',
    'ḻīlā',
    'ṡakti',
    'ṙṣi',
    'ǧana',
    'žaṭa',
    'ṣ́akti',
    'ṣ́akti',
    'ṃ̄',
    'ṃ̄',
    'ṁaṅgala',
    'ṁaṅgala',
    'm̐tra',
    "te'pi, sa'pi, tathā'pi",
    'OṂ NAMAḤ ŚIVĀYA',
    'agním agnìm || 12 ||',
    'Kṛṣṇa\nRāma',
    '  Śiva   ',
    '😀 Kṛṣṇa',
  ];

  test('Devanagari returns the exact original key', () {
    for (final key in exactKeys) {
      final script = key.toDevanagariFromIast(options: devanagariOptions);
      expect(script.toExactIastFromDevanagari(), sameCodeUnits(key));
      expect(script.toIastFromDevanagari(), sameCodeUnits(key));
      expect(script.hasExactDevanagariSourceMetadata, isTrue);
    }
  });

  test('Gujarati returns the exact original key', () {
    for (final key in exactKeys) {
      final script = key.toGujaratiFromIast(options: gujaratiOptions);
      expect(script.toExactIastFromGujarati(), sameCodeUnits(key));
      expect(script.toIastFromGujarati(), sameCodeUnits(key));
      expect(script.hasExactGujaratiSourceMetadata, isTrue);
    }
  });

  test('visible script excludes the invisible metadata trailer', () {
    const key = 'ḫāna';
    final tagged = key.toDevanagariFromIast(options: devanagariOptions);
    expect(tagged.visibleDevanagariWithoutExactSourceMetadata, 'ख़ान');
    expect(stripExactSourceMetadata(tagged), 'ख़ान');
  });

  test('canonical reverse is still available for untagged text', () {
    expect('कृष्ण'.toCanonicalIastFromDevanagari(), 'kṛṣṇa');
    expect('કૃષ્ણ'.toCanonicalIastFromGujarati(), 'kṛṣṇa');
  });

  test('required exact reverse rejects untagged script', () {
    expect(
      () => 'कृष्ण'.toExactIastFromDevanagari(),
      throwsFormatException,
    );
    expect(
      () => 'કૃષ્ણ'.toExactIastFromGujarati(),
      throwsFormatException,
    );
  });

  test('tampered trailer does not silently return a false key', () {
    const key = 'Kṛṣṇa';
    final tagged = key.toDevanagariFromIast(options: devanagariOptions);
    final runes = tagged.runes.toList();
    runes[runes.length - 2] ^= 1;
    final tampered = String.fromCharCodes(runes);

    expect(hasEmbeddedExactSource(tampered), isFalse);
    expect(
      tampered.toExactIastFromDevanagari,
      throwsFormatException,
    );
  });
}

Matcher sameCodeUnits(String expected) => predicate<String>(
      (actual) {
        final a = actual.codeUnits;
        final b = expected.codeUnits;
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; i++) {
          if (a[i] != b[i]) return false;
        }
        return true;
      },
      'has the exact UTF-16 code-unit sequence of $expected',
    );
