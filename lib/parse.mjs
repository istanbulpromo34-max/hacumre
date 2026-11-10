// Ürün sayfasını okunabilir bir nesneye çevirir.
// Kaynak, Next.js tabanlı bir mağaza altyapısı kullanıyor: veriler sayfaya
// __NEXT_DATA__ içinde gömülü geliyor (props.pageProps.pageSpecificData).

import * as cheerio from 'cheerio';
import { SOURCE, BRAND_STRIP, BRAND_URL_RE, CODE_PREFIX, IMAGE } from '../config.mjs';

/** Kaynak markaya ait izleri metinden temizler. */
export function scrub(text = '') {
  let out = String(text);
  for (const re of BRAND_STRIP) out = out.replace(re, '');
  return out
    .replace(BRAND_URL_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "₺ 12.740,00" / 500 gibi değerleri sayıya çevirir. */
export function parsePrice(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null;
  const s = String(raw).replace(/[^\d.,]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
  const norm = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  const n = Number.parseFloat(norm);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Kendi ürün kodumuz. */
export function ownCode(sourceCode, slug) {
  const base = (sourceCode || slug || '').toString().trim().toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
  return CODE_PREFIX + (base || 'X' + Math.random().toString(36).slice(2, 8).toUpperCase());
}

function stripHtml(html = '') {
  if (!html) return '';
  const $ = cheerio.load(`<div>${html}</div>`);
  $('script,style').remove();
  $('br,p,li,div,h1,h2,h3,tr').after('\n');
  return $.root().text().replace(/ /g, ' ');
}

/* Görsel adresleri: .../images/<magaza>/<gorsel>/image_<boy>.jpg
   Mağaza kimliği sayfadaki og:image'den okunur, elde kalırsa yeniden kullanılır. */
let imgSpace = null;
function readImgSpace($) {
  const og = $('meta[property="og:image"]').attr('content') || '';
  const m = og.match(/\/images\/([0-9a-f-]{36})\//i);
  if (m) imgSpace = m[1];
  return imgSpace;
}
function imgUrl(id, size) {
  if (!id || !imgSpace) return null;
  return `${IMAGE.base}/${imgSpace}/${id}/image_${size}.jpg`;
}

function fromNextData($) {
  const raw = $('#__NEXT_DATA__').contents().text();
  if (!raw) return null;
  let json;
  try { json = JSON.parse(raw); } catch { return null; }
  const p = json?.props?.pageProps?.pageSpecificData;
  if (!p || typeof p.name !== 'string' || !p.name.trim()) return null;
  readImgSpace($);

  const live = (p.variants || []).filter((v) => v && v.deleted !== true && v.isActive !== false);
  const vs = live.length ? live : (p.variants || []);

  const variants = vs.map((v) => ({
    name: scrub((v.variantValues || []).map((x) => x && x.name).filter(Boolean).join(' / ')),
    price: parsePrice(v.prices?.[0]?.sellPrice),
    sku: v.sku || null,
    stock: (v.stocks || []).reduce((a, s) => a + (s?.stockCount || 0), 0),
  })).filter((v) => v.name || v.price);

  // görseller: ana varyantın görselleri önce, sonra diğerleri
  const seen = new Set();
  const ids = [];
  const collect = (list) => (list || [])
    .filter((im) => im && !im.isVideo && im.imageId)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((im) => { if (!seen.has(im.imageId)) { seen.add(im.imageId); ids.push(im.imageId); } });
  const mainFirst = vs.slice().sort((a, b) => Number(!!(b.images || []).some((i) => i.isMain)) - Number(!!(a.images || []).some((i) => i.isMain)));
  mainFirst.forEach((v) => collect(v.images));

  const prices = variants.map((v) => v.price).filter((n) => n);
  const price = prices.length ? Math.min.apply(null, prices) : null;
  const priceMax = prices.length ? Math.max.apply(null, prices) : null;

  const attrs = (p.attributes || []).map((a) => ({
    k: scrub(a?.productAttribute?.name || ''),
    v: scrub(a?.productAttributeOption?.name || (a?.value == null ? '' : String(a.value))),
  })).filter((a) => a.k && a.v);

  return {
    name: scrub(p.name),
    sourceCode: (vs[0] && vs[0].sku) || null,
    price,
    priceMax: priceMax && priceMax > (price || 0) ? priceMax : null,
    description: scrub(stripHtml(p.description || '')),
    imageIds: ids.slice(0, 8),
    variants,
    attrs,
    category: scrub(p.categories?.[0]?.name || ''),
    categoryPath: scrub((p.categories?.[0]?.categoryPath || [])[0] || ''),
    rating: typeof p.averageRating === 'number' && p.reviewCount ? p.averageRating : null,
    reviewCount: p.reviewCount || 0,
    inStock: vs.some((v) => v.sellIfOutOfStock === true || (v.stocks || []).some((s) => (s?.stockCount || 0) > 0)),
    _via: 'next-data',
  };
}

/* Sayfa yapısı değişirse diye yedek yol: doğrudan HTML'den oku. */
function fromHtml($) {
  const name = scrub($('h1').first().text() || $('meta[property="og:title"]').attr('content') || '');
  if (!name) return null;
  readImgSpace($);
  const body = $('body').text();
  const codeM = body.match(/(?:Ürün\s*Kodu|Stok\s*Kodu|SKU)\s*[:\-–]?\s*([A-Za-z0-9][A-Za-z0-9._\-/]{1,30})/i);
  const found = [...body.matchAll(/₺\s*([\d.,]+)|([\d.,]+)\s*(?:TL|₺)/gi)].map((m) => parsePrice(m[1] || m[2])).filter((n) => n && n > 20);
  const og = $('meta[property="og:image"]').attr('content') || '';
  const idM = og.match(/\/images\/[0-9a-f-]{36}\/([0-9a-f-]{36})\//i);
  return {
    name,
    sourceCode: codeM ? codeM[1] : null,
    price: found.length ? Math.min.apply(null, found) : null,
    priceMax: null,
    description: scrub($('meta[name="description"]').attr('content') || ''),
    imageIds: idM ? [idM[1]] : [],
    variants: [],
    attrs: [],
    category: '',
    categoryPath: '',
    rating: null,
    reviewCount: 0,
    inStock: !/tükendi|stokta yok/i.test(body),
    _via: 'html',
  };
}

/** Ürün sayfası HTML'ini yayına hazır ürüne çevirir. */
export function parseProduct(html, url) {
  const $ = cheerio.load(html);
  const slug = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  const p = fromNextData($) || fromHtml($);
  if (!p || !p.name) return null;

  const images = p.imageIds.map((id) => imgUrl(id, IMAGE.full)).filter(Boolean);
  const thumbs = p.imageIds.map((id) => imgUrl(id, IMAGE.thumb)).filter(Boolean);

  return {
    code: ownCode(p.sourceCode, slug),
    name: p.name,
    price: p.price,
    priceMax: p.priceMax,
    currency: 'TRY',
    description: p.description || '',
    images,
    cover: thumbs[0] || images[0] || null,
    thumbs,
    variants: p.variants || [],
    attrs: p.attrs || [],
    category: p.category || '',
    group: p.categoryPath || '',
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock !== false,
    slug,
    updatedAt: new Date().toISOString(),
    _via: p._via,
    _source: SOURCE.origin + '/' + slug,
  };
}
