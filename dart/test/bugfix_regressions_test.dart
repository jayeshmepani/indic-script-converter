import 'package:lipimala/brahmic_to_latn_iast.dart';
import 'package:lipimala/latn_iast_to_deva.dart';
import 'package:lipimala/latn_iast_to_gujr.dart';
import 'package:lipimala/latn_iast_transcription.dart';
import 'package:test/test.dart';

void main() {
  const dandaDev = IastToDevanagariOptions(
    punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
  );
  const dandaGuj = IastToGujaratiOptions(
    punctuationPolicy: IastToGujaratiPunctuationPolicy.indicDanda,
  );
  const extendedDev = IastToDevanagariOptions(
    profile: DevanagariRomanizationProfile.extendedIndic,
  );
  const extendedGuj = IastToGujaratiOptions(
    profile: GujaratiRomanizationProfile.extendedIndic,
  );

  group('danda policy preserves ordinary punctuation', () {
    test('mid-word period is not a danda', () {
      expect('śrī.kṛṣṇa'.toDevanagariFromIast(options: dandaDev), 'श्री.कृष्ण');
      expect('śrī.kṛṣṇa'.toGujaratiFromIast(options: dandaGuj), 'શ્રી.કૃષ્ણ');
    });

    test('ellipsis is preserved', () {
      expect(
        '...saṃsāra...'.toDevanagariFromIast(options: dandaDev),
        '...संसार...',
      );
      expect(
        '...saṃsāra...'.toGujaratiFromIast(options: dandaGuj),
        '...સંસાર...',
      );
    });

    test('sentence-final period becomes danda', () {
      expect('saṃsāra.'.toDevanagariFromIast(options: dandaDev), 'संसार।');
      expect('saṃsāra..'.toDevanagariFromIast(options: dandaDev), 'संसार।।');
    });
  });

  group('avagraha only in vowel-letter context', () {
    test('quotation apostrophes are preserved', () {
      expect("'jñāna'".toDevanagariFromIast(), "'ज्ञान'");
      expect("'jñāna'".toGujaratiFromIast(), "'જ્ઞાન'");
    });

    test('internal avagraha converts', () {
      expect("so'ham".toDevanagariFromIast(), 'सोऽहम्');
      expect("tathā'pi".toDevanagariFromIast(), 'तथाऽपि');
      expect("so'ham".toGujaratiFromIast(), 'સોઽહમ્');
    });

    test('cross-word avagraha after accented vowel', () {
      expect(
        "arā́tayò 'dítyā".toDevanagariFromIast(),
        'अरा॑तयो॒ ऽदि॑त्या',
      );
    });
  });

  group('special letter mappings', () {
    test('non-postvocalic ḥ is ha, not visarga', () {
      expect('ḥṛdaya'.toDevanagariFromIast(), 'हृदय');
      expect('ḥṛdaya'.toGujaratiFromIast(), 'હૃદય');
      expect('hṛdaya'.toDevanagariFromIast(), 'हृदय');
      expect('namaḥ'.toDevanagariFromIast(), 'नमः');
      expect('kaḥ'.toDevanagariFromIast(), 'कः');
    });

    test('żikr uses nukta za and attaches i as matra', () {
      final dev = 'żikr'.toDevanagariFromIast(options: extendedDev);
      // Prefer nukta sequence; allow NFC precomposed equivalence.
      expect(dev == 'ज़िक्र्' || dev == 'ज़िक्र्', isTrue, reason: dev);
      expect(dev, isNot(contains('इ'))); // must not be independent i
      expect(dev.runes, isNot(contains(0x0307))); // no floating dot above

      final guj = 'żikr'.toGujaratiFromIast(options: extendedGuj);
      expect(guj, 'જ઼િક્ર્');
    });

    test('natural spelling with final a is ज़िक्र', () {
      final dev = 'żikra'.toDevanagariFromIast(options: extendedDev);
      expect(dev == 'ज़िक्र' || dev == 'ज़िक्र', isTrue, reason: dev);
    });

    test('ṣ́ keeps retroflex ṣ and attaches Vedic udātta', () {
      expect('ṣ́akti'.toDevanagariFromIast(), 'ष॑क्ति');
      expect('ṣ́akti'.toGujaratiFromIast(), 'ષ॑ક્તિ');
      expect('s\u0323\u0301akti'.toDevanagariFromIast(), 'ष॑क्ति');
      // Pure ś (acute only) is still palatal.
      expect('śakti'.toDevanagariFromIast(), 'शक्ति');
    });
  });

  group('whole-grapheme matching (no Latin mark leaks)', () {
    bool hasLatinCombining(String s) => s.runes.any(
          (r) =>
              (r >= 0x0300 && r <= 0x036F) ||
              (r >= 0x1AB0 && r <= 0x1AFF) ||
              (r >= 0x1DC0 && r <= 0x1DFF),
        );

    test('extended consonants consume full graphemes', () {
      expect('ḳarma'.toDevanagariFromIast(options: extendedDev), 'क़र्म');
      expect('ḳarma'.toGujaratiFromIast(options: extendedGuj), 'ક઼ર્મ');
      expect('k\u0323arma'.toDevanagariFromIast(options: extendedDev), 'क़र्म');

      expect('ẓamāna'.toDevanagariFromIast(options: extendedDev), 'ज़मान');
      expect('ẓamāna'.toGujaratiFromIast(options: extendedGuj), 'જ઼માન');

      expect('žaṭa'.toDevanagariFromIast(options: extendedDev), 'ज़ट');
      expect('žaṇa'.toDevanagariFromIast(options: extendedDev), 'ज़ण');
      expect('žaṭa'.toGujaratiFromIast(options: extendedGuj), 'જ઼ટ');

      expect('ṡakti'.toDevanagariFromIast(options: extendedDev), 'सक्ति');
      expect('ṙṣi'.toDevanagariFromIast(options: extendedDev), 'र्षि');
      expect('ṙṣi'.toGujaratiFromIast(options: extendedGuj), 'ર્ષિ');
      expect('ǧana'.toDevanagariFromIast(options: extendedDev), 'ॻन');
      expect('ǧana'.toGujaratiFromIast(options: extendedGuj), 'ગ઼ન');

      for (final s in [
        'ḳarma',
        'ẓamāna',
        'ṡakti',
        'ṙṣi',
        'ǧana',
        'žaṭa',
        'žaṇa',
      ]) {
        expect(
          hasLatinCombining(s.toDevanagariFromIast(options: extendedDev)),
          isFalse,
          reason: s,
        );
        expect(
          hasLatinCombining(s.toGujaratiFromIast(options: extendedGuj)),
          isFalse,
          reason: s,
        );
      }
    });

    test('ṃ̄ uses script nasal plus preserved macron, not Latin ṃ', () {
      expect('ṃ̄'.toDevanagariFromIast(), '◌ं̄');
      expect('m\u0323\u0304'.toDevanagariFromIast(), '◌ं̄');
      expect('ṃ̄'.toGujaratiFromIast(), '◌ં̄');
      expect('m\u0323\u0304'.toGujaratiFromIast(), '◌ં̄');
      expect('aṃ̄'.toDevanagariFromIast(), 'अं̄');
      expect('aṃ̄'.toGujaratiFromIast(), 'અં̄');
    });

    test('nasal signs accept following Vedic accent marks', () {
      expect('aṁ̀'.toDevanagariFromIast(), 'अं॒');
      expect('aṃ́'.toDevanagariFromIast(), 'अं॑');
      expect('áṃ̀'.toDevanagariFromIast(), 'अं॒॑');
      expect('aham̐̀'.toDevanagariFromIast(), 'अहᳪ॒');
      expect('aṁ̀'.toGujaratiFromIast(), 'અં॒');
      expect('aṃ́'.toGujaratiFromIast(), 'અં॑');
      expect('áṃ̀'.toGujaratiFromIast(), 'અં॒॑');
      expect('aham̐̀'.toGujaratiFromIast(), 'અહᳪ॒');
    });

    test('initial dependent nasal uses dotted-circle carrier', () {
      // Not a dangling ं, not a partial Latin ṃ + Indic rest.
      expect('ṁaṅgala'.toDevanagariFromIast(), '◌ंअङ्गल');
      expect('m\u0307aṅgala'.toDevanagariFromIast(), '◌ंअङ्गल');
      expect('ṁaṅgala'.toGujaratiFromIast(), '◌ંઅઙ્ગલ');
      expect('m̐tra'.toDevanagariFromIast(), '◌ᳪत्र');
      expect('m̐tra'.toGujaratiFromIast(), '◌ᳪત્ર');
      // Post-vocalic nasals remain ordinary dependent marks.
      expect('aṁ'.toDevanagariFromIast(), 'अं');
      expect('aham̐'.toDevanagariFromIast(), 'अहᳪ');
      expect('maṅgala'.toDevanagariFromIast(), 'मङ्गल');
    });

    test('unsupported underline marks are preserved (exact round-trip)', () {
      expect('a\u0331tman'.toDevanagariFromIast(), 'अ\u0331त्मन्');
      expect('a\u0332nanta'.toDevanagariFromIast(), 'अ\u0332नन्त');
      expect('a\u0331tman'.toGujaratiFromIast(), 'અ\u0331ત્મન્');
      expect('a\u0332nanta'.toGujaratiFromIast(), 'અ\u0332નન્ત');
    });

    test('ṡ and ṙ are documented approximations to plain s/r', () {
      expect('ṡakti'.toDevanagariFromIast(options: extendedDev), 'सक्ति');
      expect('ṙṣi'.toDevanagariFromIast(options: extendedDev), 'र्षि');
      expect('sakti'.toDevanagariFromIast(), 'सक्ति');
      expect('rṣi'.toDevanagariFromIast(), 'र्षि');
    });

    test('ḫ / k͟h / x collapse remains intentional', () {
      expect('ḫāna'.toDevanagariFromIast(options: extendedDev), 'ख़ान');
      expect('k͟hāna'.toDevanagariFromIast(options: extendedDev), 'ख़ान');
      expect('xaṇḍa'.toDevanagariFromIast(options: extendedDev), 'ख़ण्ड');
    });
  });

  group('Vedic combining mark order', () {
    test('visarga before accent (matra → bindu → svara)', () {
      final a = 'vasóḥ'.toDevanagariFromIast();
      expect(a, 'वसोः॑');
      final codes = a.runes.toList();
      final visarga = codes.indexOf(0x0903);
      final udatta = codes.indexOf(0x0951);
      expect(visarga, greaterThan(-1));
      expect(udatta, greaterThan(-1));
      expect(visarga, lessThan(udatta));
    });

    test('soḥ́ has correct order', () {
      expect('soḥ́'.toDevanagariFromIast(), 'सोः॑');
      expect('sóḥ'.toDevanagariFromIast(), 'सोः॑');
    });
  });

  group('Dravidian / Arabic rare letters', () {
    test('ḻ is retroflex lateral ऴ / ળ, never ल̱', () {
      expect('ḻīlā'.toDevanagariFromIast(options: extendedDev), 'ऴीला');
      expect('ḻa'.toDevanagariFromIast(options: extendedDev), 'ऴ');
      expect(
        'l\u0331īlā'.toDevanagariFromIast(options: extendedDev),
        'ऴीला',
      ); // NFD form
      expect('ḻīlā'.toGujaratiFromIast(options: extendedGuj), 'ળીલા');
      expect('ḻa'.toGujaratiFromIast(options: extendedGuj), 'ળ');
    });

    test('ḫ is ख़ / ખ઼, never ह̮', () {
      expect('ḫāna'.toDevanagariFromIast(options: extendedDev), 'ख़ान');
      expect('ḫa'.toDevanagariFromIast(options: extendedDev), 'ख़');
      expect(
        'h\u032Eāna'.toDevanagariFromIast(options: extendedDev),
        'ख़ान',
      ); // NFD form
      expect('ḫāna'.toGujaratiFromIast(options: extendedGuj), 'ખ઼ાન');
      expect('ḫa'.toGujaratiFromIast(options: extendedGuj), 'ખ઼');
    });

    test('ṟ and ṉ Dravidian alveolar forms', () {
      expect('ṟa'.toDevanagariFromIast(options: extendedDev), 'ऱ');
      expect('ṉa'.toDevanagariFromIast(options: extendedDev), 'ऩ');
      expect('r\u0331a'.toDevanagariFromIast(options: extendedDev), 'ऱ');
      expect('n\u0331a'.toDevanagariFromIast(options: extendedDev), 'ऩ');
      expect('ṟa'.toGujaratiFromIast(options: extendedGuj), 'ર઼');
      expect('ṉa'.toGujaratiFromIast(options: extendedGuj), 'ન઼');
    });
  });

  group('canonical reverse transliteration', () {
    test('consumes decomposed Deva and Gujr nukta consonants', () {
      expect('ऴीला'.toCanonicalIastFromDevanagari(), 'ḻīlā');
      expect('ऴक्ष्मी'.toCanonicalIastFromDevanagari(), 'ḻakṣmī');
      expect('બ઼ક્તિ'.toCanonicalIastFromGujarati(), 'ɓakti');
      expect('ક્બ઼'.toCanonicalIastFromGujarati(), 'kɓa');
    });

    test('distinguishes chandrabindu from Vedic anusvara bahirgomukha', () {
      expect('चाँद'.toCanonicalIastFromDevanagari(), 'cā̐da');
      expect('माँ'.toCanonicalIastFromDevanagari(), 'mā̐');
      expect('ચાઁદ'.toCanonicalIastFromGujarati(), 'cā̐da');
      expect('માઁ'.toCanonicalIastFromGujarati(), 'mā̐');
      expect('अहᳪ'.toCanonicalIastFromDevanagari(), 'aham̐');
      expect('ओᳪ'.toCanonicalIastFromDevanagari(), 'om̐');
      expect('◌ᳪत्र'.toCanonicalIastFromDevanagari(), '◌m̐tra');
    });

    test('moves Vedic accents from bindu or visarga back to the vowel', () {
      expect('वः॑'.toCanonicalIastFromDevanagari(), 'váḥ');
      expect('वसोः॑'.toCanonicalIastFromDevanagari(), 'vasóḥ');
      expect('जुष्टं॑'.toCanonicalIastFromDevanagari(), 'juṣṭáṃ');
      expect('विश्वायुः॒'.toCanonicalIastFromDevanagari(), 'viśvāyùḥ');
      expect('माघशᳪ॑सो'.toCanonicalIastFromDevanagari(), 'māghaśám̐so');
      expect('प्रत्यु॑ष्टᳪ॒'.toCanonicalIastFromDevanagari(), 'pratyúṣṭàm̐');
    });

    test('maps dandas to Latin fixture pipes', () {
      expect('राम।'.toCanonicalIastFromDevanagari(), 'rāma|');
      expect('राम।।'.toCanonicalIastFromDevanagari(), 'rāma||');
      expect('राम॥'.toCanonicalIastFromDevanagari(), 'rāma||');
    });
  });

  group('profile boundaries and contextual extended forms', () {
    test('strict IAST does not use extended consonant interpretations', () {
      const strictDeva = IastToDevanagariOptions(
        profile: DevanagariRomanizationProfile.strictIast,
      );
      const strictGujr = IastToGujaratiOptions(
        profile: GujaratiRomanizationProfile.strictIast,
      );
      expect('ḷa'.toDevanagariFromIast(options: strictDeva), 'ऌअ');
      expect('ḷa'.toGujaratiFromIast(options: strictGujr), 'ઌઅ');
      expect('xaṇḍa'.toDevanagariFromIast(options: strictDeva), 'xअण्ड');
      expect('xaṇḍa'.toGujaratiFromIast(options: strictGujr), 'xઅણ્ડ');
    });

    test('extended profiles recognize consonantal flap in laṛkā', () {
      const devaExtended = IastToDevanagariOptions(
        profile: DevanagariRomanizationProfile.extendedIndic,
      );
      const gujrExtended = IastToGujaratiOptions(
        profile: GujaratiRomanizationProfile.extendedIndic,
      );
      expect('laṛkā'.toDevanagariFromIast(options: devaExtended), 'लड़का');
      expect('laṛkā'.toGujaratiFromIast(options: gujrExtended), 'લડ઼કા');
    });
  });

  group('Latn IAST transcription', () {
    test('ḫ and k͟h aliases both transcribe as kh', () {
      expect('ḫāna'.toPlainEnglishFromIast(), 'khan');
      expect('k͟hāna'.toPlainEnglishFromIast(), 'khan');
    });

    test('Hunterian visarga absorption and schwa handling stay natural', () {
      const hunterian = IastPlainEnglishOptions(
        profile: PlainEnglishRomanizationProfile.hunterian,
      );
      expect('duḥkha'.toPlainEnglishFromIast(options: hunterian), 'dukh');
      expect(
        'Hariprasāda'.toPlainEnglishFromIast(options: hunterian),
        'Hariprasad',
      );
      expect(
        'Kṛṣṇadāsa'.toPlainEnglishFromIast(options: hunterian),
        'Krishnadas',
      );
    });
  });
}
