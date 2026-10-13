from __future__ import annotations

from lipimala import (
    AynPolicy,
    BrahmicPlainEnglishOptions,
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    ScriptToIastOptions,
    UnicodeNormalizationForm,
    to_canonical_iast_from_devanagari,
    to_canonical_iast_from_gujarati,
    to_devanagari_from_iast,
    to_hunterian_from_devanagari,
    to_hunterian_from_gujarati,
    to_plain_english_from_devanagari,
    to_plain_english_from_gujarati,
    to_plain_english_from_iast,
)


def test_precomposed_nukta_consonants_map_canonically() -> None:
    assert to_canonical_iast_from_devanagari('ऩ') == 'ṉa'
    assert to_canonical_iast_from_devanagari('ऱ') == 'ṟa'
    assert to_canonical_iast_from_devanagari('क़') == 'qa'
    assert to_canonical_iast_from_devanagari('ख़') == 'xa'
    assert to_canonical_iast_from_devanagari('ग़') == 'ġa'
    assert to_canonical_iast_from_devanagari('ज़') == 'za'
    assert to_canonical_iast_from_devanagari('ड़') == 'ṛa'
    assert to_canonical_iast_from_devanagari('ढ़') == 'ṛha'
    assert to_canonical_iast_from_devanagari('फ़') == 'fa'
    assert to_canonical_iast_from_devanagari('य़') == 'ẏa'
    assert to_canonical_iast_from_devanagari('च़') == 'ċa'
    assert to_plain_english_from_devanagari('च़') == 'tsa'
    assert to_hunterian_from_devanagari('च़') == 'tsa'
    assert to_devanagari_from_iast('ċa') == 'च़'


def test_precomposed_nuktas_work_under_preserve_normalization() -> None:
    options = ScriptToIastOptions(input_normalization=UnicodeNormalizationForm.PRESERVE)
    assert to_canonical_iast_from_devanagari('क़', options) == 'qa'
    assert to_canonical_iast_from_devanagari('ड़', options) == 'ṛa'


def test_obsolete_accents_abbreviation_and_spacing_signs() -> None:
    assert to_canonical_iast_from_devanagari('ऀ') == '\u0310'
    assert to_canonical_iast_from_devanagari('॓') == '\u0300'
    assert to_canonical_iast_from_devanagari('॔') == '\u0301'
    assert to_canonical_iast_from_devanagari('ॕ') == 'ē'
    assert to_plain_english_from_devanagari('ऻ') == 'ooe'
    assert to_plain_english_from_devanagari('ॕ') == 'ee'
    assert to_plain_english_from_devanagari('ॴ') == 'ooe'
    assert to_plain_english_from_devanagari('॒॑᳚') == ''
    assert to_canonical_iast_from_devanagari('कॎ') == 'ke'
    assert to_canonical_iast_from_devanagari('कॎे') == 'kai'
    assert to_canonical_iast_from_devanagari('कॎा') == 'ko'
    assert to_canonical_iast_from_devanagari('कॎो') == 'kau'
    assert to_plain_english_from_devanagari('कॎे') == 'kai'
    assert to_hunterian_from_devanagari('कॎो') == 'kau'
    assert to_canonical_iast_from_devanagari('॰') == '॰'
    assert to_canonical_iast_from_devanagari('ॱ') == 'ॱ'


def test_candrabindu_nasalization_remains_audible_in_readable_output() -> None:
    assert to_plain_english_from_devanagari('हाँ') == 'haan'
    assert to_hunterian_from_devanagari('हाँ') == 'han'
    assert to_plain_english_from_gujarati('હાઁ') == 'haan'


def test_dangling_brahmic_combining_modifiers_never_leak_into_readable_latin() -> None:
    assert to_plain_english_from_devanagari('़्') == ''
    assert to_plain_english_from_gujarati('઼્ૺૻૼ૽૾૿') == ''


def test_ay_vowels_are_phonemic_not_decorations() -> None:
    assert to_canonical_iast_from_devanagari('ꣾ') == 'aĭ'
    assert to_canonical_iast_from_devanagari('कꣿ') == 'kaĭ'
    assert to_plain_english_from_devanagari('कꣿ') == 'kai'
    assert to_plain_english_from_devanagari('ꣾ') == 'ai'
    assert to_hunterian_from_devanagari('ꣾ') == 'ai'


def test_sacred_signs_keep_their_meaning() -> None:
    assert to_canonical_iast_from_devanagari('ꣽ') == 'oṃ'
    assert to_plain_english_from_devanagari('ꣽ') == 'om'
    assert to_plain_english_from_devanagari('ॐ') == 'om'
    assert to_plain_english_from_gujarati('ૐ') == 'om'
    assert to_hunterian_from_devanagari('ॐ') == 'om'
    assert to_canonical_iast_from_devanagari('a꣼b') == 'a꣼b'


def test_cantillation_preserved_canonically_omitted_in_plain_unless_requested() -> None:
    assert to_canonical_iast_from_devanagari('a꣡') == 'a꣡'
    assert to_plain_english_from_gujarati('a꣡') == 'a'
    assert to_hunterian_from_gujarati('a꣡') == 'a'

    preserve = BrahmicPlainEnglishOptions(preserve_vedic_accent_marks=True)
    assert to_canonical_iast_from_devanagari('क⃰') == 'ka⃰'
    assert to_plain_english_from_devanagari('क⃰') == 'ka'
    assert to_plain_english_from_devanagari('क⃰', preserve) == 'ka⃰'
    assert to_plain_english_from_devanagari('क॑', preserve) == 'ká'


def test_specialized_nasalization_signs_carry_nasal_pronunciation() -> None:
    assert to_canonical_iast_from_devanagari('ꣲ') == 'ṃꣲ'
    assert to_canonical_iast_from_devanagari('ꣴ') == 'ṃṃꣴ'
    assert to_canonical_iast_from_devanagari('ꣷ') == "ṃ'ꣷ"
    assert to_plain_english_from_devanagari('कꣲ') == 'kan'
    assert to_hunterian_from_devanagari('कꣴ') == 'kann'
    assert not any(ch in to_plain_english_from_devanagari('कꣲꣴꣷ') for ch in 'ꣲꣳꣴꣵꣶꣷ')


def test_editorial_signs_never_join_schwa_parsing() -> None:
    assert to_canonical_iast_from_devanagari('राम꣸') == 'rāma꣸'
    assert to_plain_english_from_devanagari('राम꣸') == 'raam꣸'


def test_tone_marks_preserve_canonically_drop_in_plain() -> None:
    assert to_canonical_iast_from_devanagari('क᳐') == 'ka᳐'
    assert to_plain_english_from_devanagari('क᳐') == 'ka'


def test_visarga_modifiers_keep_their_segment() -> None:
    canonical = to_canonical_iast_from_devanagari('देवः᳣')
    assert 'ḥ' in canonical
    assert '᳣' in canonical
    assert '᳣' not in to_plain_english_from_devanagari('देवः᳣')


def test_nasal_signs_keep_their_nasal_segment() -> None:
    assert to_canonical_iast_from_devanagari('ᳩ') == 'ṃᳩ'
    assert to_canonical_iast_from_devanagari('ᳺ') == 'ṃᳺ'


def test_segmental_vedic_signs_are_phonological() -> None:
    assert to_canonical_iast_from_devanagari('ᳲ') == 'ḥᳲ'
    assert to_canonical_iast_from_devanagari('ᳵ') == 'ḫᳵ'
    assert to_canonical_iast_from_devanagari('ᳶ') == 'fᳶ'
    assert 'ᳶ' not in to_plain_english_from_devanagari('ᳶ')


def test_sindhi_implosives_and_alternate_ddda_keep_phonemic_identity() -> None:
    assert to_canonical_iast_from_devanagari('ॻ') == 'ɠa'
    assert to_canonical_iast_from_devanagari('ॼ') == 'ʄa'
    assert to_canonical_iast_from_devanagari('ॾ') == 'ɗa'
    assert to_canonical_iast_from_devanagari('ॿ') == 'ɓa'
    assert to_canonical_iast_from_devanagari('𑬊') == 'ɗa'
    assert to_plain_english_from_devanagari('ॻॼॾॿ') == 'gajadab'
    assert to_devanagari_from_iast('ɠa') == 'ॻ'
    assert to_devanagari_from_iast('ʄa') == 'ॼ'


def test_manuscript_signs_and_fractions_are_preserved() -> None:
    assert to_canonical_iast_from_devanagari('𑬀') == '𑬀'
    assert to_canonical_iast_from_devanagari('꠱') == '꠱'
    assert to_canonical_iast_from_devanagari('राम꠱') == 'rāma꠱'
    assert to_plain_english_from_devanagari('राम꠱') == 'raam꠱'


def test_zero_width_joiners_are_phonetically_silent() -> None:
    assert to_canonical_iast_from_devanagari('क‍') == 'ka'
    assert to_canonical_iast_from_devanagari('क‌') == 'ka'
    assert to_plain_english_from_gujarati('ક‍') == 'ka'


def test_sukun_silences_consonant_schwa_but_is_a_nonsegmental_pause_on_vowels() -> None:
    assert to_canonical_iast_from_gujarati('કૺ') == 'k'
    assert to_plain_english_from_gujarati('કૺ') == 'k'
    assert to_hunterian_from_gujarati('કૺ') == 'k'
    assert to_canonical_iast_from_gujarati('અૺ') == 'a'
    assert to_plain_english_from_gujarati('અૺ') == 'a'
    # Tolerate non-standard placement after a vowel sign without deleting that vowel.
    assert to_canonical_iast_from_gujarati('કુૺ') == 'ku'
    assert to_plain_english_from_gujarati('કુૺ') == 'ku'


def test_shadda_geminates_the_consonant() -> None:
    assert to_canonical_iast_from_gujarati('નૻ') == 'nn'
    assert to_plain_english_from_gujarati('નૻ') == 'nn'


def test_maddah_elongates_the_vowel() -> None:
    assert to_canonical_iast_from_gujarati('કૼ') == 'kā'
    assert to_plain_english_from_gujarati('કૼ') == 'kaa'
    assert to_hunterian_from_gujarati('કૼ') == 'ka'
    assert to_canonical_iast_from_gujarati('કુૼ') == 'kū'
    assert to_plain_english_from_gujarati('કુૼ') == 'koo'
    assert to_hunterian_from_gujarati('કુૼ') == 'ku'


def test_documented_cluster_mappings_resolve_phonetically() -> None:
    assert to_canonical_iast_from_gujarati('સ૾') == 'tha'
    assert to_canonical_iast_from_gujarati('ઝ૾') == 'dha'
    assert to_canonical_iast_from_gujarati('ઝ૿') == 'ẓa'
    assert to_canonical_iast_from_gujarati('ક૽') == 'qa'
    assert to_plain_english_from_gujarati('સ૾') == 'tha'
    assert to_hunterian_from_gujarati('ઝ૿') == 'za'
    assert to_canonical_iast_from_gujarati('ક૽ુ') == 'qu'
    assert to_canonical_iast_from_gujarati('ક૽ૺ') == 'q'
    assert to_canonical_iast_from_gujarati('સ૾ૻ') == 'thth'


def test_gujarati_ayn_has_canonical_identity_and_configurable_readable_output() -> None:
    assert to_canonical_iast_from_gujarati('અ૽') == 'ʿa'
    assert to_canonical_iast_from_gujarati('ઇ૽') == 'ʿi'
    assert to_plain_english_from_gujarati('અ૽') == "'a"
    assert (
        to_plain_english_from_gujarati('અ૽', BrahmicPlainEnglishOptions(ayn=AynPolicy.DROP)) == 'a'
    )
    assert (
        to_plain_english_from_gujarati('અ૽', BrahmicPlainEnglishOptions(ayn=AynPolicy.PRESERVE))
        == 'ʿa'
    )


def test_abbreviation_and_rupee_signs_are_preserved() -> None:
    assert to_canonical_iast_from_gujarati('૰') == '૰'
    assert to_canonical_iast_from_gujarati('૱') == '૱'


def test_legacy_iast_hunterian_behavior_stays_unchanged() -> None:
    hunterian = IastPlainEnglishOptions(profile=PlainEnglishRomanizationProfile.HUNTERIAN)
    assert to_plain_english_from_iast('Sarasvatī', hunterian) == 'Saraswati'
    assert to_hunterian_from_gujarati('નટવર') == 'natvar'
