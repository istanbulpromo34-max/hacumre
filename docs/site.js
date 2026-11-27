/* İstanbul Hac Umre Hediyelik — ortak betik */
const WA='905551044040';
/* Mağaza bilgileri: bütün sayfalarda tek kaynaktan */
const MAGAZA={
 ad:'İstanbul Hac Umre Hediyelik',
 adres:'Sütçü İmam Cad., Cevherağa Camii Sk. No:10-A, Ümraniye / İstanbul',
 kisaAdres:'Cevherağa Camii Sk. No:10-A, Ümraniye',
 saat:'Her gün 09:00–20:00',
 tel:'0555 104 40 40',telLink:'tel:+905551044040',
 puan:'5,0',yorum:'136 yorum',
 harita:'https://maps.app.goo.gl/6nQusZ3VK2vwh3cd6',
 yorumYap:'https://g.page/r/CSGI4w4tcT1CEBM/review',
 instagram:'https://www.instagram.com/istanbulhacumrehediyelik/'
};
const KATEGORILER=[
 {ad:'İhram ve Umre Kıyafetleri',gorsel:'assets/g/kat-kiyafet.jpg',acik:'İhram, ihram kemeri, umre feracesi, eşarp, takke ve çocuk kıyafetleri.'},
 {ad:'Terlik, Mest ve Yolculuk',gorsel:'assets/g/kat-malzeme.jpg',acik:'Terlik, deri mest, tavaf çorabı, misvak, kokusuz sabun ve boyun çantası.'},
 {ad:'Seccade ve Namaz Örtüsü',gorsel:'assets/g/kat-seccade.jpg',acik:'Şönil, velür ve goblen seccadeler; cep seccadesi ve çocuk seccadesi.'},
 {ad:'Tespih ve Zikirmatik',gorsel:'assets/g/kat-tesbih.jpg',acik:'Kuka, kehribar ve doğal taş tespihler; sesli ve pusulalı zikirmatikler.'},
 {ad:"Kur'an-ı Kerim, Kitap ve Rahle",gorsel:'assets/g/kat-kuran.jpg',acik:'Kur\'an-ı Kerim, Enam-ı Şerif, hatim setleri, ilmihal ve ahşap rahleler.'},
 {ad:'Koku, Kolonya ve Esans',gorsel:'assets/g/kat-koku.jpg',acik:'Esans, kolonya, oda ve araç kokuları, difüzör ve buhurdanlıklar.'},
 {ad:'Hurma, Zemzem ve İkramlık',gorsel:'assets/g/kat-hurma.jpg',acik:'Acve, Safavi ve Mebrum hurmalar; zemzem takımları ve hurmalı ikramlıklar.'},
 {ad:'Hediyelik ve Dekoratif',gorsel:'assets/g/kat-hediyelik.jpg',acik:'Kâbe maketleri, bibloları, duvar saatleri, çerçeveler ve sadaka kutuları.'}
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
 {id:'tesbih',ad:'Tespih',fiyat:120,kat:'İslami Hediyelik',gorsel:'assets/u/tesbih.jpg',acik:'33\'lük, püsküllü tespih.'},
 {id:'zikirmatik',ad:'Zikirmatik',fiyat:90,kat:'İslami Hediyelik',gorsel:'assets/u/zikirmatik.jpg',acik:'Parmağa takılan dijital sayaç.'},
 {id:'hurma',ad:'Medine Hurması 1 kg',fiyat:650,kat:'Hurma ve Zemzem',gorsel:'assets/u/hurma.jpg',acik:'Seçme Medine hurması.'},
 {id:'zemzem',ad:'Zemzem 5 L',fiyat:400,kat:'Hurma ve Zemzem',gorsel:'assets/u/zemzem.jpg',acik:'Dönüş ikramları için zemzem.'}
];
const TL=n=>n.toLocaleString('tr-TR')+' ₺';
/* Görseller WebP olarak sunulur; açılamazsa aynı adlı JPG'ye düşülür */
const resim=y=>/^assets\/(u|g)\/[^/]+\.jpg$/.test(y||'')?y.replace(/\.jpg$/,'.webp'):y;
const RESIM_YEDEK=`onerror="this.onerror=null;this.src=this.src.replace(/\\.webp$/,'.jpg')"`;
/* Kartlarda ve ızgaralarda telefon boyutundaki kopya (en uzun kenar 700px) kullanılır;
   büyütme penceresinde tam boy görsel açılır. Kopyalar tools/kucuk_gorsel.py ile üretilir. */
const kucuk=y=>/^assets\/(u|g)\/[^/]+\.(webp|jpg|jpeg|png)$/i.test(y||'')
 ? y.replace(/^assets\/(u|g)\//,'assets/$1/k/').replace(/\.(jpg|jpeg|png)$/i,'.webp') : y;
/* Telefon ızgarası için daha da küçük kopya (en uzun kenar 400px, ~15 KB).
   Kartlar <picture> ile telefonda bunu, masaüstünde k/ kopyasını indirir;
   tam boy görsel yalnızca ürüne girilince açılır. */
const mini=y=>/^assets\/(u|g)\/[^/]+\.(webp|jpg|jpeg|png)$/i.test(y||'')
 ? y.replace(/^assets\/(u|g)\//,'assets/$1/m/').replace(/\.(jpg|jpeg|png)$/i,'.webp') : y;
/* Görsel açılamazsa sırayla yedeklere düşer: tam boy → yedeğin küçüğü → yedeğin tam boyu */
function gorselYedek(img){
 const kalan=(img.dataset.yedekler||'').split('|').filter(Boolean);
 if(!kalan.length){img.onerror=null;return}
 img.dataset.yedekler=kalan.slice(1).join('|');
 /* <picture> içindeyse önce boy seçenekleri kalkmalı, yoksa yeni src yok sayılır */
 const p=img.parentElement;
 if(p&&p.tagName==='PICTURE')p.querySelectorAll('source').forEach(k=>k.remove());
 img.removeAttribute('srcset');
 img.src=kalan[0];
}
const depo={al(k,v){try{return JSON.parse(localStorage.getItem(k)||v)}catch(e){return JSON.parse(v)}},yaz(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const WA_SVG='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5l-.2-.3z"/></svg>';
const OYNAT_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 5.2v13.6a1 1 0 0 0 1.53.85l10.7-6.8a1 1 0 0 0 0-1.7L9.93 4.35A1 1 0 0 0 8.4 5.2z"/></svg>';
const FILM = {video:'assets/tanitim/film.mp4', videoM:'assets/tanitim/film-m.mp4', kapak:'assets/tanitim/kapak.webp', sure:'1:38'};
let _filmKat=null,_filmVid=null,_filmOdak=null;
function filmKur(){
 if(_filmKat)return;
 _filmKat=document.createElement('div');_filmKat.className='film-kat';
 _filmKat.setAttribute('role','dialog');_filmKat.setAttribute('aria-modal','true');
 _filmKat.setAttribute('aria-label','İstanbul Hac Umre tanıtım filmi');
 _filmKat.innerHTML='<button class="film-kapat" type="button" aria-label="Kapat"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'+
  '<video playsinline controls preload="none" poster="'+FILM.kapak+'"><source src="'+(innerWidth<=720?FILM.videoM:FILM.video)+'" type="video/mp4">Tarayıcınız videoyu oynatamıyor.</video>';
 _filmVid=_filmKat.querySelector('video');
 _filmKat.addEventListener('click',e=>{if(e.target===_filmKat)filmKapat()});
 _filmKat.querySelector('.film-kapat').addEventListener('click',filmKapat);
 _filmVid.addEventListener('ended',filmKapat);
 document.body.append(_filmKat);
}
function filmAc(){
 filmKur();_filmOdak=document.activeElement;
 document.documentElement.classList.add('kilit');try{lenis&&lenis.stop()}catch(e){}
 requestAnimationFrame(()=>{_filmKat.classList.add('acik');
  const o=_filmVid.play();if(o&&o.catch)o.catch(()=>{});
  _filmKat.querySelector('.film-kapat').focus()});
}
function filmKapat(){
 if(!_filmKat||!_filmKat.classList.contains('acik'))return;
 _filmKat.classList.remove('acik');try{_filmVid.pause()}catch(e){}
 document.documentElement.classList.remove('kilit');try{lenis&&lenis.start()}catch(e){}
 if(_filmOdak&&_filmOdak.focus)_filmOdak.focus();
}
addEventListener('keydown',e=>{if(e.key==='Escape')filmKapat()});
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
 waMetin(){const k=Sepet.kalemler();let t='Merhaba, sitenizden sepetimi hazırladım. Aşağıdaki ürünler için stok ve fiyat bilgisi almak istiyorum:\n\n';
  k.forEach(({u,n})=>{t+=`• ${u.ad} × ${n} — ${TL(u.fiyat*n)}\n`});return t+`\nAra toplam: ${TL(Sepet.toplam())}`},
 gonder(){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(Sepet.waMetin()),'_blank','noopener')},
 ciz(){
  const n=Sepet.sayi(),btn=document.querySelector('.sepetbtn');
  if(btn){const b=btn.querySelector('b');if(b.textContent!=String(n)&&n>0){b.classList.remove('yeni');void b.offsetWidth;b.classList.add('yeni')}b.textContent=n;b.classList.toggle('var',n>0);btn.classList.toggle('dolu',n>0);btn.setAttribute('aria-label',n?`Sepetim, ${Sepet.ozet()}`:'Sepetim, boş')}
  const L=document.querySelector('.cekmece .liste');if(!L)return;const k=Sepet.kalemler();
  document.querySelector('.cekmece .alt').hidden=!k.length;
  if(!k.length){
   const urunSayfasi=/urunler\.html/.test(location.pathname);
   L.innerHTML=`<div class="bos"><p>Sepetiniz henüz boş.</p><a class="btn cam" href="urunler.html" ${urunSayfasi?'data-kapat':''}>Ürünlere göz atın</a></div>`;return}
  L.innerHTML=k.map(({u,n})=>`<div class="satir"><img src="${mini(resim(u.gorsel))}" data-tam="${resim(u.gorsel)}" alt="" decoding="async" style="object-position:${u.kadraj||'50% 50%'}" onerror="if(this.dataset.tam){this.src=this.dataset.tam;this.dataset.tam=''}else{this.onerror=null;${u.yedek?`this.src='${u.yedek}'`:`this.src=this.src.replace(/\\.webp$/,'.jpg')`}}"><div class="s-bilgi"><div class="ad">${u.ad}</div><small>${TL(u.fiyat)}</small>
  <button type="button" class="kaldir" data-kaldir="${u.id}">Kaldır</button></div>
  <div class="adet"><button type="button" aria-label="${u.ad} adedini azalt" data-adet="${u.id}" data-d="-1">−</button><b aria-live="polite">${n}</b><button type="button" aria-label="${u.ad} adedini artır" data-adet="${u.id}" data-d="1">+</button></div></div>`).join('');
  document.querySelector('.cekmece .toplam b').textContent=TL(Sepet.toplam());
  document.querySelector('.cekmece .ozet-sayi').textContent=Sepet.ozet()}
};
function toast(m,eylem){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.append(t)}
 t.innerHTML='<span>'+m+'</span>'+(eylem?'<button type="button">'+eylem[0]+'</button>':'');
 if(eylem)t.querySelector('button').onclick=eylem[1];
 t.classList.add('on');clearTimeout(t._z);t._z=setTimeout(()=>t.classList.remove('on'),2600)}
/* Çantanın çevresinde altın ışık halkası (zıplama yerine) */
function parlat(e){if(!e)return;e.classList.add('isil');e.classList.remove('parla');void e.offsetWidth;e.classList.add('parla')}
/* Ürün görseli kavis çizerek sepete uçar, sepetin ağzına gelince içine düşer
   (alt kenarı sepetin ağzında kaybolur), sepet hafifçe parlar. Görünür bir sepet
   hedefi (örneğin Ürünlerimiz'deki alt çubuk) varsa oraya, yoksa köşedeki düğmeye. */
function sepeteUcur(kaynak,zorHedef){
 const adaylar=[...document.querySelectorAll('[data-sepet-hedef],.sepetbtn')]
  .filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&s.visibility!=='hidden'&&+s.opacity>.3&&r.bottom>0&&r.top<innerHeight});
 const hedef=zorHedef||adaylar[0];if(!hedef||!kaynak)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){parlat(hedef);return}
 const a=kaynak.getBoundingClientRect(),b=hedef.getBoundingClientRect();
 const k=document.createElement('img');k.src=kaynak.currentSrc||kaynak.src;k.className='ucan';k.alt='';
 if(kaynak.style.objectPosition)k.style.objectPosition=kaynak.style.objectPosition;
 const s=Math.min(a.width,a.height,150);
 Object.assign(k.style,{left:(a.left+a.width/2-s/2)+'px',top:(a.top+a.height/2-s/2)+'px',width:s+'px',height:s+'px'});
 document.body.append(k);
 /* Sepetin yeri uçuş sırasında değişebilir (çubuk genişliği yumuşakça değişirken),
    bu yüzden hedef her karede yeniden okunur: görsel her zaman tam sepetin ağzına düşer. */
 const ax=a.left+a.width/2, ay=a.top+a.height/2, SURE=860, T1=.78;
 const ez=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, ici=t=>t*t*t;
 const t0=performance.now();
 const bitti=()=>{k.remove();
  const h=hedef.isConnected?hedef:(document.querySelector('[data-sepet-hedef]')||hedef);
  parlat(h);
  /* sepet ürünü "yakalar": ikon bir an hafifçe aşağı iner ve geri gelir */
  const ik=h.querySelector('svg')||h;
  ik.animate([{transform:'none'},{transform:'translateY(2px) scale(.94)'},{transform:'none'}],{duration:320,easing:'cubic-bezier(.3,.7,.3,1)'});
  const say=h.querySelector('.c-say,b');
  if(say)say.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:360,delay:60,easing:'cubic-bezier(.3,.7,.3,1)'});
 };
 const kare=an=>{
  const t=Math.min(1,(an-t0)/SURE);
  const hb=(hedef.isConnected?hedef:(document.querySelector('[data-sepet-hedef]')||hedef)).getBoundingClientRect();
  const e=Math.max(.06,hb.width*.38/s), mx=hb.left+hb.width/2, agiz=hb.top+hb.height*.44;
  const ustY=agiz-s*e/2;                       // görselin alt kenarı sepetin ağzında
  let x,y,sc,kes=0;
  if(t<T1){const u=ez(t/T1),kavis=Math.min(160,Math.max(70,Math.abs(mx-ax)*.25+60));
   const px=(ax+mx)/2, py=Math.min(ay,ustY)-kavis;                    // kavisin tepe noktası
   x=(1-u)*(1-u)*ax+2*(1-u)*u*px+u*u*mx; y=(1-u)*(1-u)*ay+2*(1-u)*u*py+u*u*ustY;
   sc=1+(e-1)*Math.min(1,u*1.15)}
  else{const u=ici((t-T1)/(1-T1));x=mx;sc=e;y=ustY+u*s*e;kes=u*100}  // aşağı inerken alt kısmı ağızda kaybolur
  k.style.transform=`translate(${x-ax}px,${y-ay}px) scale(${sc})`;
  k.style.clipPath=`inset(0 0 ${kes}% 0 round ${14+16*Math.min(1,t/T1)}%)`;
  if(t<1)requestAnimationFrame(kare);else bitti()};
 requestAnimationFrame(kare);
}
let _oncekiOdak=null;
function cekmeceAc(){const c=document.querySelector('.cekmece');if(!c)return;_oncekiOdak=document.activeElement;c.classList.add('acik');c.querySelector('.pan').setAttribute('aria-hidden','false');
 document.documentElement.classList.add('kilit');try{lenis&&lenis.stop()}catch(e){}
 setTimeout(()=>c.querySelector('.kapat').focus(),60)}
function cekmeceKapat(){const c=document.querySelector('.cekmece');if(!c||!c.classList.contains('acik'))return;c.classList.remove('acik');c.querySelector('.pan').setAttribute('aria-hidden','true');
 document.documentElement.classList.remove('kilit');try{lenis&&lenis.start()}catch(e){}
 if(_oncekiOdak&&_oncekiOdak.focus)_oncekiOdak.focus()}
/* Altbilgi bağlantılarının yanındaki küçük altın ikonlar (tek çizgi ailesi) */
const F_IKON={
 ev:'<path d="M3.6 10.4 12 4l8.4 6.4"/><path d="M5.7 9.4V19a.9.9 0 0 0 .9.9h3.3v-4.6h4.2v4.6h3.3a.9.9 0 0 0 .9-.9V9.4"/>',
 canta:'<path d="M5 7h14l-1.5 12h-11z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
 cerceve:'<rect x="4" y="4" width="16" height="16" rx="1.5"/><rect x="7.5" y="7.5" width="9" height="9" rx=".8"/>',
 kabe:'<path d="M4 8.5 12 5l8 3.5v9L12 21l-8-3.5z"/><path d="M4 11.5l8 3.5 8-3.5"/>',
 konum:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
 tel:'<path d="M6.6 3.6a1.6 1.6 0 0 1 2.2.6l1.4 2.5a1.6 1.6 0 0 1-.4 2l-1 .9a9.4 9.4 0 0 0 4.1 4.1l.9-1a1.6 1.6 0 0 1 2-.4l2.5 1.4a1.6 1.6 0 0 1 .6 2.2l-.8 1.4a2.6 2.6 0 0 1-2.9 1.2C9.8 19 5 14.2 3.6 8.4a2.6 2.6 0 0 1 1.2-2.9z"/>',
 wa:'<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.3 9.2c.3 1.9 1.6 3.4 3.5 4.1l1-1 1.6.8-.3 1.2c-2.8.3-6-2.6-6.2-5.3l1.2-.4.8 1.5z"/>',
 insta:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r=".6" fill="currentColor"/>'
};
const fl=(href,ik,ad,dis)=>`<a href="${href}"${dis?' target="_blank" rel="noopener"':''}><svg class="f-ik" viewBox="0 0 24 24" aria-hidden="true">${F_IKON[ik]}</svg><span>${ad}</span></a>`;
/* Menü, çekmece, sabit WhatsApp ve altbilgi */
function kabuk(aktif){
 const nav=document.createElement('nav');nav.className='nav';nav.setAttribute('aria-label','Ana menü');
 const on=k=>aktif===k?' class="on" aria-current="page"':'';
 nav.innerHTML=`<a class="logo" href="index.html" aria-label="${MAGAZA.ad}, ana sayfa"><img src="assets/logo-nav.png" alt="" width="128" height="31"></a>
 <a href="index.html" class="ev${aktif==='ana'?' on':''}"${aktif==='ana'?' aria-current="page"':''} aria-label="Ana sayfa" title="Ana sayfa"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.6 10.4 12 4l8.4 6.4"/><path d="M5.7 9.4V19a.9.9 0 0 0 .9.9h3.3v-4.6h4.2v4.6h3.3a.9.9 0 0 0 .9-.9V9.4"/></svg><span class="uzun">Ana Sayfa</span></a>
 <a href="urunler.html"${on('urun')}><span class="uzun">Ürünlerimiz</span><span class="kisa">Ürünler</span></a>
 <a href="tablolar.html"${on('tablo')}><span class="uzun">Tablo Eserleri</span><span class="kisa">Tablolar</span></a>
 <a href="iletisim.html"${on('ilet')}>İletişim</a>
 <a href="tur.html" class="tur${aktif==='tur'?' on':''}"${aktif==='tur'?' aria-current="page"':''}>Dijital Tur</a>`;
 document.body.prepend(nav);
 /* Dijital Tur'a parmak değdiği anda sayfayı önceden getir: dokunup bıraktığında
    sayfa hazır olsun, geçiş anında açılsın. (Sesin kendiliğinden başlaması ayrı
    bir konu: tarayıcı sesi, çalınacağı sayfadaki bir dokunuşa bağlıyor.) */
 if(aktif!=='tur'){
  const tl=nav.querySelector('a[href="tur.html"]');
  if(tl){const getir=()=>{if(tl._on)return;tl._on=1;
    const l=document.createElement('link');l.rel='prefetch';l.href='tur.html';document.head.append(l)};
   ['pointerdown','touchstart','mouseenter'].forEach(t=>tl.addEventListener(t,getir,{once:true,passive:true}))}
 }
 const ml=document.createElement('a');ml.className='mlogo';ml.href='index.html';ml.setAttribute('aria-label',MAGAZA.ad+', ana sayfa');ml.innerHTML='<img src="assets/logo-nav.png" alt="" width="128" height="31">';
 document.body.prepend(ml);
 const gec=document.createElement('a');gec.className='icerige-gec';gec.href='#icerik';gec.textContent='İçeriğe geç';document.body.prepend(gec);
 const ust=()=>ml.classList.toggle('gizli',scrollY>160);
 /* Telefonda kabuk: aşağı kaydırırken çekilir, yukarı kaydırınca / başta / sonda döner.
    Böylece menü ve WhatsApp düğmesi okunan metnin üstünü kapatmıyor. */
 let sonY=scrollY,birikim=0,bekle=false;
 const kabukDurum=()=>{
  const y=Math.max(0,scrollY),fark=y-sonY;sonY=y;
  if(innerWidth>720||document.documentElement.classList.contains('kilit')){
   document.body.classList.remove('kabuk-gizli');birikim=0;return}
  const dip=y+innerHeight>=document.documentElement.scrollHeight-80;
  if(y<140||dip){document.body.classList.remove('kabuk-gizli');birikim=0;return}
  birikim=(fark>0)===(birikim>0)?birikim+fark:fark;
  if(birikim>60)document.body.classList.add('kabuk-gizli');
  else if(birikim<-40)document.body.classList.remove('kabuk-gizli')};
 addEventListener('scroll',()=>{ust();if(bekle)return;bekle=true;
  requestAnimationFrame(()=>{kabukDurum();bekle=false})},{passive:true});
 ust();
 /* çekmece */
 const c=document.createElement('div');c.className='cekmece';
 c.innerHTML=`<div class="perde"></div><aside class="pan" role="dialog" aria-modal="true" aria-labelledby="cekmece-baslik" aria-hidden="true" data-lenis-prevent><div class="pan-bas"><h3 id="cekmece-baslik">Sepetim</h3><button type="button" class="kapat" aria-label="Sepeti kapat">×</button></div>
 <p class="pan-not">Seçtiğiniz ürünleri tek mesajla WhatsApp'tan gönderin; stok ve fiyatı teyit edip çantanızı mağazada hazırlayalım.</p>
 <div class="liste"></div>
 <div class="alt"><div class="toplam"><span>Ara toplam <small class="ozet-sayi"></small></span><b></b></div>
 <button class="btn wa" type="button" onclick="Sepet.gonder()">${WA_SVG}Sepetimi WhatsApp'tan gönder</button>
 <button class="bosalt" type="button">Sepeti boşalt</button></div></aside>`;
 document.body.append(c);
  c.querySelector('.perde').onclick=cekmeceKapat;c.querySelector('.kapat').onclick=cekmeceKapat;
 const bos=c.querySelector('.bosalt');
 bos.onclick=()=>{if(bos.classList.contains('emin')){bos.classList.remove('emin');bos.textContent='Sepeti boşalt';Sepet.bosalt();c.querySelector('.kapat').focus();return}
  bos.classList.add('emin');bos.textContent='Emin misiniz? Evet, boşalt';clearTimeout(bos._z);bos._z=setTimeout(()=>{bos.classList.remove('emin');bos.textContent='Sepeti boşalt'},4000)};
 c.addEventListener('click',e=>{
  const a=e.target.closest('[data-adet]');
  if(a){const id=a.dataset.adet,d=a.dataset.d;Sepet.ekle(id,+d);
   const ayni=c.querySelector(`[data-adet="${id}"][data-d="${d}"]`)||c.querySelector('[data-adet]')||c.querySelector('.kapat');ayni&&ayni.focus();return}
  const k=e.target.closest('[data-kaldir]');
  if(k){Sepet.kaldir(k.dataset.kaldir);const s=c.querySelector('[data-kaldir]')||c.querySelector('.bos a')||c.querySelector('.kapat');s&&s.focus();return}
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
 /* çanta düğmesi: menü yerine sağ altta, doluyken görünür */
 const sb=document.createElement('button');sb.type='button';sb.className='sepetbtn sepet-sabit';
 sb.setAttribute('aria-label','Sepetim, boş');
 sb.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 7h14l-1.5 11h-11z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><b aria-hidden="true">0</b>';
 sb.onclick=cekmeceAc;document.body.append(sb);
 /* sabit WhatsApp */
 const wa=document.createElement('a');wa.className='wa-sabit';wa.href='https://wa.me/'+WA+'?text='+encodeURIComponent('Merhaba, sitenizden yazıyorum.');wa.target='_blank';wa.rel='noopener';wa.setAttribute('aria-label',"WhatsApp'tan yazın");
 wa.innerHTML=WA_SVG;document.body.append(wa);
 /* tanıtım filmi düğmesi (WhatsApp'ın üstünde) */
 const fb=document.createElement('button');fb.type='button';fb.className='film-sabit';
 fb.setAttribute('aria-label','Tanıtım filmini izleyin');
 fb.innerHTML='<span class="ipucu">Tanıtım filmi</span>'+OYNAT_SVG;
 fb.addEventListener('click',filmAc);document.body.append(fb);
 /* Bölüm içindeki "tanıtım filmi" düğmeleri (telefonda yüzen düğme yerine bunlar kullanılır) */
 document.querySelectorAll('[data-film]').forEach(b=>b.addEventListener('click',filmAc));
 /* altbilgi */
 const f=document.querySelector('footer.sf');
 if(f){const notlar=[...f.querySelectorAll('.f-not')];
 f.innerHTML=`<div class="f-ust"><div class="f-blok"><a class="f-logo" href="index.html" aria-label="${MAGAZA.ad}, ana sayfa"><img src="assets/logo-alt.png" alt="" width="184" height="44" loading="lazy"></a><p>${MAGAZA.adres}<br>${MAGAZA.saat}</p></div>
 <nav class="f-blok f-menu" aria-label="Alt menü">${fl('index.html','ev','Ana Sayfa')}${fl('urunler.html','canta','Ürünlerimiz')}${fl('tablolar.html','cerceve','Tablo Eserleri')}${fl('tur.html','kabe','Dijital Umre Turu')}${fl('iletisim.html','konum','İletişim')}</nav>
 <div class="f-blok f-menu">${fl(MAGAZA.telLink,'tel',MAGAZA.tel)}${fl('https://wa.me/'+WA,'wa','WhatsApp',1)}${fl(MAGAZA.instagram,'insta','Instagram',1)}</div></div>
 <p class="f-telif">© ${new Date().getFullYear()} ${MAGAZA.ad}</p>`;
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
 /* Kaydırmaya bağlı ışık ve derinlik döngüsü: kaydırma durunca ve sekme arka plana geçince durur,
    böylece telefonun işlemcisi ve pili boşuna çalışmaz. */
 const metaller=[...document.querySelectorAll('.metal[data-isik]')];
 let calisiyor=false;
 const dongu=()=>{
  if(document.hidden){calisiyor=false;return}
  const hedef=scrollY,fark=hedef-yumusakY,son=Math.abs(fark)<.3;
  yumusakY=son?hedef:yumusakY+fark*.14;
  document.documentElement.style.setProperty('--sy',yumusakY.toFixed(1));
  for(const e of metaller){const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;
   const p=1-(r.top+r.height)/(innerHeight+r.height);
   e.style.setProperty('--isik',(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%')}
  if(son){calisiyor=false;return}
  requestAnimationFrame(dongu)};
 const uyandir=()=>{if(calisiyor||document.hidden)return;calisiyor=true;requestAnimationFrame(dongu)};
 addEventListener('scroll',uyandir,{passive:true});addEventListener('resize',uyandir);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)uyandir()});
 uyandir();
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('gel');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -6% 0px'});
 document.querySelectorAll('[data-gel]').forEach(e=>io.observe(e));
}

/* Damlacık arama kutusu (telefon). sayfa: .arama-yer içindeki .arama kullanılır.
   Eşik iki yönlüdür: yukarı çıkarken 10px'te tutunur, geri inerken 22px'te bırakır;
   böylece eşik çevresinde gidip gelip titremez. */
function damlaArama(){
 const yer=document.querySelector('.arama-yer'),kutu=yer&&yer.querySelector('.arama'),gir=kutu&&kutu.querySelector('input');
 if(!kutu||!gir)return;
 kutu.classList.add('damla');
 let sabit=false;
 const tel=()=>innerWidth<=720;
 const birak=()=>{sabit=false;kutu.classList.remove('acik','donuyor');kutu.style.width='';document.body.classList.remove('ara-sabit')};
 const tutun=()=>{
  const r=kutu.getBoundingClientRect();
  document.documentElement.style.setProperty('--damla-sag',Math.max(12,Math.round(innerWidth-r.right))+'px');
  sabit=true;
  /* Tutunduğu an, kutunun o anki genişliğiyle başla; sonraki karede damlaya küçül */
  kutu.classList.add('donuyor');kutu.style.width=r.width+'px';
  document.body.classList.add('ara-sabit');
  void kutu.offsetWidth;
  kutu.classList.remove('donuyor');
  requestAnimationFrame(()=>{kutu.style.width=''});
 };
 let bekle=false;
 const bak=()=>{bekle=false;
  if(!tel()){if(sabit)birak();return}
  const t=yer.getBoundingClientRect().top;
  if(!sabit&&t<=10)tutun();
  else if(sabit&&t>22&&!kutu.classList.contains('acik'))birak();
  else if(sabit&&t>22&&kutu.classList.contains('acik')&&document.activeElement!==gir)birak();
 };
 addEventListener('scroll',()=>{if(bekle)return;bekle=true;requestAnimationFrame(bak)},{passive:true});
 addEventListener('resize',()=>{if(!tel()&&sabit)birak();bak()});
 /* Küçük hâline dokununca açılır ve imleç kutuya girer */
 const ac=()=>{if(sabit)kutu.classList.add('acik')};
 const kapa=()=>{if(!gir.value.trim())kutu.classList.remove('acik')};
 kutu.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;ac();
  if(document.activeElement!==gir)setTimeout(()=>gir.focus(),10)});
 gir.addEventListener('focus',ac);
 gir.addEventListener('blur',()=>setTimeout(kapa,160));
 let sonY=scrollY;
 addEventListener('scroll',()=>{if(Math.abs(scrollY-sonY)<40)return;sonY=scrollY;
  /* Yazarken kapanmaz: iOS klavyeyi açarken sayfayı kaydırıyor */
  if(document.activeElement===gir)return;
  if(kutu.classList.contains('acik'))kapa()},{passive:true});
 bak();
}

/* Arama sonuçları: sonuç gelince listenin başı görünür olsun; Enter / Ara tuşunda
   klavye de kapansın. Telefonda sağ üstteki arama damlasının altında kalacak şekilde. */
function aramaSonucunaGit(gir,hedef,klavyeKapat){
 if(!hedef)return;
 if(klavyeKapat&&gir)gir.blur();
 const ust=innerWidth<=720?66:96;
 const y=hedef.getBoundingClientRect().top+scrollY-ust;
 /* Zaten görünür ve yakınsa kaydırma yapma (yazarken sayfa zıplamasın) */
 const r=hedef.getBoundingClientRect();
 if(!klavyeKapat&&r.top>=ust-4&&r.top<innerHeight*.45)return;
 if(window.lenis)lenis.scrollTo(Math.max(0,y),{duration:.6});else scrollTo({top:Math.max(0,y),behavior:'smooth'});
}
function aramaKlavyesi(gir,hedef){
 if(!gir)return;
 gir.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setTimeout(()=>aramaSonucunaGit(gir,hedef(),true),160)}});
}
