/* İstanbul Hac Umre Hediyelik — ortak betik */
const WA='905551044040';
const URUNLER=window.URUNLER||[
 {id:'ihram-havlu',ad:'Havlu İhram Takımı',fiyat:450,kat:'İhram',cins:'e',gorsel:'',acik:'Pamuklu, nefes alan iki parça havlu ihram.'},
 {id:'ihram-kemer',ad:'İhram Kemeri',fiyat:180,kat:'İhram',cins:'e',gorsel:'',acik:'Fermuarlı cepli, ayarlanabilir kemer.'},
 {id:'terlik',ad:'İhram Terliği',fiyat:220,kat:'İhram',cins:'ek',gorsel:'',acik:'Topuğu ve üstü açık, kaymaz taban.'},
 {id:'ferace',ad:'Umre Feracesi',fiyat:900,kat:'Kadın',cins:'k',gorsel:'',acik:'Hafif, bol kesim ve terletmeyen kumaş.'},
 {id:'esarp',ad:'Pamuklu Eşarp',fiyat:250,kat:'Kadın',cins:'k',gorsel:'',acik:'Nefes alan pamuklu eşarp.'},
 {id:'seccade',ad:'Seyahat Seccadesi',fiyat:300,kat:'İbadet',cins:'ek',gorsel:'',acik:'Katlanır, hafif cep seccadesi.'},
 {id:'tesbih',ad:'Tavaf Tesbihi',fiyat:120,kat:'İbadet',cins:'ek',gorsel:'',acik:'Sayaçlı, 33\'lük tesbih.'},
 {id:'bel-cantasi',ad:'Boyun / Bel Çantası',fiyat:280,kat:'Yolculuk',cins:'ek',gorsel:'',acik:'Pasaport ve para için gizli bölmeli.'},
 {id:'kokusuz-sabun',ad:'Kokusuz Bakım Seti',fiyat:200,kat:'Yolculuk',cins:'ek',gorsel:'',acik:'İhramlıyken kullanılabilen kokusuz sabun ve şampuan.'},
 {id:'hurma',ad:'Medine Hurması 1 kg',fiyat:650,kat:'Hediyelik',cins:'ek',gorsel:'',acik:'Seçme Medine hurması.'},
 {id:'zemzem',ad:'Zemzem 5 L',fiyat:400,kat:'Hediyelik',cins:'ek',gorsel:'',acik:'Hediye için zemzem.'}
];
const TL=n=>n.toLocaleString('tr-TR')+' ₺';
/* Sepet: localStorage */
const Sepet={
 al(){try{return JSON.parse(localStorage.getItem('hu_sepet')||'{}')}catch(e){return{}}},
 yaz(s){localStorage.setItem('hu_sepet',JSON.stringify(s));Sepet.ciz()},
 ekle(id,n=1){const s=Sepet.al();s[id]=(s[id]||0)+n;if(s[id]<=0)delete s[id];Sepet.yaz(s)},
 koy(id,var_){const s=Sepet.al();if(var_)s[id]=s[id]||1;else delete s[id];Sepet.yaz(s)},
 sayi(){return Object.values(Sepet.al()).reduce((a,b)=>a+b,0)},
 kalemler(){const s=Sepet.al();return Object.keys(s).map(id=>({u:URUNLER.find(u=>u.id===id),n:s[id]})).filter(k=>k.u)},
 waMetin(baslik){const k=Sepet.kalemler();let t=(baslik||'Merhaba, şu ürünler için teklif almak istiyorum:')+'\n\n';
  let top=0;k.forEach(({u,n})=>{t+=`• ${u.ad} × ${n} — ${TL(u.fiyat*n)}\n`;top+=u.fiyat*n});
  return t+`\nToplam: ${TL(top)}`},
 gonder(b){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(Sepet.waMetin(b)),'_blank')},
 ciz(){const b=document.querySelector('.sepetbtn b');if(b){const n=Sepet.sayi();b.textContent=n;b.classList.toggle('var',n>0)}
  const L=document.querySelector('.cekmece .liste');if(!L)return;const k=Sepet.kalemler();
  if(!k.length){L.innerHTML='<p class="bos">Sepetiniz boş.</p>';document.querySelector('.cekmece .toplam span:last-child').textContent=TL(0);return}
  L.innerHTML=k.map(({u,n})=>`<div class="satir"><img src="${u.gorsel||'assets/logo.png'}" alt=""><div><div>${u.ad}</div><small style="opacity:.6">${TL(u.fiyat)}</small></div>
  <div class="adet"><button onclick="Sepet.ekle('${u.id}',-1)">−</button>${n}<button onclick="Sepet.ekle('${u.id}',1)">+</button></div></div>`).join('');
  document.querySelector('.cekmece .toplam span:last-child').textContent=TL(k.reduce((a,{u,n})=>a+u.fiyat*n,0))}
};
function toast(m){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.append(t)}
 t.textContent=m;t.classList.add('on');clearTimeout(t._z);t._z=setTimeout(()=>t.classList.remove('on'),1800)}
/* Menü + çekmece */
function kabuk(aktif){
 const nav=document.createElement('nav');nav.className='nav';
 nav.innerHTML=`<a class="logo" href="index.html">İstanbul Hac Umre</a>
 <a href="index.html" ${aktif=='ana'?'class="on"':''}>Ana Sayfa</a>
 <a href="urunler.html" ${aktif=='urun'?'class="on"':''}>Ürünlerimiz</a>
 <a href="iletisim.html" ${aktif=='ilet'?'class="on"':''}>İletişim</a>
 <a href="tur.html" class="tur">Dijital Tur</a>
 <button class="sepetbtn" aria-label="Sepet"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7h14l-1.5 11h-11z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><b>0</b></button>`;
 document.body.prepend(nav);
 const c=document.createElement('div');c.className='cekmece';
 c.innerHTML=`<div class="perde"></div><div class="pan"><h3>Sepetim</h3><div class="liste"></div>
 <div class="toplam"><span>Toplam</span><span></span></div>
 <button class="btn wa" onclick="Sepet.kalemler().length?Sepet.gonder():toast('Önce ürün ekleyin')">WhatsApp ile teklif iste</button></div>`;
 document.body.append(c);
 nav.querySelector('.sepetbtn').onclick=()=>c.classList.add('acik');
 c.querySelector('.perde').onclick=()=>c.classList.remove('acik');
 Sepet.ciz();
}
/* Yumuşak kaydırma (Lenis) + yumuşatılmış ilerleme değeri */
let lenis=null,yumusakY=scrollY;
function akisKur(){
 if(window.Lenis&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  lenis=new Lenis({lerp:.085,wheelMultiplier:.9,smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}
 const dongu=()=>{yumusakY+=(scrollY-yumusakY)*.14;document.documentElement.style.setProperty('--sy',yumusakY.toFixed(1));
  document.querySelectorAll('.metal[data-isik]').forEach(e=>{const r=e.getBoundingClientRect();const p=1-(r.top+r.height)/(innerHeight+r.height);
   e.style.setProperty('--isik',(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%')});
  requestAnimationFrame(dongu)};dongu();
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('gel');io.unobserve(e.target)}}),{threshold:.15});
 document.querySelectorAll('[data-gel]').forEach(e=>io.observe(e));
}
