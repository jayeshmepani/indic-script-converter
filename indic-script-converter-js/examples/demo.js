import {
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    LosslessTransliterationResult,
    toLosslessDevanagari,
    toLosslessGujarati,
    toLosslessPlainEnglish,
} from '../src/index.js';

const source = 'Kṛṣṇa ā́tman ḷa';
const devanagari = toLosslessDevanagari(source);
const gujarati = toLosslessGujarati(source);
const hunterian = toLosslessPlainEnglish(source, {
    options: new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    }),
});

console.log(devanagari.rendered);
console.log(gujarati.rendered);
console.log(hunterian.rendered);

if (hunterian.restoreOriginal() !== source) throw new Error('Envelope restore failed.');
const serialized = JSON.stringify(hunterian.toJson());
const restoredEnvelope = LosslessTransliterationResult.fromJson(JSON.parse(serialized));
if (restoredEnvelope.restoreOriginal() !== source) throw new Error('JSON restore failed.');
