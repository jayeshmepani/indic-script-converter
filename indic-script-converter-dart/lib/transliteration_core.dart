import 'dart:convert';
import 'dart:typed_data';

import 'package:unicode/unicode.dart' as unicode;
import 'package:unorm_dart/unorm_dart.dart' as unorm;

/// Normalization applied to the parsing copy or rendered output.
///
/// [preserve] never changes code points. [nfc] and [nfd] follow UAX #15 via
/// `package:unorm_dart` (Unicode 17 data in unorm_dart 0.3.2).
enum UnicodeNormalizationForm { preserve, nfc, nfd }

/// High-level standards/profile label carried in the reversible envelope.
enum TransliterationProfile {
  strictIast,
  iso15919Core,
  extendedIndic,
  hunterian,
  plainEnglish,
}

/// Severity of a diagnostic emitted while rendering a view.
enum TransliterationIssueSeverity { info, warning, error }

class TransliterationIssue {
  const TransliterationIssue({
    required this.code,
    required this.message,
    this.severity = TransliterationIssueSeverity.warning,
    this.sourceRuneOffset,
  });

  factory TransliterationIssue.fromJson(Map<String, Object?> json) =>
      TransliterationIssue(
        code: json['code']! as String,
        message: json['message']! as String,
        severity: TransliterationIssueSeverity.values.byName(
          json['severity']! as String,
        ),
        sourceRuneOffset: json['sourceRuneOffset'] as int?,
      );

  final String code;
  final String message;
  final TransliterationIssueSeverity severity;
  final int? sourceRuneOffset;

  Map<String, Object?> toJson() => <String, Object?>{
        'code': code,
        'message': message,
        'severity': severity.name,
        'sourceRuneOffset': sourceRuneOffset,
      };
}

/// Reversible envelope around any transliterated view.
///
/// The rendered string may be non-injective (Hunterian/plain English always
/// are), but the operation remains exactly reversible because [original] and
/// its code points are retained. Do not discard the envelope if exact source
/// recovery is required.
class LosslessTransliterationResult {
  const LosslessTransliterationResult({
    required this.original,
    required this.normalizedInput,
    required this.rendered,
    required this.profile,
    required this.inputNormalization,
    required this.outputNormalization,
    required this.renderingIsInjective,
    this.issues = const <TransliterationIssue>[],
  });

  factory LosslessTransliterationResult.fromJson(
    Map<String, Object?> json,
  ) {
    if (json['schema'] != 'indic-script-converter/1') {
      throw const FormatException('Unsupported transliteration envelope.');
    }

    final original = json['original']! as String;
    final encodedCodePoints = (json['originalCodePoints']! as List).cast<int>();
    final actualCodePoints = original.runes.toList(growable: false);
    if (!_sameInts(encodedCodePoints, actualCodePoints)) {
      throw const FormatException(
        'Envelope source code-point integrity check failed.',
      );
    }

    return LosslessTransliterationResult(
      original: original,
      normalizedInput: json['normalizedInput']! as String,
      rendered: json['rendered']! as String,
      profile: TransliterationProfile.values.byName(
        json['profile']! as String,
      ),
      inputNormalization: UnicodeNormalizationForm.values.byName(
        json['inputNormalization']! as String,
      ),
      outputNormalization: UnicodeNormalizationForm.values.byName(
        json['outputNormalization']! as String,
      ),
      renderingIsInjective: json['renderingIsInjective']! as bool,
      issues: (json['issues']! as List)
          .map(
            (item) => TransliterationIssue.fromJson(
              Map<String, Object?>.from(item! as Map),
            ),
          )
          .toList(growable: false),
    );
  }

  final String original;
  final String normalizedInput;
  final String rendered;
  final TransliterationProfile profile;
  final UnicodeNormalizationForm inputNormalization;
  final UnicodeNormalizationForm outputNormalization;

  /// True only when the selected rendering is one-to-one for the admitted
  /// profile. Hunterian and plain-English views must always set this false.
  final bool renderingIsInjective;
  final List<TransliterationIssue> issues;

  List<int> get originalCodePoints => original.runes.toList(growable: false);

  /// Exact original source, including case, NFC/NFD choice, mark order,
  /// punctuation, and aliases.
  String restoreOriginal() => original;

  bool get exactSourceRecoveryAvailable => true;
  bool get hasErrors => issues.any(
        (issue) => issue.severity == TransliterationIssueSeverity.error,
      );

  Map<String, Object?> toJson() => <String, Object?>{
        'schema': 'indic-script-converter/1',
        'original': original,
        'originalCodePoints': originalCodePoints,
        'normalizedInput': normalizedInput,
        'rendered': rendered,
        'profile': profile.name,
        'inputNormalization': inputNormalization.name,
        'outputNormalization': outputNormalization.name,
        'renderingIsInjective': renderingIsInjective,
        'issues': issues.map((issue) => issue.toJson()).toList(growable: false),
      };

  static bool _sameInts(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

String normalizeUnicode(String input, UnicodeNormalizationForm form) =>
    switch (form) {
      UnicodeNormalizationForm.preserve => input,
      UnicodeNormalizationForm.nfc => unorm.nfc(input),
      UnicodeNormalizationForm.nfd => unorm.nfd(input),
    };

/// True for every Unicode 17 mark category: Mn, Mc, or Me.
///
/// This avoids incomplete hand-maintained block ranges and follows the
/// Unicode general-category data shipped by `package:unicode`.
bool isUnicodeCombiningMark(int rune) =>
    unicode.isNonspacingMark(rune) ||
    unicode.isSpacingMark(rune) ||
    unicode.isEnclosingMark(rune);

/// All Unicode blocks used for encoded Vedic tone/sign data.
bool isEncodedVedicMark(int rune) =>
    rune == 0x0951 ||
    rune == 0x0952 ||
    (rune >= 0x1CD0 && rune <= 0x1CFF) ||
    (rune >= 0xA8E0 && rune <= 0xA8FF);

/// Invisible, self-validating exact-source metadata embedded at the end of a
/// rendered Brahmic string.
///
/// The visible script remains unchanged. The metadata uses Unicode Tag
/// characters (Plane 14), so most renderers do not display it. Exact recovery
/// is possible only while those code points are retained by storage, copying,
/// databases, normalization, and transport layers.
class EmbeddedExactSource {
  const EmbeddedExactSource({
    required this.visibleText,
    required this.originalSource,
  });

  final String visibleText;
  final String originalSource;
}

const int _exactSourceStartTag = 0xE0001;
const int _exactSourceEndTag = 0xE007F;
const String _exactSourceMagic = 'LIT1:';

/// Appends an invisible exact-source trailer to [rendered].
///
/// The source is encoded from the exact Dart UTF-16 code-unit sequence rather
/// than from a normalized form, so case, NFC/NFD choice, combining-mark order,
/// punctuation, aliases, and even unpaired UTF-16 code units are retained.
String embedExactSourceMetadata(String rendered, String originalSource) {
  final bytes = _stringToUtf16Le(originalSource);
  final encoded = base64Url.encode(bytes).replaceAll('=', '');
  final sourceChecksum = _fnv1a32(bytes).toRadixString(16).padLeft(8, '0');
  final renderedChecksum =
      _fnv1a32(_stringToUtf16Le(rendered)).toRadixString(16).padLeft(8, '0');
  final payload =
      '$_exactSourceMagic$encoded:$sourceChecksum:$renderedChecksum';

  final taggedPayload = <int>[_exactSourceStartTag];
  for (final unit in payload.codeUnits) {
    if (unit < 0x20 || unit > 0x7E) {
      throw StateError('Exact-source payload unexpectedly contains non-ASCII.');
    }
    taggedPayload.add(0xE0000 + unit);
  }
  taggedPayload.add(_exactSourceEndTag);

  return rendered + String.fromCharCodes(taggedPayload);
}

/// Decodes the final valid exact-source trailer, if present.
EmbeddedExactSource? tryDecodeExactSourceMetadata(String text) {
  final runes = text.runes.toList(growable: false);
  if (runes.isEmpty || runes.last != _exactSourceEndTag) return null;

  var start = runes.length - 2;
  while (start >= 0 && runes[start] != _exactSourceStartTag) {
    start -= 1;
  }
  if (start < 0) return null;

  final payloadUnits = <int>[];
  for (var i = start + 1; i < runes.length - 1; i++) {
    final rune = runes[i];
    if (rune < 0xE0020 || rune > 0xE007E) return null;
    payloadUnits.add(rune - 0xE0000);
  }

  final payload = String.fromCharCodes(payloadUnits);
  if (!payload.startsWith(_exactSourceMagic)) return null;

  final body = payload.substring(_exactSourceMagic.length);
  final renderedSplit = body.lastIndexOf(':');
  if (renderedSplit <= 0 || renderedSplit == body.length - 1) return null;
  final sourceSplit = body.lastIndexOf(':', renderedSplit - 1);
  if (sourceSplit <= 0 || sourceSplit == renderedSplit - 1) return null;

  final encoded = body.substring(0, sourceSplit);
  final sourceChecksumText = body.substring(sourceSplit + 1, renderedSplit);
  final renderedChecksumText = body.substring(renderedSplit + 1);
  final checksumPattern = RegExp(r'^[0-9a-f]{8}$');
  if (!checksumPattern.hasMatch(sourceChecksumText) ||
      !checksumPattern.hasMatch(renderedChecksumText)) {
    return null;
  }

  try {
    final padded = encoded.padRight(
      encoded.length + ((4 - encoded.length % 4) % 4),
      '=',
    );
    final bytes = Uint8List.fromList(base64Url.decode(padded));
    if (_fnv1a32(bytes).toRadixString(16).padLeft(8, '0') !=
        sourceChecksumText) {
      return null;
    }
    final source = _stringFromUtf16Le(bytes);
    final visible = String.fromCharCodes(runes.sublist(0, start));
    if (_fnv1a32(_stringToUtf16Le(visible)).toRadixString(16).padLeft(8, '0') !=
        renderedChecksumText) {
      return null;
    }
    return EmbeddedExactSource(
      visibleText: visible,
      originalSource: source,
    );
  } on FormatException {
    return null;
  } on StateError {
    return null;
  }
}

/// Removes a valid exact-source trailer while leaving unrecognized tag data
/// untouched.
String stripExactSourceMetadata(String text) =>
    tryDecodeExactSourceMetadata(text)?.visibleText ?? text;

/// Returns the exact original source when valid embedded metadata exists.
String? recoverEmbeddedExactSource(String text) =>
    tryDecodeExactSourceMetadata(text)?.originalSource;

bool hasEmbeddedExactSource(String text) =>
    tryDecodeExactSourceMetadata(text) != null;

Uint8List _stringToUtf16Le(String input) {
  final units = input.codeUnits;
  final bytes = Uint8List(units.length * 2);
  for (var i = 0; i < units.length; i++) {
    final unit = units[i];
    bytes[i * 2] = unit & 0xFF;
    bytes[i * 2 + 1] = (unit >> 8) & 0xFF;
  }
  return bytes;
}

String _stringFromUtf16Le(Uint8List bytes) {
  if (bytes.length.isOdd) {
    throw const FormatException('Invalid UTF-16LE source payload length.');
  }
  final units = <int>[];
  for (var i = 0; i < bytes.length; i += 2) {
    units.add(bytes[i] | (bytes[i + 1] << 8));
  }
  return String.fromCharCodes(units);
}

int _fnv1a32(List<int> bytes) {
  var hash = 0x811C9DC5;
  for (final byte in bytes) {
    hash ^= byte;
    hash = (hash * 0x01000193) & 0xFFFFFFFF;
  }
  return hash;
}
