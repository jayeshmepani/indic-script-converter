import 'package:test/test.dart';
import 'package:lipimala/lipimala.dart';

/// Unicode 18.0 repertoire coverage for the Brahmic side (Devanagari +
/// Gujarati): rare, historic, Vedic, Arabic-transliteration, manuscript and
/// auxiliary characters across canonical IAST and Plain/Hunterian views.
void main() {
  group('Devanagari rare and historic characters', () {
    test('precomposed nukta consonants map canonically', () {
      expect('ऩ'.toCanonicalIastFromDevanagari(), 'ṉa');
      expect('ऱ'.toCanonicalIastFromDevanagari(), 'ṟa');
      expect('क़'.toCanonicalIastFromDevanagari(), 'qa');
      // U+0959 follows the engine's established `kh`/`x` convention: the
      // sequence pair `ख़` already maps to `x`, so the precomposed alias
      // matches it rather than introducing a second spelling.
      expect('ख़'.toCanonicalIastFromDevanagari(), 'xa');
      expect('ग़'.toCanonicalIastFromDevanagari(), 'ġa');
      expect('ज़'.toCanonicalIastFromDevanagari(), 'za');
      expect('ड़'.toCanonicalIastFromDevanagari(), 'ṛa');
      expect('ढ़'.toCanonicalIastFromDevanagari(), 'ṛha');
      expect('फ़'.toCanonicalIastFromDevanagari(), 'fa');
      expect('य़'.toCanonicalIastFromDevanagari(), 'ẏa');
      expect('च़'.toCanonicalIastFromDevanagari(), 'ċa');
      expect(toPlainEnglishFromDevanagari('च़'), 'tsa');
      expect(toHunterianFromDevanagari('च़'), 'tsa');
      expect('ċa'.toDevanagariFromIast(), 'च़');
    });

    test('precomposed nuktas work under preserve normalization', () {
      const options = ScriptToIastOptions(
        inputNormalization: UnicodeNormalizationForm.preserve,
      );
      expect(
        'क़'.toCanonicalIastFromDevanagari(options: options),
        'qa',
      );
      expect(
        'ड़'.toCanonicalIastFromDevanagari(options: options),
        'ṛa',
      );
    });

    test('obsolete accents, abbreviation and spacing signs', () {
      expect('ऀ'.toCanonicalIastFromDevanagari(), '\u0310');
      expect('॓'.toCanonicalIastFromDevanagari(), '\u0300');
      expect('॔'.toCanonicalIastFromDevanagari(), '\u0301');
      expect('ॕ'.toCanonicalIastFromDevanagari(), 'ē');
      expect('ऻ'.toPlainEnglishFromDevanagari(), 'ooe');
      expect('ॕ'.toPlainEnglishFromDevanagari(), 'ee');
      expect('ॴ'.toPlainEnglishFromDevanagari(), 'ooe');
      expect(toPlainEnglishFromDevanagari('॒॑᳚'), '');
      expect('कॎ'.toCanonicalIastFromDevanagari(), 'ke');
      expect('कॎे'.toCanonicalIastFromDevanagari(), 'kai');
      expect('कॎा'.toCanonicalIastFromDevanagari(), 'ko');
      expect('कॎो'.toCanonicalIastFromDevanagari(), 'kau');
      expect(toPlainEnglishFromDevanagari('कॎे'), 'kai');
      expect(toHunterianFromDevanagari('कॎो'), 'kau');
      expect('॰'.toCanonicalIastFromDevanagari(), '॰');
      expect('ॱ'.toCanonicalIastFromDevanagari(), 'ॱ');
    });
  });

  group('Devanagari Extended (U+A8E0..U+A8FF)', () {
    test('candrabindu nasalization remains audible in readable output', () {
      expect(toPlainEnglishFromDevanagari('हाँ'), 'haan');
      expect(toHunterianFromDevanagari('हाँ'), 'han');
      expect(toPlainEnglishFromGujarati('હાઁ'), 'haan');
    });

    test('dangling combining modifiers never leak into readable Latin', () {
      expect(toPlainEnglishFromDevanagari('़्'), '');
      expect(toPlainEnglishFromGujarati('઼્ૺૻૼ૽૾૿'), '');
    });

    test('AY vowels are phonemic, not decorations', () {
      expect('ꣾ'.toCanonicalIastFromDevanagari(), 'aĭ');
      expect('कꣿ'.toCanonicalIastFromDevanagari(), 'kaĭ');
      expect(toPlainEnglishFromDevanagari('कꣿ'), 'kai');
      expect(toPlainEnglishFromDevanagari('ꣾ'), 'ai');
      expect(toHunterianFromDevanagari('ꣾ'), 'ai');
    });

    test('sacred signs keep their meaning', () {
      expect('ꣽ'.toCanonicalIastFromDevanagari(), 'oṃ');
      expect(toPlainEnglishFromDevanagari('ꣽ'), 'om');
      expect(toPlainEnglishFromDevanagari('ॐ'), 'om');
      expect(toPlainEnglishFromGujarati('ૐ'), 'om');
      expect(toHunterianFromDevanagari('ॐ'), 'om');
      expect('a꣼b'.toCanonicalIastFromDevanagari(), 'a꣼b');
    });

    test(
        'cantillation is preserved canonically, omitted in Plain unless requested',
        () {
      expect('a꣡'.toCanonicalIastFromDevanagari(), 'a꣡');
      expect(toPlainEnglishFromGujarati('a꣡'), 'a');
      expect(toHunterianFromGujarati('a꣡'), 'a');

      const preserve =
          BrahmicPlainEnglishOptions(preserveVedicAccentMarks: true);
      expect('क⃰'.toCanonicalIastFromDevanagari(), 'ka⃰');
      expect(toPlainEnglishFromDevanagari('क⃰'), 'ka');
      expect(
        toPlainEnglishFromDevanagari('क⃰', options: preserve),
        'ka⃰',
      );
      expect(
        toPlainEnglishFromDevanagari('क॑', options: preserve),
        'ká',
      );
    });

    test('specialized nasalization signs carry nasal pronunciation', () {
      expect('ꣲ'.toCanonicalIastFromDevanagari(), 'ṃꣲ');
      expect('ꣴ'.toCanonicalIastFromDevanagari(), 'ṃṃꣴ');
      expect('ꣷ'.toCanonicalIastFromDevanagari(), 'ṃ\'ꣷ');
      expect(toPlainEnglishFromDevanagari('कꣲ'), 'kan');
      expect(toHunterianFromDevanagari('कꣴ'), 'kann');
      expect(toPlainEnglishFromDevanagari('कꣲꣴꣷ'),
          isNot(matches(RegExp('[ꣲ-ꣷ]'))));
    });

    test('editorial signs never join schwa parsing', () {
      // Canonical mode is explicit: the final schwa is written out and the
      // editorial sign neither deletes it nor merges into the word.
      expect('राम꣸'.toCanonicalIastFromDevanagari(), 'rāma꣸');
      expect(toPlainEnglishFromDevanagari('राम꣸'), 'raam꣸');
    });
  });

  group('Vedic Extensions (U+1CD0..U+1CFA)', () {
    test('tone marks preserve canonically, drop in Plain', () {
      expect('क᳐'.toCanonicalIastFromDevanagari(), 'ka᳐');
      expect(toPlainEnglishFromDevanagari('क᳐'), 'ka');
    });

    test('visarga modifiers keep their segment', () {
      final canonical = 'देवः᳣'.toCanonicalIastFromDevanagari();
      expect(canonical, contains('ḥ'));
      expect(canonical, contains('᳣'));
      expect(toPlainEnglishFromDevanagari('देवः᳣'), isNot(contains('᳣')));
    });

    test('nasal signs keep their nasal segment', () {
      expect('ᳩ'.toCanonicalIastFromDevanagari(), 'ṃᳩ');
      expect('ᳺ'.toCanonicalIastFromDevanagari(), 'ṃᳺ');
    });

    test('ardhavisarga, jihvamuliya and upadhmāniya are phonological', () {
      expect('ᳲ'.toCanonicalIastFromDevanagari(), 'ḥᳲ');
      expect('ᳵ'.toCanonicalIastFromDevanagari(), 'ḫᳵ');
      expect('ᳶ'.toCanonicalIastFromDevanagari(), 'fᳶ');
      expect(toPlainEnglishFromDevanagari('ᳶ'), isNot(contains('ᳶ')));
    });
  });

  group('Extended-A, number forms and format controls', () {
    test('alternate DDDA is a real consonant', () {
      expect('𑬊'.toCanonicalIastFromDevanagari(), 'ɗa');
      expect('ॻ'.toCanonicalIastFromDevanagari(), 'ɠa');
      expect('ॼ'.toCanonicalIastFromDevanagari(), 'ʄa');
      expect('ॾ'.toCanonicalIastFromDevanagari(), 'ɗa');
      expect('ॿ'.toCanonicalIastFromDevanagari(), 'ɓa');
      expect(toPlainEnglishFromDevanagari('ॻॼॾॿ'), 'gajadab');
      expect('ɠa'.toDevanagariFromIast(), 'ॻ');
      expect('ʄa'.toDevanagariFromIast(), 'ॼ');
    });

    test('manuscript signs and fractions are preserved', () {
      expect('𑬀'.toCanonicalIastFromDevanagari(), '𑬀');
      expect('꠱'.toCanonicalIastFromDevanagari(), '꠱');
      expect('राम꠱'.toCanonicalIastFromDevanagari(), 'rāma꠱');
      expect(toPlainEnglishFromDevanagari('राम꠱'), 'raam꠱');
    });

    test('ZWJ and ZWNJ are phonetically silent', () {
      expect('क‍'.toCanonicalIastFromDevanagari(), 'ka');
      expect('क‌'.toCanonicalIastFromDevanagari(), 'ka');
      expect(toPlainEnglishFromGujarati('ક‍'), 'ka');
    });
  });

  group('Gujarati Arabic-transliteration marks (U+0AFA..U+0AFF)', () {
    test('sukun silences consonant schwa but is a pause on vowels', () {
      expect('કૺ'.toCanonicalIastFromGujarati(), 'k');
      expect(toPlainEnglishFromGujarati('કૺ'), 'k');
      expect(toHunterianFromGujarati('કૺ'), 'k');
      expect('અૺ'.toCanonicalIastFromGujarati(), 'a');
      expect(toPlainEnglishFromGujarati('અૺ'), 'a');
      // Tolerate non-standard placement after a vowel sign without deleting it.
      expect('કુૺ'.toCanonicalIastFromGujarati(), 'ku');
      expect(toPlainEnglishFromGujarati('કુૺ'), 'ku');
    });

    test('shadda geminates the consonant', () {
      expect('નૻ'.toCanonicalIastFromGujarati(), 'nn');
      expect(toPlainEnglishFromGujarati('નૻ'), 'nn');
    });

    test('maddah elongates the vowel', () {
      expect('કૼ'.toCanonicalIastFromGujarati(), 'kā');
      expect(toPlainEnglishFromGujarati('કૼ'), 'kaa');
      expect(toHunterianFromGujarati('કૼ'), 'ka');
      expect('કુૼ'.toCanonicalIastFromGujarati(), 'kū');
      expect(toPlainEnglishFromGujarati('કુૼ'), 'koo');
      expect(toHunterianFromGujarati('કુૼ'), 'ku');
    });

    test('documented cluster mappings resolve phonetically', () {
      expect('સ૾'.toCanonicalIastFromGujarati(), 'tha');
      expect('ઝ૾'.toCanonicalIastFromGujarati(), 'dha');
      expect('ઝ૿'.toCanonicalIastFromGujarati(), 'ẓa');
      expect('ક૽'.toCanonicalIastFromGujarati(), 'qa');
      expect(toPlainEnglishFromGujarati('સ૾'), 'tha');
      expect(toHunterianFromGujarati('ઝ૿'), 'za');
      expect('ક૽ુ'.toCanonicalIastFromGujarati(), 'qu');
      expect('ક૽ૺ'.toCanonicalIastFromGujarati(), 'q');
      expect('સ૾ૻ'.toCanonicalIastFromGujarati(), 'thth');
    });

    test('Gujarati ayn has canonical identity and configurable readable output',
        () {
      expect('અ૽'.toCanonicalIastFromGujarati(), 'ʿa');
      expect('ઇ૽'.toCanonicalIastFromGujarati(), 'ʿi');
      expect(toPlainEnglishFromGujarati('અ૽'), "'a");
      expect(
        toPlainEnglishFromGujarati(
          'અ૽',
          options: const BrahmicPlainEnglishOptions(ayn: AynPolicy.drop),
        ),
        'a',
      );
      expect(
        toPlainEnglishFromGujarati(
          'અ૽',
          options: const BrahmicPlainEnglishOptions(ayn: AynPolicy.preserve),
        ),
        'ʿa',
      );
    });

    test('abbreviation and rupee signs are preserved', () {
      expect('૰'.toCanonicalIastFromGujarati(), '૰');
      expect('૱'.toCanonicalIastFromGujarati(), '૱');
    });
  });
}
