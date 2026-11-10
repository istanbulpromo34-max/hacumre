// Tek ayar dosyası.
//
// Kaynak adresi ve marka izleri açık metin olarak tutulmaz; depo gizli
// olmadığı için kodlanmış biçimde durur. Depoya SRC_ORIGIN / SRC_BRANDS
// sırları eklenirse onlar kullanılır.

const dec = (s) => Buffer.from(s, 'base64').toString('utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');

const ORIGIN = (process.env.SRC_ORIGIN || dec('aHR0cHM6Ly9hc2l5YW5zYW5hdC5jb20=')).replace(/\/$/, '');
const BRANDS = (process.env.SRC_BRANDS || dec('YcWfaXlhbiBzYW5hdCxhc2l5YW4gc2FuYXQsYcWfaXlhbixhc2l5YW4=')).split(',').map((s) => s.trim()).filter(Boolean);

export const SOURCE = {
  origin: ORIGIN,
  sitemap: ORIGIN + '/sitemap.xml',
  // sitemap.xml içinden yalnız ürün haritalarını al
  productSitemap: /products?\.xml$/i,
};

/** Metinlerden silinecek kaynak marka izleri. */
export const BRAND_STRIP = BRANDS.map((t) => new RegExp(esc(t), 'gi'));

/** Marka adı geçen adresleri tümden siler. */
export const BRAND_URL_RE = new RegExp(
  'https?:\\/\\/[^\\s"\'<>]*(?:' + BRANDS.map(esc).join('|') + ')[^\\s"\'<>]*', 'gi'
);

/** Görsel adresleri (ortak CDN; boyutlar piksel genişliği). */
export const IMAGE = {
  base: 'https://cdn.myikas.com/images',
  thumb: 540,
  full: 1080,
};

/** Kendi ürün kodu öneki. */
export const CODE_PREFIX = 'IHT-';

/** Sipariş hattı. */
export const WHATSAPP = '905551044040';

/** Mağaza bilgileri (katalog sayfasının üstü/altı). */
export const SHOP = {
  name: 'İstanbul Hac Umre Hediyelik',
  phoneLabel: '0555 104 40 40',
};

/** Tarama ayarları: kaynağı yormamak için ölçülü. */
export const CRAWL = {
  concurrency: 4,
  delayMs: 250,
  timeoutMs: 20000,
  retries: 3,
  userAgent: 'IstanbulHacUmreKatalog/1.0 (+katalog senkronu; anlasmali bayi)',
};
