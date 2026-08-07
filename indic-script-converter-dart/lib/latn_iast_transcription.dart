// ignore_for_file: avoid_print

// latn_iast_transcription.dart
import 'transliteration_core.dart';
//
// A single, comprehensive `String` extension that converts IAST
// (International Alphabet of Sanskrit Transliteration) text into a
// readable, "plain English" approximation.
//
// This file merges the ideas found across several independent drafts:
//   - A configurable options object (FinalAPolicy / JnaPolicy) instead of
//     a single boolean flag, so callers can choose scholarly, Hindi-style,
//     or a balanced "smart" output.
//   - Support for BOTH precomposed IAST characters (ā, ṛ, ṣ, ...) AND
//     decomposed combining-mark forms (a + ̄, r + ̥, s + ̣, ...), since
//     real-world text mixes both.
//   - Word-aware processing that preserves spaces, punctuation and
//     hyphenation, while making the "drop the trailing schwa" decision
//     based on each word's *original* ending (so a genuinely long final
//     'ā' is never mistaken for the droppable short 'a').
//   - Special-cased "jñ" handling (→ gy / jny / jn, configurable) since
//     this conjunct is not simply the concatenation of its parts.
//   - Contextual assimilation of anusvāra (ṃ / ṁ) to 'n' or 'm' depending
//     on the following consonant (saṃskāra → sanskara, oṃ → om).
//   - Avagraha (’ ʼ ' ऽ) removal, including the "so'ham → soham" case.
//   - Optional c → ch / ch → chh expansion, matching how IAST 'c'
//     ("ch" sound) and aspirated 'ch' are usually rendered in English.
//
// NOTE: "Plain English" spelling of Sanskrit is not a single standard.
// Some words conventionally keep their final 'a' in English
// (Krishna, Dharma, Surya, Ganga) while many everyday words drop it in
// Hindi-influenced spelling (vrata → vrat, Rāma → Ram). The `smart`
// FinalAPolicy below tries to balance both using phonotactic heuristics.
// Use `FinalAPolicy.keep` for scholarly
// output, or `FinalAPolicy.drop` for aggressive Hindi-style romanization.

/// Controls how the trailing inherent short "a" (the Sanskrit schwa) is
/// handled at the end of each word.
enum FinalAPolicy {
  /// Never remove a trailing short "a".
  /// Rāma → Rama, vrata → vrata, Kṛṣṇa → Krishna
  keep,

  /// Always remove a trailing short "a" that follows a consonant.
  /// Rāma → Ram, vrata → vrat, Kṛṣṇa → Krishn
  drop,

  /// Balanced, "practical Indian-English" style (default):
  /// vrata → vrat, Rāma → Ram, Śiva → Shiv, Lakṣmaṇa → Lakshman,
  /// but Kṛṣṇa → Krishna and Sūrya → Surya are kept natural-looking
  /// via phonotactic heuristics.
  smart,
}

/// Backward-compatible alias for code importing this file directly.
typedef RomanizationProfile = PlainEnglishRomanizationProfile;

/// Controls how the "jñ" conjunct (e.g. jñāna, yajña) is rendered.
enum JnaPolicy {
  /// jñāna → gyan, yajña → yagya  (most common spoken/Hindi spelling)
  gya,

  /// jñāna → jnyana, yajña → yajnya
  jnya,

  /// jñāna → jnan, yajña → yajn after smart final-a handling
  jna,
}

/// Controls how standalone "ñ" is rendered when it is not part of "jñ".
enum NyaPolicy {
  /// ñāna → nana / nan after final-a handling.
  na,

  /// ñāna → nyana / nyan after final-a handling.
  nya,

  /// ñāna → gnana / gnan after final-a handling.
  gna,
}

/// Controls how broadly Latin transliteration variants are interpreted.
enum PlainEnglishRomanizationProfile {
  /// Interpret the input as classical Sanskrit IAST first. This is the
  /// safest mode for scholarly Sanskrit transliteration.
  strictIast,

  /// Accept a broader Indic/ISO-style Latin inventory, including some
  /// regional forms that are not part of classical IAST.
  extendedIndic,

  /// Standard Romanization system officially adopted by the Government of India.
  /// Simplifies all Indic diacritics, dental/retroflex distinctions, and maps
  /// conjuncts/vowels to their common Indian English spellings.
  hunterian,
}

/// Controls how the glottal-stop symbol `ʔ` is rendered.
enum GlottalStopPolicy {
  /// Drop the symbol entirely for cleaner plain-English output.
  remove,

  /// Render the symbol as an ASCII apostrophe.
  apostrophe,
}

/// Tunable options for [IastToPlainEnglish.toPlainEnglishFromIast].
class IastPlainEnglishOptions {
  const IastPlainEnglishOptions({
    this.finalA = FinalAPolicy.smart,
    this.jna = JnaPolicy.gya,
    this.nya = NyaPolicy.na,
    this.profile = PlainEnglishRomanizationProfile.extendedIndic,
    this.glottalStop = GlottalStopPolicy.remove,
    this.convertCToCh = true,
    this.assimilateAnusvara = true,
    this.removeAvagraha = true,
    this.collapseWhitespace = false,
    // Hunterian-only features default OFF so strictIast / extendedIndic do
    // not silently apply lossy Hunterian transforms.
    // They auto-enable when [profile] is [PlainEnglishRomanizationProfile.hunterian].
    this.enableInternalSchwaSyncope = false,
    this.useWForVAfterConsonants = false,
    this.preserveVedicAccentMarks = false,
    this.keepFinalAForWords = const {},
  });

  /// How to handle the trailing inherent "a". See [FinalAPolicy].
  final FinalAPolicy finalA;

  /// How to render the "jñ" conjunct. See [JnaPolicy].
  final JnaPolicy jna;

  /// How to render standalone "ñ". See [NyaPolicy].
  final NyaPolicy nya;

  /// Whether to stay strict to Sanskrit IAST or accept broader Indic
  /// Romanization variants. See [PlainEnglishRomanizationProfile].
  final PlainEnglishRomanizationProfile profile;

  /// How to render the glottal-stop symbol `ʔ`.
  final GlottalStopPolicy glottalStop;

  /// IAST "c" is pronounced like English "ch" (candra → chandra).
  /// When true, plain "c" becomes "ch" and an existing "ch" (the
  /// aspirated affricate) becomes "chh" so the two stay distinguishable.
  final bool convertCToCh;

  /// Assimilate anusvāra (ṃ / ṁ) to 'n' or 'm' based on the following
  /// consonant, e.g. saṃkalpa → sankalpa, saṃskāra → sanskara,
  /// Siṃha → Sinha, oṃ → om.
  final bool assimilateAnusvara;

  /// Strip avagraha marks (’ ‘ ʼ ʹ ऽ) and apostrophes between letters,
  /// e.g. so'ham → soham.
  final bool removeAvagraha;

  /// Collapse runs of whitespace into single spaces and trim the result.
  final bool collapseWhitespace;

  /// Drop middle short 'a' in compounds under Hunterian rules.
  final bool enableInternalSchwaSyncope;

  /// Map 'v' to 'w' when following a consonant under Hunterian rules.
  final bool useWForVAfterConsonants;

  /// Keep Vedic accents in the output.
  final bool preserveVedicAccentMarks;

  /// Optional caller-supplied overrides for [FinalAPolicy.smart]. The
  /// default algorithm is rule-based; this set exists only if a caller
  /// wants to force particular conventional spellings.
  final Set<String> keepFinalAForWords;
}

extension IastToPlainEnglish on String {
  /// Converts an IAST string to a readable, plain-English approximation.
  ///
  /// ```dart
  /// 'Kṛṣṇa'.toPlainEnglishFromIast();                  // 'Krishna'
  /// 'vrata'.toPlainEnglishFromIast();                  // 'vrat'
  /// 'Hare Kṛṣṇa, Rāma-Rāma!'.toPlainEnglishFromIast(); // 'Hare Krishna, Ram-Ram!'
  /// 'Rāma'.toPlainEnglishFromIast(
  ///   options: const IastPlainEnglishOptions(finalA: FinalAPolicy.keep),
  /// ); // 'Rama'
  /// ```
  String toPlainEnglishFromIast({
    IastPlainEnglishOptions options = const IastPlainEnglishOptions(),
  }) =>
      _IastPlainEnglish.convert(this, options);
}

/// Implementation details. Kept private to avoid polluting the global
/// namespace; access everything through [IastToPlainEnglish].
class _IastPlainEnglish {
  _IastPlainEnglish._();

  // Matches a run of Latin letters that may make up an IAST word,
  // including precomposed diacritics (Latin-1 Supplement, Latin
  // Extended-A, Latin Extended Additional) and decomposed combining
  // marks (U+0300-U+036F). Everything else (spaces, punctuation,
  // digits) is left untouched.
  // Apostrophe / avagraha characters that are simply dropped.
  static final RegExp _avagrahaChars = RegExp('[ऽ’‘ʼʹ]');

  // A plain ASCII apostrophe sitting *between two IAST letters* is an
  // avagraha too (so'ham → soham); a leading/trailing one is left alone
  // since it's more likely to be a real quotation mark.
  static final RegExp _innerApostrophe = RegExp(
    r"([A-Za-z\u00C0-\u00FF\u0100-\u024F\u0250-\u02FF\u1E00-\u1EFF])'(?=[A-Za-z\u00C0-\u00FF\u0100-\u024F\u0250-\u02FF\u1E00-\u1EFF])",
  );

  static const Set<String> _vowels = {'a', 'e', 'i', 'o', 'u'};

  /// Private-use placeholders used to keep the "ch → chh" / "c → ch"
  /// expansion from re-matching its own output.
  static const String _phChh = '\uE010';
  static const String _phChhCap = '\uE011';
  static const String _phChhAll = '\uE012';

  static String convert(String input, IastPlainEnglishOptions options) {
    if (input.isEmpty) return input;

    var text = input;

    if (options.removeAvagraha) {
      text = text.replaceAll(_avagrahaChars, '');
      text = text.replaceAllMapped(_innerApostrophe, (m) => m.group(1)!);
    }

    final buf = StringBuffer();
    final runes = text.runes.toList();
    var i = 0;
    while (i < runes.length) {
      final rune = runes[i];
      if (!options.preserveVedicAccentMarks && isEncodedVedicMark(rune)) {
        i += 1;
        continue;
      }
      if (_isLatinRune(rune)) {
        final start = i;
        i += 1;
        while (i < runes.length && _isLatinRune(runes[i])) {
          i += 1;
        }
        final token = String.fromCharCodes(runes.sublist(start, i));
        buf.write(_convertLatinWord(token, options));
        continue;
      }
      buf.write(String.fromCharCode(rune));
      i += 1;
    }
    text = buf.toString();

    if (options.collapseWhitespace) {
      text = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    }

    return text;
  }

  static bool _isLatinRune(int rune) =>
      (rune >= 0x41 && rune <= 0x5A) ||
      (rune >= 0x61 && rune <= 0x7A) ||
      (rune >= 0x00C0 && rune <= 0x00FF) ||
      (rune >= 0x0100 && rune <= 0x024F) ||
      (rune >= 0x0250 && rune <= 0x02FF) ||
      (rune >= 0x1E00 && rune <= 0x1EFF) ||
      isUnicodeCombiningMark(rune);

  /// Converts a single IAST "word" (a maximal run of letters/diacritics).
  static String _convertLatinWord(
    String word,
    IastPlainEnglishOptions options,
  ) {
    if (word.isEmpty) return word;

    final isAllUpper = _isAllUpperWord(word);

    // Decide *now*, before any folding, whether this word ends in a
    // genuinely short "a"/"A" (as opposed to a long "ā"/"Ā" or a
    // decomposed "a" + combining macron, both of which end in a
    // combining mark, not a bare 'a'/'A').
    final lastChar = word[word.length - 1];
    final endsInShortA = lastChar == 'a' || lastChar == 'A';
    final keepFinalAForNoisyLatin = _containsNoisyLatinLetter(word);

    var w = normalizeUnicode(
      word,
      UnicodeNormalizationForm.nfd,
    );

    // 1. Romanization profile (Hunterian visarga absorption lives here —
    //    no global duḥkh special-case leaking into strictIast).
    w = _applyPlainEnglishRomanizationProfile(w, options.profile);

    // 2. jñ handling
    w = _applyJna(w, options.jna);

    // 3. Anusvāra/candrabindu assimilation (needs the *following*
    //    consonant, so it must run before that consonant is folded).
    if (options.assimilateAnusvara) {
      w = _resolveAnusvara(w);
    } else {
      w = w.replaceAll(RegExp('[ṃṁ]'), 'm').replaceAll(RegExp('[ṂṀ]'), 'M');
    }

    // 4. c → ch / ch → chh (IAST "c" sounds like English "ch").
    if (options.convertCToCh) {
      w = _expandC(w);
    }

    // 4b. Internal schwa syncope is intentionally opt-in; automatic deletion
    // too easily creates malformed clusters in ordinary names and compounds.
    final applySyncope = options.enableInternalSchwaSyncope;
    if (applySyncope && w.length > 5) {
      w = _applyInternalSchwaSyncope(w);
    }

    // 5. Fold all remaining IAST letters (precomposed + decomposed) to
    //    their plain-English equivalents.
    w = _foldLetters(
      w,
      options.glottalStop,
      options.nya,
      options.preserveVedicAccentMarks,
    );

    // 6. Hunterian v -> w substitution after consonants (Sarasvati -> Saraswati)
    // Auto-on for hunterian profile; opt-in otherwise.
    final applyWForV = options.useWForVAfterConsonants ||
        options.profile == PlainEnglishRomanizationProfile.hunterian;
    if (applyWForV) {
      w = w.replaceAllMapped(
        RegExp(r'([^aeiou\s])v([aāiīuūeēoō])', caseSensitive: false),
        (m) => '${m.group(1)}w${m.group(2)}',
      );
    }

    // 8. Trailing-schwa handling, based on the *original* word ending.
    if (options.finalA != FinalAPolicy.keep &&
        endsInShortA &&
        !keepFinalAForNoisyLatin) {
      w = _applyFinalARule(w, options);
    }

    if (isAllUpper) {
      w = w.toUpperCase();
    }

    return w;
  }

  static bool _isAllUpperWord(String word) {
    var casedCount = 0;
    var upperCount = 0;

    for (final rune in word.runes) {
      if (_isCombiningMark(rune)) continue;
      final ch = String.fromCharCode(rune);
      final upper = ch.toUpperCase();
      final lower = ch.toLowerCase();
      if (upper == lower) continue;
      casedCount += 1;
      if (ch == upper) upperCount += 1;
    }

    return casedCount > 1 && casedCount == upperCount;
  }

  static bool _containsNoisyLatinLetter(String word) {
    const noisyLatin = {
      'ç',
      'Ç',
      'ã',
      'Ã',
      'ï',
      'Ï',
      'œ',
      'Œ',
      'ø',
      'Ø',
      'ł',
      'Ł',
      'ß',
      'þ',
      'Þ',
      'ð',
      'Ð',
    };
    final hasNoisyLatin = word.runes
        .map(String.fromCharCode)
        .any((ch) => noisyLatin.contains(ch));
    if (hasNoisyLatin) return true;

    return false;
  }

  // ---------------------------------------------------------------------
  // Romanization profile handling
  // ---------------------------------------------------------------------

  static String _applyPlainEnglishRomanizationProfile(
    String word,
    PlainEnglishRomanizationProfile profile,
  ) {
    word = word
        // Default practical policy: x is treated as the kh sound in
        // plain-English output. q is preserved as q.
        .replaceAllMapped(RegExp('x'), (_) => 'kh')
        .replaceAllMapped(RegExp('X'), (_) => 'Kh')
        // NFD ḫ is h + breve below. Treat it as the same kh alias as k͟h.
        .replaceAllMapped(RegExp('h\u032E'), (_) => 'kh')
        .replaceAllMapped(RegExp('H\u032E'), (_) => 'Kh');

    // Profiles are separated — strictIast stops here.
    if (profile == PlainEnglishRomanizationProfile.strictIast) return word;

    // extendedIndic + hunterian: Hindi flap ड़/ढ़ before a vowel → r/rh.
    word = word
        .replaceAllMapped(RegExp('ṛh(?=[aāiīuūeêĕoôŏy])'), (_) => 'rh')
        .replaceAllMapped(RegExp('Ṛh(?=[aāiīuūeêĕoôŏy])'), (_) => 'Rh')
        .replaceAllMapped(RegExp('ṛ(?=[aāiīuūeêĕoôŏy])'), (_) => 'r')
        .replaceAllMapped(RegExp('Ṛ(?=[aāiīuūeêĕoôŏy])'), (_) => 'R');

    // Hunterian-only: absorb visarga into following consonant (duḥkha → dukh…).
    if (profile == PlainEnglishRomanizationProfile.hunterian) {
      word = word
          .replaceAllMapped(
              RegExp('ḥ([kKgGcCjJtTdDpPbBsSśŚṣṢhH])'), (m) => m.group(1)!)
          .replaceAllMapped(
              RegExp('Ḥ([kKgGcCjJtTdDpPbBsSśŚṣṢhH])'), (m) => m.group(1)!)
          .replaceAllMapped(
              RegExp('h\u0323([kKgGcCjJtTdDpPbBsSśŚṣṢhH])'), (m) => m.group(1)!)
          .replaceAllMapped(RegExp('H\u0323([kKgGcCjJtTdDpPbBsSśŚṣṢhH])'),
              (m) => m.group(1)!);
    }

    return word;
  }

  /// Rule-based internal schwa syncope for Indo-Aryan words (Gorakhapura -> Gorakhpura -> Gorakhpur).
  static String _applyInternalSchwaSyncope(String word) {
    if (word.length <= 5) return word;

    // Segment the word into alternating consonant/vowel groups
    final segments = <_Seg>[];
    var i = 0;
    final runes = word.runes.toList();
    var current = StringBuffer();
    bool? parsingVowel;

    while (i < runes.length) {
      final rune = runes[i];
      final ch = String.fromCharCode(rune);
      final isMark = rune >= 0x0300 && rune <= 0x036F;

      bool isV;
      if (isMark) {
        isV = parsingVowel ?? false;
      } else {
        isV = _isIastVowelChar(rune);
      }

      if (parsingVowel == null) {
        parsingVowel = isV;
        current.write(ch);
      } else if (parsingVowel == isV) {
        current.write(ch);
      } else {
        segments.add(_Seg(current.toString(), parsingVowel));
        current = StringBuffer()..write(ch);
        parsingVowel = isV;
      }
      i++;
    }
    if (current.isNotEmpty && parsingVowel != null) {
      segments.add(_Seg(current.toString(), parsingVowel));
    }

    // Identify indices of vowel segments
    final vowelIndices = <int>[];
    for (var k = 0; k < segments.length; k++) {
      if (segments[k].isVowel) {
        vowelIndices.add(k);
      }
    }

    if (vowelIndices.length < 3) return word;

    // Process candidate vowels from right to left, excluding first and last
    for (var k = vowelIndices.length - 2; k >= 1; k--) {
      final segIdx = vowelIndices[k];
      final candidateSeg = segments[segIdx];

      if (!_isShortASchwa(candidateSeg.text)) continue;

      if (segIdx - 1 < 0 || segIdx + 1 >= segments.length) continue;

      final prevConsSeg = segments[segIdx - 1];
      final nextConsSeg = segments[segIdx + 1];

      final prevCount = _countConsonants(prevConsSeg.text);
      final nextCount = _countConsonants(nextConsSeg.text);

      // Block syncope if it creates a cluster of 3 or more consonants
      if (prevCount + nextCount > 2) {
        continue;
      }

      candidateSeg.text = '';
      prevConsSeg.text = prevConsSeg.text + nextConsSeg.text;
      nextConsSeg.text = '';
    }

    final buf = StringBuffer();
    for (final seg in segments) {
      buf.write(seg.text);
    }
    return buf.toString();
  }

  static bool _isIastVowelChar(int rune) {
    final ch = String.fromCharCode(rune).toLowerCase();
    return const {
      'a',
      'ā',
      'i',
      'ī',
      'u',
      'ū',
      'e',
      'o',
      'ṛ',
      'ṝ',
      'ḷ',
      'ḹ',
      'æ',
      'œ',
    }.contains(ch);
  }

  static bool _isShortASchwa(String text) {
    final clean = text.replaceAll(RegExp(r'[\u0300-\u036F]'), '').toLowerCase();
    return clean == 'a';
  }

  static int _countConsonants(String cluster) {
    var s = cluster.toLowerCase();
    s = s
        .replaceAll('kh', 'K')
        .replaceAll('gh', 'G')
        .replaceAll('ch', 'C')
        .replaceAll('jh', 'J')
        .replaceAll('th', 'T')
        .replaceAll('dh', 'D')
        .replaceAll('ph', 'P')
        .replaceAll('bh', 'B')
        .replaceAll('sh', 'S')
        .replaceAll('zh', 'Z');
    return s.length;
  }

  // ---------------------------------------------------------------------
  // jñ handling
  // ---------------------------------------------------------------------

  static String _applyJna(String word, JnaPolicy policy) {
    late final Map<String, String> reps;
    switch (policy) {
      case JnaPolicy.gya:
        reps = const {
          'jñ': 'gy',
          'Jñ': 'Gy',
          'JÑ': 'GY',
          'jÑ': 'gy',
          'jn\u0303': 'gy',
          'Jn\u0303': 'Gy',
          'JN\u0303': 'GY',
        };
        break;
      case JnaPolicy.jnya:
        reps = const {
          'jñ': 'jny',
          'Jñ': 'Jny',
          'JÑ': 'JNY',
          'jÑ': 'jny',
          'jn\u0303': 'jny',
          'Jn\u0303': 'Jny',
          'JN\u0303': 'JNY',
        };
        break;
      case JnaPolicy.jna:
        reps = const {
          'jñ': 'jn',
          'Jñ': 'Jn',
          'JÑ': 'JN',
          'jÑ': 'jn',
          'jn\u0303': 'jn',
          'Jn\u0303': 'Jn',
          'JN\u0303': 'JN',
        };
        break;
    }
    for (final e in reps.entries) {
      word = word.replaceAll(e.key, e.value);
    }
    return word;
  }

  // ---------------------------------------------------------------------
  // Anusvāra / candrabindu assimilation
  // ---------------------------------------------------------------------

  // Matches an anusvāra/candrabindu (precomposed ṃ ṁ Ṃ Ṁ, or a decomposed
  // "m"/"M" + dot-above/dot-below/tilde-above) optionally followed by the
  // next letter, which is consumed (and re-emitted) so its class can be
  // inspected.
  static final RegExp _anusvaraPattern = RegExp(
    r'([mM](?:\u0307|\u0323|\u0310)|[ṃṁṂṀ])(.)?',
  );

  static String _resolveAnusvara(String word) =>
      word.replaceAllMapped(_anusvaraPattern, (m) {
        final marker = m.group(1)!;
        final next = m.group(2);
        final isUpper =
            marker == marker.toUpperCase() && marker != marker.toLowerCase();
        if (m.start == 0 && marker.contains('\u0310')) {
          return (isUpper ? 'M' : 'm') + (next ?? '');
        }
        final nasal = isUpper
            ? _anusvaraNasal(next).toUpperCase()
            : _anusvaraNasal(next).toLowerCase();
        return nasal + (next ?? '');
      });

  /// Returns 'n' or 'N'/'m' or 'M' depending on the consonant class of
  /// [next] (case of the returned letter mirrors [next] when possible,
  /// but callers normalize case afterward).
  static String _anusvaraNasal(String? next) {
    if (next == null) return 'm'; // word-final anusvāra: oṃ → om
    final lower = next.toLowerCase();

    const velarsPalatalsRetroflexesDentals = {
      'k',
      'g',
      'c',
      'j',
      'ṭ',
      'ḍ',
      't',
      'd',
      'n',
      'ṇ',
      'ṅ',
      'ñ',
    };
    const labials = {'p', 'b', 'm'};
    const sibilantsAndSemivowels = {'ś', 'ṣ', 's', 'h', 'y', 'v'};

    if (velarsPalatalsRetroflexesDentals.contains(lower)) return 'n';
    if (labials.contains(lower)) return 'm';
    if (sibilantsAndSemivowels.contains(lower)) return 'n';
    // Vowels, r, l, or anything else → default to 'm' (e.g. oṃ → om).
    return 'm';
  }

  // ---------------------------------------------------------------------
  // c → ch / ch → chh
  // ---------------------------------------------------------------------

  static String _expandC(String word) {
    var w = word;
    // Protect existing "ch"/"Ch"/"CH" so it isn't re-matched below.
    w = w
        .replaceAll('ch', _phChh)
        .replaceAll('Ch', _phChhCap)
        .replaceAll('CH', _phChhAll);
    // Plain IAST "c" sounds like English "ch".
    w = w.replaceAllMapped(RegExp('[cC]'), (m) => m[0] == 'C' ? 'Ch' : 'ch');
    // Restore the protected aspirated form as "chh".
    w = w
        .replaceAll(_phChh, 'chh')
        .replaceAll(_phChhCap, 'Chh')
        .replaceAll(_phChhAll, 'CHH');
    return w;
  }

  // ---------------------------------------------------------------------
  // Letter folding (precomposed + decomposed IAST → plain ASCII)
  // ---------------------------------------------------------------------

  static bool _isCombiningMark(int rune) => isUnicodeCombiningMark(rune);

  static bool _isEnglishVowel(String? ch) {
    if (ch == null) return false;
    final lower = ch.toLowerCase();
    return lower == 'a' ||
        lower == 'e' ||
        lower == 'i' ||
        lower == 'o' ||
        lower == 'u';
  }

  static bool _isVedicAccentRune(int rune) =>
      isEncodedVedicMark(rune) ||
      rune == 0x0301 ||
      rune == 0x0300 ||
      rune == 0x030D ||
      rune == 0x030E ||
      rune == 0x0302 ||
      rune == 0x0329 ||
      rune == 0x0331 ||
      rune == 0x0320;

  static String _foldLetters(
    String word,
    GlottalStopPolicy glottalStop,
    NyaPolicy nya,
    bool preserveVedic,
  ) {
    final runes = word.runes.toList();
    final buf = StringBuffer();
    var i = 0;
    String? prevChar;
    while (i < runes.length) {
      final base = String.fromCharCode(runes[i]);
      i += 1;
      final marks = <int>[];

      while (i < runes.length && _isCombiningMark(runes[i])) {
        marks.add(runes[i]);
        i += 1;
      }

      final nextBase = i < runes.length ? String.fromCharCode(runes[i]) : null;
      var folded =
          _foldMarkedBase(base, marks, glottalStop, nya, nextBase, prevChar);

      if (preserveVedic && _isVowelOutput(folded)) {
        for (final m in marks) {
          if (_isVedicAccentRune(m)) {
            folded += String.fromCharCode(m);
          }
        }
      }

      buf.write(folded);
      prevChar = folded.isNotEmpty ? folded.substring(folded.length - 1) : null;
    }
    return buf.toString();
  }

  static bool _isVowelOutput(String folded) {
    if (folded.isEmpty) return false;
    final first = folded[0].toLowerCase();
    if (_vowels.contains(first)) return true;
    final lower = folded.toLowerCase();
    return lower == 'ri' || lower == 'li';
  }

  /// Folds a base character plus any following combining marks as a single
  /// unit so decomposed IAST remains stable regardless of mark order.
  static String _foldMarkedBase(
    String base,
    List<int> marks,
    GlottalStopPolicy glottalStop,
    NyaPolicy nya,
    String? nextBase,
    String? prevChar,
  ) {
    if (marks.isEmpty) {
      return _foldPrecomposed(base, glottalStop, nya, nextBase, prevChar);
    }

    final foldedBase =
        _foldPrecomposed(base, glottalStop, nya, nextBase, prevChar);
    final lower = foldedBase.toLowerCase();
    final isUpper = foldedBase == foldedBase.toUpperCase() &&
        foldedBase != foldedBase.toLowerCase();
    // Keep as List so duplicate combining marks are not dropped.
    final markSet = marks;
    final hasDotBelow = markSet.contains(0x0323);
    final hasRingBelow = markSet.contains(0x0325);
    final hasDotAbove = markSet.contains(0x0307);
    final hasAcute = markSet.contains(0x0301);
    final hasNasal = markSet.contains(0x0303) || markSet.contains(0x0310);

    String? out;

    if (_vowels.contains(lower)) {
      out = lower;
      if (hasNasal && nextBase == null && _isLongA(base, markSet)) out = 'aa';
      if (hasNasal && _nasalizedVowelNeedsN(nextBase, prevChar)) {
        out = '$out' 'n';
      }
    } else {
      switch (lower) {
        case 'r':
          if (hasRingBelow) {
            out = 'ri';
          } else if (hasDotBelow) {
            out = _isEnglishVowel(prevChar) ? 'r' : 'ri';
          }
          break;
        case 'l':
          if (hasDotBelow || hasRingBelow) {
            out = _isVowelBase(nextBase, prevChar) ? 'l' : 'li';
          }
          break;
        case 's':
          if (hasAcute || hasDotBelow) out = 'sh';
          break;
        case 't':
          if (hasDotBelow) out = 't';
          break;
        case 'd':
          if (hasDotBelow) out = 'd';
          break;
        case 'n':
          if (hasDotAbove || hasDotBelow) out = 'n';
          if (hasNasal) out = _foldNya(nya);
          break;
        case 'h':
          if (hasDotBelow) out = 'h';
          break;
        case 'm':
          if (hasDotAbove || hasDotBelow || hasNasal) out = 'm';
          break;
      }
    }

    // Unknown combining sequences degrade to the folded base rather than
    // leaking raw marks into a "plain English" output string.
    out ??= _foldPrecomposed(base, glottalStop, nya, nextBase, prevChar);
    return _matchCase(isUpper, out);
  }

  static bool _nasalizedVowelNeedsN(String? nextBase, String? prevChar) {
    if (nextBase == null) return false;
    final next = _foldPrecomposed(
      nextBase,
      GlottalStopPolicy.remove,
      NyaPolicy.na,
      null,
      prevChar,
    ).toLowerCase();
    if (next.isEmpty || _vowels.contains(next)) return false;
    return !{'m', 'n'}.contains(next[0]);
  }

  static bool _isLongA(String base, List<int> markSet) =>
      base == 'ā' ||
      base == 'Ā' ||
      (base.toLowerCase() == 'a' && markSet.contains(0x0304));

  static bool _isVowelBase(String? base, String? prevChar) {
    if (base == null) return false;
    final folded = _foldPrecomposed(
      base,
      GlottalStopPolicy.remove,
      NyaPolicy.na,
      null,
      prevChar,
    ).toLowerCase();
    return folded.isNotEmpty && _vowels.contains(folded[0]);
  }

  static String _foldNya(NyaPolicy policy) => switch (policy) {
        NyaPolicy.na => 'n',
        NyaPolicy.nya => 'ny',
        NyaPolicy.gna => 'gn',
      };

  static String _matchCase(bool isUpper, String lower) {
    if (!isUpper || lower.isEmpty) return lower;
    return lower[0].toUpperCase() + lower.substring(1);
  }

  /// Folds a single precomposed IAST character. Anything not recognized
  /// (plain ASCII letters, already-handled anusvāra, etc.) passes through
  /// unchanged.
  static String _foldPrecomposed(
    String ch,
    GlottalStopPolicy glottalStop,
    NyaPolicy nya, [
    String? nextBase,
    String? prevChar,
  ]) {
    switch (ch) {
      case 'ā':
        return 'a';
      case 'Ā':
        return 'A';
      case 'ī':
        return 'i';
      case 'Ī':
        return 'I';
      case 'ū':
        return 'u';
      case 'Ū':
        return 'U';
      case 'Ă':
      case 'À':
      case 'Á':
      case 'Â':
      case 'Ã':
      case 'Ä':
      case 'Å':
        return 'A';
      case 'ă':
      case 'à':
      case 'á':
      case 'â':
      case 'ã':
      case 'ä':
      case 'å':
        return 'a';
      case 'Æ':
      case 'Ǣ':
        return 'Ae';
      case 'Œ':
        return 'Oe';
      case 'æ':
      case 'ǣ':
        return 'ae';
      case 'œ':
        return 'oe';
      case 'Ĕ':
      case 'Ě':
      case 'Ē':
      case 'È':
      case 'É':
      case 'Ê':
      case 'Ë':
        return 'E';
      case 'ĕ':
      case 'ě':
      case 'ē':
      case 'è':
      case 'é':
      case 'ê':
      case 'ë':
        return 'e';
      case 'Ì':
      case 'Í':
      case 'Î':
      case 'Ï':
        return 'I';
      case 'ì':
      case 'í':
      case 'î':
      case 'ï':
        return 'i';
      case 'Ō':
      case 'Ŏ':
      case 'Ò':
      case 'Ó':
      case 'Ô':
      case 'Õ':
      case 'Ö':
      case 'Ø':
        return 'O';
      case 'ŏ':
      case 'ò':
      case 'ó':
      case 'ô':
      case 'õ':
      case 'ö':
      case 'ō':
      case 'ø':
        return 'o';
      case 'Ù':
      case 'Ú':
      case 'Û':
      case 'Ü':
        return 'U';
      case 'ù':
      case 'ú':
      case 'û':
      case 'ü':
        return 'u';

      case 'ṛ':
      case 'ṝ':
        return _isEnglishVowel(prevChar) ? 'r' : 'ri';
      case 'Ṛ':
      case 'Ṝ':
        return _isEnglishVowel(prevChar) ? 'R' : 'Ri';
      case 'ḷ':
        return _isVowelBase(nextBase, prevChar) ? 'l' : 'li';
      case 'Ḷ':
        return _isVowelBase(nextBase, prevChar) ? 'L' : 'Li';
      case 'ḹ':
        return 'li';
      case 'Ḹ':
        return 'Li';

      case 'ṅ':
        return 'n';
      case 'Ṅ':
        return 'N';
      case 'ŋ':
        return 'n';
      case 'Ŋ':
        return 'N';
      case 'ƞ':
        return 'n';
      case 'Ƞ':
        return 'N';
      case 'ñ':
        return _foldNya(nya);
      case 'Ñ':
        return _matchCase(true, _foldNya(nya));
      case 'ṇ':
        return 'n';
      case 'Ṇ':
        return 'N';
      case 'ṉ':
        return 'n';
      case 'Ṉ':
        return 'N';
      case 'ṙ':
        return 'r';
      case 'Ṙ':
        return 'R';
      case 'ç':
        return 'c';
      case 'Ç':
        return 'C';
      case 'ł':
        return 'l';
      case 'Ł':
        return 'L';
      case 'ß':
        return 'ss';
      case 'þ':
        return 'th';
      case 'Þ':
        return 'Th';
      case 'ð':
        return 'd';
      case 'Ð':
        return 'D';

      case 'ṭ':
        return 't';
      case 'Ṭ':
        return 'T';
      case 'ṯ':
        return 't';
      case 'Ṯ':
        return 'T';
      case 'ḳ':
      case 'ḵ':
        return 'k';
      case 'Ḳ':
      case 'Ḵ':
        return 'K';
      case 'ḍ':
        return 'd';
      case 'Ḍ':
        return 'D';
      case 'ḏ':
        return 'd';
      case 'Ḏ':
        return 'D';

      case 'ś':
        return 'sh';
      case 'Ś':
        return 'Sh';
      case 'ṣ':
        return 'sh';
      case 'Ṣ':
        return 'Sh';
      case 'ṡ':
        return 's';
      case 'Ṡ':
        return 'S';
      case 'ž':
        return 'zh';
      case 'Ž':
        return 'Zh';
      case 'ź':
      case 'ż':
        return 'z';
      case 'Ź':
      case 'Ż':
        return 'Z';
      case 'ẓ':
        return 'z';
      case 'Ẓ':
        return 'Z';
      case 'ẏ':
        return 'y';
      case 'Ẏ':
        return 'Y';
      case 'ḻ':
        return 'l';
      case 'Ḻ':
        return 'L';
      case 'ṟ':
        return 'r';
      case 'Ṟ':
        return 'R';
      case 'ġ':
      case 'ǧ':
        return 'g';
      case 'Ġ':
      case 'Ǧ':
        return 'G';
      case 'ɓ':
        return 'b';
      case 'Ɓ':
        return 'B';
      case 'ɗ':
        return 'd';
      case 'Ɗ':
        return 'D';

      case 'ḥ':
        return 'h';
      case 'Ḥ':
        return 'H';
      case 'ħ':
      case 'ḫ':
      case 'ẖ':
        return 'h';
      case 'Ħ':
      case 'Ḫ':
      case 'H̱':
        return 'H';

      // Anusvāra/candrabindu safety net (normally already resolved by
      // _resolveAnusvara, but kept for assimilateAnusvara: false).
      case 'ṃ':
        return 'm';
      case 'Ṃ':
        return 'M';
      case 'ṁ':
        return 'm';
      case 'Ṁ':
        return 'M';
      case 'ʔ':
        return switch (glottalStop) {
          GlottalStopPolicy.remove => '',
          GlottalStopPolicy.apostrophe => "'",
        };

      default:
        return ch;
    }
  }

  // ---------------------------------------------------------------------
  // Trailing schwa ("inherent a") handling
  // ---------------------------------------------------------------------

  static String _applyFinalARule(String word, IastPlainEnglishOptions options) {
    if (word.length <= 2) return word;

    final lower = word.toLowerCase();
    if (!lower.endsWith('a')) return word;

    final beforeA = lower[lower.length - 2];
    if (_vowels.contains(beforeA)) {
      return word; // e.g. ...aa, ...ea — leave alone
    }

    if (options.finalA == FinalAPolicy.drop) {
      return word.substring(0, word.length - 1);
    }

    // FinalAPolicy.smart
    if (options.keepFinalAForWords.contains(lower)) return word;

    if (lower.endsWith('moksha') ||
        lower.endsWith('vriksha') ||
        lower.endsWith('ashvattha') ||
        lower.endsWith('simha') ||
        lower.endsWith('sinha')) {
      return word;
    }

    // Productive glide endings usually keep the final schwa in plain
    // English spellings: yajña -> yagya, vākya -> vakya, putrāya -> putraya.
    if (lower.endsWith('ya')) return word;

    // Keep final "a" for plain "h" sound (preceded by vowel, e.g. moha, nigraha)
    if (lower.endsWith('ha') &&
        lower.length >= 3 &&
        _vowels.contains(lower[lower.length - 3])) {
      return word;
    }

    final withoutA = word.substring(0, word.length - 1);
    if (_leavesAwkwardFinalCluster(withoutA)) return word;

    return withoutA;
  }

  static bool _leavesAwkwardFinalCluster(String word) {
    final normalized = _normalizeFinalCluster(word.toLowerCase());
    final lastVowel = normalized.lastIndexOf(RegExp('[aeiou]'));
    final suffix =
        lastVowel >= 0 ? normalized.substring(lastVowel + 1) : normalized;

    if (suffix.length <= 1) return false;

    if (suffix == 'ng') return false; // Hunterian fix: panchang, satsang

    if (suffix.length >= 3) return true;

    const badTwoUnitSuffixes = {
      'tr',
      'dr',
      'gy',
      'kr',
      'gr',
      'jr',
      'rm',
      'hm',
      'ry',
      'ly',
      'ny',
      'my',
      'sv',
      'dv',
      'tv',
      'pn',
      'bn',
      'kn',
      'gn',
      'km',
      'gm',
      'pm',
      'bm',
      'tm',
      'dm',
      'dD',
      'hX',
    };

    if (badTwoUnitSuffixes.contains(suffix)) return true;

    if (RegExp(r'[CKSDTGHPBX][mnlrvy]$').hasMatch(suffix)) return true;

    return false;
  }

  static String _normalizeFinalCluster(String word) => word
      .replaceAll('ksh', 'K')
      .replaceAll('chh', 'H')
      .replaceAll('ch', 'C')
      .replaceAll('sh', 'S')
      .replaceAll('gh', 'G')
      .replaceAll('dh', 'D')
      .replaceAll('th', 'T')
      .replaceAll('ph', 'P')
      .replaceAll('bh', 'B')
      .replaceAll('kh', 'X');
}

class _Seg {
  _Seg(this.text, this.isVowel);
  String text;
  final bool isVowel;
}
