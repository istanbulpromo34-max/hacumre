#!/usr/bin/env python3
"""Ürün ve bölüm görsellerinin telefon boyutundaki kopyalarını üretir.

docs/assets/u ve docs/assets/g içindeki her görselin iki küçük kopyası üretilir:
  m/ → en uzun kenar 400 piksel (telefon ızgarası; kart genişliği ~170 piksel)
  k/ → en uzun kenar 700 piksel (masaüstü ızgarası ve yüksek yoğunluklu ekran)
Site kartlarda srcset ile bu ikisinden uygun olanı iner; büyütme penceresinde
tam boy görsel açılır. Böylece telefonda ızgara dörtte bir ağırlıkta yüklenir.

Kaynak dosya küçük kopyadan yeniyse kopya yeniden üretilir, değilse atlanır.
Fotoğraf akışlarında (higgs.yml, foto.yml) depoya yazmadan hemen önce çalışır.
"""
import os
import sys
from PIL import Image

BOYLAR = (('k', 700, 70), ('m', 400, 66))
UZANTILAR = ('.webp', '.jpg', '.jpeg', '.png')


def klasor_isle(src: str) -> tuple[int, int]:
    if not os.path.isdir(src):
        return 0, 0
    for alt, _, _ in BOYLAR:
        os.makedirs(os.path.join(src, alt), exist_ok=True)
    uretilen = atlanan = 0
    for ad in sorted(os.listdir(src)):
        yol = os.path.join(src, ad)
        if not os.path.isfile(yol) or not ad.lower().endswith(UZANTILAR):
            continue
        kaynak = None
        for alt, enbuyuk, kalite in BOYLAR:
            hedef = os.path.join(src, alt, os.path.splitext(ad)[0] + '.webp')
            if os.path.exists(hedef) and os.path.getmtime(hedef) >= os.path.getmtime(yol):
                atlanan += 1
                continue
            try:
                if kaynak is None:
                    kaynak = Image.open(yol)
                    if kaynak.mode in ('P', 'RGBA', 'LA'):
                        kaynak = kaynak.convert('RGB')
                im = kaynak
                g, y = im.size
                if max(g, y) > enbuyuk:
                    o = enbuyuk / max(g, y)
                    im = im.resize((max(1, round(g * o)), max(1, round(y * o))), Image.LANCZOS)
                im.save(hedef, 'WEBP', quality=kalite, method=4)
                uretilen += 1
            except Exception as hata:  # tek bir bozuk kare akışı durdurmasın
                print(f'atlandi (okunamadi): {ad} — {hata}', file=sys.stderr)
    return uretilen, atlanan


def main() -> None:
    kok = sys.argv[1] if len(sys.argv) > 1 else 'docs'
    toplam_u = toplam_a = 0
    for alt in ('assets/u', 'assets/g'):
        u, a = klasor_isle(os.path.join(kok, alt))
        toplam_u += u
        toplam_a += a
    print(f'kucuk gorsel: {toplam_u} uretildi, {toplam_a} guncel')


if __name__ == '__main__':
    main()
