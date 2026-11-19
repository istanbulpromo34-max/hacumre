/* Kahraman videosunun üstüne hava durumuna göre efekt koyar.
   Veri: Open-Meteo (anahtar istemez), konum: Ümraniye mağaza koordinatı.
   Yağmur / kar / rüzgâr efekti hava neyse ona göre; sonbahar yaprakları her zaman,
   soldan, arada bir, irili ufaklı. */
(function () {
  'use strict';

  var ENLEM = 41.0242974, BOYLAM = 29.0910215;
  var TAZE = 15 * 60 * 1000;              // hava durumu tazeleme aralığı
  var tuval = document.getElementById('heroEfekt');
  if (!tuval || !tuval.getContext) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ct = tuval.getContext('2d');
  var G = 0, Y = 0, dpr = 1;
  var hava = { kip: 'sakin', ruzgar: 8, siddet: 0.5 };
  var damlalar = [], kar = [], esinti = [], yapraklar = [];
  var calisiyor = false, sonAn = 0, yaprakSayaci = 4000;

  /* ---------- ölçü ---------- */
  function olc() {
    var k = tuval.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    G = Math.max(1, k.width); Y = Math.max(1, k.height);
    tuval.width = Math.round(G * dpr); tuval.height = Math.round(Y * dpr);
    ct.setTransform(dpr, 0, 0, dpr, 0, 0);
    kur();
  }

  /* ---------- parçacıklar ---------- */
  function rast(a, b) { return a + Math.random() * (b - a); }

  function kur() {
    var alan = (G * Y) / (1280 * 720);
    damlalar = []; kar = []; esinti = [];
    if (hava.kip === 'yagmur') {
      var n = Math.round(rast(90, 150) * alan * (0.6 + hava.siddet));
      for (var i = 0; i < n; i++) damlalar.push(yeniDamla(true));
    } else if (hava.kip === 'kar') {
      var m = Math.round(rast(70, 110) * alan * (0.6 + hava.siddet));
      for (var j = 0; j < m; j++) kar.push(yeniKar(true));
    }
    if (hava.kip === 'ruzgar' || hava.ruzgar > 22) {
      for (var k = 0; k < Math.round(7 * alan) + 3; k++) esinti.push(yeniEsinti(true));
    }
  }

  function yeniDamla(ilk) {
    return { x: rast(-80, G + 80), y: ilk ? rast(-Y, Y) : rast(-120, -10),
             u: rast(10, 26), h: rast(760, 1180), k: rast(0.18, 0.5) };
  }
  function yeniKar(ilk) {
    return { x: rast(-40, G + 40), y: ilk ? rast(-Y, Y) : rast(-60, -8),
             r: rast(1.1, 3.4), h: rast(26, 72), s: rast(0, 6.28), sh: rast(0.4, 1.3), k: rast(0.35, 0.85) };
  }
  function yeniEsinti(ilk) {
    return { x: rast(-200, G), y: rast(0, Y), u: rast(90, 260), h: rast(260, 520), k: rast(0.04, 0.12) };
  }
  function yeniYaprak() {
    var b = rast(9, 34);
    return {
      x: rast(-30, G * 0.34), y: rast(-80, -20), b: b,
      hy: rast(26, 62) * (0.6 + b / 40),          // düşüş hızı
      hx: rast(14, 46),                            // sağa süzülme
      a: rast(0, 6.28), da: rast(-1.6, 1.6),       // dönüş
      s: rast(0, 6.28), sh: rast(0.7, 1.7),        // salınım
      renk: ['#c9a24b', '#b4762e', '#8d4e26', '#d9a441', '#9c5f2a'][Math.floor(rast(0, 5))],
      k: rast(0.55, 0.95), omur: rast(9, 16), yas: 0
    };
  }

  /* ---------- çizim ---------- */
  function yaprakCiz(y) {
    ct.save();
    ct.translate(y.x, y.y);
    ct.rotate(y.a + Math.sin(y.s) * 0.5);
    var b = y.b, sol = Math.max(0, 1 - Math.max(0, y.yas - (y.omur - 2)) / 2);
    ct.globalAlpha = y.k * sol;
    ct.fillStyle = y.renk;
    ct.beginPath();
    ct.moveTo(0, -b * 0.5);
    ct.quadraticCurveTo(b * 0.52, -b * 0.1, 0, b * 0.5);
    ct.quadraticCurveTo(-b * 0.52, -b * 0.1, 0, -b * 0.5);
    ct.fill();
    ct.globalAlpha = y.k * sol * 0.5;
    ct.strokeStyle = 'rgba(40,24,10,.75)';
    ct.lineWidth = Math.max(0.5, b * 0.04);
    ct.beginPath(); ct.moveTo(0, -b * 0.45); ct.lineTo(0, b * 0.45); ct.stroke();
    ct.restore();
  }

  function cerceve(an) {
    if (!calisiyor) return;
    var dt = Math.min(0.05, (an - sonAn) / 1000 || 0.016);
    sonAn = an;
    ct.clearRect(0, 0, G, Y);
    var ruz = hava.ruzgar;

    if (damlalar.length) {
      ct.lineCap = 'round';
      for (var i = 0; i < damlalar.length; i++) {
        var d = damlalar[i];
        d.y += d.h * dt; d.x += ruz * 0.5 * dt * 6;
        if (d.y > Y + 40 || d.x > G + 120) damlalar[i] = yeniDamla(false);
        ct.strokeStyle = 'rgba(214,232,255,' + d.k + ')';
        ct.lineWidth = 1.1;
        ct.beginPath(); ct.moveTo(d.x, d.y);
        ct.lineTo(d.x - ruz * 0.08, d.y + d.u); ct.stroke();
      }
    }

    if (kar.length) {
      for (var j = 0; j < kar.length; j++) {
        var f = kar[j];
        f.s += f.sh * dt; f.y += f.h * dt;
        f.x += Math.sin(f.s) * 14 * dt + ruz * 0.22 * dt * 6;
        if (f.y > Y + 10 || f.x > G + 30 || f.x < -30) kar[j] = yeniKar(false);
        ct.globalAlpha = f.k;
        ct.fillStyle = '#fff';
        ct.beginPath(); ct.arc(f.x, f.y, f.r, 0, 6.2832); ct.fill();
      }
      ct.globalAlpha = 1;
    }

    if (esinti.length) {
      ct.lineCap = 'round';
      for (var k = 0; k < esinti.length; k++) {
        var e = esinti[k];
        e.x += e.h * dt;
        if (e.x - e.u > G + 60) { esinti[k] = yeniEsinti(false); esinti[k].x = -220; }
        var gr = ct.createLinearGradient(e.x - e.u, e.y, e.x, e.y);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, 'rgba(255,255,255,' + e.k + ')');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ct.strokeStyle = gr; ct.lineWidth = 1.4;
        ct.beginPath(); ct.moveTo(e.x - e.u, e.y); ct.lineTo(e.x, e.y - e.u * 0.06); ct.stroke();
      }
    }

    // sonbahar yaprakları: arada bir, küçük gruplar hâlinde
    yaprakSayaci -= dt * 1000;
    if (yaprakSayaci <= 0 && yapraklar.length < 26) {
      var adet = Math.round(rast(2, 6));
      for (var y0 = 0; y0 < adet; y0++) yapraklar.push(yeniYaprak());
      yaprakSayaci = rast(9000, 20000);
    }
    for (var y1 = yapraklar.length - 1; y1 >= 0; y1--) {
      var yp = yapraklar[y1];
      yp.yas += dt; yp.s += yp.sh * dt; yp.a += yp.da * dt;
      yp.y += yp.hy * dt;
      yp.x += (yp.hx + ruz * 0.5) * dt + Math.sin(yp.s) * 16 * dt;
      if (yp.y > Y + 50 || yp.x > G + 60 || yp.yas > yp.omur) { yapraklar.splice(y1, 1); continue; }
      yaprakCiz(yp);
    }

    requestAnimationFrame(cerceve);
  }

  function basla() {
    if (calisiyor) return;
    calisiyor = true; sonAn = performance.now();
    requestAnimationFrame(cerceve);
  }
  function dur() { calisiyor = false; ct.clearRect(0, 0, G, Y); }

  /* ---------- hava durumu ---------- */
  function kipBelirle(v) {
    var kod = v.weather_code, ruz = v.wind_speed_10m || 0;
    var kar = (kod >= 71 && kod <= 77) || kod === 85 || kod === 86 || (v.snowfall || 0) > 0;
    var yagmur = (kod >= 51 && kod <= 67) || (kod >= 80 && kod <= 82) || (kod >= 95 && kod <= 99) || (v.precipitation || 0) > 0;
    var kip = kar ? 'kar' : yagmur ? 'yagmur' : ruz >= 24 ? 'ruzgar' : 'sakin';
    var siddet = Math.min(1, ((v.precipitation || 0) + (v.snowfall || 0) * 4) / 3 + 0.25);
    return { kip: kip, ruzgar: ruz, siddet: siddet };
  }

  function havaAl() {
    var saklı = null;
    try { saklı = JSON.parse(sessionStorage.getItem('ihh-hava') || 'null'); } catch (e) {}
    if (saklı && Date.now() - saklı.an < TAZE) { hava = saklı.hava; kur(); return; }
    var adres = 'https://api.open-meteo.com/v1/forecast?latitude=' + ENLEM + '&longitude=' + BOYLAM +
      '&current=precipitation,snowfall,weather_code,wind_speed_10m&timezone=Europe%2FIstanbul';
    fetch(adres, { cache: 'no-store' })
      .then(function (c) { return c.ok ? c.json() : null; })
      .then(function (v) {
        if (!v || !v.current) return;
        hava = kipBelirle(v.current);
        try { sessionStorage.setItem('ihh-hava', JSON.stringify({ an: Date.now(), hava: hava })); } catch (e) {}
        kur();
      })
      .catch(function () { /* hava alınamazsa yalnız yapraklar kalır */ });
  }

  /* ---------- bağla ---------- */
  olc();
  havaAl();
  setInterval(havaAl, TAZE);

  var zaman;
  addEventListener('resize', function () { clearTimeout(zaman); zaman = setTimeout(olc, 180); });
  document.addEventListener('visibilitychange', function () { document.hidden ? dur() : basla(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (girdiler) {
      girdiler[0].isIntersecting ? basla() : dur();
    }, { threshold: 0 }).observe(tuval);
  } else { basla(); }
})();
