from __future__ import annotations

from deva_to_gujr_test import main as deva_to_gujr
from deva_to_latn_iast_test import main as deva_reverse
from gujr_to_deva_test import main as gujr_to_deva
from gujr_to_latn_iast_test import main as gujr_reverse
from latn_iast_to_deva_test import main as to_deva
from latn_iast_to_gujr_test import main as to_gujr
from latn_iast_transcription_test import main as transcribe


def main() -> None:
    to_deva()
    to_gujr()
    transcribe()
    deva_reverse()
    gujr_reverse()
    deva_to_gujr()
    gujr_to_deva()


if __name__ == '__main__':
    main()
