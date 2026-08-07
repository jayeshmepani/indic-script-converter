from __future__ import annotations

from indic_script_converter.brahmic_to_latn_iast import to_canonical_iast_from_devanagari
from tools.fixtures.example_deva import devanagari_smoke_samples


def main() -> None:
    print('-' * 64)
    print(' DEVANAGARI TO LATN IAST TRANSLITERATION')
    print('-' * 64)
    for source in devanagari_smoke_samples:
        result = to_canonical_iast_from_devanagari(source)
        print(f'"{source}" -> "{result}"')


if __name__ == '__main__':
    main()
