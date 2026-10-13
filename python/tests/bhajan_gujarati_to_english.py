#!/usr/bin/env python3
"""Gujarati -> Plain-English / Hunterian demo for lipimala (Python).

Run with:
    python3 python/tests/bhajan_gujarati_to_english.py
"""

from __future__ import annotations

from pathlib import Path
import sys

# Use the working-tree package so the script runs with plain `python3`
# regardless of which lipimala release is installed in the environment.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lipimala import to_hunterian_from_gujarati, to_plain_english_from_gujarati

LINES = [
    'પદ - ૧',
    'આજ મારે ઓરડે રે, આવ્યા અવિનાશી અલબેલ;',
    'બાઈ મેં બોલાવિયા રે, સુંદર છોગાવાળો છેલ... ૧',
    'નીરખ્યા નેણાં ભરી રે, નટવર સુંદર શ્રી ઘનશ્યામ;',
    'શોભા શી કહું રે, નીરખી લાજે કોટિક કામ... ૨',
    'ગૂંથી ગુલાબના રે, કંઠે આરોપ્યા મેં હાર;',
    'લઈને વારણાં રે, ચરણે લાગી વારંવાર... ૩',
    'આપ્યો મેં તો આદરે રે, બેસવા ચાકળિયો કરી પ્યાર;',
    'પૂછ્યા પ્રીતશું રે, બાઈ મેં સર્વે સમાચાર... ૪',
    'કહોને હરિ ક્યાં હતા રે, ક્યાં થકી આવ્યા ધર્મકુમાર;',
    'સુંદર શોભતા રે, અંગે સજિયા છે શણગાર... ૫',
    'પહેરી પ્રીત શું રે, સુરંગી સૂંથણલી સુખદેણ;',
    'નાડી હીરની રે, જોતાં તૃપ્ત ન થાયે નેણ... ૬',
    'ઉપર ઓઢિયો રે, ગૂઢો રેંટો જોયા લાગ;',
    'સજની તે સમે રે, ધન્ય ધન્ય નીરખ્યા તેનાં ભાગ્ય... ૭',
    'મસ્તક ઉપરે રે, બાંધ્યું મોળીડું અમૂલ્ય;',
    'કોટિક રવિ શશી રે, તે તો નાવે તેને તુલ્ય... ૮',
    'રેશમી કોરનો રે, કરમાં સાહ્યો છે રૂમાલ;',
    'પ્રેમાનંદ તો રે, એ છબી નીરખી થયો નિહાલ... ૯',
]


def main() -> None:
    for line in LINES:
        print(f'GUJ : {line}')
        print(f'PLAIN: {to_plain_english_from_gujarati(line)}')
        print(f'HUNT : {to_hunterian_from_gujarati(line)}')
        print()


if __name__ == '__main__':
    main()
