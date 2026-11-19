#!/usr/bin/env python3
"""Higgsfield'a gönderilmeyi bekleyen ham kareleri listeler.

Depoyu klonlamaya gerek yok; her şey GitHub API üzerinden okunur.
Çıktı: her satırda bir JSON nesnesi  {"id", "ad", "url"}
  id  : ürün kimliği (dosya adının uzantısız hâli)
  ad  : ürünün adı (istemde kullanılır)
  url : ham karenin herkese açık adresi (Higgsfield buradan indirir)

Halihazırda gelen/higgs.json kuyruğunda olan kareler listelenmez; ham karesi
gelen/ içinde duran her ürün işlenir (eski görseli olsa da, yeniden çekilmiş
olabilir).
"""
import json
import os
import subprocess
import sys

DEPO = os.environ.get("DEPO", "istanbulpromo34-max/hacumre")
DAL = os.environ.get("DAL", "main")
HAM = f"https://raw.githubusercontent.com/{DEPO}/{DAL}/gelen/"
UZANTILAR = (".jpg", ".jpeg", ".png", ".webp", ".heic")


def api(yol, varsayilan=None):
    try:
        c = subprocess.run(["gh", "api", f"repos/{DEPO}/{yol}"],
                           capture_output=True, text=True, timeout=60)
        if c.returncode != 0:
            return varsayilan
        return json.loads(c.stdout)
    except Exception:
        return varsayilan


def main():
    gelen = api(f"contents/gelen?ref={DAL}", []) or []
    if not isinstance(gelen, list):
        gelen = []
    kareler = [f["name"] for f in gelen
               if f.get("type") == "file" and f["name"].lower().endswith(UZANTILAR)]
    if not kareler:
        print("# kuyruk boş", file=sys.stderr)
        return

    sirada = set()
    kuyruk = api(f"contents/gelen/higgs.json?ref={DAL}")
    if isinstance(kuyruk, dict) and kuyruk.get("content"):
        import base64
        try:
            sirada = {x["id"] for x in json.loads(base64.b64decode(kuyruk["content"]) or b"[]")}
        except Exception:
            sirada = set()

    adlar = {}
    veri = api(f"contents/docs/data/urunler.json?ref={DAL}")
    if isinstance(veri, dict) and veri.get("content"):
        import base64
        try:
            adlar = {u["id"]: u.get("ad", u["id"])
                     for u in json.loads(base64.b64decode(veri["content"]))["urunler"]}
        except Exception:
            adlar = {}

    n = 0
    for dosya in kareler:
        urun_id = dosya.rsplit(".", 1)[0]
        if urun_id in sirada:   # gelen/ içinde duran kare her hâlükârda işlenir
                                 # (eski görseli olan ürün yeniden çekilmiş olabilir)
            continue
        print(json.dumps({"id": urun_id, "ad": adlar.get(urun_id, urun_id),
                          "url": HAM + dosya}, ensure_ascii=False))
        n += 1
    print(f"# {n} kare bekliyor", file=sys.stderr)


if __name__ == "__main__":
    main()
