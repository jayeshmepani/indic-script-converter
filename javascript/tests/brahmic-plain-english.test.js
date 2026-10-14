import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BrahmicLanguage,
    BrahmicPlainEnglishOptions,
    BrahmicReadableStyle,
    BrahmicSchwaDeletionPolicy,
    BrahmicVowelLengthPolicy,
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    TerminalAnusvaraPolicy,
    toCanonicalIastFromGujarati,
    toHunterianFromDevanagari,
    toHunterianFromGujarati,
    toHunterianFromGujaratiList,
    toPlainEnglishFromDevanagari,
    toPlainEnglishFromGujarati,
    toPlainEnglishFromGujaratiList,
    toPlainEnglishFromGujaratiResult,
    toHunterianFromGujaratiResult,
    toPlainEnglishFromIast,
} from '../src/index.js';

test('Gujarati direct Plain-English keeps explicit vowels and deletes only appropriate inherent schwas', () => {
    const cases = new Map([
        ['આજ', 'aaj'],
        ['મારે', 'maare'],
        ['ઓરડે', 'orade'],
        ['નટવર', 'natvar'],
        ['સમાચાર', 'samaachaar'],
        ['ધર્મકુમાર', 'dharmakumaar'],
        ['ગુલાબના', 'gulaabnaa'],
        ['હીરની', 'heernee'],
        ['અમૂલ્ય', 'amoolya'],
        ['ધન્ય', 'dhanya'],
        ['રૂમાલ', 'roomaal'],
        ['શું', 'shun'],
        ['ક્યાં', 'kyaan'],
    ]);

    for (const [source, expected] of cases) {
        assert.equal(toPlainEnglishFromGujarati(source), expected, source);
    }
});

test('Gujarati direct Hunterian uses language-aware schwa deletion without Hindi v-to-w leakage', () => {
    const cases = new Map([
        ['નટવર', 'natvar'],
        ['સમાચાર', 'samachar'],
        ['ધર્મકુમાર', 'dharmakumar'],
        ['સર્વે', 'sarve'],
        ['શોભતા', 'shobhta'],
        ['રેશમી', 'reshmi'],
        ['સૂંથણલી', 'sunthanli'],
    ]);

    for (const [source, expected] of cases) {
        assert.equal(toHunterianFromGujarati(source), expected, source);
    }

    assert.equal(toHunterianFromGujarati('સર્વે swan twin'), 'sarve swan twin');
    assert.equal(toHunterianFromGujarati('દુઃખ'), 'dukh');
});

test('direct Brahmic transcription preserves pre-existing Latin spans exactly', () => {
    const latin = 'cat chocolate camera JavaScript café Kṛṣṇa Kr̥ṣṇa John’s ‘quote’';
    assert.equal(toPlainEnglishFromGujarati(`ગુજરાત ${latin}`), `gujaraat ${latin}`);
    assert.equal(toHunterianFromGujarati(`ગુજરાત ${latin}`), `gujarat ${latin}`);
    assert.equal(toPlainEnglishFromDevanagari(`भारत ${latin}`), `bhaarat ${latin}`);
    assert.equal(toHunterianFromDevanagari(`भारत ${latin}`), `bharat ${latin}`);
});

test('Devanagari direct transcription applies Hindi schwa deletion while Sanskrit can opt out', () => {
    assert.equal(toPlainEnglishFromDevanagari('कानपुर'), 'kaanpur');
    assert.equal(toPlainEnglishFromDevanagari('सरकार'), 'sarkaar');
    assert.equal(toPlainEnglishFromDevanagari('अहमद'), 'ahmad');
    assert.equal(toPlainEnglishFromDevanagari('धर्म'), 'dharm');
    assert.equal(toPlainEnglishFromGujarati('ધર્મ'), 'dharm');
    assert.equal(toHunterianFromDevanagari('कानपुर'), 'kanpur');
    assert.equal(toHunterianFromDevanagari('सरकार'), 'sarkar');

    const sanskrit = new BrahmicPlainEnglishOptions({ language: BrahmicLanguage.SANSKRIT });
    assert.equal(toPlainEnglishFromDevanagari('कानपुर', sanskrit), 'kaanapura');
    assert.equal(toPlainEnglishFromDevanagari('धर्म', sanskrit), 'dharma');
});

test('Brahmic direct options control schwa, vowel length and terminal anusvara', () => {
    assert.equal(
        toPlainEnglishFromGujarati(
            'નટવર',
            new BrahmicPlainEnglishOptions({
                schwaDeletion: BrahmicSchwaDeletionPolicy.NONE,
            }),
        ),
        'natavara',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            'આજ',
            new BrahmicPlainEnglishOptions({
                vowelLength: BrahmicVowelLengthPolicy.COLLAPSE,
            }),
        ),
        'aj',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            'શું',
            new BrahmicPlainEnglishOptions({ terminalAnusvara: TerminalAnusvaraPolicy.DROP }),
        ),
        'shu',
    );
});

test('Gujarati natural readable style applies morphology, phonology, and conventional spellings', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const cases = new Map([
        ['જેટલાં', 'jetla'],
        ['તેટલા', 'tetla'],
        ['બ્રહ્માંડમાં', 'brahmandma'],
        ['શ્વેતદ્વીપ', 'shwetdweep'],
        ['સ્વરૂપ', 'swaroop'],
        ['નારાયણઘાટે', 'narayanghate'],
        ['સતયુગ', 'satyug'],
        ['ઋતુ', 'rutu'],
        ['શુકલપક્ષ', 'shuklapaksh'],
        ['ચાર', 'chaar'],
        ['માસ', 'maas'],
        ['કાળ', 'kaal'],
        ['આવીને', 'aavine'],
        ['મન્વંતરમાં', 'manvantarma'],
        ['દુર્વાસાના', 'durvasana'],
        ['શાપથી', 'shaapthi'],
        ['અક્ષરધામમાં', 'akshardhamma'],
        ['કૃષ્ણ', 'krishna'],
        ['કર્યું', 'karyu'],
    ]);

    for (const [source, expected] of cases) {
        assert.equal(toPlainEnglishFromGujarati(source, natural), expected, source);
    }

    assert.equal(
        toHunterianFromGujarati('શ્વેતદ્વીપ મન્વંતરમાં દુર્વાસાના', natural),
        'shwetdweep manvantarma durvasana',
    );
    assert.deepEqual(
        toPlainEnglishFromGujaratiList(['શ્વેતદ્વીપ', 'બ્રહ્માંડમાં', 'ઋતુ'], natural),
        ['shwetdweep', 'brahmandma', 'rutu'],
    );
});

test('Gujarati natural readable style handles a full prose paragraph deterministically', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const source =
        'પછી તે ધર્મ જેટલાં બ્રહ્માંડ તેટલા સ્વરૂપ ધારણ કરીને દરેક બ્રહ્માંડમાં ગયા. તે શ્વેતદ્વીપ પાસે વિશ્વકર્મા દ્વારા વિષ્ણુપુર રચાવીને તેમાં રહે છે. ધર્મ એ વિષ્ણુપુરમાંથી મૂર્તિ સહિત સાબરમતીને કાંઠે (નારાયણઘાટે) આવીને દશ વર્ષ તપ કર્યું. તે સમયે વારાહ કલ્પ, સ્વયંભૂ, મન્વંતર, પ્રથમનો સતયુગ, પ્રભવ વર્ષ, ઉત્તરાયન કાળ, વસંત ઋતુ, ચૈત્ર માસ, શુકલપક્ષ, એકાદશી, બ્રાહ્મમુહૂર્ત અને રવિવારને દિવસે નર,નારાયણ, હરિ, કૃષ્ણ એ ચાર સ્વરૂપે પ્રગટ થાતા હવા.ચાક્ષુષ મન્વંતરમાં દુર્વાસાના શાપથી પ્રલય થયો. ત્યારે નરનારાયણ સ્વધામ-બ્રહ્મધામ પધાર્યા અને ધર્મ - મૂર્તિ અક્ષરધામમાં પધાર્યાં.';
    const expected =
        'pachhi te dharm jetla brahmand tetla swaroop dharan karine darek brahmandma gaya. te shwetdweep paase vishwakarma dwaara vishnupur rachavine tema rahe chhe. dharm e vishnupurmathi murti sahit sabarmatine kanthe (narayanghate) aavine dash varsh tap karyu. te samaye varah kalp, swayambhu, manvantar, prathamno satyug, prabhav varsh, uttarayan kaal, vasant rutu, chaitra maas, shuklapaksh, ekadashi, brahmamuhurt ane ravivarne divase nar,narayan, hari, krishna e chaar swaroope pragat thaata hava.chakshush manvantarma durvasana shaapthi pralay thayo. tyaare narnarayan swadham-brahmadham padharya ane dharm - murti akshardhamma padharya.';
    assert.equal(toPlainEnglishFromGujarati(source, natural), expected);
});

test('Gujarati natural readable style keeps 1.1 defaults opt-in and canonical reverse untouched', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });

    assert.equal(toPlainEnglishFromGujarati('શ્વેતદ્વીપ'), 'shvetadveep');
    assert.equal(toPlainEnglishFromGujarati('શ્વેતદ્વીપ', natural), 'shwetdweep');
    assert.equal(toCanonicalIastFromGujarati('શ્વેતદ્વીપ'), 'śvetadvīpa');
    assert.equal(toPlainEnglishFromGujarati('ગુજરાત Shwetdweep', natural), 'gujarat Shwetdweep');
});

test('natural readable style resolves compound schwa, suffixes, and Hindi infinitives', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const gujarati = new Map([
        ['ગાંધીનગર', 'gandhinagar'],
        ['ભાવનગર', 'bhavnagar'],
        ['જામનગર', 'jamnagar'],
        ['નારાયણઘાટે', 'narayanghate'],
        ['વર્ષથી', 'varshthi'],
        ['ધર્મથી', 'dharmthi'],
        ['ઘરથી', 'gharthi'],
        ['પરથી', 'parthi'],
        ['પરત', 'parat'],
        ['વર્ષમાં', 'varshma'],
        ['કંઈ', 'kai'],
        ['કંઈક', 'kaik'],
        ['ક્યાં', 'kyaan'],
        ['ત્યાં', 'tyaan'],
        ['જ્યાં', 'jyaan'],
        ['પધાર્યાં', 'padharya'],
        ['કાળમાં', 'kaalma'],
        ['મારી', 'maari'],
        ['માટે', 'maate'],
        ['રાત', 'raat'],
        ['રાત્રે', 'ratre'],
        ['ચારણ', 'charan'],
        ['માર્ગ', 'marg'],
        ['ગૃહ', 'grih'],
        ['દીકરો', 'dikro'],
        ['દીકરી', 'dikri'],
        ['અમદાવાદ', 'amdavad'],
        ['રાજકોટ', 'rajkot'],
        ['નર્મદા', 'narmada'],
        ['મિત્ર', 'mitra'],
        ['ચક્ર', 'chakra'],
        ['વિશ્વ', 'vishwa'],
        ['મનુષ્ય', 'manushya'],
        ['ચૈત્ર', 'chaitra'],
        ['હું', 'hu'],
        ['જોઈએ', 'joie'],
        ['ગુજરાતી', 'gujarati'],
    ]);
    for (const [source, expected] of gujarati) {
        assert.equal(toPlainEnglishFromGujarati(source, natural), expected, source);
    }

    const hindi = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.HINDI,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const hindiCases = new Map([
        ['देखना', 'dekhna'],
        ['बोलना', 'bolna'],
        ['लिखना', 'likhna'],
        ['समझना', 'samajhna'],
        ['सुनना', 'sunana'],
        ['गणना', 'ganana'],
        ['गन्ना', 'ganna'],
        ['योजना', 'yojna'],
        ['गांधीनगर', 'gandhinagar'],
        ['अनगिनत', 'anginat'],
        ['लड़का', 'ladka'],
        ['लड़की', 'ladki'],
        ['पढ़ना', 'padhna'],
        ['थोड़ा', 'thoda'],
        ['हूँ', 'hoon'],
        ['चाहिए', 'chahiye'],
        ['महल', 'mahal'],
        ['जितना', 'jitna'],
        ['अपना', 'apna'],
        ['पहला', 'pahla'],
        ['आदमी', 'aadmi'],
        ['मित्र', 'mitra'],
        ['धर्म', 'dharm'],
        ['द्वार', 'dwaar'],
        ['चार', 'chaar'],
        ['गृह', 'grih'],
    ]);
    for (const [source, expected] of hindiCases) {
        assert.equal(toPlainEnglishFromDevanagari(source, hindi), expected, source);
    }

    assert.equal(toPlainEnglishFromDevanagari('गांधीनगर'), 'gaandheengar');
    assert.equal(toPlainEnglishFromDevanagari('लड़का'), 'larakaa');
    assert.equal(toPlainEnglishFromGujarati('ગૃહ'), 'griha');
});

test('natural readable presentation can capitalize sentences and override project spellings', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
        capitalizeSentenceStarts: true,
        readableWordOverrides: {
            shwetdweep: 'Shwetdweep',
            dharm: 'Dharm',
            vishwakarma: 'Vishwakarma',
        },
    });

    assert.equal(
        toPlainEnglishFromGujarati('પછી ધર્મ ગયો. તે શ્વેતદ્વીપ પાસે વિશ્વકર્મા હતા.', natural),
        'Pachhi Dharm gayo. Te Shwetdweep paase Vishwakarma hata.',
    );
    assert.equal(
        toPlainEnglishFromGujarati('ગુજરાત ExistingName. પછી', natural),
        'Gujarat ExistingName. Pachhi',
    );
});

test('Brahmic SMART vowel length is contextual across Gujarati and Devanagari', () => {
    const phrase = 'આજ મારે શ્વેતદ્વીપ સ્વરૂપ ધારણ કરીને ચાર માસ';
    const base = { readableStyle: BrahmicReadableStyle.NATURAL };

    assert.equal(
        toPlainEnglishFromGujarati(
            phrase,
            new BrahmicPlainEnglishOptions({
                ...base,
                vowelLength: BrahmicVowelLengthPolicy.COLLAPSE,
            }),
        ),
        'aj mare shwetdwip swarup dharan karine char mas',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            phrase,
            new BrahmicPlainEnglishOptions({
                ...base,
                vowelLength: BrahmicVowelLengthPolicy.DOUBLE,
            }),
        ),
        'aaj maare shwetdweep swaroop dhaaran kareene chaar maas',
    );
    assert.equal(
        toPlainEnglishFromGujarati(
            phrase,
            new BrahmicPlainEnglishOptions({
                ...base,
                vowelLength: BrahmicVowelLengthPolicy.SMART,
            }),
        ),
        'aaj maare shwetdweep swaroop dharan karine chaar maas',
    );

    const hindiNatural = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.HINDI,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const hindiCases = new Map([
        ['श्वेतद्वीप', 'shwetdweep'],
        ['स्वरूप', 'swaroop'],
        ['सतयुग', 'satyug'],
        ['ऋतु', 'ritu'],
        ['शुकलपक्ष', 'shuklapaksh'],
        ['चार', 'chaar'],
        ['मास', 'maas'],
        ['काल', 'kaal'],
        ['धारण', 'dharan'],
        ['ब्रह्मांड में', 'brahmand men'],
        ['नारायणघाटे', 'narayanghate'],
    ]);
    for (const [source, expected] of hindiCases) {
        assert.equal(toPlainEnglishFromDevanagari(source, hindiNatural), expected, source);
    }

    const gujaratiInDevanagari = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.GUJARATI,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    assert.equal(toPlainEnglishFromDevanagari('ऋतु', gujaratiInDevanagari), 'rutu');

    const sanskritNatural = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.SANSKRIT,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    assert.equal(toPlainEnglishFromDevanagari('धर्म', sanskritNatural), 'dharma');
    assert.equal(toPlainEnglishFromDevanagari('श्वेतद्वीप', sanskritNatural), 'shvetadveepa');
    assert.equal(toPlainEnglishFromDevanagari('स्वरूप', sanskritNatural), 'svaroopa');
});

test('SMART vowel length follows syllable shape instead of a stem list', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const gujarati = new Map([
        ['નામ', 'naam'],
        ['દૂધ', 'doodh'],
        ['ફૂલ', 'phool'],
        ['પાસે', 'paase'],
        ['કાળજી', 'kaalji'],
        ['નીચે', 'neeche'],
        ['મા', 'ma'],
        ['ના', 'na'],
        ['કા', 'ka'],
        ['આશીર્વાદ', 'aashirvad'],
        ['ગુલાબ', 'gulab'],
        ['પ્રદીપ', 'pradeep'],
        ['ચાલીસ', 'chalees'],
        ['માર્ગ', 'marg'],
        ['ધારણ', 'dharan'],
        ['કરીને', 'karine'],
    ]);
    for (const [source, expected] of gujarati) {
        assert.equal(toPlainEnglishFromGujarati(source, natural), expected, source);
    }

    const hindi = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.HINDI,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const hindiCases = new Map([
        ['नाम', 'naam'],
        ['दूध', 'doodh'],
        ['नीचे', 'neeche'],
        ['द्वार', 'dwaar'],
        ['का', 'ka'],
        ['माँ', 'maan'],
        ['जाना', 'jaana'],
        ['कहीं', 'kaheen'],
        ['हूँ', 'hoon'],
        ['रूप', 'roop'],
    ]);
    for (const [source, expected] of hindiCases) {
        assert.equal(toPlainEnglishFromDevanagari(source, hindi), expected, source);
    }
});

test('natural SMART keeps stem length across open endings and nasal codas', () => {
    const natural = new BrahmicPlainEnglishOptions({
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const gujarati = new Map([
        ['રૂપમાં', 'roopama'],
        ['સ્વરૂપમાં', 'swaroopama'],
        ['સ્વરૂપથી', 'swaroopthi'],
        ['સ્વરૂપને', 'swaroopne'],
        ['સ્વરૂપે', 'swaroope'],
        ['શ્વેતદ્વીપમાં', 'shwetdweepama'],
        ['શ્વેતદ્વીપથી', 'shwetdweepthi'],
        ['મારેથી', 'maarethi'],
        ['પાસેથી', 'paasethi'],
        ['પાસેના', 'paasena'],
        ['પાસેથીના', 'paasethina'],
        ['નીચેથી', 'neechethi'],
        ['ચારમાં', 'chaarma'],
        ['નામમાં', 'naamma'],
        ['કરીને', 'karine'],
        ['એકાદશી', 'ekadashi'],
        ['રાત્રે', 'ratre'],
        ['દીકરો', 'dikro'],
        ['મૂર્તિ', 'murti'],
        ['કાંઠે', 'kanthe'],
    ]);
    for (const [source, expected] of gujarati) {
        assert.equal(toPlainEnglishFromGujarati(source, natural), expected, source);
    }

    const hindi = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.HINDI,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    const hindiCases = new Map([
        ['हूँगा', 'hoonga'],
        ['देखूँगा', 'dekhoonga'],
        ['देखूंगा', 'dekhoonga'],
        ['राष्ट्रपति', 'rashtrapati'],
        ['सप्ताह', 'saptah'],
        ['चाहिए', 'chahiye'],
        ['जाना', 'jaana'],
        ['मूर्ति', 'murti'],
        ['कांटे', 'kante'],
    ]);
    for (const [source, expected] of hindiCases) {
        assert.equal(toPlainEnglishFromDevanagari(source, hindi), expected, source);
    }

    assert.equal(toPlainEnglishFromDevanagari('राष्ट्रपति'), 'raashtrapati');
    const sanskrit = new BrahmicPlainEnglishOptions({
        language: BrahmicLanguage.SANSKRIT,
        readableStyle: BrahmicReadableStyle.NATURAL,
        vowelLength: BrahmicVowelLengthPolicy.SMART,
    });
    assert.equal(toPlainEnglishFromDevanagari('राष्ट्रपति', sanskrit), 'raashtrapati');
});

test('bulk direct APIs are exported', () => {
    assert.deepEqual(toPlainEnglishFromGujaratiList(['આજ', 'નટવર']), ['aaj', 'natvar']);
    assert.deepEqual(toHunterianFromGujaratiList(['સમાચાર', 'સર્વે']), ['samachar', 'sarve']);
});

test('canonical Gujarati reverse and legacy IAST Hunterian behavior stay unchanged', () => {
    assert.equal(toCanonicalIastFromGujarati('સમાચાર'), 'samācāra');
    const hunterian = new IastPlainEnglishOptions({
        profile: PlainEnglishRomanizationProfile.HUNTERIAN,
    });
    assert.equal(toPlainEnglishFromIast('Sarasvatī', hunterian), 'Saraswati');
    assert.equal(toPlainEnglishFromIast('Rāma', hunterian), 'Ram');
});

test('direct result envelopes retain the exact Brahmic source', () => {
    const plain = toPlainEnglishFromGujaratiResult('આજ મારે');
    assert.equal(plain.original, 'આજ મારે');
    assert.equal(plain.restoreOriginal(), 'આજ મારે');
    assert.equal(plain.rendered, 'aaj maare');
    assert.equal(plain.profile, 'plainEnglish');

    const hunterian = toHunterianFromGujaratiResult('સમાચાર');
    assert.equal(hunterian.restoreOriginal(), 'સમાચાર');
    assert.equal(hunterian.rendered, 'samachar');
    assert.equal(hunterian.profile, 'hunterian');
});
