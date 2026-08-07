import 'transliteration_core.dart';

/// Direct Gujarati <-> Devanagari conversion.
///
/// Visible conversion is canonical and necessarily non-injective where the two
/// Unicode repertoires differ. Exact source recovery uses the package's existing
/// checksummed invisible metadata trailer.
enum IndicScriptUnknownPolicy {
  preserve,
  throwError,
}

enum IndicScriptDigitPolicy {
  convertToTarget,
  preserveSource,
}

class IndicScriptConversionOptions {
  const IndicScriptConversionOptions({
    this.inputNormalization = UnicodeNormalizationForm.nfd,
    this.outputNormalization = UnicodeNormalizationForm.nfc,
    this.unknownPolicy = IndicScriptUnknownPolicy.preserve,
    this.digitPolicy = IndicScriptDigitPolicy.convertToTarget,
    this.collapseWhitespace = false,
    this.embedExactSourceMetadata = false,
  });

  final UnicodeNormalizationForm inputNormalization;
  final UnicodeNormalizationForm outputNormalization;
  final IndicScriptUnknownPolicy unknownPolicy;
  final IndicScriptDigitPolicy digitPolicy;
  final bool collapseWhitespace;
  final bool embedExactSourceMetadata;
}

extension GujaratiDevanagariConversion on String {
  /// Returns an exact embedded Devanagari source when present; otherwise
  /// performs canonical Gujarati -> Devanagari conversion.
  String toDevanagariFromGujarati({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      _recoverTypedExactSource(
        this,
        _devaSourceMetadataPrefix,
      ) ??
      toCanonicalDevanagariFromGujarati(options: options);

  /// Always performs visible canonical Gujarati -> Devanagari conversion.
  String toCanonicalDevanagariFromGujarati({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      _convertCanonical(
        this,
        options,
        sourceName: 'Gujarati',
        singleMap: _gujrToDevaSingle,
        sequenceRules: _gujrToDevaSequenceRules,
        sourceDigitStart: _gujrDigitStart,
        sourceDigitEnd: _gujrDigitEnd,
        targetDigitStart: _devaDigitStart,
        metadataSourcePrefix: _gujrSourceMetadataPrefix,
      );

  /// Requires metadata embedded by a previous Devanagari -> Gujarati
  /// conversion.
  String toExactDevanagariFromGujarati() {
    if (isEmpty) return '';
    final exact = _recoverTypedExactSource(
      this,
      _devaSourceMetadataPrefix,
    );
    if (exact == null) {
      throw const FormatException(
        'No valid embedded exact-source metadata was found. Convert with '
        'IndicScriptConversionOptions(embedExactSourceMetadata: true).',
      );
    }
    return exact;
  }

  /// Returns an exact embedded Gujarati source when present; otherwise
  /// performs canonical Devanagari -> Gujarati conversion.
  String toGujaratiFromDevanagari({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      _recoverTypedExactSource(
        this,
        _gujrSourceMetadataPrefix,
      ) ??
      toCanonicalGujaratiFromDevanagari(options: options);

  /// Always performs visible canonical Devanagari -> Gujarati conversion.
  String toCanonicalGujaratiFromDevanagari({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      _convertCanonical(
        this,
        options,
        sourceName: 'Devanagari',
        singleMap: _devaToGujrSingle,
        sequenceRules: _devaToGujrSequenceRules,
        sourceDigitStart: _devaDigitStart,
        sourceDigitEnd: _devaDigitEnd,
        targetDigitStart: _gujrDigitStart,
        metadataSourcePrefix: _devaSourceMetadataPrefix,
      );

  /// Requires metadata embedded by a previous Gujarati -> Devanagari
  /// conversion.
  String toExactGujaratiFromDevanagari() {
    if (isEmpty) return '';
    final exact = _recoverTypedExactSource(
      this,
      _gujrSourceMetadataPrefix,
    );
    if (exact == null) {
      throw const FormatException(
        'No valid embedded exact-source metadata was found. Convert with '
        'IndicScriptConversionOptions(embedExactSourceMetadata: true).',
      );
    }
    return exact;
  }

  bool get hasExactDevanagariSourceMetadata =>
      _recoverTypedExactSource(this, _devaSourceMetadataPrefix) != null;

  bool get hasExactGujaratiSourceMetadata =>
      _recoverTypedExactSource(this, _gujrSourceMetadataPrefix) != null;

  String get visibleWithoutExactScriptSourceMetadata =>
      stripExactSourceMetadata(this);
}

String toCanonicalDevanagariFromGujarati(
  String input, {
  IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
}) =>
    input.toCanonicalDevanagariFromGujarati(options: options);

String toDevanagariFromGujarati(
  String input, {
  IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
}) =>
    input.toDevanagariFromGujarati(options: options);

String toExactDevanagariFromGujarati(String input) =>
    input.toExactDevanagariFromGujarati();

String toCanonicalGujaratiFromDevanagari(
  String input, {
  IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
}) =>
    input.toCanonicalGujaratiFromDevanagari(options: options);

String toGujaratiFromDevanagari(
  String input, {
  IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
}) =>
    input.toGujaratiFromDevanagari(options: options);

String toExactGujaratiFromDevanagari(String input) =>
    input.toExactGujaratiFromDevanagari();

const int _devaDigitStart = 0x0966;
const int _devaDigitEnd = 0x096F;
const int _gujrDigitStart = 0x0AE6;
const int _gujrDigitEnd = 0x0AEF;

const String _devaSourceMetadataPrefix = '\u0000ISC:D:';
const String _gujrSourceMetadataPrefix = '\u0000ISC:G:';

Map<String, String> _buildOffsetMap(
  List<({int start, int end, int delta})> ranges,
) {
  final map = <String, String>{};
  for (final range in ranges) {
    for (var cp = range.start; cp <= range.end; cp += 1) {
      map[String.fromCharCode(cp)] = String.fromCharCode(cp + range.delta);
    }
  }
  return map;
}

final Map<String, String> _devaToGujrSingle = <String, String>{
  ..._buildOffsetMap(const [
    (start: 0x0901, end: 0x0903, delta: 0x0180),
    (start: 0x0905, end: 0x090C, delta: 0x0180),
    (start: 0x090F, end: 0x0910, delta: 0x0180),
    (start: 0x0913, end: 0x0928, delta: 0x0180),
    (start: 0x092A, end: 0x0930, delta: 0x0180),
    (start: 0x0932, end: 0x0933, delta: 0x0180),
    (start: 0x0935, end: 0x0939, delta: 0x0180),
    (start: 0x093C, end: 0x0945, delta: 0x0180),
    (start: 0x0947, end: 0x0949, delta: 0x0180),
    (start: 0x094B, end: 0x094D, delta: 0x0180),
    (start: 0x0960, end: 0x0963, delta: 0x0180),
    (start: 0x0966, end: 0x0971, delta: 0x0180),
  ]),
  'ॐ': 'ૐ',
  'ऄ': 'અ',
  'ऍ': 'ઍ',
  'ऎ': 'ઍ',
  'ऑ': 'ઑ',
  'ऒ': 'ઑ',
  'ॲ': 'ઍ',
  'ॳ': 'ઓએ',
  'ॴ': 'ઓએ',
  'ॵ': 'ઑ',
  'ॶ': 'ઉએ',
  'ॷ': 'ઊએ',
  'ऺ': 'ોએ',
  'ऻ': 'ોએ',
  'ॆ': 'ૅ',
  'ॊ': 'ૉ',
  'ॏ': 'ૉ',
  'ॖ': 'ુએ',
  'ॗ': 'ૂએ',
  'ऩ': 'ન઼',
  'ऱ': 'ર઼',
  'ऴ': 'ળ',
  'क़': 'ક઼',
  'ख़': 'ખ઼',
  'ग़': 'ગ઼',
  'ज़': 'જ઼',
  'ड़': 'ડ઼',
  'ढ़': 'ઢ઼',
  'फ़': 'ફ઼',
  'य़': 'ય઼',
  'ॸ': 'ડ઼',
  'ॹ': 'ૹ',
  'ॺ': 'ય઼',
  'ॻ': 'ગ઼',
  'ॼ': 'જ઼',
  'ॽ': 'ઽ',
  'ॾ': 'ડ઼',
  'ॿ': 'બ઼',
};

final Map<String, String> _gujrToDevaSingle = <String, String>{
  ..._buildOffsetMap(const [
    (start: 0x0A81, end: 0x0A83, delta: -0x0180),
    (start: 0x0A85, end: 0x0A8C, delta: -0x0180),
    (start: 0x0A8F, end: 0x0A90, delta: -0x0180),
    (start: 0x0A93, end: 0x0AA8, delta: -0x0180),
    (start: 0x0AAA, end: 0x0AB0, delta: -0x0180),
    (start: 0x0AB2, end: 0x0AB3, delta: -0x0180),
    (start: 0x0AB5, end: 0x0AB9, delta: -0x0180),
    (start: 0x0ABC, end: 0x0AC5, delta: -0x0180),
    (start: 0x0AC7, end: 0x0AC9, delta: -0x0180),
    (start: 0x0ACB, end: 0x0ACD, delta: -0x0180),
    (start: 0x0AE0, end: 0x0AE3, delta: -0x0180),
    (start: 0x0AE6, end: 0x0AF1, delta: -0x0180),
  ]),
  'ૐ': 'ॐ',
  'ઍ': 'ऎ',
  'ઑ': 'ऒ',
  'ૅ': 'ॆ',
  'ૉ': 'ॊ',
  'ૹ': 'ॹ',
};

const Map<String, String> _devaToGujrSequences = <String, String>{
  'ऩ': 'ન઼',
  'ऱ': 'ર઼',
  'ऴ': 'ળ',
  'क़': 'ક઼',
  'ख़': 'ખ઼',
  'ग़': 'ગ઼',
  'ज़': 'જ઼',
  'ड़': 'ડ઼',
  'ढ़': 'ઢ઼',
  'फ़': 'ફ઼',
  'य़': 'ય઼',
  'त़': 'ત઼',
  'द़': 'દ઼',
  'ह़': 'હ઼',
  'स़': 'સ઼',
  'ब़': 'બ઼',
};

const Map<String, String> _gujrToDevaSequences = <String, String>{
  'ન઼': 'ऩ',
  'ર઼': 'ऱ',
  'ક઼': 'क़',
  'ખ઼': 'ख़',
  'ગ઼': 'ग़',
  'જ઼': 'ज़',
  'ડ઼': 'ड़',
  'ઢ઼': 'ढ़',
  'ફ઼': 'फ़',
  'ય઼': 'य़',
  'ત઼': 'त़',
  'દ઼': 'द़',
  'હ઼': 'ह़',
  'સ઼': 'स़',
  'બ઼': 'ॿ',
};

class _SequenceRule {
  const _SequenceRule(this.sourceRunes, this.target);

  final List<int> sourceRunes;
  final String target;
}

List<_SequenceRule> _buildSequenceRules(Map<String, String> mappings) {
  final rules = mappings.entries
      .map(
        (entry) => _SequenceRule(
          entry.key.runes.toList(growable: false),
          entry.value,
        ),
      )
      .toList(growable: false);
  rules.sort(
    (a, b) => b.sourceRunes.length.compareTo(a.sourceRunes.length),
  );
  return rules;
}

final List<_SequenceRule> _devaToGujrSequenceRules =
    _buildSequenceRules(_devaToGujrSequences);
final List<_SequenceRule> _gujrToDevaSequenceRules =
    _buildSequenceRules(_gujrToDevaSequences);

bool _matchesAt(List<int> runes, int index, List<int> key) {
  if (index + key.length > runes.length) return false;
  for (var offset = 0; offset < key.length; offset += 1) {
    if (runes[index + offset] != key[offset]) return false;
  }
  return true;
}

String _handleUnknown(
  String ch,
  IndicScriptConversionOptions options,
  String sourceName,
  int index,
) =>
    switch (options.unknownPolicy) {
      IndicScriptUnknownPolicy.preserve => ch,
      IndicScriptUnknownPolicy.throwError => throw FormatException(
          'Unmapped $sourceName character '
          'U+${ch.runes.first.toRadixString(16).toUpperCase().padLeft(4, '0')} '
          'at code-point offset $index.',
        ),
    };

String? _recoverTypedExactSource(String input, String expectedPrefix) {
  final recovered = recoverEmbeddedExactSource(input);
  if (recovered == null || !recovered.startsWith(expectedPrefix)) return null;
  return recovered.substring(expectedPrefix.length);
}

String _convertCanonical(
  String input,
  IndicScriptConversionOptions options, {
  required String sourceName,
  required Map<String, String> singleMap,
  required List<_SequenceRule> sequenceRules,
  required int sourceDigitStart,
  required int sourceDigitEnd,
  required int targetDigitStart,
  required String metadataSourcePrefix,
}) {
  final visibleInput = stripExactSourceMetadata(input);

  final normalized = normalizeUnicode(
    visibleInput,
    options.inputNormalization,
  );
  final runes = normalized.runes.toList(growable: false);
  final out = StringBuffer();
  var index = 0;

  while (index < runes.length) {
    var matched = false;
    for (final rule in sequenceRules) {
      if (!_matchesAt(runes, index, rule.sourceRunes)) continue;
      out.write(rule.target);
      index += rule.sourceRunes.length;
      matched = true;
      break;
    }
    if (matched) continue;

    final rune = runes[index];
    final ch = String.fromCharCode(rune);

    if (rune >= sourceDigitStart && rune <= sourceDigitEnd) {
      out.write(
        switch (options.digitPolicy) {
          IndicScriptDigitPolicy.preserveSource => ch,
          IndicScriptDigitPolicy.convertToTarget =>
            String.fromCharCode(targetDigitStart + rune - sourceDigitStart),
        },
      );
      index += 1;
      continue;
    }

    out.write(singleMap[ch] ?? _handleUnknown(ch, options, sourceName, index));
    index += 1;
  }

  var rendered = normalizeUnicode(out.toString(), options.outputNormalization);
  if (options.collapseWhitespace) {
    rendered = rendered.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  return options.embedExactSourceMetadata
      ? embedExactSourceMetadata(
          rendered,
          '$metadataSourcePrefix$visibleInput',
        )
      : rendered;
}
