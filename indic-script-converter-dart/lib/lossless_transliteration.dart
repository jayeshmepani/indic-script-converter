export 'transliteration_core.dart';
export 'brahmic_to_latn_iast.dart';
export 'latn_iast_to_deva.dart' hide RomanizationProfile;
export 'latn_iast_to_gujr.dart' hide RomanizationProfile;
export 'latn_iast_transcription.dart' hide RomanizationProfile;

import 'latn_iast_to_deva.dart' as dev;
import 'latn_iast_to_gujr.dart' as guj;
import 'latn_iast_transcription.dart' as eng;
import 'transliteration_core.dart';

extension LosslessIndicTransliteration on String {
  LosslessTransliterationResult toLosslessDevanagari({
    dev.IastToDevanagariOptions options = const dev.IastToDevanagariOptions(),
    UnicodeNormalizationForm inputNormalization = UnicodeNormalizationForm.nfd,
    UnicodeNormalizationForm outputNormalization = UnicodeNormalizationForm.nfc,
  }) {
    final normalizedInput = normalizeUnicode(this, inputNormalization);
    final directlyRendered = dev.IastToDevanagariString(normalizedInput)
        .toDevanagariFromIast(options: options);
    final normalizedVisible = normalizeUnicode(
      stripExactSourceMetadata(directlyRendered),
      outputNormalization,
    );
    final rendered = options.embedExactSourceMetadata
        ? embedExactSourceMetadata(normalizedVisible, this)
        : normalizedVisible;

    return LosslessTransliterationResult(
      original: this,
      normalizedInput: normalizedInput,
      rendered: rendered,
      profile: switch (options.profile) {
        dev.DevanagariRomanizationProfile.strictIast =>
          TransliterationProfile.strictIast,
        dev.DevanagariRomanizationProfile.iso15919Core =>
          TransliterationProfile.iso15919Core,
        dev.DevanagariRomanizationProfile.extendedIndic =>
          TransliterationProfile.extendedIndic,
      },
      inputNormalization: inputNormalization,
      outputNormalization: outputNormalization,
      // A script rendering cannot retain Latin case, alias choice, or source
      // normalization. Exact recovery is supplied by the envelope instead.
      renderingIsInjective: false,
      issues: const <TransliterationIssue>[
        TransliterationIssue(
          code: 'SOURCE_METADATA_REQUIRED_FOR_EXACT_REVERSE',
          message:
              'Keep this envelope to recover exact source case, aliases, and code points.',
          severity: TransliterationIssueSeverity.info,
        ),
      ],
    );
  }

  LosslessTransliterationResult toLosslessGujarati({
    guj.IastToGujaratiOptions options = const guj.IastToGujaratiOptions(),
    UnicodeNormalizationForm inputNormalization = UnicodeNormalizationForm.nfd,
    UnicodeNormalizationForm outputNormalization = UnicodeNormalizationForm.nfc,
  }) {
    final normalizedInput = normalizeUnicode(this, inputNormalization);
    final directlyRendered = guj.IastToGujaratiString(normalizedInput)
        .toGujaratiFromIast(options: options);
    final normalizedVisible = normalizeUnicode(
      stripExactSourceMetadata(directlyRendered),
      outputNormalization,
    );
    final rendered = options.embedExactSourceMetadata
        ? embedExactSourceMetadata(normalizedVisible, this)
        : normalizedVisible;

    return LosslessTransliterationResult(
      original: this,
      normalizedInput: normalizedInput,
      rendered: rendered,
      profile: switch (options.profile) {
        guj.GujaratiRomanizationProfile.strictIast =>
          TransliterationProfile.strictIast,
        guj.GujaratiRomanizationProfile.iso15919Core =>
          TransliterationProfile.iso15919Core,
        guj.GujaratiRomanizationProfile.extendedIndic =>
          TransliterationProfile.extendedIndic,
      },
      inputNormalization: inputNormalization,
      outputNormalization: outputNormalization,
      renderingIsInjective: false,
      issues: const <TransliterationIssue>[
        TransliterationIssue(
          code: 'SOURCE_METADATA_REQUIRED_FOR_EXACT_REVERSE',
          message:
              'Keep this envelope to recover exact source case, aliases, and code points.',
          severity: TransliterationIssueSeverity.info,
        ),
      ],
    );
  }

  LosslessTransliterationResult toLosslessPlainEnglish({
    eng.IastPlainEnglishOptions options = const eng.IastPlainEnglishOptions(),
    UnicodeNormalizationForm inputNormalization = UnicodeNormalizationForm.nfd,
    UnicodeNormalizationForm outputNormalization = UnicodeNormalizationForm.nfc,
  }) {
    final normalizedInput = normalizeUnicode(this, inputNormalization);
    final rendered = normalizeUnicode(
      eng.IastToPlainEnglish(normalizedInput)
          .toPlainEnglishFromIast(options: options),
      outputNormalization,
    );
    final isHunterian =
        options.profile == eng.PlainEnglishRomanizationProfile.hunterian;

    return LosslessTransliterationResult(
      original: this,
      normalizedInput: normalizedInput,
      rendered: rendered,
      profile: isHunterian
          ? TransliterationProfile.hunterian
          : TransliterationProfile.plainEnglish,
      inputNormalization: inputNormalization,
      outputNormalization: outputNormalization,
      renderingIsInjective: false,
      issues: <TransliterationIssue>[
        TransliterationIssue(
          code: isHunterian
              ? 'HUNTERIAN_VIEW_IS_INTRINSICALLY_LOSSY'
              : 'PLAIN_ENGLISH_VIEW_IS_INTRINSICALLY_LOSSY',
          message: isHunterian
              ? 'Hunterian merges vowel length, place of articulation, and other distinctions. Exact recovery uses the retained source envelope.'
              : 'Plain-English rendering merges scholarly distinctions. Exact recovery uses the retained source envelope.',
          severity: TransliterationIssueSeverity.info,
        ),
      ],
    );
  }
}
