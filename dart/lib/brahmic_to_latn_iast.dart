import 'latn_iast_transcription.dart';
import 'transliteration_core.dart';

/// Options for script-to-IAST reverse transliteration.
class ScriptToIastOptions {
  /// Creates options for script-to-IAST reverse transliteration.
  const ScriptToIastOptions({
    this.inputNormalization = UnicodeNormalizationForm.nfd,
    this.outputNormalization = UnicodeNormalizationForm.nfc,
    this.preserveUnmapped = true,
    this.preserveEncodedVedicMarks = true,
  });

  /// Input Unicode normalization form.
  final UnicodeNormalizationForm inputNormalization;

  /// Output Unicode normalization form.
  final UnicodeNormalizationForm outputNormalization;

  /// Whether to preserve unmapped characters in output.
  final bool preserveUnmapped;

  /// Whether to preserve encoded Vedic marks in output.
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

  /// Direct Devanagari -> natural Plain-English transcription.
  String toPlainEnglishFromDevanagari({
    BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(),
  }) =>
      _toPlainEnglishFromBrahmic(
        this,
        _devanagari,
        BrahmicLanguage.hindi,
        options,
      );

  /// Direct Devanagari -> Hunterian transcription.
  String toHunterianFromDevanagari({
    BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(
      vowelLength: BrahmicVowelLengthPolicy.collapse,
    ),
  }) =>
      _toPlainEnglishFromBrahmic(
        this,
        _devanagari,
        BrahmicLanguage.hindi,
        options,
        PlainEnglishRomanizationProfile.hunterian,
      );

  /// Returns true if an embedded exact Devanagari IAST source metadata trailer is attached.
  bool get hasExactDevanagariIastSourceMetadata => hasEmbeddedExactSource(this);

  /// Returns the visible text without the exact Devanagari IAST source metadata trailer.
  String get visibleDevanagariWithoutExactSourceMetadata =>
      stripExactSourceMetadata(this);
}

/// Extension methods on [String] for Gujarati to IAST transliteration.
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

  /// Direct Gujarati -> natural Plain-English transcription.
  String toPlainEnglishFromGujarati({
    BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(),
  }) =>
      _toPlainEnglishFromBrahmic(
        this,
        _gujarati,
        BrahmicLanguage.gujarati,
        options,
      );

  /// Direct Gujarati -> Hunterian transcription.
  String toHunterianFromGujarati({
    BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(
      vowelLength: BrahmicVowelLengthPolicy.collapse,
    ),
  }) =>
      _toPlainEnglishFromBrahmic(
        this,
        _gujarati,
        BrahmicLanguage.gujarati,
        options,
        PlainEnglishRomanizationProfile.hunterian,
      );

  /// Returns true if an embedded exact Gujarati IAST source metadata trailer is attached.
  bool get hasExactGujaratiIastSourceMetadata => hasEmbeddedExactSource(this);

  /// Returns the visible text without the exact Gujarati IAST source metadata trailer.
  String get visibleGujaratiWithoutExactSourceMetadata =>
      stripExactSourceMetadata(this);
}

const _inherentSchwa = '\uE100';
const _semanticOm = '\uE102';

enum BrahmicLanguage { auto, hindi, gujarati, sanskrit }

enum BrahmicSchwaDeletionPolicy { none, finalOnly, language }

enum BrahmicVowelLengthPolicy { collapse, doubled }

enum TerminalAnusvaraPolicy { n, m, drop }

enum AynPolicy { apostrophe, drop, preserve }

/// Options for direct Brahmic -> human-readable Latin transcription.
class BrahmicPlainEnglishOptions {
  const BrahmicPlainEnglishOptions({
    this.language = BrahmicLanguage.auto,
    this.schwaDeletion = BrahmicSchwaDeletionPolicy.language,
    this.vowelLength = BrahmicVowelLengthPolicy.doubled,
    this.terminalAnusvara = TerminalAnusvaraPolicy.n,
    this.ayn = AynPolicy.apostrophe,
    this.jna = JnaPolicy.gya,
    this.nya = NyaPolicy.na,
    this.glottalStop = GlottalStopPolicy.remove,
    this.convertCToCh = true,
    this.assimilateAnusvara = true,
    this.removeAvagraha = true,
    this.collapseWhitespace = false,
    this.preserveVedicAccentMarks = false,
    this.useWForVAfterConsonants,
  });

  final BrahmicLanguage language;
  final BrahmicSchwaDeletionPolicy schwaDeletion;
  final BrahmicVowelLengthPolicy vowelLength;
  final TerminalAnusvaraPolicy terminalAnusvara;
  final AynPolicy ayn;
  final JnaPolicy jna;
  final NyaPolicy nya;
  final GlottalStopPolicy glottalStop;
  final bool convertCToCh;
  final bool assimilateAnusvara;
  final bool removeAvagraha;
  final bool collapseWhitespace;
  final bool preserveVedicAccentMarks;
  final bool? useWForVAfterConsonants;
}

bool _isSourceLatinBase(String ch) {
  final cp = ch.runes.single;
  return (cp >= 0x41 && cp <= 0x5A) ||
      (cp >= 0x61 && cp <= 0x7A) ||
      (cp >= 0x00C0 && cp <= 0x024F) ||
      (cp >= 0x0250 && cp <= 0x02FF) ||
      (cp >= 0x1E00 && cp <= 0x1EFF);
}

bool _isSourceLatinCombiningMark(String ch) {
  final cp = ch.runes.single;
  return (cp >= 0x0300 && cp <= 0x036F) ||
      (cp >= 0x1AB0 && cp <= 0x1AFF) ||
      (cp >= 0x1DC0 && cp <= 0x1DFF) ||
      (cp >= 0xFE20 && cp <= 0xFE2F);
}

bool _isSourceLatinPunctuation(String ch) => ch == '‘' || ch == '’';

(String, List<(String, String)>) _protectSourceLatin(String text) {
  final chars = text.runes.map(String.fromCharCode).toList();
  final spans = <(String, String)>[];
  final out = StringBuffer();
  var i = 0;
  var nextToken = 0xF0000;

  String allocateToken() {
    while (nextToken <= 0x10FFFD) {
      if (nextToken > 0xFFFFD && nextToken < 0x100000) {
        nextToken = 0x100000;
      }
      final token = String.fromCharCode(nextToken);
      nextToken += 1;
      if (!text.contains(token)) return token;
    }
    throw StateError(
        'Too many protected Latin spans in Brahmic transcription input.');
  }

  while (i < chars.length) {
    if (_isSourceLatinPunctuation(chars[i])) {
      final token = allocateToken();
      spans.add((token, chars[i]));
      out.write(token);
      i += 1;
      continue;
    }
    if (!_isSourceLatinBase(chars[i])) {
      out.write(chars[i]);
      i += 1;
      continue;
    }

    final start = i;
    i += 1;
    while (i < chars.length &&
        (_isSourceLatinBase(chars[i]) ||
            _isSourceLatinCombiningMark(chars[i]))) {
      i += 1;
    }

    final token = allocateToken();
    spans.add((token, chars.sublist(start, i).join()));
    out.write(token);
  }

  return (out.toString(), spans);
}

String _restoreSourceLatin(String text, List<(String, String)> spans) {
  var result = text;
  for (final (token, original) in spans) {
    result = result.replaceAll(token, original);
  }
  return result;
}

class _NaturalToken {
  _NaturalToken(this.type, this.text, {this.implicit = false});
  final String type;
  String text;
  final bool implicit;
  bool deleted = false;
}

const _iastVowels = <String>{
  'a',
  'ā',
  'i',
  'ī',
  'u',
  'ū',
  'e',
  'ē',
  'o',
  'ō',
  'ṛ',
  'ṝ',
  'ḷ',
  'ḹ',
  'ă',
  'ê',
  'ĕ',
  'ĭ',
  'ô',
  'ŏ',
  'æ',
  'œ'
};
const _iastSigns = <String>{'ṃ', 'ṁ', 'ḥ'};
const _aspirated = <String>{
  'kh',
  'gh',
  'ch',
  'jh',
  'ṭh',
  'ḍh',
  'th',
  'dh',
  'ph',
  'bh',
  'ṛh'
};

bool _isTranscriptionWordChar(String ch) {
  if (ch == _inherentSchwa) return true;
  final rune = ch.runes.single;
  return (rune >= 0x41 && rune <= 0x5A) ||
      (rune >= 0x61 && rune <= 0x7A) ||
      (rune >= 0x00C0 && rune <= 0x024F) ||
      (rune >= 0x0250 && rune <= 0x02FF) ||
      (rune >= 0x1E00 && rune <= 0x1EFF) ||
      isUnicodeCombiningMark(rune);
}

List<_NaturalToken> _tokenizeAnnotatedWord(String word) {
  final chars = word.runes.map(String.fromCharCode).toList();
  final tokens = <_NaturalToken>[];
  var i = 0;
  while (i < chars.length) {
    final ch = chars[i];
    if (ch == _inherentSchwa) {
      tokens.add(_NaturalToken('vowel', 'a', implicit: true));
      i += 1;
      continue;
    }
    final pair = i + 1 < chars.length ? '$ch${chars[i + 1]}' : '';
    if (pair == 'ai' || pair == 'au') {
      tokens.add(_NaturalToken('vowel', pair));
      i += 2;
      continue;
    }
    if (_aspirated.contains(pair.toLowerCase())) {
      tokens.add(_NaturalToken('consonant', pair));
      i += 2;
      continue;
    }
    if (_iastVowels.contains(ch.toLowerCase())) {
      tokens.add(_NaturalToken('vowel', ch));
      i += 1;
      continue;
    }
    if (_iastSigns.contains(ch)) {
      tokens.add(_NaturalToken('sign', ch));
      i += 1;
      continue;
    }
    if (isUnicodeCombiningMark(ch.runes.single)) {
      if (tokens.isNotEmpty) {
        tokens.last.text += ch;
      } else {
        tokens.add(_NaturalToken('other', ch));
      }
      i += 1;
      continue;
    }
    final rune = ch.runes.single;
    final isLetter = (rune >= 0x41 && rune <= 0x5A) ||
        (rune >= 0x61 && rune <= 0x7A) ||
        (rune >= 0x00C0 && rune <= 0x024F) ||
        (rune >= 0x1E00 && rune <= 0x1EFF);
    tokens.add(_NaturalToken(isLetter ? 'consonant' : 'other', ch));
    i += 1;
  }
  return tokens;
}

String _baseConsonant(_NaturalToken token) {
  var value = token.text.toLowerCase();
  if (value.endsWith('h') && value.runes.length > 1) {
    value = String.fromCharCodes(value.runes.toList()..removeLast());
  }
  return value;
}

bool _allowsSchwaCluster(
  _NaturalToken left,
  _NaturalToken right,
  BrahmicLanguage language,
) {
  final a = _baseConsonant(left);
  final b = _baseConsonant(right);
  if (a.isEmpty || b.isEmpty) return false;
  if (language == BrahmicLanguage.gujarati) {
    if (b == 'v' || b == 'n') return true;
    return {'b+t', 'r+m', 'ś+m', 'ṣ+m', 's+m', 'ṇ+l', 'n+l'}.contains('$a+$b');
  }
  if ({'r', 'y', 'v'}.contains(b)) return true;
  if (a == 'r' &&
      {
        'k',
        'kh',
        'g',
        'gh',
        'c',
        'ch',
        'j',
        'jh',
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
        's',
        'sh',
        'h'
      }.contains(b)) {
    return true;
  }
  if ({'m', 'n'}.contains(a) &&
      {'k', 'g', 'c', 'j', 't', 'd', 'p', 'b'}.contains(b)) {
    return true;
  }
  return {
    'k+t',
    'k+s',
    'g+d',
    'g+n',
    't+r',
    't+y',
    't+v',
    'd+r',
    'd+y',
    'd+v',
    'p+r',
    'p+y',
    'p+v',
    'b+r',
    'b+y',
    'b+v',
    'b+t',
    'h+m',
    's+t',
    's+k',
    's+p',
    's+m',
    's+n',
    's+l',
    's+v',
    'j+v',
    'c+v',
    'l+y',
    'n+y',
    'm+y',
  }.contains('$a+$b');
}

bool _shouldKeepFinalSchwa(List<_NaturalToken> tokens, int lastIndex) {
  if (lastIndex < 2) return false;
  final bearing = tokens[lastIndex - 1];
  final previous = tokens[lastIndex - 2];
  if (bearing.type != 'consonant' || previous.type != 'consonant') return false;
  return {'r+y', 'l+y', 'n+y', 'm+y', 'g+y', 'ś+ṇ', 'ṣ+ṇ', 's+ṇ'}
      .contains('${_baseConsonant(previous)}+${_baseConsonant(bearing)}');
}

String _naturalizeAnnotatedWord(
  String word,
  BrahmicLanguage language,
  BrahmicSchwaDeletionPolicy policy,
) {
  final tokens = _tokenizeAnnotatedWord(word);
  if (policy == BrahmicSchwaDeletionPolicy.none ||
      language == BrahmicLanguage.sanskrit) {
    return tokens.map((t) => t.text).join();
  }
  int vowelCount() =>
      tokens.where((t) => t.type == 'vowel' && !t.deleted).length;
  var last = tokens.length - 1;
  while (last >= 0 && tokens[last].type == 'other') {
    last -= 1;
  }
  if (last >= 0 &&
      tokens[last].implicit &&
      vowelCount() > 1 &&
      !_shouldKeepFinalSchwa(tokens, last)) {
    tokens[last].deleted = true;
  }
  if (policy == BrahmicSchwaDeletionPolicy.language) {
    for (var i = tokens.length - 2; i >= 2; i -= 1) {
      final schwa = tokens[i];
      if (!schwa.implicit || schwa.deleted) continue;
      var nextIndex = i + 1;
      while (nextIndex < tokens.length && tokens[nextIndex].deleted) {
        nextIndex += 1;
      }
      var afterNext = nextIndex + 1;
      while (afterNext < tokens.length && tokens[afterNext].deleted) {
        afterNext += 1;
      }
      if (tokens[i - 1].type == 'consonant' &&
          tokens[i - 2].type == 'vowel' &&
          nextIndex < tokens.length &&
          tokens[nextIndex].type == 'consonant' &&
          afterNext < tokens.length &&
          tokens[afterNext].type == 'vowel' &&
          _allowsSchwaCluster(tokens[i - 1], tokens[nextIndex], language)) {
        schwa.deleted = true;
      }
    }
  }
  return tokens.map((t) => t.deleted ? '' : t.text).join();
}

String _naturalizeAnnotatedIast(
  String text,
  BrahmicLanguage language,
  BrahmicSchwaDeletionPolicy policy,
) {
  final chars = text.runes.map(String.fromCharCode).toList();
  final out = StringBuffer();
  var i = 0;
  while (i < chars.length) {
    if (!_isTranscriptionWordChar(chars[i])) {
      out.write(chars[i++]);
      continue;
    }
    final start = i++;
    while (i < chars.length && _isTranscriptionWordChar(chars[i])) {
      i += 1;
    }
    out.write(_naturalizeAnnotatedWord(
        chars.sublist(start, i).join(), language, policy));
  }
  return out.toString();
}

String _applyReadableVowelLength(String text, BrahmicVowelLengthPolicy policy) {
  if (policy != BrahmicVowelLengthPolicy.doubled) return text;
  for (final replacement in <(String, String)>[
    ('āī', 'aai'),
    ('Āī', 'Aai'),
    ('aī', 'ai'),
    ('Aī', 'Ai'),
    ('ā', 'aa'),
    ('Ā', 'Aa'),
    ('ī', 'ee'),
    ('Ī', 'Ee'),
    ('ū', 'oo'),
    ('Ū', 'Oo'),
    ('ē', 'ee'),
    ('Ē', 'Ee'),
    ('ō', 'oo'),
    ('Ō', 'Oo'),
    ('ṝ', 'ree'),
    ('Ṝ', 'Ree'),
    ('ḹ', 'lee'),
    ('Ḹ', 'Lee'),
  ]) {
    text = text.replaceAll(replacement.$1, replacement.$2);
  }
  return text;
}

String _applyAynPolicy(String text, AynPolicy policy) {
  if (policy == AynPolicy.preserve) return text;
  return text.replaceAll('ʿ', policy == AynPolicy.drop ? '' : "'");
}

String _protectSemanticOm(String text) =>
    text.replaceAll(RegExp('[ॐૐꣽ]'), _semanticOm);

String _restoreSemanticOm(String text) => text.replaceAll(_semanticOm, 'om');

String _applyTerminalAnusvara(String text, TerminalAnusvaraPolicy policy) {
  final replacement = switch (policy) {
    TerminalAnusvaraPolicy.drop => '',
    TerminalAnusvaraPolicy.m => 'm',
    TerminalAnusvaraPolicy.n => 'n',
  };
  return text.replaceAllMapped(
    RegExp(r'[ṃṁ](?=$|[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF])'),
    (_) => replacement,
  );
}

String _applyReadableCandrabindu(
  String text,
  TerminalAnusvaraPolicy policy,
) {
  final replacement = switch (policy) {
    TerminalAnusvaraPolicy.drop => '',
    TerminalAnusvaraPolicy.m => 'm',
    TerminalAnusvaraPolicy.n => 'n',
  };
  return text.replaceAllMapped(
    RegExp(r'([aāiīuūeēoōṛṝḷḹăêĕĭôŏæœ])\u0310', caseSensitive: false),
    (match) => '${match.group(1)}$replacement',
  );
}

String _stripDanglingBrahmicModifiers(String text) =>
    text.replaceAll(RegExp('[़઼्્ૺૻૼ૽૾૿]'), '');

String _toPlainEnglishFromBrahmic(
  String text,
  _ScriptConfig config,
  BrahmicLanguage scriptLanguage,
  BrahmicPlainEnglishOptions options, [
  PlainEnglishRomanizationProfile? forcedProfile,
]) {
  final language = options.language == BrahmicLanguage.auto
      ? scriptLanguage
      : options.language;
  final (protectedText, protectedLatin) = _protectSourceLatin(text);
  final annotated = _BrahmicToIast.convert(
    _protectSemanticOm(protectedText),
    config,
    ScriptToIastOptions(
      preserveEncodedVedicMarks: options.preserveVedicAccentMarks,
    ),
    _inherentSchwa,
  );
  var iast = _stripDanglingBrahmicModifiers(
    _naturalizeAnnotatedIast(annotated, language, options.schwaDeletion),
  );
  iast = _applyReadableCandrabindu(iast, options.terminalAnusvara);
  iast = _applyTerminalAnusvara(iast, options.terminalAnusvara);
  iast = _applyReadableVowelLength(iast, options.vowelLength);
  final profile =
      forcedProfile ?? PlainEnglishRomanizationProfile.extendedIndic;
  final useW = options.useWForVAfterConsonants ?? false;
  final suppressGujaratiHunterianAutoW =
      profile == PlainEnglishRomanizationProfile.hunterian &&
          language == BrahmicLanguage.gujarati &&
          !useW;
  if (suppressGujaratiHunterianAutoW) {
    iast = _applyHunterianVisargaAbsorption(iast);
  }
  final engineProfile = suppressGujaratiHunterianAutoW
      ? PlainEnglishRomanizationProfile.extendedIndic
      : profile;
  var result = iast.toPlainEnglishFromIast(
    options: IastPlainEnglishOptions(
      finalA: FinalAPolicy.keep,
      jna: options.jna,
      nya: options.nya,
      profile: engineProfile,
      glottalStop: options.glottalStop,
      convertCToCh: options.convertCToCh,
      assimilateAnusvara: options.assimilateAnusvara,
      removeAvagraha: options.removeAvagraha,
      collapseWhitespace: options.collapseWhitespace,
      enableInternalSchwaSyncope: false,
      useWForVAfterConsonants: useW,
      preserveVedicAccentMarks: options.preserveVedicAccentMarks,
    ),
  );
  result = _applyAynPolicy(result, options.ayn);
  result = _restoreSemanticOm(result);
  result = _restoreSourceLatin(result, protectedLatin);
  return result;
}

String _applyHunterianVisargaAbsorption(String text) => text.replaceAllMapped(
      RegExp(r'(?:ḥ|Ḥ|h\u0323|H\u0323)([kKgGcCjJtTdDpPbBsSśŚṣṢhH])'),
      (match) => match.group(1)!,
    );

String toPlainEnglishFromDevanagari(
  String text, {
  BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(),
}) =>
    text.toPlainEnglishFromDevanagari(options: options);

String toHunterianFromDevanagari(
  String text, {
  BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(
    vowelLength: BrahmicVowelLengthPolicy.collapse,
  ),
}) =>
    text.toHunterianFromDevanagari(options: options);

String toPlainEnglishFromGujarati(
  String text, {
  BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(),
}) =>
    text.toPlainEnglishFromGujarati(options: options);

String toHunterianFromGujarati(
  String text, {
  BrahmicPlainEnglishOptions options = const BrahmicPlainEnglishOptions(
    vowelLength: BrahmicVowelLengthPolicy.collapse,
  ),
}) =>
    text.toHunterianFromGujarati(options: options);

class _ScriptConfig {
  const _ScriptConfig({
    required this.script,
    required this.virama,
    required this.nukta,
    required this.independentVowels,
    required this.vowelSigns,
    required this.consonants,
    required this.signs,
    required this.digits,
  });

  final String script;
  final String virama;
  final String nukta;
  final Map<String, String> independentVowels;
  final Map<String, String> vowelSigns;
  final Map<String, String> consonants;
  final Map<String, String> signs;
  final Map<String, String> digits;
}

/// Gujarati Arabic-transliteration marks (Ismaili Khoja usage).
const _gujaratiSukun = 'ૺ'; // U+0AFA: silences the inherent vowel.
const _gujaratiShadda = 'ૻ'; // U+0AFB: geminates the consonant.
const _gujaratiMaddah = 'ૼ'; // U+0AFC: elongates the vowel.

String _lengthenCanonicalVowel(String vowel) =>
    const <String, String>{
      'a': 'ā',
      'i': 'ī',
      'u': 'ū',
      'e': 'ē',
      'o': 'ō',
      'ă': 'ā',
      'ĕ': 'ē',
      'ŏ': 'ō',
      'ĭ': 'ī',
    }[vowel] ??
    vowel;

({String vowel, int width})? _readVowelSign(
  List<int> runes,
  int index,
  _ScriptConfig config,
) {
  if (index >= runes.length) return null;
  final ch = String.fromCharCode(runes[index]);
  if (config.script == 'devanagari' && ch == 'ॎ') {
    final following =
        index + 1 < runes.length ? String.fromCharCode(runes[index + 1]) : null;
    if (following == 'े') return (vowel: 'ai', width: 2);
    if (following == 'ा') return (vowel: 'o', width: 2);
    if (following == 'ो') return (vowel: 'au', width: 2);
    return (vowel: 'e', width: 1);
  }
  final vowel = config.vowelSigns[ch];
  return vowel == null ? null : (vowel: vowel, width: 1);
}

/// Cluster mappings for Gujarati consonant-modifying nuktas (U+0AFD..U+0AFF).
/// Returns null when the pair has no standardized mapping; callers then
/// preserve the mark character so the distinction is not silently dropped.
String? _gujaratiClusterTransliteration(String base, String mark) {
  // Documented Arabic pairs: SA + circle nukta -> THA (ث),
  // JA-family + circle nukta -> DHAL (ذ), + two-circle -> emphatic ZA (ظ).
  if (mark == '૾') {
    if (base == 'સ') return 'th';
    if (base == 'ઝ') return 'dh';
  }
  if (mark == '૿') {
    if (base == 'ઝ') return 'ẓ';
  }
  if (mark == '૽') {
    return const <String, String>{
      'ક': 'q',
      'ખ': 'x',
      'ગ': 'ġ',
      'ત': 'ṭ',
      'સ': 'ṣ',
      'ઝ': 'ḍ',
    }[base];
  }
  return null;
}

/// Latin pronunciation contributed by segmental Vedic/Extended signs, or
/// null for pure tone/cantillation annotations (handled separately).
String? _vedicSegmentalLatin(int rune) {
  // Vedic visarga modifiers keep the segmental visarga; tonal decoration
  // is dropped downstream.
  if (isVedicVisargaMark(rune)) return 'ḥ';
  // Vedic nasal/anusvara signs carry real nasal pronunciation.
  if (isVedicNasalMark(rune)) return 'ṃ';
  if (isVedicSegmentalSign(rune)) {
    // Ardhavisarga (not limited to Vedic usage) keeps its visarga value.
    if (rune == 0x1CF2 || rune == 0x1CF3) return 'ḥ';
    // Jihvamuliya (velar fricative) and upadhmāniya (bilabial fricative):
    // canonical output keeps the distinction; Plain/Hunterian folding
    // simplifies them contextually (`ḫ` -> `kh`, `f` stays).
    if (rune == 0x1CF5) return 'ḫ';
    return 'f';
  }
  // Specialized Devanagari nasalization signs (U+A8F2..U+A8F7).
  if (rune >= 0xA8F2 && rune <= 0xA8F6) {
    return rune == 0xA8F4 ? 'ṃṃ' : 'ṃ';
  }
  if (rune == 0xA8F7) return 'ṃ\'';
  return null;
}

class _BrahmicToIast {
  static String convert(
    String input,
    _ScriptConfig config,
    ScriptToIastOptions options, [
    String inherentVowel = 'a',
  ]) {
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
        var latin = independent;
        i += 1;
        if (config.script == 'gujarati' &&
            (ch == 'અ' || ch == 'ઇ') &&
            i < runes.length &&
            runes[i] == 0x0AFD) {
          latin = 'ʿ$latin';
          i += 1;
        }
        if (config.script == 'gujarati') {
          while (i < runes.length) {
            final mark = String.fromCharCode(runes[i]);
            if (mark == _gujaratiMaddah) {
              latin = _lengthenCanonicalVowel(latin);
              i += 1;
            } else if (mark == _gujaratiSukun) {
              // On an independent vowel U+0AFA is a pause mark, not vowel deletion.
              i += 1;
            } else {
              break;
            }
          }
        }
        out.write(latin);
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
        var latin = consonant;
        var cursor = i + consonantWidth;
        var geminated = false;
        var sukun = false;
        var maddah = false;

        // Gujarati Arabic-transliteration modifiers may stack. Accept both
        // canonical ordering and tolerant alternate ordering.
        if (config.script == 'gujarati') {
          var scanning = true;
          var specialNuktaSeen = false;
          while (scanning && cursor < runes.length) {
            final mark = String.fromCharCode(runes[cursor]);
            if (!specialNuktaSeen && isGujaratiConsonantNukta(runes[cursor])) {
              latin = _gujaratiClusterTransliteration(consonantKey, mark) ??
                  '$latin$mark';
              specialNuktaSeen = true;
              cursor += 1;
            } else if (mark == _gujaratiShadda) {
              geminated = true;
              cursor += 1;
            } else if (mark == _gujaratiSukun) {
              sukun = true;
              cursor += 1;
            } else if (mark == _gujaratiMaddah) {
              maddah = true;
              cursor += 1;
            } else {
              scanning = false;
            }
          }
        }

        final vowelInfo = _readVowelSign(runes, cursor, config);
        String? explicitVowel;
        if (vowelInfo != null) {
          explicitVowel = vowelInfo.vowel;
          cursor += vowelInfo.width;
          // An explicit vowel wins over a preceding/tolerated sukun.
          sukun = false;
          if (config.script == 'gujarati' &&
              cursor < runes.length &&
              String.fromCharCode(runes[cursor]) == _gujaratiMaddah) {
            maddah = true;
            cursor += 1;
          }
        }

        var virama = false;
        if (cursor < runes.length &&
            String.fromCharCode(runes[cursor]) == config.virama) {
          virama = true;
          cursor += 1;
        }

        // Be tolerant of trailing Gujarati recitation marks after the vowel.
        if (config.script == 'gujarati') {
          while (cursor < runes.length) {
            final mark = String.fromCharCode(runes[cursor]);
            if (mark == _gujaratiMaddah) {
              maddah = true;
              cursor += 1;
            } else if (mark == _gujaratiSukun) {
              // With an explicit vowel this is a tolerated pause mark, not a killer.
              if (explicitVowel == null) sukun = true;
              cursor += 1;
            } else if (mark == _gujaratiShadda) {
              geminated = true;
              cursor += 1;
            } else {
              break;
            }
          }
        }

        out.write(latin);
        if (geminated) out.write(latin);
        i = cursor;

        if (virama || sukun) continue;
        if (geminated && explicitVowel == null && !maddah) continue;

        var vowel = explicitVowel ?? inherentVowel;
        if (maddah) {
          vowel = _lengthenCanonicalVowel(vowel == inherentVowel ? 'a' : vowel);
        }
        out.write(vowel);
        continue;
      }

      final standaloneVowelSign = _readVowelSign(runes, i, config);
      if (standaloneVowelSign != null) {
        var vowel = standaloneVowelSign.vowel;
        i += standaloneVowelSign.width;
        if (config.script == 'gujarati' &&
            i < runes.length &&
            String.fromCharCode(runes[i]) == _gujaratiMaddah) {
          vowel = _lengthenCanonicalVowel(vowel);
          i += 1;
        }
        out.write(vowel);
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

      // Vedic segmental signs carry genuine pronunciation in every profile;
      // tone/cantillation annotations below are preserved or dropped.
      final segmental = _vedicSegmentalLatin(runes[i]);
      if (segmental != null) {
        out.write(segmental);
        // Retain the exact mark alongside its pronunciation so canonical
        // output stays faithful when preservation is requested.
        if (options.preserveEncodedVedicMarks) {
          out.write(ch);
        }
        i += 1;
        continue;
      }

      if (isVedicToneCantillationMark(runes[i]) ||
          isSamavedaCantillationMark(runes[i])) {
        // Pitch/cantillation annotations: preserved canonically, omitted
        // from pronunciation-oriented views by the caller pipeline.
        // (U+0951/0952/1CDA/1CEA reach here only when absent from the signs
        // table; the table's Latin aliases take precedence.)
        if (options.preserveEncodedVedicMarks) {
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

      // ZWJ/ZWNJ/CGJ: zero phonetic output; they never create or delete an
      // inherent schwa by themselves. Exact-source metadata still retains
      // the original input separately.
      if (isBrahmicFormatControl(runes[i])) {
        i += 1;
        continue;
      }

      // Dotted circle marks malformed/educational text: keep it only when
      // unmapped preservation is requested.
      if (runes[i] == 0x25CC) {
        if (options.preserveUnmapped) {
          out.write(ch);
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
        'ē',
        'o',
        'ō',
        'ă',
        'ê',
        'ĕ',
        'ĭ',
        'ô',
        'ŏ',
        'æ',
        'œ',
      }.contains(ch.toLowerCase());
}

const _devanagari = _ScriptConfig(
  script: 'devanagari',
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
    // Unicode 18.0: U+0955 candralong E, U+A8FE independent AY (short AI).
    '\u{0955}': 'ē',
    '\u{A8FE}': 'aĭ',
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
    // Unicode 18.0: U+094E prishthamatra E, U+0955 candra-long-E sign,
    // U+A8FF vowel-sign AY (short AI).
    '\u{094E}': 'e',
    '\u{0955}': 'ē',
    '\u{A8FF}': 'aĭ',
  },
  consonants: <String, String>{
    'क': 'k',
    'ख': 'kh',
    'ग': 'g',
    'घ': 'gh',
    'ङ': 'ṅ',
    'च': 'c',
    'च़': 'ċ',
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
    'ॻ': 'ɠ',
    'ॼ': 'ʄ',
    'ॾ': 'ɗ',
    'ॿ': 'ɓ',
    'ॽ': 'ʔ',
    // Unicode 18.0: precomposed nukta consonants (single code points, so
    // they also work under inputNormalization = preserve where NFD would
    // otherwise be needed to reach the sequence pairs above).
    '\u{0929}': 'ṉ',
    '\u{0931}': 'ṟ',
    '\u{0958}': 'q',
    '\u{0959}': 'x',
    '\u{095A}': 'ġ',
    '\u{095B}': 'z',
    '\u{095C}': 'ṛ',
    '\u{095D}': 'ṛh',
    '\u{095E}': 'f',
    '\u{095F}': 'ẏ',
    // Devanagari Extended-A alternate DDDA (Sindhi digitization).
    '\u{11B0A}': 'ɗ',
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
    // Unicode 18.0: inverted candrabindu, obsolete accents (normalized to
    // their combining forms, like U+0951/0952 above), abbreviation and
    // spacing-dot signs.
    '\u{0900}': '\u{0310}',
    '\u{0953}': '̀',
    '\u{0954}': '́',
    '\u{0970}': '॰',
    '\u{0971}': 'ॱ',
    // Devanagari Extended: Siddham invocation sign (preserved, not
    // pronounced) and Jain OM (semantic, like U+0950 above).
    '\u{A8FC}': '꣼',
    '\u{A8FD}': 'oṃ',
    // Devanagari manuscript/editorial signs: no pronunciation, preserved
    // exactly, never participating in schwa parsing.
    '\u{A8F8}': '꣸',
    '\u{A8F9}': '꣹',
    '\u{A8FA}': '꣺',
    '\u{A8FB}': 'ꣻ',
    // Devanagari Extended-A head/auspicious signs: preserved, zero phonology.
    '\u{11B00}': '𑬀',
    '\u{11B01}': '𑬁',
    '\u{11B02}': '𑬂',
    '\u{11B03}': '𑬃',
    '\u{11B04}': '𑬄',
    '\u{11B05}': '𑬅',
    '\u{11B06}': '𑬆',
    '\u{11B07}': '𑬇',
    '\u{11B08}': '𑬈',
    '\u{11B09}': '𑬉',
    // Common Indic Number Forms: historic fractions and marks, preserved.
    '\u{A830}': '꠰',
    '\u{A831}': '꠱',
    '\u{A832}': '꠲',
    '\u{A833}': '꠳',
    '\u{A834}': '꠴',
    '\u{A835}': '꠵',
    '\u{A836}': '꠶',
    '\u{A837}': '꠷',
    '\u{A838}': '꠸',
    '\u{A839}': '꠹',
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
  script: 'gujarati',
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
    // Unicode 18.0: Gujarati abbreviation and rupee signs, preserved.
    '\u{0AF0}': '૰',
    '\u{0AF1}': '૱',
    // Common Indic Number Forms: historic fractions and marks, preserved.
    '\u{A830}': '꠰',
    '\u{A831}': '꠱',
    '\u{A832}': '꠲',
    '\u{A833}': '꠳',
    '\u{A834}': '꠴',
    '\u{A835}': '꠵',
    '\u{A836}': '꠶',
    '\u{A837}': '꠷',
    '\u{A838}': '꠸',
    '\u{A839}': '꠹',
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
