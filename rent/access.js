const BASE=['zeror.ca','www.zeror.ca'].includes(location.hostname)?'https://rent.vzobole.chatgpt.site':location.origin;
const SESSION_KEY = 'rent-session';
let session;
for (const storage of ['localStorage', 'sessionStorage']) {
 try {
  const saved = JSON.parse(window[storage].getItem(SESSION_KEY));
  if (saved?.token && saved.expiresAt > Date.now()) { session = saved; break; }
 } catch {}
}
export function clearAccess() {
 session = null;
 for (const storage of ['localStorage', 'sessionStorage']) {
  try { window[storage].removeItem(SESSION_KEY); } catch {}
 }
}
function saveAccess(value) {
 session = value;
 try { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); }
 catch { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); } catch {} }
}
export async function request(path,options={}){
 const h=new Headers(options.headers);if(session?.expiresAt>Date.now())h.set('Authorization','Bearer '+session.token);
 const r=await fetch(BASE+path,{...options,headers:h,credentials:'omit',referrerPolicy:'no-referrer'});
 if(r.status===401&&path!=='/api/login'){clearAccess();window.dispatchEvent(new Event('rent-locked'));}
 return r;
}
export async function signIn(linkKey){const r=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({linkKey})});const d=await r.json();if(!r.ok)throw Error(d.error||'暂时无法打开，请重试');saveAccess(d);}
export async function signOut(){try{await request('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}finally{clearAccess();}}
