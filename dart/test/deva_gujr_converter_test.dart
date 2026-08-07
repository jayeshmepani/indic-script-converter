import 'package:lipimala/deva_gujr_converter.dart';
import 'package:lipimala/latn_iast_to_gujr.dart';
import 'package:test/test.dart';

import '../tool/latn_iast_transliteration_verification/example_deva.dart'
    as devaExamples;
import '../tool/latn_iast_transliteration_verification/example_gujr.dart'
    as gujrExamples;

void main() {
  test('core canonical script conversion', () {
    expect('कृष्ण'.toCanonicalGujaratiFromDevanagari(), 'કૃષ્ણ');
    expect('કૃષ્ણ'.toCanonicalDevanagariFromGujarati(), 'कृष्ण');
    expect('१२३'.toCanonicalGujaratiFromDevanagari(), '૧૨૩');
    expect('૧૨૩'.toCanonicalDevanagariFromGujarati(), '१२३');
    expect('वसोः॑'.toCanonicalGujaratiFromDevanagari(), 'વસોઃ॑');
    expect('વસોઃ॑'.toCanonicalDevanagariFromGujarati(), 'वसोः॑');
  });

  test('nukta and extended mappings are whole tokens', () {
    expect(
      'क़ ख़ ग़ ज़ फ़'.toCanonicalGujaratiFromDevanagari(),
      'ક઼ ખ઼ ગ઼ જ઼ ફ઼',
    );
    expect(
      'ક઼ ખ઼ ગ઼ જ઼ ફ઼'.toCanonicalDevanagariFromGujarati(),
      'क़ ख़ ग़ ज़ फ़',
    );
    expect('ॿक्ति'.toCanonicalGujaratiFromDevanagari(), 'બ઼ક્તિ');
    expect('બ઼ક્તિ'.toCanonicalDevanagariFromGujarati(), 'ॿक्ति');
    expect('ॹ'.toCanonicalGujaratiFromDevanagari(), 'ૹ');
    expect('ૹ'.toCanonicalDevanagariFromGujarati(), 'ॹ');
  });

  test('exact metadata round trips every Devanagari corpus item', () {
    const options = IndicScriptConversionOptions(
      embedExactSourceMetadata: true,
    );
    for (final source in devaExamples.devanagariSmokeSamples) {
      final tagged = source.toCanonicalGujaratiFromDevanagari(
        options: options,
      );
      expect(tagged.toExactDevanagariFromGujarati(), source);
      expect(tagged.toDevanagariFromGujarati(), source);
    }
  });

  test('exact metadata round trips every Gujarati corpus item', () {
    const options = IndicScriptConversionOptions(
      embedExactSourceMetadata: true,
    );
    for (final source in gujrExamples.gujaratiSmokeSamples) {
      final tagged = source.toCanonicalDevanagariFromGujarati(
        options: options,
      );
      expect(tagged.toExactGujaratiFromDevanagari(), source);
      expect(tagged.toGujaratiFromDevanagari(), source);
    }
  });

  test('visible tampering invalidates exact metadata', () {
    const options = IndicScriptConversionOptions(
      embedExactSourceMetadata: true,
    );
    final tagged = 'कृष्ण'.toCanonicalGujaratiFromDevanagari(
      options: options,
    );
    final tampered = tagged.replaceFirst('કૃષ્ણ', 'રામ');
    expect(
      tampered.toExactDevanagariFromGujarati,
      throwsFormatException,
    );
  });

  test('typed metadata rejects unrelated Latin-source trailers', () {
    const options = IastToGujaratiOptions(
      embedExactSourceMetadata: true,
    );
    final taggedFromLatin = 'Kṛṣṇa'.toGujaratiFromIast(options: options);
    expect(
      taggedFromLatin.toExactDevanagariFromGujarati,
      throwsFormatException,
    );
  });
}
