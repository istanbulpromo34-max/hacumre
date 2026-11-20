#!/usr/bin/env python3
"""gelen/gorsel.json'daki adreslerden site görsellerini indirir.

Kuyruk biçimi:

    [{"url": "https://…/kare.png", "hedef": "docs/assets/g/kat1.jpg"}]

Her kare indirilip hedefin uzantısına göre JPEG, yanına da aynı adla WebP
olarak yazılır; en uzun kenar 1600 piksele indirilir. İş bitince kuyruk
boşaltılır. Koşucunun ağı açık olduğu için indirme orada yapılır.
"""
import json
import os
import pathlib
import sys
import urllib.request
from io import BytesIO

from PIL import Image

MAX = 1600
KUYRUK = pathlib.Path('gelen/gorsel.json')


def indir(url: str) -> bytes:
    istek = urllib.request.Request(url, headers={'User-Agent': 'istanbulhacumre-site'})
    with urllib.request.urlopen(istek, timeout=120) as y:
        return y.read()


def main() -> None:
    if not KUYRUK.exists():
        print('kuyruk yok')
        return
    kuyruk = json.loads(KUYRUK.read_text(encoding='utf-8') or '[]')
    if not kuyruk:
        print('kuyruk bos')
        return

    yazilan = 0
    for kare in kuyruk:
        url, hedef = kare.get('url'), kare.get('hedef')
        if not url or not hedef:
            print(f'eksik kayit atlandi: {kare}', file=sys.stderr)
            continue
        try:
            ham = indir(url)
            im = Image.open(BytesIO(ham))
            if im.mode in ('P', 'RGBA', 'LA'):
                im = im.convert('RGB')
            g, y = im.size
            if max(g, y) > MAX:
                o = MAX / max(g, y)
                im = im.resize((round(g * o), round(y * o)), Image.LANCZOS)
            yol = pathlib.Path(hedef)
            yol.parent.mkdir(parents=True, exist_ok=True)
            im.save(yol.with_suffix('.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)
            im.save(yol.with_suffix('.webp'), 'WEBP', quality=82, method=5)
            yazilan += 1
            print(f'yazildi: {yol.with_suffix(".jpg")} ve .webp  ({im.size[0]}x{im.size[1]})')
        except Exception as hata:
            print(f'HATA {hedef}: {hata}', file=sys.stderr)

    KUYRUK.write_text('[]\n', encoding='utf-8')
    print(f'toplam {yazilan} gorsel yazildi, kuyruk bosaltildi')


if __name__ == '__main__':
    main()
