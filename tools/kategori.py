#!/usr/bin/env python3
"""Ürünü sitedeki sekiz başlıktan birine yerleştirir.

Kategoriler yalnızca bu sitenin katalogu içindir; Odoo'daki kayıtlara
dokunulmaz. Karar sırayla verilir: önce Odoo'dan gelen alt kategori metni
anlamlıysa ondan, sonra ürün adındaki anahtar kelimelerden. Kural listesinin
SIRASI önemlidir; üstteki kural önce bakar (ör. "İhram Sabunu" bakım ürünüdür,
kıyafet değil; "Kokulu Tesbih" tesbihtir, koku değil).

Başlık adları site.js içindeki KATEGORILER listesiyle birebir aynı olmalıdır.
"""
import re
import unicodedata

ANA = "İSTANBUL HAC UMRE"

KIYAFET = "İhram ve Umre Kıyafetleri"
KITAP = "Kur'an-ı Kerim, Kitap ve Rahle"
TESBIH = "Tesbih ve Zikirmatik"
YOLCULUK = "Terlik, Mest ve Yolculuk"
KOKU = "Koku, Kolonya ve Esans"
HEDIYE = "Hediyelik ve Dekoratif"
SECCADE = "Seccade ve Namaz Örtüsü"
YIYECEK = "Hurma, Zemzem ve İkramlık"

KAT_GORSEL = {
    KIYAFET: "assets/g/kat-kiyafet.jpg",
    KITAP: "assets/g/kat-kuran.jpg",
    TESBIH: "assets/g/kat-tesbih.jpg",
    YOLCULUK: "assets/g/kat-malzeme.jpg",
    KOKU: "assets/g/kat-koku.jpg",
    HEDIYE: "assets/g/kat-hediyelik.jpg",
    SECCADE: "assets/g/kat-seccade.jpg",
    YIYECEK: "assets/g/kat-hurma.jpg",
}

# Odoo alt kategorisi anlamlıysa önce buraya bakılır
ALT_KURAL = [
    (KITAP, ("kuran", "yayin", "kitap", "mushaf", "rahle")),
    (YIYECEK, ("hurma", "zemzem", "kuruyemis", "ikram", "gida", "lezzet")),
    (KIYAFET, ("giyim", "ihram", "ferace", "esarp", "kiyafet", "tesettur")),
    (YOLCULUK, ("terlik", "ayakkab", "mest", "bakim", "hijyen", "seyahat", "ekipman")),
    (SECCADE, ("seccade", "namazlik", "ortu")),
    (TESBIH, ("tesbih", "zikir")),
    (KOKU, ("koku", "esans", "parfum", "kolonya")),
]

# Ürün adı için — sıra önemlidir, üstteki kural önce bakar
AD_KURAL = [
    (YIYECEK, ("hurma", "zemzem", "acve", "safavi", "sugay", "mebrum", "hudri", "sukkari",
               "biskuvi", "lokum", "cikolata", "kahve", "helva", "tahin", "surahi",
               "kuruyemis", "recel", "fistik", "kurabiye")),
    (SECCADE, ("seccade", "namazlik", "sonil", "medine hali", "ipek hali", "halisi")),
    (TESBIH, ("tesbih", "tespih", "zikirmatik", "kuka", "kehribar", "misbaha")),
    (KITAP, ("kuran", "enam", "hatim", "ilmihal", "siyer", "kitap", "mushaf", "rahle",
             "hadis", "risale", "tecvid", "elifba", "hareke", "peygamber", "hazret",
             "padisah", "silsilename", "ruhussalat", "hazineleri", "haremeyn", "ashab",
             "dualar", "ibadetler", "ahlak", "rehberi", "konusma", "mukerreme")),
    # bakım ve hijyen: kıyafetten önce bakar ("İhram Sabunu" gibi adlar için)
    (YOLCULUK, ("sabun", "misvak", "macun", "sevak", "sampuan", "mendil", "krem",
                "hacamat", "ayna", "surme", "kerata", "dis", "tirnak", "makas", "tarak")),
    (YOLCULUK, ("terlik", "terlig", "mest", "patik", "patig", "ayakkabi", "corap", "corab")),
    (KIYAFET, ("ihram", "kemer", "ferace", "elbise", "etek", "gomlek", "shirt", "pantolon",
               "salvar", "tunik", "bluz", "kaftan", "cubbe", "sal", "esarp", "basortu",
               "yazma", "takke", "sarik", "bone", "tesettur", "abaya", "atlet", "hirka",
               "yelek", "entari", "bornoz", "kiyafet", "giyim", "muslin", "keten",
               "sapka", "tulum")),
    (KOKU, ("kolonya", "kolanya", "esans", "parfum", "koku", "difuser", "difusor",
            "buhurdanlik", "oil", "aksa", "silindir", "hatira")),
    (YOLCULUK, ("termos", "bardak", "bellek", "kablo", "sarz", "sarj", "cuzdan",
                "boyunluk", "canta", "valiz", "pusula", "matara", "kilit", "yastik",
                "maske", "sirt", "poset")),
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
            if a in kelimeler or (len(a) >= 4 and a in metin):
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
