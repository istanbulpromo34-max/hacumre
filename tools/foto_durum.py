#!/usr/bin/env python3
"""Stüdyodan çıkan görselleri ürün listesine işler.

foto_temizle.py docs/assets/u/<id>.webp üretir; bu betik Odoo'ya hiç
dokunmadan docs/data/urunler.json ve docs/urunler-veri.js dosyalarındaki
"fotoVar" bilgisini diskteki gerçek duruma göre tazeler. Böylece /admin
ekranı çekilmiş ürünü bir daha "çekilecek" diye göstermez.
"""
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kategori import KAT_GORSEL  # noqa: E402

KATEGORI = (os.environ.get("ODOO_KATEGORI") or "").strip() or "İSTANBUL HAC UMRE"
OUT = os.path.join("docs", "data", "urunler.json")
OUT_JS = os.path.join("docs", "urunler-veri.js")
IMG = os.path.join("docs", "assets", "u")


def main():
    if not os.path.exists(OUT):
        print("Ürün listesi yok, atlandı:", OUT)
        return

    with open(OUT, encoding="utf-8") as f:
        veri = json.load(f)
    urunler = veri.get("urunler") or []
    if not urunler:
        print("Liste boş, dokunulmadı.")
        return

    once = sum(1 for u in urunler if u.get("fotoVar"))
    for u in urunler:
        u["fotoVar"] = os.path.exists(os.path.join(IMG, f"{u['id']}.webp"))
    sonra = sum(1 for u in urunler if u["fotoVar"])

    veri["adet"] = len(urunler)
    veri["fotosuz"] = len(urunler) - sonra
    veri["fotoGuncelleme"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(veri, f, ensure_ascii=False, separators=(",", ":"))

    satilan = [u for u in urunler if u.get("aktif", True) and u.get("satilir", True)]
    js = [{
        "id": u["id"], "ad": u["ad"], "kod": u.get("kod", ""), "fiyat": u.get("fiyat", 0),
        "kat": u.get("kat", ""),
        "acik": u.get("acik") or (u.get("altkat") if u.get("altkat") and u.get("altkat") != KATEGORI else ""),
        "gorsel": f"assets/u/{u['id']}.webp",
        "odooFoto": u.get("odooFoto", False),
        "yedek": KAT_GORSEL.get(u.get("kat", ""), "assets/g/masa.jpg"),
    } for u in satilan]
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* Odoo'dan üretildi — elle değiştirmeyin. */\nwindow.URUNLER=")
        json.dump(js, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    print(f"Foto durumu tazelendi: {once} -> {sonra} çekilmiş, {len(urunler) - sonra} kaldı")


if __name__ == "__main__":
    main()
