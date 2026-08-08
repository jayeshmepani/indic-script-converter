import 'package:lipimala/lipimala.dart';
import 'package:test/test.dart';

void main() {
  group('Bulk List / Iterable Transliteration Suite', () {
    const iastItems = ['Kṛṣṇa', 'Rāma', 'jñāna'];

    test('Latin (IAST) → Devanagari / Gujarati / Plain English (Bulk)', () {
      final devaList = iastItems.toDevanagariFromIast();
      expect(devaList, equals(['कृष्ण', 'राम', 'ज्ञान']));

      final gujrList = iastItems.toGujaratiFromIast();
      expect(gujrList, equals(['કૃષ્ણ', 'રામ', 'જ્ઞાન']));

      final plainList = iastItems.toPlainEnglishFromIast();
      expect(plainList, equals(['Krishna', 'Ram', 'gyan']));

      expect(toDevanagariFromIastList(iastItems), equals(devaList));
      expect(toGujaratiFromIastList(iastItems), equals(gujrList));
      expect(toPlainEnglishFromIastList(iastItems), equals(plainList));
    });

    test('Brahmic (Devanagari / Gujarati) → Latin IAST (Bulk)', () {
      final devaItems = ['कृष्ण', 'राम', 'ज्ञान'];
      final gujrItems = ['કૃષ્ણ', 'રામ', 'જ્ઞાન'];

      final iastFromDeva = devaItems.toCanonicalIastFromDevanagari();
      expect(iastFromDeva, equals(['kṛṣṇa', 'rāma', 'jñāna']));

      final iastFromGujr = gujrItems.toCanonicalIastFromGujarati();
      expect(iastFromGujr, equals(['kṛṣṇa', 'rāma', 'jñāna']));

      expect(
          toCanonicalIastFromDevanagariList(devaItems), equals(iastFromDeva));
      expect(toCanonicalIastFromGujaratiList(gujrItems), equals(iastFromGujr));
    });

    test('Direct Devanagari ↔ Gujarati (Bulk)', () {
      final devaItems = ['कृष्ण', 'राम', 'ज्ञान'];
      final gujrItems = ['કૃષ્ણ', 'રામ', 'જ્ઞાન'];

      final gujrFromDeva = devaItems.toCanonicalGujaratiFromDevanagari();
      expect(gujrFromDeva, equals(gujrItems));

      final devaFromGujr = gujrItems.toCanonicalDevanagariFromGujarati();
      expect(devaFromGujr, equals(devaItems));

      expect(
          toCanonicalGujaratiFromDevanagariList(devaItems), equals(gujrItems));
      expect(
          toCanonicalDevanagariFromGujaratiList(gujrItems), equals(devaItems));
    });

    test('TransliterationResult Envelopes (Bulk)', () {
      final envList = iastItems.toDevanagari();
      expect(envList.length, equals(3));
      expect(envList[0].rendered, equals('कृष्ण'));
      expect(envList[1].rendered, equals('राम'));
      expect(envList[2].rendered, equals('ज्ञान'));
    });
  });
}
