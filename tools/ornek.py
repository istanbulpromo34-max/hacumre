#!/usr/bin/env python3
# Katalogdan rastgele kapak görselleri indirip tek bir kontak sayfası üretir.
# Amaç: görsellerin kaç tanesinde kaynak filigranı olduğunu gözle saymak.
import json, io, random, sys, urllib.request, concurrent.futures as cf
from PIL import Image, ImageDraw

N = int(sys.argv[1]) if len(sys.argv) > 1 else 64
SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 7
CELL, COLS = 230, 8

d = json.load(open('docs/data/products.json'))
ps = [p for p in d['products'] if p.get('cover')]
random.seed(SEED)
sample = random.sample(ps, min(N, len(ps)))

def get(p):
    try:
        req = urllib.request.Request(p['cover'], headers={'User-Agent': 'katalog-kontrol/1.0'})
        with urllib.request.urlopen(req, timeout=25) as r:
            im = Image.open(io.BytesIO(r.read())).convert('RGB')
        im.thumbnail((CELL - 8, CELL - 8))
        return p['code'], im
    except Exception as e:
        return p['code'], None

with cf.ThreadPoolExecutor(8) as ex:
    out = list(ex.map(get, sample))

rows = (len(out) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * CELL, rows * CELL), (18, 22, 32))
dr = ImageDraw.Draw(sheet)
ok = 0
for i, (code, im) in enumerate(out):
    x, y = (i % COLS) * CELL, (i // COLS) * CELL
    if im is None:
        dr.rectangle([x + 4, y + 4, x + CELL - 4, y + CELL - 4], outline=(190, 60, 60))
        dr.text((x + 10, y + 10), code + '\nINDIRILEMEDI', fill=(230, 160, 160))
        continue
    ok += 1
    sheet.paste(im, (x + (CELL - im.width) // 2, y + (CELL - im.height) // 2))
    dr.text((x + 6, y + CELL - 14), str(i + 1), fill=(240, 210, 140))
sheet.save('docs/_ornek.jpg', quality=72)
print('indirilen:', ok, '/', len(out), '| sayfa:', sheet.size)
