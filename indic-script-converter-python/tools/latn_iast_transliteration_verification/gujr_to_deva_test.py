from __future__ import annotations

from indic_script_converter.deva_gujr_converter import (
    to_canonical_devanagari_from_gujarati,
)
from indic_script_converter.tools.example_gujr import gujarati_smoke_samples


def main() -> None:
    print('----------------------------------------------------------------')
    print(' GUJARATI TO DEVANAGARI SCRIPT CONVERSION')
    print('----------------------------------------------------------------')

    for source in gujarati_smoke_samples:
        result = to_canonical_devanagari_from_gujarati(source)
        print(f'"{source}" -> "{result}"')


if __name__ == '__main__':
    main()
