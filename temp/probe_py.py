import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'python'))

from lipimala import (
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    ScriptToIastOptions,
    UnicodeNormalizationForm,
    to_canonical_iast_from_devanagari,
    to_canonical_iast_from_gujarati,
    to_hunterian_from_devanagari,
    to_hunterian_from_gujarati,
    to_plain_english_from_devanagari,
    to_plain_english_from_gujarati,
    to_plain_english_from_iast,
)

DEVA = ['ꣾ', 'कꣿ', 'ꣽ', 'a꣼b', 'a꣡', 'राम꣸', 'राम꠱', '꠱', '𑬀', '𑬊',
        'क᳐', 'देवः᳣', 'ᳩ', 'ᳺ', 'ᳲ', 'ᳵ', 'ᳶ', 'ऩ', 'ऱ', 'क़', 'ख़',
        'ग़', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऀ', '॓', '॔', 'ॕ', 'कॎ', '॰', 'ॱ',
        'क\u200d', 'क\u200c', 'नटवर', 'सरकार', 'शुं', 'आज']
GUJR = ['કૺ', 'નૻ', 'કૼ', 'સ૾', 'ઝ૾', 'ઝ૿', 'ક૽', '૰', '૱',
        'નટવર', 'સમાચાર', 'સર્વે', 'શું', 'આજ', 'ક\u200d']

for s in DEVA:
    print(f'D {s} ||| {to_canonical_iast_from_devanagari(s)} '
          f'||| {to_plain_english_from_devanagari(s)} '
          f'||| {to_hunterian_from_devanagari(s)}')
for s in GUJR:
    print(f'G {s} ||| {to_canonical_iast_from_gujarati(s)} '
          f'||| {to_plain_english_from_gujarati(s)} '
          f'||| {to_hunterian_from_gujarati(s)}')
preserve = ScriptToIastOptions(input_normalization=UnicodeNormalizationForm.PRESERVE)
print(f'P क़ ||| {to_canonical_iast_from_devanagari("क़", preserve)}')
hunterian = IastPlainEnglishOptions(profile=PlainEnglishRomanizationProfile.HUNTERIAN)
print(f'I Sarasvatī ||| {to_plain_english_from_iast("Sarasvatī", hunterian)}')
print(f'C સમાચાર ||| {to_canonical_iast_from_gujarati("સમાચાર")}')
