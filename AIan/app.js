'use strict';
const $=id=>document.getElementById(id),api=document.querySelector('meta[name="aiqu-api"]').content;
let token='',state=null,mode='questions',busy=false,epoch=0;
const pending=new Set();
try{token=sessionStorage.getItem('aiqu-admin-session')||''}catch{}
function message(text){$('message').textContent=text;$('message').hidden=!text}
function forget(){epoch++;token='';state=null;try{sessionStorage.removeItem('aiqu-admin-session')}catch{}$('dashboard').hidden=true;for(const id of ['answers','stats','days'])$(id).replaceChildren();$('share-breakdown').textContent='';$('person').replaceChildren(new Option('全部答题者','all'));$('login-panel').hidden=false;$('logout').hidden=true;$('pin').value=''}
async function request(path,data,auth=token){
 const controller=new AbortController();pending.add(controller);const timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(api+'/admin/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:'Bearer '+auth}:{})},...(data?{body:JSON.stringify(data)}:{}),cache:'no-store',credentials:'omit',signal:controller.signal});
 const result=await r.json();if(!r.ok){if(r.status===401&&path!=='login'){forget();message(result.error||'请重新登录')}throw Error(result.error||'暂时无法读取，请稍后再试')}return result;
 }finally{clearTimeout(timer);pending.delete(controller)}
}
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el};
const badge=number=>node('span',number+'号','badge');
function timestamp(value){const el=node('time',new Date(value).toLocaleString('zh-CN',{timeZone:'America/Toronto',hour12:false})+' · 多伦多时间');el.dateTime=value;return el}
function renderAnswers(){
 const root=$('answers');root.replaceChildren();const selected=$('person').value,people=state.respondents.filter(p=>selected==='all'||String(p.number)===selected),answers=state.answers.filter(a=>selected==='all'||String(a.number)===selected);
 $('answers-heading').textContent='收集的回答（'+answers.length+'）';$('questions-view').classList.toggle('active',mode==='questions');$('compare-view').classList.toggle('active',mode==='compare');$('questions-view').setAttribute('aria-pressed',String(mode==='questions'));$('compare-view').setAttribute('aria-pressed',String(mode==='compare'));
 if(!answers.length){root.append(node('p','还没有收到回答。','empty'));return}
 if(mode==='compare'){
  root.append(node('p','左右滑动表格，对比不同编号的回答。','compare-hint'));
  const wrap=node('div',undefined,'scroll comparison');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','答题者回答对比，可左右滚动');
  const table=node('table'),head=node('thead'),tr=node('tr');tr.append(node('th','问题'));for(const p of people){const th=node('th');th.scope='col';th.append(badge(p.number),node('p',p.count+' 条回答'));tr.append(th)}head.append(tr);table.append(head);
  const body=node('tbody'),map=new Map(answers.map(a=>[a.questionId+':'+a.number,a]));for(const q of state.questions){const row=node('tr'),th=node('th',q.title);th.scope='row';row.append(th);for(const p of people){const td=node('td'),a=map.get(q.id+':'+p.number);if(a)td.append(node('p',a.text),timestamp(a.updatedAt));else td.append(node('span','—','muted'));row.append(td)}body.append(row)}table.append(body);wrap.append(table);root.append(wrap);return;
 }
 for(const q of state.questions){const items=answers.filter(a=>a.questionId===q.id);if(!items.length)continue;const section=node('section',undefined,'question');section.append(node('h3',q.title));for(const a of items){const card=node('article',undefined,'answer'),line=node('div',undefined,'answer-line');line.append(badge(a.number),node('p',a.text,'answer-text'));card.append(line,timestamp(a.updatedAt));section.append(card)}root.append(section)}
}
function render(){
 const old=$('person').value; $('person').replaceChildren(new Option('全部答题者','all'));for(const p of state.respondents)$('person').add(new Option(p.number+'号 · '+p.count+' 条回答',String(p.number)));if([...$('person').options].some(o=>o.value===old))$('person').value=old;
 $('stats').replaceChildren();for(const [label,value] of [['页面打开',state.stats.opens],['分享操作',state.stats.shares],['答题身份',state.respondents.length],['收到回答',state.answers.length]]){const card=node('div',undefined,'stat');card.append(node('p',label),node('strong',String(value)));$('stats').append(card)}
 $('share-breakdown').textContent='成功复制链接 '+state.stats.copies+' 次 · 系统分享操作 '+state.stats.nativeShares+' 次';$('days').replaceChildren();for(const day of state.stats.days){const tr=node('tr');tr.append(node('td',day.day),node('td',String(day.opens)),node('td',String(day.shares)));$('days').append(tr)}
 $('login-panel').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;renderAnswers();
}
async function refresh(){if(busy)return;const generation=epoch;busy=true;$('refresh').disabled=true;try{const next=await request('state');if(generation!==epoch)return;state=next;render();message('')}catch(e){if(generation===epoch)message(e.name==='AbortError'?'请求超时，请重试':e.message)}finally{busy=false;$('refresh').disabled=false}}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;$('login-button').disabled=true;message('');try{const result=await request('login',{pin:$('pin').value});token=result.token;try{sessionStorage.setItem('aiqu-admin-session',token)}catch{}$('pin').value='';state=await request('state');render()}catch(e){message(e.message)}finally{busy=false;$('login-button').disabled=false}});
$('logout').addEventListener('click',async()=>{const oldToken=token;for(const controller of pending)controller.abort();forget();busy=true;$('login-button').disabled=true;message('');try{await request('logout',{},oldToken)}catch{message('已退出当前页面。网络异常，服务器会话未能确认注销，将在到期后自动失效。')}finally{busy=false;$('login-button').disabled=false}});
$('person').addEventListener('change',()=>state&&renderAnswers());$('questions-view').addEventListener('click',()=>{mode='questions';if(state)renderAnswers()});$('compare-view').addEventListener('click',()=>{mode='compare';if(state)renderAnswers()});$('refresh').addEventListener('click',refresh);
if(token)refresh();
