#!/usr/bin/env node
// src/page.html (sayfa gövdesi) → docs/index.html (tam HTML belgesi).
// Yayın adresi ve arama motoru etiketleri burada eklenir.
import fs from 'node:fs/promises';

const SITE = process.env.SITE_URL || 'https://istanbulpromo34-max.github.io/hacumre/';
const DESC = 'Ümraniye’de hac ve umre hazırlık malzemeleri: ihram, kokusuz bakım ürünleri, mest, seccade, tesbih, zikirmatik ve hediyelik hat tabloları. Hazırlık kontrol listesi ve kısa rehber.';

const body = await fs.readFile('src/page.html', 'utf8');

const ld = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'İstanbul Hac Umre Hediyelik',
  description: DESC,
  url: SITE,
  image: SITE + 'assets/showroom.jpg',
  telephone: '+905551044040',
  priceRange: '₺₺',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Atatürk Mah., Cevherağa Cami Sk., Elif İş Merkezi No:10-A',
    addressLocality: 'Ümraniye',
    addressRegion: 'İstanbul',
    postalCode: '34764',
    addressCountry: 'TR',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 41.0242974, longitude: 29.0910215 },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '09:00', closes: '20:00',
  }],
};

const head = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${DESC}">
<meta name="theme-color" content="#07152F">
<link rel="canonical" href="${SITE}">
<link rel="icon" href="assets/logo.png">
<link rel="apple-touch-icon" href="assets/logo.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="İstanbul Hac Umre Hediyelik">
<meta property="og:title" content="İstanbul Hac Umre Hediyelik — Ümraniye">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}assets/showroom.jpg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0}img,svg{max-width:100%}</style>
</head>
<body>
`;

await fs.mkdir('docs', { recursive: true });
await fs.writeFile('docs/index.html', head + body.replace(/\s*$/, '') + '\n</body>\n</html>\n');
await fs.writeFile('docs/.nojekyll', '');
console.log('docs/index.html yazıldı');
