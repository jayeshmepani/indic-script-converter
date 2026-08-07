import 'dart:convert';

import 'package:indic_script_converter/lossless_transliteration.dart';

void main() {
  const source = 'Kṛṣṇa ā́tman ḷa';

  final devanagari = source.toLosslessDevanagari();
  final gujarati = source.toLosslessGujarati();
  final hunterian = source.toLosslessPlainEnglish(
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
  final restoredEnvelope = LosslessTransliterationResult.fromJson(
    Map<String, Object?>.from(jsonDecode(serialized) as Map),
  );
  assert(restoredEnvelope.restoreOriginal() == source);
}
