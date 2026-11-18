#!/usr/bin/env python3
"""Mağazada çekilen ham ürün fotoğraflarını tertemiz beyaz arkaplanlı 2K görsele çevirir.

Girdi : gelen/<urun-id>.<uzanti>   (fotoğraf robotunun bıraktığı ham kareler)
Çıktı : docs/assets/u/<urun-id>.webp  (2048x2048, beyaz zemin)
        istenirse Odoo ürün kartına image_1920 olarak yazılır

Arkaplan temizleme iki yoldan biriyle yapılır:
  * OPENAI_API_KEY varsa  -> OpenAI görsel düzenleme (stüdyo kalitesi)
  * yoksa                 -> rembg (ücretsiz, yerelde çalışır)
"""
import base64
import io
import json
import os
import sys
import xmlrpc.client
from pathlib import Path

from PIL import Image, ImageFilter

GELEN = Path("gelen")
CIKTI = Path("docs/assets/u")
BOYUT = 2048
KENAR = 0.06          # kenar boşluğu oranı
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
ODOO = {k: os.environ.get(f"ODOO_{k.upper()}", "").strip() for k in ("url", "db", "login", "key")}


# ---------- arkaplan temizleme ----------

def _rembg(ham: bytes) -> Image.Image:
    from rembg import remove, new_session
    oturum = new_session(os.environ.get("REMBG_MODEL", "isnet-general-use"))
    kesik = remove(ham, session=oturum, post_process_mask=True)
    return Image.open(io.BytesIO(kesik)).convert("RGBA")


def _openai(ham: bytes, ad: str) -> Image.Image:
    import urllib.request
    sinir = "----katalog" + base64.b16encode(os.urandom(8)).decode()
    parcalar = []

    def alan(ad_, deger):
        parcalar.append(f"--{sinir}\r\nContent-Disposition: form-data; name=\"{ad_}\"\r\n\r\n{deger}\r\n".encode())

    alan("model", "gpt-image-1")
    alan("size", "1024x1024")
    alan("background", "opaque")
    alan("quality", "high")
    alan("prompt",
         "Bu ürünü kes ve tamamen düz, saf beyaz (#FFFFFF) bir stüdyo zemine yerleştir. "
         "Ürünün kendi rengi, dokusu, yazıları ve biçimi hiç değişmesin; yeni nesne, gölge deseni, "
         "yansıma, filigran, yazı veya çerçeve ekleme. Ürün karenin ortasında dursun, "
         "altında çok hafif ve yumuşak bir temas gölgesi olsun. Ürün: " + ad)
    parcalar.append(
        f"--{sinir}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"urun.png\"\r\n"
        f"Content-Type: image/png\r\n\r\n".encode() + ham + b"\r\n")
    parcalar.append(f"--{sinir}--\r\n".encode())
    govde = b"".join(parcalar)

    istek = urllib.request.Request(
        "https://api.openai.com/v1/images/edits", data=govde,
        headers={"Authorization": f"Bearer {OPENAI_KEY}",
                 "Content-Type": f"multipart/form-data; boundary={sinir}"})
    with urllib.request.urlopen(istek, timeout=180) as c:
        veri = json.loads(c.read())
    return Image.open(io.BytesIO(base64.b64decode(veri["data"][0]["b64_json"]))).convert("RGBA")


# ---------- yerleştirme ----------

def beyaza_otur(im: Image.Image) -> Image.Image:
    """Şeffaf kesiği kare beyaz zemine ortalar, 2K'ya büyütür."""
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    kutu = im.getbbox() if im.getchannel("A").getextrema()[0] < 255 else None
    if kutu:
        im = im.crop(kutu)

    ic = int(BOYUT * (1 - 2 * KENAR))
    o = min(ic / im.width, ic / im.height)
    yeni = (max(1, round(im.width * o)), max(1, round(im.height * o)))
    im = im.resize(yeni, Image.LANCZOS)
    if o > 1.4:
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=3))

    zemin = Image.new("RGBA", (BOYUT, BOYUT), (255, 255, 255, 255))
    zemin.alpha_composite(im, ((BOYUT - im.width) // 2, (BOYUT - im.height) // 2))
    return zemin.convert("RGB")


# ---------- Odoo'ya yazma ----------

def odooya_yaz(esleme: dict):
    if not all(ODOO.values()) or not esleme:
        return
    ortak = xmlrpc.client.ServerProxy(f"{ODOO['url'].rstrip('/')}/xmlrpc/2/common", allow_none=True)
    uid = ortak.authenticate(ODOO["db"], ODOO["login"], ODOO["key"], {})
    if not uid:
        print("Odoo girişi başarısız, görseller yalnız sitede duracak.")
        return
    model = xmlrpc.client.ServerProxy(f"{ODOO['url'].rstrip('/')}/xmlrpc/2/object", allow_none=True)
    for odoo_id, im in esleme.items():
        tampon = io.BytesIO()
        im.resize((1920, 1920), Image.LANCZOS).save(tampon, "JPEG", quality=90)
        model.execute_kw(ODOO["db"], uid, ODOO["key"], "product.template", "write",
                         [[odoo_id], {"image_1920": base64.b64encode(tampon.getvalue()).decode()}])
        print("  Odoo kartı güncellendi:", odoo_id)


# ---------- ana akış ----------

def main():
    if not GELEN.is_dir():
        print("gelen/ klasörü yok, yapılacak iş bulunamadı.")
        return
    kareler = sorted(p for p in GELEN.iterdir()
                     if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".heic"})
    if not kareler:
        print("Yeni fotoğraf yok.")
        return

    liste = {}
    yol = Path("docs/data/urunler.json")
    if yol.exists():
        liste = {u["id"]: u for u in json.loads(yol.read_text(encoding="utf-8"))["urunler"]}

    CIKTI.mkdir(parents=True, exist_ok=True)
    yontem = "OpenAI" if OPENAI_KEY else "rembg"
    print(f"{len(kareler)} fotoğraf, yöntem: {yontem}")
    odoo_esleme, basarili, hatali = {}, [], []

    for p in kareler:
        urun_id = p.stem
        ad = liste.get(urun_id, {}).get("ad", urun_id)
        try:
            ham = p.read_bytes()
            if len(ham) > 18 * 1024 * 1024:
                im0 = Image.open(io.BytesIO(ham)); im0.thumbnail((2400, 2400), Image.LANCZOS)
                t = io.BytesIO(); im0.convert("RGB").save(t, "PNG"); ham = t.getvalue()
            kesik = _openai(ham, ad) if OPENAI_KEY else _rembg(ham)
            son = beyaza_otur(kesik)
            son.save(CIKTI / f"{urun_id}.webp", "WEBP", quality=88, method=6)
            basarili.append(urun_id)
            print(f"  ✓ {urun_id} ({ad[:40]})")
            oid = liste.get(urun_id, {}).get("odooId")
            if oid:
                odoo_esleme[oid] = son
            p.unlink()
        except Exception as e:                      # tek bir kare bütün işi durdurmasın
            hatali.append(f"{urun_id}: {e}")
            print(f"  ✗ {urun_id}: {e}")

    odooya_yaz(odoo_esleme)
    print(f"\nBiten: {len(basarili)} | Hatalı: {len(hatali)}")
    for h in hatali:
        print("  -", h)
    if not basarili and hatali:
        sys.exit(1)


if __name__ == "__main__":
    main()
