from __future__ import annotations

from lipimala.deva_gujr_converter import (
    to_canonical_gujarati_from_devanagari,
)
from tools.fixtures.example_deva import devanagari_smoke_samples


def main() -> None:
    print('----------------------------------------------------------------')
    print(' DEVANAGARI TO GUJARATI SCRIPT CONVERSION')
    print('----------------------------------------------------------------')

    for source in devanagari_smoke_samples:
        result = to_canonical_gujarati_from_devanagari(source)
        print(f'"{source}" -> "{result}"')


if __name__ == '__main__':
    main()
