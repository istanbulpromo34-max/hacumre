#!/usr/bin/env python3
"""Odoo'dan dışa aktarılan ürün tablosunu siteye ve fotoğraf robotuna hazırlar.

Girdi : veri/urunler.xlsx   (Odoo > Ürünler > Dışa Aktar)
Çıktı : docs/data/urunler.json   (fotoğraf robotunun listesi)
        docs/urunler-veri.js     (sitedeki ürün sayfası)

Ürün kimliği "İç Referans" koduna bağlıdır; kod yoksa addan üretilir.
Böylece liste yenilendiğinde daha önce çekilmiş fotoğraflar ürünlerine bağlı kalır.
"""
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone

import openpyxl

GIRDI = os.environ.get("URUN_XLSX", os.path.join("veri", "urunler.xlsx"))
OUT = os.path.join("docs", "data", "urunler.json")
OUT_JS = os.path.join("docs", "urunler-veri.js")

# Sıra önemli: ilk uyan başlık kazanır, hiçbiri uymazsa son satır geçerli olur.
KURALLAR = [
    ("Hurma ve Zemzem", ("hurma", "zemzem", "lokum", "kahve", "biskuvi", "cikolata", "kuruyemis",
                         "fistik", "bal ", "recel", "kurabiye", "helva", "sakiz")),
    ("Hac Umre Kiyafetleri", ("ihram", "ferace", "elbise", "etek", "gomlek", "shirt", "esarp",
                              "yazma", "basortu", "takke", "corap", "corab", "bone", "tesettur",
                              "kiyafet", "giyim", "abaya", "atlet", "pantolon", "tunik", "hirka",
                              "salvar", "sal", "sali", "tulum", "yelek", "kaftan", "entari",
                              "bornoz", "sapka", "kemer", "bluz", "cubbe", "sarik", "muslin",
                              "takim", "bluzu", "sal")),
    ("Hac Umre Malzemeleri", ("mest", "canta", "cuzdan", "valiz", "bavul", "misvak", "sabun",
                              "mendil", "krem", "sampuan", "dis", "dismacunu", "ayna", "makas",
                              "tirnak", "matara", "termos", "boyunluk", "kilit", "seyahat",
                              "yastik", "kulaklik", "maske", "sirt", "tarak", "poset", "etiket",
                              "terlik", "patik", "ayakkabi", "ayakkabisi", "tavaf", "pusula",
                              "kablo", "bellek", "sarj", "sarz", "powerbank", "pedometre")),
    ("Islami Hediyelik", ()),          # kalan her sey
]
KAT_GORSEL = {
    "Hac Umre Malzemeleri": "assets/g/masa.jpg",
    "Hac Umre Kıyafetleri": "assets/g/ihram.jpg",
    "İslami Hediyelik": "assets/g/donus.jpg",
    "Hurma ve Zemzem": "assets/g/hurma.jpg",
}


def sadelestir(s):
    """Turkce harfleri ASCII karsiligina indirir; 'İ' -> 'i' sorununu da cozer."""
    for a, b in (("ı", "i"), ("İ", "i"), ("I", "i"), ("ş", "s"), ("Ş", "s"), ("ğ", "g"),
                 ("Ğ", "g"), ("ü", "u"), ("Ü", "u"), ("ö", "o"), ("Ö", "o"), ("ç", "c"), ("Ç", "c")):
        s = (s or "").replace(a, b)
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


KAT_ADI = {
    "Hac Umre Kiyafetleri": "Hac Umre Kıyafetleri",
    "Hac Umre Malzemeleri": "Hac Umre Malzemeleri",
    "Islami Hediyelik": "İslami Hediyelik",
    "Hurma ve Zemzem": "Hurma ve Zemzem",
}


def kategori(ad):
    kelimeler = set(re.findall(r"[a-z0-9]+", sadelestir(ad)))
    metin = sadelestir(ad)
    for baslik, anahtarlar in KURALLAR:
        if not anahtarlar:
            return KAT_ADI[baslik]
        for a in anahtarlar:
            # kısa anahtarlar tam kelime arar, uzunlar metnin içinde geçebilir
            if (a in kelimeler) or (len(a) >= 5 and a in metin):
                return KAT_ADI[baslik]
    return "İslami Hediyelik"


# Satışa konu olmayan iç kayıtlar (peşinat, promosyon fişi gibi) listeye girmez.
ELEME = ("pesinat", "promosyon", "showroom", "iade", "kargo ucreti",
         "indirim", "avans", "test urun", "hizmet bedeli")


def elenecek(ad):
    d = sadelestir(ad)
    return any(e in d for e in ELEME) or d.strip() == "hediyelik"


BIRIM = {"ML", "CC", "GR", "KG", "LT", "MT", "CM", "MM", "TL", "DNC", "XL", "XXL", "3D", "USB", "LED", "CD"}


def tr_kucuk(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


def tr_buyuk(s):
    return s.replace("i", "İ").replace("ı", "I").upper()


def basliklandir(ad):
    """Tamamı büyük harfle girilmiş adları Türkçe yazım kurallarına göre düzeltir."""
    ad = re.sub(r"\s+", " ", (ad or "").strip())
    cikti = []
    for kelime in ad.split(" "):
        if not any(c.isalpha() for c in kelime) or kelime != tr_buyuk(kelime):
            cikti.append(kelime)                 # zaten düzgün yazılmış ya da sayı
            continue
        parcalar = re.split(r"([-./])", kelime)
        yeni = []
        for p in parcalar:
            if not p or not p[0].isalpha():
                yeni.append(p)
            elif tr_buyuk(p) in BIRIM:
                yeni.append(tr_buyuk(p))
            elif len(p) == 1 and yeni and yeni[-1] == "-":
                yeni.append(tr_kucuk(p))            # "Hadis-i" gibi ekler
            else:
                yeni.append(tr_buyuk(p[0]) + tr_kucuk(p[1:]))
        cikti.append("".join(yeni))
    return " ".join(cikti)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", sadelestir(s)).strip("-")[:48] or "urun"


def main():
    if not os.path.exists(GIRDI):
        sys.exit(f"{GIRDI} bulunamadı.")
    ws = openpyxl.load_workbook(GIRDI, read_only=True, data_only=True)[openpyxl.load_workbook(GIRDI, read_only=True).sheetnames[0]]
    satirlar = ws.iter_rows(values_only=True)
    basliklar = [str(h or "").strip() for h in next(satirlar)]

    def sut(*adaylar):
        for a in adaylar:
            for i, b in enumerate(basliklar):
                if b.lower() == a.lower():
                    return i
        return None

    i_ad = sut("Adı", "Name", "Ürün Adı")
    i_kod = sut("İç Referans", "Internal Reference", "Referans")
    i_fiyat = sut("Satış Fiyatı", "Sales Price", "Fiyat")
    i_stok = sut("Stok Miktarı", "Quantity On Hand")
    if i_ad is None:
        sys.exit("Tabloda 'Adı' sütunu bulunamadı. Başlıklar: " + ", ".join(basliklar))

    urunler, kullanilan, elenen = [], set(), []
    for r in satirlar:
        ham_ad = (r[i_ad] or "").strip() if i_ad is not None and r[i_ad] else ""
        if not ham_ad:
            continue
        if elenecek(ham_ad):
            elenen.append(ham_ad)
            continue
        kod = str(r[i_kod]).strip() if i_kod is not None and r[i_kod] else ""
        anahtar = slug(kod) if kod else slug(ham_ad)
        temel, n = anahtar, 2
        while anahtar in kullanilan:
            anahtar, n = f"{temel}-{n}", n + 1
        kullanilan.add(anahtar)
        ad = basliklandir(ham_ad)
        urunler.append({
            "id": anahtar,
            "kod": kod,
            "ad": ad,
            "hamAd": ham_ad,
            "fiyat": round(float(r[i_fiyat] or 0), 2) if i_fiyat is not None else 0,
            "stok": float(r[i_stok] or 0) if i_stok is not None else 0,
            "kat": kategori(ham_ad),
            "fotoVar": os.path.exists(os.path.join("docs", "assets", "u", f"{anahtar}.webp")),
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({
            "guncelleme": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "kaynak": os.path.basename(GIRDI),
            "adet": len(urunler),
            "fotosuz": sum(1 for u in urunler if not u["fotoVar"]),
            "urunler": urunler,
        }, f, ensure_ascii=False, separators=(",", ":"))

    js = [{
        "id": u["id"], "ad": u["ad"], "fiyat": u["fiyat"], "kat": u["kat"],
        "acik": "", "gorsel": f"assets/u/{u['id']}.webp",
        "yedek": KAT_GORSEL.get(u["kat"], "assets/g/masa.jpg"),
    } for u in urunler if u["fiyat"] > 0]
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* veri/urunler.xlsx dosyasından üretildi — elle değiştirmeyin. */\n")
        f.write("window.URUNLER=")
        json.dump(js, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    sayim = {}
    for u in urunler:
        sayim[u["kat"]] = sayim.get(u["kat"], 0) + 1
    if elenen:
        print("Listeye alınmayan iç kayıtlar:", ", ".join(elenen))
    print(f"{len(urunler)} ürün yazıldı ({sum(1 for u in urunler if not u['fotoVar'])} tanesi fotoğrafsız)")
    for k, v in sorted(sayim.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
