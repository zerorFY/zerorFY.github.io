(()=>{'use strict';
const $=s=>document.querySelector(s),API=$('meta[name="aiqu-api"]').content;
let questions=[],available=false,filter='all',saving=false,generation=0,submissionId='',lastSubmitted='',toastTimer;
const answerExamples=["例如：地产、装修、会计、电商，或你所在的其他行业。","例如：自雇、自己经营生意、全职上班、兼职，或正在转行。","例如：经常用 ChatGPT，每天约 1 小时，主要查资料、写文案。","例如：每天花两小时回复客户、整理报价，或反复录入表格。","例如：根据客户需求整理报价，省去重复复制和修改。","例如：还没有；有一个简单网站；或有网站但很久没更新。","例如：展示作品和服务、在线预约、接收询价，或销售产品。","例如：写文案、制作图片、整理表格、回复客户，或处理文件。","例如：担心回答不准确、资料隐私、费用，或不知道怎么开始。","例如：现场做一个网站、整理一份报价，或把表格做成图表。","例如：能独立用 AI 完成一项日常工作，或做出一个简单网页。","例如：把零散的客户需求整理成报价，或把每周表格汇总成报告。"];
const answers=new Map(),answerErrors=new Map(),drafts=new Map();
let answerReady=false,answerSaving='',answerGeneration=0;
const draftPrefix='AIQU:answer-draft:v1:';
try{for(let i=0;i<sessionStorage.length;i++){const key=sessionStorage.key(i);if(!key?.startsWith(draftPrefix))continue;const d=JSON.parse(sessionStorage.getItem(key));if(d&&typeof d.text==='string'&&d.text.length<=1000&&Number.isInteger(d.version)&&d.version>=0)drafts.set(key.slice(draftPrefix.length),d)}}catch{}
function storeDraft(id){try{if(drafts.has(id))sessionStorage.setItem(draftPrefix+id,JSON.stringify(drafts.get(id)));else sessionStorage.removeItem(draftPrefix+id)}catch{}}
function respondent(create=false){try{let token=localStorage.getItem('AIQU:respondent:v1');if(!token&&create){token=crypto.randomUUID();localStorage.setItem('AIQU:respondent:v1',token)}return token}catch{if(create)throw Error('浏览器无法保存填写凭据，请允许此网站使用本地存储后再回答');return null}}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3500)}
function error(message){$('#error').textContent=message;$('#error').hidden=!message}
async function api(path='',body,extra={}){let response;try{response=await fetch(API+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(16000)})}catch{throw Error('暂时无法连接，请稍后重试')}let d;try{d=await response.json()}catch{throw Error('服务器暂时无法响应，请稍后重试')}if(!response.ok)throw Object.assign(Error(d.error||'操作未成功，请重试'),{status:response.status});return d}
function applyAnswers(d){if(!Array.isArray(d.answers))throw Error('回答读取异常，请稍后重试');answers.clear();d.answers.forEach(a=>answers.set(a.id,a));answerReady=true}
async function loadAnswers(){const token=respondent(),generation=++answerGeneration;if(!token){answerReady=true;return}const d=await api('/answers',null,{'X-AIQU-Respondent':token});if(generation!==answerGeneration)return;applyAnswers(d);render()}
function answerPanel(q){const saved=answers.get(q.id),draft=drafts.get(q.id),text=draft?.text??saved?.text??'',status=answerSaving===q.id?'正在提交…':draft?.text.trim()?'未提交':saved?'已保存':'';return `<div class="answer-panel" data-id="${esc(q.id)}" id="answer-${esc(q.id)}"><label class="sr-only" for="answer-text-${esc(q.id)}">你的回答</label><textarea id="answer-text-${esc(q.id)}" data-answer-text data-id="${esc(q.id)}" rows="2" maxlength="1000" placeholder="挑感兴趣的问题，写下你的回答……&#10;${esc(answerExamples[q.presetOrder-1]||'例如：结合你的实际情况，简单说说你希望解决的问题。')}">${esc(text)}</textarea><div class="answer-actions"><span>${status}</span><button type="button" class="answer-save" data-answer-submit data-id="${esc(q.id)}" ${saving?'disabled':''}>提交本题</button></div><p class="error" role="alert" ${answerErrors.has(q.id)?'':'hidden'}>${esc(answerErrors.get(q.id)||'')}</p></div>`}
function updateSubmit(){const active=new Set(questions.map(q=>q.id)),count=[...drafts].filter(([id,d])=>active.has(id)&&d.text.trim()).length;$('#answer-submit').disabled=saving;$('#answer-submit').textContent=saving?'正在提交…':'提交全部已填回答';document.querySelectorAll('[data-answer-submit]').forEach(b=>{const id=b.dataset.id,hasDraft=!!drafts.get(id)?.text.trim();b.disabled=saving||!hasDraft;b.textContent=answerSaving===id?'正在提交…':answers.has(id)&&!hasDraft?'已提交':'提交本题'});$('#answer-progress').textContent=saving?'正在保存，请稍候…':count?`有 ${count} 题待提交，空白题会跳过`:'所有问题均为选填，回答仅你和组织者可见'}

function apply(d){if(!Array.isArray(d.questions))throw Error('读取内容异常，请刷新重试');questions=d.questions;available=d.votingAvailable;render()}
function render(){
 const active=document.activeElement,focus=active?.matches('[data-answer-text]')?{id:active.dataset.id,start:active.selectionStart,end:active.selectionEnd}:null;
 const search=$('#search').value.trim().toLowerCase(),opened=new Set([...document.querySelectorAll('.question details[open]')].map(e=>e.closest('[data-id]').dataset.id));
 let visible=questions.filter(q=>(filter==='all'||(filter==='background'?q.kind==='背景了解':q.kind!=='背景了解'))&&(!search||[q.title,q.purpose,q.category,...q.options].join(' ').toLowerCase().includes(search)));
 if($('#sort').value==='newest')visible.sort((a,b)=>Number(a.preset)-Number(b.preset)||(a.preset&&b.preset&&a.presetOrder!=null&&b.presetOrder!=null?a.presetOrder-b.presetOrder:0)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));else visible.sort((a,b)=>b.up-a.up||a.down-b.down||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
 $('#total').textContent=questions.length;$('#showing').textContent=`显示 ${visible.length} / ${questions.length} 个问题`;
 $('#list').innerHTML=visible.map(q=>`<article class="question ${q.id===lastSubmitted?'new':''}" data-id="${esc(q.id)}"><h3>${esc(q.title)}</h3>${q.purpose||q.options.length?`<details ${opened.has(q.id)?'open':''}><summary>${q.options.length?'选项与说明':'问题说明'}</summary>${q.purpose?`<p>${esc(q.purpose)}</p>`:''}${q.options.length?`<ul>${q.options.map(o=>`<li>${esc(o)}</li>`).join('')}</ul>`:''}</details>`:''}${answerPanel(q)}</article>`).join('');
 $('#empty').hidden=visible.length!==0;$('#list').hidden=visible.length===0;$('#list').setAttribute('aria-busy','false');
 updateSubmit();
 if(focus){const el=document.getElementById('answer-text-'+focus.id);if(el&&!el.closest('[hidden]')){el.focus({preventScroll:true});el.setSelectionRange(focus.start,focus.end)}}
}
$('#list').addEventListener('input',e=>{const field=e.target.closest('[data-answer-text]');if(!field)return;const id=field.dataset.id;drafts.set(id,{text:field.value,version:drafts.get(id)?.version??answers.get(id)?.version??0});storeDraft(id);answerErrors.delete(id);updateSubmit()});
async function submitAnswers(onlyId){
 if(saving)return;
 const active=new Set(questions.map(q=>q.id)),pending=[...drafts].filter(([id,d])=>active.has(id)&&(!onlyId||id===onlyId)&&d.text.trim()).map(([id,d])=>({id,text:d.text,version:d.version}));
 if(!pending.length){toast(onlyId?'先填写本题，再点击提交即可':'所有问题都可以跳过；填写任意一题后再提交即可');return}
 saving=true;generation++;answerGeneration++;updateSubmit();
 try{respondent(true);if(!answerReady)await loadAnswers()}catch(e){saving=false;render();toast(e.message);return}
 let count=0,failed='';
 for(const item of pending){
  const {id,text,version}=item;answerSaving=id;answerErrors.delete(id);render();
  try{const d=await api('/answers',{id,text,version},{'X-AIQU-Respondent':respondent(true)});applyAnswers(d);if(drafts.get(id)?.text===text)drafts.delete(id);else if(drafts.has(id))drafts.get(id).version=answers.get(id)?.version??0;storeDraft(id);count++}
  catch(e){failed=id;answerErrors.set(id,e.message);if(e.status===409){try{await loadAnswers();if(drafts.has(id))drafts.get(id).version=answers.get(id)?.version??0;storeDraft(id);answerErrors.set(id,'你的内容已保留。再次提交会用当前内容更新已保存的回答。')}catch{}}break}
 }
 saving=false;answerSaving='';render();
 if(failed){toast(`已保存 ${count} 题，其余内容已保留，请重试`);document.getElementById('answer-'+failed)?.scrollIntoView({behavior:'smooth',block:'center'})}else toast(onlyId?'本题已提交，谢谢参与！':`已提交 ${count} 题，谢谢参与！`);
}
$('#answer-submit').addEventListener('click',()=>submitAnswers());
$('#list').addEventListener('click',e=>{const b=e.target.closest('[data-answer-submit]');if(b&&!b.disabled)submitAnswers(b.dataset.id)});

async function load({silent=false}={}){if(saving)return;const token=++generation;if(!silent)$('#sync').textContent='正在同步…';try{const d=await api();if(token!==generation)return;apply(d);$('#sync').textContent='已同步';if(!available)error('暂时无法连接提交服务，仍可浏览和填写，请稍后重试。');else error('')}catch(e){if(token!==generation)return;$('#sync').textContent='连接中断';$('#list').setAttribute('aria-busy','false');if(!silent)error(e.message)}}

document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render()}));$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);$('#refresh').addEventListener('click',()=>load());
function openQuestion(){if(saving)return;submissionId=crypto.randomUUID();$('#question-form').reset();$('#form-error').hidden=true;$('#question-dialog').showModal();$('#question-title').focus()}
$('#ask').addEventListener('click',openQuestion);$('#ask-bottom').addEventListener('click',openQuestion);$('#ask-empty').addEventListener('click',openQuestion);document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>{if(!saving)$('#question-dialog').close()}));$('#question-dialog').addEventListener('cancel',e=>{if(saving)e.preventDefault()});
$('#question-form').addEventListener('submit',async e=>{e.preventDefault();if(saving)return;saving=true;generation++;$('#submit').disabled=true;$('#form-error').hidden=true;const d={id:submissionId,title:$('#question-title').value,name:$('#name').value,category:$('#category').value};try{await api('/questions',d);lastSubmitted=submissionId;$('#question-dialog').close();filter='all';document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));$('#sort').value='newest';$('#search').value='';toast('问题已发布，谢谢补充')}catch(e){$('#form-error').textContent=e.message;$('#form-error').hidden=false}finally{saving=false;$('#submit').disabled=false;await load()}});
async function shareSurvey(){const url='https://zeror.ca/aiqu/';try{await navigator.clipboard.writeText(url);toast('网址已复制，发给朋友一起提问')}catch{$('#share-link').value=url;$('#share-dialog').showModal();$('#share-link').select()}}
$('#share').addEventListener('click',shareSurvey);$('#share-bottom').addEventListener('click',shareSurvey);document.querySelectorAll('.close-share').forEach(b=>b.addEventListener('click',()=>$('#share-dialog').close()));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#question-dialog').open&&!document.activeElement?.matches('[data-answer-text]'))load({silent:true})});window.addEventListener('online',()=>load());setInterval(()=>{if(!document.hidden&&!saving&&!$('#question-dialog').open&&!document.activeElement?.matches('[data-answer-text]'))load({silent:true})},20000);load();loadAnswers().catch(()=>{});
})();
