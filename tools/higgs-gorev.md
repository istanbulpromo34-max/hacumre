# Zamanlı görev: bekleyen ürün fotoğraflarını Higgsfield'dan geçir

İstanbul Hac Umre Hediyelik'in ürün kataloğu için. Mağazadaki arkadaş
`/admin` ekranından ürün fotoğrafı çekiyor; ham kare
`istanbulpromo34-max/hacumre` deposunda `gelen/` klasörüne düşüyor. Bu görev
o kareleri Higgsfield'da stüdyo fotoğrafına çevirip sonucu kuyruğa yazar;
gerisini `higgs.yml` iş akışı kendiliğinden halleder (indirir, 2048×2048 krem
zeminli webp yapar, siteye koyar, Odoo ürün kartına yazar, ham kareyi siler).

Depo herkese açık, dal `main`. Depoyu klonlamaya gerek yok.

## Adımlar

**1. Bekleyenleri listele.**

```
curl -sS https://raw.githubusercontent.com/istanbulpromo34-max/hacumre/main/tools/higgs_bekleyen.py -o /tmp/hb.py && python3 -I /tmp/hb.py
```

Her satır bir JSON nesnesi: `{"id", "ad", "url"}`. Hiç satır yoksa yapacak iş
yok — kısaca "kuyruk boş" de ve bitir. Hiçbir şey yazma, hiç kredi harcama.

**2. Kaç kare işleyeceğine karar ver.** Bir turda en çok **12** kare al
(`jobs_wait` sınırı). Daha fazlası varsa kalanı bir sonraki tura bırak.

**3. Krediyi kontrol et.** `mcp__Higgsfield__balance`. Kare başına 0,25 kredi.
Bakiye işleyeceğin kare sayısının iki katından azsa yalnızca bakiyenin
yarısı kadar kare işle ve sonunda kullanıcıya kredinin azaldığını bildir.
Bakiye 5 kredinin altındaysa hiç işlem yapma, durumu bildir.

**4. Her kare için sırayla:**

- `mcp__Higgsfield__media_import_url` → `url` alanındaki adresi ver,
  `type: "image"`. Dönen `media_id`'yi al.
- `mcp__Higgsfield__generate_image` → şu parametrelerle:
  - `model`: `gpt_image_2_6`
  - `aspect_ratio`: `1:1`
  - `count`: 1
  - `medias`: `[{"value": "<media_id>", "role": "image_references"}]`
  - `use_unlim`: `false` (kredi ile; sorulmasını bekleme)
  - `prompt`: aşağıdaki **stüdyo istemi** + ürünün `ad` alanı
  - `context`: "Mağaza ürün kataloğu için stüdyo fotoğrafı üretimi"

**5. Sonuçları bekle.** `mcp__Higgsfield__jobs_wait` ile hepsini birlikte
(en çok 12). `completed` olanların `result_url` adreslerini topla.
Başarısız olanları atla, bir sonraki tur yeniden dener.

**6. Kuyruğa yaz.**

```
curl -sS https://raw.githubusercontent.com/istanbulpromo34-max/hacumre/main/tools/higgs_yaz.py -o /tmp/hy.py
echo '[{"id":"<urun-id>","url":"<result_url>"}, ...]' | python3 -I /tmp/hy.py
```

Bu dosyaya yazılır yazılmaz `higgs.yml` çalışır. İş akışını beklemene gerek
yok ama istersen `gh run list --limit 3` ile bakabilirsin.

**7. Kısaca bildir:** kaç kare işlendi, kaçı başarısız, kaç kare kuyrukta
kaldı, kalan kredi. Uzun anlatma.

## Stüdyo istemi

Aşağıdaki metnin tamamını kullan, sonuna ürünün adını ekle. Metni değiştirme;
özellikle ürün üzerindeki logo ve yazıların korunmasını isteyen bölüm önemli.

```
Reshoot this exact product as a professional catalogue studio photograph. CRITICAL: the product itself must stay identical to the source — same shape, proportions, colour, material, surface and pattern. Every logo, brand mark, label, sticker, barcode, printed text and calligraphy that is ON the product must stay exactly where it is, with the same wording, lettering, size and placement — never remove, hide, blur, clean away, re-letter, translate or replace them, and never invent new ones. Do not redesign, restyle, beautify, add or remove any part of the product, and do not change its angle. Only the background, the lighting and the image quality may change. Place the product centred on a seamless soft cream backdrop, warm off-white close to #EFE7D8, with a barely perceptible fine woven fabric texture that reads as a calm background rather than as a piece of cloth. Lighting: one large soft key light from the upper left, gentle fill from the right, and a soft natural contact shadow directly under the product; no harsh highlights, no colour cast. Rendering: tack-sharp focus across the whole product, crisp clean edges, true-to-life colour, high micro-detail, the look of a manufacturer's catalogue render. Framing: square, the product fully inside the frame with even margins, filling about 82 percent of it, so a viewer understands at a glance what the product is and what it is made of. Do not add anything that is not in the source photo: no props, no hands, no people, no second object, no border, and no caption, label, watermark or graphic laid over the picture — this applies only to new additions, never to the markings already printed on the product. Product:
```

## Sınırlar

- Yalnızca yukarıdaki adımları yap. Depoda başka hiçbir dosyayı değiştirme,
  başka iş akışı tetikleme, site üzerinde düzenleme yapma.
- Kuyruk boşsa hiç kredi harcama.
- Bir karede iki kez üretim yapma; `higgs_bekleyen.py` zaten bitmişleri ve
  kuyrukta olanları eler.
- Ham karelerin silinmesi `higgs.yml`in işi; sen silme.
