#!/usr/bin/env python3
"""サイゼリヤ公式サイトの人気メニューから注文番号・商品名・価格を取得し menu.json を生成する。

使い方: python3 scripts/fetch_menu.py > menu.json
"""
import html
import json
import re
import sys
import time
import urllib.request

BASE = "https://www.saizeriya.co.jp/menu-popular/"
UA = {"User-Agent": "saizeriya-blind-order-game menu fetcher"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read().decode("utf-8")


def text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def parse_item(page):
    title = text(re.search(r"<title>(.*?)</title>", page, re.S).group(1)).split("|")[0].strip()
    name = re.sub(r"\(.*?\)|（.*?）", "", title).strip()
    variants = []
    for article in re.findall(r'<article class="item_spec">(.*?)</article>', page, re.S):
        # 番号・見出し・価格を出現順に読み、価格はそれ以前の未設定の番号に割り当てる
        tokens = re.finditer(
            r'<h2 class="item_number[^"]*">(?:<span>(.*?)</span>)?\s*(\d{4})</h2>'
            r'|<h2[^>]*>(.*?)</h2>'
            r'|円（税込 ([\d,]+)円）',
            article, re.S,
        )
        for m in tokens:
            label, code, heading, price = m.groups()
            if code:
                variants.append({"code": code, "name": name, "variant": text(label or "").strip("（）()"), "price": None})
            elif heading is not None and variants:
                h = text(heading)
                if h.startswith(name):
                    h = h[len(name):].strip()
                if h and not variants[-1]["variant"]:
                    variants[-1]["variant"] = h
            elif price:
                for v in variants:
                    if v["price"] is None:
                        v["price"] = int(price.replace(",", ""))
    return variants


def main():
    top = get(BASE)
    slugs = list(dict.fromkeys(re.findall(r"menu-popular/([0-9_]+)/", top)))
    items = []
    for slug in slugs:
        items += parse_item(get(BASE + slug + "/"))
        time.sleep(0.5)
    json.dump(
        {"source": BASE, "fetched": time.strftime("%Y-%m-%d"), "items": items},
        sys.stdout, ensure_ascii=False, indent=1,
    )


if __name__ == "__main__":
    main()
