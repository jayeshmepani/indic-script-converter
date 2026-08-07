from __future__ import annotations

from indic_script_converter.brahmic_to_latn_iast import to_canonical_iast_from_gujarati
from indic_script_converter.tools.example_gujr import gujarati_smoke_samples


def main() -> None:
    print('-' * 64)
    print(' GUJARATI TO LATN IAST TRANSLITERATION')
    print('-' * 64)
    for source in gujarati_smoke_samples:
        result = to_canonical_iast_from_gujarati(source)
        print(f'"{source}" -> "{result}"')


if __name__ == '__main__':
    main()
