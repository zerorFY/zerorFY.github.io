(function(){
 'use strict';
 const M=window.SCH,$=s=>document.querySelector(s),seed=window.SCH_IMPORT,KEY=seed?'zeror-sch-import-20261019-v1':'zeror-sch-prototype-v1';
 if(seed)M.configureRoster(seed.roster);
 const initialState=()=>seed?seed.build(M):M.sampleState();
 const owner={role:'owner',id:'owner'},days=['周一','周二','周三','周四','周五','周六','周日'],eng=['MON','TUE','WED','THU','FRI','SAT','SUN'];
 let state,storageError=false;try{const raw=localStorage.getItem(KEY);state=raw?JSON.parse(raw):initialState();if(state.schema!==1||!state.weeks||!state.rest)throw Error('数据格式不兼容');}catch(e){state=initialState();storageError=true;}
 let actor=owner,start=state.currentWeek||'2026-10-19',view='schedule',restDraft=null,editing=null,snapshot=null,toastTimer,shareWeek=null,shareScroll=0,editorScroll=0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shortDate=d=>`${Number(d.slice(5,7))}/${Number(d.slice(8,10))}`;
 const fullDate=d=>`${d.slice(0,4)}.${d.slice(5,7)}.${d.slice(8,10)}`;
 const dates=()=>Array.from({length:7},(_,d)=>M.addDays(start,d));
 const isOwner=()=>actor.role==='owner';
 const data=()=>snapshot||M.visibleWeek(state,actor,start);
 const canEdit=()=>isOwner()&&!snapshot&&!!state.weeks[start]?.draft;
 const name=id=>M.employee(id)?.code||id;
 function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600);}
 function persist(){try{state.currentWeek=start;localStorage.setItem(KEY,JSON.stringify(state));storageError=false;$('#save-status').textContent='● 已保存到本机';$('#save-status').classList.remove('error');return true;}catch(e){storageError=true;$('#save-status').textContent='● 本机保存失败，请备份';$('#save-status').classList.add('error');toast('浏览器保存失败，请先备份数据，刷新可能丢失修改');return false;}}
 function run(action,success){try{action();persist();render();if(success)toast(storageError?'修改尚未保存，请备份数据':success);}catch(e){toast(e.message);}}
 function personChip(id,front=false,conflict=false){return `<span class="person-chip${front?' front':''}${conflict?' rest-conflict':''}">${esc(name(id))}${front?'<small>前台</small>':''}</span>`;}
 function avatar(e){return `<span class="tiny-avatar" style="--person-color:${e.color}">${esc(e.code)}</span>`;}
 function heading(){
  M.ensureWeek(state,start);const b=state.weeks[start],w=data();
  $('#week-picker').value=start;$('#week-range').textContent=`${fullDate(start)} — ${M.addDays(start,6).slice(5).replace('-','.')}`;
  const badge=$('#week-state');badge.className='badge'+(snapshot||w?.status==='final'?' final':!w?' empty':'');badge.textContent=snapshot?`历史定稿 V${snapshot.version}`:w?.status==='final'?`▣ 已定稿 V${w.version}`:!w?'尚未定稿':b.finals.length?'修订草稿':'草稿 · 编辑中';
  if(view==='rest'){badge.textContent='◷ 开放选择';badge.className='badge empty';}
  const titles={schedule:['每周排班','安排清晰一点，每周轻松一点。'],rest:['休息意愿','先说好想休息的日子，让彼此都好安排。'],history:['定稿记录','每次确认，都留下一份不会被改写的记录。']};
  $('#page-title').innerHTML=titles[view][0]+'<span class="title-dot">.</span>';$('#page-subtitle').textContent=titles[view][1];$('#breadcrumb').textContent=titles[view][0];
  $('#identity-avatar').textContent=isOwner()?'管':name(actor.id);$('#identity-avatar').style.background=isOwner()?'#e4ece8':'#f0e6dc';
  $('#backup').hidden=!isOwner();
  $('#share-button').hidden=view!=='schedule'||!w;$('#export-current').hidden=view!=='schedule'||!w;
  $('#rest-nav-count').textContent=new Set(Object.values(state.rest[start]||{}).flat()).size+' 天';$('#history-nav-count').textContent=b.finals.length;
  document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  let actions='';if(view==='schedule'&&isOwner()&&!snapshot){if(b.draft){actions=`<button class="button secondary" id="copy-week">↳ 从上周复制</button><button class="button accent" id="finalize-button">▣ 确认定稿</button>`;}else actions='<button class="button secondary" id="revise-button">＋ 建立修订草稿</button>';}
  if(document.body.classList.contains('editor-focus'))actions='<button class="button secondary" id="focus-exit">退出放大</button>'+(w?'<button class="button secondary" id="focus-share">整周预览</button><button class="button primary" id="focus-export">保存整周图片</button>':'')+actions;
  $('#week-actions').innerHTML=actions;
  if(storageError){$('#save-status').textContent='● 本机数据未保存，请备份';$('#save-status').classList.add('error');}
 }
 function statsCards(w){const st=M.stats(w),assigned=st.filter(e=>e.days).length,personDays=st.reduce((n,e)=>n+e.days,0),front=st.reduce((n,e)=>n+e.front,0),rest=Object.values(state.rest[start]||{}).reduce((n,a)=>n+a.length,0);
  return `<div class="metrics"><div class="metric"><div><span class="metric-label">本周已排人员</span><strong>${assigned}<small>/ ${M.employees.length} 人</small></strong></div><span class="metric-icon">♧</span></div><div class="metric"><div><span class="metric-label">上班总人天</span><strong>${personDays}<small>人天</small></strong></div><span class="metric-icon">▦</span></div><div class="metric"><div><span class="metric-label">前台已安排</span><strong>${front}<small>班次</small></strong></div><span class="metric-icon">▥</span></div><div class="metric"><div><span class="metric-label">休息意愿</span><strong>${rest}<small>人天</small></strong></div><span class="metric-icon">◷</span></div></div>`;
 }
 function warningHTML(w,forConfirm=false){const warnings=M.warnings(state,w);if(!warnings.length)return '';return `<details class="warning-box"${forConfirm?' open':''}><summary>◌ 有 ${warnings.length} 条安排待你核对${forConfirm?'，定稿将保留当前安排':''}</summary><ul>${warnings.map(x=>`<li>${days[x.day]} · ${esc(x.text)}</li>`).join('')}</ul></details>`;}
 function scheduleHTML(){const w=data(),b=state.weeks[start];let out='';
  if(!w)return `<section class="panel empty-state"><div class="empty-icon">▦</div><h2>本周排班还没有定稿</h2><p>管理员确认后，你会在这里看到最终排班。<br>现在可以先到“休息意愿”选择想休息的日期。</p><button class="button primary" id="go-rest">填写休息意愿 →</button></section>`;
  if(snapshot)out+=`<div class="snapshot-label">正在查看历史定稿 V${w.version}<button id="exit-snapshot">返回当前排班</button></div>`;
  if(w.status==='final')out+=`<div class="locked-banner"><span class="locked-icon">▣</span><div><strong>本周已定稿 · 所有人只读</strong><p>V${w.version} · ${new Date(w.confirmedAt).toLocaleString('zh-CN',{hour12:false})} 确认。${isOwner()?'如需调整，请建立修订草稿，原版会保留。':'休息意愿变更不会改变这份最终排班。'}</p></div></div>`;
  else if(b.finals.length)out+=`<div class="locked-banner"><span class="locked-icon">↳</span><div><strong>正在编辑修订草稿</strong><p>员工目前看到的仍是已确认的 V${b.finals.length}。新草稿确认后才会成为最新排班。</p></div></div>`;
  out+=`<div class="print-heading"><strong>SCH · 每周排班</strong><span>${fullDate(start)} — ${fullDate(M.addDays(start,6))} / ${w.status==='final'?'最终版 V'+w.version:'草稿 · 未定稿'}</span></div>`;
  out+=`<section class="panel schedule-panel"><div class="panel-heading"><div><h2 class="panel-title"><span class="section-number">01</span> 本周工作安排</h2><p class="panel-caption">${canEdit()?'七天一起看，点格子填写人员；横屏编辑更清楚。':'整周最终安排只读，可预览分享或导出。'}</p></div><div class="grid-panel-tools"><span class="legend"><i class="red-dot"></i> 红色为值班前台</span><button class="button secondary no-print" id="focus-editor">${canEdit()?'放大编辑':'放大查看'}</button></div></div><div class="table-scroll"><table class="schedule-table" aria-label="本周排班"><thead><tr><th>岗位 / 工作内容</th>${dates().map((date,d)=>`<th data-day="${d}" class="${d>4?'weekend':''}"><span class="weekday">${eng[d]} · ${days[d]}</span><span class="day-number">${shortDate(date)}</span></th>`).join('')}</tr></thead><tbody>`;
  for(const row of M.rows){if(row.id==='vacuum')out+='<tr class="group-row"><td colspan="8">日常清洁 <span>DAILY CARE</span></td></tr>';
   out+=`<tr class="${row.group==='clean'?'clean-row':''}"><td><span class="row-label">${row.name}</span><span class="row-sub">${row.time||row.en}</span></td>${dates().map((date,d)=>{const c=w.cells[d+':'+row.id]||{people:[],front:null};return `<td data-day="${d}"><button class="cell-button" data-cell="${d}:${row.id}" aria-label="编辑${days[d]}${row.name}" ${canEdit()?'':'disabled'}>${c.people.map(id=>personChip(id,c.front===id,w.status==='draft'&&M.restOn(state,date).includes(id))).join('')||`<span class="${canEdit()?'empty-plus':'empty-dash'}">${canEdit()?'+':'—'}</span>`}</button></td>`;}).join('')}</tr>`;
  }
  out+=`<tr class="rest-strip no-print"><td>◷ 休息意愿参考</td>${dates().map((date,d)=>`<td data-day="${d}"><div class="rest-tags">${M.restOn(state,date).map(id=>'<span>'+esc(name(id))+'</span>').join('')||'—'}</div></td>`).join('')}</tr></tbody></table></div><div class="schedule-notes" aria-label="排班表备注">${window.SCHShare.notesHTML(w)}</div><div class="staff-roster">现有全部员工（${M.employees.length}人）：${M.employees.map(e=>esc(e.code)).join('、')}</div><div class="table-note"><span>清洁提示：每天拖半场；晚班不安排扫地、拖地；周日不排晚班。</span><span><strong>名字下方细线</strong> = 已提交休息意愿，请核对</span></div>${canEdit()?warningHTML(w):''}</section>`;
  out+=statsCards(w)+summaryHTML(w);return out;
 }
 function summaryHTML(w){const cleanRows=M.rows.filter(r=>r.group==='clean');return `<section class="panel"><div class="panel-heading"><div><h2 class="panel-title"><span class="section-number">02</span> 每周核对</h2><p class="panel-caption">自动算清次数，最后一栏留给你手动核对。</p></div><span class="right-caption">随排班自动更新</span></div><div class="table-scroll"><table class="summary-table" aria-label="每周人员核对"><thead><tr><th>人员</th><th>上班天数</th><th>前台</th>${cleanRows.map(r=>'<th>'+r.name.replace(' · 每天半场','').replace('地毯间 / 厕所 / 休息室','公共区域').replace('擦桌子、床面','擦桌面')+'</th>').join('')}<th style="width:20%">人工核对 / 备注</th></tr></thead><tbody>${M.stats(w).map(e=>`<tr><td><span class="summary-person">${avatar(e)}<span><strong>${e.code}</strong><small>${e.name}</small></span></span></td><td><span class="count-pill">${e.days}</span></td><td>${e.front||'—'}</td>${cleanRows.map(r=>'<td>'+(e.tasks[r.id]||'—')+'</td>').join('')}<td><input class="manual-note" data-note="${e.id}" aria-label="${e.code}人工核对备注" maxlength="300" placeholder="留空，供你核对填写" value="${esc(w.notes[e.id]||'')}" ${canEdit()?'':'disabled'}></td></tr>`).join('')}</tbody></table></div><div class="summary-footnote">上班天数按日期去重：同一天多个岗位只算 1 天；清洁次数单独统计，不额外增加上班天数。</div></section>`;}
 function restHTML(){const mine=isOwner()?[]:(restDraft||state.rest[start]?.[actor.id]||[]);return `<section class="panel"><div class="rest-intro"><div class="rest-intro-icon">◷</div><div><h2>${isOwner()?'看看大家想休息的日子':'这周，你想哪天休息？'}</h2><p>同事已选的日期也可以继续选择。重叠时只提醒，方便大家自行协调。${isOwner()?'':'点击日期选择，再保存自己的意愿。'}</p></div></div><div class="rest-calendar">${dates().map((date,d)=>{const others=M.restOn(state,date).filter(id=>id!==actor.id);const visible=isOwner()?M.restOn(state,date):[...others,...(mine.includes(date)?[actor.id]:[])];const overlap=visible.length>1;return `<${isOwner()?'div':'button'} ${isOwner()?'':'type="button" data-rest-day="'+date+'" aria-pressed="'+mine.includes(date)+'"'} class="rest-day ${d>4?'weekend ':''}${isOwner()?'':'selectable '}${mine.includes(date)?'selected':''}"><span class="rest-day-head"><span>${eng[d]} / ${days[d]}</span>${isOwner()?'':'<span class="selection-circle">✓</span>'}</span><span class="rest-date">${Number(date.slice(8))}</span><span class="rest-month">${Number(date.slice(5,7))}月</span>${visible.map(id=>`<span class="rest-person ${id===actor.id?'mine':''}" style="--person-color:${M.employee(id).color}"><i></i>${name(id)} · ${id===actor.id?'我想休息':M.employee(id).name}</span>`).join('')||'<span class="rest-none">还没有人选择</span>'}${overlap?'<span class="overlap-label">多人同日 · 仍可选择</span>':''}</${isOwner()?'div':'button'}>`;}).join('')}</div><div class="rest-savebar"><span>${isOwner()?'员工选择会显示在这里，也会显示在你的排班表下方。':`本周已选 <strong>${mine.length} 天</strong> · 这是休息意愿，以最终排班为准。`}</span>${isOwner()?'<span class="muted small">切换员工演示身份可体验选择</span>':'<button class="button primary" id="save-rest">保存我的休息意愿</button>'}</div></section><section class="panel"><div class="panel-heading"><div><h2 class="panel-title"><span class="section-number">02</span> 大家的休息意愿</h2><p class="panel-caption">所有员工可见；每人只能修改自己的选择。</p></div><span class="legend">◷ 已选休息</span></div><div class="table-scroll"><table class="rest-people-table" aria-label="大家的休息意愿"><thead><tr><th>人员</th>${dates().map((date,d)=>'<th>'+days[d]+'<br>'+shortDate(date)+'</th>').join('')}</tr></thead><tbody>${M.employees.map(e=>`<tr><td><span class="summary-person">${avatar(e)}<span><strong>${e.code}</strong><small>${e.name}${e.id===actor.id?' · 我':''}</small></span></span></td>${dates().map(date=>`<td>${(state.rest[start]?.[e.id]||[]).includes(date)?'<span class="rest-check" aria-label="已选休息">◷</span>':'<span class="empty-dash">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="summary-footnote">可以先看看同事选择，再自行协调。修改自己的休息意愿不会自动修改已定稿的排班。</div></section>`;}
 function historyHTML(){const b=state.weeks[start];return `<section class="panel"><div class="panel-heading"><div><h2 class="panel-title"><span class="section-number">01</span> 已确认的排班版本</h2><p class="panel-caption">每次定稿都单独保留；修订不会覆盖旧版。</p></div><span class="legend">▣ 只读存档</span></div>${b.finals.length?b.finals.slice().reverse().map(f=>`<div class="history-card"><div class="version-icon">▣</div><div class="history-copy"><h3>${shortDate(start)} — ${shortDate(M.addDays(start,6))} · 最终版 V${f.version}</h3><p>${new Date(f.confirmedAt).toLocaleString('zh-CN',{hour12:false})} · 管理员确认 · ${M.stats(f).reduce((n,e)=>n+e.days,0)} 人天</p></div><span class="badge final">${f.version===b.finals.length?'当前最终版':'历史版本'}</span><button class="button secondary" data-snapshot="${f.version}">查看排班 ↗</button></div>`).join(''):'<div class="empty-state"><div class="empty-icon">▤</div><h2>本周还没有定稿记录</h2><p>排班填写完成后，点击“确认定稿”。<br>最终排班会保存在这里，所有人只读。</p></div>'}</section>`;}
 function render(){heading();$('#view-content').innerHTML=view==='schedule'?scheduleHTML():view==='rest'?restHTML():historyHTML();bindContent();requestAnimationFrame(fitEditorFocus);}
 function moveWeek(date){if(restDraft!==null&&!confirm('休息意愿尚未保存，切换周将放弃本次未保存选择。继续吗？'))return;start=M.monday(date);restDraft=null;snapshot=null;render();persist();}
 function bindContent(){
  $('#copy-week')?.addEventListener('click',()=>{const prev=M.addDays(start,-7);if(!state.weeks[prev]){toast('上一周没有记录，可先手动填写本周安排');return;}run(()=>M.copyWeek(state,actor,prev,start),'已复制上周安排，请核对本周日期和休息意愿');});
  $('#finalize-button')?.addEventListener('click',()=>{const w=data();if(!Object.values(w.cells).some(c=>c.people.length)){toast('请先填写本周排班，再确认定稿');return;}$('#confirm-range').textContent=`${fullDate(start)} — ${fullDate(M.addDays(start,6))}`;$('#confirm-warnings').innerHTML=warningHTML(w,true);$('#confirm-dialog').showModal();});
  $('#revise-button')?.addEventListener('click',()=>run(()=>M.revise(state,actor,start),'已建立修订草稿，原最终版保持不变'));
  document.querySelectorAll('[data-cell]').forEach(el=>el.addEventListener('click',()=>openCell(el.dataset.cell)));
  document.querySelectorAll('[data-note]').forEach(el=>el.addEventListener('input',()=>{try{M.setNote(state,actor,start,el.dataset.note,el.value);persist();}catch(e){toast(e.message);}}));
  $('#focus-editor')?.addEventListener('click',toggleEditorFocus);
  $('#focus-exit')?.addEventListener('click',toggleEditorFocus);
  $('#focus-share')?.addEventListener('click',openWholeWeek);$('#focus-export')?.addEventListener('click',exportCurrentWeek);
  $('#go-rest')?.addEventListener('click',()=>{view='rest';render();});
  document.querySelectorAll('[data-rest-day]').forEach(el=>el.addEventListener('click',()=>{if(restDraft===null)restDraft=[...(state.rest[start]?.[actor.id]||[])];const date=el.dataset.restDay;restDraft=restDraft.includes(date)?restDraft.filter(d=>d!==date):[...restDraft,date];render();}));
  $('#save-rest')?.addEventListener('click',()=>{const selected=restDraft||state.rest[start]?.[actor.id]||[];run(()=>{M.setRest(state,actor,start,selected);restDraft=null;},'休息意愿已保存到本机演示数据');});
  document.querySelectorAll('[data-snapshot]').forEach(el=>el.addEventListener('click',()=>{snapshot=state.weeks[start].finals.find(f=>f.version===Number(el.dataset.snapshot));view='schedule';render();window.scrollTo({top:0,behavior:'smooth'});}));
  $('#exit-snapshot')?.addEventListener('click',()=>{snapshot=null;render();});
 }
 function selectedPeople(){return Array.from(document.querySelectorAll('#people-picker input:checked')).map(el=>el.value);}
 function fitEditorFocus(){if(!document.body.classList.contains('editor-focus'))return;document.body.style.setProperty('--focus-toolbar-height',Math.ceil($('.week-toolbar').getBoundingClientRect().height+8)+'px');}
 function toggleEditorFocus(){const entering=!document.body.classList.contains('editor-focus');if(entering)editorScroll=window.scrollY;document.body.classList.toggle('editor-focus',entering);render();requestAnimationFrame(()=>{window.scrollTo(0,entering?0:editorScroll);(entering?$('#focus-exit'):$('#focus-editor'))?.focus({preventScroll:true});});}
 function fitWholeWeek(){if(!shareWeek)return;const paper=$('#share-fit .share-paper'),stage=$('#share-stage');if(!paper)return;const scale=Math.min(1,Math.max(1,stage.clientWidth-24)/760,Math.max(1,stage.clientHeight-16)/paper.offsetHeight);paper.style.transform=`scale(${scale})`;$('#share-fit').style.width=(760*scale)+'px';$('#share-fit').style.height=(paper.offsetHeight*scale)+'px';}
 function renderWholeWeek(){if(!shareWeek)return;$('#share-fit').innerHTML=window.SCHShare.html(shareWeek);$('#share-notes-edit').hidden=!canEdit();requestAnimationFrame(fitWholeWeek);}
 function openWholeWeek(){const w=data();if(!w){toast('本周尚无可展示的最终排班');return;}shareWeek=M.clone(w);shareScroll=window.scrollY;$('#share-panel').hidden=false;$('#share-panel').classList.remove('capture-clean');document.body.classList.add('share-mode');renderWholeWeek();$('#share-back').focus();}
 function closeWholeWeek(){shareWeek=null;$('#share-panel').hidden=true;document.body.classList.remove('share-mode');window.scrollTo(0,shareScroll);$('#share-button').focus();}
 function exportCurrentWeek(){openWholeWeek();if(shareWeek)saveWholeWeek();}
 async function saveWholeWeek(){
  if(!shareWeek)return;
  const exportWeek=M.clone(shareWeek),button=$('#share-save');
  button.disabled=true;button.textContent='正在生成…';let svgURL;
  try{
   await document.fonts.ready;
   const p=window.SCHShare.packet(exportWeek);
   svgURL=URL.createObjectURL(new Blob([window.SCHShare.svg(exportWeek)],{type:'image/svg+xml;charset=utf-8'}));
   const img=new Image();
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('图片生成失败，请使用截屏模式'));img.src=svgURL;});
   const canvas=document.createElement('canvas');canvas.width=p.width*2;canvas.height=p.height*2;
   const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,p.width,p.height);ctx.drawImage(img,0,0,p.width,p.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败，请使用截屏模式');
   const filename=`SCH-${exportWeek.start}-${exportWeek.status==='final'?'V'+exportWeek.version:'草稿'}.png`;
   showImageSave(blob,filename);
  }catch(e){toast(e.message);}
  finally{if(svgURL)URL.revokeObjectURL(svgURL);button.disabled=false;button.textContent='保存整周图片';}
 }
 let preparedImage=null,preparedURL=null;
 function showImageSave(blob,filename){
  if(preparedURL){const oldURL=preparedURL;setTimeout(()=>URL.revokeObjectURL(oldURL),30000);}
  preparedImage=new File([blob],filename,{type:'image/png'});preparedURL=URL.createObjectURL(blob);
  $('#saved-image').src=preparedURL;$('#image-download').href=preparedURL;$('#image-download').download=filename;
  const native=window.SCHImageSave.supported(navigator,preparedImage);
  $('#image-native-share').hidden=!native;
  $('#image-save-status').textContent=native?'点“存入相册 / 分享”，在系统菜单中选择“存储图像”或“保存图片”；可用选项由手机决定。':'长按下方图片，在手机菜单中选择“存储图像”或“保存图片”。也可下载到文件。';
  $('#image-save-dialog').showModal();
 }
 $('#image-native-share').addEventListener('click',async()=>{
  const button=$('#image-native-share');button.disabled=true;
  const result=await window.SCHImageSave.share(navigator,preparedImage);button.disabled=false;
  $('#image-save-status').textContent=result==='shared'?'已交给系统处理，请到相册确认；网页无法确认你选择的保存位置。':result==='cancelled'?'已取消。仍可再次打开系统菜单，或长按图片保存。':'未能打开系统菜单。请长按下方图片保存，或使用“下载到文件”。';
 });
 function refreshFront(){const prev=$('#front-select').value;$('#front-select').innerHTML='<option value="">暂不指定前台</option>'+selectedPeople().map(id=>`<option value="${id}">${name(id)} · ${M.employee(id).name}</option>`).join('');if(selectedPeople().includes(prev))$('#front-select').value=prev;}
 function openCell(key){if(!canEdit())return;const [d,rowId]=key.split(':'),day=Number(d),row=M.rows.find(r=>r.id===rowId),c=data().cells[key]||{people:[],front:null};editing={day,rowId};
  $('#cell-title').textContent=row.name;$('#cell-subtitle').textContent=`${days[day]} · ${fullDate(M.addDays(start,day))}${row.time?' / '+row.time:''}`;
  const rest=M.restOn(state,M.addDays(start,day));$('#cell-rest-hint').textContent=rest.length?'◷ '+rest.map(name).join('、')+' 想在这天休息。你仍可以安排，请先核对。':'';
  $('#people-picker').innerHTML=M.employees.map(e=>`<label class="person-option">${avatar(e)}<span><strong>${e.code}</strong><small>${e.name}</small></span><input type="checkbox" value="${e.id}" ${c.people.includes(e.id)?'checked':''} aria-label="选择${e.code}"></label>`).join('');
  $('#front-field').hidden=!['shop','late'].includes(rowId);refreshFront();$('#front-select').value=c.front||'';document.querySelectorAll('#people-picker input').forEach(el=>el.addEventListener('change',refreshFront));$('#cell-dialog').showModal();
 }
 $('#cell-form').addEventListener('submit',e=>{e.preventDefault();run(()=>{M.setCell(state,actor,start,editing.day,editing.rowId,selectedPeople(),$('#front-field').hidden?null:$('#front-select').value||null);$('#cell-dialog').close();},'安排已保存，核对统计已更新');});
 $('#clear-cell').addEventListener('click',()=>run(()=>{M.setCell(state,actor,start,editing.day,editing.rowId,[],null);$('#cell-dialog').close();},'已清空本格'));
 $('#confirm-final').addEventListener('click',()=>run(()=>{M.finalize(state,actor,start);$('#confirm-dialog').close();},'已生成最终版，本周排班现已锁定'));
 document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>document.getElementById(el.dataset.close).close()));
 document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{if(restDraft!==null&&el.dataset.view!=='rest'&&!confirm('休息意愿尚未保存，离开将放弃本次未保存选择。继续吗？'))return;if(el.dataset.view!=='rest')restDraft=null;view=el.dataset.view;snapshot=null;render();}));
 $('#identity-select').innerHTML='<option value="owner">管理员 · 排班负责人</option>'+M.employees.map(e=>`<option value="${e.id}">员工 ${e.code} · ${e.name}</option>`).join('');
 $('#identity-select').addEventListener('change',e=>{if(restDraft!==null&&!confirm('休息意愿尚未保存，切换身份将放弃本次未保存选择。继续吗？')){e.target.value=actor.id;return;}actor=e.target.value==='owner'?owner:{role:'employee',id:e.target.value};restDraft=null;snapshot=null;render();toast(isOwner()?'已切换管理员演示身份':'已切换 '+name(actor.id)+' 的员工演示身份');});
 $('#prev-week').addEventListener('click',()=>moveWeek(M.addDays(start,-7)));$('#next-week').addEventListener('click',()=>moveWeek(M.addDays(start,7)));$('#week-picker').addEventListener('change',e=>{if(e.target.value)moveWeek(e.target.value);});
 $('#print-button').addEventListener('click',()=>{if(view==='schedule'&&!data()){toast('本周还没有可打印的正式排班');return;}if(view==='rest'&&restDraft!==null){toast('请先保存休息意愿后再打印');return;}window.print();});
 $('#share-button').addEventListener('click',openWholeWeek);
 $('#share-back').addEventListener('click',closeWholeWeek);
 $('#share-hide').addEventListener('click',()=>{$('#share-panel').classList.add('capture-clean');requestAnimationFrame(fitWholeWeek);});
 $('#share-stage').addEventListener('click',()=>{if($('#share-panel').classList.contains('capture-clean')){$('#share-panel').classList.remove('capture-clean');requestAnimationFrame(fitWholeWeek);}});
 $('#share-save').addEventListener('click',saveWholeWeek);$('#export-current').addEventListener('click',exportCurrentWeek);
 $('#share-notes-edit').addEventListener('click',()=>{if(!canEdit())return;$('#share-note-input').value=shareWeek.shareNote||'';$('#share-note-dialog').showModal();});
 $('#share-note-form').addEventListener('submit',e=>{e.preventDefault();try{M.setShareNote(state,actor,start,$('#share-note-input').value);persist();shareWeek=M.clone(data());$('#share-note-dialog').close();render();renderWholeWeek();}catch(error){toast(error.message);}});
 window.addEventListener('resize',()=>{fitWholeWeek();fitEditorFocus();});window.visualViewport?.addEventListener('resize',()=>{fitWholeWeek();fitEditorFocus();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){if(shareWeek)closeWholeWeek();else if(document.body.classList.contains('editor-focus'))toggleEditorFocus();}});
 $('#backup').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='SCH-本地样板备份-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 window.addEventListener('beforeunload',e=>{if(restDraft!==null){e.preventDefault();e.returnValue='';}});
 render();if(!storageError)persist();else toast('本地存储不可用或旧数据异常，当前展示示例，请先备份后继续');
})();
