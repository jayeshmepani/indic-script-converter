import 'dart:convert';

import 'package:indic_script_converter/transliteration_result.dart';
import 'package:test/test.dart';

void main() {
  group('romanization profile defaults', () {
    test('default profile is extendedIndic for broad practical input', () {
      expect('ḷa'.toDevanagariFromIast(), 'ळ');
      expect('ḷa'.toGujaratiFromIast(), 'ળ');
      expect('laṛkā'.toDevanagariFromIast(), 'लड़का');
      expect('laṛkā'.toGujaratiFromIast(), 'લડ઼કા');
      expect(
        const IastPlainEnglishOptions().profile,
        PlainEnglishRomanizationProfile.extendedIndic,
      );
    });

    test('strict IAST remains available explicitly', () {
      const strictDeva = IastToDevanagariOptions(
        profile: DevanagariRomanizationProfile.strictIast,
      );
      const strictGujr = IastToGujaratiOptions(
        profile: GujaratiRomanizationProfile.strictIast,
      );
      expect('ḷa'.toDevanagariFromIast(options: strictDeva), 'ऌअ');
      expect('ḷa'.toGujaratiFromIast(options: strictGujr), 'ઌઅ');
    });

    test('strict profile rejects extended tokens when configured to throw', () {
      expect(
        () => 'qa'.toDevanagariFromIast(
          options: const IastToDevanagariOptions(
            profile: DevanagariRomanizationProfile.strictIast,
            unknownLatinPolicy: IastToDevanagariUnknownLatinPolicy.throwError,
          ),
        ),
        throwsFormatException,
      );
    });

    test('ISO/extended profile admits extended tokens', () {
      expect(
        'qa'.toDevanagariFromIast(
          options: const IastToDevanagariOptions(
            profile: DevanagariRomanizationProfile.iso15919Core,
          ),
        ),
        'क़',
      );
    });

    test('entire classical IAST inventory canonical-round-trips', () {
      const vowels = <String>[
        'a',
        'ā',
        'i',
        'ī',
        'u',
        'ū',
        'ṛ',
        'ṝ',
        'ḷ',
        'ḹ',
        'e',
        'ai',
        'o',
        'au',
      ];
      const consonants = <String>[
        'k',
        'kh',
        'g',
        'gh',
        'ṅ',
        'c',
        'ch',
        'j',
        'jh',
        'ñ',
        'ṭ',
        'ṭh',
        'ḍ',
        'ḍh',
        'ṇ',
        't',
        'th',
        'd',
        'dh',
        'n',
        'p',
        'ph',
        'b',
        'bh',
        'm',
        'y',
        'r',
        'l',
        'v',
        'ś',
        'ṣ',
        's',
        'h',
      ];

      for (final vowel in vowels) {
        final dev = vowel.toDevanagariFromIast();
        final guj = vowel.toGujaratiFromIast();
        expect(dev.toCanonicalIastFromDevanagari(), vowel, reason: vowel);
        expect(guj.toCanonicalIastFromGujarati(), vowel, reason: vowel);
      }

      for (final consonant in consonants) {
        final source = '${consonant}a';
        final dev = source.toDevanagariFromIast();
        final guj = source.toGujaratiFromIast();
        expect(dev.toCanonicalIastFromDevanagari(), source, reason: source);
        expect(guj.toCanonicalIastFromGujarati(), source, reason: source);
      }
    });
  });

  group('Unicode normalization and combining marks', () {
    test('NFC and reordered NFD spellings render equivalently', () {
      const nfc = 'Kṛṣṇa';
      const reorderedNfd = 'Kr̥ṣṇa';

      expect(
        nfc.toDevanagari().rendered,
        reorderedNfd.toDevanagari().rendered,
      );
      expect(
        nfc.toGujarati().rendered,
        reorderedNfd.toGujarati().rendered,
      );
    });

    test('unrecognized combining marks are preserved, never silently dropped',
        () {
      const source = 'a\u1AB0';
      final result = source.toDevanagari();

      expect(result.rendered.runes, contains(0x1AB0));
      expect(result.restoreOriginal(), source);
    });

    test('envelope restores exact case, normalization, and mark order', () {
      const source = 'Kr̥ṣṇa A\u0301\u0323';
      final result = source.toGujarati();

      expect(result.restoreOriginal(), source);
      expect(result.originalCodePoints, source.runes.toList());
    });
  });

  group('Vedic Unicode preservation', () {
    test('Devanagari, Devanagari Extended, and Vedic Extensions survive', () {
      const source = 'a\u0951\uA8E0\u1CD0\u1CFA';
      final result = source.toDevanagari();

      for (final rune in <int>[0x0951, 0xA8E0, 0x1CD0, 0x1CFA]) {
        expect(result.rendered.runes, contains(rune));
      }
      expect(result.restoreOriginal(), source);
    });

    test('all encoded Vedic ranges obey the preserve option', () {
      const source = 'a\u0951\uA8E0\u1CD0';
      final rendered = source.toDevanagariFromIast(
        options: const IastToDevanagariOptions(
          preserveVedicAccentMarks: false,
        ),
      );

      expect(rendered.runes, isNot(contains(0x0951)));
      expect(rendered.runes, isNot(contains(0xA8E0)));
      expect(rendered.runes, isNot(contains(0x1CD0)));
    });

    test('every code point in the declared Vedic blocks is retained', () {
      final vedicRunes = <int>[
        0x0951,
        0x0952,
        for (var rune = 0xA8E0; rune <= 0xA8FF; rune++) rune,
        for (var rune = 0x1CD0; rune <= 0x1CFF; rune++) rune,
      ];

      for (final rune in vedicRunes) {
        final source = 'a${String.fromCharCode(rune)}';
        final kept = source.toDevanagariFromIast();
        expect(
          kept.runes,
          contains(rune),
          reason: 'U+${rune.toRadixString(16)}',
        );

        final removed = source.toDevanagariFromIast(
          options: const IastToDevanagariOptions(
            preserveVedicAccentMarks: false,
          ),
        );
        expect(
          removed.runes,
          isNot(contains(rune)),
          reason: 'U+${rune.toRadixString(16)}',
        );
      }
    });
  });

  group('exact round-trip envelope', () {
    test('Hunterian view is lossy but the operation remains exact round-trip',
        () {
      const source = 'Gorakhapura Śiva ṭa ḍa';
      final result = source.toPlainEnglish(
        options: const IastPlainEnglishOptions(
          profile: PlainEnglishRomanizationProfile.hunterian,
        ),
      );

      expect(result.renderingIsInjective, isFalse);
      expect(result.restoreOriginal(), source);
      expect(
        result.issues.single.code,
        'HUNTERIAN_VIEW_IS_INTRINSICALLY_LOSSY',
      );
    });

    test('JSON envelope round-trips with code-point integrity checking', () {
      const source = 'KṚṢṆA a\u0304\u0301';
      final original = source.toDevanagari();
      final decoded = Map<String, Object?>.from(
        jsonDecode(jsonEncode(original.toJson())) as Map,
      );
      final restored = TransliterationResult.fromJson(decoded);

      expect(restored.restoreOriginal(), source);
      expect(restored.rendered, original.rendered);
    });
  });

  group('canonical script reverse', () {
    test('Devanagari returns canonical IAST', () {
      const source = 'kṛṣṇa ā́tman';
      final script = source.toDevanagari().rendered;
      expect(script.toCanonicalIastFromDevanagari(), source);
    });

    test('Gujarati returns canonical IAST', () {
      const source = 'kṛṣṇa ā́tman';
      final script = source.toGujarati().rendered;
      expect(script.toCanonicalIastFromGujarati(), source);
    });
  });
}
