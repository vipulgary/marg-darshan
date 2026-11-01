"""Download the gated Indic Parler-TTS model with a readable progress line.

Reads HF_TOKEN from the repo-root .env (never printed). Re-runnable: finished files are skipped.
Usage: .venv/Scripts/python.exe download.py
"""
import os
import sys
from pathlib import Path

from huggingface_hub import HfApi, hf_hub_download

REPO = "ai4bharat/indic-parler-tts"
ENV = Path(__file__).resolve().parents[2] / ".env"


def token() -> str:
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if line.startswith("HF_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("HF_TOKEN not found in .env")


def main() -> None:
    tok = token()
    files = [(s.rfilename, s.size or 0) for s in HfApi(token=tok).model_info(REPO, files_metadata=True).siblings]
    total = sum(size for _, size in files)
    done = 0
    print(f"{REPO}: {len(files)} files, {total / 1e9:.2f} GB", flush=True)
    for name, size in files:
        hf_hub_download(REPO, name, token=tok)
        done += size
        print(f"[{done / total * 100:5.1f}%] {done / 1e9:.2f} / {total / 1e9:.2f} GB  {name}", flush=True)
    print("DOWNLOAD COMPLETE", flush=True)


if __name__ == "__main__":
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    main()
