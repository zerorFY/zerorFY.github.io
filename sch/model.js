(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SCH=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const employees=[{id:'al',code:'AL',name:'Alex',color:'#537eaa'},{id:'bo',code:'BO',name:'Bonnie',color:'#c18462'},{id:'cy',code:'CY',name:'Cyrus',color:'#739475'},{id:'de',code:'DE',name:'Demi',color:'#a784b5'},{id:'el',code:'EL',name:'Ellis',color:'#638e94'},{id:'fa',code:'FA',name:'Faye',color:'#b39252'},{id:'gu',code:'GU',name:'Gus',color:'#79819e'},{id:'ha',code:'HA',name:'Hana',color:'#bd7f92'}];
 const rows=[{id:'shop',name:'店面早班',en:'Showroom',time:'09:45–18:00',group:'work'},{id:'late',name:'店面晚班',en:'Late shift',time:'10:45–19:00',group:'work'},{id:'office',name:'办公',en:'Office',time:'09:45–18:00',group:'work'},{id:'warehouse',name:'仓库',en:'Warehouse',time:'09:45–18:00',group:'work'},{id:'vacuum',name:'吸尘',en:'Vacuum floor',group:'clean'},{id:'wipe',name:'擦桌子、床面',en:'Wipe surfaces',group:'clean'},{id:'sweep',name:'扫地',en:'Sweep floor',group:'clean'},{id:'mop',name:'拖地 · 每天半场',en:'Mop half the area',group:'clean'},{id:'rooms',name:'地毯间 / 厕所 / 休息室',en:'Shared spaces',group:'clean'},{id:'furniture',name:'家具底部',en:'Under furniture',group:'clean'}];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const employee=id=>employees.find(x=>x.id===id);
 function addDays(date,n){const d=new Date(date+'T12:00:00Z');if(Number.isNaN(d.getTime()))throw Error('日期无效');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
 function monday(date){const d=new Date(date+'T12:00:00Z');return addDays(date,-((d.getUTCDay()+6)%7));}
 function createState(){return {schema:1,weeks:{},rest:{}};}
 function blank(start){return {start,cells:{},notes:{},shareNote:'',status:'draft'};}
 function bucket(s,start){if(monday(start)!==start)throw Error('请选择周一日期');return s.weeks[start]||(s.weeks[start]={start,draft:blank(start),finals:[]});}
 function ensureWeek(s,start){const b=bucket(s,start);return b.draft||b.finals.at(-1);}
 function ownerOnly(actor){if(actor?.role!=='owner')throw Error('只有管理员可以操作排班');}
 function editable(s,actor,start){ownerOnly(actor);const b=bucket(s,start);if(!b.draft)throw Error('最终版已锁定，请先创建修订草稿');return b.draft;}
 function setCell(s,actor,start,day,rowId,people,front){
  const w=editable(s,actor,start);const row=rows.find(x=>x.id===rowId);
  if(!Number.isInteger(day)||day<0||day>6)throw Error('日期不在本周');
  if(!row)throw Error('未知岗位');if(people.some(id=>!employee(id)))throw Error('未知人员');
  if(front&&(!people.includes(front)||!['shop','late'].includes(rowId)))throw Error('前台必须属于本班店面人员');
  w.cells[day+':'+rowId]={people:[...new Set(people)],front:front||null};return w;
 }
 function setNote(s,actor,start,id,value){const w=editable(s,actor,start);if(!employee(id))throw Error('未知人员');w.notes[id]=String(value).slice(0,300);}
 function setShareNote(s,actor,start,value){const w=editable(s,actor,start);w.shareNote=String(value).slice(0,800);}
 function stats(w){return employees.map(e=>{const days=new Set();let front=0,clean=0;const tasks={};
  for(const [key,c] of Object.entries(w?.cells||{})){if(!c.people.includes(e.id))continue;const [d,r]=key.split(':');const row=rows.find(x=>x.id===r);if(!row)continue;if(row.group==='work')days.add(d);else{clean++;tasks[r]=(tasks[r]||0)+1;}if(c.front===e.id)front++;}
  return {...e,days:days.size,front,clean,tasks};});}
 function setRest(s,actor,start,dates,target){
  if(actor?.role!=='employee'||!employee(actor.id)||target&&target!==actor.id)throw Error('只能修改本人休息意愿');
  if(dates.some(d=>!Array.from({length:7},(_,i)=>addDays(start,i)).includes(d)))throw Error('日期不在本周');
  const week=s.rest[start]||(s.rest[start]={});week[actor.id]=[...new Set(dates)].sort();
 }
 function restOn(s,date){const week=s.rest[monday(date)]||{};return Object.keys(week).filter(id=>week[id].includes(date));}
 function finalize(s,actor,start){ownerOnly(actor);const b=bucket(s,start);if(!b.draft)return b.finals.at(-1);const result=clone({...b.draft,status:'final',version:b.finals.length+1,confirmedAt:new Date().toISOString(),confirmedBy:'管理员'});b.finals.push(result);b.draft=null;return result;}
 function revise(s,actor,start){ownerOnly(actor);const b=bucket(s,start);if(b.draft)return b.draft;const f=b.finals.at(-1);b.draft=blank(start);b.draft.cells=clone(f.cells);b.draft.notes=clone(f.notes);b.draft.shareNote=f.shareNote||'';return b.draft;}
 function visibleWeek(s,actor,start){const b=bucket(s,start);return actor.role==='owner'?(b.draft||b.finals.at(-1)):(b.finals.at(-1)||null);}
 function copyWeek(s,actor,from,to){ownerOnly(actor);const src=ensureWeek(s,from);const dest=bucket(s,to);if(dest.finals.length||Object.keys(dest.draft?.cells||{}).length)throw Error('目标周已有安排，不能覆盖');dest.draft=blank(to);dest.draft.cells=clone(src.cells);dest.draft.shareNote=src.shareNote||'';return dest.draft;}
 function warnings(s,w){if(!w)return [];const out=[];
  for(let d=0;d<7;d++){const date=addDays(w.start,d),working=new Map();
   for(const row of rows.filter(r=>r.group==='work'))for(const id of (w.cells[d+':'+row.id]?.people||[])){if(working.has(id))out.push({day:d,id,text:employee(id).code+' 同日有多个岗位，请核对时间'});working.set(id,true);if(restOn(s,date).includes(id))out.push({day:d,id,text:employee(id).code+' 已选这天休息'});}
   for(const row of rows.filter(r=>r.group==='clean'))for(const id of (w.cells[d+':'+row.id]?.people||[])){if(!working.has(id))out.push({day:d,id,text:employee(id).code+' 有清洁安排，但当天未排班'});if(['sweep','mop'].includes(row.id)&&(w.cells[d+':late']?.people||[]).includes(id))out.push({day:d,id,text:employee(id).code+' 晚班安排了扫地或拖地'});}
   const shop=w.cells[d+':shop'];if(shop?.people.length&&!shop.front)out.push({day:d,text:'店面早班尚未指定前台'});
   if(d===6&&w.cells[d+':late']?.people.length)out.push({day:d,text:'周日安排了晚班，请核对规则'});
  }return out;
 }
 function sampleState(){const s=createState(),owner={role:'owner'},start='2026-10-19';
  const shop=[['al','bo','cy'],['al','cy'],['bo','de'],['al','bo','de'],['al','cy','de'],['bo','cy','de'],['al','de']];
  const office=[['el','fa'],['el','fa'],['el','fa'],['el','fa','ha'],['el','fa'],['ha'],[]];
  const fronts=['bo','al','bo','de','al','cy','de'];
  for(let d=0;d<7;d++){setCell(s,owner,start,d,'shop',shop[d],fronts[d]);setCell(s,owner,start,d,'office',office[d],null);if([1,4,6].includes(d))setCell(s,owner,start,d,'warehouse',['gu'],null);if(d===2)setCell(s,owner,start,d,'warehouse',['ha'],null);
   setCell(s,owner,start,d,'wipe',[shop[d][0]],null);setCell(s,owner,start,d,'sweep',office[d].length?['fa']:['de'],null);if(d<6)setCell(s,owner,start,d,'mop',office[d].length?[office[d][0]]:[shop[d][1]],null);if(d<6)setCell(s,owner,start,d,'rooms',[shop[d].at(-1)],null);if([1,4,6].includes(d))setCell(s,owner,start,d,'vacuum',['gu'],null);}
  setCell(s,owner,start,3,'furniture',['al'],null);
  setRest(s,{role:'employee',id:'al'},start,['2026-10-21']);setRest(s,{role:'employee',id:'bo'},start,['2026-10-23']);setRest(s,{role:'employee',id:'ha'},start,['2026-10-25']);setRest(s,{role:'employee',id:'gu'},start,['2026-10-25']);return s;
 }
 return {employees,rows,clone,employee,addDays,monday,createState,ensureWeek,setCell,setNote,setShareNote,stats,setRest,restOn,finalize,revise,visibleWeek,copyWeek,warnings,sampleState};
});
