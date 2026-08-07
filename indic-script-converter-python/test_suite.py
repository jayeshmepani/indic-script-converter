from __future__ import annotations

import sys


def main() -> int:
    try:
        import pytest
    except ImportError:
        print(
            "pytest is required for the complete suite: python -m pip install -e '.[dev]'",
            file=sys.stderr,
        )
        return 2
    return int(pytest.main(['-q', 'tests']))


if __name__ == '__main__':
    raise SystemExit(main())
