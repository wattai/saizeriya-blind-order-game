# サイゼ注文番号 ノーヒント

サイゼリヤの注文番号を**ヒントなし**で入力するギャグゲーム。

▶ https://wattai.github.io/saizeriya-blind-order-game/

- 出題された料理の4桁の番号を入力（全10品・1品15秒・ミス3回で退店）
- 間違えるとその番号の料理が届き、最後にレシートでお会計
- BGM・効果音は Web Audio API でその場で合成
- 店員さんのボイスは [Irodori-TTS](https://github.com/Aratako/Irodori-TTS)（MIT）でキャプションから声をデザインして生成した AI 合成音声
- イラスト: [いらすとや](https://www.irasutoya.com/)（利用規約に沿って20点以内で使用）

## メニューデータの更新

`menu.json` はサイゼリヤ公式サイトの「人気メニュー」ページから生成しています。

```sh
python3 scripts/fetch_menu.py > menu.json
```

## 店員さんボイスの再生成

`scripts/voices.json` のセリフを Irodori-TTS で生成し、mp3 に変換します（CPU でも動きます）。`--candidates 2` を付けると候補を複数作れるので、聞き比べて良いものを選んでください。

```sh
git clone https://github.com/Aratako/Irodori-TTS && cd Irodori-TTS && uv sync --extra cpu
PYTHONPATH=. .venv/bin/python ../scripts/gen_voices.py --out ../wav
sh ../scripts/encode_voices.sh ../wav
```

## ローカルで動かす

`menu.json` を `fetch` で読むため、HTTP サーバー経由で開いてください。

```sh
python3 -m http.server
```

非公式ファンゲームです。番号は店舗・時期により異なる場合があります。
