(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.SCHEntry=api;api.mount(root);}})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const url='https://zeror-sch.vzobole.chatgpt.site/sch/',keys=['zeror-sch-import-20261019-v1','zeror-sch-prototype-v1'];
 function readLegacy(storage){const records=[];let unavailable=false;for(const key of keys){try{const raw=storage.getItem(key);if(raw!==null)records.push({key,raw});}catch{unavailable=true;}}return {records,unavailable};}
 function mount(win){let result;try{result=readLegacy(win.localStorage);}catch{result={records:[],unavailable:true};}const $=id=>win.document.getElementById(id);$('cloud').href=url;
  if(!result.records.length&&!result.unavailable){win.location.replace(url);return;}
  $('legacy').hidden=false;$('backup').disabled=!result.records.length;if(result.unavailable)$('legacy-message').textContent='无法完整读取这台浏览器的旧数据。请保留当前浏览器数据；可以先备份已能读取的内容，再进入云端。';
  $('backup').addEventListener('click',()=>{const data={schema:'sch-browser-backup-1',exportedAt:new Date().toISOString(),origin:win.location.origin,records:result.records},blob=new win.Blob([JSON.stringify(data,null,2)],{type:'application/json'}),objectUrl=win.URL.createObjectURL(blob),a=win.document.createElement('a');a.href=objectUrl;a.download='SCH-旧版备份-'+new Date().toISOString().slice(0,10)+'.json';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(objectUrl),30000);$('status').textContent='已生成备份，请确认浏览器下载完成。备份不会上传到云端。';});
 }
 return {url,keys,readLegacy,mount};
});
