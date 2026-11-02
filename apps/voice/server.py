"""Self-hosted natural voice for report sections (AMX-203).

Piper (MIT, ONNX, CPU-fast) with female voices: Priyamvada (hi-IN) and Jenny (English).
POST /tts {text, lang} -> audio/wav. Results are cached on disk by a hash of (voice, text),
so each report section is synthesised once and then served instantly.

Run:  .venv/Scripts/python.exe -m uvicorn server:app --port 8001
"""
import hashlib
import io
import re
import wave
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response
from piper import PiperVoice, SynthesisConfig
from pydantic import BaseModel, Field

from translit import latin_to_devanagari

HERE = Path(__file__).parent
CACHE = HERE / "cache"
CACHE.mkdir(exist_ok=True)
VOICES = {"hi": HERE / "voices/hi_IN-priyamvada-medium.onnx", "en": HERE / "voices/en_GB-jenny_dioco-medium.onnx"}
_loaded: dict[str, PiperVoice] = {}

# Slightly slower than default with natural variation reads warmer and less mechanical.
CONFIG = SynthesisConfig(length_scale=1.08, noise_scale=0.667, noise_w_scale=0.8)

app = FastAPI(title="Marg Darshan voice")


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    lang: str = "hi"


def voice(lang: str) -> PiperVoice:
    if lang not in _loaded:
        _loaded[lang] = PiperVoice.load(str(VOICES[lang]))
    return _loaded[lang]


def clean(text: str) -> str:
    text = re.sub(r"[♈-♓]︎?", "", text)  # zodiac glyphs
    text = re.sub(r"[·•|]", ", ", text)
    text = re.sub(r"\s+[—–]\s+", ", ", text)
    return re.sub(r"\s+", " ", text).strip()


@app.get("/health")
def health():
    return {"ok": True, "voices": {k: v.exists() for k, v in VOICES.items()}}


@app.post("/tts")
def tts(body: TtsIn):
    lang = "en" if body.lang == "en" else "hi"
    text = clean(body.text)
    if lang == "hi":
        text = latin_to_devanagari(text)  # the Hindi voice only reads Devanagari (names like "Tanuj")
    if not text:
        raise HTTPException(400, "empty text")
    key = hashlib.sha256(f"{VOICES[lang].name}|{CONFIG}|{text}".encode()).hexdigest()[:32]
    path = CACHE / f"{key}.wav"
    if not path.exists():
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav:
            voice(lang).synthesize_wav(text, wav, syn_config=CONFIG)
        tmp = path.with_suffix(".tmp")
        tmp.write_bytes(buf.getvalue())
        tmp.replace(path)
    return Response(path.read_bytes(), media_type="audio/wav", headers={"Cache-Control": "public, max-age=31536000, immutable"})
