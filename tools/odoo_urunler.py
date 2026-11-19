#!/usr/bin/env python3
"""İSTANBUL HAC UMRE kategorisindeki ürünleri Odoo'dan çeker.

Çıktı: docs/data/urunler.json — mağaza sayfası ve fotoğraf robotu bunu okur.
Gizli bilgiler ortam değişkeninden gelir; depoda hiçbir anahtar durmaz.
"""
import json
import os
import re
import sys
import xmlrpc.client
from datetime import datetime, timezone

URL = os.environ.get("ODOO_URL", "https://isthac.istanbulpromo.com").rstrip("/")
DB = os.environ.get("ODOO_DB", "isthac")
LOGIN = os.environ.get("ODOO_LOGIN", "")
KEY = os.environ.get("ODOO_KEY", "")
KATEGORI = (os.environ.get("ODOO_KATEGORI") or "").strip() or "İSTANBUL HAC UMRE"
OUT = os.path.join("docs", "data", "urunler.json")
OUT_JS = os.path.join("docs", "urunler-veri.js")

# Odoo'daki gerçek alt kategoriler sitedeki dört ana başlığa oturtulur.
SITE_KAT = [
    ("Hac Umre Kıyafetleri", ("giyim", "terlik", "ayakkab", "ihram", "ferace", "esarp", "eşarp")),
    ("Hurma ve Zemzem", ("hurma", "zemzem", "kuruyemiş", "kuruyemis", "ikram", "gıda", "gida")),
    ("Hac Umre Malzemeleri", ("bakım", "bakim", "hijyen", "seyahat", "ekipman", "çanta", "canta")),
    ("İslami Hediyelik", ()),
]
KAT_GORSEL = {
    "Hac Umre Malzemeleri": "assets/g/masa.jpg",
    "Hac Umre Kıyafetleri": "assets/g/ihram.jpg",
    "İslami Hediyelik": "assets/g/donus.jpg",
    "Hurma ve Zemzem": "assets/g/hurma.jpg",
}


def site_kategorisi(ad):
    d = (ad or "").lower()
    for baslik, anahtarlar in SITE_KAT:
        if not anahtarlar or any(a in d for a in anahtarlar):
            return baslik
    return "İslami Hediyelik"

if not all([URL, DB, LOGIN, KEY]):
    sys.exit("Eksik ayar: ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_KEY gerekli.")


def baglan():
    ortak = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common", allow_none=True)
    uid = ortak.authenticate(DB, LOGIN, KEY, {})
    if not uid:
        sys.exit("Odoo girişi başarısız: kullanıcı adı veya API anahtarı hatalı.")
    model = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object", allow_none=True)
    return uid, model


def oku(model, uid, metot, alan, *args, **kw):
    return model.execute_kw(DB, uid, KEY, alan, metot, *args, **kw)


def slug(s):
    s = (s or "").lower()
    for a, b in (("ı", "i"), ("İ", "i"), ("ş", "s"), ("ğ", "g"), ("ü", "u"), ("ö", "o"), ("ç", "c")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:48] or "urun"


def main():
    uid, model = baglan()

    kats = oku(model, uid, "search_read", "product.category",
               [[["complete_name", "ilike", KATEGORI]]], {"fields": ["id", "complete_name"]})
    if not kats:
        sys.exit(f"'{KATEGORI}' adında kategori bulunamadı. Odoo'daki yazımı kontrol edin.")
    kat_ids = [k["id"] for k in kats]
    print("Kategoriler:", ", ".join(k["complete_name"] for k in kats))

    alanlar = ["id", "name", "default_code", "barcode", "list_price", "standard_price",
               "categ_id", "description_sale", "active", "sale_ok", "type", "write_date"]
    urunler = oku(model, uid, "search_read", "product.template",
                  [[["categ_id", "child_of", kat_ids]]],
                  {"fields": alanlar, "order": "name asc", "limit": 5000})
    print("Ürün:", len(urunler))

    fotolu = set(oku(model, uid, "search", "product.template",
                     [[["categ_id", "child_of", kat_ids], ["image_1920", "!=", False]]],
                     {"limit": 5000}))
    print("Fotoğraflı:", len(fotolu))

    cikti = []
    kullanilan = set()
    for u in urunler:
        kod = (u.get("default_code") or "").strip()
        anahtar = slug(kod) if kod else slug(u["name"])
        temel, n = anahtar, 2
        while anahtar in kullanilan:
            anahtar, n = f"{temel}-{n}", n + 1
        kullanilan.add(anahtar)
        alt = (u["categ_id"][1].split(" / ")[-1] if u.get("categ_id") else "")
        kat = site_kategorisi(alt)
        cikti.append({
            "id": anahtar,
            "odooId": u["id"],
            "kod": kod,
            "ad": (u.get("name") or "").strip(),
            "fiyat": round(u.get("list_price") or 0, 2),
            "kat": kat,
            "altkat": alt,
            "acik": re.sub(r"\s+", " ", (u.get("description_sale") or "")).strip(),
            "fotoVar": u["id"] in fotolu,
            "aktif": bool(u.get("active", True)),
            "satilir": bool(u.get("sale_ok", True)),
        })

    if len(cikti) > 1500:
        sys.exit(f"Beklenenden çok ürün geldi ({len(cikti)}). Kategori süzgeci '{KATEGORI}' "
                 "doğru çalışmıyor olabilir; dosyalara dokunulmadı.")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({
            "guncelleme": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "kategori": KATEGORI,
            "adet": len(cikti),
            "fotosuz": sum(1 for u in cikti if not u["fotoVar"]),
            "urunler": cikti,
        }, f, ensure_ascii=False, separators=(",", ":"))
    # Site doğrudan bu betiği okuyor: window.URUNLER dolunca örnek liste devre dışı kalır.
    satilan = [u for u in cikti if u["aktif"] and u["satilir"]]
    js = [{
        "id": u["id"], "ad": u["ad"], "fiyat": u["fiyat"], "kat": u["kat"],
        "acik": u["acik"] or u["altkat"] or "",
        "gorsel": f"assets/u/{u['id']}.webp",
        "odooFoto": u["fotoVar"],
        "yedek": KAT_GORSEL.get(u["kat"], "assets/g/masa.jpg"),
    } for u in satilan]
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* Odoo'dan üretildi — elle değiştirmeyin. */\nwindow.URUNLER=")
        json.dump(js, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print("Yazıldı:", OUT_JS, "|", len(js), "ürün siteye çıkıyor")

    print("Yazıldı:", OUT, "|", len(cikti), "ürün,", sum(1 for u in cikti if not u["fotoVar"]), "tanesi fotoğrafsız")


if __name__ == "__main__":
    main()
