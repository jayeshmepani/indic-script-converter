import 'package:lipimala/lipimala.dart';

const deva = ['ꣾ', 'कꣿ', 'ꣽ', 'a꣼b', 'a꣡', 'राम꣸', 'राम꠱', '꠱', '𑬀', '𑬊',
    'क᳐', 'देवः᳣', 'ᳩ', 'ᳺ', 'ᳲ', 'ᳵ', 'ᳶ', 'ऩ', 'ऱ', 'क़', 'ख़',
    'ग़', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऀ', '॓', '॔', 'ॕ', 'कॎ', '॰', 'ॱ',
    'क‍', 'क‌', 'नटवर', 'सरकार', 'शुं', 'आज'];
const gujr = ['કૺ', 'નૻ', 'કૼ', 'સ૾', 'ઝ૾', 'ઝ૿', 'ક૽', '૰', '૱',
    'નટવર', 'સમાચાર', 'સર્વે', 'શું', 'આજ', 'ક‍'];

void main() {
  for (final s in deva) {
    print('D $s ||| ${s.toCanonicalIastFromDevanagari()} ||| '
        '${toPlainEnglishFromDevanagari(s)} ||| ${toHunterianFromDevanagari(s)}');
  }
  for (final s in gujr) {
    print('G $s ||| ${s.toCanonicalIastFromGujarati()} ||| '
        '${toPlainEnglishFromGujarati(s)} ||| ${toHunterianFromGujarati(s)}');
  }
  const preserve = ScriptToIastOptions(
      inputNormalization: UnicodeNormalizationForm.preserve);
  print('P क़ ||| ${'क़'.toCanonicalIastFromDevanagari(options: preserve)}');
  const hunterian = IastPlainEnglishOptions(
      profile: PlainEnglishRomanizationProfile.hunterian);
  print('I Sarasvatī ||| ${'Sarasvatī'.toPlainEnglishFromIast(options: hunterian)}');
  print('C સમાચાર ||| ${'સમાચાર'.toCanonicalIastFromGujarati()}');
}
