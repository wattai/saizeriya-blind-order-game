#!/bin/sh
# gen_voices.py が出力した wav を、前後の無音を削って音量をそろえた mp3 にする
# 使い方: sh scripts/encode_voices.sh /path/to/wav_dir
set -eu
src=$1
out=$(dirname "$0")/../voice
mkdir -p "$out"
for f in "$src"/*.wav; do
  k=$(basename "$f" .wav)
  ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.15,areverse,loudnorm=I=-16:TP=-1.5:LRA=11" \
    -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k "$out/$k.mp3"
done
