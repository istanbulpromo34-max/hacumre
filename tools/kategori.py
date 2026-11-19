#!/usr/bin/env python3
"""Ürünü sitedeki dört ana başlıktan birine yerleştirir.

Önce Odoo'daki alt kategoriye bakar; ürün doğrudan ana kategoride duruyorsa
adındaki anahtar kelimelerden karar verir. İki betik de burayı kullanır.
"""
import re
import unicodedata

ANA = "İSTANBUL HAC UMRE"

KIYAFET = "Hac Umre Kıyafetleri"
MALZEME = "Hac Umre Malzemeleri"
HEDIYE = "İslami Hediyelik"
YIYECEK = "Hurma ve Zemzem"

KAT_GORSEL = {
    MALZEME: "assets/g/masa.jpg",
    KIYAFET: "assets/g/ihram.jpg",
    HEDIYE: "assets/g/donus.jpg",
    YIYECEK: "assets/g/hurma.jpg",
}

# Odoo alt kategorisi için
ALT_KURAL = [
    (KIYAFET, ("giyim", "terlik", "ayakkab", "ihram", "ferace", "esarp")),
    (YIYECEK, ("hurma", "zemzem", "kuruyemis", "ikram", "gida", "lezzet")),
    (MALZEME, ("bakim", "hijyen", "seyahat", "ekipman", "canta")),
    (HEDIYE, ("kuran", "yayin", "kitap", "seccade", "ortu", "tesbih", "zikir",
              "tablo", "set", "taki", "aksesuar", "hediye")),
]

# Ürün adı için (sıra önemli)
AD_KURAL = [
    (YIYECEK, ("hurma", "zemzem", "lokum", "kahve", "kuruyemis", "cikolata", "biskuvi",
               "recel", "helva", "kurabiye", "fistik")),
    (KIYAFET, ("ihram", "ferace", "elbise", "etek", "gomlek", "shirt", "esarp", "yazma",
               "basortu", "takke", "corap", "corab", "bone", "tesettur", "kiyafet", "giyim",
               "abaya", "atlet", "pantolon", "tunik", "hirka", "salvar", "sal", "tulum",
               "yelek", "kaftan", "entari", "bornoz", "sapka", "bluz", "cubbe", "sarik",
               "muslin", "kemer")),
    (MALZEME, ("mest", "canta", "cuzdan", "valiz", "bavul", "misvak", "sabun", "mendil",
               "krem", "sampuan", "dis", "dismacunu", "ayna", "makas", "tirnak", "matara",
               "termos", "boyunluk", "kilit", "seyahat", "yastik", "kulaklik", "maske",
               "sirt", "tarak", "poset", "etiket", "terlik", "patik", "ayakkabi", "tavaf",
               "pusula", "kablo", "bellek", "sarj", "powerbank", "pedometre", "surme")),
    (HEDIYE, ()),
]


def sadelestir(s):
    for a, b in (("ı", "i"), ("İ", "i"), ("I", "i"), ("ş", "s"), ("Ş", "s"), ("ğ", "g"),
                 ("Ğ", "g"), ("ü", "u"), ("Ü", "u"), ("ö", "o"), ("Ö", "o"), ("ç", "c"), ("Ç", "c")):
        s = (s or "").replace(a, b)
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def _eslestir(metin, kurallar):
    kelimeler = set(re.findall(r"[a-z0-9]+", metin))
    for baslik, anahtarlar in kurallar:
        if not anahtarlar:
            return baslik
        for a in anahtarlar:
            if a in kelimeler or (len(a) >= 5 and a in metin):
                return baslik
    return None


def kategori(ad, altkat=""):
    """Alt kategori anlamlıysa ondan, değilse ürün adından karar verir."""
    alt = sadelestir(altkat)
    if alt and alt != sadelestir(ANA):
        bulunan = _eslestir(alt, ALT_KURAL)
        if bulunan:
            return bulunan
    return _eslestir(sadelestir(ad), AD_KURAL) or HEDIYE


BIRIM = {"ML", "CC", "GR", "KG", "LT", "MT", "CM", "MM", "TL", "DNC", "XL", "XXL", "3D", "USB", "LED", "CD"}


def tr_kucuk(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


def tr_buyuk(s):
    return s.replace("i", "İ").replace("ı", "I").upper()


def basliklandir(ad):
    """Tamamı büyük harfle girilmiş ürün adlarını Türkçe yazımına çevirir."""
    ad = re.sub(r"\s+", " ", (ad or "").strip())
    cikti = []
    for kelime in ad.split(" "):
        if not any(c.isalpha() for c in kelime) or kelime != tr_buyuk(kelime):
            cikti.append(kelime)                      # zaten düzgün yazılmış ya da sayı
            continue
        yeni = []
        for p in re.split(r"([-./])", kelime):
            if not p or not p[0].isalpha():
                yeni.append(p)
            elif tr_buyuk(p) in BIRIM:
                yeni.append(tr_buyuk(p))
            elif len(p) == 1 and yeni and yeni[-1] == "-":
                yeni.append(tr_kucuk(p))              # "Hadis-i" gibi ekler
            else:
                yeni.append(tr_buyuk(p[0]) + tr_kucuk(p[1:]))
        cikti.append("".join(yeni))
    return " ".join(cikti)
