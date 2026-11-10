#!/usr/bin/env node
// Katalog senkronu: site haritasından ürün URL'lerini alır, her ürünü okur,
// public/data/products.json ve categories.json dosyalarını üretir.
//
// Kullanım:
//   npm install
//   node sync.mjs                 # tam tarama
//   node sync.mjs --limit 30      # deneme için ilk 30 ürün
//   node sync.mjs --only PLX-2002 # tek ürünü tazele

import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { SOURCE, CRAWL } from './config.mjs';
import { parseProduct } from './lib/parse.mjs';

const OUT_DIR = path.join(process.cwd(), 'docs', 'data');
const DETAIL_DIR = path.join(OUT_DIR, 'detay');
const SHARDS = 24;
function shardOf(code){
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return h % SHARDS;
}
const PRODUCTS = path.join(OUT_DIR, 'products.json');
const CATEGORIES = path.join(OUT_DIR, 'categories.json');

const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const LIMIT = Number(argVal('--limit')) || 0;
const ONLY = argVal('--only');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, attempt = 1) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CRAWL.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': CRAWL.userAgent, accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } catch (err) {
    if (attempt < CRAWL.retries) {
      await sleep(600 * attempt * attempt);
      return fetchText(url, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function locs(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('loc').map((_, el) => $(el).text().trim()).get().filter(Boolean);
}

async function productUrls() {
  const index = await fetchText(SOURCE.sitemap);
  if (!index) throw new Error('sitemap.xml okunamadı');
  const children = locs(index);
  const productMaps = children.filter((u) => SOURCE.productSitemap.test(u));
  const maps = productMaps.length ? productMaps : children;

  const urls = new Set();
  for (const m of maps) {
    const xml = await fetchText(m);
    if (!xml) continue;
    for (const u of locs(xml)) urls.add(u.split('?')[0]);
    await sleep(CRAWL.delayMs);
  }
  return [...urls];
}

async function pool(items, worker, size) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await worker(items[idx], idx); }
      catch (err) { out[idx] = { __error: String(err && err.message || err), url: items[idx] }; }
      await sleep(CRAWL.delayMs);
    }
  }));
  return out;
}

async function readPrevious() {
  try {
    const list = JSON.parse(await fs.readFile(PRODUCTS, 'utf8'));
    const out = [];
    for (let i = 0; i < SHARDS; i++) {
      let m = {};
      try { m = JSON.parse(await fs.readFile(path.join(DETAIL_DIR, String(i).padStart(2, '0') + '.json'), 'utf8')); } catch {}
      for (const p of list.products || []) if (m[p.code]) out.push(Object.assign({}, p, m[p.code]));
    }
    return { products: out };
  } catch { return { products: [] }; }
}

function progress(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  process.stdout.write(`\r${label} ${done}/${total} (%${pct})   `);
}

async function main() {
  const started = Date.now();
  const prev = await readPrevious();
  const prevByUrl = new Map(prev.products.map((p) => [p.slug, p]));

  console.log('Site haritası okunuyor…');
  let urls = await productUrls();
  console.log(`${urls.length} ürün sayfası bulundu.`);

  if (ONLY) urls = urls.filter((u) => u.toLowerCase().includes(ONLY.toLowerCase()));
  if (LIMIT) urls = urls.slice(0, LIMIT);

  let done = 0;
  const results = await pool(urls, async (url) => {
    const html = await fetchText(url);
    done++; progress(done, urls.length, 'Ürünler');
    if (!html) return null;
    return parseProduct(html, url);
  }, CRAWL.concurrency);

  process.stdout.write('\n');

  const products = [];
  const failed = [];
  for (let k = 0; k < results.length; k++) {
    const r = results[k];
    if (r && !r.__error && r.name) { products.push(r); continue; }
    const fslug = urls[k].replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
    failed.push({ slug: fslug, reason: String(r?.__error || 'ayrıştırılamadı').slice(0, 120) });
    // Başarısız olanda eski kaydı koru ki katalogda boşluk oluşmasın.
    const old = prevByUrl.get(fslug);
    if (old) products.push(old);
  }

  // Kategorileri ürünlerden çıkar
  const catMap = new Map();
  for (const p of products) {
    const c = p.category || 'Diğer';
    catMap.set(c, (catMap.get(c) || 0) + 1);
  }
  const categories = [...catMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Yayına çıkacak sürümde dahilî alanları at
  const publicProducts = products.map(({ _source, _via, ...rest }) => rest);

  // Liste hafif tutulur; ayrıntılar kod bazlı parçalara yazılır ki
  // sayfa açılışında 10 MB'lık dosya indirilmesin.
  const light = publicProducts.map((p) => ({
    code: p.code, name: p.name, price: p.price, priceMax: p.priceMax,
    currency: p.currency, cover: p.cover, category: p.category, inStock: p.inStock,
  }));
  const shards = Array.from({ length: SHARDS }, () => ({}));
  for (const p of publicProducts) {
    shards[shardOf(p.code)][p.code] = {
      description: p.description, images: p.images, thumbs: p.thumbs,
      variants: p.variants, attrs: p.attrs, rating: p.rating,
      reviewCount: p.reviewCount, group: p.group, slug: p.slug, updatedAt: p.updatedAt,
    };
  }

  await fs.mkdir(DETAIL_DIR, { recursive: true });
  await fs.writeFile(PRODUCTS, JSON.stringify({
    updatedAt: new Date().toISOString(),
    count: light.length,
    partial: Boolean(LIMIT || ONLY),
    shards: SHARDS,
    products: light,
  }, null, 0));
  await fs.writeFile(CATEGORIES, JSON.stringify({ categories }, null, 0));
  for (let i = 0; i < SHARDS; i++) {
    await fs.writeFile(path.join(DETAIL_DIR, String(i).padStart(2, '0') + '.json'), JSON.stringify(shards[i], null, 0));
  }

  const viaNext = products.filter((p) => p._via === 'next-data').length;
  const noPrice = publicProducts.filter((p) => p.price == null).length;
  const noImage = publicProducts.filter((p) => !p.cover).length;

  console.log(`\nBitti — ${((Date.now() - started) / 1000).toFixed(1)} sn`);
  console.log(`  Yazılan ürün : ${publicProducts.length}`);
  console.log(`  Kategori     : ${categories.length}`);
  console.log(`  JSON'dan     : ${viaNext}  (gerisi HTML'den okundu)`);
  console.log(`  Fiyatsız     : ${noPrice}`);
  console.log(`  Görselsiz    : ${noImage}`);
  if (failed.length) {
    console.log(`  Başarısız    : ${failed.length}`);
    await fs.writeFile(path.join(OUT_DIR, 'failed.json'), JSON.stringify(failed, null, 2));
    console.log('  → data/failed.json dosyasına yazıldı');
  }
}

import { BRAND_URL_RE } from './config.mjs';
main().catch((err) => {
  console.error('\nHata:', String(err && err.stack || err).replace(BRAND_URL_RE, '[kaynak]').replace(SOURCE.origin, '[kaynak]'));
  process.exit(1);
});
