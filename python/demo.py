from __future__ import annotations

import json

from indic_script_converter import (
    IastPlainEnglishOptions,
    LosslessTransliterationResult,
    PlainEnglishRomanizationProfile,
    to_lossless_devanagari,
    to_lossless_gujarati,
    to_lossless_plain_english,
)


def main() -> None:
    source = 'Kṛṣṇa ā́tman ḷa'

    devanagari = to_lossless_devanagari(source)
    gujarati = to_lossless_gujarati(source)
    hunterian = to_lossless_plain_english(
        source,
        IastPlainEnglishOptions(
            profile=PlainEnglishRomanizationProfile.HUNTERIAN,
        ),
    )

    print(devanagari.rendered)
    print(gujarati.rendered)
    print(hunterian.rendered)

    assert hunterian.restore_original() == source

    serialized = json.dumps(hunterian.to_json(), ensure_ascii=False)
    restored = LosslessTransliterationResult.from_json(json.loads(serialized))
    assert restored.restore_original() == source


if __name__ == '__main__':
    main()
