/* İstanbul Hac Umre Hediyelik — ortak betik */
const WA='905551044040';
/* Mağaza bilgileri: bütün sayfalarda tek kaynaktan */
const MAGAZA={
 ad:'İstanbul Hac Umre Hediyelik',
 adres:'Sütçü İmam Cad., Cevherağa Camii Sk. No:10-A, Ümraniye / İstanbul',
 kisaAdres:'Cevherağa Camii Sk. No:10-A, Ümraniye',
 saat:'Her gün 09:00–20:00',
 tel:'0555 104 40 40',telLink:'tel:+905551044040',
 puan:'5,0',yorum:'120\'den fazla yorum',
 harita:'https://maps.app.goo.gl/6nQusZ3VK2vwh3cd6',
 yorumYap:'https://g.page/r/CSGI4w4tcT1CEBM/review',
 instagram:'https://www.instagram.com/istanbulhacumrehediyelik/'
};
const KATEGORILER=[
 {ad:'Hac Umre Malzemeleri',gorsel:'assets/g/masa.jpg',acik:'İhram, kemer, terlik, bel çantası ve yolculukta gereken her şey.'},
 {ad:'Hac Umre Kıyafetleri',gorsel:'assets/g/kiyafet.jpg',acik:'Erkek ve kadın için rahat, nefes alan, tesettüre uygun kıyafetler.'},
 {ad:'İslami Hediyelik',gorsel:'assets/g/donus.jpg',acik:'Tesbih, seccade, esans ve özenle hazırlanmış hediye paketleri.'},
 {ad:'Hurma ve Zemzem',gorsel:'assets/g/hurma.jpg',acik:'Seçme Medine hurmaları ve dönüş ikramları için zemzem.'}
];
/* Örnek ürünler — gerçek liste gelince değişecek. İsteğe bağlı kadraj: görselin hangi bölümü görünsün ('50% 30%') */
const URUNLER=window.URUNLER||[
 {id:'ihram-havlu',ad:'Havlu İhram Takımı',fiyat:450,kat:'Hac Umre Kıyafetleri',gorsel:'assets/u/ihram.jpg',acik:'Pamuklu, nefes alan iki parça havlu ihram.'},
 {id:'ferace',ad:'Umre Feracesi',fiyat:900,kat:'Hac Umre Kıyafetleri',gorsel:'assets/u/ferace.jpg',acik:'Hafif, bol kesim ve terletmeyen kumaş.'},
 {id:'esarp',ad:'Pamuklu Eşarp ve Bone',fiyat:250,kat:'Hac Umre Kıyafetleri',gorsel:'assets/u/esarp.jpg',acik:'Nefes alan pamuklu eşarp ve bone takımı.'},
 {id:'ihram-kemer',ad:'İhram Kemeri',fiyat:180,kat:'Hac Umre Malzemeleri',gorsel:'assets/u/kemer.jpg',acik:'Fermuarlı cepli, ayarlanabilir kemer.'},
 {id:'terlik',ad:'İhram Terliği',fiyat:220,kat:'Hac Umre Malzemeleri',gorsel:'assets/u/terlik.jpg',acik:'Ayak üstü ve topuğu açık, cırt bantla ayarlanır, kaymaz taban.'},
 {id:'bel-cantasi',ad:'Boyun Çantası',fiyat:280,kat:'Hac Umre Malzemeleri',gorsel:'assets/u/canta.jpg',acik:'Pasaport ve para için fermuarlı, ince çanta.'},
 {id:'kokusuz-sabun',ad:'Kokusuz Bakım Seti',fiyat:200,kat:'Hac Umre Malzemeleri',gorsel:'assets/u/bakim.jpg',acik:'İhramlıyken kullanılabilen kokusuz sabun, şampuan ve ıslak mendil.'},
 {id:'misvak',ad:'Misvak',fiyat:60,kat:'Hac Umre Malzemeleri',gorsel:'assets/u/misvak.jpg',acik:'Doğal erak ağacından misvak.'},
 {id:'seccade',ad:'Seyahat Seccadesi',fiyat:300,kat:'İslami Hediyelik',gorsel:'assets/u/seccade.jpg',acik:'Katlanır, hafif cep seccadesi.'},
 {id:'tesbih',ad:'Tesbih',fiyat:120,kat:'İslami Hediyelik',gorsel:'assets/u/tesbih.jpg',acik:'33\'lük, püsküllü tesbih.'},
 {id:'zikirmatik',ad:'Zikirmatik',fiyat:90,kat:'İslami Hediyelik',gorsel:'assets/u/zikirmatik.jpg',acik:'Parmağa takılan dijital sayaç.'},
 {id:'hurma',ad:'Medine Hurması 1 kg',fiyat:650,kat:'Hurma ve Zemzem',gorsel:'assets/u/hurma.jpg',acik:'Seçme Medine hurması.'},
 {id:'zemzem',ad:'Zemzem 5 L',fiyat:400,kat:'Hurma ve Zemzem',gorsel:'assets/u/zemzem.jpg',acik:'Dönüş ikramları için zemzem.'}
];
const TL=n=>n.toLocaleString('tr-TR')+' ₺';
/* Görseller WebP olarak sunulur; açılamazsa aynı adlı JPG'ye düşülür */
const resim=y=>/^assets\/(u|g)\/[^/]+\.jpg$/.test(y||'')?y.replace(/\.jpg$/,'.webp'):y;
const RESIM_YEDEK=`onerror="this.onerror=null;this.src=this.src.replace(/\\.webp$/,'.jpg')"`;
const depo={al(k,v){try{return JSON.parse(localStorage.getItem(k)||v)}catch(e){return JSON.parse(v)}},yaz(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const WA_SVG='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5l-.2-.3z"/></svg>';
/* Sepet */
const Sepet={
 al(){return depo.al('hu_sepet','{}')},
 yaz(s){depo.yaz('hu_sepet',s);Sepet.ciz();document.dispatchEvent(new CustomEvent('sepet'))},
 ekle(id,n=1){const s=Sepet.al();s[id]=(s[id]||0)+n;if(s[id]<=0)delete s[id];Sepet.yaz(s)},
 kaldir(id){const s=Sepet.al();delete s[id];Sepet.yaz(s)},
 bosalt(){Sepet.yaz({})},
 adet(id){return Sepet.al()[id]||0},
 sayi(){return Object.values(Sepet.al()).reduce((a,b)=>a+b,0)},
 cesit(){return Sepet.kalemler().length},
 kalemler(){const s=Sepet.al();return Object.keys(s).map(id=>({u:URUNLER.find(u=>u.id===id),n:s[id]})).filter(k=>k.u)},
 toplam(){return Sepet.kalemler().reduce((a,{u,n})=>a+u.fiyat*n,0)},
 ozet(){const c=Sepet.cesit(),n=Sepet.sayi();return c===n?`${n} ürün`:`${c} çeşit · ${n} adet`},
 waMetin(){const k=Sepet.kalemler();let t='Merhaba, sitenizden çantamı hazırladım. Aşağıdaki ürünler için stok ve fiyat bilgisi almak istiyorum:\n\n';
  k.forEach(({u,n})=>{t+=`• ${u.ad} × ${n} — ${TL(u.fiyat*n)}\n`});return t+`\nAra toplam: ${TL(Sepet.toplam())}`},
 gonder(){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(Sepet.waMetin()),'_blank','noopener')},
 ciz(){
  const n=Sepet.sayi(),btn=document.querySelector('.sepetbtn');
  if(btn){const b=btn.querySelector('b');b.textContent=n;b.classList.toggle('var',n>0);btn.setAttribute('aria-label',n?`Çantam, ${Sepet.ozet()}`:'Çantam, boş')}
  const L=document.querySelector('.cekmece .liste');if(!L)return;const k=Sepet.kalemler();
  document.querySelector('.cekmece .alt').hidden=!k.length;
  if(!k.length){
   const urunSayfasi=/urunler\.html/.test(location.pathname);
   L.innerHTML=`<div class="bos"><p>Çantanız henüz boş.</p><a class="btn cam" href="urunler.html" ${urunSayfasi?'data-kapat':''}>Ürünlere göz atın</a></div>`;return}
  L.innerHTML=k.map(({u,n})=>`<div class="satir"><img src="${resim(u.gorsel)}" alt="" style="object-position:${u.kadraj||'50% 50%'}" ${u.yedek?`onerror="this.onerror=null;this.src='${u.yedek}'"`:RESIM_YEDEK}><div class="s-bilgi"><div class="ad">${u.ad}</div><small>${TL(u.fiyat)}</small>
  <button type="button" class="kaldir" data-kaldir="${u.id}">Kaldır</button></div>
  <div class="adet"><button type="button" aria-label="${u.ad} adedini azalt" data-adet="${u.id}" data-d="-1">−</button><b aria-live="polite">${n}</b><button type="button" aria-label="${u.ad} adedini artır" data-adet="${u.id}" data-d="1">+</button></div></div>`).join('');
  document.querySelector('.cekmece .toplam b').textContent=TL(Sepet.toplam());
  document.querySelector('.cekmece .ozet-sayi').textContent=Sepet.ozet()}
};
function toast(m,eylem){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.append(t)}
 t.innerHTML='<span>'+m+'</span>'+(eylem?'<button type="button">'+eylem[0]+'</button>':'');
 if(eylem)t.querySelector('button').onclick=eylem[1];
 t.classList.add('on');clearTimeout(t._z);t._z=setTimeout(()=>t.classList.remove('on'),2600)}
/* Ürün görselini sepete uçur, sepet zıplasın */
function sepeteUcur(kaynak){
 const hedef=document.querySelector('.sepetbtn');if(!hedef||!kaynak)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){hedef.classList.remove('zipla');void hedef.offsetWidth;hedef.classList.add('zipla');return}
 const a=kaynak.getBoundingClientRect(),b=hedef.getBoundingClientRect();
 const k=document.createElement('img');k.src=kaynak.currentSrc||kaynak.src;k.className='ucan';k.alt='';
 if(kaynak.style.objectPosition)k.style.objectPosition=kaynak.style.objectPosition;
 const s=Math.min(a.width,a.height,160);
 Object.assign(k.style,{left:(a.left+a.width/2-s/2)+'px',top:(a.top+a.height/2-s/2)+'px',width:s+'px',height:s+'px'});
 document.body.append(k);
 const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
 const an=k.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-80}px) scale(.55)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.12)`,opacity:.4}],{duration:750,easing:'cubic-bezier(.5,0,.3,1)'});
 an.onfinish=()=>{k.remove();hedef.classList.remove('zipla');void hedef.offsetWidth;hedef.classList.add('zipla')};
}
let _oncekiOdak=null;
function cekmeceAc(){const c=document.querySelector('.cekmece');if(!c)return;_oncekiOdak=document.activeElement;c.classList.add('acik');c.querySelector('.pan').setAttribute('aria-hidden','false');
 document.documentElement.classList.add('kilit');try{lenis&&lenis.stop()}catch(e){}
 setTimeout(()=>c.querySelector('.kapat').focus(),60)}
function cekmeceKapat(){const c=document.querySelector('.cekmece');if(!c||!c.classList.contains('acik'))return;c.classList.remove('acik');c.querySelector('.pan').setAttribute('aria-hidden','true');
 document.documentElement.classList.remove('kilit');try{lenis&&lenis.start()}catch(e){}
 if(_oncekiOdak&&_oncekiOdak.focus)_oncekiOdak.focus()}
/* Menü, çekmece, sabit WhatsApp ve altbilgi */
function kabuk(aktif){
 const nav=document.createElement('nav');nav.className='nav';nav.setAttribute('aria-label','Ana menü');
 const on=k=>aktif===k?' class="on" aria-current="page"':'';
 nav.innerHTML=`<a class="logo" href="index.html" aria-label="${MAGAZA.ad}, ana sayfa"><img src="assets/logo-nav.png" alt="" width="128" height="31"></a>
 <a href="index.html"${on('ana')}>Ana Sayfa</a>
 <a href="urunler.html"${on('urun')}>Ürünlerimiz</a>
 <a href="iletisim.html"${on('ilet')}>İletişim</a>
 <a href="tur.html" class="tur${aktif==='tur'?' on':''}"${aktif==='tur'?' aria-current="page"':''}>Dijital Tur</a>
 <button class="sepetbtn" type="button" aria-label="Çantam, boş"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 7h14l-1.5 11h-11z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><b aria-hidden="true">0</b></button>`;
 document.body.prepend(nav);
 const ml=document.createElement('a');ml.className='mlogo';ml.href='index.html';ml.setAttribute('aria-label',MAGAZA.ad+', ana sayfa');ml.innerHTML='<img src="assets/logo-nav.png" alt="" width="128" height="31">';
 document.body.prepend(ml);
 const gec=document.createElement('a');gec.className='icerige-gec';gec.href='#icerik';gec.textContent='İçeriğe geç';document.body.prepend(gec);
 const ust=()=>ml.classList.toggle('gizli',scrollY>160);addEventListener('scroll',ust,{passive:true});ust();
 /* çekmece */
 const c=document.createElement('div');c.className='cekmece';
 c.innerHTML=`<div class="perde"></div><aside class="pan" role="dialog" aria-modal="true" aria-labelledby="cekmece-baslik" aria-hidden="true" data-lenis-prevent><div class="pan-bas"><h3 id="cekmece-baslik">Çantam</h3><button type="button" class="kapat" aria-label="Çantayı kapat">×</button></div>
 <p class="pan-not">Seçtiğiniz ürünleri tek mesajla WhatsApp'tan gönderin; stok ve fiyatı teyit edip çantanızı mağazada hazırlayalım.</p>
 <div class="liste"></div>
 <div class="alt"><div class="toplam"><span>Ara toplam <small class="ozet-sayi"></small></span><b></b></div>
 <button class="btn wa" type="button" onclick="Sepet.gonder()">${WA_SVG}Çantamı WhatsApp'tan gönder</button>
 <button class="bosalt" type="button">Çantayı boşalt</button></div></aside>`;
 document.body.append(c);
 nav.querySelector('.sepetbtn').onclick=cekmeceAc;
 c.querySelector('.perde').onclick=cekmeceKapat;c.querySelector('.kapat').onclick=cekmeceKapat;
 const bos=c.querySelector('.bosalt');
 bos.onclick=()=>{if(bos.classList.contains('emin')){bos.classList.remove('emin');bos.textContent='Çantayı boşalt';Sepet.bosalt();c.querySelector('.kapat').focus();return}
  bos.classList.add('emin');bos.textContent='Emin misiniz? Evet, boşalt';clearTimeout(bos._z);bos._z=setTimeout(()=>{bos.classList.remove('emin');bos.textContent='Çantayı boşalt'},4000)};
 c.addEventListener('click',e=>{
  const a=e.target.closest('[data-adet]');if(a){Sepet.ekle(a.dataset.adet,+a.dataset.d);return}
  const k=e.target.closest('[data-kaldir]');if(k){Sepet.kaldir(k.dataset.kaldir);return}
  if(e.target.closest('[data-kapat]')){e.preventDefault();cekmeceKapat()}
 });
 addEventListener('keydown',e=>{
  if(!c.classList.contains('acik'))return;
  if(e.key==='Escape'){cekmeceKapat();return}
  if(e.key==='Tab'){const f=[...c.querySelectorAll('button,a[href]')].filter(x=>x.offsetParent!==null);if(!f.length)return;
   const i=f.indexOf(document.activeElement);
   if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus()}
   else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}
 });
 /* sabit WhatsApp */
 const wa=document.createElement('a');wa.className='wa-sabit';wa.href='https://wa.me/'+WA+'?text='+encodeURIComponent('Merhaba, sitenizden yazıyorum.');wa.target='_blank';wa.rel='noopener';wa.setAttribute('aria-label',"WhatsApp'tan yazın");
 wa.innerHTML=WA_SVG;document.body.append(wa);
 /* altbilgi */
 const f=document.querySelector('footer.sf');
 if(f){const notlar=[...f.querySelectorAll('.f-not')];
 f.innerHTML=`<div class="f-ust"><div class="f-blok"><a class="f-logo" href="index.html" aria-label="${MAGAZA.ad}, ana sayfa"><img src="assets/logo-alt.png" alt="" width="184" height="44" loading="lazy"></a><p>${MAGAZA.adres}<br>${MAGAZA.saat}</p></div>
 <nav class="f-blok" aria-label="Alt menü"><a href="index.html">Ana Sayfa</a><a href="urunler.html">Ürünlerimiz</a><a href="tur.html">Dijital Umre Turu</a><a href="iletisim.html">İletişim</a></nav>
 <div class="f-blok"><a href="${MAGAZA.telLink}">${MAGAZA.tel}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener">WhatsApp'tan yazın</a><a href="${MAGAZA.instagram}" target="_blank" rel="noopener">Instagram</a><span class="f-telif">© ${new Date().getFullYear()} ${MAGAZA.ad}</span></div></div>`;
 notlar.forEach(n=>f.append(n))}
 Sepet.ciz();
}
/* Kaydırmayla beliren öğeler hemen, yumuşak kaydırma kütüphane yüklenince */
let lenis=null,yumusakY=scrollY;
function akisKur(){
 const azHareket=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const lenisKur=()=>{if(lenis||azHareket||!window.Lenis)return;
  lenis=new Lenis({lerp:.085,wheelMultiplier:.9,smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)};
 lenisKur();if(!lenis)addEventListener('load',lenisKur);
 const dongu=()=>{yumusakY+=(scrollY-yumusakY)*.14;document.documentElement.style.setProperty('--sy',yumusakY.toFixed(1));
  document.querySelectorAll('.metal[data-isik]').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const p=1-(r.top+r.height)/(innerHeight+r.height);
   e.style.setProperty('--isik',(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%')});
  requestAnimationFrame(dongu)};dongu();
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('gel');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -6% 0px'});
 document.querySelectorAll('[data-gel]').forEach(e=>io.observe(e));
}
