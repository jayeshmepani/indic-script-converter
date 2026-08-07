# Verification runners

Generate the five output files from the project root:

```bash
npm run outputs
```

Run an individual direction:

```bash
node tools/latn_iast_transliteration_verification/latn-iast-to-deva-test.js
node tools/latn_iast_transliteration_verification/latn-iast-to-gujr-test.js
node tools/latn_iast_transliteration_verification/latn-iast-transcription-test.js
node tools/latn_iast_transliteration_verification/deva-to-latn-iast-test.js
node tools/latn_iast_transliteration_verification/gujr-to-latn-iast-test.js
```

The runners use the same 497 index-aligned corpus records as the Dart and Python suites. Devanagari forward verification also executes the 22 Vedic fixtures.
