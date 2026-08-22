(() => {
  const LOOP = 180000;
  const scenes = [['opening',0,16000],['labubu',16000,48000],['spider',48000,84000],['football',84000,120000],['mixed',120000,150000],['finale',150000,180000]];
  const zone = document.getElementById('photoZone');
  const finale = document.getElementById('finale');
  const bar = document.getElementById('progressBar');
  const badge = document.getElementById('liveBadge');
  const api = window.MaxwellPhotos;
  const cfg = window.MAXWELL_CONFIG || {};

  if (matchMedia('(max-width: 760px)').matches) document.body.dataset.viewerMobile = '1';

  function cardSvg(bg1,bg2,label,sub,icon){
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="1000" height="750" rx="42" fill="url(#g)"/><circle cx="170" cy="130" r="110" fill="white" opacity=".12"/><circle cx="850" cy="620" r="190" fill="white" opacity=".08"/><text x="500" y="305" text-anchor="middle" fill="white" font-family="Arial" font-size="92" font-weight="900">${label}</text><text x="500" y="388" text-anchor="middle" fill="white" opacity=".95" font-family="Arial" font-size="46" font-weight="800">${sub}</text><text x="500" y="500" text-anchor="middle" fill="white" font-size="120">${icon}</text></svg>`);
  }

  const defaults = [
    cardSvg('#f48fb7','#7c3657','LABUBU','PARTY MODE','✦'),
    cardSvg('#4b78f1','#172c6a','SPIDER-MAN','SWING MODE','🕸️'),
    cardSvg('#f2ba48','#7a4c1d','LABUBU','SPIDER SUIT','⚽'),
    cardSvg('#5c9aff','#1a3c8c','SPIDER-MAN','ACTION SHOT','🕷️'),
    cardSvg('#d46f9c','#6f2a4a','LABUBU','SUPER KICK','⚽'),
    cardSvg('#4bc37a','#155939','PARTY','MATCH DAY','⚽'),
    cardSvg('#aa79da','#4f2d78','MAXWELL','HAPPY BIRTHDAY','✦')
  ];

  let pool = [...defaults];
  let nextPoolIndex = 0;
  let nextCardIndex = 0;

  function renderCards() {
    zone.innerHTML='';
    for(let i=0;i<5;i++){
      const f=document.createElement('figure');
      f.className=`photo p${i}`;
      const src=pool[i%pool.length];
      f.innerHTML=`<img src="${src}" alt="Birthday photo">`;
      f.querySelector('img').addEventListener('error',()=>{ f.querySelector('img').src=defaults[i%defaults.length]; },{once:true});
      zone.appendChild(f);
    }
    nextPoolIndex=5%pool.length; nextCardIndex=0;
  }

  function swapOne(forceUrl) {
    const cards=[...zone.children]; if(!cards.length)return;
    const card=cards[nextCardIndex%cards.length];
    const src=forceUrl || pool[nextPoolIndex%pool.length];
    nextCardIndex++; nextPoolIndex++;
    card.classList.add('swapping');
    setTimeout(()=>{
      const img=card.querySelector('img');
      img.onerror=()=>{ img.onerror=null; img.src=defaults[nextCardIndex%defaults.length]; };
      img.src=src;
      card.classList.remove('swapping');
    },260);
  }

  function shuffle(){[...zone.children].forEach(x=>{x.style.translate=`${(Math.random()-.5)*2.5}vw ${(Math.random()-.5)*2.5}vh`;x.style.rotate=`${(Math.random()-.5)*3}deg`})}

  async function hydrateCloud(){
    if(!api?.ready){ badge.textContent='DEMO PHOTO WALL'; return; }
    try{
      const cloud=await api.listPhotos(200);
      pool=cloud.length ? [...cloud, ...defaults] : [...defaults];
      renderCards();
      badge.textContent='LIVE PHOTO WALL'; badge.classList.add('live');
      api.subscribe(row=>{
        if(!row?.public_url)return;
        pool=[row.public_url, ...pool.filter(x=>x!==row.public_url)];
        swapOne(row.public_url);
        badge.textContent='NEW PHOTO'; badge.classList.remove('new-photo'); void badge.offsetWidth; badge.classList.add('new-photo');
        setTimeout(()=>badge.textContent='LIVE PHOTO WALL',1400);
      });
    }catch(err){ console.error(err); badge.textContent='PHOTO WALL OFFLINE'; }
  }

  function scene(id){
    const all=[...document.querySelectorAll('.scene')]; document.body.className=''; finale.classList.remove('active');
    if(id==='opening'){document.body.classList.add('mode-opening');all.forEach(x=>x.classList.add('active'))}
    else{all.forEach(x=>x.classList.toggle('active',x.dataset.scene===id));if(id==='labubu')document.body.classList.add('mode-labubu');if(id==='spider')document.body.classList.add('mode-spider');if(id==='football')document.body.classList.add('mode-football');if(id==='mixed')document.body.classList.add('mode-mixed');if(id==='finale'){finale.classList.add('active');document.body.classList.add('mode-finale')}}
    if(id==='opening'||id==='mixed'||id==='spider')shuffle();
  }

  const q=new URLSearchParams(location.search); const offset=Math.max(0,Math.min(179999,Number(q.get('t')||0)*1000)); const start=performance.now()-offset; let cur='';
  function tick(now){const t=(now-start)%LOOP;const s=scenes.find(x=>t>=x[1]&&t<x[2])||scenes[0];if(s[0]!==cur){cur=s[0];scene(cur)}bar.style.width=`${t/LOOP*100}%`;requestAnimationFrame(tick)}

  const conf=document.getElementById('confetti');const cs=['#ffd166','#ef476f','#74d3ae','#6b8cff','#fff','#f2a6d4'];for(let i=0;i<52;i++){const e=document.createElement('i');e.className='confetti';e.style.left=`${Math.random()*100}%`;e.style.background=cs[i%cs.length];e.style.animationDuration=`${8+Math.random()*9}s`;e.style.animationDelay=`${-Math.random()*12}s`;e.style.setProperty('--dx',`${-9+Math.random()*18}vw`);conf.appendChild(e)}

  const audio=document.getElementById('birthdayAudio');const soundBtn=document.getElementById('soundBtn');const soundHint=document.getElementById('soundHint');audio.volume=.82;let soundStarted=false;
  async function startSound(){try{await audio.play();soundStarted=true;soundBtn.classList.add('playing');soundBtn.textContent='🔊 SOUND ON';soundBtn.setAttribute('aria-pressed','true');soundHint.classList.remove('show')}catch(e){soundHint.classList.add('show')}}
  function stopSound(){audio.pause();soundStarted=false;soundBtn.classList.remove('playing');soundBtn.textContent='🔇 SOUND';soundBtn.setAttribute('aria-pressed','false')}
  soundBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();soundStarted?stopSound():startSound()});
  document.addEventListener('pointerdown',()=>{if(!soundStarted)startSound()},{once:true});
  window.addEventListener('load',()=>{startSound();setTimeout(()=>{if(audio.paused)soundHint.classList.add('show')},700)});

  renderCards(); hydrateCloud();
  setInterval(()=>{swapOne(); if(Math.random()>.55)shuffle()},cfg.rotationMs||2800);
  requestAnimationFrame(tick);
})();
