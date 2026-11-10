// Tek ürünün fiyatını anlık doğrular. Katalog listesi 6 saatlik dosyadan gelir;
// kullanıcı bir ürünü açtığında bu uç nokta o ürünün güncel fiyatını getirir.
// Vercel: /api/price?slug=urun-adresi

import * as cheerio from 'cheerio';
import { SOURCE, CRAWL } from '../config.mjs';
import { parseProduct } from '../lib/parse.mjs';

const cache = new Map(); // slug -> { at, price, inStock }
const TTL = 10 * 60 * 1000;

export default async function handler(req, res) {
  const slug = String((req.query && req.query.slug) || '').replace(/[^a-z0-9\-_/]/gi, '');
  if (!slug) return res.status(400).json({ error: 'slug gerekli' });

  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL) {
    res.setHeader('cache-control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({ ...hit, cached: true });
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), CRAWL.timeoutMs);
    const r = await fetch(`${SOURCE.origin}/${slug}`, {
      signal: ctrl.signal,
      headers: { 'user-agent': CRAWL.userAgent },
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const p = parseProduct(await r.text(), `${SOURCE.origin}/${slug}`);
    if (!p) throw new Error('ayrıştırılamadı');

    const out = { at: Date.now(), price: p.price, inStock: p.inStock, variants: p.variants };
    cache.set(slug, out);
    res.setHeader('cache-control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    // Canlı doğrulama başarısızsa katalogdaki fiyat geçerli kalsın.
    return res.status(200).json({ price: null, error: String(err.message || err) });
  }
}
