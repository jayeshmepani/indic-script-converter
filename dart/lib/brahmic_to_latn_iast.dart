import 'transliteration_core.dart';

class ScriptToIastOptions {
  const ScriptToIastOptions({
    this.inputNormalization = UnicodeNormalizationForm.nfd,
    this.outputNormalization = UnicodeNormalizationForm.nfc,
    this.preserveUnmapped = true,
    this.preserveEncodedVedicMarks = true,
  });

  final UnicodeNormalizationForm inputNormalization;
  final UnicodeNormalizationForm outputNormalization;
  final bool preserveUnmapped;
  final bool preserveEncodedVedicMarks;
}

/// Exact source recovery is possible only for script strings produced with
/// `embedExactSourceMetadata: true` in the corresponding forward converter.
/// Canonical reverse transliteration remains available for ordinary untagged
/// Devanagari or Gujarati text.
extension DevanagariToIast on String {
  /// Returns the exact original Latin key when embedded metadata is present;
  /// otherwise falls back to canonical IAST.
  String toIastFromDevanagari({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) =>
      recoverEmbeddedExactSource(this) ??
      _BrahmicToIast.convert(this, _devanagari, options);

  /// Requires the exact original Latin key embedded by the forward converter.
  /// Throws when the metadata was not enabled or was stripped by transport.
  String toExactIastFromDevanagari() {
    if (isEmpty) return '';
    final exact = recoverEmbeddedExactSource(this);
    if (exact == null) {
      throw const FormatException(
        'No valid embedded exact-source metadata was found. Convert with '
        'IastToDevanagariOptions(embedExactSourceMetadata: true).',
      );
    }
    return exact;
  }

  /// Always performs a canonical script-to-IAST transliteration and ignores
  /// any embedded exact-source trailer.
  String toCanonicalIastFromDevanagari({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) =>
      _BrahmicToIast.convert(this, _devanagari, options);

  bool get hasExactDevanagariSourceMetadata => hasEmbeddedExactSource(this);

  String get visibleDevanagariWithoutExactSourceMetadata =>
      stripExactSourceMetadata(this);

  LosslessTransliterationResult toLosslessCanonicalIastFromDevanagari({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) {
    final visibleInput = stripExactSourceMetadata(this);
    final normalizedInput =
        normalizeUnicode(visibleInput, options.inputNormalization);
    return LosslessTransliterationResult(
      original: this,
      normalizedInput: normalizedInput,
      rendered: _BrahmicToIast.convert(visibleInput, _devanagari, options),
      profile: TransliterationProfile.strictIast,
      inputNormalization: options.inputNormalization,
      outputNormalization: options.outputNormalization,
      renderingIsInjective: false,
      issues: const <TransliterationIssue>[
        TransliterationIssue(
          code: 'CANONICAL_REVERSE_DOES_NOT_RECREATE_LATIN_ALIASES',
          message:
              'Canonical IAST is generated. Use toExactIastFromDevanagari() '
              'for a metadata-backed exact source key.',
          severity: TransliterationIssueSeverity.info,
        ),
      ],
    );
  }
}

extension GujaratiToIast on String {
  /// Returns the exact original Latin key when embedded metadata is present;
  /// otherwise falls back to canonical IAST.
  String toIastFromGujarati({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) =>
      recoverEmbeddedExactSource(this) ??
      _BrahmicToIast.convert(this, _gujarati, options);

  /// Requires the exact original Latin key embedded by the forward converter.
  String toExactIastFromGujarati() {
    if (isEmpty) return '';
    final exact = recoverEmbeddedExactSource(this);
    if (exact == null) {
      throw const FormatException(
        'No valid embedded exact-source metadata was found. Convert with '
        'IastToGujaratiOptions(embedExactSourceMetadata: true).',
      );
    }
    return exact;
  }

  /// Always performs canonical Gujarati-to-IAST transliteration.
  String toCanonicalIastFromGujarati({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) =>
      _BrahmicToIast.convert(this, _gujarati, options);

  bool get hasExactGujaratiSourceMetadata => hasEmbeddedExactSource(this);

  String get visibleGujaratiWithoutExactSourceMetadata =>
      stripExactSourceMetadata(this);

  LosslessTransliterationResult toLosslessCanonicalIastFromGujarati({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) {
    final visibleInput = stripExactSourceMetadata(this);
    final normalizedInput =
        normalizeUnicode(visibleInput, options.inputNormalization);
    return LosslessTransliterationResult(
      original: this,
      normalizedInput: normalizedInput,
      rendered: _BrahmicToIast.convert(visibleInput, _gujarati, options),
      profile: TransliterationProfile.strictIast,
      inputNormalization: options.inputNormalization,
      outputNormalization: options.outputNormalization,
      renderingIsInjective: false,
      issues: const <TransliterationIssue>[
        TransliterationIssue(
          code: 'CANONICAL_REVERSE_DOES_NOT_RECREATE_LATIN_ALIASES',
          message: 'Canonical IAST is generated. Use toExactIastFromGujarati() '
              'for a metadata-backed exact source key.',
          severity: TransliterationIssueSeverity.info,
        ),
      ],
    );
  }
}

class _ScriptConfig {
  const _ScriptConfig({
    required this.virama,
    required this.nukta,
    required this.independentVowels,
    required this.vowelSigns,
    required this.consonants,
    required this.signs,
    required this.digits,
  });

  final String virama;
  final String nukta;
  final Map<String, String> independentVowels;
  final Map<String, String> vowelSigns;
  final Map<String, String> consonants;
  final Map<String, String> signs;
  final Map<String, String> digits;
}

class _BrahmicToIast {
  static String convert(
    String input,
    _ScriptConfig config,
    ScriptToIastOptions options,
  ) {
    final visibleInput = stripExactSourceMetadata(input);
    final normalized =
        normalizeUnicode(visibleInput, options.inputNormalization);
    final runes = normalized.runes.toList(growable: false);
    final out = StringBuffer();
    var i = 0;

    while (i < runes.length) {
      final ch = String.fromCharCode(runes[i]);

      final independent = config.independentVowels[ch];
      if (independent != null) {
        out.write(independent);
        i += 1;
        continue;
      }

      var consonantKey = ch;
      var consonantWidth = 1;
      if (i + 1 < runes.length &&
          String.fromCharCode(runes[i + 1]) == config.nukta) {
        final withNukta = '$ch${config.nukta}';
        if (config.consonants.containsKey(withNukta)) {
          consonantKey = withNukta;
          consonantWidth = 2;
        }
      }

      final consonant = config.consonants[consonantKey];
      if (consonant != null) {
        out.write(consonant);
        i += consonantWidth;

        if (i < runes.length) {
          final next = String.fromCharCode(runes[i]);
          final vowel = config.vowelSigns[next];
          if (vowel != null) {
            out.write(vowel);
            i += 1;
            continue;
          }
          if (next == config.virama) {
            i += 1;
            continue;
          }
        }

        out.write('a');
        continue;
      }

      final standaloneVowelSign = config.vowelSigns[ch];
      if (standaloneVowelSign != null) {
        out.write(standaloneVowelSign);
        i += 1;
        continue;
      }

      final sign = config.signs[ch];
      if (sign != null) {
        out.write(sign);
        i += 1;
        continue;
      }

      final digit = config.digits[ch];
      if (digit != null) {
        out.write(digit);
        i += 1;
        continue;
      }

      if (isEncodedVedicMark(runes[i])) {
        if (options.preserveEncodedVedicMarks) {
          // Basic pan-Indic Vedic accents receive canonical Latin aliases.
          // Tradition-specific marks remain encoded rather than guessed.
          out.write(
            switch (runes[i]) {
              0x0951 => '\u0301',
              0x0952 => '\u0300',
              0x1CDA => '\u0302',
              _ => ch,
            },
          );
        }
        i += 1;
        continue;
      }

      if (options.preserveUnmapped) {
        out.write(ch);
      }
      i += 1;
    }

    final canonicalLatin = _reattachVedicAccentsToVowels(out.toString());
    return normalizeUnicode(canonicalLatin, options.outputNormalization);
  }

  static String _reattachVedicAccentsToVowels(String text) {
    final chars = text.runes.map(String.fromCharCode).toList();
    var i = 0;
    while (i < chars.length) {
      final ch = chars[i];
      if (!_isLatinVedicAccent(ch)) {
        i += 1;
        continue;
      }

      final vowelIndex = _findAccentVowelTarget(chars, i);
      if (vowelIndex == null) {
        i += 1;
        continue;
      }

      chars.removeAt(i);
      chars.insert(vowelIndex + 1, ch);
      i += 1;
    }
    return chars.join();
  }

  static int? _findAccentVowelTarget(List<String> chars, int accentIndex) {
    var target = accentIndex - 1;
    if (target < 0) return null;

    if (chars[target] == '\u0310' &&
        target - 1 >= 0 &&
        chars[target - 1] == 'm') {
      target -= 2;
    } else if (chars[target] == 'ḥ' || chars[target] == 'ṃ') {
      target -= 1;
    }

    while (target >= 0 && _isNonAccentCombiningMark(chars[target])) {
      target -= 1;
    }
    if (target < 0) return null;
    return _isLatinVowel(chars[target]) ? target : null;
  }

  static bool _isLatinVedicAccent(String ch) =>
      ch == '\u0301' || ch == '\u0300' || ch == '\u0302';

  static bool _isNonAccentCombiningMark(String ch) {
    final rune = ch.runes.single;
    return isUnicodeCombiningMark(rune) && !_isLatinVedicAccent(ch);
  }

  static bool _isLatinVowel(String ch) => const {
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
        'o',
        'ă',
        'ê',
        'ĕ',
        'ô',
        'ŏ',
        'æ',
        'œ',
      }.contains(ch.toLowerCase());
}

const _devanagari = _ScriptConfig(
  virama: '्',
  nukta: '़',
  independentVowels: <String, String>{
    'अ': 'a',
    'आ': 'ā',
    'इ': 'i',
    'ई': 'ī',
    'उ': 'u',
    'ऊ': 'ū',
    'ऋ': 'ṛ',
    'ॠ': 'ṝ',
    'ऌ': 'ḷ',
    'ॡ': 'ḹ',
    'ऄ': 'ă',
    'ऍ': 'ê',
    'ऎ': 'ĕ',
    'ए': 'e',
    'ऐ': 'ai',
    'ऑ': 'ô',
    'ऒ': 'ŏ',
    'ओ': 'o',
    'औ': 'au',
    'ॲ': 'æ',
    'ॳ': 'oe',
    'ॴ': 'ōe',
    'ॵ': 'aw',
    'ॶ': 'ue',
    'ॷ': 'ūe',
  },
  vowelSigns: <String, String>{
    'ा': 'ā',
    'ि': 'i',
    'ी': 'ī',
    'ु': 'u',
    'ू': 'ū',
    'ृ': 'ṛ',
    'ॄ': 'ṝ',
    'ॢ': 'ḷ',
    'ॣ': 'ḹ',
    'ॅ': 'ê',
    'ॆ': 'ĕ',
    'े': 'e',
    'ै': 'ai',
    'ॉ': 'ô',
    'ॊ': 'ŏ',
    'ो': 'o',
    'ौ': 'au',
    'ऺ': 'oe',
    'ऻ': 'ōe',
    'ॏ': 'aw',
    'ॖ': 'ue',
    'ॗ': 'ūe',
  },
  consonants: <String, String>{
    'क': 'k',
    'ख': 'kh',
    'ग': 'g',
    'घ': 'gh',
    'ङ': 'ṅ',
    'च': 'c',
    'छ': 'ch',
    'ज': 'j',
    'झ': 'jh',
    'ञ': 'ñ',
    'ट': 'ṭ',
    'ठ': 'ṭh',
    'ड': 'ḍ',
    'ढ': 'ḍh',
    'ण': 'ṇ',
    'त': 't',
    'थ': 'th',
    'द': 'd',
    'ध': 'dh',
    'न': 'n',
    'प': 'p',
    'फ': 'ph',
    'ब': 'b',
    'भ': 'bh',
    'म': 'm',
    'य': 'y',
    'र': 'r',
    'ल': 'l',
    'व': 'v',
    'श': 'ś',
    'ष': 'ṣ',
    'स': 's',
    'ह': 'h',
    'ऴ': 'ḻ',
    'ळ': 'ḷ',
    'ऴ': 'ḻ',
    'क़': 'q',
    'ख़': 'x',
    'ग़': 'ġ',
    'ज़': 'z',
    'ड़': 'ṛ',
    'ढ़': 'ṛh',
    'फ़': 'f',
    'य़': 'ẏ',
    'ऩ': 'ṉ',
    'ऱ': 'ṟ',
    'त़': 'ṯ',
    'द़': 'ḏ',
    'ह़': 'ẖ',
    'स़': 's̱',
    'ॸ': 'ḍḍ',
    'ॹ': 'ž',
    'ॺ': 'yy',
    'ॻ': 'gg',
    'ॼ': 'jj',
    'ॾ': 'ddd',
    'ॿ': 'bb',
    'ॽ': 'ʔ',
  },
  signs: <String, String>{
    'ँ': '\u0310',
    'ं': 'ṃ',
    'ः': 'ḥ',
    'ऽ': "'",
    'ॐ': 'oṃ',
    '॑': '\u0301',
    '॒': '\u0300',
    '᳚': '\u0302',
    'ᳪ': 'm\u0310',
    '।': '|',
    '॥': '||',
  },
  digits: <String, String>{
    '०': '0',
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
  },
);

const _gujarati = _ScriptConfig(
  virama: '્',
  nukta: '઼',
  independentVowels: <String, String>{
    'અ': 'a',
    'આ': 'ā',
    'ઇ': 'i',
    'ઈ': 'ī',
    'ઉ': 'u',
    'ઊ': 'ū',
    'ઋ': 'ṛ',
    'ૠ': 'ṝ',
    'ઌ': 'ḷ',
    'ૡ': 'ḹ',
    'ઍ': 'ĕ',
    'એ': 'e',
    'ઐ': 'ai',
    'ઑ': 'ŏ',
    'ઓ': 'o',
    'ઔ': 'au',
  },
  vowelSigns: <String, String>{
    'ા': 'ā',
    'િ': 'i',
    'ી': 'ī',
    'ુ': 'u',
    'ૂ': 'ū',
    'ૃ': 'ṛ',
    'ૄ': 'ṝ',
    'ૢ': 'ḷ',
    'ૣ': 'ḹ',
    'ૅ': 'ĕ',
    'ે': 'e',
    'ૈ': 'ai',
    'ૉ': 'ŏ',
    'ો': 'o',
    'ૌ': 'au',
  },
  consonants: <String, String>{
    'ક': 'k',
    'ખ': 'kh',
    'ગ': 'g',
    'ઘ': 'gh',
    'ઙ': 'ṅ',
    'ચ': 'c',
    'છ': 'ch',
    'જ': 'j',
    'ઝ': 'jh',
    'ઞ': 'ñ',
    'ટ': 'ṭ',
    'ઠ': 'ṭh',
    'ડ': 'ḍ',
    'ઢ': 'ḍh',
    'ણ': 'ṇ',
    'ત': 't',
    'થ': 'th',
    'દ': 'd',
    'ધ': 'dh',
    'ન': 'n',
    'પ': 'p',
    'ફ': 'ph',
    'બ઼': 'ɓ',
    'બ': 'b',
    'ભ': 'bh',
    'મ': 'm',
    'ય': 'y',
    'ર': 'r',
    'લ': 'l',
    'વ': 'v',
    'શ': 'ś',
    'ષ': 'ṣ',
    'સ': 's',
    'હ': 'h',
    'ળ': 'ḷ',
    'ૹ': 'ḻ',
    'ક઼': 'q',
    'ખ઼': 'x',
    'ગ઼': 'ġ',
    'જ઼': 'z',
    'ડ઼': 'ṛ',
    'ઢ઼': 'ṛh',
    'ફ઼': 'f',
    'ય઼': 'ẏ',
    'ન઼': 'ṉ',
    'ર઼': 'ṟ',
    'ત઼': 'ṯ',
    'દ઼': 'ḏ',
    'હ઼': 'ẖ',
    'સ઼': 's̱',
  },
  signs: <String, String>{
    'ઁ': '\u0310',
    'ં': 'ṃ',
    'ઃ': 'ḥ',
    'ઽ': "'",
    'ૐ': 'oṃ',
    '॑': '\u0301',
    '॒': '\u0300',
    '᳚': '\u0302',
    'ᳪ': 'm\u0310',
    '।': '|',
    '॥': '||',
  },
  digits: <String, String>{
    '૦': '0',
    '૧': '1',
    '૨': '2',
    '૩': '3',
    '૪': '4',
    '૫': '5',
    '૬': '6',
    '૭': '7',
    '૮': '8',
    '૯': '9',
  },
);
