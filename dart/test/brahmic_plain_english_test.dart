import 'package:lipimala/lipimala.dart';
import 'package:test/test.dart';

void main() {
  group('direct Brahmic to natural Latin', () {
    test('Gujarati Plain-English is source-aware', () {
      const cases = <String, String>{
        'આજ': 'aaj',
        'મારે': 'maare',
        'ઓરડે': 'orade',
        'નટવર': 'natvar',
        'સમાચાર': 'samaachaar',
        'ધર્મકુમાર': 'dharmakumaar',
        'ગુલાબના': 'gulaabnaa',
        'હીરની': 'heernee',
        'અમૂલ્ય': 'amoolya',
        'ધન્ય': 'dhanya',
        'રૂમાલ': 'roomaal',
        'શું': 'shun',
        'ક્યાં': 'kyaan',
      };

      for (final entry in cases.entries) {
        expect(
          entry.key.toPlainEnglishFromGujarati(),
          entry.value,
          reason: entry.key,
        );
      }
    });

    test('Gujarati Hunterian applies Gujarati schwa rules without Hindi w', () {
      const cases = <String, String>{
        'નટવર': 'natvar',
        'સમાચાર': 'samachar',
        'ધર્મકુમાર': 'dharmakumar',
        'સર્વે': 'sarve',
        'શોભતા': 'shobhta',
        'રેશમી': 'reshmi',
        'સૂંથણલી': 'sunthanli',
      };

      for (final entry in cases.entries) {
        expect(
          entry.key.toHunterianFromGujarati(),
          entry.value,
          reason: entry.key,
        );
      }

      expect('સર્વે swan twin'.toHunterianFromGujarati(), 'sarve swan twin');
      expect('દુઃખ'.toHunterianFromGujarati(), 'dukh');
    });

    test('direct Brahmic transcription preserves pre-existing Latin spans', () {
      const latin =
          'cat chocolate camera JavaScript café Kṛṣṇa Kr̥ṣṇa John’s ‘quote’';
      expect('ગુજરાત $latin'.toPlainEnglishFromGujarati(), 'gujaraat $latin');
      expect('ગુજરાત $latin'.toHunterianFromGujarati(), 'gujarat $latin');
      expect('भारत $latin'.toPlainEnglishFromDevanagari(), 'bhaarat $latin');
      expect('भारत $latin'.toHunterianFromDevanagari(), 'bharat $latin');
    });

    test('Devanagari uses Hindi schwa deletion and supports Sanskrit override',
        () {
      expect('कानपुर'.toPlainEnglishFromDevanagari(), 'kaanpur');
      expect('सरकार'.toPlainEnglishFromDevanagari(), 'sarkaar');
      expect('अहमद'.toPlainEnglishFromDevanagari(), 'ahmad');
      expect('धर्म'.toPlainEnglishFromDevanagari(), 'dharm');
      expect('ધર્મ'.toPlainEnglishFromGujarati(), 'dharm');
      expect('कानपुर'.toHunterianFromDevanagari(), 'kanpur');
      expect('सरकार'.toHunterianFromDevanagari(), 'sarkar');
      expect(
        'कानपुर'.toPlainEnglishFromDevanagari(
          options: const BrahmicPlainEnglishOptions(
            language: BrahmicLanguage.sanskrit,
          ),
        ),
        'kaanapura',
      );
      expect(
        'धर्म'.toPlainEnglishFromDevanagari(
          options: const BrahmicPlainEnglishOptions(
            language: BrahmicLanguage.sanskrit,
          ),
        ),
        'dharma',
      );
    });

    test('direct options control schwa, vowel length, and terminal anusvara',
        () {
      expect(
        'નટવર'.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            schwaDeletion: BrahmicSchwaDeletionPolicy.none,
          ),
        ),
        'natavara',
      );
      expect(
        'આજ'.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            vowelLength: BrahmicVowelLengthPolicy.collapse,
          ),
        ),
        'aj',
      );
      expect(
        'શું'.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            terminalAnusvara: TerminalAnusvaraPolicy.drop,
          ),
        ),
        'shu',
      );
    });

    test('bulk direct APIs are exported', () {
      expect(
        toPlainEnglishFromGujaratiList(const ['આજ', 'નટવર']),
        const ['aaj', 'natvar'],
      );
      expect(
        toHunterianFromGujaratiList(const ['સમાચાર', 'સર્વે']),
        const ['samachar', 'sarve'],
      );
    });

    test('canonical reverse and legacy IAST Hunterian stay unchanged', () {
      expect('સમાચાર'.toCanonicalIastFromGujarati(), 'samācāra');
      const hunterian = IastPlainEnglishOptions(
        profile: PlainEnglishRomanizationProfile.hunterian,
      );
      expect(
        'Sarasvatī'.toPlainEnglishFromIast(options: hunterian),
        'Saraswati',
      );
      expect('Rāma'.toPlainEnglishFromIast(options: hunterian), 'Ram');
    });

    test('direct result envelopes retain the exact Brahmic source', () {
      final plain = 'આજ મારે'.toPlainEnglishFromGujaratiResult();
      expect(plain.original, 'આજ મારે');
      expect(plain.restoreOriginal(), 'આજ મારે');
      expect(plain.rendered, 'aaj maare');
      expect(plain.profile, TransliterationProfile.plainEnglish);

      final hunterian = 'સમાચાર'.toHunterianFromGujaratiResult();
      expect(hunterian.restoreOriginal(), 'સમાચાર');
      expect(hunterian.rendered, 'samachar');
      expect(hunterian.profile, TransliterationProfile.hunterian);
    });
  });
}
