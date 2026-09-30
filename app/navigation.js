/* History owns navigation. Retained entry DOM owns transient view/form state. */
(() => {
  const viewport = document.querySelector('#viewport');
  const overlay = document.querySelector('#overlay');
  const baseAction = action, baseGo = go, baseRender = render, baseClose = close;
  const entries = new Map();
  const sessionKey = 'fde-navigation-v2';
  let current, underlay, gesture = null, busy = false, suppressClick = false;
  const session = (() => { try { return JSON.parse(sessionStorage.getItem(sessionKey)) || {}; } catch { return {}; } })();
  const snapshot = () => ({tab: state.tab, query: state.query, filter: state.filter, detail: structuredClone(detail), qty, scroll: content.scrollTop});
  function persist() {
    const records = [...entries.values()].map(e => ({id:e.id, parent:e.parent, route:e.route, view:e.view, forms:e.forms, sheetAction:e.sheetAction, sheetSku:e.sheetSku}));
    try { sessionStorage.setItem(sessionKey, JSON.stringify({records})); } catch {}
  }
  function capture() {
    if (!current) return;
    current.view = snapshot(); current.node = content;
    current.sheet = [...overlay.childNodes];
    current.revision = state.activity.length;
    current.forms = [...overlay.querySelectorAll('input')].map(i=>i.value);
    persist();
  }
  function route() {
    if (detail?.type === 'po') return `/${state.tab}/po/${detail.po}`;
    if (detail) return `/${state.tab}/${detail.type === 'receive' ? 'receive' : 'sku'}/${detail.sku}`;
    return `/${state.tab}`;
  }
  function assign(v) {
    state.tab=v.tab; state.query=v.query; state.filter=v.filter;
    detail=structuredClone(v.detail); qty=v.qty; save();
  }
  function updateUnderlay() {
    underlay?.remove(); underlay=null;
    const previous=entries.get(current?.parent);
    if (!previous) return;
    if (!previous.node) {
      const live=content, liveView=snapshot();
      assign(previous.view);
      content=document.createElement('main');
      baseRender();previous.node=content;previous.needsWire=true;
      content=live;assign(liveView);refreshNav();
    }
    underlay=previous.node.cloneNode(true);
    underlay.removeAttribute('id');
    underlay.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
    underlay.className='previous-screen'; underlay.inert=true;
    underlay.setAttribute('aria-hidden','true');
    viewport.prepend(underlay); underlay.scrollTop=previous.view.scroll;
  }
  function refreshNav() {
    document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.action===state.tab));
  }
  function restore(entry) {
    stopCamera(); baseClose(); underlay?.remove(); content.remove();
    current=entry; assign(entry.view);
    content=entry.node || document.createElement('main');
    content.id='content'; content.className=''; content.style.cssText='';
    viewport.append(content);
    if (!entry.node) {
      baseRender();
      if (entry.sheetAction) baseAction(entry.sheetAction, entry.sheetSku);
    } else if (entry.revision !== state.activity.length && !['receive'].includes(detail?.type) && !entry.sheet?.length) {
      baseRender();
    }
    if (entry.sheet) overlay.replaceChildren(...entry.sheet);
    if (entry.needsWire) { wireSearch(); delete entry.needsWire; }
    overlay.querySelectorAll('input').forEach((input,i)=>{if(entry.forms?.[i]!==undefined) input.value=entry.forms[i]});
    content.scrollTop=entry.view.scroll; refreshNav(); updateUnderlay(); capture();
  }
  function forward(run, suffix='') {
    if (busy) return;
    capture(); const parent=current.id;
    underlay?.remove(); content.remove(); baseClose();
    content=document.createElement('main'); content.id='content'; viewport.append(content);
    run();
    current={id:crypto.randomUUID(),parent,route:route()+suffix,view:snapshot(),node:content,sheet:[...overlay.childNodes]};
    entries.set(current.id,current);
    history.pushState({fde:current.id},'',`#${current.route}`);
    updateUnderlay(); capture();
  }
  function back() {
    if (busy || !entries.has(current.parent)) return;
    capture(); history.back();
  }
  // The only replaceState initializes an entry; ordinary transitions always push.
  for (const record of session.records || []) entries.set(record.id,record);
  const existing=history.state?.fde && entries.get(history.state.fde);
  if (existing) { current=existing; restore(existing); }
  else {
    const match=location.hash.match(/^#\/(home|orders|stock|scan|more)(?:\/(po|sku|receive)\/([\w-]+))?$/);
    if(match){state.tab=match[1];if(match[2]==='po' && state.items.some(i=>i.po===match[3]))detail={type:'po',po:match[3]};else if(match[2] && state.items.some(i=>i.sku===match[3]))detail={type:match[2]==='receive'?'receive':'item',sku:match[3]};baseRender()}
    current={id:crypto.randomUUID(),parent:null,route:route(),view:snapshot(),node:content,sheet:[]};entries.set(current.id,current);
    history.replaceState({fde:current.id},'',`#${current.route}`);capture();
  }
  history.scrollRestoration='manual';
  go = tab => {
    if(tab===state.tab && !detail && !overlay.childNodes.length) return;
    forward(()=>baseGo(tab));
  };
  close = () => { if(current.route.includes('/sheet/')) back(); else baseClose(); };
  action = async (a,sku) => {
    if(busy || gesture?.locked || suppressClick) return;
    if(a==='back' || a==='close'){back();return}
    if(['po','po-complete','item','receive'].includes(a)) {
      if(a==='receive' && state.items.find(i=>i.sku===sku)?.received===state.items.find(i=>i.sku===sku)?.ordered){toast('This item is fully received');return}
      forward(()=>baseAction(a,sku));return;
    }
    if(['manual','adjust','reset'].includes(a) || (a==='install' && !deferredInstall)) {
      forward(()=>{baseRender();baseAction(a,sku)},`/sheet/${a}`);
      current.sheetAction=a;current.sheetSku=sku;capture();return;
    }
    if(a==='confirm-receive') {
      const i=state.items.find(i=>i.sku===detail.sku);
      qty=Math.min(qty,i.ordered-i.received);
      if(qty<=0){toast('This item is fully received');return}
      forward(()=>baseAction(a,sku));return;
    }
    if(a==='reset-confirm') {
      // Preserve the current route's owning tab while resetting business data.
      const tab=state.tab; await baseAction(a,sku); state.tab=tab; save(); return;
    }
    await baseAction(a,sku); capture();
  };
  window.addEventListener('popstate',event=>{
    const entry=entries.get(event.state?.fde);
    if(!entry) return;
    capture(); gesture=null;busy=false;restore(entry);
  });
  content.addEventListener('scroll',capture,{passive:true});
  viewport.addEventListener('scroll',capture,true);
  document.addEventListener('input',capture);
  window.addEventListener('pagehide',capture);
  document.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
  function excluded(target) {
    if(state.tab==='scan' || overlay.childNodes.length || !entries.get(current.parent)?.node) return true;
    if(target.closest('input,textarea,select,video,.camera,[data-no-swipe],[role="slider"]')) return true;
    for(let n=target;n&&n!==viewport;n=n.parentElement) {
      const overflow=getComputedStyle(n).overflowX;
      if(n.scrollWidth>n.clientWidth+1 && ['auto','scroll'].includes(overflow)) return true;
    }
    return false;
  }
  function start(x,y,target,time) {
    const rect=viewport.getBoundingClientRect();
    if(busy || x<rect.left || x-rect.left>24 || excluded(target)) return;
    gesture={x,y,lastX:x,lastTime:time,velocity:0,dx:0,locked:false};
    content.classList.remove('enter');content.style.transition='none';
  }
  function move(x,y,time,prevent) {
    if(!gesture) return;
    const dx=x-gesture.x,dy=y-gesture.y;
    if(!gesture.locked) {
      if(Math.abs(dy)>8 && Math.abs(dy)>=Math.abs(dx)){gesture=null;return}
      if(dx<0){gesture=null;return}
      if(dx<8 || dx<Math.abs(dy)*1.25)return;
      gesture.locked=true;viewport.classList.add('swiping');
    }
    prevent();
    const dt=time-gesture.lastTime;
    if(dt>0)gesture.velocity=(x-gesture.lastX)/dt;
    gesture.lastX=x;gesture.lastTime=time;
    gesture.dx=Math.min(viewport.clientWidth,Math.max(0,dx));
    content.style.transform=`translate3d(${gesture.dx}px,0,0)`;
    if(underlay)underlay.style.transform=`translate3d(${-viewport.clientWidth*.22+gesture.dx*.22}px,0,0)`;
  }
  function finish(cancelled=false) {
    if(!gesture)return;
    const g=gesture;gesture=null;
    if(!g.locked)return;
    const velocity=performance.now()-g.lastTime>100?0:g.velocity;
    const complete=!cancelled && (g.dx>viewport.clientWidth*.3 || (g.dx>12 && velocity>.55));
    busy=true;suppressClick=true;
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:220;
    content.style.transition=`transform ${duration}ms cubic-bezier(.2,.7,.2,1)`;
    content.style.transform=`translate3d(${complete?viewport.clientWidth:0}px,0,0)`;
    if(underlay){underlay.style.transition=`transform ${duration}ms ease`;underlay.style.transform=complete?'translate3d(0,0,0)':`translate3d(${-viewport.clientWidth*.22}px,0,0)`}
    setTimeout(()=>{
      viewport.classList.remove('swiping');
      suppressClick=false;
      if(complete){capture();history.back()}
      else{busy=false;content.style.cssText='';if(underlay)underlay.style.cssText=''}
    },duration);
  }
  // Nonpassive touch move is used only after horizontal direction lock. Vertical
  // scrolling remains native. Prevent the browser edge recognizer from also
  // committing once our horizontal gesture owns the movement.
  viewport.addEventListener('touchstart',e=>{if(e.touches.length===1){const t=e.touches[0];start(t.clientX,t.clientY,e.target,performance.now())}},{passive:true});
  viewport.addEventListener('touchmove',e=>{if(e.touches.length!==1){finish(true);return}const t=e.touches[0];move(t.clientX,t.clientY,performance.now(),()=>e.preventDefault())},{passive:false});
  viewport.addEventListener('touchend',()=>finish());
  viewport.addEventListener('touchcancel',()=>finish(true));
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;start(e.clientX,e.clientY,e.target,performance.now());if(gesture)viewport.setPointerCapture(e.pointerId)});
  viewport.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')move(e.clientX,e.clientY,performance.now(),()=>e.preventDefault())});
  viewport.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')finish()});
  viewport.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')finish(true)});
  updateUnderlay();
})();
