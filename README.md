# サイゼ注文番号 ノーヒント

サイゼリヤの注文番号を**ヒントなし**で入力するギャグゲーム。

▶ https://wattai.github.io/saizeriya-blind-order-game/

- 出題された料理の4桁の番号を入力（全10品・1品15秒・ミス3回で退店）
- 間違えるとその番号の料理が届き、最後にレシートでお会計
- BGM・効果音は Web Audio API でその場で合成

## メニューデータの更新

`menu.json` はサイゼリヤ公式サイトの「人気メニュー」ページから生成しています。

```sh
python3 scripts/fetch_menu.py > menu.json
```

## ローカルで動かす

`menu.json` を `fetch` で読むため、HTTP サーバー経由で開いてください。

```sh
python3 -m http.server
```

非公式ファンゲームです。番号は店舗・時期により異なる場合があります。
