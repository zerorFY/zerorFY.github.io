(()=>{
 'use strict';
 const SERVICE='https://rent.vzobole.chatgpt.site';
 const frame=document.querySelector('#rent'),status=document.querySelector('#status');
 const route=value=>typeof value==='string'&&/^#\/(?:new|house\/house-[a-f0-9-]+)?$/.test(value)?value:'#/';
 function loginLink(){const back='/rent-return?route='+encodeURIComponent(route(location.hash));document.querySelector('#signin').href=SERVICE+'/signin-with-chatgpt?return_to='+encodeURIComponent(back);}
 function reload(){document.body.classList.remove('ready');status.textContent='正在打开你的房源和看房记录…';frame.src=SERVICE+'/?embedded=1'+route(location.hash);loginLink();}
 window.addEventListener('message',event=>{
  if(event.origin!==SERVICE||event.source!==frame.contentWindow||!event.data||typeof event.data!=='object')return;
  if(event.data.type==='rent-ready')document.body.classList.add('ready');
  if(event.data.type==='rent-route'){const hash=route(event.data.hash);if(hash!==location.hash)history.replaceState(null,'',location.pathname+location.search+hash);loginLink();}
  if(event.data.type==='rent-auth-needed'){document.body.classList.remove('ready');status.textContent='请登录后继续查看和上传照片。';loginLink();}
 });
 window.addEventListener('hashchange',()=>{frame.contentWindow?.postMessage({type:'rent-navigate',hash:route(location.hash)},SERVICE);loginLink();});
 document.querySelector('#retry').onclick=reload;
 reload();
 setTimeout(()=>{if(!document.body.classList.contains('ready'))status.textContent='首次使用，请先登录；已登录可点重新加载。';},7000);
})();
