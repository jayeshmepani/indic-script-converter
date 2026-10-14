import 'package:lipimala/lipimala.dart';
import 'package:test/test.dart';

void main() {
  group('direct Brahmic to natural Latin', () {
    test('Gujarati Plain-English is source-aware', () {
      const cases = <String, String>{
        'આજ': 'aaj',
        'મારે': 'maare',
        'ઓરડે': 'orade',
        'નટવર': 'natvar',
        'સમાચાર': 'samaachaar',
        'ધર્મકુમાર': 'dharmakumaar',
        'ગુલાબના': 'gulaabnaa',
        'હીરની': 'heernee',
        'અમૂલ્ય': 'amoolya',
        'ધન્ય': 'dhanya',
        'રૂમાલ': 'roomaal',
        'શું': 'shun',
        'ક્યાં': 'kyaan',
      };

      for (final entry in cases.entries) {
        expect(
          entry.key.toPlainEnglishFromGujarati(),
          entry.value,
          reason: entry.key,
        );
      }
    });

    test('Gujarati Hunterian applies Gujarati schwa rules without Hindi w', () {
      const cases = <String, String>{
        'નટવર': 'natvar',
        'સમાચાર': 'samachar',
        'ધર્મકુમાર': 'dharmakumar',
        'સર્વે': 'sarve',
        'શોભતા': 'shobhta',
        'રેશમી': 'reshmi',
        'સૂંથણલી': 'sunthanli',
      };

      for (final entry in cases.entries) {
        expect(
          entry.key.toHunterianFromGujarati(),
          entry.value,
          reason: entry.key,
        );
      }

      expect('સર્વે swan twin'.toHunterianFromGujarati(), 'sarve swan twin');
      expect('દુઃખ'.toHunterianFromGujarati(), 'dukh');
    });

    test('direct Brahmic transcription preserves pre-existing Latin spans', () {
      const latin =
          'cat chocolate camera JavaScript café Kṛṣṇa Kr̥ṣṇa John’s ‘quote’';
      expect('ગુજરાત $latin'.toPlainEnglishFromGujarati(), 'gujaraat $latin');
      expect('ગુજરાત $latin'.toHunterianFromGujarati(), 'gujarat $latin');
      expect('भारत $latin'.toPlainEnglishFromDevanagari(), 'bhaarat $latin');
      expect('भारत $latin'.toHunterianFromDevanagari(), 'bharat $latin');
    });

    test('Devanagari uses Hindi schwa deletion and supports Sanskrit override',
        () {
      expect('कानपुर'.toPlainEnglishFromDevanagari(), 'kaanpur');
      expect('सरकार'.toPlainEnglishFromDevanagari(), 'sarkaar');
      expect('अहमद'.toPlainEnglishFromDevanagari(), 'ahmad');
      expect('धर्म'.toPlainEnglishFromDevanagari(), 'dharm');
      expect('ધર્મ'.toPlainEnglishFromGujarati(), 'dharm');
      expect('कानपुर'.toHunterianFromDevanagari(), 'kanpur');
      expect('सरकार'.toHunterianFromDevanagari(), 'sarkar');
      expect(
        'कानपुर'.toPlainEnglishFromDevanagari(
          options: const BrahmicPlainEnglishOptions(
            language: BrahmicLanguage.sanskrit,
          ),
        ),
        'kaanapura',
      );
      expect(
        'धर्म'.toPlainEnglishFromDevanagari(
          options: const BrahmicPlainEnglishOptions(
            language: BrahmicLanguage.sanskrit,
          ),
        ),
        'dharma',
      );
    });

    test('direct options control schwa, vowel length, and terminal anusvara',
        () {
      expect(
        'નટવર'.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            schwaDeletion: BrahmicSchwaDeletionPolicy.none,
          ),
        ),
        'natavara',
      );
      expect(
        'આજ'.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            vowelLength: BrahmicVowelLengthPolicy.collapse,
          ),
        ),
        'aj',
      );
      expect(
        'શું'.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            terminalAnusvara: TerminalAnusvaraPolicy.drop,
          ),
        ),
        'shu',
      );
    });

    test('Gujarati natural readable style applies morphology and phonology',
        () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      const cases = <String, String>{
        'જેટલાં': 'jetla',
        'તેટલા': 'tetla',
        'બ્રહ્માંડમાં': 'brahmandma',
        'શ્વેતદ્વીપ': 'shwetdweep',
        'સ્વરૂપ': 'swaroop',
        'નારાયણઘાટે': 'narayanghate',
        'સતયુગ': 'satyug',
        'ઋતુ': 'rutu',
        'શુકલપક્ષ': 'shuklapaksh',
        'ચાર': 'chaar',
        'માસ': 'maas',
        'કાળ': 'kaal',
        'આવીને': 'aavine',
        'મન્વંતરમાં': 'manvantarma',
        'દુર્વાસાના': 'durvasana',
        'શાપથી': 'shaapthi',
        'અક્ષરધામમાં': 'akshardhamma',
        'કૃષ્ણ': 'krishna',
        'કર્યું': 'karyu',
      };

      for (final entry in cases.entries) {
        expect(
          entry.key.toPlainEnglishFromGujarati(options: natural),
          entry.value,
          reason: entry.key,
        );
      }

      expect(
        'શ્વેતદ્વીપ મન્વંતરમાં દુર્વાસાના'
            .toHunterianFromGujarati(options: natural),
        'shwetdweep manvantarma durvasana',
      );
      expect(
        toPlainEnglishFromGujaratiList(
          const ['શ્વેતદ્વીપ', 'બ્રહ્માંડમાં', 'ઋતુ'],
          options: natural,
        ),
        const ['shwetdweep', 'brahmandma', 'rutu'],
      );
    });

    test('Gujarati natural readable style handles a full prose paragraph', () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      const source =
          'પછી તે ધર્મ જેટલાં બ્રહ્માંડ તેટલા સ્વરૂપ ધારણ કરીને દરેક બ્રહ્માંડમાં ગયા. તે શ્વેતદ્વીપ પાસે વિશ્વકર્મા દ્વારા વિષ્ણુપુર રચાવીને તેમાં રહે છે. ધર્મ એ વિષ્ણુપુરમાંથી મૂર્તિ સહિત સાબરમતીને કાંઠે (નારાયણઘાટે) આવીને દશ વર્ષ તપ કર્યું. તે સમયે વારાહ કલ્પ, સ્વયંભૂ, મન્વંતર, પ્રથમનો સતયુગ, પ્રભવ વર્ષ, ઉત્તરાયન કાળ, વસંત ઋતુ, ચૈત્ર માસ, શુકલપક્ષ, એકાદશી, બ્રાહ્મમુહૂર્ત અને રવિવારને દિવસે નર,નારાયણ, હરિ, કૃષ્ણ એ ચાર સ્વરૂપે પ્રગટ થાતા હવા.ચાક્ષુષ મન્વંતરમાં દુર્વાસાના શાપથી પ્રલય થયો. ત્યારે નરનારાયણ સ્વધામ-બ્રહ્મધામ પધાર્યા અને ધર્મ - મૂર્તિ અક્ષરધામમાં પધાર્યાં.';
      const expected =
          'pachhi te dharm jetla brahmand tetla swaroop dharan karine darek brahmandma gaya. te shwetdweep paase vishwakarma dwaara vishnupur rachavine tema rahe chhe. dharm e vishnupurmathi murti sahit sabarmatine kanthe (narayanghate) aavine dash varsh tap karyu. te samaye varah kalp, swayambhu, manvantar, prathamno satyug, prabhav varsh, uttarayan kaal, vasant rutu, chaitra maas, shuklapaksh, ekadashi, brahmamuhurt ane ravivarne divase nar,narayan, hari, krishna e chaar swaroope pragat thaata hava.chakshush manvantarma durvasana shaapthi pralay thayo. tyaare narnarayan swadham-brahmadham padharya ane dharm - murti akshardhamma padharya.';
      expect(
        source.toPlainEnglishFromGujarati(options: natural),
        expected,
      );
    });

    test('Gujarati natural readable style is opt-in', () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      expect('શ્વેતદ્વીપ'.toPlainEnglishFromGujarati(), 'shvetadveep');
      expect(
        'શ્વેતદ્વીપ'.toPlainEnglishFromGujarati(options: natural),
        'shwetdweep',
      );
      expect('શ્વેતદ્વીપ'.toCanonicalIastFromGujarati(), 'śvetadvīpa');
      expect(
        'ગુજરાત Shwetdweep'.toPlainEnglishFromGujarati(options: natural),
        'gujarat Shwetdweep',
      );
    });

    test('natural readable style resolves compound schwa and Hindi infinitives',
        () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      const gujarati = <String, String>{
        'ગાંધીનગર': 'gandhinagar',
        'ભાવનગર': 'bhavnagar',
        'જામનગર': 'jamnagar',
        'નારાયણઘાટે': 'narayanghate',
        'વર્ષથી': 'varshthi',
        'ધર્મથી': 'dharmthi',
        'ઘરથી': 'gharthi',
        'પરથી': 'parthi',
        'પરત': 'parat',
        'વર્ષમાં': 'varshma',
        'કંઈ': 'kai',
        'કંઈક': 'kaik',
        'ક્યાં': 'kyaan',
        'ત્યાં': 'tyaan',
        'જ્યાં': 'jyaan',
        'પધાર્યાં': 'padharya',
        'કાળમાં': 'kaalma',
        'મારી': 'maari',
        'માટે': 'maate',
        'રાત': 'raat',
        'રાત્રે': 'ratre',
        'ચારણ': 'charan',
        'માર્ગ': 'marg',
        'ગૃહ': 'grih',
        'દીકરો': 'dikro',
        'દીકરી': 'dikri',
        'અમદાવાદ': 'amdavad',
        'રાજકોટ': 'rajkot',
        'નર્મદા': 'narmada',
        'મિત્ર': 'mitra',
        'ચક્ર': 'chakra',
        'વિશ્વ': 'vishwa',
        'મનુષ્ય': 'manushya',
        'ચૈત્ર': 'chaitra',
        'હું': 'hu',
        'જોઈએ': 'joie',
        'ગુજરાતી': 'gujarati',
      };
      for (final entry in gujarati.entries) {
        expect(
          entry.key.toPlainEnglishFromGujarati(options: natural),
          entry.value,
          reason: entry.key,
        );
      }

      const hindi = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.hindi,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      const hindiCases = <String, String>{
        'देखना': 'dekhna',
        'बोलना': 'bolna',
        'लिखना': 'likhna',
        'समझना': 'samajhna',
        'सुनना': 'sunana',
        'गणना': 'ganana',
        'गन्ना': 'ganna',
        'योजना': 'yojna',
        'गांधीनगर': 'gandhinagar',
        'अनगिनत': 'anginat',
        'लड़का': 'ladka',
        'लड़की': 'ladki',
        'पढ़ना': 'padhna',
        'थोड़ा': 'thoda',
        'हूँ': 'hoon',
        'चाहिए': 'chahiye',
        'महल': 'mahal',
        'जितना': 'jitna',
        'अपना': 'apna',
        'पहला': 'pahla',
        'आदमी': 'aadmi',
        'मित्र': 'mitra',
        'धर्म': 'dharm',
        'द्वार': 'dwaar',
        'चार': 'chaar',
        'गृह': 'grih',
      };
      for (final entry in hindiCases.entries) {
        expect(
          entry.key.toPlainEnglishFromDevanagari(options: hindi),
          entry.value,
          reason: entry.key,
        );
      }

      expect('गांधीनगर'.toPlainEnglishFromDevanagari(), 'gaandheengar');
      expect('लड़का'.toPlainEnglishFromDevanagari(), 'larakaa');
      expect('ગૃહ'.toPlainEnglishFromGujarati(), 'griha');
    });

    test('natural readable presentation options', () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
        capitalizeSentenceStarts: true,
        readableWordOverrides: {
          'shwetdweep': 'Shwetdweep',
          'dharm': 'Dharm',
          'vishwakarma': 'Vishwakarma',
        },
      );
      expect(
        'પછી ધર્મ ગયો. તે શ્વેતદ્વીપ પાસે વિશ્વકર્મા હતા.'
            .toPlainEnglishFromGujarati(options: natural),
        'Pachhi Dharm gayo. Te Shwetdweep paase Vishwakarma hata.',
      );
      expect(
        'ગુજરાત ExistingName. પછી'.toPlainEnglishFromGujarati(options: natural),
        'Gujarat ExistingName. Pachhi',
      );
    });

    test('Brahmic SMART vowel length works across Gujarati and Devanagari', () {
      const phrase = 'આજ મારે શ્વેતદ્વીપ સ્વરૂપ ધારણ કરીને ચાર માસ';
      expect(
        phrase.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            readableStyle: BrahmicReadableStyle.natural,
            vowelLength: BrahmicVowelLengthPolicy.collapse,
          ),
        ),
        'aj mare shwetdwip swarup dharan karine char mas',
      );
      expect(
        phrase.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            readableStyle: BrahmicReadableStyle.natural,
            vowelLength: BrahmicVowelLengthPolicy.doubled,
          ),
        ),
        'aaj maare shwetdweep swaroop dhaaran kareene chaar maas',
      );
      expect(
        phrase.toPlainEnglishFromGujarati(
          options: const BrahmicPlainEnglishOptions(
            readableStyle: BrahmicReadableStyle.natural,
            vowelLength: BrahmicVowelLengthPolicy.smart,
          ),
        ),
        'aaj maare shwetdweep swaroop dharan karine chaar maas',
      );

      const hindi = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.hindi,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      const hindiCases = <String, String>{
        'श्वेतद्वीप': 'shwetdweep',
        'स्वरूप': 'swaroop',
        'सतयुग': 'satyug',
        'ऋतु': 'ritu',
        'शुकलपक्ष': 'shuklapaksh',
        'चार': 'chaar',
        'मास': 'maas',
        'काल': 'kaal',
        'धारण': 'dharan',
        'ब्रह्मांड में': 'brahmand men',
        'नारायणघाटे': 'narayanghate',
      };
      for (final entry in hindiCases.entries) {
        expect(
          entry.key.toPlainEnglishFromDevanagari(options: hindi),
          entry.value,
          reason: entry.key,
        );
      }

      const gujaratiInDevanagari = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.gujarati,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      expect(
        'ऋतु'.toPlainEnglishFromDevanagari(options: gujaratiInDevanagari),
        'rutu',
      );

      const sanskrit = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.sanskrit,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      expect('धर्म'.toPlainEnglishFromDevanagari(options: sanskrit), 'dharma');
      expect(
        'श्वेतद्वीप'.toPlainEnglishFromDevanagari(options: sanskrit),
        'shvetadveepa',
      );
      expect(
        'स्वरूप'.toPlainEnglishFromDevanagari(options: sanskrit),
        'svaroopa',
      );
    });

    test('SMART vowel length follows syllable shape instead of a stem list',
        () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      final gujarati = {
        'નામ': 'naam',
        'દૂધ': 'doodh',
        'ફૂલ': 'phool',
        'પાસે': 'paase',
        'કાળજી': 'kaalji',
        'નીચે': 'neeche',
        'મા': 'ma',
        'ના': 'na',
        'કા': 'ka',
        'આશીર્વાદ': 'aashirvad',
        'ગુલાબ': 'gulab',
        'પ્રદીપ': 'pradeep',
        'ચાલીસ': 'chalees',
        'માર્ગ': 'marg',
        'ધારણ': 'dharan',
        'કરીને': 'karine',
      };
      for (final entry in gujarati.entries) {
        expect(
          entry.key.toPlainEnglishFromGujarati(options: natural),
          entry.value,
          reason: entry.key,
        );
      }

      const hindi = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.hindi,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      final hindiCases = {
        'नाम': 'naam',
        'दूध': 'doodh',
        'नीचे': 'neeche',
        'द्वार': 'dwaar',
        'का': 'ka',
        'माँ': 'maan',
        'जाना': 'jaana',
        'कहीं': 'kaheen',
        'हूँ': 'hoon',
        'रूप': 'roop',
      };
      for (final entry in hindiCases.entries) {
        expect(
          entry.key.toPlainEnglishFromDevanagari(options: hindi),
          entry.value,
          reason: entry.key,
        );
      }
    });

    test('natural SMART keeps stem length across open endings and nasal codas',
        () {
      const natural = BrahmicPlainEnglishOptions(
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      final gujarati = {
        'રૂપમાં': 'roopama',
        'સ્વરૂપમાં': 'swaroopama',
        'સ્વરૂપથી': 'swaroopthi',
        'સ્વરૂપને': 'swaroopne',
        'સ્વરૂપે': 'swaroope',
        'શ્વેતદ્વીપમાં': 'shwetdweepama',
        'શ્વેતદ્વીપથી': 'shwetdweepthi',
        'મારેથી': 'maarethi',
        'પાસેથી': 'paasethi',
        'પાસેના': 'paasena',
        'પાસેથીના': 'paasethina',
        'નીચેથી': 'neechethi',
        'ચારમાં': 'chaarma',
        'નામમાં': 'naamma',
        'કરીને': 'karine',
        'એકાદશી': 'ekadashi',
        'રાત્રે': 'ratre',
        'દીકરો': 'dikro',
        'મૂર્તિ': 'murti',
        'કાંઠે': 'kanthe',
      };
      for (final entry in gujarati.entries) {
        expect(
          entry.key.toPlainEnglishFromGujarati(options: natural),
          entry.value,
          reason: entry.key,
        );
      }

      const hindi = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.hindi,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      final hindiCases = {
        'हूँगा': 'hoonga',
        'देखूँगा': 'dekhoonga',
        'देखूंगा': 'dekhoonga',
        'राष्ट्रपति': 'rashtrapati',
        'सप्ताह': 'saptah',
        'चाहिए': 'chahiye',
        'जाना': 'jaana',
        'मूर्ति': 'murti',
        'कांटे': 'kante',
      };
      for (final entry in hindiCases.entries) {
        expect(
          entry.key.toPlainEnglishFromDevanagari(options: hindi),
          entry.value,
          reason: entry.key,
        );
      }

      expect('राष्ट्रपति'.toPlainEnglishFromDevanagari(), 'raashtrapati');
      const sanskrit = BrahmicPlainEnglishOptions(
        language: BrahmicLanguage.sanskrit,
        readableStyle: BrahmicReadableStyle.natural,
        vowelLength: BrahmicVowelLengthPolicy.smart,
      );
      expect(
        'राष्ट्रपति'.toPlainEnglishFromDevanagari(options: sanskrit),
        'raashtrapati',
      );
    });

    test('bulk direct APIs are exported', () {
      expect(
        toPlainEnglishFromGujaratiList(const ['આજ', 'નટવર']),
        const ['aaj', 'natvar'],
      );
      expect(
        toHunterianFromGujaratiList(const ['સમાચાર', 'સર્વે']),
        const ['samachar', 'sarve'],
      );
    });

    test('canonical reverse and legacy IAST Hunterian stay unchanged', () {
      expect('સમાચાર'.toCanonicalIastFromGujarati(), 'samācāra');
      const hunterian = IastPlainEnglishOptions(
        profile: PlainEnglishRomanizationProfile.hunterian,
      );
      expect(
        'Sarasvatī'.toPlainEnglishFromIast(options: hunterian),
        'Saraswati',
      );
      expect('Rāma'.toPlainEnglishFromIast(options: hunterian), 'Ram');
    });

    test('direct result envelopes retain the exact Brahmic source', () {
      final plain = 'આજ મારે'.toPlainEnglishFromGujaratiResult();
      expect(plain.original, 'આજ મારે');
      expect(plain.restoreOriginal(), 'આજ મારે');
      expect(plain.rendered, 'aaj maare');
      expect(plain.profile, TransliterationProfile.plainEnglish);

      final hunterian = 'સમાચાર'.toHunterianFromGujaratiResult();
      expect(hunterian.restoreOriginal(), 'સમાચાર');
      expect(hunterian.rendered, 'samachar');
      expect(hunterian.profile, TransliterationProfile.hunterian);
    });
  });
}
