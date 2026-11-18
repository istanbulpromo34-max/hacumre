#!/usr/bin/env python3
"""Deneme: Odoo'daki hazır ürün fotoğraflarından birkaçını alıp iki yöntemi karşılaştırır.

A) kesme  : ürün kesilir, krem stüdyo zeminine oturtulur (pikseller birebir korunur)
B) openai : görsel OpenAI ile yeniden çekilir (stüdyo kalitesi, ürün yeniden çizilir)

Çıktı: docs/_deneme.jpg — üstte ham kare, ortada A, altta B
"""
import base64, importlib.util, io, os, sys, xmlrpc.client
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location("ft", os.path.join("tools", "foto_temizle.py"))
ft = importlib.util.module_from_spec(spec); spec.loader.exec_module(ft)

URL = os.environ.get("ODOO_URL", "https://isthac.istanbulpromo.com").rstrip("/")
DB = os.environ.get("ODOO_DB", "isthac")
LOGIN, KEY = os.environ.get("ODOO_LOGIN", ""), os.environ.get("ODOO_KEY", "")
ADET = int(os.environ.get("DENEME_ADET", "4"))

ortak = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common", allow_none=True)
uid = ortak.authenticate(DB, LOGIN, KEY, {})
if not uid:
    sys.exit("Odoo girişi başarısız.")
model = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object", allow_none=True)
oku = lambda m, a, *x, **k: model.execute_kw(DB, uid, KEY, a, m, *x, **k)

kat = [k["id"] for k in oku("search_read", "product.category",
                            [[["complete_name", "ilike", "İSTANBUL HAC UMRE"]]], {"fields": ["id"]})]
ids = oku("search", "product.template",
          [[["categ_id", "child_of", kat], ["image_1920", "!=", False]]], {"limit": 60})
kayit = oku("read", "product.template", [ids], {"fields": ["name", "default_code", "image_1920"]})

# çeşitlilik: yazılı/ciltli bir ürün, kumaş, küçük obje...
oncelik = ("kuran", "kitap", "hilye", "tesbih", "seccade", "ihram", "kolonya", "hurma", "zikirmatik")
def puan(k):
    d = (k["name"] or "").lower()
    for i, a in enumerate(oncelik):
        if a in d:
            return i
    return len(oncelik)
ARA = os.environ.get("DENEME_ARA", "").strip().lower()
if ARA:
    sec = [k for k in kayit if any(a in (k["name"] or "").lower() for a in ARA.split(","))]
    secim = sec[:ADET] or sorted(kayit, key=puan)[:ADET]
else:
    secim = sorted(kayit, key=puan)[:ADET]
print("Denenecek ürünler:", ", ".join(k["name"][:40] for k in secim))

BOY = 760
sutun = []
for k in secim:
    ham = base64.b64decode(k["image_1920"])
    ham_im = Image.open(io.BytesIO(ham)).convert("RGB")
    try:
        a = ft.beyaza_otur(ft._rembg(ham), kesilmis=True)
    except Exception as e:
        print("  A hatası:", k["name"][:30], e); a = Image.new("RGB", (512, 512), (220, 60, 60))
    try:
        b = ft.beyaza_otur(ft._openai(ham, k["name"]), kesilmis=False)
        print("  B tamam:", k["name"][:30])
    except Exception as e:
        print("  B HATASI:", k["name"][:30], str(e)[:200]); b = Image.new("RGB", (512, 512), (220, 60, 60))
    sutun.append((k["name"], ham_im, a, b))

G = BOY * len(sutun) + 20 * (len(sutun) + 1)
Y = BOY * 3 + 20 * 4 + 40
sayfa = Image.new("RGB", (G, Y), (247, 245, 241))
ciz = ImageDraw.Draw(sayfa)
for i, (ad, *gorseller) in enumerate(sutun):
    x = 20 + i * (BOY + 20)
    ciz.text((x, 12), ad[:46], fill=(30, 30, 30))
    for j, g in enumerate(gorseller):
        sayfa.paste(g.resize((BOY, BOY), Image.LANCZOS), (x, 40 + 20 + j * (BOY + 20)))
etiket = ["HAM", "A - kesme + krem zemin", "B - OpenAI yeniden cekim"]
for j, e in enumerate(etiket):
    ciz.text((6, 40 + 24 + j * (BOY + 20)), e[:3], fill=(90, 90, 90))
sayfa.save("docs/_deneme.jpg", quality=86)
print("docs/_deneme.jpg yazıldı:", sayfa.size)
