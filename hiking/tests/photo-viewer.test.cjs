const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').join(process.argv[2]||'.',process.argv[3]||'hiking/shared/photo-viewer.js'),'utf8');
function setup(reduced=false,generic=false){
 let now=0,tid=0,timers=new Map(),scroll=[0,500],els={};
 class El{
  constructor(id){this.id=id;this.attrs={};this.style={};this.handlers={};this.disabled=false;this.textContent='';this.children=[];this.className='';this.classList={set:new Set(),add:c=>this.classList.set.add(c),remove:c=>this.classList.set.delete(c),contains:c=>this.classList.set.has(c)};this.src='';this.width=300;this.height=225;this.clientWidth=390;this.clientHeight=700;this.naturalWidth=1888;this.naturalHeight=1415;}
  addEventListener(k,f){(this.handlers[k]??=[]).push(f)}
  emit(k,o={}){let e={target:this,button:0,pointerId:1,pointerType:'touch',clientX:195,clientY:350,preventDefault(){this.prevented=true},...o};for(let f of this.handlers[k]||[])f(e);return e}
  getAttribute(k){return this.attrs[k]??null} setAttribute(k,v){this.attrs[k]=v;if(k==='style')this.style={};} removeAttribute(k){delete this.attrs[k];if(k==='style')this.style={};if(k==='src')this.src=''} hasAttribute(k){return k in this.attrs}
  appendChild(el){if(el.parentNode)el.parentNode.removeChild(el);this.children.push(el);el.parentNode=this;return el} removeChild(el){this.children.splice(this.children.indexOf(el),1);el.parentNode=null} remove(){if(this.parentNode)this.parentNode.removeChild(this)}
  focus(){document.activeElement=this} closest(q){if(q==='[data-photo-gallery]')return generic?this.group:null;return q==='section.day'&&!generic?chapter:null}
  getBoundingClientRect(){return this.id==='lightbox-stage'?{left:0,top:0,width:390,height:700}:{left:45,top:237.5,width:300,height:225}} setPointerCapture(){} releasePointerCapture(){}
 }
 for(let id of ['lightbox','lightbox-img','lightbox-stage','lightbox-close','lightbox-prev','lightbox-next','lightbox-count','lightbox-status'])els[id]=new El(id);
 const stage=els['lightbox-stage'],img=els['lightbox-img'],lb=els.lightbox;stage.appendChild(img);
 let images=[0,1,2].map(i=>{let x=new El('photo'+i);x.src='old'+i+'.jpg';if(i!==2)x.setAttribute('data-full','full'+i+'.webp');return x});
 let chapter={querySelectorAll:()=>images};let groups=[{querySelectorAll:()=>images.slice(0,2)},{querySelectorAll:()=>images.slice(2)}];images.forEach((image,i)=>image.group=groups[i<2?0:1]);let body=new El('body'),root=new El('html');body.children=[new El('main'),lb];
 let document={body,documentElement:root,activeElement:images[0],getElementById:id=>els[id],createElement:tag=>new El(tag),querySelectorAll:()=>images,addEventListener(k,f){(this.handlers[k]??=[]).push(f)},handlers:{}};
 const context={document,window:{innerWidth:390,innerHeight:700,scrollX:0,scrollY:500,scrollTo:(x,y)=>{scroll=[x,y]},addEventListener(){},matchMedia:()=>({matches:reduced})},Date:{now:()=>now},setTimeout:f=>{timers.set(++tid,f);return tid},clearTimeout:id=>timers.delete(id),Math,Array,Map,Set,console};
 vm.runInNewContext(source,context);
 const flush=()=>{let ts=[...timers.values()];timers.clear();for(let f of ts)f()};
 const point=(type,id,x,y)=>stage.emit(type,{pointerId:id,clientX:x,clientY:y});
 const drag=(a,b,settle=true)=>{point('pointerdown',1,...a);point('pointermove',1,...b);point('pointerup',1,...b);if(settle)flush()};
 const tap=()=>{point('pointerdown',1,195,350);point('pointerup',1,195,350)};
 const double=()=>{now+=1000;tap();now+=100;tap();flush()};
 const scale=()=>Number(img.style.transform.match(/scale\(([^)]+)\)/)[1]);
 const key=key=>{for(let f of document.handlers.keydown)f({key,preventDefault(){}})};
 return {els,stage,img,lb,images,body,root,document,point,drag,tap,double,scale,key,flush,scroll:()=>scroll,initializeAgain:()=>vm.runInNewContext(source,context)};
}
let tests=0;
function test(name,fn){try{fn();console.log('PASS',name);tests++}catch(e){console.error('FAIL',name);throw e}}
test('pinch zoom and translation around midpoint; residual finger never closes',()=>{
 let t=setup();t.images[0].emit('click');
 t.point('pointerdown',1,145,350);t.point('pointerdown',2,245,350);t.point('pointermove',1,95,350);t.point('pointermove',2,295,350);
 assert.equal(t.scale(),2);assert.equal(t.img.src,'full0.webp');
 t.point('pointerup',2,295,350);t.point('pointerup',1,95,350);t.flush();assert(t.lb.classList.contains('show'));
 t.double();assert.equal(t.scale(),1);t.double();assert.equal(t.scale(),2.5);
});
test('pinch clamps 1..5, cancellation and third pointer cannot navigate or dismiss',()=>{
 let t=setup();t.images[1].emit('click');t.point('pointerdown',1,190,350);t.point('pointerdown',2,200,350);
 t.point('pointermove',2,500,350);assert.equal(t.scale(),5);
 t.point('pointerdown',3,100,200);t.point('pointermove',3,0,650);assert.equal(t.img.src,'full1.webp');
 t.point('pointercancel',2,500,350);t.point('pointerup',1,190,350);t.point('pointerup',3,0,650);t.flush();assert(t.lb.classList.contains('show'));
 t.point('pointerdown',1,95,350);t.point('pointerdown',2,295,350);t.point('pointermove',1,194,350);t.point('pointermove',2,196,350);assert.equal(t.scale(),1);
 t.point('pointerup',1,194,350);t.point('pointerup',2,196,350);t.flush();assert(t.lb.classList.contains('show'));
});
test('off-center pinch keeps the touched content under the moving midpoint',()=>{
 let t=setup();t.images[0].emit('click');t.point('pointerdown',1,115,350);t.point('pointerdown',2,215,350);
 t.point('pointermove',1,65,350);t.point('pointermove',2,265,350);assert.equal(t.scale(),2);assert.match(t.img.style.transform,/translate\(30px,\s*0px\)/);
 t.point('pointermove',1,75,350);t.point('pointermove',2,275,350);assert.equal(t.scale(),2);assert.match(t.img.style.transform,/translate\(40px,\s*0px\)/);
});
test('downward fitted drag dismisses and restores page; upward/short/zoomed drag stays open',()=>{
 let t=setup();t.images[0].emit('click');t.drag([195,500],[195,250]);assert(t.lb.classList.contains('show'));
 t.drag([195,350],[195,380]);assert(t.lb.classList.contains('show'));t.double();t.drag([195,200],[195,600]);assert(t.lb.classList.contains('show'));assert.equal(t.img.src,'full0.webp');
 t.double();t.drag([195,250],[200,500]);assert(!t.lb.classList.contains('show'));assert.deepEqual(t.scroll(),[0,500]);assert.equal(t.body.style.position,undefined);assert.equal(t.document.activeElement,t.images[0]);
});
test('swipe follows finger, animates adjacent image, commits once and snaps at boundaries',()=>{
 let t=setup();t.images[0].emit('click');t.point('pointerdown',1,300,350);t.point('pointermove',1,100,350);
 assert.notEqual(t.img.parentNode.style.transform,'translate(0px, 0px)');assert.equal(t.stage.children.length,2,'adjacent photo frame visible');
 t.point('pointerup',1,100,350);assert.equal(t.img.src,'full0.webp','do not replace during outgoing transition');assert(t.img.parentNode.style.transition.includes('transform'));
 t.flush();assert.equal(t.img.src,'full1.webp');assert.equal(t.stage.children.length,1);
 t.drag([300,350],[100,350]);assert.equal(t.img.src,'old2.jpg');assert(t.els['lightbox-next'].disabled);
 t.drag([300,350],[100,350]);assert.equal(t.img.src,'old2.jpg');assert.equal(t.stage.children.length,1);
 t.drag([100,350],[125,350]);assert.equal(t.img.src,'old2.jpg');t.drag([100,350],[300,350]);assert.equal(t.img.src,'full1.webp');
});
test('close/reopen cancels pending animation; reduced motion settles immediately',()=>{
 let t=setup();t.images[0].emit('click');t.drag([300,350],[100,350],false);t.key('Escape');t.images[2].emit('click');t.flush();assert.equal(t.img.src,'old2.jpg');assert(t.lb.classList.contains('show'));assert.equal(t.stage.children.length,1);
 t=setup(true);t.images[0].emit('click');t.drag([300,350],[100,350],false);assert.equal(t.img.src,'full1.webp');assert.equal(t.stage.children.length,1);
});
test('rapid repeated navigation commits once; canceled and diagonal drags do not close',()=>{
 let t=setup();t.images[0].emit('click');t.drag([300,350],[100,350],false);t.key('ArrowRight');t.key('ArrowRight');t.flush();assert.equal(t.img.src,'full1.webp');
 t.drag([100,200],[190,290]);assert(t.lb.classList.contains('show'));assert.equal(t.img.src,'full1.webp');
 t.point('pointerdown',1,195,250);t.point('pointermove',1,195,550);t.point('pointercancel',1,195,550);t.flush();assert(t.lb.classList.contains('show'));assert.equal(t.stage.children.length,1);
 t.tap();t.flush();assert(!t.lb.classList.contains('show'));
});
test('original interaction contract: background/focus/keys, taps, full fallback, zoomed pan',()=>{
 let t=setup();t.images[0].emit('click');assert.equal(t.body.style.position,'fixed');assert.equal(t.root.style.overflow,'hidden');
 assert(t.lb.emit('wheel').prevented);assert(t.lb.emit('touchmove').prevented);
 t.double();t.drag([300,350],[100,350]);assert.equal(t.img.src,'full0.webp');t.double();t.drag([300,350],[100,350]);assert.equal(t.img.src,'full1.webp');
 t.key('ArrowLeft');t.flush();assert.equal(t.img.src,'full0.webp');t.tap();t.flush();assert(!t.lb.classList.contains('show'));assert.deepEqual(t.scroll(),[0,500]);
});
test('generic galleries need no Langta classes and cannot cross group boundaries',()=>{
 let t=setup(false,true);t.images[0].emit('click');assert.equal(t.els['lightbox-count'].textContent,'1 / 2');
 t.drag([300,350],[100,350]);assert.equal(t.img.src,'full1.webp');t.drag([300,350],[100,350]);assert.equal(t.img.src,'full1.webp');assert(t.els['lightbox-next'].disabled);
 t.key('Escape');t.images[2].emit('click');assert.equal(t.els['lightbox-count'].textContent,'1 / 1');assert.equal(t.img.src,'old2.jpg');assert(t.els['lightbox-prev'].disabled&&t.els['lightbox-next'].disabled);
});
test('duplicate initialization does not add frames or bind multiple gesture handlers',()=>{
 let t=setup();t.initializeAgain();assert.equal(t.stage.children.length,1);t.images[0].emit('click');t.double();assert.equal(t.scale(),2.5);t.drag([300,350],[100,350]);assert.equal(t.img.src,'full0.webp');
});
console.log(`PASS ${tests} gesture/regression scenarios`);
