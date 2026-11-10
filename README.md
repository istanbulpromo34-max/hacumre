# Hat Tabloları Kataloğu

Tedarikçinin ürünlerini kendi sitenizde, kendi markanızla sergileyen katalog.
Sepet ve ödeme yok; sipariş yalnızca WhatsApp üzerinden ilerler.

## Nasıl çalışıyor

```
sitemap.xml  →  products.xml  →  her ürün sayfası
                                       ↓
                        __NEXT_DATA__ (JSON)  ya da  HTML
                                       ↓
                       docs/data/products.json  +  categories.json
                                       ↓
                       public/index.html  (katalog sayfası)
```

Ürün sayfalarında ad, fiyat (KDV dahil), **Ürün Kodu**, açıklama, ölçü varyantları ve
fotoğraflar açık şekilde duruyor. Senkron bunları alır, kaynak marka izlerini temizler,
kendi kodunuzu (`IHT-` öneki) üretir ve tek bir JSON dosyası yazar.

## Kurulum

```bash
npm install
node sync.mjs --limit 30      # önce 30 ürünle deneyin
node sync.mjs                 # tam tarama (~2.500 ürün, 15–25 dk)
```

Sonuç: `docs/data/products.json` ve `docs/data/categories.json`.
Ayrıştırılamayan sayfalar `docs/data/failed.json` dosyasına yazılır.

Yerelde görmek için:

```bash
npx serve public      # ya da herhangi bir statik sunucu
```

## Yayına alma (Vercel)

1. Bu klasörü bir GitHub deposuna koyun.
2. Vercel'de depoyu içe aktarın. Ayar gerekmez; `public/` statik olarak,
   `api/` ise sunucusuz fonksiyon olarak yayınlanır.
3. Katalog `/` ve `/hat-tablolari` adreslerinde açılır.

### Fiyatlar nasıl güncel kalıyor

İki katmanlı:

- **Liste**: `.github/workflows/sync.yml` altı saatte bir taramayı çalıştırır,
  değişiklik varsa `docs/data` klasörünü depoya yazar; Vercel kendiliğinden yayına alır.
- **Detay**: Kullanıcı bir eseri açtığında `/api/price?slug=…` o tek ürünün fiyatını
  kaynaktan canlı doğrular (10 dk önbellekli). Böylece liste hızlı kalır, açılan ürünün
  fiyatı anlık olur. Doğrulama başarısız olursa katalogdaki fiyat gösterilmeye devam eder.

Her istekte 2.500 ürünü canlı çekmek ne hızlı ne de kaynağa karşı nazik olurdu;
bu ikili yapı ikisini birden çözüyor.

## Marka temizliği

`config.mjs` içindeki `BRAND_STRIP` listesi, ürün adı ve açıklamalarından kaynak
markanın adını siler. Ayrıca:

- Kaynak URL'ler hiçbir çıktıda yer almaz (`_source` alanı yayına yazılmadan düşürülür).
- Ürün kodları `IHT-` önekiyle kendi kodunuza çevrilir.
- Görseller CDN'den gelir ve `referrerpolicy="no-referrer"` ile servis edilir.
  Görselleri tamamen kendi alan adınızdan vermek isterseniz basit bir `/api/img`
  proxy'si eklenebilir.

## Dosyalar

| Dosya | İşi |
|---|---|
| `config.mjs` | Kaynak adresi, kod öneki, WhatsApp numarası, tarama hızı |
| `sync.mjs` | Tarayıcı: site haritası → ürünler → JSON |
| `lib/parse.mjs` | Ürün sayfasını okuyup normalize eden kısım |
| `api/price.js` | Tek ürün için canlı fiyat doğrulama |
| `public/index.html` | Katalog sayfası |
| `docs/data/*.json` | Üretilen veri (şu an örnek veriyle dolu) |
| `.github/workflows/sync.yml` | Altı saatlik otomatik tazeleme |

## Ayar noktaları

- **Tarama hızı**: `config.mjs` → `CRAWL.concurrency` (4) ve `delayMs` (250 ms).
  Kaynağı yormamak için ölçülü tutuldu; yavaş gelirse eş zamanlılığı 6'ya çıkarabilirsiniz.
- **Sayfa başına eser**: `public/index.html` içinde `PAGE = 24`.
- **WhatsApp numarası**: `config.mjs` → `WHATSAPP` ve sayfadaki `WA` değişkeni.

## Not

Kaynak sitenin HTML yapısı değişirse `lib/parse.mjs` içindeki HTML yedek okuyucusu
güncellenmelidir. `__NEXT_DATA__` yolu çalıştığı sürece bu gerekmez; senkron çıktısında
kaç ürünün JSON'dan, kaçının HTML'den okunduğu raporlanır.
