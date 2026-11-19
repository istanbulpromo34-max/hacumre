#!/usr/bin/env python3
"""Higgsfield'da üretilen stüdyo karelerini siteye ve Odoo'ya indirir.

Claude, gelen/ klasöründeki ham kareleri Higgsfield'a gönderip sonuç
adreslerini gelen/higgs.json dosyasına yazar. Bu betik o adresleri indirir,
2048x2048 krem zeminli webp'ye çevirir, Odoo ürün kartına işler, ham kareyi
ve kuyruğu temizler.

gelen/higgs.json biçimi:
  [{"id": "arac-kokusu", "url": "https://..."}]

GitHub Actions koşucusunun ağı açık olduğu için indirme burada yapılır;
Claude'un çalıştığı ortam bu adreslere erişemez.
"""
import io
import json
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image                                   # noqa: E402
from foto_temizle import GELEN, CIKTI, beyaza_otur, odooya_yaz   # noqa: E402

KUYRUK = GELEN / "higgs.json"
UZANTILAR = (".jpg", ".jpeg", ".png", ".webp", ".heic")


def indir(url: str) -> bytes:
    istek = urllib.request.Request(url, headers={"User-Agent": "istanbul-hac-umre/1.0"})
    with urllib.request.urlopen(istek, timeout=120) as y:
        return y.read()


def main():
    if not KUYRUK.exists():
        print("gelen/higgs.json yok, yapılacak iş bulunamadı.")
        return
    try:
        isler = json.loads(KUYRUK.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError as e:
        sys.exit(f"gelen/higgs.json okunamadı: {e}")
    if not isler:
        print("Kuyruk boş.")
        return

    liste = {}
    yol = Path("docs/data/urunler.json")
    if yol.exists():
        liste = {u["id"]: u for u in json.loads(yol.read_text(encoding="utf-8"))["urunler"]}

    CIKTI.mkdir(parents=True, exist_ok=True)
    odoo_esleme, basarili, hatali, kalan = {}, [], [], []

    print(f"{len(isler)} kare indirilecek.")
    for is_ in isler:
        urun_id, url = (is_ or {}).get("id"), (is_ or {}).get("url")
        if not urun_id or not url:
            hatali.append(f"{is_}: eksik kayıt")
            continue
        try:
            im = Image.open(io.BytesIO(indir(url)))
            # Higgsfield çıktısı zaten kare ve zeminli; yeniden çerçevelemiyoruz.
            son = beyaza_otur(im.convert("RGBA"), kesilmis=False)
            son.save(CIKTI / f"{urun_id}.webp", "WEBP", quality=88, method=6)
            basarili.append(urun_id)
            print(f"  ✓ {urun_id}")
            oid = liste.get(urun_id, {}).get("odooId")
            if oid:
                odoo_esleme[oid] = son
            # işlenen ürünün ham karesi artık kuyrukta durmasın
            for uz in UZANTILAR:
                ham = GELEN / f"{urun_id}{uz}"
                if ham.exists():
                    ham.unlink()
        except Exception as e:                    # tek kare bütün işi durdurmasın
            hatali.append(f"{urun_id}: {e}")
            kalan.append(is_)
            print(f"  ✗ {urun_id}: {e}")

    odooya_yaz(odoo_esleme)
    # Başarılı olanlar kuyruktan düşer, hata alanlar bir sonraki tura kalır.
    KUYRUK.write_text(json.dumps(kalan, ensure_ascii=False), encoding="utf-8")

    print(f"\nBiten: {len(basarili)} | Hatalı: {len(hatali)}")
    for h in hatali:
        print("  -", h)
    if not basarili and hatali:
        sys.exit(1)


if __name__ == "__main__":
    main()
