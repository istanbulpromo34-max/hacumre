#!/usr/bin/env python3
"""Hat eseri kataloğunu siteye hazırlar.

docs/data/products.json ham katalog verisidir; bu betik ondan siteye çıkacak
sade listeyi üretir. Tedarikçi kimliği ve tedarikçi ürün kodu kesinlikle
dışarı verilmez: her esere kendi kodumuz (IHE-xxxx) verilir.

Çıktı: docs/tablo-veri.js  ->  window.TABLOLAR, window.TABLO_KAT
"""
import glob
import hashlib
import json
import os
import re
import sys
import unicodedata

KAYNAK = os.path.join("docs", "data", "products.json")
OUT_JS = os.path.join("docs", "tablo-veri.js")

# Fotoğraflar. Filigranlı kareler yalnızca baskı (çerçevesiz) üründe çıkıyordu;
# o satır katalogdan tümden kalktığı için kalan eserlerin kareleri temiz.
# Kapatmak gerekirse akışta TABLO_FOTO=0 yapmak yeter.
FOTO = os.environ.get("TABLO_FOTO", "1").lower() in {"1", "true", "evet"}

# Satmadığımız baskı (çerçevesiz) eserler: ne kendileri ne kategorileri listelenir.
BASKI_KAT = {"cercevesiz hat eserleri"}

# Hat sanatıyla ilgisi olmayan (manzara, şehir vb.) eserler: listelenmez
ILGISIZ = {"dev dalganin gun batimiyla dansi", "ingiltere sokaklarinda gunluk hayat"}

# Katalogda geçen, müşteriye gösterilmemesi gereken marka adları
YASAK = ("aşiyan", "asiyan", "myikas", "ikas")

# Sitede gösterilecek kategori sırası; listede olmayanlar sonra, kendi
# büyüklüklerine göre gelir.
SIRA = [
    "Orijinal Hat Eserleri",
    "Çerçeveli Hat Eserleri",
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


OLCU_RE = re.compile(r"(\d{1,3})\s*[xX×]\s*(\d{1,3})")


def detaylar():
    """Ürün kodu -> ayrıntı (varyantlar). Boyutlar kaynakta varyant adında duruyor."""
    d = {}
    for f in sorted(glob.glob(os.path.join("docs", "data", "detay", "*.json"))):
        with open(f, encoding="utf-8") as fh:
            d.update(json.load(fh))
    return d


def olculer(det):
    """Varyant adlarından benzersiz ölçüleri çıkarır (küçükten büyüğe): ['18x18', '35x35']"""
    gor, out = set(), []
    for v in (det or {}).get("variants") or []:
        m = OLCU_RE.search(v.get("name") or "")
        if not m:
            continue
        o = f"{int(m.group(1))}x{int(m.group(2))}"
        if o not in gor:
            gor.add(o)
            out.append(o)
    return sorted(out, key=lambda o: [int(x) for x in o.split("x")])


PARCA_RE = re.compile(r"(Küçük|Büyük|Orta)\s*:\s*(\d{1,3})\s*[xX×]\s*(\d{1,3})", re.I)


def parca_olculeri(det):
    """Takım eserlerde varyant yok; parça ölçüleri açıklamada yazıyor."""
    gor, out = set(), []
    for ad, a, b in PARCA_RE.findall((det or {}).get("description") or ""):
        k = ad.capitalize()
        if k in gor:
            continue
        gor.add(k)
        out.append(f"{k} {int(a)}x{int(b)}")
    return out


def main():
    if not os.path.exists(KAYNAK):
        sys.exit("Katalog yok: " + KAYNAK)
    with open(KAYNAK, encoding="utf-8") as f:
        ham = json.load(f)
    kayitlar = ham if isinstance(ham, list) else (ham.get("products") or list(ham.values()))

    det = detaylar()
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
        if anahtar.replace("ı", "i") in ILGISIZ:
            continue
        kat = temiz_ad(p.get("category")) or "Hat Eserleri"
        # Baskı eserler satılmıyor: kategorisinden ya da adından anlaşılanı at
        if sade(kat) in BASKI_KAT or "baski" in sade(ad):
            continue
        gorulen.add(anahtar)
        kayit = {
            # Kendi kodumuz: eser adından üretilir, katalog yenilense de değişmez
            "id": "IHE-" + hashlib.sha1(anahtar.encode("utf-8")).hexdigest()[:5].upper(),
            "ad": ad,
            "kat": kat,
            "fiyat": p.get("price"),
            "fiyatUst": p.get("priceMax") if p.get("priceMax") != p.get("price") else None,
        }
        ol = olculer(det.get(p.get("code")))
        if ol:
            kayit["olcu"] = ol
        else:
            pa = parca_olculeri(det.get(p.get("code")))
            if pa:
                kayit["parca"] = pa
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
