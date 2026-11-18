#!/usr/bin/env python3
"""Salt okunur bağlantı denemesi: hiçbir kaydı değiştirmez."""
import json, os, re, sys, unicodedata, xmlrpc.client

URL = os.environ.get("ODOO_URL", "https://isthac.istanbulpromo.com").rstrip("/")
DB = os.environ.get("ODOO_DB", "isthac")
LOGIN = os.environ.get("ODOO_LOGIN", "")
KEY = os.environ.get("ODOO_KEY", "")
KATEGORI = os.environ.get("ODOO_KATEGORI", "İSTANBUL HAC UMRE")

if not LOGIN or not KEY:
    sys.exit("ODOO_LOGIN / ODOO_KEY tanımlı değil.")


def sade(s):
    for a, b in (("ı","i"),("İ","i"),("I","i"),("ş","s"),("Ş","s"),("ğ","g"),("Ğ","g"),
                 ("ü","u"),("Ü","u"),("ö","o"),("Ö","o"),("ç","c"),("Ç","c")):
        s = (s or "").replace(a, b)
    s = unicodedata.normalize("NFKD", s)
    return re.sub(r"[^a-z0-9]+", "", "".join(c for c in s if not unicodedata.combining(c)).lower())


ortak = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common", allow_none=True)
uid = ortak.authenticate(DB, LOGIN, KEY, {})
print("Giriş:", "başarılı (uid %s)" % uid if uid else "BAŞARISIZ")
if not uid:
    sys.exit("Kullanıcı adı ya da API anahtarı kabul edilmedi.")

model = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object", allow_none=True)
oku = lambda m, a, *x, **k: model.execute_kw(DB, uid, KEY, a, m, *x, **k)

print("\n-- yetki --")
for alan, hak in (("product.template", "read"), ("product.template", "write")):
    try:
        print(f"  {alan}.{hak}:", "var" if oku("check_access_rights", alan, [hak], {"raise_exception": False}) else "YOK")
    except Exception as e:
        print(f"  {alan}.{hak}: sorulamadı ({str(e)[:60]})")

kats = oku("search_read", "product.category", [[["complete_name", "ilike", KATEGORI]]],
           {"fields": ["id", "complete_name"]})
print("\n-- kategori --")
for k in kats:
    print("  ", k["complete_name"])
if not kats:
    sys.exit(f"'{KATEGORI}' kategorisi bulunamadı.")
kid = [k["id"] for k in kats]

urun = oku("search_read", "product.template", [[["categ_id", "child_of", kid]]],
           {"fields": ["id", "name", "default_code", "list_price"], "limit": 5000})
fotolu = set(oku("search", "product.template",
                 [[["categ_id", "child_of", kid], ["image_1920", "!=", False]]], {"limit": 5000}))

print(f"\n-- Odoo --\n  kategorideki ürün: {len(urun)}\n  fotoğrafı olan   : {len(fotolu)}"
      f"\n  ürün kodu olan   : {sum(1 for u in urun if u.get('default_code'))}")

yerel = json.load(open("docs/data/urunler.json", encoding="utf-8"))["urunler"]
kodla = {u["kod"]: u for u in yerel if u["kod"]}
adla = {sade(u["hamAd"]): u for u in yerel}
kod_es = ad_es = yok = 0
eslesmeyen = []
for u in urun:
    k = (u.get("default_code") or "").strip()
    if k and k in kodla:
        kod_es += 1
    elif sade(u["name"]) in adla:
        ad_es += 1
    else:
        yok += 1
        eslesmeyen.append(u["name"])
print(f"\n-- Excel listesiyle eşleşme (yerelde {len(yerel)} ürün) --"
      f"\n  ürün koduyla eşleşen : {kod_es}\n  adıyla eşleşen       : {ad_es}\n  eşleşmeyen           : {yok}")
for a in eslesmeyen[:15]:
    print("   -", a)
print("\n-- kurulu modüller --")
for m in oku("search_read", "ir.module.module",
             [[["name", "in", ["website", "website_sale", "product", "point_of_sale"]]]],
             {"fields": ["name", "state", "latest_version"]}):
    print(f"  {m['name']:16s} {m['state']}")

try:
    sayfa = oku("search_count", "website.page", [[]])
    print("  website.page kaydı:", sayfa)
except Exception as e:
    print("  website.page okunamadı:", str(e)[:80])

print("\nHiçbir kayıt değiştirilmedi.")
