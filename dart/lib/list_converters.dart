import 'deva_gujr_converter.dart';
import 'transliteration_result.dart';

/// Extension methods for performing bulk / list transliteration on an [Iterable] of [String] items.
extension IndicScriptListConversion on Iterable<String> {
  /// Translates each IAST string in the collection to Devanagari returning a [List] of [TransliterationResult] objects.
  List<TransliterationResult> toDevanagari({
    IastToDevanagariOptions options = const IastToDevanagariOptions(),
  }) =>
      map((s) => s.toDevanagari(options: options)).toList();

  /// Translates each IAST string in the collection to Gujarati returning a [List] of [TransliterationResult] objects.
  List<TransliterationResult> toGujarati({
    IastToGujaratiOptions options = const IastToGujaratiOptions(),
  }) =>
      map((s) => s.toGujarati(options: options)).toList();

  /// Translates each IAST string in the collection to Plain English returning a [List] of [TransliterationResult] objects.
  List<TransliterationResult> toPlainEnglish({
    IastPlainEnglishOptions options = const IastPlainEnglishOptions(),
  }) =>
      map((s) => s.toPlainEnglish(options: options)).toList();

  /// Converts each IAST string in the collection to Devanagari script strings.
  List<String> toDevanagariFromIast({
    IastToDevanagariOptions options = const IastToDevanagariOptions(),
  }) =>
      map((s) => s.toDevanagariFromIast(options: options)).toList();

  /// Converts each IAST string in the collection to Gujarati script strings.
  List<String> toGujaratiFromIast({
    IastToGujaratiOptions options = const IastToGujaratiOptions(),
  }) =>
      map((s) => s.toGujaratiFromIast(options: options)).toList();

  /// Converts each IAST string in the collection to Plain English strings.
  List<String> toPlainEnglishFromIast({
    IastPlainEnglishOptions options = const IastPlainEnglishOptions(),
  }) =>
      map((s) => s.toPlainEnglishFromIast(options: options)).toList();

  /// Converts each Devanagari string in the collection back to canonical IAST.
  List<String> toCanonicalIastFromDevanagari({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) =>
      map((s) => s.toCanonicalIastFromDevanagari(options: options)).toList();

  /// Converts each Gujarati string in the collection back to canonical IAST.
  List<String> toCanonicalIastFromGujarati({
    ScriptToIastOptions options = const ScriptToIastOptions(),
  }) =>
      map((s) => s.toCanonicalIastFromGujarati(options: options)).toList();

  /// Converts each Devanagari string in the collection to canonical Gujarati.
  List<String> toCanonicalGujaratiFromDevanagari({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      map((s) => s.toCanonicalGujaratiFromDevanagari(options: options))
          .toList();

  /// Converts each Gujarati string in the collection to canonical Devanagari.
  List<String> toCanonicalDevanagariFromGujarati({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      map((s) => s.toCanonicalDevanagariFromGujarati(options: options))
          .toList();

  /// Converts each Devanagari string in the collection to Gujarati with exact source metadata recovery.
  List<String> toGujaratiFromDevanagari({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      map((s) => s.toGujaratiFromDevanagari(options: options)).toList();

  /// Converts each Gujarati string in the collection to Devanagari with exact source metadata recovery.
  List<String> toDevanagariFromGujarati({
    IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
  }) =>
      map((s) => s.toDevanagariFromGujarati(options: options)).toList();

  /// Recovers exact original Devanagari from each Gujarati string in the collection.
  List<String> toExactDevanagariFromGujarati() =>
      map((s) => s.toExactDevanagariFromGujarati()).toList();

  /// Recovers exact original Gujarati from each Devanagari string in the collection.
  List<String> toExactGujaratiFromDevanagari() =>
      map((s) => s.toExactGujaratiFromDevanagari()).toList();

  /// Recovers exact original IAST from each Devanagari string in the collection.
  List<String> toExactIastFromDevanagari() =>
      map((s) => s.toExactIastFromDevanagari()).toList();

  /// Recovers exact original IAST from each Gujarati string in the collection.
  List<String> toExactIastFromGujarati() =>
      map((s) => s.toExactIastFromGujarati()).toList();
}

/// Converts a list of IAST strings to Devanagari script strings.
List<String> toDevanagariFromIastList(
  Iterable<String> items, {
  IastToDevanagariOptions options = const IastToDevanagariOptions(),
}) =>
    items.toDevanagariFromIast(options: options);

/// Converts a list of IAST strings to Gujarati script strings.
List<String> toGujaratiFromIastList(
  Iterable<String> items, {
  IastToGujaratiOptions options = const IastToGujaratiOptions(),
}) =>
    items.toGujaratiFromIast(options: options);

/// Converts a list of IAST strings to Plain English strings.
List<String> toPlainEnglishFromIastList(
  Iterable<String> items, {
  IastPlainEnglishOptions options = const IastPlainEnglishOptions(),
}) =>
    items.toPlainEnglishFromIast(options: options);

/// Converts a list of Devanagari strings to canonical Gujarati script strings.
List<String> toCanonicalGujaratiFromDevanagariList(
  Iterable<String> items, {
  IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
}) =>
    items.toCanonicalGujaratiFromDevanagari(options: options);

/// Converts a list of Gujarati strings to canonical Devanagari script strings.
List<String> toCanonicalDevanagariFromGujaratiList(
  Iterable<String> items, {
  IndicScriptConversionOptions options = const IndicScriptConversionOptions(),
}) =>
    items.toCanonicalDevanagariFromGujarati(options: options);

/// Recovers exact original Devanagari strings from a list of Gujarati strings.
List<String> toExactDevanagariFromGujaratiList(Iterable<String> items) =>
    items.toExactDevanagariFromGujarati();

/// Recovers exact original Gujarati strings from a list of Devanagari strings.
List<String> toExactGujaratiFromDevanagariList(Iterable<String> items) =>
    items.toExactGujaratiFromDevanagari();
