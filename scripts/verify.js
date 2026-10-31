/* Verification: routes x viewports, peel, rail, selection, archive field, story pace, profile, index, fallbacks, links.
   Usage: BASE=http://127.0.0.1:4195 ENGINE=chromium|firefox|webkit node scripts/verify.js
   Chromium-only checks (CDP touch) are skipped on the other engines and reported as SKIP. */
const pw=require('playwright');
const ENGINE=process.env.ENGINE||'chromium';
const BASE=process.env.BASE||'http://127.0.0.1:4195';
const SHARE=process.env.SHARE_QS||'';           /* "?_vercel_share=..." when run against a protected preview */
const U=(p)=>{
 const [pathname,hash]=p.split('#');
 return BASE+pathname+(SHARE&&!pathname.includes('?')?SHARE:'')+(hash?'#'+hash:'');
};
const ORDER=['reclaim','wealthwithsg','sankalp-shristi-furnishers','aureledger','kaal','experiments'];
const STORIES=ORDER.map(s=>`/work/${s}/`);
const routes=['/','/projects/',...STORIES,'/archive/','/profile/','/about/','/contact/'];
const out=[];const ok=(c,m)=>{const line=(c?'PASS ':'FAIL ')+m;out.push(line);console.log(line);};const skip=(m)=>out.push('SKIP '+m);
const xform=()=>-new DOMMatrix(getComputedStyle(document.querySelector('[data-track]')).transform).m41;
(async()=>{
 const b=await pw[ENGINE].launch(ENGINE==='chromium'?{args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']}:{});
 // Keep authorized preview access across internal links even where an engine
 // does not retain Vercel's bypass cookie. Never send the share to other hosts.
 const context=async options=>{
  const ctx=await b.newContext(options);
  if(SHARE) await ctx.route(BASE+'/**',async route=>{
   const req=route.request();const url=new URL(req.url());
   if(req.isNavigationRequest()&&url.origin===new URL(BASE).origin&&!url.searchParams.has('_vercel_share')){
    for(const [key,value] of new URLSearchParams(SHARE.replace(/^\?/,'')))url.searchParams.set(key,value);
    return route.continue({url:url.href});
   }
   return route.continue();
  });
  return ctx;
 };
 // 1. routes x 3 viewports
 for(const [w,h] of [[390,844],[768,1024],[1440,900]]){
  const ctx=await context({viewport:{width:w,height:h},hasTouch:w<800,...(ENGINE==='chromium'?{isMobile:w<700}:{})});
  for(const r of routes){
   const p=await ctx.newPage();const errs=[];
   p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push('pageerror '+e.message));
   p.on('response',res=>{if(res.status()>=400)errs.push(res.status()+' '+res.url())});
   const resp=await p.goto(U(r),{waitUntil:'load'});
   // /about/ has both meta and JS redirects on a plain static server; Firefox
   // may finish that navigation without a Response. Verify the destination's
   // actual HTTP response separately rather than dereferencing null or treating a
   // cached redirect (304 on Vercel/Firefox) as the destination response.
   let status=resp?.status();
   if(r==='/about/'){
    await p.waitForURL('**/profile/');
    status=(await ctx.request.get(U('/profile/'))).status();
   }
   await p.waitForTimeout(700);
   const H=await p.evaluate(()=>document.documentElement.scrollHeight);
   for(let y=0;y<Math.min(H,30000);y+=h*.7){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(50);}
   await p.waitForTimeout(400);
   const info=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,title:document.title,h1:document.querySelectorAll('h1').length,og:!!document.querySelector('meta[property="og:image"]'),broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.currentSrc).length,noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).length}));
   ok(status===200&&errs.length===0,`${ENGINE} ${w}px ${r} status=${status ?? "no document response"} errors=${JSON.stringify(errs)}`);
   ok(info.sw<=w+1,`${w}px ${r} no horizontal overflow (${info.sw}/${w})`);
   ok(info.broken===0&&info.noalt===0,`${w}px ${r} images ok`);
   if(w===1440&&r!=='/about/')ok(info.title.length>5&&info.og&&info.h1>=1,`${r} meta ok`);
   await p.close();}
  await ctx.close();}
 // 2. gallery: one composed viewport; hold / click / keyboard enter the CURRENT project; arrows change the selection
 {const ctx=await context({viewport:{width:1440,height:900}});
  await ctx.addInitScript(()=>{window.__arr=[];const push=()=>{if(document.documentElement)__arr.push(document.documentElement.className)};push();new MutationObserver(push).observe(document,{subtree:true,attributes:true,attributeFilter:['class']});});
  const p=await ctx.newPage();
  await p.goto(U('/'));await p.waitForTimeout(1000);
  const slug=()=>p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug);
  ok(await slug()==='reclaim','root opens on the Reclaim gallery scene');
  const clutter=await p.evaluate(()=>({ticks:!!document.querySelector('.ticks'),peel:!!document.querySelector('.peel-h,.peel'),contents:!!document.querySelector('.contents'),all:!!document.querySelector('.controls .all'),hint:!!document.querySelector('.hint'),dragTo:/drag to/i.test(document.body.innerText),keys:/keys\s*·\s*swipe/i.test(document.body.innerText)}));
  ok(Object.values(clutter).every(v=>!v),`gallery: ticks, corner handle, duplicate collection, All-projects link, hints and "Drag to" are gone ${JSON.stringify(clutter)}`);
  ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'gallery: one composed viewport (no second directory beneath)');
  ok(await p.evaluate(()=>/Bodoni Moda/.test(getComputedStyle(document.querySelector('.slide.is-active .t')).fontFamily)),'gallery: display type uses the unified display family');
  ok(/06/.test(await p.textContent('.counter')),'gallery: counter shows the six projects');
  ok(await p.evaluate(()=>document.querySelector('.slide.is-active .t a').getAttribute('href')==='/work/reclaim/')&&/Enter\s*project/i.test(await p.textContent('.slide.is-active .enter')),'gallery: title and the labelled Enter action both open the CURRENT project');
  const seen=[await slug()];for(let i=0;i<6;i++){await p.click('[data-next]');await p.waitForFunction((n)=>document.querySelector('.slide.is-active')?.dataset.slug!==n,seen[seen.length-1],{timeout:4000}).catch(()=>{});seen.push(await slug());}
  ok(seen.join()==='reclaim,wealthwithsg,sankalp-shristi-furnishers,aureledger,kaal,archive,reclaim','gallery: arrows cycle all six projects and wrap');
  await p.goto(U('/'));await p.waitForTimeout(900);
  // hold: immediate feedback, cancel returns, completion enters the CURRENT project
  const hist0=await p.evaluate(()=>history.length);
  await p.mouse.move(900,330);await p.mouse.down();await p.waitForTimeout(160);
  const early=await p.evaluate(()=>({lens:!!document.querySelector('.slide.is-active .lens'),sel:getSelection().toString().length}));
  ok(early.lens&&early.sel===0,'hold: feedback (a lens surface) appears immediately and nothing is selected');
  await p.mouse.up();await p.waitForFunction(()=>!document.querySelector('.lens'),null,{timeout:4000}).catch(()=>{});
  ok(await p.evaluate(()=>!document.querySelector('.lens'))&&new URL(p.url()).pathname==='/'&&(await p.evaluate(()=>history.length))===hist0,'hold: early release relaxes back to rest, no navigation and no history entry');
  ok(await slug()==='reclaim','hold: cancel leaves the selection unchanged');
  await p.click('[data-next]');await p.waitForTimeout(1400);
  await p.mouse.move(900,330);await p.mouse.down();
  await p.waitForURL('**/work/wealthwithsg/',{timeout:7000}).catch(()=>{});
  ok(new URL(p.url()).pathname==='/work/wealthwithsg/','hold: completing on the selected project opens THAT project (WealthWithSG), never the next one');
  const arr=await p.evaluate(()=>window.__arr.join('|'));
  ok(/is-arriving/.test(arr),'transition: the destination begins on the lens end-frame (arrival overlay present before first paint)');
  await p.waitForFunction(()=>!document.documentElement.classList.contains('is-arriving'),null,{timeout:6000}).catch(()=>{});
  ok(await p.evaluate(()=>!document.documentElement.classList.contains('is-arriving')&&!document.documentElement.classList.contains('is-settling')),'transition: the arrival overlay always clears');
  await p.goBack();await p.waitForTimeout(1200);
  ok(new URL(p.url()).pathname==='/'&&await slug()==='wealthwithsg'&&!(await p.evaluate(()=>!!document.querySelector('.lens'))),'back: returns to the gallery on the same project, without a stuck overlay');
  // title click and keyboard
  await p.goto(U('/'));await p.waitForTimeout(900);await p.click('.slide.is-active .t a');await p.waitForURL('**/work/reclaim/',{timeout:7000}).catch(()=>{});
  ok(new URL(p.url()).pathname==='/work/reclaim/','click on the title enters the current project through the lens');
  await p.goto(U('/'));await p.waitForTimeout(900);await p.focus('.slide.is-active .enter');await p.keyboard.press('Enter');await p.waitForURL('**/work/reclaim/',{timeout:7000}).catch(()=>{});
  ok(new URL(p.url()).pathname==='/work/reclaim/','keyboard Enter on the Enter action enters the current project');
  await p.goto(U('/about/'));await p.waitForURL('**/profile/');ok(true,'/about/ redirects to /profile/');
  await ctx.close();
  // WebGL unavailable: the same states run on a plain scaled still, and navigation still works
  const nc=await context({viewport:{width:1440,height:900}});await nc.addInitScript(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...r){return /webgl/.test(t)?null:g.call(this,t,...r)}});
  const q=await nc.newPage();await q.goto(U('/'));await q.waitForTimeout(900);await q.mouse.move(900,330);await q.mouse.down();await q.waitForTimeout(250);
  ok(await q.evaluate(()=>!!document.querySelector('.lens--css')),'no WebGL: hold falls back to a CSS surface');
  await q.mouse.up();await q.waitForTimeout(600);await q.click('.slide.is-active .t a');await q.waitForURL('**/work/reclaim/',{timeout:7000}).catch(()=>{});ok(new URL(q.url()).pathname==='/work/reclaim/','no WebGL: entry still navigates');
  await nc.close();
  // reduced motion: no hold surface, direct navigation
  const rm=await context({viewport:{width:1440,height:900},reducedMotion:'reduce'});const r2=await rm.newPage();await r2.goto(U('/'));await r2.waitForTimeout(700);await r2.mouse.move(900,330);await r2.mouse.down();await r2.waitForTimeout(700);
  ok(await r2.evaluate(()=>!document.querySelector('.lens'))&&new URL(r2.url()).pathname==='/','reduced motion: holding does nothing; the title link enters directly');
  await r2.mouse.up();await r2.click('.slide.is-active .t a');await r2.waitForURL('**/work/reclaim/',{timeout:5000}).catch(()=>{});ok(new URL(r2.url()).pathname==='/work/reclaim/','reduced motion: title link navigates immediately');await rm.close();}
 // 3. project pages: rail, peel to next project, never an internal section
 for(const [i,s] of ORDER.entries()){
  const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U(`/work/${s}/`));await p.waitForTimeout(1200);
  const rail=await p.evaluate(()=>{const r=document.querySelector('.rail');const rr=r.getBoundingClientRect();const hero=document.querySelector('.hero').getBoundingClientRect();const pin=document.querySelector('.hs__pin').getBoundingClientRect();const nav=document.querySelector('.hs__nav');return {pos:getComputedStyle(r).position,left:rr.left,w:rr.width,pinR:pin.right,heroR:hero.right,close:r.querySelector('.rail__close').getAttribute('href'),name:r.querySelector('.rail__title').textContent.trim(),act:r.querySelector('.rail__act').textContent.trim(),next:r.querySelector('.rail__next').getAttribute('href'),extras:!!r.querySelector('.rail__no,.rail__prog,.peel-h,.peel-h__tri'),dragTo:/drag to/i.test(document.body.innerText),tri:!!document.querySelector('.peel-h,.peel-h__tri'),strip:nav?getComputedStyle(nav).visibility:'none',counters:/\d\d\s*\/\s*\d\d/.test(r.innerText+(nav?nav.innerText:''))}});
  const nx=ORDER[(i+1)%ORDER.length];
  ok(rail.pos==='fixed'&&rail.pinR<=rail.left+1&&rail.heroR<=rail.left+1,`${s}: rail is fixed and its space is reserved (story right ${Math.round(rail.pinR)} <= rail ${Math.round(rail.left)})`);
  ok(rail.next===`/work/${nx}/`&&rail.close.startsWith('/#'),`${s}: rail close -> gallery, next -> /work/${nx}/ (shared order)`);
  ok(!rail.extras&&!rail.dragTo&&!rail.tri&&rail.strip!=='visible'&&!rail.counters,`${s}: rail is quiet (no numbers, counters, corner triangle, resting next name or chapter strip)`);
  ok(rail.act.length>3&&!/film/i.test(rail.act),`${s}: rail primary action is a real action ("${rail.act}")`);
  const g=await p.evaluate(()=>{const hs=document.querySelector('.hs');return {t:hs.getBoundingClientRect().top+scrollY,h:hs.offsetHeight,tv:HS.travel,K:HS.K,pin:document.querySelector('.hs__pin').clientWidth,panels:HS.panels.length}});
  ok(Math.abs(g.h-(g.tv*g.K+900))<=2,`${s}: document height = travel x K + viewport (${g.h})`);
  const perScene=g.tv*g.K/g.panels;ok(perScene>=1500,`${s}: each scene gets about ${Math.round(perScene)}px of vertical travel`);
  // burst of wheel input is damped
  await p.evaluate(y=>scrollTo(0,y),g.t);await p.waitForTimeout(400);await p.mouse.move(600,400);
  for(let k=0;k<10;k++){await p.mouse.wheel(0,200);await p.waitForTimeout(14);}
  const soon=await p.evaluate(()=>HS.x);await p.waitForFunction(()=>Math.abs(HS.x-HS.target)<2,null,{timeout:6000}).catch(()=>{});const later=await p.evaluate(()=>({x:HS.x,t:HS.target}));
  ok(soon<=g.pin*1.2&&Math.abs(later.x-later.t)<2,`${s}: a 2000px wheel burst moves ${Math.round(later.x)}px (<= about a scene) and settles on target`);
  // reversing responds
  await p.evaluate(y=>scrollTo(0,y),g.t+g.tv*g.K*0.5);await p.waitForTimeout(300);await p.waitForFunction(()=>Math.abs(HS.x-HS.target)<2,null,{timeout:12000}).catch(()=>{});
  const x0=await p.evaluate(()=>HS.x);await p.evaluate(y=>scrollTo(0,y),g.t+g.tv*g.K*0.5-600);await p.waitForTimeout(220);const x1=await p.evaluate(()=>HS.x);
  ok(x1<x0-20,`${s}: reversing direction responds promptly (${Math.round(x0)} -> ${Math.round(x1)} in 220ms)`);
  // chapters are discreet: a popover opened from the rail, listing the chapters; choosing one settles on it
  await p.evaluate(()=>HS.scrollToX(HS.panels[2].__start-40,false));await p.waitForTimeout(400);
  await p.evaluate(y=>scrollTo(0,y),g.t);await p.waitForTimeout(600);
  await p.click('[data-chapters]');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.hs__nav')).visibility==='visible'&&document.querySelectorAll('.hs__nav [data-go]').length===HS.panels.length&&document.querySelector('[data-chapters]').getAttribute('aria-expanded')==='true'),`${s}: chapters popover lists every chapter on request`);
  await p.click('.hs__nav [data-go="3"]');await p.waitForTimeout(2800);
  const j=await p.evaluate(()=>({x:HS.x,want:Math.max(0,HS.panels[3].offsetLeft-Math.min(80,document.querySelector('.hs__pin').clientWidth*0.04)),open:document.querySelector('.hs__nav').classList.contains('is-open')}));
  ok(Math.abs(j.x-j.want)<3&&!j.open,`${s}: chapter jump settles on the scene and the popover closes (x=${Math.round(j.x)}, wanted ${Math.round(j.want)})`);
  // selection: drag across headings/images leaves nothing highlighted
  await p.evaluate(y=>scrollTo(0,y),g.t);await p.waitForTimeout(500);
  await p.mouse.move(100,300);await p.mouse.down();await p.mouse.move(1000,700,{steps:12});await p.mouse.up();
  await p.waitForTimeout(100);
  const hl=await p.evaluate(()=>{const r=getSelection();const els=[...document.querySelectorAll('.hs h1,.hs h2,.hs h3,.pn-big,.pn-h,.rc-title,.hs img,.rail *,.chrome *')];return els.filter(e=>r.rangeCount&&!r.isCollapsed&&r.containsNode(e,true)).length});
  ok(hl===0,`${s}: dragging leaves no headings, images or controls highlighted (${hl})`);
  ok(await p.evaluate(()=>[...document.querySelectorAll('.hs img')].every(i=>i.getAttribute('draggable')==='false'||getComputedStyle(i).webkitUserDrag==='none')),`${s}: images are not natively draggable`);
  // Next project: the rail control runs the lens transition to the NEXT project; internal sections are never opened
  await p.reload();await p.waitForTimeout(1200);
  const url0=p.url();
  await p.click('.rail__next');
  await p.waitForURL(`**/work/${nx}/`,{timeout:8000}).catch(()=>{});
  ok(new URL(p.url()).pathname===`/work/${nx}/`&&new URL(p.url()).pathname!==new URL(url0).pathname,`${s}: the rail's Next opens the NEXT project /work/${nx}/ (got ${new URL(p.url()).pathname})`);
  await p.waitForFunction(()=>!document.documentElement.classList.contains('is-arriving'),null,{timeout:6000}).catch(()=>{});
  ok(await p.evaluate(()=>!document.documentElement.classList.contains('is-arriving')&&!document.querySelector('.lens')),`${s}: the destination settles with no overlay left behind`);
  await p.goBack();await p.waitForTimeout(1000);ok(new URL(p.url()).pathname===`/work/${s}/`&&await p.evaluate(()=>!document.querySelector('.lens')),`${s}: back returns without a stuck overlay`);
  await ctx.close();}
 // 4. flat fallbacks
 for(const [name,opt] of [['reduced motion',{viewport:{width:1440,height:900},reducedMotion:'reduce'}],['phone',{viewport:{width:390,height:844},hasTouch:true}],['no JS',{viewport:{width:1440,height:900},javaScriptEnabled:false}]]){
  const ctx=await context(opt);const p=await ctx.newPage();
  for(const r of STORIES){await p.goto(U(r));await p.waitForTimeout(500);
   const f=await p.evaluate(()=>{const hs=document.querySelector('.hs');const pin=hs.querySelector('.hs__pin');return {pos:getComputedStyle(pin).position,sw:document.documentElement.scrollWidth,iw:document.documentElement.clientWidth,tx:getComputedStyle(hs.querySelector('[data-track]')).transform};});
   ok(f.pos==='static'&&f.sw<=f.iw+1&&(f.tx==='none'||f.tx==='matrix(1, 0, 0, 1, 0, 0)'),`${name}: ${r} is a flat vertical document`);}
  ctx.close&&await ctx.close();}
 // 5. archive field
 {const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/archive/'));await p.waitForTimeout(1200);
  const s0=await p.evaluate(()=>__arState());
  await p.mouse.move(700,450);await p.mouse.down();for(let i=1;i<=14;i++){await p.mouse.move(700-i*20,450-i*8);await p.waitForTimeout(14);}
  const mid=await p.evaluate(()=>({st:__arState(),sel:getSelection().toString().length,near:document.querySelector('[data-rot=near]').style.transform,far:document.querySelector('[data-rot=far]').style.transform,lay:['far','mid','near'].map(k=>getComputedStyle(document.querySelector(`[data-layer=${k}]`)).getPropertyValue('--lx'))}));
  ok(JSON.stringify(mid.st.titleRect)===JSON.stringify(s0.titleRect),`archive: the title stays fixed while dragging (${mid.st.titleRect})`);
  ok(Math.hypot(mid.st.px-s0.px,mid.st.py-s0.py)>60,'archive: the image field pans under the pointer');
  ok(/perspective|rotate/.test(mid.near)&&mid.near!==mid.far,`archive: velocity adds a bounded tilt, layers differ (${(mid.st.rx).toFixed(2)}, ${(mid.st.ry).toFixed(2)} deg)`);
  ok(Math.abs(mid.st.rx)<=4.01&&Math.abs(mid.st.ry)<=5.01,'archive: tilt stays within its bounds');
  const lx=mid.lay.map(parseFloat);ok(new Set(lx.map(v=>v.toFixed(0))).size===3,`archive: three depth layers pan at different rates (${lx.map(v=>Math.round(v))})`);
  ok(mid.sel===0,'archive: no text selected while dragging');
  await p.mouse.up();await p.waitForTimeout(250);const co=await p.evaluate(()=>__arState());await p.waitForFunction(()=>{const s=__arState();return s.rx===0&&s.ry===0&&document.querySelector('[data-rot=near]').style.transform===''},null,{timeout:6000}).catch(()=>{});const rest=await p.evaluate(()=>({st:__arState(),n:document.querySelector('[data-rot=near]').style.transform}));
  ok(Math.hypot(co.px-mid.st.px,co.py-mid.st.py)>5,'archive: release continues with inertia');
  ok(rest.st.rx===0&&rest.st.ry===0&&rest.n==='','archive: at rest the tilt is exactly zero and transforms are removed (sharp)');
  ok(new URL(p.url()).pathname==='/archive/','archive: a drag does not open a project');
  for(let i=0;i<8;i++){await p.mouse.move(700,450);await p.mouse.down();await p.mouse.move(-400,-400,{steps:4});await p.mouse.up();}
  await p.waitForTimeout(2800);const far=await p.evaluate(()=>__arState());ok(Math.abs(far.px)<=2200&&Math.abs(far.py)<=1500,`archive: panning is bounded (${Math.round(far.px)},${Math.round(far.py)})`);
  await p.click('[data-reset]');await p.waitForFunction(()=>{const s=__arState();return Math.hypot(s.px,s.py)<4},null,{timeout:6000}).catch(()=>{});const rs=await p.evaluate(()=>__arState());ok(Math.hypot(rs.px,rs.py)<4,'archive: recentre returns to the start');
  await p.click('[data-listbtn]');await p.waitForTimeout(300);ok(await p.evaluate(()=>__arState().list)&&(await p.$$eval('[data-list] a',a=>a.length))>=20,'archive: accessible list view lists every fragment');
  await p.click('[data-listbtn]');await p.waitForTimeout(200);
  await p.focus('[data-view]');const a0=await p.evaluate(()=>__arState().px);await p.keyboard.press('ArrowLeft');await p.waitForTimeout(900);ok((await p.evaluate(()=>__arState().px))!==a0,'archive: arrow keys pan the field');
  await ctx.close();
  const rm=await context({viewport:{width:1440,height:900},reducedMotion:'reduce'});const q=await rm.newPage();await q.goto(U('/archive/'));await q.waitForTimeout(800);
  await q.mouse.move(700,450);await q.mouse.down();for(let i=1;i<=10;i++){await q.mouse.move(700-i*30,450);await q.waitForTimeout(14);}const r1=await q.evaluate(()=>({n:document.querySelector('[data-rot=near]').style.transform,st:__arState()}));await q.mouse.up();
  ok(r1.n===''&&r1.st.rx===0&&Math.abs(r1.st.px)>100,'archive: reduced motion pans directly with no warping');await rm.close();
  if(ENGINE==='chromium'){const t=await context({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const q2=await t.newPage();await q2.goto(U('/archive/'));await q2.waitForTimeout(1200);
   const cdp=await t.newCDPSession(q2);const a=await q2.evaluate(()=>__arState());
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:500}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300-i*14,y:500-i*10}]});await q2.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await q2.waitForTimeout(900);
   const a1=await q2.evaluate(()=>__arState());ok(Math.hypot(a1.px-a.px,a1.py-a.py)>80,'archive: touch drag pans the field');await t.close();}else skip('archive touch drag (CDP, chromium only)');}
 // 6. profile
 {const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/profile/'));await p.waitForTimeout(1000);
  const z=await p.evaluate(()=>{const e=document.querySelector('.pf__portrait');const m=document.querySelector('.pf__mask');const cs=getComputedStyle(m);return {vis:getComputedStyle(e).visibility,clip:cs.clipPath,sy:scrollY,w:m.getBoundingClientRect().width,img:document.querySelector('.pf__img').currentSrc.split('/').pop()}});
  ok(z.vis==='hidden'&&/inset\(0px 50%\)/.test(z.clip),`profile: portrait has zero reveal width and is not rendered at the first frame (${z.vis}, ${z.clip})`);
  ok(/sankalp-/.test(z.img),`profile: uses the supplied portrait (${z.img})`);
  const txt=await p.evaluate(()=>document.body.innerText);ok(/Curious across\s+disciplines/i.test(txt)&&/Building across them/i.test(txt),'profile: anchor line present');
  ok(!/questionable/i.test(await p.evaluate(()=>document.documentElement.outerHTML)),'profile: casual filler removed');
  const orange=await p.evaluate(()=>{const bad=[];document.querySelectorAll('.pf *,.pf__end *').forEach(e=>{const cs=getComputedStyle(e);for(const k of ['color','backgroundColor','borderTopColor','stroke','fill','textDecorationColor']){const m=(cs[k]||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(m){const [r,g,bb]=[+m[1],+m[2],+m[3]];if(r>170&&r-bb>70&&g<r-20)bad.push(e.className+':'+k+':'+cs[k])}}});return bad.slice(0,5)});
  ok(orange.length===0,`profile: no orange anywhere ${JSON.stringify(orange)}`);
  const pk=async t=>{await p.evaluate(t=>scrollTo(0,t*innerHeight),t);await p.waitForTimeout(1500);return p.evaluate(()=>{const mk=document.querySelector('.pf__mask');const m=mk.getBoundingClientRect();const cl=getComputedStyle(mk).clipPath.match(/inset\(([\d.]+)(?:px|%)? ([\d.]+)%/);const e=getComputedStyle(document.querySelector('.pf__portrait'));const insetPx=cl?(parseFloat(cl[2]))/100*m.width*2:0;return {w:Math.round(m.width-insetPx),vis:e.visibility,op:[...document.querySelectorAll('.pf__s')].map(s=>+getComputedStyle(s).opacity).map(v=>v.toFixed(2)).join(',')}})};
  const s1=await pk(1.0),s2=await pk(1.9),s3=await pk(5),s4=await pk(8),s5=await pk(10.4);
  ok(s1.w>0&&s1.w<s2.w&&s2.vis==='visible',`profile: the mask opens progressively with scroll (${s1.w} -> ${s2.w}px)`);
  ok(+s3.op.split(',')[0]>0.9&&+s3.op.split(',')[1]<0.05&&+s4.op.split(',')[1]>0.9&&+s4.op.split(',')[0]<0.05&&+s5.op.split(',')[2]>0.9,'profile: one scene of copy at a time, no overlapping paragraphs');
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(3600);
  const back=await p.evaluate(()=>getComputedStyle(document.querySelector('.pf__portrait')).visibility);ok(back==='hidden','profile: scrolling back to the top returns to zero portrait width');
  await p.reload();await p.waitForTimeout(1200);ok((await p.evaluate(()=>getComputedStyle(document.querySelector('.pf__portrait')).visibility))==='hidden','profile: reload at the top starts with no portrait');
  await p.goto(U('/archive/'));await p.goBack();await p.waitForTimeout(1200);ok(new URL(p.url()).pathname==='/profile/'&&await p.evaluate(()=>getComputedStyle(document.querySelector('.pf__portrait')).visibility==='hidden'),'profile: navigating back to the top preserves the hidden portrait');
  ok(!await p.evaluate(()=>[...document.querySelectorAll('audio,video')].some(m=>!m.paused||m.autoplay)),'profile: no autoplay media');
  ok(await p.evaluate(()=>document.querySelectorAll('a[href*="youtube"],a[href*="instagram"]').length>=2),'profile: music channel links present');
  await ctx.close();
  const rm=await context({viewport:{width:1440,height:900},reducedMotion:'reduce'});const q=await rm.newPage();await q.goto(U('/profile/'));await q.waitForTimeout(600);
  ok(await q.evaluate(()=>getComputedStyle(document.querySelector('.pf__portrait')).visibility==='visible'&&document.documentElement.classList.contains('rm')&&getComputedStyle(document.querySelector('.pf__pin')).position==='static'),'profile: reduced motion shows the portrait and a flat reading order');await rm.close();}
 // 7. project index: neutral idle (outline titles), hover/focus fill + image, rest again, explicit touch Open
 {const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/projects/'));await p.waitForTimeout(1000);
  const idle=await p.evaluate(()=>{const t=document.querySelector('.idx__t');const cs=getComputedStyle(t);return {on:document.querySelectorAll('.idx__bg.is-on').length,stroke:parseFloat(cs.webkitTextStrokeWidth),fill:cs.color,items:document.querySelectorAll('.idx__item').length,active:document.querySelectorAll('.idx__item.is-active').length,bg:getComputedStyle(document.querySelector('.idx__bgs')).backgroundColor}});
  ok(idle.on===0&&idle.active===0&&idle.items===ORDER.length,`index idle: solid neutral background, no automatic preview, all ${idle.items} titles listed`);
  ok(idle.stroke>0&&/rgba\(0, 0, 0, 0\)|transparent/.test(idle.fill),`index idle: titles are outlined (stroke ${idle.stroke}px, fill ${idle.fill})`);
  ok(await p.evaluate(()=>[...document.querySelectorAll('.idx__t')].every(t=>{const r=t.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0})),'index: all six titles fit inside a 1440x900 viewport');
  const bgOf=()=>p.evaluate(()=>[...document.querySelectorAll('.idx__bg.is-on')].map(e=>(e.style.backgroundImage.match(/idx\/([^.")]+)/)||[])[1]).join(',')) ;
  await p.hover('.idx__item:nth-child(3) .idx__t');await p.waitForTimeout(900);
  const hov=await p.evaluate(()=>({fill:getComputedStyle(document.querySelector('.idx__item:nth-child(3) .idx__t')).color,other:getComputedStyle(document.querySelector('.idx__item:nth-child(2) .idx__t')).color,bg:[...document.querySelectorAll('.idx__bg.is-on')].length}));
  ok(!/rgba\(0, 0, 0, 0\)/.test(hov.fill)&&/rgba\(0, 0, 0, 0\)/.test(hov.other)&&hov.bg===1&&/furnishers/.test(await bgOf()),'index hover: the active title fills, others stay outlined, its image fills the viewport');
  await p.mouse.move(20,520);await p.waitForTimeout(900);
  ok(await p.evaluate(()=>document.querySelectorAll('.idx__bg.is-on').length===0&&!document.querySelector('.idx__item.is-active')),'index: leaving the titles restores the neutral state');
  await p.focus('.idx__item:nth-child(5) a');await p.waitForTimeout(800);const foc=await bgOf();
  await p.mouse.move(20,520);await p.waitForTimeout(500);
  ok(/kaal/.test(foc)&&/kaal/.test(await bgOf()),'index focus: keyboard focus shows its image and survives pointer movement over empty space');
  for(let i=0;i<30;i++){await p.hover(`.idx__item:nth-child(${1+i%ORDER.length}) .idx__t`);}await p.hover('.idx__item:nth-child(2) .idx__t');await p.waitForTimeout(1000);
  ok((await p.evaluate(()=>[...document.querySelectorAll('.idx__bg')].filter(e=>getComputedStyle(e).opacity>0.5).length))===1&&/wealth/.test(await bgOf()),'index: rapid switching settles on the last hover with one background');
  await p.goto(U('/work/reclaim/'));await p.waitForTimeout(600);
  await p.click('[data-open-index]');await p.waitForSelector('dialog[open]');
  ok((await p.$$eval('dialog[open] .idx__item',e=>e.length))===ORDER.length&&await p.evaluate(()=>document.querySelectorAll('dialog[open] .idx__bg.is-on').length===0),'index overlay: lists all projects and opens neutral');
  ok(await p.evaluate(()=>document.documentElement.classList.contains('is-locked')),'index overlay: page scroll is locked while open');
  await p.keyboard.press('Escape');await p.waitForTimeout(400);ok(!(await p.$('dialog[open]'))&&await p.evaluate(()=>!document.documentElement.classList.contains('is-locked')),'index overlay: Escape closes and unlocks scroll');
  ok(await p.evaluate(()=>document.activeElement&&document.activeElement.hasAttribute('data-open-index')),'index overlay: focus returns to the trigger');
  await ctx.close();
  const t=await context({viewport:{width:390,height:844},hasTouch:true,...(ENGINE==='chromium'?{isMobile:true}:{})});const q=await t.newPage();
  await q.goto(U('/projects/'));await q.waitForTimeout(900);
  const bar0=await q.evaluate(()=>({op:getComputedStyle(document.querySelector('[data-idx-enter]')).opacity,lab:document.querySelector('.idx__label').innerText}));
  ok(+bar0.op===0&&/tap a title/i.test(bar0.lab),`touch: before any selection the screen says what to do (${bar0.lab.trim()}) and shows no stale Open`);
  await q.tap('.idx__item:nth-child(2) a');await q.waitForTimeout(800);
  const bar1=await q.evaluate(()=>({txt:document.querySelector('[data-idx-enter]').textContent.replace(/\s+/g,' ').trim(),op:getComputedStyle(document.querySelector('[data-idx-enter]')).opacity}));
  ok(new URL(q.url()).pathname==='/projects/'&&/Open\s+WealthWithSG/.test(bar1.txt)&&+bar1.op>0.9,`touch: tapping a title only previews it; an explicit Open names it (${bar1.txt})`);
  await q.tap('[data-idx-enter] a');await q.waitForURL('**/work/wealthwithsg/').catch(()=>{});ok(new URL(q.url()).pathname==='/work/wealthwithsg/','touch: the Open button navigates');
  await t.close();}
 // 8. selection and ghost-drag on gallery / index
 {const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/'));await p.waitForTimeout(900);await p.mouse.move(60,300);await p.mouse.down();await p.mouse.move(1300,600,{steps:10});await p.mouse.up();
  ok((await p.evaluate(()=>getSelection().toString().length))===0,'gallery: dragging across the hero highlights nothing');
  await p.goto(U('/projects/'));await p.waitForTimeout(700);await p.mouse.move(40,200);await p.mouse.down();await p.mouse.move(900,700,{steps:10});await p.mouse.up();ok((await p.evaluate(()=>getSelection().toString().length))===0,'index: dragging across the titles highlights nothing');
  await p.goto(U('/contact/'));ok(await p.evaluate(()=>{const m=document.querySelector('[data-mail]');return getComputedStyle(m).userSelect!=='none'||m.closest('.sel')!==null}),'contact: the address stays copyable (Copy button + selectable)');
  await ctx.close();}
 // 9. links
 {const ctx=await context();const p=await ctx.newPage();const set=new Map();
  for(const r of routes){await p.goto(U(r));(await p.$$eval('a[href]',a=>a.map(x=>({h:x.href,t:x.target,rel:x.rel})))).forEach(x=>set.set(x.h,x));}
  const bad=[];for(const [h,x] of set){if(h.startsWith(BASE)){const rs=await fetch(h.split('#')[0]+(SHARE&&!h.includes('?')?SHARE:''));if(rs.status!==200)bad.push(h+' '+rs.status);}else if(h.startsWith('http')&&x.t==='_blank'&&!/noreferrer/.test(x.rel))bad.push('rel '+h);}
  ok(bad.length===0,`internal links resolve & external links safe (${set.size} unique) ${JSON.stringify(bad)}`);await ctx.close();}
 // 10. experiments
 {const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();await p.goto(U('/work/experiments/'));
  ok((await p.$$('iframe')).length===0,'experiments: no iframe loaded by default');
  await p.evaluate(()=>document.querySelector('[data-live]').click());await p.waitForSelector('iframe');ok(true,'experiments: Try it here loads on demand');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);ok((await p.$$('iframe')).length===0,'experiments: Escape unloads it');
  await p.evaluate(()=>HS.scrollToX(document.getElementById('gsap-motion').offsetLeft,false));await p.waitForTimeout(800);await p.fill('[data-exp-time-in]','100');ok(await p.evaluate(()=>document.querySelectorAll('.expt__fig img')[1].classList.contains('is-on')),'experiments: the timeline control moves between the captured states');
  await p.evaluate(()=>HS.scrollToPanelProgress(document.getElementById('cyberpunk'),0.9,false));await p.waitForTimeout(1500);ok(await p.evaluate(()=>document.querySelectorAll('.exps__imgs img')[2].classList.contains('is-on')),'experiments: scrolling through CyberPunk advances its captured frames');
  await ctx.close();
  const rc=await context({viewport:{width:1440,height:900}});const q=await rc.newPage();await q.goto(U('/work/reclaim/'));await q.waitForTimeout(1200);
  const seenB=[];for(const f of [0.05,0.25,0.55,0.9]){await q.evaluate(f=>HS.scrollToPanelProgress(document.getElementById('c-evening'),f,false),f);await q.waitForFunction(()=>Math.abs(HS.x-HS.target)<2,null,{timeout:8000}).catch(()=>{});await q.waitForTimeout(300);seenB.push(await q.textContent('[data-beat-title]'))}
  ok(new Set(seenB).size>=4,'reclaim: one phone, the beats advance with the story ('+seenB.join(' / ')+')');
  const w=await rc.newPage();await w.goto(U('/work/wealthwithsg/'));await w.waitForTimeout(2500);const op=async f=>{await w.evaluate(f=>HS.scrollToPanelProgress(document.getElementById('c-clarity'),f,false),f);await w.waitForFunction(()=>Math.abs(HS.x-HS.target)<2,null,{timeout:8000}).catch(()=>{});await w.waitForTimeout(1200);return w.evaluate(()=>[...document.querySelectorAll('[data-wsg-stage] [data-chart-env] .cd')].map(e=>+e.style.opacity))};
  const c0=await op(0.05),c1=await op(0.95);ok(Math.max(...c0)<0.1&&Math.min(...c1)>0.9,'wealthwithsg: the story scrubs the live chart from noise to structure');await rc.close();}
 // 11. Kaal: the crow encounter, real strips, anchor geometry, bounded, no audio
 {const ctx=await context({viewport:{width:1440,height:900}});const p=await ctx.newPage();await p.goto(U('/work/kaal/'));await p.waitForTimeout(700);
  await p.evaluate(()=>{location.hash='#presence'});await p.waitForTimeout(1500);
  const anchor=await p.evaluate(()=>{const r=document.querySelector('#presence').getBoundingClientRect();return {left:r.left,pin:document.querySelector('.hs__pin').scrollLeft}});
  ok(anchor.pin===0&&anchor.left>=0&&anchor.left<100,'Kaal: the #presence link lands on the chapter without native pin scroll');
  await p.waitForFunction(()=>window.__crow&&__crow().loaded,null,{timeout:8000}).catch(()=>{});
  const box=await (await p.$('[data-crow-stage]')).boundingBox();const bx=box.x+box.width*0.62,by=box.y+box.height*0.81-60;
  ok((await p.evaluate(()=>__crow())).cell===0&&!(await p.evaluate(()=>__crow().strip)),'crow: quiet idle pose on arrival');
  await p.mouse.move(bx-220,by);await p.mouse.move(bx-80,by);await p.waitForTimeout(300);
  ok((await p.evaluate(()=>__crow())).cell===5,'crow: the pointer approaching only makes it attentive');
  await p.mouse.click(bx,by);await p.waitForTimeout(200);ok((await p.evaluate(()=>__crow())).cell===6,'crow: a click makes it notice');
  await p.waitForFunction(()=>__crow().strip==='ruffle'||__crow().strip==='preen',null,{timeout:2500}).catch(()=>{});
  ok(['ruffle','preen'].includes(await p.evaluate(()=>__crow().strip)),'crow: a single click plays a real strip (ruffle/preen)');
  await p.waitForFunction(()=>!__crow().strip&&__crow().cell===0,null,{timeout:6000}).catch(()=>{});
  ok((await p.evaluate(()=>__crow())).cell===0,'crow: returns to the idle pose');
  for(let i=0;i<3;i++){await p.mouse.click(bx,by);await p.waitForTimeout(110);}
  await p.waitForFunction(()=>__crow().flying,null,{timeout:2500}).catch(()=>{});
  ok(await p.evaluate(()=>__crow().flying&&__crow().strip==='flap'),'crow: three quick clicks make it fly (the full wing-beat strip)');
  await p.waitForFunction(()=>!__crow().flying,null,{timeout:5000}).catch(()=>{});
  const end=await p.evaluate(()=>__crow());ok(!end.flying&&end.cell===0&&!end.strip,'crow: lands and returns to the same idle pose');
  await p.mouse.move(20,20);await p.evaluate(()=>HS.scrollToX(HS.panels[HS.panels.length-1].__start,false));await p.waitForTimeout(1500);
  const off=await p.evaluate(()=>__crow());ok(!off.visible&&off.timers===0&&!off.raf,'crow: pauses (no timers or animation loop) when scrolled away');
  ok(await p.locator('audio,video,iframe').count()===0,'Kaal: no audio, recorder or embedded app');await ctx.close();
  const rm=await context({viewport:{width:1440,height:900},reducedMotion:'reduce'});const r=await rm.newPage();await r.goto(U('/work/kaal/'));await r.waitForTimeout(800);
  await r.evaluate(()=>document.getElementById('presence').scrollIntoView());await r.waitForTimeout(1200);
  await r.waitForFunction(()=>window.__crow&&__crow().loaded,null,{timeout:8000}).catch(()=>{});
  const a=await r.evaluate(()=>__crow());ok(a.timers===0&&!a.raf,'crow, reduced motion: no idle timers and no animation loop');
  await r.click('[data-crow-prompt]');await r.waitForFunction(()=>/still pose/.test(document.querySelector('[data-crow-hint]').textContent),null,{timeout:4000}).catch(()=>{});ok(!(await r.evaluate(()=>__crow().raf))&&/still pose/.test(await r.textContent('[data-crow-hint]')),'crow, reduced motion: the button gives a still pose, no motion');await rm.close();}
 // 12. email, fonts and copy
 {const ctx=await context();const p=await ctx.newPage();let bad=[];
  for(const r of routes){await p.goto(U(r));const html=await p.content();if(/kushwaha\.18/.test(html))bad.push(r);}
  ok(bad.length===0,`the old email address appears nowhere (${JSON.stringify(bad)})`);
  await p.goto(U('/contact/'));ok(await p.evaluate(()=>document.querySelector('[data-mail]').textContent.trim()==='sankalp.direct@gmail.com'&&document.querySelector('a[data-mail]').getAttribute('href')==='mailto:sankalp.direct@gmail.com'),'contact: the new address is shown and linked');
  await p.goto(U('/profile/'));ok(await p.evaluate(()=>!!document.querySelector('a[href="mailto:sankalp.direct@gmail.com"]')),'profile: the new address is linked');await ctx.close();}
 console.log('\nSUMMARY engine='+ENGINE+' pass='+out.filter(l=>l.startsWith('PASS')).length+' fail='+out.filter(l=>l.startsWith('FAIL')).length+' skip='+out.filter(l=>l.startsWith('SKIP')).length);
 await b.close();process.exitCode=out.some(l=>l.startsWith('FAIL'))?1:0;})().catch(e=>{console.error(e);process.exitCode=1;});
