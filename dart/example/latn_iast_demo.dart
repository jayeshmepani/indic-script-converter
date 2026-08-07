import 'dart:convert';

import 'package:lipimala/transliteration_result.dart';

void main() {
  const source = 'Kṛṣṇa ā́tman ḷa';

  final devanagari = source.toDevanagari();
  final gujarati = source.toGujarati();
  final hunterian = source.toPlainEnglish(
    options: const IastPlainEnglishOptions(
      profile: PlainEnglishRomanizationProfile.hunterian,
    ),
  );

  print(devanagari.rendered);
  print(gujarati.rendered);
  print(hunterian.rendered);

  // The exact original is available even from a deliberately lossy view.
  assert(hunterian.restoreOriginal() == source);

  final serialized = jsonEncode(hunterian.toJson());
  final restoredEnvelope = TransliterationResult.fromJson(
    Map<String, Object?>.from(jsonDecode(serialized) as Map),
  );
  assert(restoredEnvelope.restoreOriginal() == source);
}
