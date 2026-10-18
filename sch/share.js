(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));else root.SCHShare=factory(root.SCH);})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 const W=760,L=164,TITLE=64,HEAD=68,ROW=64,GAP=16,LINE=20;
 const weekdays=['MON','TUE','WED','THU','FRI','SAT','SUN'];
 const cleanLabels={vacuum:['吸尘','Vacuum floor'],wipe:['擦桌子床面等','Wipe tables,','surfaces, etc.'],sweep:['扫地','Sweep floor'],mop:['拖地（每天拖半场）','Mop floor','(half the area)'],rooms:['地毯间/厕所/休息室','Rug room/','washroom/break room'],furniture:['家具底部','Under furniture']};
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function wrap(text,limit=88){const lines=[];for(const paragraph of String(text).split('\n')){let line='',units=0;for(const char of paragraph){const size=char.charCodeAt(0)>255?2:1;if(units+size>limit){const space=line.lastIndexOf(' ');if(space>line.length*.55){lines.push(line.slice(0,space));line=line.slice(space+1);units=[...line].reduce((n,c)=>n+(c.charCodeAt(0)>255?2:1),0);}else{lines.push(line);line='';units=0;}}line+=char;units+=size;}lines.push(line.trimEnd());}return lines;}
 function packet(w){if(!w)throw Error('没有可展示的排班');const dates=weekdays.map((_,i)=>M.addDays(w.start,i));const notes=[
  '备注：家具底部的清洁，沙发、床、茶几等家具腿的清洁，以及桌面上台灯底下都是死角。',
  'Note: Clean under furniture, around furniture legs, and other hard-to-reach areas such as under desk lamps.',
  '备注：红色为值班前台。',
  'Note: Red = front desk on duty.'
 ];if(w.shareNote?.trim())notes.push('本周备注 / Weekly notes: '+w.shareNote.trim());
 const noteLines=notes.flatMap(text=>wrap(text));return {width:W,height:TITLE+HEAD+ROW*10+GAP+noteLines.length*LINE+16,dates,weekdays,caption:(w.status==='final'?'最终版 V'+w.version:'草稿 · 未定稿'),noteLines,rows:M.rows.map(r=>({id:r.id,labels:cleanLabels[r.id]||[r.name,r.time],cells:dates.map((_,day)=>{const c=w.cells[day+':'+r.id]||{people:[],front:null};return {dash:r.id==='late',people:c.people.map(id=>({code:M.employee(id)?.code||id,front:c.front===id}))};})}))};}
 function labelNote(text){return esc(text).replace('红色','<span class="share-front">红色</span>').replace('Red =','<span class="share-front">Red</span> =');}
 function notesHTML(w){return packet(w).noteLines.map(line=>'<div>'+labelNote(line)+'</div>').join('');}
 function html(w){const p=packet(w),date=d=>d.slice(5);return `<article class="share-paper" style="width:${W}px" aria-label="整周排班分享表"><header class="share-title">排班表<span>Schedule</span><small>${esc(p.caption)}</small></header><table class="share-week-table" aria-label="一周整版排班"><colgroup><col style="width:${L}px">${p.dates.map(()=>'<col>').join('')}</colgroup><thead><tr><th rowspan="2" class="share-week-range">${date(p.dates[0]).replace('-','.')}–${date(p.dates[6]).replace('-','.')}</th>${p.weekdays.map(d=>'<th>'+d+'</th>').join('')}</tr><tr>${p.dates.map(d=>'<th>'+date(d)+'</th>').join('')}</tr></thead><tbody>${p.rows.map((r,i)=>(i===4?'<tr class="share-divider"><td colspan="8"></td></tr>':'')+`<tr><th>${r.labels.map(t=>'<span>'+esc(t)+'</span>').join('')}</th>${r.cells.map(c=>'<td>'+ (c.people.length?c.people.map(e=>'<span class="'+(e.front?'share-front':'')+'">'+esc(e.code)+'</span>').join(' '):(c.dash?'−':''))+'</td>').join('')}</tr>`).join('')}</tbody></table><footer class="share-notes">${notesHTML(w)}</footer></article>`;}
 function text(x,y,value,options=''){return `<text x="${x}" y="${y}" ${options}>${esc(value)}</text>`;}
 function svg(w){const p=packet(w),col=(W-L)/7;let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${p.height}" viewBox="0 0 ${W} ${p.height}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial,Microsoft YaHei,sans-serif" fill="#111">`;
 out+=text(W/2,43,'排班表 Schedule','font-size="40" text-anchor="middle"')+text(W-8,59,p.caption,'font-size="10" text-anchor="end" fill="#666"');
 const gridLine=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="1"/>`;
 const date=d=>d.slice(5);out+=text(L/2,TITLE+39,date(p.dates[0]).replace('-','.')+'–'+date(p.dates[6]).replace('-','.'),'font-size="16" text-anchor="middle" fill="#d32121"');
 out+=gridLine(0,TITLE,W,TITLE)+gridLine(L,TITLE+34,W,TITLE+34)+gridLine(0,TITLE+HEAD,W,TITLE+HEAD);
 for(let d=0;d<7;d++){const cx=L+col*(d+.5);out+=text(cx,TITLE+22,p.weekdays[d],'font-size="16" font-weight="700" text-anchor="middle"')+text(cx,TITLE+57,date(p.dates[d]),'font-size="16" text-anchor="middle"');}
 let y=TITLE+HEAD;
 for(let i=0;i<p.rows.length;i++){if(i===4){out+=gridLine(0,y+GAP,W,y+GAP);y+=GAP;}const r=p.rows[i];r.labels.forEach((label,n)=>out+=text(L/2,y+ROW/2-(r.labels.length-1)*9+n*18+5,label,'font-size="15" font-weight="600" text-anchor="middle"'));
  for(let d=0;d<7;d++){const c=r.cells[d],cx=L+col*(d+.5);if(!c.people.length){if(c.dash)out+=text(cx,y+ROW/2+5,'−','font-size="17" text-anchor="middle"');continue;}const groups=[];let group=[];let units=0;for(const e of c.people){if(units+e.code.length+1>9&&group.length){groups.push(group);group=[];units=0;}group.push(e);units+=e.code.length+1;}if(group.length)groups.push(group);groups.forEach((g,n)=>{const yy=y+ROW/2-(groups.length-1)*10+n*20+5;out+=`<text x="${cx}" y="${yy}" font-size="17" text-anchor="middle">${g.map((e,j)=>`<tspan fill="${e.front?'#d32121':'#111'}">${j?' ':''}${esc(e.code)}</tspan>`).join('')}</text>`;});}
  y+=ROW;out+=gridLine(0,y,W,y);
 }
 for(let c=0;c<=8;c++){const x=c===0?0:c===1?L:L+col*(c-1);out+=gridLine(x,TITLE,x,y);}
 p.noteLines.forEach((note,n)=>out+=`<text x="5" y="${y+18+n*LINE}" font-size="16" font-weight="600">${esc(note).replace('红色','<tspan fill="#d32121">红色</tspan>').replace('Red =','<tspan fill="#d32121">Red</tspan> =')}</text>`);
 out+='</g></svg>';return out;
 }
 return {packet,html,svg,notesHTML};
});
