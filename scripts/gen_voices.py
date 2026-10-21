#!/usr/bin/env python3
"""店員さんボイスを Irodori-TTS（MIT, https://github.com/Aratako/Irodori-TTS）で生成する。

実在の人物の声は使わず、キャプションによるボイスデザインで声を作る。
最初のセリフ (welcome) をキャプションのみで生成し、以降のセリフはそれを参照音声にして
同じ声のまま感情だけキャプションで変える。

使い方（Irodori-TTS リポジトリの環境で実行）:
  cd Irodori-TTS && uv sync --extra cpu
  PYTHONPATH=. .venv/bin/python /path/to/scripts/gen_voices.py --out /path/to/wav_dir [--only key ...]
出力した wav は scripts/encode_voices.sh で voice/*.mp3 に変換する。
"""
import argparse
import json
from pathlib import Path

from irodori_tts.inference_runtime import (
    InferenceRuntime,
    RuntimeKey,
    SamplingRequest,
    default_runtime_device,
    download_hf_checkpoint,
    save_wav,
)

MODEL = "Aratako/Irodori-TTS-v4.1-Small"
CODEC = "Aratako/Semantic-DACVAE-Japanese-32dim"
VOICE = "若くて明るい女性の店員さん。かわいらしい高めの声で、"

# key: (セリフ, 話し方のキャプション, seed)
LINES = json.loads(Path(__file__).with_name("voices.json").read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--candidates", type=int, default=1)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    device = default_runtime_device()
    runtime = InferenceRuntime.from_key(
        RuntimeKey(
            checkpoint=str(download_hf_checkpoint(MODEL)),
            model_device=device,
            codec_repo=CODEC,
            model_precision="fp32",
            codec_device=device,
            codec_precision="fp32",
            codec_deterministic_encode=True,
            codec_deterministic_decode=True,
            compile_model=False,
            compile_dynamic=False,
        )
    )
    base = out / "welcome.wav"
    for key, line in LINES.items():
        if args.only and key not in args.only:
            continue
        is_base = key == "welcome"
        req = SamplingRequest(
            text=line["text"],
            caption=VOICE + line["style"],
            no_ref=is_base,
            ref_wav=None if is_base else str(base),
            num_candidates=args.candidates,
            seed=line["seed"],
        )
        result = runtime.synthesize(req, log_fn=None)
        for i, audio in enumerate(result.audios):
            name = f"{key}.wav" if args.candidates == 1 else f"{key}_{i}.wav"
            save_wav(out / name, audio, result.sample_rate)
        print(key, "done", flush=True)


if __name__ == "__main__":
    main()
