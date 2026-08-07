// ignore_for_file: avoid_print, curly_braces_in_flow_control_structures, require_trailing_commas

// latn_iast_to_deva.dart
import 'transliteration_core.dart';

//
// IAST and extended Indic Latin-to-Devanagari transliterator.
//
// Guarantees are profile-scoped:
//   - strictIast accepts the classical Sanskrit IAST inventory.
//   - iso15919Core accepts the explicitly implemented ISO-style table.
//   - extendedIndic accepts additional regional and compatibility aliases.
//
// Unicode input is normalized to NFD for parsing through
// `transliteration_core.dart`. Unknown combining marks are preserved or
// rejected according to policy; they are never silently discarded. Exact
// source code-point recovery is provided by `LosslessTransliterationResult`
// in the package-level API.

/// Romanization profile.
enum DevanagariRomanizationProfile {
  strictIast,
  iso15919Core,
  extendedIndic,
}

/// Backward-compatible alias for code importing this file directly.
typedef RomanizationProfile = DevanagariRomanizationProfile;

/// Controls how unknown Latin characters are handled.
enum IastToDevanagariUnknownLatinPolicy {
  passThrough,
  bracket,
  throwError,
}

/// Controls how digits are handled.
enum IastToDevanagariDigitPolicy {
  preserveAscii,
  convertToScript,
}

/// Controls how punctuation is handled.
enum IastToDevanagariPunctuationPolicy {
  preserve,
  indicDanda,
}

/// Controls how the OM symbol is handled.
enum IastToDevanagariOmPolicy {
  transliterateLetters,
  useOmSign,
}

/// Controls how to resolve the ambiguity of ḷ.
enum IastToDevanagariAmbiguousLPolicy {
  context,
  preferVocalic,
  preferConsonant,
}

/// Comprehensive options for [IastToDevanagariString.toDevanagariFromIast].
class IastToDevanagariOptions {
  const IastToDevanagariOptions({
    this.profile = DevanagariRomanizationProfile.extendedIndic,
    this.unknownLatinPolicy = IastToDevanagariUnknownLatinPolicy.passThrough,
    this.digitPolicy = IastToDevanagariDigitPolicy.preserveAscii,
    this.punctuationPolicy = IastToDevanagariPunctuationPolicy.preserve,
    this.omPolicy = IastToDevanagariOmPolicy.transliterateLetters,
    this.ambiguousLPolicy = IastToDevanagariAmbiguousLPolicy.context,
    this.acceptAsciiLongVowels = false,
    this.acceptPlainSh = true,
    this.acceptPlainXAsKha = true,
    this.acceptWAsVa = true,
    this.preserveVedicAccentMarks = true,
    this.collapseWhitespace = false,
    this.embedExactSourceMetadata = false,
  });

  final DevanagariRomanizationProfile profile;
  final IastToDevanagariUnknownLatinPolicy unknownLatinPolicy;
  final IastToDevanagariDigitPolicy digitPolicy;
  final IastToDevanagariPunctuationPolicy punctuationPolicy;
  final IastToDevanagariOmPolicy omPolicy;
  final IastToDevanagariAmbiguousLPolicy ambiguousLPolicy;
  final bool acceptAsciiLongVowels;
  final bool acceptPlainSh;
  final bool acceptPlainXAsKha;
  final bool acceptWAsVa;
  final bool preserveVedicAccentMarks;
  final bool collapseWhitespace;

  /// Appends an invisible, checksummed Unicode-tag trailer containing the
  /// exact original Latin source. Enable this only when the returned script
  /// string must later recover case, aliases, normalization form, punctuation,
  /// and every original UTF-16 code unit exactly.
  final bool embedExactSourceMetadata;
}

extension IastToDevanagariString on String {
  /// Converts IAST/ISO Latin text to Devanagari script.
  String toDevanagariFromIast({
    IastToDevanagariOptions options = const IastToDevanagariOptions(),
  }) =>
      _IastToDevanagariConverter.convert(this, options);
}

class _IastToDevanagariConverter {
  _IastToDevanagariConverter._();

  static const String virama = '्';
  static const String omSign = 'ॐ';
  static const String danda = '।';
  static const String doubleDanda = '।।';

  /// Unicode dotted circle: display carrier for dependent marks without a base.
  static const String dottedCircle = '\u25CC';

  // --- MAPPINGS ---

  static const Map<String, String> independentVowels = {
    'a': 'अ',
    'ā': 'आ',
    'i': 'इ',
    'ī': 'ई',
    'u': 'उ',
    'ū': 'ऊ',
    'ṛ': 'ऋ',
    'ṝ': 'ॠ',
    'ḷ': 'ऌ',
    'ḹ': 'ॡ',
    'e': 'ए',
    'ē': 'ए',
    'ai': 'ऐ',
    'o': 'ओ',
    'ō': 'ओ',
    'au': 'औ',
    'ă': 'ऄ',
    'ĕ': 'ऎ',
    'ê': 'ऍ',
    'ĕ': 'ऎ',
    'æ': 'ॲ',
    'ŏ': 'ऒ',
    'ô': 'ऑ',
    'ŏ': 'ऒ',
    'oe': 'ॳ',
    'ōe': 'ॴ',
    'ooe': 'ॴ',
    'aw': 'ॵ',
    'ue': 'ॶ',
    'ūe': 'ॷ',
    'uue': 'ॷ'
  };
  static const Map<String, String> vowelSigns = {
    'a': '',
    'ā': 'ा',
    'i': 'ि',
    'ī': 'ी',
    'u': 'ु',
    'ū': 'ू',
    'ṛ': 'ृ',
    'ṝ': 'ॄ',
    'ḷ': 'ॢ',
    'ḹ': 'ॣ',
    'e': 'े',
    'ē': 'े',
    'ai': 'ै',
    'o': 'ो',
    'ō': 'ो',
    'au': 'ौ',
    'ă': '',
    'ĕ': 'ॆ',
    'ê': 'ॅ',
    'ĕ': 'ॆ',
    'æ': 'ॅ',
    'ŏ': 'ॊ',
    'ô': 'ॉ',
    'ŏ': 'ॊ',
    'oe': 'ऺ',
    'ōe': 'ऻ',
    'ooe': 'ऻ',
    'aw': 'ॏ',
    'ue': 'ॖ',
    'ūe': 'ॗ',
    'uue': 'ॗ'
  };
  static const Map<String, String> consonants = {
    'k': 'क',
    'kh': 'ख',
    'g': 'ग',
    'gh': 'घ',
    'ṅ': 'ङ',
    'c': 'च',
    'ch': 'छ',
    'j': 'ज',
    'jh': 'झ',
    'ñ': 'ञ',
    'ṭ': 'ट',
    'ṭh': 'ठ',
    'ḍ': 'ड',
    'ḍh': 'ढ',
    'ṇ': 'ण',
    't': 'त',
    'th': 'थ',
    'd': 'द',
    'dh': 'ध',
    'n': 'न',
    'ŋ': 'न',
    'ƞ': 'न',
    'p': 'प',
    'ph': 'फ',
    'b': 'ब',
    'bh': 'भ',
    'm': 'म',
    'y': 'य',
    'r': 'र',
    'l': 'ल',
    'v': 'व',
    'w': 'व',
    'ś': 'श',
    'sh': 'श',
    'ṣ': 'ष',
    's': 'स',
    // ṡ (s with dot above): intentional extended approximation → plain स.
    // Documented many-to-one (ṡ and s share the same Devanagari target).
    'ṡ': 'स',
    'h': 'ह',
    'ħ': 'ह',
    // Arabic خ (velar/uvular fricative) — not plain ह with a floating breve.
    'ḫ': 'ख़',
    'ḷ': 'ळ',
    // Dravidian retroflex lateral (Tamil ழ் / Malayalam ഴ) — never ल̱.
    'ḻ': 'ऴ',
    // Dravidian alveolar R / N.
    'ṟ': 'ऱ',
    // ṙ (r with dot above): intentional extended approximation → plain र.
    // Documented many-to-one (ṙ and r share the same Devanagari target).
    'ṙ': 'र',
    'ṉ': 'ऩ',
    // Prefer nukta sequences (base + ़) over precomposed forms for broader
    // font support and conventional Hindi orthography (e.g. ज़िक्र).
    'q': 'क़',
    'ḳ': 'क़',
    'ḵh': 'ख़',
    'x': 'ख़',
    'ġ': 'ग़',
    'z': 'ज़',
    'ż': 'ज़',
    'ẓ': 'ज़',
    'ṛ': 'ड़',
    'ṛh': 'ढ़',
    'f': 'फ़',
    'ẏ': 'य़',
    // ž: Perso-Arabic / extended → nukta za (not a residual caron on ज).
    'ž': 'ज़',
    'zh': 'ॹ',
    // ǧ: Sindhi-style GGA when available.
    'ǧ': 'ॻ',
    // Full-letter aliases without an embedded inherent "a" (that "a" is a
    // syllable vowel, not part of the consonant token).
    'gg': 'ॻ',
    'jj': 'ॼ',
    'ddd': 'ॾ',
    'ɗ': 'ॾ',
    'bb': 'ॿ',
    'ɓ': 'ॿ',
    'ḍḍ': 'ॸ',
    'yy': 'ॺ',
    'ʔ': 'ॽ',
    'ṯ': 'त़',
    'ḏ': 'द़',
    'ẖ': 'ह़',
    's̱': 'स़',
    'ẕ': 'ज़',
    'g̱': 'ग़',
    'ḵ': 'ख़'
  };
  static const Map<String, String> signs = {
    'm̐': 'ᳪ',
    '̃': 'ँ',
    '\u0310': 'ँ',
    'ṃ': 'ं',
    'ṁ': 'ं',
    'ḥ': 'ः',
    "'": 'ऽ',
    '\u2018': 'ऽ',
    '\u2019': 'ऽ',
    '\u02BC': 'ऽ',
    // Vedic / accent marks (Latin combining → Devanagari Vedic).
    // U+0951 udātta, U+0952 anudātta are the standard pair.
    // U+1CDA double svarita is used for circumflex / double-vertical
    // (previous U+0953/U+0954 mappings were incorrect).
    '\u0301': '॑', // acute → udātta
    '\u0300': '॒', // grave → anudātta
    '\u030D': '॑', // vertical line above → udātta alias
    '\u030E': '᳚', // double vertical above → double svarita
    '\u0302': '᳚', // circumflex → double svarita (common Latin svarita)
    '\u0320': '॒', // minus below → anudātta alias only (not macron-below;
    // U+0331 / U+0329 are ISO letter-builders for ṉ/ḻ etc., not accents)
    '\u0900': 'ऀ',
    '\u0970': '॰',
    '\u0971': 'ॱ'
  };
  static const Map<String, String> digits = {
    '0': '०',
    '1': '१',
    '2': '२',
    '3': '३',
    '4': '४',
    '5': '५',
    '6': '६',
    '7': '७',
    '8': '८',
    '9': '९'
  };

  static const Set<String> _strictIastVowels = <String>{
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
  };

  static const Set<String> _strictIastConsonants = <String>{
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
  };

  // --- TOKENIZATION KEYS ---

  static final List<String> _vowelKeys = _sortKeys(vowelSigns.keys);
  static final List<String> _independentVowelKeys =
      _sortKeys(independentVowels.keys);
  static final List<String> _consonantKeys = _sortKeys(consonants.keys);
  static final List<String> _signKeys = _sortKeys(signs.keys);

  static List<String> _sortKeys(Iterable<String> keys) =>
      keys.toList()..sort((a, b) => b.length.compareTo(a.length));

  // --- CORE CONVERSION ---

  static String convert(String input, IastToDevanagariOptions options) {
    if (input.isEmpty) return input;

    var text = input;
    if (options.omPolicy == IastToDevanagariOmPolicy.useOmSign) {
      text = _protectOmWords(text);
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

      // Handle protected OM
      if (rune == 0xE100) {
        buf.write(omSign);
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
        var precededByVowel = false;
        var idx = start - 1;
        while (idx >= 0 &&
            (runes[idx] == 0x20 ||
                runes[idx] == 0x09 ||
                runes[idx] == 0x0A ||
                runes[idx] == 0x0D)) {
          idx -= 1;
        }
        while (idx >= 0 && isUnicodeCombiningMark(runes[idx])) {
          idx -= 1;
        }
        if (idx >= 0) {
          // Use rune index carefully: idx is a rune-list index here.
          precededByVowel = _startsWithVowel(
            String.fromCharCodes(runes),
            _codeUnitOffsetForRuneIndex(runes, idx),
          );
        }
        buf.write(_convertLatinWord(token, options, precededByVowel));
        continue;
      }

      final ch = String.fromCharCode(rune);
      if (options.digitPolicy == IastToDevanagariDigitPolicy.convertToScript &&
          digits.containsKey(ch)) {
        buf.write(digits[ch]);
      } else if (options.punctuationPolicy ==
              IastToDevanagariPunctuationPolicy.indicDanda &&
          (ch == '.' || ch == '|')) {
        if (ch == '|') {
          if (i + 1 < runes.length && runes[i + 1] == 0x7C) {
            buf.write(doubleDanda);
            i += 1;
          } else {
            buf.write(danda);
          }
        } else {
          var dotCount = 1;
          while (i + dotCount < runes.length && runes[i + dotCount] == 0x2E) {
            dotCount += 1;
          }
          if (dotCount >= 3) {
            buf.write('.' * dotCount);
            i += dotCount - 1;
          } else {
            final afterIdx = i + dotCount;
            final isBoundary = afterIdx >= runes.length ||
                (runes[afterIdx] == 0x20 ||
                    runes[afterIdx] == 0x0A ||
                    runes[afterIdx] == 0x0D ||
                    runes[afterIdx] == 0x09);
            if (isBoundary) {
              if (dotCount == 2) {
                buf.write(doubleDanda);
              } else {
                buf.write(danda);
              }
            } else {
              buf.write('.' * dotCount);
            }
            i += dotCount - 1;
          }
        }
      } else {
        buf.write(ch);
      }
      i += 1;
    }

    var result = buf.toString();
    if (options.collapseWhitespace) {
      result = result.replaceAll(RegExp(r'\s+'), ' ').trim();
    }
    return options.embedExactSourceMetadata
        ? embedExactSourceMetadata(result, input)
        : result;
  }

  static bool _isLatinRune(int rune) =>
      (rune >= 0x41 && rune <= 0x5A) ||
      (rune >= 0x61 && rune <= 0x7A) ||
      (rune >= 0x00C0 && rune <= 0x00FF) ||
      (rune >= 0x0100 && rune <= 0x024F) ||
      (rune >= 0x0250 && rune <= 0x02FF) ||
      (rune >= 0x1E00 && rune <= 0x1EFF) ||
      isUnicodeCombiningMark(rune) ||
      // Keep avagraha markers inside the Latin word token so so'ham → सोऽहम्
      // (ASCII ', curly quotes, modifier letter apostrophe).
      rune == 0x27 ||
      rune == 0x2018 ||
      rune == 0x2019 ||
      rune == 0x02BC;

  static String _convertLatinWord(
      String word, IastToDevanagariOptions options, bool precededByVowel) {
    final text = _normalizeAndLowercase(word, options);

    final out = StringBuffer();
    var i = 0;
    var pendingConsonant = false;
    // True after an independent vowel or a completed syllable (matra / inherent a).
    // Visarga ḥ is only valid in that position; otherwise treat ḥ as consonant h.
    var afterVowel = false;
    final deferredAccents = <String>[];

    while (i < text.length) {
      final currentRune = text.codeUnitAt(i);
      final ch = String.fromCharCode(currentRune);
      final chWidth = ch.length;

      if (pendingConsonant) {
        final vowel = _matchContextualVowel(text, i, options, true);
        if (vowel != null) {
          if (vowel != 'a') {
            out.write(vowelSigns[vowel]);
          }
          afterVowel = true;
          if (!_nextIsVisargaOrAnusvara(text, i + vowel.length)) {
            if (deferredAccents.isNotEmpty) {
              out.write(deferredAccents.join());
              deferredAccents.clear();
            }
          }
          i += vowel.length;
          pendingConsonant = false;
          continue;
        }

        final sign = _matchKey(text, i, _signKeys);
        if (sign != null) {
          if (sign == "'" ||
              sign == '\u2018' ||
              sign == '\u2019' ||
              sign == '\u02BC') {
            if (!_isAvagrahaContext(text, i, precededByVowel)) {
              out.write(sign);
              i += sign.length;
              pendingConsonant = false;
              afterVowel = false;
              continue;
            } else {
              if (deferredAccents.isNotEmpty) {
                out.write(deferredAccents.join());
                deferredAccents.clear();
              }
            }
          }
          if (_isVedicAccent(sign)) {
            deferredAccents.add(_getScriptSign(sign, options));
            i += sign.length;
            continue;
          }
          // Pending consonant + ḥ/ṃ implies inherent "a" then the bindu.
          if (_isDependentNasalSign(sign)) {
            final extra = _followingCombiningMarks(text, i + sign.length);
            if (extra.isNotEmpty) {
              final accentMarks = _vedicAccentMarksToScript(extra, options);
              if (accentMarks != null) {
                out.write(_getScriptSign(sign, options));
                if (deferredAccents.isNotEmpty) {
                  out.write(deferredAccents.join());
                  deferredAccents.clear();
                }
                out.write(accentMarks);
                i += sign.length + extra.length;
                pendingConsonant = false;
                afterVowel = false;
                continue;
              }
              // Unsupported nasal extension (e.g. macron): keep the mark on
              // the script nasal so Devanagari output does not leak Latin.
              out.write(_getScriptSign(sign, options));
              if (deferredAccents.isNotEmpty) {
                out.write(deferredAccents.join());
                deferredAccents.clear();
              }
              out.write(extra);
              i += sign.length + extra.length;
              pendingConsonant = false;
              afterVowel = false;
              continue;
            }
          }
          out.write(_getScriptSign(sign, options));
          if (sign == 'ḥ' || _isDependentNasalSign(sign)) {
            if (deferredAccents.isNotEmpty) {
              out.write(deferredAccents.join());
              deferredAccents.clear();
            }
          }
          i += sign.length;
          pendingConsonant = false;
          afterVowel = false;
          continue;
        }

        final nextConsonant = _matchContextualConsonant(text, i, options, true);
        if (nextConsonant != null) {
          out.write(virama);
          if (deferredAccents.isNotEmpty) {
            out.write(deferredAccents.join());
            deferredAccents.clear();
          }
          pendingConsonant = false;
          afterVowel = false;
          continue;
        }

        // Residual combining marks (e.g. underline on a letter that is not an
        // ISO letter-builder) are preserved for losslessness. Known identity
        // diacritics are consumed in fold and never reach here.
        final pendingCp = ch.runes.first;
        if (isUnicodeCombiningMark(pendingCp)) {
          if (options.preserveVedicAccentMarks ||
              !isEncodedVedicMark(pendingCp)) {
            out.write(_handleUnknownMark(ch, options));
          }
          i += chWidth;
          continue;
        }

        // End of cluster
        out.write(virama);
        pendingConsonant = false;
        afterVowel = false;
        continue;
      }

      final sign = _matchKey(text, i, _signKeys);
      if (sign != null) {
        if (sign == "'" ||
            sign == '\u2018' ||
            sign == '\u2019' ||
            sign == '\u02BC') {
          if (!_isAvagrahaContext(text, i, precededByVowel)) {
            out.write(sign);
            i += sign.length;
            afterVowel = false;
            continue;
          } else {
            if (deferredAccents.isNotEmpty) {
              out.write(deferredAccents.join());
              deferredAccents.clear();
            }
          }
        }
        if (_isVedicAccent(sign)) {
          deferredAccents.add(_getScriptSign(sign, options));
          i += sign.length;
          continue;
        }
        // Word-initial / non-postvocalic ḥ is not visarga (ḥṛdaya → हृदय).
        if (sign == 'ḥ' && !afterVowel) {
          out.write(consonants['h']);
          i += sign.length;
          pendingConsonant = true;
          afterVowel = false;
          continue;
        }
        if (_isDependentNasalSign(sign)) {
          final extra = _followingCombiningMarks(text, i + sign.length);
          if (extra.isNotEmpty) {
            final accentMarks = _vedicAccentMarksToScript(extra, options);
            if (accentMarks != null) {
              out.write(_getScriptSign(sign, options));
              if (deferredAccents.isNotEmpty) {
                out.write(deferredAccents.join());
                deferredAccents.clear();
              }
              out.write(accentMarks);
              i += sign.length + extra.length;
              afterVowel = false;
              continue;
            }
            if (!afterVowel) {
              out.write(dottedCircle);
            }
            out.write(_getScriptSign(sign, options));
            out.write(extra);
            i += sign.length + extra.length;
            afterVowel = false;
            continue;
          }
          // Dependent nasal without a base: use dotted-circle carrier so the
          // rest of the word can convert cleanly (◌ंअङ्गल, ◌ᳪत्र).
          if (!afterVowel) {
            out.write(dottedCircle);
            out.write(_getScriptSign(sign, options));
            i += sign.length;
            afterVowel = false;
            continue;
          }
        }
        out.write(_getScriptSign(sign, options));
        if (sign == 'ḥ' || _isDependentNasalSign(sign)) {
          if (deferredAccents.isNotEmpty) {
            out.write(deferredAccents.join());
            deferredAccents.clear();
          }
          afterVowel = false;
        }
        i += sign.length;
        continue;
      }

      final consonant = _matchContextualConsonant(text, i, options, false);
      if (consonant != null) {
        if (deferredAccents.isNotEmpty) {
          out.write(deferredAccents.join());
          deferredAccents.clear();
        }
        out.write(consonants[consonant]);
        i += consonant.length;
        final keepsInherentA = (consonant == 'ṛ' || consonant == 'ṛh') &&
            options.profile != DevanagariRomanizationProfile.strictIast &&
            !_startsWithVowel(text, i);
        pendingConsonant = !keepsInherentA;
        afterVowel = keepsInherentA;
        continue;
      }

      final vowel = _matchContextualVowel(text, i, options, false);
      if (vowel != null) {
        out.write(independentVowels[vowel]);
        afterVowel = true;
        if (!_nextIsVisargaOrAnusvara(text, i + vowel.length)) {
          if (deferredAccents.isNotEmpty) {
            out.write(deferredAccents.join());
            deferredAccents.clear();
          }
        }
        i += vowel.length;
        continue;
      }

      // Preserve residual combining marks (underlines, unknown marks, etc.).
      // Identity diacritics are consumed during fold and do not reach here.
      final cp = ch.runes.first;
      if (isUnicodeCombiningMark(cp)) {
        if (options.preserveVedicAccentMarks || !isEncodedVedicMark(cp)) {
          out.write(_handleUnknownMark(ch, options));
        }
        i += chWidth;
        continue;
      }

      out.write(_handleUnknownLatin(ch, options));
      i += chWidth;
      afterVowel = false;
    }

    if (pendingConsonant) out.write(virama);
    if (deferredAccents.isNotEmpty) {
      out.write(deferredAccents.join());
      deferredAccents.clear();
    }
    return out.toString();
  }

  static bool _nextIsVisargaOrAnusvara(String text, int start) {
    var idx = start;
    while (idx < text.length) {
      final sign = _matchKey(text, idx, _signKeys);
      if (sign != null && _isVedicAccent(sign)) {
        idx += sign.length;
      } else {
        break;
      }
    }
    if (idx < text.length) {
      final nextSign = _matchKey(text, idx, _signKeys);
      if (nextSign == 'ḥ' ||
          nextSign == 'ṃ' ||
          nextSign == 'm̐' ||
          nextSign == '\u0310' ||
          nextSign == '̐') {
        return true;
      }
    }
    return false;
  }

  static String? _matchContextualVowel(String text, int i,
      IastToDevanagariOptions options, bool pendingConsonant) {
    if (i >= text.length) return null;

    final lMatch = _matchLVariant(text, i);
    if (lMatch != null) {
      if (options.profile == DevanagariRomanizationProfile.strictIast)
        return lMatch;
      if (_startsWithVowel(text, i + lMatch.length)) return null;
      if (options.ambiguousLPolicy ==
          IastToDevanagariAmbiguousLPolicy.preferVocalic) return lMatch;
      if (options.ambiguousLPolicy ==
          IastToDevanagariAmbiguousLPolicy.preferConsonant) return null;
      if (!_startsWithVowel(text, i + lMatch.length)) return lMatch;
      return null;
    }

    final rMatch = _matchRVariant(text, i);
    if (rMatch != null) {
      if (options.profile == DevanagariRomanizationProfile.strictIast)
        return rMatch;
      if (pendingConsonant) return rMatch;
      if (!_startsWithVowel(text, i + rMatch.length) &&
          !_previousStartsWithVowel(text, i)) return rMatch;
      return null;
    }

    final match = _matchKey(
        text, i, pendingConsonant ? _vowelKeys : _independentVowelKeys);
    if (match != null &&
        options.profile == DevanagariRomanizationProfile.strictIast &&
        options.unknownLatinPolicy ==
            IastToDevanagariUnknownLatinPolicy.throwError &&
        !_strictIastVowels.contains(match)) {
      return null;
    }
    return match;
  }

  static String? _matchContextualConsonant(String text, int i,
      IastToDevanagariOptions options, bool pendingConsonant) {
    if (i >= text.length) return null;

    final match = _matchKey(text, i, _consonantKeys);
    if (match == null) return null;

    if (options.profile == DevanagariRomanizationProfile.strictIast &&
        !_strictIastConsonants.contains(match)) return null;

    if (match == 'ṛ' || match == 'ṛh') {
      if (options.profile == DevanagariRomanizationProfile.strictIast)
        return null;
      if (!_startsWithVowel(text, i + match.length) &&
          !_previousStartsWithVowel(text, i)) return null;
    }

    if (match == 'ḷ') {
      if (options.profile == DevanagariRomanizationProfile.strictIast)
        return null;
      if (_startsWithVowel(text, i + 1)) return 'ḷ';
      if (options.ambiguousLPolicy ==
          IastToDevanagariAmbiguousLPolicy.preferConsonant) return 'ḷ';
      if (options.ambiguousLPolicy ==
              IastToDevanagariAmbiguousLPolicy.context &&
          _startsWithVowel(text, i + 1)) return 'ḷ';
      return null;
    }

    if (match == 'x' && !options.acceptPlainXAsKha) return null;
    if (match == 'w' && !options.acceptWAsVa) return null;
    if ((match == 'sh' || match == 'zh') && !options.acceptPlainSh) return null;

    return match;
  }

  static String? _matchLVariant(String text, int i) {
    if (text.startsWith('ḹ', i)) return 'ḹ';
    if (text.startsWith('ḷ', i)) return 'ḷ';
    return null;
  }

  static String? _matchRVariant(String text, int i) {
    if (text.startsWith('ṝ', i)) return 'ṝ';
    if (text.startsWith('ṛ', i)) return 'ṛ';
    return null;
  }

  static bool _startsWithVowel(String text, int i) {
    if (i >= text.length || i < 0) return false;
    if (_matchKey(text, i, _vowelKeys) != null ||
        _matchKey(text, i, _independentVowelKeys) != null) {
      return true;
    }
    // Precomposed accented vowels (ò, á, …) are not in the vowel key table.
    // Fold a short prefix the same way word conversion does, then re-check.
    final end = text.length < i + 12 ? text.length : i + 12;
    final folded = _normalizeAndLowercase(
      text.substring(i, end),
      const IastToDevanagariOptions(),
    );
    return _matchKey(folded, 0, _vowelKeys) != null ||
        _matchKey(folded, 0, _independentVowelKeys) != null;
  }

  /// Avagraha only inside a word (or across a space after a vowel-final word),
  /// when the apostrophe is preceded by a Sanskrit vowel and followed by a
  /// letter that continues the word (so'ham, tathā'pi). Quotation marks such as
  /// 'jñāna' are preserved.
  static bool _isAvagrahaContext(String text, int i, bool precededByVowel) {
    if (i >= text.length - 1) return false;
    final next = text.codeUnitAt(i + 1);
    if (!_isAlphabeticLatinRune(next)) return false;

    if (i == 0) return precededByVowel;

    var prevIdx = _previousRuneStart(text, i);
    while (prevIdx >= 0 && isUnicodeCombiningMark(text.codeUnitAt(prevIdx))) {
      prevIdx = _previousRuneStart(text, prevIdx);
    }
    if (prevIdx < 0) return false;
    return _startsWithVowel(text, prevIdx);
  }

  static bool _previousStartsWithVowel(String text, int i) {
    var prevIdx = _previousRuneStart(text, i);
    while (prevIdx >= 0 && isUnicodeCombiningMark(text.codeUnitAt(prevIdx))) {
      prevIdx = _previousRuneStart(text, prevIdx);
    }
    if (prevIdx < 0) return false;
    return _startsWithVowel(text, prevIdx);
  }

  /// Convert a rune-list index to a UTF-16 code-unit offset in
  /// [String.fromCharCodes(runes)].
  static int _codeUnitOffsetForRuneIndex(List<int> runes, int runeIndex) {
    var offset = 0;
    for (var r = 0; r < runeIndex && r < runes.length; r++) {
      offset += runes[r] > 0xFFFF ? 2 : 1;
    }
    return offset;
  }

  static int _previousRuneStart(String text, int end) {
    if (end <= 0) return -1;
    var index = end - 1;
    final unit = text.codeUnitAt(index);
    if (unit >= 0xDC00 && unit <= 0xDFFF && index > 0) {
      final previous = text.codeUnitAt(index - 1);
      if (previous >= 0xD800 && previous <= 0xDBFF) {
        index -= 1;
      }
    }
    return index;
  }

  static bool _isAlphabeticLatinRune(int rune) =>
      (rune >= 0x41 && rune <= 0x5A) ||
      (rune >= 0x61 && rune <= 0x7A) ||
      (rune >= 0x00C0 && rune <= 0x00FF) ||
      (rune >= 0x0100 && rune <= 0x024F) ||
      (rune >= 0x0250 && rune <= 0x02FF) ||
      (rune >= 0x1E00 && rune <= 0x1EFF);

  static String? _matchKey(String text, int i, List<String> keys) {
    for (final key in keys) {
      if (text.startsWith(key, i)) return key;
    }
    return null;
  }

  // --- BASE + MARKS NORMALIZATION ---

  static bool _isCombiningMark(int rune) => isUnicodeCombiningMark(rune);

  static String _normalizeAndLowercase(
      String word, IastToDevanagariOptions options) {
    final runes = normalizeUnicode(
      word,
      UnicodeNormalizationForm.nfd,
    ).runes.toList();
    final buf = StringBuffer();
    var i = 0;
    while (i < runes.length) {
      final base = String.fromCharCode(runes[i]);
      i += 1;
      final marks = <int>[];

      while (i < runes.length && _isCombiningMark(runes[i])) {
        marks.add(runes[i]);
        i += 1;
      }

      buf.write(_foldMarkedBase(
        base,
        marks,
        allowCompatibilityFolding: true,
      ));
    }

    var s = buf.toString().toLowerCase();

    if (options.acceptAsciiLongVowels) {
      s = s
          .replaceAll('aa', 'ā')
          .replaceAll('ii', 'ī')
          .replaceAll('uu', 'ū')
          .replaceAll('rr', 'ṝ')
          .replaceAll('ll', 'ḹ');
    }

    return s;
  }

  /// Fold one Latin base + its full combining-mark sequence into a single
  /// canonical IAST/ISO token. Marks that define the letter identity are
  /// consumed; only intentional Vedic accents (acute/grave/etc.) may remain
  /// attached for later sign processing (e.g. ṣ́ → ṣ + udātta).
  static String _foldMarkedBase(
    String base,
    List<int> marks, {
    required bool allowCompatibilityFolding,
  }) {
    final foldedBase =
        allowCompatibilityFolding ? _foldPrecomposed(base) : base;
    final lower = foldedBase.toLowerCase();

    if (marks.isEmpty) return foldedBase;

    final hasDotBelow = marks.contains(0x0323);
    final hasRingBelow = marks.contains(0x0325);
    final hasDotAbove = marks.contains(0x0307);
    final hasAcute = marks.contains(0x0301);
    final hasNasal = marks.contains(0x0303) || marks.contains(0x0310);
    final hasMacron = marks.contains(0x0304);
    final hasLineBelow = marks.contains(0x0331) || marks.contains(0x035F);
    final hasBreveBelow = marks.contains(0x032E); // NFD of ḫ
    final hasCaron = marks.contains(0x030C); // NFD of ž, ǧ

    String? out;
    // Marks consumed into letter identity (never re-emitted as Latin leaks).
    final consumed = <int>{};

    void take(String token, Iterable<int> markCodes) {
      out = token;
      consumed.addAll(markCodes);
    }

    List<int> lineBelowMarks() => [
          if (marks.contains(0x0331)) 0x0331,
          if (marks.contains(0x035F)) 0x035F,
        ];

    if (lower == 'r' && (hasDotBelow || hasRingBelow)) {
      take(hasMacron ? 'ṝ' : 'ṛ', [
        if (hasDotBelow) 0x0323,
        if (hasRingBelow) 0x0325,
        if (hasMacron) 0x0304,
      ]);
    } else if (lower == 'r' && hasDotAbove) {
      // ṙ → plain र after mapping; consume the dot so it cannot leak mid-cluster.
      take('ṙ', [0x0307]);
    } else if (lower == 'r' && hasLineBelow) {
      take('ṟ', lineBelowMarks());
    } else if (lower == 'l' && (hasDotBelow || hasRingBelow)) {
      take(hasMacron ? 'ḹ' : 'ḷ', [
        if (hasDotBelow) 0x0323,
        if (hasRingBelow) 0x0325,
        if (hasMacron) 0x0304,
      ]);
    } else if (lower == 'l' && (hasLineBelow || marks.contains(0x0324))) {
      take('ḻ', [...lineBelowMarks(), if (marks.contains(0x0324)) 0x0324]);
    } else if (lower == 'h' && hasBreveBelow) {
      take('ḫ', [0x032E]);
    } else if (lower == 'h' && hasDotBelow) {
      take('ḥ', [0x0323]);
    } else if (lower == 'h' && hasLineBelow) {
      take('ẖ', lineBelowMarks());
    } else if (lower == 's' && hasDotBelow) {
      // ṣ or ṣ́: keep underdot as ṣ; leave acute for Vedic udātta (do NOT → ś).
      take('ṣ', [0x0323]);
    } else if (lower == 's' && hasAcute) {
      take('ś', [0x0301]);
    } else if (lower == 's' && hasDotAbove) {
      take('ṡ', [0x0307]);
    } else if (lower == 's' && hasLineBelow) {
      take('s̱', lineBelowMarks());
    } else if (lower == 't' && hasDotBelow) {
      take('ṭ', [0x0323]);
    } else if (lower == 't' && hasLineBelow) {
      take('ṯ', lineBelowMarks());
    } else if (lower == 'd' && hasDotBelow) {
      take('ḍ', [0x0323]);
    } else if (lower == 'd' && hasLineBelow) {
      take('ḏ', lineBelowMarks());
    } else if (lower == 'n' && hasDotBelow) {
      take('ṇ', [0x0323]);
    } else if (lower == 'n' && hasDotAbove) {
      take('ṅ', [0x0307]);
    } else if (lower == 'n' && hasNasal) {
      take('ñ', [
        if (marks.contains(0x0303)) 0x0303,
        if (marks.contains(0x0310)) 0x0310,
      ]);
    } else if (lower == 'n' && hasLineBelow) {
      take('ṉ', lineBelowMarks());
    } else if (lower == 'z' && hasDotBelow) {
      take('ẓ', [0x0323]);
    } else if (lower == 'z' && hasCaron) {
      take('ž', [0x030C]);
    } else if (lower == 'z' && hasDotAbove) {
      take('ż', [0x0307]);
    } else if (lower == 'z' && hasLineBelow) {
      take('ẕ', lineBelowMarks());
    } else if (lower == 'k' && hasDotBelow) {
      take('ḳ', [0x0323]);
    } else if (lower == 'k' && hasLineBelow) {
      take('ḵ', lineBelowMarks());
    } else if (lower == 'g' && hasCaron) {
      take('ǧ', [0x030C]);
    } else if (lower == 'g' && hasDotAbove) {
      take('ġ', [0x0307]);
    } else if (lower == 'g' && hasLineBelow) {
      take('g̱', lineBelowMarks());
    } else if (lower == 'm' && marks.contains(0x0310)) {
      // m̐ (m + candrabindu). Do not consume a following macron — it is
      // preserved later on the script nasal.
      take('m̐', [0x0310]);
    } else if (lower == 'm' && (hasDotBelow || hasDotAbove)) {
      // ṃ / ṁ (and ṃ / ṁ). Macron is intentionally NOT consumed: ṃ̄ has no
      // long-nasal target and must not silently lose U+0304.
      take('ṃ', [
        if (hasDotBelow) 0x0323,
        if (hasDotAbove) 0x0307,
      ]);
    } else if (lower == 'y' && hasDotAbove) {
      take('ẏ', [0x0307]);
    } else if (hasMacron) {
      if (lower == 'a')
        take('ā', [0x0304]);
      else if (lower == 'i')
        take('ī', [0x0304]);
      else if (lower == 'u')
        take('ū', [0x0304]);
      else if (lower == 'e')
        take('ē', [0x0304]);
      else if (lower == 'o') take('ō', [0x0304]);
    } else if (marks.contains(0x0306)) {
      if (lower == 'a')
        take('ă', [0x0306]);
      else if (lower == 'e')
        take('ĕ', [0x0306]);
      else if (lower == 'o') take('ŏ', [0x0306]);
    } else if (marks.contains(0x0302)) {
      if (lower == 'e')
        take('ê', [0x0302]);
      else if (lower == 'o') take('ô', [0x0302]);
    }

    // Re-emit only unconsumed marks. Vedic accents (acute on ṣ́, etc.) stay;
    // identity marks never reappear as Latin leaks on Indic letters.
    final outMarks = StringBuffer();
    for (final m in marks) {
      if (consumed.contains(m)) continue;
      outMarks.writeCharCode(m);
    }

    return (out ?? foldedBase) + outMarks.toString();
  }

  static String _foldPrecomposed(String ch) {
    switch (ch) {
      case 'á':
        return 'a\u0301';
      case 'à':
        return 'a\u0300';
      case 'â':
        return 'a';
      case 'ã':
        return 'a';
      case 'ä':
        return 'a';
      case 'å':
        return 'a';
      case 'é':
        return 'e\u0301';
      case 'è':
        return 'e\u0300';
      case 'ë':
        return 'e';
      case 'í':
        return 'i\u0301';
      case 'ì':
        return 'i\u0300';
      case 'î':
        return 'i';
      case 'ï':
        return 'i';
      case 'ó':
        return 'o\u0301';
      case 'ò':
        return 'o\u0300';
      case 'õ':
        return 'o';
      case 'ö':
        return 'o';
      case 'ø':
        return 'o';
      case 'ú':
        return 'u\u0301';
      case 'ù':
        return 'u\u0300';
      case 'û':
        return 'u';
      case 'ü':
        return 'u';
      case 'ç':
        return 's';
      case 'Ç':
        return 'S';
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
      case 'Æ':
        return 'ae';
      case 'æ':
        return 'ae';
      case 'Œ':
        return 'oe';
      case 'œ':
        return 'oe';
      case 'ź':
        return 'z';
      case 'Ź':
        return 'Z';
      default:
        return ch;
    }
  }

  static String _getScriptSign(String sign, IastToDevanagariOptions options) {
    if (!options.preserveVedicAccentMarks && _isVedicAccent(sign)) return '';
    return signs[sign] ?? sign;
  }

  static bool _isVedicAccent(String sign) =>
      sign == '\u0301' ||
      sign == '\u0300' ||
      sign == '\u030D' ||
      sign == '\u030E' ||
      sign == '\u0302' ||
      sign == '\u0320';
  // U+0331 / U+0329 intentionally excluded: ISO letter builders for ṉ/ḻ
  //.

  static bool _isDependentNasalSign(String sign) =>
      sign == 'ṃ' ||
      sign == 'ṁ' ||
      sign == 'm̐' ||
      sign == '\u0310' ||
      sign == '̐' ||
      sign == '̃';

  static String? _vedicAccentMarksToScript(
      String marks, IastToDevanagariOptions options) {
    final out = StringBuffer();
    for (final rune in marks.runes) {
      final mark = String.fromCharCode(rune);
      if (!_isVedicAccent(mark)) return null;
      out.write(_getScriptSign(mark, options));
    }
    return out.toString();
  }

  /// Collect consecutive combining marks starting at [start] (UTF-16 index).
  static String _followingCombiningMarks(String text, int start) {
    final buf = StringBuffer();
    var i = start;
    while (i < text.length) {
      final unit = text.codeUnitAt(i);
      // BMP-only combining marks used in this pipeline.
      if (!isUnicodeCombiningMark(unit)) break;
      buf.writeCharCode(unit);
      i += 1;
    }
    return buf.toString();
  }

  static String _handleUnknownMark(
          String ch, IastToDevanagariOptions options) =>
      switch (options.unknownLatinPolicy) {
        IastToDevanagariUnknownLatinPolicy.passThrough => ch,
        IastToDevanagariUnknownLatinPolicy.bracket => '[$ch]',
        IastToDevanagariUnknownLatinPolicy.throwError => throw FormatException(
            'Unknown combining mark: U+${ch.runes.first.toRadixString(16).toUpperCase().padLeft(4, '0')}',
          ),
      };

  static String _handleUnknownLatin(
          String ch, IastToDevanagariOptions options) =>
      switch (options.unknownLatinPolicy) {
        IastToDevanagariUnknownLatinPolicy.passThrough => ch,
        IastToDevanagariUnknownLatinPolicy.bracket => '[$ch]',
        IastToDevanagariUnknownLatinPolicy.throwError =>
          throw FormatException('Unknown Latin token: $ch'),
      };

  // --- OM PROTECTION ---

  static const String _protectedOm = '\uE100';

  /// Single-pass, boundary-aware OM protection.
  static String _protectOmWords(String input) {
    final re = RegExp(
      r'(?<![A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F])'
      '(oṃ|oṁ|oṁ|aum)'
      r'(?![A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F])',
      caseSensitive: false,
    );
    return input.replaceAllMapped(re, (_) => _protectedOm);
  }
}
