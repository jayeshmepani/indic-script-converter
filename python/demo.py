from __future__ import annotations

import json

from indic_script_converter import (
    IastPlainEnglishOptions,
    PlainEnglishRomanizationProfile,
    TransliterationResult,
    to_devanagari,
    to_gujarati,
    to_plain_english,
)


def main() -> None:
    source = 'Kṛṣṇa ā́tman ḷa'

    devanagari = to_devanagari(source)
    gujarati = to_gujarati(source)
    hunterian = to_plain_english(
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
    restored = TransliterationResult.from_json(json.loads(serialized))
    assert restored.restore_original() == source


if __name__ == '__main__':
    main()
