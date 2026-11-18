/* İstanbul Hac Umre Hediyelik — ortak betik */
const WA='905551044040';
const KATEGORILER=[
 {ad:'Hac Umre Malzemeleri',kisa:'Malzemeler',gorsel:'assets/g/masa.jpg',acik:'İhram, kemer, terlik, bel çantası ve yolculukta gereken her şey.'},
 {ad:'Hac Umre Kıyafetleri',kisa:'Kıyafetler',gorsel:'assets/g/ihram.jpg',acik:'Erkek ve kadın için rahat, nefes alan, tesettüre uygun kıyafetler.'},
 {ad:'İslami Hediyelik',kisa:'Hediyelik',gorsel:'assets/g/donus.jpg',acik:'Tesbih, seccade, esans ve özenle hazırlanmış hediye paketleri.'},
 {ad:'Hurma ve Zemzem',kisa:'Hurma ve Zemzem',gorsel:'assets/g/hurma.jpg',acik:'Seçme Medine hurmaları ve dönüş ikramları için zemzem.'}
];
/* Örnek ürünler — gerçek liste gelince değişecek */
const URUNLER=window.URUNLER||[
 {id:'ihram-havlu',ad:'Havlu İhram Takımı',fiyat:450,kat:'Hac Umre Kıyafetleri',gorsel:'assets/g/ihram.jpg',acik:'Pamuklu, nefes alan iki parça havlu ihram.'},
 {id:'ferace',ad:'Umre Feracesi',fiyat:900,kat:'Hac Umre Kıyafetleri',gorsel:'assets/g/muslin.jpg',acik:'Hafif, bol kesim ve terletmeyen kumaş.'},
 {id:'esarp',ad:'Pamuklu Eşarp',fiyat:250,kat:'Hac Umre Kıyafetleri',gorsel:'assets/g/muslin.jpg',acik:'Nefes alan pamuklu eşarp.'},
 {id:'ihram-kemer',ad:'İhram Kemeri',fiyat:180,kat:'Hac Umre Malzemeleri',gorsel:'assets/g/masa.jpg',acik:'Fermuarlı cepli, ayarlanabilir kemer.'},
 {id:'terlik',ad:'İhram Terliği',fiyat:220,kat:'Hac Umre Malzemeleri',gorsel:'assets/g/masa.jpg',acik:'Topuğu ve üstü açık, kaymaz taban.'},
 {id:'bel-cantasi',ad:'Boyun / Bel Çantası',fiyat:280,kat:'Hac Umre Malzemeleri',gorsel:'assets/g/masa.jpg',acik:'Pasaport ve para için gizli bölmeli.'},
 {id:'kokusuz-sabun',ad:'Kokusuz Bakım Seti',fiyat:200,kat:'Hac Umre Malzemeleri',gorsel:'assets/g/zemzem.jpg',acik:'İhramlıyken kullanılabilen kokusuz sabun ve şampuan.'},
 {id:'seccade',ad:'Seyahat Seccadesi',fiyat:300,kat:'İslami Hediyelik',gorsel:'assets/g/donus.jpg',acik:'Katlanır, hafif cep seccadesi.'},
 {id:'tesbih',ad:'Tesbih',fiyat:120,kat:'İslami Hediyelik',gorsel:'assets/g/donus.jpg',acik:'33\'lük, püsküllü tesbih.'},
 {id:'hurma',ad:'Medine Hurması 1 kg',fiyat:650,kat:'Hurma ve Zemzem',gorsel:'assets/g/hurma.jpg',acik:'Seçme Medine hurması.'},
 {id:'zemzem',ad:'Zemzem 5 L',fiyat:400,kat:'Hurma ve Zemzem',gorsel:'assets/g/zemzem.jpg',acik:'Hediye için zemzem.'}
];
const TL=n=>n.toLocaleString('tr-TR')+' ₺';
const depo={al(k,v){try{return JSON.parse(localStorage.getItem(k)||v)}catch(e){return JSON.parse(v)}},yaz(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
/* Sepet */
const Sepet={
 al(){return depo.al('hu_sepet','{}')},
 yaz(s){depo.yaz('hu_sepet',s);Sepet.ciz();document.dispatchEvent(new CustomEvent('sepet'))},
 ekle(id,n=1){const s=Sepet.al();s[id]=(s[id]||0)+n;if(s[id]<=0)delete s[id];Sepet.yaz(s)},
 adet(id){return Sepet.al()[id]||0},
 sayi(){return Object.values(Sepet.al()).reduce((a,b)=>a+b,0)},
 kalemler(){const s=Sepet.al();return Object.keys(s).map(id=>({u:URUNLER.find(u=>u.id===id),n:s[id]})).filter(k=>k.u)},
 toplam(){return Sepet.kalemler().reduce((a,{u,n})=>a+u.fiyat*n,0)},
 waMetin(){const k=Sepet.kalemler();let t='Merhaba, sitenizden umre çantamı hazırladım. Aşağıdaki ürünler için bilgi ve teklif almak istiyorum:\n\n';
  k.forEach(({u,n})=>{t+=`• ${u.ad} × ${n} — ${TL(u.fiyat*n)}\n`});return t+`\nAra toplam: ${TL(Sepet.toplam())}`},
 gonder(){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(Sepet.waMetin()),'_blank','noopener')},
 ciz(){
  const b=document.querySelector('.sepetbtn b');if(b){const n=Sepet.sayi();b.textContent=n;b.classList.toggle('var',n>0)}
  const L=document.querySelector('.cekmece .liste');if(!L)return;const k=Sepet.kalemler();
  document.querySelector('.cekmece .alt').hidden=!k.length;
  if(!k.length){L.innerHTML='<div class="bos"><p>Çantanız henüz boş.</p><a class="btn cam" href="urunler.html">Ürünlere göz atın</a></div>';return}
  L.innerHTML=k.map(({u,n})=>`<div class="satir"><img src="${u.gorsel||'assets/lale.png'}" alt=""><div><div class="ad">${u.ad}</div><small>${TL(u.fiyat)}</small></div>
  <div class="adet"><button type="button" aria-label="Azalt" onclick="Sepet.ekle('${u.id}',-1)">−</button><b>${n}</b><button type="button" aria-label="Artır" onclick="Sepet.ekle('${u.id}',1)">+</button></div></div>`).join('');
  document.querySelector('.cekmece .toplam b').textContent=TL(Sepet.toplam())}
};
function toast(m,eylem){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.append(t)}
 t.innerHTML='<span>'+m+'</span>'+(eylem?'<button type="button">'+eylem[0]+'</button>':'');
 if(eylem)t.querySelector('button').onclick=eylem[1];
 t.classList.add('on');clearTimeout(t._z);t._z=setTimeout(()=>t.classList.remove('on'),2600)}
/* Ürün görselini sepete uçur, sepet zıplasın */
function sepeteUcur(kaynak){
 const hedef=document.querySelector('.sepetbtn');if(!hedef||!kaynak)return;
 const a=kaynak.getBoundingClientRect(),b=hedef.getBoundingClientRect();
 const k=document.createElement('img');k.src=kaynak.currentSrc||kaynak.src||'assets/lale.png';k.className='ucan';
 const s=Math.min(a.width,a.height,160);
 Object.assign(k.style,{left:(a.left+a.width/2-s/2)+'px',top:(a.top+a.height/2-s/2)+'px',width:s+'px',height:s+'px'});
 document.body.append(k);
 const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
 const an=k.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-80}px) scale(.55)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.12)`,opacity:.4}],{duration:750,easing:'cubic-bezier(.5,0,.3,1)'});
 an.onfinish=()=>{k.remove();hedef.classList.remove('zipla');void hedef.offsetWidth;hedef.classList.add('zipla')};
}
function cekmeceAc(){document.querySelector('.cekmece')?.classList.add('acik')}
/* Menü + çekmece */
function kabuk(aktif){
 const nav=document.createElement('nav');nav.className='nav';nav.setAttribute('aria-label','Ana menü');
 nav.innerHTML=`<a class="logo" href="index.html" aria-label="İstanbul Hac Umre Hediyelik, ana sayfa"><img src="assets/logo-acik.png" alt="İstanbul Hac Umre Hurma Hediyelik"></a>
 <a href="index.html" ${aktif=='ana'?'class="on" aria-current="page"':''}>Ana Sayfa</a>
 <a href="urunler.html" ${aktif=='urun'?'class="on" aria-current="page"':''}>Ürünlerimiz</a>
 <a href="iletisim.html" ${aktif=='ilet'?'class="on" aria-current="page"':''}>İletişim</a>
 <a href="tur.html" class="tur${aktif=='tur'?' on':''}" ${aktif=='tur'?'aria-current="page"':''}>Dijital Tur</a>
 <button class="sepetbtn" type="button" aria-label="Çantam"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7h14l-1.5 11h-11z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><b>0</b></button>`;
 document.body.prepend(nav);
 const ml=document.createElement('a');ml.className='mlogo';ml.href='index.html';ml.setAttribute('aria-label','Ana sayfa');ml.innerHTML='<img src="assets/logo-acik.png" alt="İstanbul Hac Umre Hurma Hediyelik">';
 document.body.prepend(ml);
 addEventListener('scroll',()=>ml.classList.toggle('gizli',scrollY>160),{passive:true});
 const c=document.createElement('div');c.className='cekmece';
 c.innerHTML=`<div class="perde"></div><aside class="pan" aria-label="Çantam"><div class="pan-bas"><h3>Çantam</h3><button type="button" class="kapat" aria-label="Kapat">×</button></div>
 <p class="pan-not">Seçtiğiniz ürünleri tek mesajla WhatsApp'tan gönderin; stok ve fiyatı teyit edip çantanızı hazırlayalım.</p>
 <div class="liste"></div>
 <div class="alt"><div class="toplam"><span>Ara toplam</span><b></b></div>
 <button class="btn wa" type="button" onclick="Sepet.gonder()"><svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.8 15.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5l-.2-.3z"/></svg>Çantamı WhatsApp'tan gönder</button></div></aside>`;
 document.body.append(c);
 const kapat=()=>c.classList.remove('acik');
 nav.querySelector('.sepetbtn').onclick=cekmeceAc;
 c.querySelector('.perde').onclick=kapat;c.querySelector('.kapat').onclick=kapat;
 addEventListener('keydown',e=>{if(e.key==='Escape')kapat()});
 Sepet.ciz();
}
/* Yumuşak kaydırma (Lenis) */
let lenis=null,yumusakY=scrollY;
function akisKur(){
 if(window.Lenis&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  lenis=new Lenis({lerp:.085,wheelMultiplier:.9,smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}
 const dongu=()=>{yumusakY+=(scrollY-yumusakY)*.14;document.documentElement.style.setProperty('--sy',yumusakY.toFixed(1));
  document.querySelectorAll('.metal[data-isik]').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const p=1-(r.top+r.height)/(innerHeight+r.height);
   e.style.setProperty('--isik',(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%')});
  requestAnimationFrame(dongu)};dongu();
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('gel');io.unobserve(e.target)}}),{threshold:.12});
 document.querySelectorAll('[data-gel]').forEach(e=>io.observe(e));
}
