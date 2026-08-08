/// Comprehensive public-API examples for lipimala (Dart).
///
/// Covers envelope extensions, string converters, option permutations,
/// reverse IAST, direct Devanagari ↔ Gujarati, exact metadata, and envelopes.
///
/// Run from dart/:
///   dart run example/public_api_examples.dart
library;

import 'package:lipimala/lipimala.dart';

const iast = 'Kṛṣṇa ā́tman';
const vedic = 'vásōḥ';
const digits = 'Rāma 123';
const punct = 'namaḥ. śivāya.';
const om = 'oṃ';
const ambigL = 'kḷpta';
const plain = 'jñāna Rāma ñāna';
const deva = 'कृष्ण';
const gujr = 'કૃષ્ણ';

void banner(String title) {
  print('');
  print('=' * 72);
  print(title);
  print('=' * 72);
}

void show(String label, Object? value) {
  print('  $label: $value');
}

// ---------------------------------------------------------------------------
// 1. Envelope APIs
// ---------------------------------------------------------------------------
void examplesEnvelope() {
  banner('1. Envelope APIs (TransliterationResult)');

  final de = iast.toDevanagari();
  final gu = iast.toGujarati();
  final en = iast.toPlainEnglish();

  for (final entry in [
    ('toDevanagari', de),
    ('toGujarati', gu),
    ('toPlainEnglish', en),
  ]) {
    final name = entry.$1;
    final result = entry.$2;
    print('\n[$name]');
    show('rendered', result.rendered);
    show('profile', result.profile);
    show('normalizedInput', result.normalizedInput);
    show('restoreOriginal()', result.restoreOriginal());
    show('renderingIsInjective', result.renderingIsInjective);
    show('hasErrors', result.hasErrors);
    show('issues[0].code',
        result.issues.isEmpty ? null : result.issues.first.code);
  }

  final json = de.toJson();
  final restored = TransliterationResult.fromJson(json);
  show('JSON schema', restored.toJson()['schema']);
  show('fromJson restore', restored.restoreOriginal());

  print('\n[normalization permutations]');
  for (final inp in UnicodeNormalizationForm.values) {
    for (final out in [
      UnicodeNormalizationForm.nfc,
      UnicodeNormalizationForm.nfd
    ]) {
      final r = iast.toDevanagari(
        inputNormalization: inp,
        outputNormalization: out,
      );
      show('in=$inp out=$out', r.rendered);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. IAST → Devanagari
// ---------------------------------------------------------------------------
void examplesIastToDeva() {
  banner('2. IAST → Devanagari (string) + option permutations');

  show('default', iast.toDevanagariFromIast());

  for (final profile in DevanagariRomanizationProfile.values) {
    show(
      'profile=$profile',
      iast.toDevanagariFromIast(
        options: IastToDevanagariOptions(profile: profile),
      ),
    );
  }

  for (final dig in IastToDevanagariDigitPolicy.values) {
    show(
      'digitPolicy=$dig',
      digits.toDevanagariFromIast(
        options: IastToDevanagariOptions(digitPolicy: dig),
      ),
    );
  }

  for (final punc in IastToDevanagariPunctuationPolicy.values) {
    show(
      'punctuationPolicy=$punc',
      punct.toDevanagariFromIast(
        options: IastToDevanagariOptions(punctuationPolicy: punc),
      ),
    );
  }

  for (final omPolicy in IastToDevanagariOmPolicy.values) {
    show(
      'omPolicy=$omPolicy',
      om.toDevanagariFromIast(
        options: IastToDevanagariOptions(omPolicy: omPolicy),
      ),
    );
  }

  for (final amb in IastToDevanagariAmbiguousLPolicy.values) {
    show(
      'ambiguousLPolicy=$amb',
      ambigL.toDevanagariFromIast(
        options: IastToDevanagariOptions(ambiguousLPolicy: amb),
      ),
    );
  }

  for (final unk in IastToDevanagariUnknownLatinPolicy.values) {
    try {
      show(
        'unknownLatinPolicy=$unk',
        'hello'.toDevanagariFromIast(
          options: IastToDevanagariOptions(unknownLatinPolicy: unk),
        ),
      );
    } on Object catch (e) {
      show('unknownLatinPolicy=$unk', 'RAISED $e');
    }
  }

  show(
    'acceptAsciiLongVowels=true on aa',
    'aa'.toDevanagariFromIast(
      options: const IastToDevanagariOptions(acceptAsciiLongVowels: true),
    ),
  );
  show(
    'collapseWhitespace=true',
    'Kṛṣṇa   ā́tman'.toDevanagariFromIast(
      options: const IastToDevanagariOptions(collapseWhitespace: true),
    ),
  );
  show(
    'preserveVedicAccentMarks=false',
    vedic.toDevanagariFromIast(
      options: const IastToDevanagariOptions(preserveVedicAccentMarks: false),
    ),
  );

  final tagged = 'Om 12. Rāma'.toDevanagariFromIast(
    options: const IastToDevanagariOptions(
      profile: DevanagariRomanizationProfile.iso15919Core,
      digitPolicy: IastToDevanagariDigitPolicy.convertToScript,
      punctuationPolicy: IastToDevanagariPunctuationPolicy.indicDanda,
      omPolicy: IastToDevanagariOmPolicy.useOmSign,
      acceptAsciiLongVowels: true,
      collapseWhitespace: true,
      embedExactSourceMetadata: true,
    ),
  );
  show('combined options visible', stripExactSourceMetadata(tagged));
  show('has metadata', hasEmbeddedExactSource(tagged));
  show('exact reverse', tagged.toExactIastFromDevanagari());
}

// ---------------------------------------------------------------------------
// 3. IAST → Gujarati
// ---------------------------------------------------------------------------
void examplesIastToGujr() {
  banner('3. IAST → Gujarati (string) + option permutations');

  show('default', iast.toGujaratiFromIast());

  for (final profile in GujaratiRomanizationProfile.values) {
    show(
      'profile=$profile',
      iast.toGujaratiFromIast(
        options: IastToGujaratiOptions(profile: profile),
      ),
    );
  }

  for (final dig in IastToGujaratiDigitPolicy.values) {
    show(
      'digitPolicy=$dig',
      digits.toGujaratiFromIast(
        options: IastToGujaratiOptions(digitPolicy: dig),
      ),
    );
  }

  for (final punc in IastToGujaratiPunctuationPolicy.values) {
    show(
      'punctuationPolicy=$punc',
      punct.toGujaratiFromIast(
        options: IastToGujaratiOptions(punctuationPolicy: punc),
      ),
    );
  }

  for (final omPolicy in IastToGujaratiOmPolicy.values) {
    show(
      'omPolicy=$omPolicy',
      om.toGujaratiFromIast(
        options: IastToGujaratiOptions(omPolicy: omPolicy),
      ),
    );
  }

  final tagged = iast.toGujaratiFromIast(
    options: const IastToGujaratiOptions(embedExactSourceMetadata: true),
  );
  show('exact reverse from Gujr', tagged.toExactIastFromGujarati());
}

// ---------------------------------------------------------------------------
// 4. Plain English / Hunterian
// ---------------------------------------------------------------------------
void examplesPlainEnglish() {
  banner('4. IAST → plain English / Hunterian');

  show('default', plain.toPlainEnglishFromIast());

  for (final profile in PlainEnglishRomanizationProfile.values) {
    show(
      'profile=$profile',
      plain.toPlainEnglishFromIast(
        options: IastPlainEnglishOptions(profile: profile),
      ),
    );
  }

  for (final finalA in FinalAPolicy.values) {
    show(
      'finalA=$finalA',
      'Rāma'.toPlainEnglishFromIast(
        options: IastPlainEnglishOptions(finalA: finalA),
      ),
    );
  }

  for (final jna in JnaPolicy.values) {
    show(
      'jna=$jna',
      'jñāna'.toPlainEnglishFromIast(
        options: IastPlainEnglishOptions(jna: jna),
      ),
    );
  }

  for (final nya in NyaPolicy.values) {
    show(
      'nya=$nya',
      'ñāna'.toPlainEnglishFromIast(
        options: IastPlainEnglishOptions(nya: nya),
      ),
    );
  }

  for (final gl in GlottalStopPolicy.values) {
    show(
      'glottalStop=$gl',
      'aʔa'.toPlainEnglishFromIast(
        options: IastPlainEnglishOptions(glottalStop: gl),
      ),
    );
  }

  show(
    'convertCToCh=false',
    'ca'.toPlainEnglishFromIast(
      options: const IastPlainEnglishOptions(convertCToCh: false),
    ),
  );
  show(
    'hunterian envelope',
    plain
        .toPlainEnglish(
          options: const IastPlainEnglishOptions(
            profile: PlainEnglishRomanizationProfile.hunterian,
          ),
        )
        .rendered,
  );
}

// ---------------------------------------------------------------------------
// 5. Reverse
// ---------------------------------------------------------------------------
void examplesReverse() {
  banner('5. Reverse Brahmic → IAST (canonical / smart / exact)');

  show('canonical Deva→IAST', deva.toCanonicalIastFromDevanagari());
  show('canonical Gujr→IAST', gujr.toCanonicalIastFromGujarati());
  show('smart Deva→IAST (no trailer)', deva.toIastFromDevanagari());
  show('smart Gujr→IAST (no trailer)', gujr.toIastFromGujarati());

  final taggedDe = 'Kṛṣṇa'.toDevanagariFromIast(
    options: const IastToDevanagariOptions(embedExactSourceMetadata: true),
  );
  final taggedGu = 'Kṛṣṇa'.toGujaratiFromIast(
    options: const IastToGujaratiOptions(embedExactSourceMetadata: true),
  );
  show('exact Deva→IAST', taggedDe.toExactIastFromDevanagari());
  show('exact Gujr→IAST', taggedGu.toExactIastFromGujarati());
  show('smart with trailer', taggedDe.toIastFromDevanagari());
  show(
    'ScriptToIastOptions preserveUnmapped',
    '$deva!'.toCanonicalIastFromDevanagari(
      options: const ScriptToIastOptions(preserveUnmapped: true),
    ),
  );
}

// ---------------------------------------------------------------------------
// 6. Direct script
// ---------------------------------------------------------------------------
void examplesDirectScript() {
  banner('6. Direct Devanagari ↔ Gujarati');

  show('canonical Deva→Gujr', deva.toCanonicalGujaratiFromDevanagari());
  show('canonical Gujr→Deva', gujr.toCanonicalDevanagariFromGujarati());
  show('smart Deva→Gujr', deva.toGujaratiFromDevanagari());
  show('smart Gujr→Deva', gujr.toDevanagariFromGujarati());

  // Top-level function aliases
  show(
    'top-level toCanonicalGujaratiFromDevanagari',
    toCanonicalGujaratiFromDevanagari(deva),
  );

  for (final dig in IndicScriptDigitPolicy.values) {
    show(
      'digitPolicy=$dig on १२३',
      '१२३'.toCanonicalGujaratiFromDevanagari(
        options: IndicScriptConversionOptions(digitPolicy: dig),
      ),
    );
  }

  for (final unk in IndicScriptUnknownPolicy.values) {
    try {
      show(
        'unknownPolicy=$unk',
        'कृष्ण X'.toCanonicalGujaratiFromDevanagari(
          options: IndicScriptConversionOptions(unknownPolicy: unk),
        ),
      );
    } on Object catch (e) {
      show('unknownPolicy=$unk', 'RAISED $e');
    }
  }

  final tagged = 'ऄ ऎ ऍ'.toCanonicalGujaratiFromDevanagari(
    options: const IndicScriptConversionOptions(embedExactSourceMetadata: true),
  );
  show('exact reverse Gujr→Deva', tagged.toExactDevanagariFromGujarati());

  final tagged2 = gujr.toCanonicalDevanagariFromGujarati(
    options: const IndicScriptConversionOptions(embedExactSourceMetadata: true),
  );
  show('exact reverse Deva→Gujr', tagged2.toExactGujaratiFromDevanagari());
}

// ---------------------------------------------------------------------------
// 7. Metadata helpers
// ---------------------------------------------------------------------------
void examplesMetadata() {
  banner('7. Exact-source metadata helpers');

  final rendered = iast.toDevanagariFromIast();
  final tagged = embedExactSourceMetadata(rendered, iast);
  show('hasEmbeddedExactSource', hasEmbeddedExactSource(tagged));
  show('recover', recoverEmbeddedExactSource(tagged));
  show('strip', stripExactSourceMetadata(tagged));
  show('normalize NFC', normalizeUnicode(iast, UnicodeNormalizationForm.nfc));
  show('normalize NFD', normalizeUnicode(iast, UnicodeNormalizationForm.nfd));
}

void main() {
  print('lipimala — Dart public API examples');
  examplesEnvelope();
  examplesIastToDeva();
  examplesIastToGujr();
  examplesPlainEnglish();
  examplesReverse();
  examplesDirectScript();
  examplesMetadata();
  print('');
  print('Done. All public-API example sections executed.');
}
