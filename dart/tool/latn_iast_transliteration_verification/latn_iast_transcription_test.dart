// ignore_for_file: avoid_print

import 'package:lipimala/latn_iast_transcription.dart';
import 'example_latn_iast.dart' as ex;

export '../../lib/latn_iast_transcription.dart';

void main() {
  print('----------------------------------------------------------------');
  print(' 3. PLAIN ENGLISH TRANSLITERATOR SAMPLES (DEFAULT OPTIONS)');
  print('----------------------------------------------------------------');

  for (final source in ex.transliterationSmokeSamples) {
    print('"$source" -> "${source.toPlainEnglishFromIast()}"');
  }

  _runPolicyTests();
  _runProfileTests();
}

void _runPolicyTests() {
  print('\n[Plain English Option: Keep Final "a" (scholarly)]');
  const keepA = IastPlainEnglishOptions(finalA: FinalAPolicy.keep);
  for (final source in ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']) {
    print('  "$source" -> "${source.toPlainEnglishFromIast(options: keepA)}"');
  }

  print('\n[Plain English Option: Always Drop Final "a" (Hindi-style)]');
  const dropA = IastPlainEnglishOptions(finalA: FinalAPolicy.drop);
  for (final source in ['Rāma', 'vrata', 'Kṛṣṇa', 'Lakṣmaṇa', 'yātrā']) {
    print('  "$source" -> "${source.toPlainEnglishFromIast(options: dropA)}"');
  }

  print('\n[Plain English Option: jñ as "jna"]');
  const jna = IastPlainEnglishOptions(jna: JnaPolicy.jna);
  for (final source in ['jñāna', 'yajña']) {
    print('  "$source" -> "${source.toPlainEnglishFromIast(options: jna)}"');
  }
}

void _runProfileTests() {
  print('\n[Plain English Profile: extendedIndic]');
  const extended = IastPlainEnglishOptions();
  for (final source in ['xaṇḍa', 'xaiva', 'qaum']) {
    print(
      '  "$source" -> "${source.toPlainEnglishFromIast()}"',
    );
  }

  print('\n[Plain English Profile: Hunterian (explicitly lossy view)]');
  const hunterian = IastPlainEnglishOptions(
    profile: PlainEnglishRomanizationProfile.hunterian,
  );
  for (final source in [
    'Rāma',
    'Kṛṣṇa',
    'Lakṣmaṇa',
    'laṛkā',
    'Rāmacandra',
    'Gorakhapura',
    'Sarasvatī',
    'Īśvara',
    'pañcāṅga',
    'duḥkha',
    'Devadatta',
    'Jaideva',
    'Kalyāṇapura',
    'Nārāyaṇapura',
    'Hariprasāda',
    'Kṛṣṇadāsa',
  ]) {
    print(
      '  "$source" -> "${source.toPlainEnglishFromIast(options: hunterian)}"',
    );
  }

  print('\n[Plain English Profile: strictIast blocks Hunterian-only rules]');
  const strict = IastPlainEnglishOptions(
    profile: PlainEnglishRomanizationProfile.strictIast,
  );
  for (final source in ['Sarasvatī', 'Rāmacandra', 'duḥkha']) {
    print('  "$source" -> "${source.toPlainEnglishFromIast(options: strict)}"');
  }
}
