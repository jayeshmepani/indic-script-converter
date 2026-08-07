#!/usr/bin/env python3
"""Consumer smoke test for lipimala (Python)."""

from __future__ import annotations

from lipimala import to_devanagari, to_gujarati

IAST = "Kṛṣṇa ā́tman"
EXPECTED_DEVA = "कृष्ण आ॑त्मन्"


def main() -> None:
    de = to_devanagari(IAST)
    gu = to_gujarati(IAST)

    print(f"package: lipimala")
    print(f"input:   {IAST}")
    print(f"deva:    {de.rendered}")
    print(f"gujr:    {gu.rendered}")
    print(f"restore: {de.restore_original()}")

    assert de.rendered == EXPECTED_DEVA, f"unexpected Devanagari: {de.rendered!r}"
    assert de.restore_original() == IAST, "exact restore failed"
    print("OK: Python consumer smoke test passed")


if __name__ == "__main__":
    main()
