#!/usr/bin/env python3
"""Google Places'ten mağazanın puanını ve yorum sayısını alıp siteye yazar.

GOOGLE_PLACES_KEY ortam değişkenini bekler (GitHub deposunda secret olarak duruyor).
Yer kaydını bir kez arayıp kimliğini docs/puan.json içine yazar; sonraki çalışmalarda
doğrudan o kimliği sorgular, böylece yanlış bir işletmeye kayma ihtimali kalmaz.

Sayılar yalnızca makul göründüğünde yazılır: puan 1-5 arasında olmalı ve yorum sayısı
bir önceki değerin altına düşmemelidir. Aksi halde hiçbir dosyaya dokunmadan çıkar.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_YOL = os.path.join(KOK, "docs", "puan.json")
ANAHTAR = os.environ.get("GOOGLE_PLACES_KEY", "").strip()

# Aramada bu işletmeyi tanımak için kullanılan imzalar
ARAMA = "İstanbul Hac Umre Hediyelik, Cevherağa Camii Sk. No:10-A, Ümraniye, İstanbul"
BEKLENEN_ADRES = "cevherağa"
ALANLAR = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"


def istek(url, govde=None, basliklar=None):
    ver = json.dumps(govde).encode() if govde is not None else None
    r = urllib.request.Request(url, data=ver, headers=basliklar or {})
    if ver is not None:
        r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r, timeout=30) as y:
        return json.loads(y.read().decode())


def yer_ara():
    veri = istek(
        "https://places.googleapis.com/v1/places:searchText",
        {"textQuery": ARAMA, "languageCode": "tr"},
        {"X-Goog-Api-Key": ANAHTAR, "X-Goog-FieldMask": ALANLAR},
    )
    for y in veri.get("places", []):
        adres = (y.get("formattedAddress") or "").lower()
        if BEKLENEN_ADRES in adres:
            return y
    raise SystemExit("Aramada mağazanın adresiyle eşleşen kayıt bulunamadı; dosyalara dokunulmadı.")


def yer_getir(kimlik):
    return istek(
        "https://places.googleapis.com/v1/places/" + kimlik + "?languageCode=tr",
        None,
        {"X-Goog-Api-Key": ANAHTAR, "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount"},
    )


def eski_kayit():
    try:
        with open(JSON_YOL, encoding="utf-8") as d:
            return json.load(d)
    except Exception:
        return {}


def yaz(yol, metin):
    with open(yol, "w", encoding="utf-8") as d:
        d.write(metin)


def degistir(yol, kurallar):
    """kurallar: (desen, yerine) çiftleri. Hiçbiri tutmazsa hata verir."""
    with open(yol, encoding="utf-8") as d:
        metin = d.read()
    ilk = metin
    for desen, yerine in kurallar:
        metin, sayi = re.subn(desen, yerine, metin)
        if sayi == 0:
            print("  ! kalıp bulunamadı:", os.path.basename(yol), desen[:60])
    if metin != ilk:
        yaz(yol, metin)
        return True
    return False


def main():
    if not ANAHTAR:
        raise SystemExit("GOOGLE_PLACES_KEY tanımlı değil.")

    eski = eski_kayit()
    kimlik = eski.get("yer_kimligi")
    try:
        yer = yer_getir(kimlik) if kimlik else yer_ara()
    except urllib.error.HTTPError as h:
        if kimlik:  # kimlik eskimiş olabilir, bir kez de arayarak dene
            print("Kimlikle sorgu başarısız (%s), arama ile deneniyor." % h.code)
            yer = yer_ara()
        else:
            raise

    puan = yer.get("rating")
    adet = yer.get("userRatingCount")
    if not isinstance(puan, (int, float)) or not 1 <= puan <= 5:
        raise SystemExit("Puan beklenen aralıkta değil (%r); dosyalara dokunulmadı." % puan)
    if not isinstance(adet, int) or adet < 1:
        raise SystemExit("Yorum sayısı okunamadı (%r); dosyalara dokunulmadı." % adet)
    onceki = eski.get("yorum")
    if isinstance(onceki, int) and adet < onceki - 5:
        raise SystemExit(
            "Yorum sayısı beklenmedik şekilde düştü (%d -> %d); dosyalara dokunulmadı." % (onceki, adet)
        )

    puan_yazi = ("%.1f" % puan).replace(".", ",")
    adet_yazi = str(adet)
    print("Google: %s puan, %s yorum (%s)" % (puan_yazi, adet_yazi, yer.get("formattedAddress", "")))

    # Her kalıp, o an dosyada hangi sayı yazıyorsa onu yakalar; böylece her çalışmada tekrar çalışır.
    sayi = r"\d+(?:,\d)?\+?"

    degistir(
        os.path.join(KOK, "docs", "site.js"),
        [
            (r"puan:'%s'" % sayi, "puan:'%s'" % puan_yazi),
            (r"yorum:'%s yorum'" % sayi, "yorum:'%s yorum'" % adet_yazi),
        ],
    )
    for ad in ("index.html", "iletisim.html"):
        yol = os.path.join(KOK, "docs", ad)
        if not os.path.exists(yol):
            continue
        yalniz_ana = [
            (r"<b>%s</b>Google puanı" % sayi, "<b>%s</b>Google puanı" % puan_yazi),
            (r"<b>%s</b>Google yorumu" % sayi, "<b>%s</b>Google yorumu" % adet_yazi),
        ] if ad == "index.html" else []
        degistir(
            yol,
            yalniz_ana + [
                (r"(data-isik>)%s(</b>)" % sayi, r"\g<1>%s\g<2>" % puan_yazi),
                (r"5 üzerinden %s puan" % sayi, "5 üzerinden %s puan" % puan_yazi),
                (r"Google'da %s yorum" % sayi, "Google'da %s yorum" % adet_yazi),
                (r'(class="hk-puan"><b>)%s(</b>)' % sayi, r"\g<1>%s\g<2>" % puan_yazi),
                (r"<i>%s yorum</i>" % sayi, "<i>%s yorum</i>" % adet_yazi),
            ],
        )

    yaz(
        JSON_YOL,
        json.dumps(
            {
                "puan": puan,
                "puan_yazi": puan_yazi,
                "yorum": adet,
                "yer_kimligi": yer.get("id"),
                "ad": (yer.get("displayName") or {}).get("text"),
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n",
    )
    print("puan.json güncellendi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
