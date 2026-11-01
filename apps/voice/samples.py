"""Generate a few Hindi voice samples with AI4Bharat Indic Parler-TTS (Apache-2.0) to pick a voice.

Usage: .venv/Scripts/python.exe samples.py  → writes samples/*.wav
The first run downloads the model (~3-4 GB) into the Hugging Face cache.
"""
import time
from pathlib import Path

import soundfile as sf
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer

MODEL = "ai4bharat/indic-parler-tts"
OUT = Path(__file__).parent / "samples"

# Sample text taken from our own report library (Leo Lagna personality + a dasha line).
TEXT = (
    "सिंह लग्न आपको आत्मविश्वासी, उदार और गरिमापूर्ण बनाता है। लोग स्वाभाविक रूप से आपकी ओर आकर्षित होते हैं। "
    "यह समय विस्तार, ज्ञान और आशीर्वाद का है, इसलिए धैर्य और अनुशासन के साथ आगे बढ़ें।"
)

VOICES = {
    "divya_warm": "Divya speaks in a warm, calm and caring tone with a slightly expressive delivery, at a moderate pace. The recording is very clear with no background noise.",
    "rohit_calm": "Rohit speaks in a deep, calm and reassuring voice with natural expression, at a moderate pace. The recording is very clear with no background noise.",
    "divya_bright": "Divya speaks in a bright, friendly and expressive tone at a slightly fast pace. The recording is very clear and close-up with no background noise.",
}


def main() -> None:
    OUT.mkdir(exist_ok=True)
    torch.set_num_threads(max(1, (torch.get_num_threads() or 4)))
    t0 = time.time()
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL)
    tok = AutoTokenizer.from_pretrained(MODEL)
    desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    print(f"model loaded in {time.time() - t0:.0f}s")

    prompt = tok(TEXT, return_tensors="pt")
    for name, description in VOICES.items():
        t = time.time()
        desc = desc_tok(description, return_tensors="pt")
        with torch.inference_mode():
            audio = model.generate(
                input_ids=desc.input_ids,
                attention_mask=desc.attention_mask,
                prompt_input_ids=prompt.input_ids,
                prompt_attention_mask=prompt.attention_mask,
            )
        path = OUT / f"{name}.wav"
        sf.write(path, audio.cpu().numpy().squeeze(), model.config.sampling_rate)
        print(f"{path.name}: {time.time() - t:.0f}s")


if __name__ == "__main__":
    main()
