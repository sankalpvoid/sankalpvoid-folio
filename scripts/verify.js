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
const ORDER=['reclaim','wealthwithsg','sankalp-shristi-furnishers','aureledger','experiments'];
const STORIES=ORDER.map(s=>`/work/${s}/`);
const routes=['/','/projects/',...STORIES,'/archive/','/profile/','/about/','/contact/'];
const out=[];const ok=(c,m)=>{const line=(c?'PASS ':'FAIL ')+m;out.push(line);console.log(line);};const skip=(m)=>out.push('SKIP '+m);
const xform=()=>-new DOMMatrix(getComputedStyle(document.querySelector('[data-track]')).transform).m41;
(async()=>{
 const b=await pw[ENGINE].launch();
 // 1. routes x 3 viewports
 for(const [w,h] of [[390,844],[768,1024],[1440,900]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<800,...(ENGINE==='chromium'?{isMobile:w<700}:{})});
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
 // 2. gallery: next-project peel vs Enter project
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/'));await p.waitForTimeout(900);
  const slug=()=>p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug);
  ok(await slug()==='reclaim','root opens on the Reclaim gallery scene');
  ok(/WealthWithSG/.test(await p.textContent('[data-peel]')),'gallery handle is labelled with the NEXT project ("Drag to WealthWithSG")');
  ok(/Enter\s*project/i.test(await p.textContent('.slide.is-active .enter')),'"Enter project" is a separate, labelled action');
  const hist0=await p.evaluate(()=>history.length);
  const bx=await (await p.$('[data-peel]')).boundingBox();const x=bx.x+bx.width-24,y=bx.y+bx.height-24;
  await p.mouse.move(x,y);await p.mouse.down();
  for(let i=1;i<=8;i++){await p.mouse.move(x-i*28,y-i*18);await p.waitForTimeout(16);}
  const mid=await p.evaluate(()=>({on:document.querySelector('.peel')?.classList.contains('is-on'),clip:getComputedStyle(document.querySelector('.peel__under')).clipPath,sel:getSelection().toString().length,g:document.documentElement.classList.contains('is-gesturing')}));
  const a1=mid.clip;
  for(let i=9;i<=12;i++){await p.mouse.move(x-i*28,y-i*18);await p.waitForTimeout(16);}
  const clip2=await p.evaluate(()=>getComputedStyle(document.querySelector('.peel__under')).clipPath);
  ok(mid.on&&/polygon/.test(a1)&&a1!==clip2,'peel: diagonal fold polygon follows the pointer continuously');
  ok(mid.sel===0&&mid.g,'peel: selection suppressed while the gesture is active');
  await p.mouse.up();await p.waitForTimeout(1200);
  ok(await slug()==='reclaim'&&(await p.evaluate(()=>history.length))===hist0&&new URL(p.url()).pathname==='/','peel: cancelled gesture returns to the current project, no history entry');
  await p.waitForFunction(()=>!document.querySelector('.peel.is-on'),null,{timeout:6000}).catch(()=>{});
  ok(await p.evaluate(()=>!document.querySelector('.peel.is-on')),'peel: layer removed after cancel');
  await p.mouse.move(x,y);await p.mouse.down();for(let i=1;i<=40;i++){await p.mouse.move(Math.max(5,x-i*40),Math.max(5,y-i*26));await p.waitForTimeout(12);}await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.slide.is-active')?.dataset.slug==='wealthwithsg',null,{timeout:6000});
  ok(await slug()==='wealthwithsg'&&new URL(p.url()).pathname==='/','peel: completed drag brings in the NEXT project (WealthWithSG), not the current project\'s page');
  ok(/Furnishers/.test(await p.textContent('[data-peel]')),'peel: handle now names the following project');
  await p.click('.slide.is-active .enter');await p.waitForURL('**/work/wealthwithsg/');ok(true,'Enter project opens the selected project');
  await p.goBack();await p.waitForTimeout(900);ok(new URL(p.url()).pathname==='/','back returns to the gallery');
  // wraparound
  await p.goto(U('/#archive'));await p.waitForTimeout(900);ok(/Reclaim/.test(await p.textContent('[data-peel]')),'last project wraps: Experiments hands off to Reclaim');
  await p.goto(U('/#archive'));await p.waitForTimeout(600);
  // click / keyboard alternatives
  await p.goto(U('/'));await p.waitForTimeout(700);await p.focus('[data-peel]');await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('.slide.is-active')?.dataset.slug==='wealthwithsg',null,{timeout:6000});
  ok(await slug()==='wealthwithsg','peel: keyboard Enter on the handle brings in the next project');
  await p.goto(U('/about/'));await p.waitForURL('**/profile/');ok(true,'/about/ redirects to /profile/');
  await ctx.close();}
 // 3. project pages: rail, peel to next project, never an internal section
 for(const [i,s] of ORDER.entries()){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U(`/work/${s}/`));await p.waitForTimeout(1200);
  const rail=await p.evaluate(()=>{const r=document.querySelector('.rail');const rr=r.getBoundingClientRect();const hero=document.querySelector('.hero').getBoundingClientRect();const pin=document.querySelector('.hs__pin').getBoundingClientRect();return {pos:getComputedStyle(r).position,left:rr.left,w:rr.width,pinR:pin.right,heroR:hero.right,close:r.querySelector('.rail__close').getAttribute('href'),name:r.querySelector('.rail__name').textContent,act:r.querySelector('.rail__act').textContent.trim(),next:r.querySelector('[data-peel]').getAttribute('href'),lab:r.querySelector('.peel-h__lab b').textContent}});
  const nx=ORDER[(i+1)%5];
  ok(rail.pos==='fixed'&&rail.pinR<=rail.left+1&&rail.heroR<=rail.left+1,`${s}: rail is fixed and its space is reserved (story right ${Math.round(rail.pinR)} <= rail ${Math.round(rail.left)})`);
  ok(rail.next===`/work/${nx}/`&&rail.close.startsWith('/#'),`${s}: rail close -> gallery, next -> /work/${nx}/ (shared order)`);
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
  // scene indicator follows what is displayed
  await p.evaluate(()=>HS.scrollToX(HS.panels[2].__start-40,false));await p.waitForTimeout(400);
  const cur=await p.evaluate(()=>document.querySelector('.hs__nav [aria-current=true] .mono').textContent);ok(cur==='03',`${s}: scene indicator matches the visible scene (${cur})`);
  // chapter jump settles exactly
  await p.evaluate(y=>scrollTo(0,y),g.t);await p.waitForTimeout(300);
  await p.click('.hs__nav [data-go="3"]');await p.waitForTimeout(2600);
  const j=await p.evaluate(()=>({x:HS.x,want:Math.max(0,HS.panels[3].offsetLeft-Math.min(80,document.querySelector('.hs__pin').clientWidth*0.04))}));
  ok(Math.abs(j.x-j.want)<3,`${s}: chapter jump settles on the scene (x=${Math.round(j.x)}, wanted ${Math.round(j.want)})`);
  // selection: drag across headings/images leaves nothing highlighted
  await p.evaluate(y=>scrollTo(0,y),g.t);await p.waitForTimeout(500);
  await p.mouse.move(100,300);await p.mouse.down();await p.mouse.move(1000,700,{steps:12});await p.mouse.up();
  await p.waitForTimeout(100);
  const hl=await p.evaluate(()=>{const r=getSelection();const els=[...document.querySelectorAll('.hs h1,.hs h2,.hs h3,.pn-big,.pn-h,.rc-title,.hs img,.rail *,.chrome *')];return els.filter(e=>r.rangeCount&&!r.isCollapsed&&r.containsNode(e,true)).length});
  ok(hl===0,`${s}: dragging leaves no headings, images or controls highlighted (${hl})`);
  ok(await p.evaluate(()=>[...document.querySelectorAll('.hs img')].every(i=>i.getAttribute('draggable')==='false'||getComputedStyle(i).webkitUserDrag==='none')),`${s}: images are not natively draggable`);
  // Regression: the rail must work immediately after an unrelated content drag, without reloading.
  const hbx=await (await p.$('.rail [data-peel]')).boundingBox();const hx=hbx.x+hbx.width-12,hy=hbx.y+hbx.height-12;
  const url0=p.url();
  await p.mouse.move(hx,hy);await p.mouse.down();for(let k=1;k<=7;k++){await p.mouse.move(hx-k*30,hy-k*22);await p.waitForTimeout(14);}
  const clipA=await p.evaluate(()=>{const e=document.querySelector('.peel__under');return e?getComputedStyle(e).clipPath:''});await p.mouse.up();await p.waitForFunction(()=>!document.querySelector('.peel.is-on'),null,{timeout:6000}).catch(()=>{});
  ok(/polygon/.test(clipA)&&p.url()===url0,`${s}: cancelled peel stays on the current project (${new URL(p.url()).pathname})`);
  await p.mouse.move(hx,hy);await p.mouse.down();for(let k=1;k<=40;k++){await p.mouse.move(Math.max(5,hx-k*40),Math.max(5,hy-k*26));await p.waitForTimeout(10);}await p.mouse.up();
  await p.waitForURL(`**/work/${nx}/`,{timeout:6000}).catch(()=>{});
  ok(new URL(p.url()).pathname===`/work/${nx}/`,`${s}: completed peel opens the NEXT project /work/${nx}/ (got ${new URL(p.url()).pathname})`);
  await p.goBack();await p.waitForTimeout(1000);ok(new URL(p.url()).pathname===`/work/${s}/`&&await p.evaluate(()=>!document.querySelector('.peel.is-on')),`${s}: back returns without a stuck overlay`);
  await ctx.close();}
 // 4. flat fallbacks
 for(const [name,opt] of [['reduced motion',{viewport:{width:1440,height:900},reducedMotion:'reduce'}],['phone',{viewport:{width:390,height:844},hasTouch:true}],['no JS',{viewport:{width:1440,height:900},javaScriptEnabled:false}]]){
  const ctx=await b.newContext(opt);const p=await ctx.newPage();
  for(const r of STORIES){await p.goto(U(r));await p.waitForTimeout(500);
   const f=await p.evaluate(()=>{const hs=document.querySelector('.hs');const pin=hs.querySelector('.hs__pin');return {pos:getComputedStyle(pin).position,sw:document.documentElement.scrollWidth,iw:document.documentElement.clientWidth,tx:getComputedStyle(hs.querySelector('[data-track]')).transform};});
   ok(f.pos==='static'&&f.sw<=f.iw+1&&(f.tx==='none'||f.tx==='matrix(1, 0, 0, 1, 0, 0)'),`${name}: ${r} is a flat vertical document`);}
  ctx.close&&await ctx.close();}
 // 5. archive field
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
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
  const rm=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const q=await rm.newPage();await q.goto(U('/archive/'));await q.waitForTimeout(800);
  await q.mouse.move(700,450);await q.mouse.down();for(let i=1;i<=10;i++){await q.mouse.move(700-i*30,450);await q.waitForTimeout(14);}const r1=await q.evaluate(()=>({n:document.querySelector('[data-rot=near]').style.transform,st:__arState()}));await q.mouse.up();
  ok(r1.n===''&&r1.st.rx===0&&Math.abs(r1.st.px)>100,'archive: reduced motion pans directly with no warping');await rm.close();
  if(ENGINE==='chromium'){const t=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const q2=await t.newPage();await q2.goto(U('/archive/'));await q2.waitForTimeout(1200);
   const cdp=await t.newCDPSession(q2);const a=await q2.evaluate(()=>__arState());
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:500}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300-i*14,y:500-i*10}]});await q2.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await q2.waitForTimeout(900);
   const a1=await q2.evaluate(()=>__arState());ok(Math.hypot(a1.px-a.px,a1.py-a.py)>80,'archive: touch drag pans the field');await t.close();}else skip('archive touch drag (CDP, chromium only)');}
 // 6. profile
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
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
  const rm=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const q=await rm.newPage();await q.goto(U('/profile/'));await q.waitForTimeout(600);
  ok(await q.evaluate(()=>getComputedStyle(document.querySelector('.pf__portrait')).visibility==='visible'&&document.documentElement.classList.contains('rm')&&getComputedStyle(document.querySelector('.pf__pin')).position==='static'),'profile: reduced motion shows the portrait and a flat reading order');await rm.close();}
 // 7. project index: hover, focus, rapid switching, explicit touch Open
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/work/reclaim/'));await p.waitForTimeout(600);
  await p.click('[data-open-index]');await p.waitForSelector('dialog[open]');
  ok((await p.$$eval('dialog[open] .idx__item',e=>e.length))===5,'index overlay lists 5 projects');
  ok(await p.evaluate(()=>document.documentElement.classList.contains('is-locked')),'index: page scroll is locked while open');
  const bgOf=()=>p.evaluate(()=>[...document.querySelectorAll('dialog[open] .idx__bg.is-on')].map(e=>(e.style.backgroundImage.match(/idx\/([^.")]+)/)||[])[1]).join(','));
  await p.hover('dialog[open] .idx__item:nth-child(3) a');await p.waitForTimeout(800);const hov=await bgOf();
  await p.focus('dialog[open] .idx__item:nth-child(4) a');await p.waitForTimeout(800);const foc=await bgOf();
  ok(hov&&foc&&hov!==foc,`index: background follows hover (${hov}) and keyboard focus (${foc})`);
  for(let i=0;i<30;i++){await p.hover(`dialog[open] .idx__item:nth-child(${1+i%5}) a`);}await p.hover('dialog[open] .idx__item:nth-child(2) a');await p.waitForTimeout(1000);
  ok((await p.evaluate(()=>[...document.querySelectorAll('dialog[open] .idx__bg')].filter(e=>getComputedStyle(e).opacity>0.5).length))===1&&/wealth/.test(await bgOf()),'index: rapid switching settles on the last hover with one background');
  await p.keyboard.press('Escape');await p.waitForTimeout(400);ok(!(await p.$('dialog[open]'))&&await p.evaluate(()=>!document.documentElement.classList.contains('is-locked')),'index: Escape closes and unlocks scroll');
  await ctx.close();
  const t=await b.newContext({viewport:{width:390,height:844},hasTouch:true,...(ENGINE==='chromium'?{isMobile:true}:{})});const q=await t.newPage();
  await q.goto(U('/projects/'));await q.waitForTimeout(900);
  const bar0=await q.evaluate(()=>{const e=document.querySelector('[data-idx-enter]');return {hidden:e.hidden,txt:e.textContent.replace(/\s+/g,' ').trim()}});
  ok(!bar0.hidden&&/Open\s+Reclaim/.test(bar0.txt),`touch: an explicit "Open Reclaim" action is visible before any tap (${bar0.txt})`);
  await q.tap('.idx__item:nth-child(2) a');await q.waitForTimeout(700);
  const bar1=await q.evaluate(()=>document.querySelector('[data-idx-enter]').textContent.replace(/\s+/g,' ').trim());
  ok(new URL(q.url()).pathname==='/projects/'&&/Open\s+WealthWithSG/.test(bar1),`touch: tapping a title only previews it; the Open button now names it (${bar1})`);
  await q.tap('[data-idx-enter] a');await q.waitForURL('**/work/wealthwithsg/').catch(()=>{});ok(new URL(q.url()).pathname==='/work/wealthwithsg/','touch: the Open button navigates');
  await t.close();}
 // 8. selection and ghost-drag on gallery / index
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(U('/'));await p.waitForTimeout(900);await p.mouse.move(60,300);await p.mouse.down();await p.mouse.move(1300,600,{steps:10});await p.mouse.up();
  ok((await p.evaluate(()=>getSelection().toString().length))===0,'gallery: dragging across the hero highlights nothing');
  await p.goto(U('/projects/'));await p.waitForTimeout(700);await p.mouse.move(40,200);await p.mouse.down();await p.mouse.move(900,700,{steps:10});await p.mouse.up();ok((await p.evaluate(()=>getSelection().toString().length))===0,'index: dragging across the titles highlights nothing');
  await p.goto(U('/contact/'));ok(await p.evaluate(()=>{const m=document.querySelector('[data-mail]');return getComputedStyle(m).userSelect!=='none'||m.closest('.sel')!==null}),'contact: the address stays copyable (Copy button + selectable)');
  await ctx.close();}
 // 9. links
 {const ctx=await b.newContext();const p=await ctx.newPage();const set=new Map();
  for(const r of routes){await p.goto(U(r));(await p.$$eval('a[href]',a=>a.map(x=>({h:x.href,t:x.target,rel:x.rel})))).forEach(x=>set.set(x.h,x));}
  const bad=[];for(const [h,x] of set){if(h.startsWith(BASE)){const rs=await fetch(h.split('#')[0]+(SHARE&&!h.includes('?')?SHARE:''));if(rs.status!==200)bad.push(h+' '+rs.status);}else if(h.startsWith('http')&&x.t==='_blank'&&!/noreferrer/.test(x.rel))bad.push('rel '+h);}
  ok(bad.length===0,`internal links resolve & external links safe (${set.size} unique) ${JSON.stringify(bad)}`);await ctx.close();}
 // 10. experiments
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();await p.goto(U('/work/experiments/'));
  ok((await p.$$('iframe')).length===0,'experiments: no iframe loaded by default');
  await p.evaluate(()=>document.querySelector('[data-live]').click());await p.waitForSelector('iframe');ok(true,'experiments: Try it here loads on demand');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);ok((await p.$$('iframe')).length===0,'experiments: Escape unloads it');
  await p.evaluate(()=>document.querySelector('[data-swap-to="1"]').click());ok(await p.evaluate(()=>!document.querySelector('.swap__i:nth-child(2)').hidden),'experiments: state buttons swap the study image');await ctx.close();}
 console.log('\nSUMMARY engine='+ENGINE+' pass='+out.filter(l=>l.startsWith('PASS')).length+' fail='+out.filter(l=>l.startsWith('FAIL')).length+' skip='+out.filter(l=>l.startsWith('SKIP')).length);
 await b.close();process.exitCode=out.some(l=>l.startsWith('FAIL'))?1:0;})().catch(e=>{console.error(e);process.exitCode=1;});
