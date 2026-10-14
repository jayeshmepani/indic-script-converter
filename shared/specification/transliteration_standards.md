# Transliteration Standards Specification

This document defines the mapping rules and behavior for the transliteration standards supported by the Indic Script Converter across all four runtimes.

---

## 1. IAST (International Alphabet of Sanskrit Transliteration)

IAST is the academic standard for the exact round-trip romanization of Sanskrit.

- **Vowels**: `a`, `ā`, `i`, `ī`, `u`, `ū`, `ṛ`, `ṝ`, `ḷ`, `ḹ`, `e`, `o`, `ai`, `au`
- **Consonants**:
  - Gutturals: `ka`, `kha`, `ga`, `gha`, `ṅa`
  - Palatals: `ca`, `cha`, `ja`, `jha`, `ña`
  - Retroflex: `ṭa`, `ṭha`, `ḍa`, `ḍha`, `ṇa`
  - Dentals: `ta`, `tha`, `da`, `dha`, `na`
  - Labials: `pa`, `pha`, `ba`, `bha`, `ma`
  - Semivowels/Liquids: `ya`, `ra`, `la`, `va`
  - Sibilants/Aspirates: `śa` (palatal), `ṣa` (retroflex), `sa` (dental), `ha`
- **Modifiers**:
  - Anusvara: `ṃ`
  - Visarga: `ḥ`

### Strict IAST Constraints
In the `strictIast` profile, characters outside standard IAST are mapped literally (or raise issues if requested).
For example:
- `ḷ` maps to Vocalic L (ऌ) in strict IAST, whereas in ISO-15919/extended Indic it maps to Retroflex Lateral Flap (ळ).

---

## 2. ISO 15919 & Extended Indic

ISO 15919 expands on IAST to support modern Indo-Aryan languages (including Devanagari and Gujarati extensions).

- **Retroflex Lateral Flap**: `ḷ` (ळ / ળ) and its aspirated form `ḷh` (ळ्ह / ળ્હ)
- **Perso-Arabic Consonant Extensions (Nuktas)**:
  - `q` $\rightarrow$ क़ / ક઼ (Guttural stop)
  - `k͟h` / `x` $\rightarrow$ ख़ / ખ઼ (Voiceless velar fricative)
  - `ġ` $\rightarrow$ ग़ / ગ઼ (Voiced velar fricative)
  - `z` $\rightarrow$ ज़ / જ઼ (Voiced alveolar fricative)
  - `f` $\rightarrow$ फ़ / ફ઼ (Voiced labiodental fricative)
  - `ṛ` $\rightarrow$ ड़ / ડ઼ (Retroflex flap)
  - `ṛh` $\rightarrow$ ढ़ / ઢ઼ (Aspirated retroflex flap)
- **Modern Vowels**:
  - Short E: `ĕ` (ऎ)
  - Short O: `ŏ` (ऒ)
  - English A: `æ` (ऍ / ઍ)

---

## 3. Hunterian System

lipimala Hunterian is the simplified ASCII form used on maps and signs. Every diacritic is removed. A long vowel is one plain letter, and dental and retroflex consonants share one English letter.

This profile does not emit the 1954 Government of India standard, which keeps a macron on each long vowel (`jān`, `kailāsh-nāth`). It does not emit the 19th-century Hunter spelling, which used an acute accent (`ján`). A spelling that still writes `ḍ` or `ṭ` is a different system. Canonical IAST is the precise spelling (`jān`, `kṛṣṇa`).

- **Vowels**: A direct Hunterian call writes one ASCII letter (`जान` → `jan`). Plain English doubles that vowel (`jaan`). An IAST call drops the macron in every profile, so `jān` is `jan` for both Plain and Hunterian. `ṛ` is `ri` and `ḷ` is `li`. In Gujarati `NATURAL` mode, an independent `ઋ` / `ऋ` is `ru` (`ઋષિ` → `rushi`). Hindi keeps `ऋषि` → `rishi`.
- **Consonants**: `ट` and `त` are `t`. `ड` and `द` are `d`. The aspirated pairs share `th` and `dh`. `ś` and `ṣ` both become `sh`. `ṇ`, `ṅ`, and `ñ` become `n`.
- **Anusvara**: A terminal `ṃ` becomes `n` by default, or `m` or nothing when that policy is selected. A medial anusvara assimilates to the following consonant when assimilation is on (`saṃsāra` → `sansar`, `siṃha` → `sinha`).
- **Visarga**: Readable output writes `ḥ` as `h`. Hunterian also drops `ḥ` when the next consonant is a stop or sibilant (`दुःख` / `દુઃખ` → `dukh`; Plain keeps `duhkh`). The 1954 chart would keep that `h`.
- **Final a**: IAST output can drop a final short `a` (`Rāma` → `Ram`). Direct Brahmic Plain and Hunterian keep that vowel.
- **v and w**: Legacy Hindi Hunterian writes `w` after a consonant (`Sarasvatī` → `Saraswati`; Plain keeps `Sarasvati`). Gujarati stays on `v` (`સર્વે` → `sarve`). `NATURAL` Hindi and Gujarati also stay on `v`, except the cluster spellings `sv` / `śv` / `ṣv` / `dv`.
- **Vowel length**: Plain English defaults to doubled letters (`ā` → `aa`). Hunterian defaults to one letter (`ā` → `a`) when the caller does not set a vowel-length policy. `NATURAL` + `SMART` is a separate reading layer. With both set, Gujarati Plain and Hunterian return the same string.

---

## 4. Vedic Svara Marks

Vedic texts require accentuation (svara) markers. This converter guarantees the exact preservation and reattachment of svara marks during script-to-script conversions:

- **Udatta (Acute)**: Combining acute accent `◌́` (U+0301)
- **Anudatta (Grave)**: Combining grave accent `◌̀` (U+0300)
- **Svarita (Vertical Line)**: Combining vertical line above `◌́` (represented inline or via U+0951 / U+0A51 depending on target script)
- **Dirgha Svarita**: Long svarita marker sequences.

### Reattachment Rules
Because combining marks (accents) in Latin attach to the vowel characters, but in Devanagari and Gujarati they attach to the whole consonant-vowel cluster, the transliteration engine tracks cluster boundaries and shifts the svara marks to the end of the script cluster to preserve valid rendering sequence without corrupting the underlying text structures.

## 5. lipimala readable Latin, version 1.2.0

Direct Devanagari and Gujarati reading has two styles.

- **`LEGACY`** is the default. It keeps the 1.1 schwa inventory and applies the vowel-length policy uniformly. Plain English doubles long vowels. Hunterian collapses them when the caller omits the policy.
- **`NATURAL`** is opt-in modern Hindi and Gujarati morphology and phonology: extra schwa contraction, Gujarati endings such as `-માં` → `ma` and `-થી` → `thi`, Hindi `-ना` with the nasal-plus-nasal exception, `sv` / `śv` / `ṣv` / `dv` cluster spelling, flap `ड़` / `ડ઼` → `d`, and Gujarati independent `ઋ` → `ru`. A vowel stays between `p` and unaspirated `t` (`राष्ट्रपति` → `rashtrapati`). Aspirated `થ` / `थ` still contracts (`શાપથી` → `shaapthi`). Legacy `गांधीनगर` stays `gaandheengar`; natural Hindi is `gandhinagar`. Sanskrit skips this modern layer.
- **`SMART`** vowel length runs only with `NATURAL`. It reads syllable shape. A closed monosyllable keeps length. An open particle or a heavy cluster shortens. An open ending does not remove length the stem already kept. A nasal coda keeps `ī` / `ū` / `e` / `o`. Sanskrit `SMART` doubles every long vowel. With `NATURAL` + `SMART` on both calls, Gujarati Plain and Hunterian match.
- Other Brahmic scripts are outside this layer. Canonical Brahmic → IAST is unchanged.
