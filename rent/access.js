const BASE=['zeror.ca','www.zeror.ca'].includes(location.hostname)?'https://rent.vzobole.chatgpt.site':location.origin;
let session;try{session=JSON.parse(sessionStorage.getItem('rent-session')||'null');}catch{}
export function clearAccess(){session=null;try{sessionStorage.removeItem('rent-session');}catch{}}
export function saveAccess(s){session=s;try{sessionStorage.setItem('rent-session',JSON.stringify(s));}catch{}}
export async function request(path,options={}){
 const h=new Headers(options.headers);if(session?.expiresAt>Date.now())h.set('Authorization','Bearer '+session.token);
 const r=await fetch(BASE+path,{...options,headers:h,credentials:'omit',referrerPolicy:'no-referrer'});
 if(r.status===401&&path!=='/api/login'){clearAccess();window.dispatchEvent(new Event('rent-locked'));}
 return r;
}
export async function signIn(pin){const r=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});const d=await r.json();if(!r.ok)throw Error(d.error||'暂时无法打开，请重试');saveAccess(d);}
export async function signOut(){try{await request('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}finally{clearAccess();}}
