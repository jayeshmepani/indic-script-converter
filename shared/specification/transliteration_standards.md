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

The Hunterian System is the official national transliteration standard for India. It is deliberately lossy and oriented toward English pronunciation.

- **Sibilants**: Merges `ś` and `ṣ` into `sh`.
- **Vocalic R**: Maps `ṛ` to `ri`.
- **Vocalic L**: Maps `ḷ` to `li`.
- **Visarga**: Drops or merges `ḥ` into `h`.
- **Anusvara**: Maps `ṃ` to `n` or `m` depending on phonetic context.
- **Vowel Shortening**: Dropping final schwa `a` in Hindi-style romanization profiles.

---

## 4. Vedic Svara Marks

Vedic texts require accentuation (svara) markers. This converter guarantees the exact preservation and reattachment of svara marks during script-to-script conversions:

- **Udatta (Acute)**: Combining acute accent `◌́` (U+0301)
- **Anudatta (Grave)**: Combining grave accent `◌̀` (U+0300)
- **Svarita (Vertical Line)**: Combining vertical line above `◌́` (represented inline or via U+0951 / U+0A51 depending on target script)
- **Dirgha Svarita**: Long svarita marker sequences.

### Reattachment Rules
Because combining marks (accents) in Latin attach to the vowel characters, but in Devanagari and Gujarati they attach to the whole consonant-vowel cluster, the transliteration engine tracks cluster boundaries and shifts the svara marks to the end of the script cluster to preserve valid rendering sequence without corrupting the underlying text structures.
