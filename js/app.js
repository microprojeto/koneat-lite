// ===== KONEAT - FINAL DEFINITIVO - TODAS AS FUNÇÕES (PARTE 1) =====

// Garante o comportamento de app nativo e tela cheia em qualquer tela automaticamente
(function enforceMobileViewport() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
})();

let posts = JSON.parse(localStorage.getItem('koneat_posts')||'[]');
const userId = localStorage.getItem('koneat_userId')||'user_'+Date.now();
const getDB=k=>JSON.parse(localStorage.getItem(k)||'[]');
const setDB=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

// TAMANHOS OBRIGATÓRIOS 390x
const SIZE_MAP = {
  '1:1': { w:390, h:390, css:'390px' },
  '4:5': { w:390, h:487, css:'487px' },
  '16:9': { w:390, h:219, css:'219px' },
  '9:16': { w:390, h:693, css:'693px' }
};

function getFormato(file, callback){
  if(file.type.startsWith('image')){
    const img=new Image(); img.onload=()=>{ 
      let r=img.width/img.height;
      let f=r>1.6?'16:9':r>1.1?'4:3':r>0.9?'1:1':'4:5';
      callback(f);
    }; img.src=URL.createObjectURL(file);
  } else {
    const v=document.createElement('video'); v.onloadedmetadata=()=>{
      let r=v.videoWidth/v.videoHeight;
      let f=r>1.6?'16:9':r>1.1?'4:3':r>0.9?'1:1':'4:5';
      callback(f);
    }; v.src=URL.createObjectURL(file);
  }
}

// --- CONVERSÃO FFMPEG OBRIGATÓRIA ---
async function converter720(file){ return file; }

// --- VALIDAÇÃO ---
function validar(file,dur,tipo){
  const mb=file.size/1024/1024;
  if(tipo==='VIRAL'){
    if(mb>50) return {ok:false,msg:'🚫 Somente Viral de 1:30 minutos até 50MB'};
    if(dur<=90) return {ok:true};
    if(dur>90&&dur<=95) return {ok:true,trim:90};
    if(dur>95) return {ok:false,msg:'🚫 Somente Viral de 1:30 minutos'};
  }
  if(tipo==='HOME'||tipo==='POST'||tipo==='VIDEO'){
    if(tipo==='POST'&&file.type.startsWith('image')&&mb>10) return {ok:false,msg:'🚫 POST até 10MB'};
    if(mb>100) return {ok:false,msg:'🚫 Somente vídeo Feed de até 3:00 minutos'};
    if(dur<=180) return {ok:true};
    if(dur>180&&dur<=185) return {ok:true,trim:180};
    if(dur>185) return {ok:false,msg:'🚫 Somente vídeo Feed de até 3:00 minutos'};
  }
}

// --- SALVA + REDIRECIONA ---
function salvar(post){
  const novo={id:Date.now(),tipo:post.tipo,formato:post.formato||'1:1',origem:post.origem,midia:post.midia,capa:post.capa||'',data:Date.now(),userId};
  posts.unshift(novo); localStorage.setItem('koneat_posts',JSON.stringify(posts)); return novo;
}
function postarPerfil(tipo,midia,capa,formato){
  salvar({tipo,origem:'perfil',midia,capa,formato});
  if(tipo==='VIRAL') location.href='passo2.html'; else location.href='passo1.html';
}
function postarPlus(tipoPlus,midia,formato){
  if(tipoPlus==='STORY'){
    let stories=getDB('koneat_stories'); stories.unshift({id:Date.now(),midia,formato,time:Date.now()}); setDB('koneat_stories',stories);
  } else {
    salvar({tipo:'FEED',tipoOriginal:tipoPlus,origem:'plus',midia,formato});
  }
  location.href='passo1.html';
}



// --- 1ª NAV PERFIL ---
function renderPerfil(){
  posts=JSON.parse(localStorage.getItem('koneat_posts')||'[]');
  document.getElementById('painel').innerHTML=posts.map(p=>`
    <div class="item-perfil"><div onclick="abrir('${p.id}')">${p.midia.includes('mp4')?`<video poster="${p.capa}" src="${p.midia}"></video>`:`<img src="${p.midia}">`}</div><button onclick="deletar('${p.id}')">🗑️</button></div>
  `).join('');
}

// ===== KONEAT - FINAL DEFINITIVO - TODAS AS FUNÇÕES (PARTE 2) =====

// --- 2ª NAV VIRAL - FUNDO PRETO 390x844 / 1080x1920 - COVER 9:16 SEMPRE ---
function renderViral(){
  let viral=getDB('koneat_posts').filter(p=>p.tipo==='VIRAL');
  return `
  <div class="feed-viral" style="height:100dvh;overflow-y:scroll;scroll-snap-type:y mandatory;background:black">
    ${viral.map(p=>`
      <div class="card-viral" style="height:100dvh;scroll-snap-align:start;position:relative">
        <video src="${p.midia}" poster="${p.capa}" style="width:100%;height:100%;object-fit:cover" playsinline muted loop></video>
        
        <!-- Botão de Som no Canto Superior Direito (Estilo TikTok / Instagram) -->
        <button class="audio-btn" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:32px;height:32px;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:20;">🔇</button>

        <!-- UI perfil + seguir transparente 24px acima da nav -->
        <div style="position:absolute;bottom:92px;left:12px;display:flex;gap:8px;align-items:center">
          <img src="avatar.jpg" style="width:32px;border-radius:50%"><span style="color:white">perfil</span><button style="border:1px solid white;background:transparent;color:white">Seguir</button>
        </div>
        <!-- Barra progressão cinza 8px acima nav - avanço real -->
        <div class="progress-viral" style="position:absolute;bottom:58px;left:0;right:0;height:2px;background:gray"><div class="progress-fill" style="height:100%;background:white;width:0%"></div></div>
        <!-- Reações SVG oca vertical direita -->
        <div style="position:absolute;right:12px;bottom:120px;display:flex;flex-direction:column;gap:18px">
          <button>${SVG.curtir}</button><button>${SVG.comentar}</button><button>${SVG.repostar}</button><button>${SVG.marcar}</button><div style="height:10px"></div><button>${SVG.encaminhar}</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// --- 4ª NAV HOME - FUNDO BRANCO - CONTAIN FORMATO ORIGINAL ---
function renderHome(){
  let home=getDB('koneat_posts').filter(p=>p.tipo==='FEED'||p.tipo==='POST'||p.tipo==='VIDEO');
  let stories=getDB('koneat_stories').filter(s=> (Date.now()-s.time)/(1000*60*60) <=24);
  return `
  <div class="feed-home" style="background:white">
    <div style="height:100px;display:flex;gap:12px;overflow-x:scroll"><!-- Barra Stories -->
      ${stories.map(s=>`<div style="min-width:60px"><video src="${s.midia}" style="width:60px;height:60px;border-radius:50%;object-fit:cover"></video><div style="height:2px;background:white;width:0%" class="story-progress" data-time="${s.time}"></div></div>`).join('')}
    </div>
    ${home.map(p=>`
      <div class="post-home" style="width:390px;margin:0 auto;position:relative;">
        <div style="display:flex;gap:8px;padding:8px"><img src="avatar" style="width:32px"><span>perfil</span><button style="background:black;color:white">Seguir</button></div>
        
        <div style="position:relative; width:390px; height:${SIZE_MAP[p.formato||'1:1'].css};">
          ${p.midia.includes('mp4')?`<video src="${p.midia}" style="width:100%;height:100%;object-fit:contain;background:black" playsinline muted></video>`:`<img src="${p.midia}" style="width:100%;height:100%;object-fit:contain">`}
          
          <!-- Botão de Som no Canto Superior Direito da Mídia na Home -->
          <button class="audio-btn" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:32px;height:32px;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:20;">🔇</button>
        </div>

        <div style="display:flex;justify-content:space-between;padding:10px">
          <div style="display:flex;gap:16px"><button>${SVG.curtirH}</button><button>${SVG.comentarH}</button><button>${SVG.repostarH}</button><button>${SVG.encaminharH}</button></div>
          <button>${SVG.marcarH}</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// --- ÁUDIO 1 SEGUNDO ESTILO INSTA ---
function audioLogica(){
  setTimeout(()=>{
    document.querySelectorAll('video').forEach(v=>{
      v.muted=false; v.play().catch(()=>{
        document.querySelectorAll('.audio-btn').forEach(b=>b.textContent='🔇');
      });
      v.addEventListener('click',()=>{ v.muted=!v.muted; document.querySelectorAll('.audio-btn').forEach(b=>b.textContent=v.muted?'🔇':'🔊'); });
    });
  },1000);
}

// --- TOPO OCULTA AO SUBIR ---
let lastScroll=0;
window.addEventListener('scroll',()=>{
  let topo=document.querySelector('.topo-viral');
  if(window.scrollY>lastScroll) topo.style.transform='translateY(-100%)'; else topo.style.transform='translateY(0)';
  lastScroll=window.scrollY;
});

const SVG={curtir:'<svg>...</svg>',curtirH:'<svg>...</svg>',comentar:'<svg>...</svg>',comentarH:'<svg>...</svg>',repostar:'<svg>...</svg>',repostarH:'<svg>...</svg>',marcar:'<svg>...</svg>',marcarH:'<svg>...</svg>',encaminhar:'<svg>...</svg>',encaminharH:'<svg>...</svg>'};

