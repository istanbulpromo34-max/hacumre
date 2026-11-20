#!/usr/bin/env python3
"""Ürün ve bölüm görsellerinin telefon boyutundaki kopyalarını üretir.

docs/assets/u ve docs/assets/g içindeki her görselin en uzun kenarı 700 piksele
indirilmiş WebP kopyası aynı klasörün k/ alt klasörüne yazılır. Site kartlarda
bu küçük kopyayı kullanır; büyütme penceresinde tam boy görsel açılır.

Kaynak dosya küçük kopyadan yeniyse kopya yeniden üretilir, değilse atlanır.
Fotoğraf akışlarında (higgs.yml, foto.yml) depoya yazmadan hemen önce çalışır.
"""
import os
import sys
from PIL import Image

MAX = 700
KALITE = 70
UZANTILAR = ('.webp', '.jpg', '.jpeg', '.png')


def klasor_isle(src: str) -> tuple[int, int]:
    if not os.path.isdir(src):
        return 0, 0
    dst = os.path.join(src, 'k')
    os.makedirs(dst, exist_ok=True)
    uretilen = atlanan = 0
    for ad in sorted(os.listdir(src)):
        yol = os.path.join(src, ad)
        if not os.path.isfile(yol) or not ad.lower().endswith(UZANTILAR):
            continue
        hedef = os.path.join(dst, os.path.splitext(ad)[0] + '.webp')
        if os.path.exists(hedef) and os.path.getmtime(hedef) >= os.path.getmtime(yol):
            atlanan += 1
            continue
        try:
            im = Image.open(yol)
            if im.mode in ('P', 'RGBA', 'LA'):
                im = im.convert('RGB')
            g, y = im.size
            if max(g, y) > MAX:
                o = MAX / max(g, y)
                im = im.resize((max(1, round(g * o)), max(1, round(y * o))), Image.LANCZOS)
            im.save(hedef, 'WEBP', quality=KALITE, method=4)
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
