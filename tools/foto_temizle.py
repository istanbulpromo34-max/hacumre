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

from PIL import Image, ImageDraw, ImageFilter

GELEN = Path("gelen")
CIKTI = Path("docs/assets/u")
BOYUT = 2048
KENAR = 0.06          # kenar boşluğu oranı
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
# "kesme"  : ürünün kendi pikselleri korunur, yalnız arkaplan değişir (varsayılan)
# "openai" : OpenAI görseli yeniden çizer — daha parlak ama ürünü birebir korumaz
YONTEM = os.environ.get("TEMIZLEME", "openai").strip().lower()
ODOO_VARSAYILAN = {"url": "https://isthac.istanbulpromo.com", "db": "isthac", "login": "", "key": ""}
ODOO = {k: (os.environ.get(f"ODOO_{k.upper()}", "").strip() or v) for k, v in ODOO_VARSAYILAN.items()}


# ---------- arkaplan temizleme ----------

def _rembg(ham: bytes) -> Image.Image:
    from rembg import remove, new_session
    oturum = new_session(os.environ.get("REMBG_MODEL", "isnet-general-use"))
    kesik = remove(ham, session=oturum, post_process_mask=True)
    return Image.open(io.BytesIO(kesik)).convert("RGBA")


OPENAI_MODELLER = [m.strip() for m in os.environ.get(
    "OPENAI_MODEL",
    "gpt-image-2.6-sunburst,gpt-image-2.5-sunburst,gpt-image-2,gpt-image-1.5,gpt-image-1-mini"
).split(",") if m.strip()]

STUDYO_PROMPT = (
    "Reshoot this exact product as a professional catalogue studio photograph. "
    "CRITICAL: the product itself must stay identical to the source — same shape, proportions, "
    "colour, material, surface, pattern, printed text, calligraphy, logos and every small detail. "
    "Do not redesign, restyle, re-letter, beautify, add or remove anything, and do not change the "
    "product's angle. Only the background, the lighting and the image quality may change. "
    "Place the product centred on a seamless soft cream backdrop, warm off-white close to #EFE7D8, "
    "with a barely perceptible fine woven fabric texture that reads as a calm background rather than "
    "as a piece of cloth. Lighting: one large soft key light from the upper left, gentle fill from the "
    "right, and a soft natural contact shadow directly under the product; no harsh highlights, no colour cast. "
    "Rendering: tack-sharp focus across the whole product, crisp clean edges, true-to-life colour, high "
    "micro-detail, the look of a manufacturer's catalogue render. Framing: square, the product fully inside "
    "the frame with even margins, filling about 82 percent of it, so a viewer understands at a glance what "
    "the product is and what it is made of. No props, no hands, no people, no text overlay, no watermark, "
    "no border, no second object. Product: "
)


def _openai_istek(png: bytes, ad: str, model: str, boy: str):
    import urllib.request, urllib.error
    sinir = "----katalog" + base64.b16encode(os.urandom(8)).decode()
    parcalar = []

    def alan(ad_, deger):
        parcalar.append(f"--{sinir}\r\nContent-Disposition: form-data; name=\"{ad_}\"\r\n\r\n{deger}\r\n".encode())

    alan("model", model)
    alan("size", boy)
    alan("background", "opaque")
    alan("quality", "high")
    alan("prompt", STUDYO_PROMPT + ad)
    parcalar.append(
        f"--{sinir}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"urun.png\"\r\n"
        f"Content-Type: image/png\r\n\r\n".encode() + png + b"\r\n")
    parcalar.append(f"--{sinir}--\r\n".encode())

    istek = urllib.request.Request(
        "https://api.openai.com/v1/images/edits", data=b"".join(parcalar),
        headers={"Authorization": f"Bearer {OPENAI_KEY}",
                 "Content-Type": f"multipart/form-data; boundary={sinir}"})
    try:
        with urllib.request.urlopen(istek, timeout=300) as c:
            veri = json.loads(c.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{e.code}: {e.read().decode('utf-8', 'replace')[:400]}") from None
    return Image.open(io.BytesIO(base64.b64decode(veri["data"][0]["b64_json"]))).convert("RGBA")


def _openai(ham: bytes, ad: str) -> Image.Image:
    """Ürünü stüdyo karesi olarak yeniden çektirir; model ve boy için sırayla dener."""
    tampon = io.BytesIO()
    Image.open(io.BytesIO(ham)).convert("RGB").save(tampon, "PNG", optimize=True)
    png = tampon.getvalue()

    hatalar = []
    for model in OPENAI_MODELLER:
        for boy in (f"{BOYUT}x{BOYUT}", "1536x1536", "1024x1024"):
            try:
                im = _openai_istek(png, ad, model, boy)
                if im.width != BOYUT:
                    print(f"    ({model} {boy} -> {BOYUT} büyütüldü)")
                return im
            except RuntimeError as e:
                m = str(e)
                hatalar.append(f"{model} {boy}: {m[:90]}")
                if "does not exist" in m or "model" in m and "invalid_value" in m:
                    break          # bu model yok, boy denemeye gerek yok
    raise RuntimeError("OpenAI isteği kabul edilmedi -> " + " | ".join(hatalar[:4]))


# ---------- krem stüdyo zemini ----------

KREM = (239, 231, 216)


ZEMIN_DOSYA = Path("veri/zemin.jpg")


def zemin_uret(boy: int) -> Image.Image:
    """Krem stüdyo fonunu verir: hazır doku varsa onu, yoksa kodla üretileni."""
    if ZEMIN_DOSYA.exists():
        try:
            z = Image.open(ZEMIN_DOSYA).convert("RGB")
            if z.size != (boy, boy):
                z = z.resize((boy, boy), Image.LANCZOS)
            return z
        except Exception:
            pass
    return _zemin_ciz(boy)


def _zemin_ciz(boy: int) -> Image.Image:
    import random
    taban = Image.new("RGB", (boy, boy), KREM)

    # üst soldan gelen softbox ışığı
    isik = Image.new("L", (boy, boy), 0)
    ciz = ImageDraw.Draw(isik)
    merkez = (int(boy * 0.34), int(boy * 0.26))
    en_uzak = max(boy * 1.25, 1)
    adim = max(4, boy // 220)
    for r in range(int(en_uzak), 0, -adim):
        d = int(255 * (1 - r / en_uzak) ** 1.5)
        ciz.ellipse([merkez[0] - r, merkez[1] - r, merkez[0] + r, merkez[1] + r], fill=d)
    isik = isik.filter(ImageFilter.GaussianBlur(boy // 24))

    acik = Image.new("RGB", (boy, boy), (255, 251, 244))
    koyu = Image.new("RGB", (boy, boy), (214, 203, 185))
    kare = Image.composite(acik, koyu, isik.point(lambda v: min(255, int(v * 1.12))))
    kare = Image.blend(taban, kare, 0.55)

    # çok ince dokuma izi: yatay/dikey iplik hissi, neredeyse görünmez
    rastgele = random.Random(7)
    kucuk = boy // 4
    doku = Image.new("L", (kucuk, kucuk))
    doku.putdata([rastgele.randint(112, 143) for _ in range(kucuk * kucuk)])
    doku = doku.resize((boy, boy), Image.BILINEAR).filter(ImageFilter.GaussianBlur(0.6))
    iplik = Image.new("L", (boy, boy), 128)
    ic = ImageDraw.Draw(iplik)
    for x in range(0, boy, max(2, boy // 512)):
        ic.line([(x, 0), (x, boy)], fill=134)
    for y in range(0, boy, max(2, boy // 512)):
        ic.line([(0, y), (boy, y)], fill=122)
    iplik = iplik.filter(ImageFilter.GaussianBlur(0.8))
    karisim = Image.blend(doku, iplik, 0.5)

    kare = kare.convert("RGB")
    gri = karisim.point(lambda v: v)
    return Image.blend(kare, Image.merge("RGB", (gri, gri, gri)), 0.055)


# ---------- yerleştirme ----------

def golge(maske: Image.Image, kutu_boy: int) -> Image.Image:
    """Ürünün altına stüdyo çekimlerindeki gibi yumuşak bir temas gölgesi üretir."""
    g, y = maske.size
    yassi = max(6, int(y * 0.11))
    s = maske.resize((max(1, int(g * 0.92)), yassi), Image.LANCZOS)
    g = s.width
    tuval = Image.new("L", (kutu_boy, kutu_boy), 0)
    tuval.paste(s, ((kutu_boy - g) // 2, min(kutu_boy - yassi, (kutu_boy + y) // 2 - yassi // 2)))
    tuval = tuval.filter(ImageFilter.GaussianBlur(max(8, kutu_boy // 46)))
    return tuval.point(lambda v: int(v * 0.24))


def beyaza_otur(im: Image.Image, kesilmis: bool = True) -> Image.Image:
    """Kesiği kare krem stüdyo zeminine ortalar, gölgesini ekler, 2K'ya getirir."""
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    if not kesilmis:
        # Zemini modelin kendisi kurdu: yalnız 2K'ya büyüt ve netliği topla
        k = im.convert("RGB").resize((BOYUT, BOYUT), Image.LANCZOS)
        return k.filter(ImageFilter.UnsharpMask(radius=2, percent=45, threshold=3))
    kutu = im.getbbox() if im.getchannel("A").getextrema()[0] < 255 else None
    if kutu:
        im = im.crop(kutu)

    ic = int(BOYUT * (1 - 2 * KENAR))
    o = min(ic / im.width, ic / im.height)
    yeni = (max(1, round(im.width * o)), max(1, round(im.height * o)))
    im = im.resize(yeni, Image.LANCZOS)
    if o > 1.4:
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=3))

    zemin = zemin_uret(BOYUT).convert("RGBA")
    if im.getchannel("A").getextrema()[0] < 250:        # kesilmiş ürün: gölgesini de koy
        koyu = Image.new("RGBA", (BOYUT, BOYUT), (92, 78, 58, 255))
        zemin.paste(koyu, (0, 0), golge(im.getchannel("A"), BOYUT))
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
    openai_kullan = bool(OPENAI_KEY) and YONTEM == "openai"
    if YONTEM == "openai" and not OPENAI_KEY:
        print("OPENAI_API_KEY tanımlı değil; ürün kesilip krem zemine oturtulacak.")
    yontem = "OpenAI (yeniden çizim)" if openai_kullan else "kesme (ürün birebir korunur)"
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
            kesik = _openai(ham, ad) if openai_kullan else _rembg(ham)
            son = beyaza_otur(kesik, kesilmis=not openai_kullan)
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
