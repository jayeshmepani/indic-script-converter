import {
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    ScriptToIastOptions,
    UnicodeNormalizationForm,
    toCanonicalIastFromDevanagari,
    toCanonicalIastFromGujarati,
    toHunterianFromDevanagari,
    toHunterianFromGujarati,
    toPlainEnglishFromDevanagari,
    toPlainEnglishFromGujarati,
    toPlainEnglishFromIast,
} from '/home/shreesoftech/projects/test1/astro_packages/indic-script-converter/javascript/src/index.js';

const DEVA = ['ꣾ', 'कꣿ', 'ꣽ', 'a꣼b', 'a꣡', 'राम꣸', 'राम꠱', '꠱', '𑬀', '𑬊',
    'क᳐', 'देवः᳣', 'ᳩ', 'ᳺ', 'ᳲ', 'ᳵ', 'ᳶ', 'ऩ', 'ऱ', 'क़', 'ख़',
    'ग़', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऀ', '॓', '॔', 'ॕ', 'कॎ', '॰', 'ॱ',
    'क‍', 'क‌', 'नटवर', 'सरकार', 'शुं', 'आज'];
const GUJR = ['કૺ', 'નૻ', 'કૼ', 'સ૾', 'ઝ૾', 'ઝ૿', 'ક૽', '૰', '૱',
    'નટવર', 'સમાચાર', 'સર્વે', 'શું', 'આજ', 'ક‍'];

for (const s of DEVA) {
    console.log(`D ${s} ||| ${toCanonicalIastFromDevanagari(s)} ||| ${toPlainEnglishFromDevanagari(s)} ||| ${toHunterianFromDevanagari(s)}`);
}
for (const s of GUJR) {
    console.log(`G ${s} ||| ${toCanonicalIastFromGujarati(s)} ||| ${toPlainEnglishFromGujarati(s)} ||| ${toHunterianFromGujarati(s)}`);
}
const preserve = new ScriptToIastOptions({ inputNormalization: UnicodeNormalizationForm.PRESERVE });
console.log(`P क़ ||| ${toCanonicalIastFromDevanagari('क़', preserve)}`);
const hunterian = new IastPlainEnglishOptions({ profile: PlainEnglishRomanizationProfile.HUNTERIAN });
console.log(`I Sarasvatī ||| ${toPlainEnglishFromIast('Sarasvatī', hunterian)}`);
console.log(`C સમાચાર ||| ${toCanonicalIastFromGujarati('સમાચાર')}`);
