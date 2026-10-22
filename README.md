# サイゼ注文番号 ノーヒント

サイゼリヤの注文番号を**ヒントなし**で入力するギャグゲーム。

▶ https://wattai.github.io/saizeriya-blind-order-game/

- 出題された料理の4桁の番号を入力（全10品・1品15秒・ミス3回で退店）
- 間違えるとその番号の料理が届き、最後にレシートでお会計
- BGM: [甘茶の音楽工房](https://amachamusic.chagasi.com/)「三匹のこぶた」（タイトル）「リコーダーを吹く猫」（プレイ中）。利用規約に沿ってゲームのBGMとして使用しています。**`bgm/` の音楽ファイルをこのリポジトリから取り出して再利用・再配布しないでください**（使いたい場合は甘茶の音楽工房から直接ダウンロードしてください）
- 効果音は Web Audio API でその場で合成（BGM が再生できないときの代わりの合成BGMも）
- 店員さんのボイスは [Irodori-TTS](https://github.com/Aratako/Irodori-TTS)（MIT）でキャプションから声をデザインして生成した AI 合成音声
- イラスト: [いらすとや](https://www.irasutoya.com/)（利用規約に沿って20点以内で使用）

## 全国ランキング（Supabase）

`config.js` が空のときは「この端末のランキング」（localStorage）として動きます。全国ランキングにするには:

1. [Supabase](https://supabase.com/) で無料プロジェクトを作る
2. SQL Editor で `supabase/schema.sql` を実行（テーブル作成と、閲覧・登録のみ許可する RLS）
3. Project Settings → API Keys の **Project URL** と **anon / publishable key** を `config.js` に書く

anon / publishable キーはブラウザに公開する前提のキーです（`service_role` / secret キーは絶対に入れないでください）。
スコアはサーバー側で「名前1〜12文字」「0〜15000点」「正解数×1650点以下」をチェックしますが、ブラウザから直接送るため完全な不正対策ではありません。

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
