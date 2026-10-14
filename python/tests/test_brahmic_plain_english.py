from __future__ import annotations

from lipimala import (
    AynPolicy,
    BrahmicLanguage,
    BrahmicPlainEnglishOptions,
    BrahmicReadableStyle,
    BrahmicSchwaDeletionPolicy,
    BrahmicVowelLengthPolicy,
    GlottalStopPolicy,
    IastPlainEnglishOptions,
    JnaPolicy,
    NyaPolicy,
    PlainEnglishRomanizationProfile,
    TerminalAnusvaraPolicy,
    to_canonical_iast_from_gujarati,
    to_hunterian_from_devanagari,
    to_hunterian_from_gujarati,
    to_hunterian_from_gujarati_list,
    to_hunterian_from_gujarati_result,
    to_plain_english_from_devanagari,
    to_plain_english_from_gujarati,
    to_plain_english_from_gujarati_list,
    to_plain_english_from_gujarati_result,
    to_plain_english_from_iast,
)


def test_gujarati_direct_plain_english_is_source_aware() -> None:
    cases = {
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
    }
    for source, expected in cases.items():
        assert to_plain_english_from_gujarati(source) == expected


def test_gujarati_direct_hunterian_does_not_apply_hindi_w_rule() -> None:
    cases = {
        'નટવર': 'natvar',
        'સમાચાર': 'samachar',
        'ધર્મકુમાર': 'dharmakumar',
        'સર્વે': 'sarve',
        'શોભતા': 'shobhta',
        'રેશમી': 'reshmi',
        'સૂંથણલી': 'sunthanli',
    }
    for source, expected in cases.items():
        assert to_hunterian_from_gujarati(source) == expected

    assert to_hunterian_from_gujarati('સર્વે swan twin') == 'sarve swan twin'
    assert to_hunterian_from_gujarati('દુઃખ') == 'dukh'


def test_direct_brahmic_transcription_preserves_preexisting_latin_spans() -> None:
    latin = 'cat chocolate camera JavaScript café Kṛṣṇa Kr̥ṣṇa John’s ‘quote’'
    assert to_plain_english_from_gujarati(f'ગુજરાત {latin}') == f'gujaraat {latin}'
    assert to_hunterian_from_gujarati(f'ગુજરાત {latin}') == f'gujarat {latin}'
    assert to_plain_english_from_devanagari(f'भारत {latin}') == f'bhaarat {latin}'
    assert to_hunterian_from_devanagari(f'भारत {latin}') == f'bharat {latin}'


def test_devanagari_direct_hindi_schwa_and_sanskrit_override() -> None:
    assert to_plain_english_from_devanagari('कानपुर') == 'kaanpur'
    assert to_plain_english_from_devanagari('सरकार') == 'sarkaar'
    assert to_plain_english_from_devanagari('अहमद') == 'ahmad'
    assert to_plain_english_from_devanagari('धर्म') == 'dharm'
    assert to_plain_english_from_gujarati('ધર્મ') == 'dharm'
    assert to_hunterian_from_devanagari('कानपुर') == 'kanpur'
    assert to_hunterian_from_devanagari('सरकार') == 'sarkar'

    sanskrit = BrahmicPlainEnglishOptions(language=BrahmicLanguage.SANSKRIT)
    assert to_plain_english_from_devanagari('कानपुर', sanskrit) == 'kaanapura'
    assert to_plain_english_from_devanagari('धर्म', sanskrit) == 'dharma'


def test_brahmic_direct_options() -> None:
    assert (
        to_plain_english_from_gujarati(
            'નટવર',
            BrahmicPlainEnglishOptions(schwa_deletion=BrahmicSchwaDeletionPolicy.NONE),
        )
        == 'natavara'
    )
    assert (
        to_plain_english_from_gujarati(
            'આજ',
            BrahmicPlainEnglishOptions(vowel_length=BrahmicVowelLengthPolicy.COLLAPSE),
        )
        == 'aj'
    )
    assert (
        to_plain_english_from_gujarati(
            'શું',
            BrahmicPlainEnglishOptions(terminal_anusvara=TerminalAnusvaraPolicy.DROP),
        )
        == 'shu'
    )


def test_gujarati_natural_readable_style() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    cases = {
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
    }
    for source, expected in cases.items():
        assert to_plain_english_from_gujarati(source, natural) == expected

    assert (
        to_hunterian_from_gujarati('શ્વેતદ્વીપ મન્વંતરમાં દુર્વાસાના', natural)
        == 'shwetdweep manvantarma durvasana'
    )
    assert to_plain_english_from_gujarati_list(['શ્વેતદ્વીપ', 'બ્રહ્માંડમાં', 'ઋતુ'], natural) == [
        'shwetdweep',
        'brahmandma',
        'rutu',
    ]


def test_gujarati_natural_full_prose_paragraph() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    source = 'પછી તે ધર્મ જેટલાં બ્રહ્માંડ તેટલા સ્વરૂપ ધારણ કરીને દરેક બ્રહ્માંડમાં ગયા. તે શ્વેતદ્વીપ પાસે વિશ્વકર્મા દ્વારા વિષ્ણુપુર રચાવીને તેમાં રહે છે. ધર્મ એ વિષ્ણુપુરમાંથી મૂર્તિ સહિત સાબરમતીને કાંઠે (નારાયણઘાટે) આવીને દશ વર્ષ તપ કર્યું. તે સમયે વારાહ કલ્પ, સ્વયંભૂ, મન્વંતર, પ્રથમનો સતયુગ, પ્રભવ વર્ષ, ઉત્તરાયન કાળ, વસંત ઋતુ, ચૈત્ર માસ, શુકલપક્ષ, એકાદશી, બ્રાહ્મમુહૂર્ત અને રવિવારને દિવસે નર,નારાયણ, હરિ, કૃષ્ણ એ ચાર સ્વરૂપે પ્રગટ થાતા હવા.ચાક્ષુષ મન્વંતરમાં દુર્વાસાના શાપથી પ્રલય થયો. ત્યારે નરનારાયણ સ્વધામ-બ્રહ્મધામ પધાર્યા અને ધર્મ - મૂર્તિ અક્ષરધામમાં પધાર્યાં.'
    expected = 'pachhi te dharm jetla brahmand tetla swaroop dharan karine darek brahmandma gaya. te shwetdweep paase vishwakarma dwaara vishnupur rachavine tema rahe chhe. dharm e vishnupurmathi murti sahit sabarmatine kanthe (narayanghate) aavine dash varsh tap karyu. te samaye varah kalp, swayambhu, manvantar, prathamno satyug, prabhav varsh, uttarayan kaal, vasant rutu, chaitra maas, shuklapaksh, ekadashi, brahmamuhurt ane ravivarne divase nar,narayan, hari, krishna e chaar swaroope pragat thaata hava.chakshush manvantarma durvasana shaapthi pralay thayo. tyaare narnarayan swadham-brahmadham padharya ane dharm - murti akshardhamma padharya.'
    assert to_plain_english_from_gujarati(source, natural) == expected


def test_gujarati_natural_style_is_opt_in() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    assert to_plain_english_from_gujarati('શ્વેતદ્વીપ') == 'shvetadveep'
    assert to_plain_english_from_gujarati('શ્વેતદ્વીપ', natural) == 'shwetdweep'
    assert to_canonical_iast_from_gujarati('શ્વેતદ્વીપ') == 'śvetadvīpa'
    assert to_plain_english_from_gujarati('ગુજરાત Shwetdweep', natural) == 'gujarat Shwetdweep'


def test_natural_style_resolves_compound_schwa_suffixes_and_hindi_infinitives() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    gujarati = {
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
    }
    for source, expected in gujarati.items():
        assert to_plain_english_from_gujarati(source, natural) == expected

    hindi = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.HINDI,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    hindi_cases = {
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
    }
    for source, expected in hindi_cases.items():
        assert to_plain_english_from_devanagari(source, hindi) == expected

    assert to_plain_english_from_devanagari('गांधीनगर') == 'gaandheengar'
    assert to_plain_english_from_devanagari('लड़का') == 'larakaa'
    assert to_plain_english_from_gujarati('ગૃહ') == 'griha'


def test_natural_readable_presentation_options() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
        capitalize_sentence_starts=True,
        readable_word_overrides={
            'shwetdweep': 'Shwetdweep',
            'dharm': 'Dharm',
            'vishwakarma': 'Vishwakarma',
        },
    )
    assert (
        to_plain_english_from_gujarati('પછી ધર્મ ગયો. તે શ્વેતદ્વીપ પાસે વિશ્વકર્મા હતા.', natural)
        == 'Pachhi Dharm gayo. Te Shwetdweep paase Vishwakarma hata.'
    )
    assert (
        to_plain_english_from_gujarati('ગુજરાત ExistingName. પછી', natural)
        == 'Gujarat ExistingName. Pachhi'
    )


def test_brahmic_smart_vowel_length_across_gujarati_and_devanagari() -> None:
    phrase = 'આજ મારે શ્વેતદ્વીપ સ્વરૂપ ધારણ કરીને ચાર માસ'
    base = {'readable_style': BrahmicReadableStyle.NATURAL}
    assert (
        to_plain_english_from_gujarati(
            phrase,
            BrahmicPlainEnglishOptions(**base, vowel_length=BrahmicVowelLengthPolicy.COLLAPSE),
        )
        == 'aj mare shwetdwip swarup dharan karine char mas'
    )
    assert (
        to_plain_english_from_gujarati(
            phrase,
            BrahmicPlainEnglishOptions(**base, vowel_length=BrahmicVowelLengthPolicy.DOUBLE),
        )
        == 'aaj maare shwetdweep swaroop dhaaran kareene chaar maas'
    )
    assert (
        to_plain_english_from_gujarati(
            phrase,
            BrahmicPlainEnglishOptions(**base, vowel_length=BrahmicVowelLengthPolicy.SMART),
        )
        == 'aaj maare shwetdweep swaroop dharan karine chaar maas'
    )

    hindi = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.HINDI,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    cases = {
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
    }
    for source, expected in cases.items():
        assert to_plain_english_from_devanagari(source, hindi) == expected

    gujarati_in_devanagari = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.GUJARATI,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    assert to_plain_english_from_devanagari('ऋतु', gujarati_in_devanagari) == 'rutu'

    sanskrit = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.SANSKRIT,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    assert to_plain_english_from_devanagari('धर्म', sanskrit) == 'dharma'
    assert to_plain_english_from_devanagari('श्वेतद्वीप', sanskrit) == 'shvetadveepa'
    assert to_plain_english_from_devanagari('स्वरूप', sanskrit) == 'svaroopa'


def test_smart_vowel_length_follows_syllable_shape() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    gujarati = {
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
    }
    for source, expected in gujarati.items():
        assert to_plain_english_from_gujarati(source, natural) == expected

    hindi = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.HINDI,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    hindi_cases = {
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
    }
    for source, expected in hindi_cases.items():
        assert to_plain_english_from_devanagari(source, hindi) == expected


def test_natural_smart_keeps_stem_length_across_open_endings() -> None:
    natural = BrahmicPlainEnglishOptions(
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    gujarati = {
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
    }
    for source, expected in gujarati.items():
        assert to_plain_english_from_gujarati(source, natural) == expected

    hindi = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.HINDI,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    hindi_cases = {
        'हूँगा': 'hoonga',
        'देखूँगा': 'dekhoonga',
        'देखूंगा': 'dekhoonga',
        'राष्ट्रपति': 'rashtrapati',
        'सप्ताह': 'saptah',
        'चाहिए': 'chahiye',
        'जाना': 'jaana',
        'मूर्ति': 'murti',
        'कांटे': 'kante',
    }
    for source, expected in hindi_cases.items():
        assert to_plain_english_from_devanagari(source, hindi) == expected

    assert to_plain_english_from_devanagari('राष्ट्रपति') == 'raashtrapati'
    sanskrit = BrahmicPlainEnglishOptions(
        language=BrahmicLanguage.SANSKRIT,
        readable_style=BrahmicReadableStyle.NATURAL,
        vowel_length=BrahmicVowelLengthPolicy.SMART,
    )
    assert to_plain_english_from_devanagari('राष्ट्रपति', sanskrit) == 'raashtrapati'


def test_brahmic_options_preserve_1_1_positional_constructor_shape() -> None:
    options = BrahmicPlainEnglishOptions(
        BrahmicLanguage.GUJARATI,
        BrahmicSchwaDeletionPolicy.LANGUAGE,
        BrahmicVowelLengthPolicy.COLLAPSE,
        TerminalAnusvaraPolicy.DROP,
        AynPolicy.APOSTROPHE,
        JnaPolicy.GYA,
        NyaPolicy.NA,
        GlottalStopPolicy.REMOVE,
        True,
        True,
        True,
        False,
        False,
        True,
    )
    assert options.use_w_for_v_after_consonants is True
    assert options.readable_style is BrahmicReadableStyle.LEGACY


def test_bulk_direct_apis() -> None:
    assert to_plain_english_from_gujarati_list(['આજ', 'નટવર']) == ['aaj', 'natvar']
    assert to_hunterian_from_gujarati_list(['સમાચાર', 'સર્વે']) == ['samachar', 'sarve']


def test_canonical_and_legacy_iast_hunterian_stay_unchanged() -> None:
    assert to_canonical_iast_from_gujarati('સમાચાર') == 'samācāra'
    hunterian = IastPlainEnglishOptions(profile=PlainEnglishRomanizationProfile.HUNTERIAN)
    assert to_plain_english_from_iast('Sarasvatī', hunterian) == 'Saraswati'
    assert to_plain_english_from_iast('Rāma', hunterian) == 'Ram'


def test_direct_result_envelopes_retain_exact_brahmic_source() -> None:
    plain = to_plain_english_from_gujarati_result('આજ મારે')
    assert plain.original == 'આજ મારે'
    assert plain.restore_original() == 'આજ મારે'
    assert plain.rendered == 'aaj maare'
    assert plain.profile.value == 'plainEnglish'

    hunterian = to_hunterian_from_gujarati_result('સમાચાર')
    assert hunterian.restore_original() == 'સમાચાર'
    assert hunterian.rendered == 'samachar'
    assert hunterian.profile.value == 'hunterian'
