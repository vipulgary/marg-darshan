"""Download the Swiss Ephemeris files used for 1800–2399 CE into ./ephe (AMX-041).

PyPI wheels of PyJHora (>=3.6.6) do not ship these, so the build fetches them.
The same folder is also copied into PyJHora's package data dir when PyJHora is installed.
"""
import shutil
import sys
import urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/"
FILES = ["sepl_18.se1", "semo_18.se1", "seas_18.se1"]
DEST = Path(__file__).resolve().parent.parent / "ephe"


def main() -> int:
    DEST.mkdir(exist_ok=True)
    for name in FILES:
        target = DEST / name
        if target.exists():
            continue
        print(f"downloading {name}")
        urllib.request.urlretrieve(BASE + name, target)
    try:
        import jhora  # noqa: F401
        jhora_ephe = Path(jhora.__file__).parent / "data" / "ephe"
        jhora_ephe.mkdir(parents=True, exist_ok=True)
        for f in DEST.glob("*.se1"):
            shutil.copy2(f, jhora_ephe / f.name)
        print(f"copied into {jhora_ephe}")
    except ImportError:
        print("PyJHora not installed; skipped package copy")
    return 0


if __name__ == "__main__":
    sys.exit(main())
