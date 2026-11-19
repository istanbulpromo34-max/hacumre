#!/usr/bin/env python3
"""Hat eseri kataloğunu siteye hazırlar.

docs/data/products.json ham katalog verisidir; bu betik ondan siteye çıkacak
sade listeyi üretir. Tedarikçi kimliği ve tedarikçi ürün kodu kesinlikle
dışarı verilmez: her esere kendi kodumuz (IHE-xxxx) verilir.

Çıktı: docs/tablo-veri.js  ->  window.TABLOLAR, window.TABLO_KAT
"""
import hashlib
import json
import os
import re
import sys
import unicodedata

KAYNAK = os.path.join("docs", "data", "products.json")
OUT_JS = os.path.join("docs", "tablo-veri.js")

# Tedarikçi filigranı taşıyan kareler temizlenene kadar fotoğraflar kapalı.
# Temiz görseller geldiğinde burayı True yapmak ve betiği yeniden çalıştırmak yeter.
FOTO = os.environ.get("TABLO_FOTO", "").lower() in {"1", "true", "evet"}

# Katalogda geçen, müşteriye gösterilmemesi gereken marka adları
YASAK = ("aşiyan", "asiyan", "myikas", "ikas")

# Sitede gösterilecek kategori sırası; listede olmayanlar sonra, kendi
# büyüklüklerine göre gelir.
SIRA = [
    "Orijinal Hat Eserleri",
    "Çerçeveli Hat Eserleri",
    "Çerçevesiz Hat Eserleri",
    "Hilye-i Şerif Tabloları",
    "Ayetel Kürsi Tabloları",
    "Besmele-i Şerif Tabloları",
    "Esmaül Hüsna Tabloları",
    "Tuğra Tabloları",
    "Lazer Kesim Hat Eserleri",
]


def sade(s):
    s = (s or "").replace("İ", "i").replace("I", "ı").lower()
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c))


def temiz_ad(ad):
    ad = re.sub(r"\s+", " ", (ad or "").strip())
    ad = re.sub(r"[\"“”]", "", ad)          # katalogdan gelen kaçak tırnaklar
    ad = re.sub(r"\s*/\s*", " / ", ad)
    # tedarikçi adı geçen parçaları at
    for y in YASAK:
        ad = re.sub(r"(?i)\b" + re.escape(y) + r"\b\s*", "", ad)
    return re.sub(r"\s+", " ", ad).strip(" -–—|")


def main():
    if not os.path.exists(KAYNAK):
        sys.exit("Katalog yok: " + KAYNAK)
    with open(KAYNAK, encoding="utf-8") as f:
        ham = json.load(f)
    kayitlar = ham if isinstance(ham, list) else (ham.get("products") or list(ham.values()))

    cikti, gorulen = [], set()
    for i, p in enumerate(kayitlar):
        if not isinstance(p, dict):
            continue
        ad = temiz_ad(p.get("name"))
        if not ad or len(ad) < 3:
            continue
        anahtar = sade(ad)
        if anahtar in gorulen:                       # aynı eser birden çok kayıtta olabilir
            continue
        if any(y in anahtar for y in YASAK):
            continue
        gorulen.add(anahtar)
        kat = temiz_ad(p.get("category")) or "Hat Eserleri"
        kayit = {
            # Kendi kodumuz: eser adından üretilir, katalog yenilense de değişmez
            "id": "IHE-" + hashlib.sha1(anahtar.encode("utf-8")).hexdigest()[:5].upper(),
            "ad": ad,
            "kat": kat,
            "fiyat": p.get("price"),
            "fiyatUst": p.get("priceMax") if p.get("priceMax") != p.get("price") else None,
        }
        if FOTO and p.get("cover"):
            kayit["gorsel"] = p["cover"]
        cikti.append({k: v for k, v in kayit.items() if v is not None})

    sayim = {}
    for u in cikti:
        sayim[u["kat"]] = sayim.get(u["kat"], 0) + 1
    kats = sorted(sayim.items(),
                  key=lambda x: (SIRA.index(x[0]) if x[0] in SIRA else len(SIRA), -x[1]))

    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* Hat eseri kataloğundan üretildi — elle değiştirmeyin. */\n")
        f.write("window.TABLO_FOTO=%s;\n" % ("true" if FOTO else "false"))
        f.write("window.TABLO_KAT=")
        json.dump([{"ad": a, "adet": n} for a, n in kats], f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\nwindow.TABLOLAR=")
        json.dump(cikti, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    print(f"Yazıldı: {OUT_JS} | {len(cikti)} eser, {len(kats)} kategori, "
          f"fotoğraf {'açık' if FOTO else 'kapalı'}")
    for a, n in kats[:10]:
        print(f"  {n:>5}  {a}")


if __name__ == "__main__":
    main()
