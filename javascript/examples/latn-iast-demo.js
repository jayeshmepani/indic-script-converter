#!/usr/bin/env node
import {
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    TransliterationResult,
    toDevanagari,
    toGujarati,
    toPlainEnglish,
} from '../src/index.js';

const source = 'Kṛṣṇa ā́tman ḷa';
const devanagari = toDevanagari(source);
const gujarati = toGujarati(source);
const hunterian = toPlainEnglish(source, {
    options: new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    }),
});

console.log(devanagari.rendered);
console.log(gujarati.rendered);
console.log(hunterian.rendered);

if (hunterian.restoreOriginal() !== source) {
    throw new Error('Exact source restoration failed.');
}

const serialized = JSON.stringify(hunterian.toJson());
const restoredEnvelope = TransliterationResult.fromJson(JSON.parse(serialized));
if (restoredEnvelope.restoreOriginal() !== source) {
    throw new Error('Serialized envelope restoration failed.');
}
