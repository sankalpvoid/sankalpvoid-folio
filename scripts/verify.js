/* Verification for the cinematic profile / archive / index / unroll / horizontal-story build.
   Usage: BASE=http://localhost:4195 node scripts/verify.js   (Playwright + Chromium; Chromium only) */
const {chromium}=require('playwright');
const BASE=process.env.BASE||'http://localhost:4195';
const STORIES=['/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/work/aureledger/','/work/experiments/'];
const routes=['/','/projects/',...STORIES,'/archive/','/profile/','/about/','/contact/'];
const out=[];const ok=(c,m)=>{out.push((c?'PASS ':'FAIL ')+m);};
(async()=>{
 const b=await chromium.launch();
 // 1. every route x 3 viewports: status, console, overflow, images, meta
 for(const [w,h] of [[390,844],[768,1024],[1440,900]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:w<700,hasTouch:w<800});
  for(const r of routes){
   const p=await ctx.newPage();const errs=[];
   p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push('pageerror '+e.message));
   p.on('response',res=>{if(res.status()>=400)errs.push(res.status()+' '+res.url())});
   const resp=await p.goto(BASE+r,{waitUntil:'load'});await p.waitForTimeout(700);
   const H=await p.evaluate(()=>document.documentElement.scrollHeight);
   for(let y=0;y<Math.min(H,30000);y+=h*.7){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(60);}
   await p.waitForTimeout(500);
   const info=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,title:document.title,h1:document.querySelectorAll('h1').length,og:!!document.querySelector('meta[property="og:image"]'),
     broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.currentSrc).length,noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).length}));
   const dev=await p.evaluate(()=>screen.width);
   ok(resp.status()===200&&errs.length===0,`${w}px ${r} status=${resp.status()} errors=${JSON.stringify(errs)}`);
   ok(info.sw<=w+1,`${w}px ${r} no horizontal overflow (${info.sw}/${w})`);
   ok(info.broken===0&&info.noalt===0,`${w}px ${r} images ok`);
   if(w===1440&&r!=='/about/')ok(info.title.length>5&&info.og&&info.h1>=1,`${r} meta ok "${info.title}"`);
   await p.close();}
  await ctx.close();}
 // 2. gallery + unroll
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/');await p.waitForTimeout(800);
  const slug=()=>p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug);
  ok(await slug()==='reclaim','root opens on Reclaim');
  await p.keyboard.press('ArrowRight');await p.waitForTimeout(1300);ok(await slug()==='wealthwithsg','ArrowRight advances');
  await p.click('[data-go="0"]');await p.waitForTimeout(1300);
  const box=await (await p.$('.slide.is-active .enter')).boundingBox();const cx=box.x+box.width/2,cy=box.y+box.height/2;
  // partial drag then release -> reverts
  await p.mouse.move(cx,cy);await p.mouse.down();for(let i=1;i<=6;i++){await p.mouse.move(cx-i*18,cy);await p.waitForTimeout(16);}
  const u1=await p.evaluate(()=>+getComputedStyle(document.querySelector('.unroll')).getPropertyValue('--u'));
  await p.mouse.up();await p.waitForTimeout(900);
  ok(u1>0.02&&u1<0.5&&new URL(p.url()).pathname==='/','unroll: partial drag reveals progressively and springs back on release (u='+u1.toFixed(2)+')');
  // full drag -> navigates
  await p.mouse.move(cx,cy);await p.mouse.down();for(let i=1;i<=40;i++){await p.mouse.move(cx-i*30,cy);await p.waitForTimeout(12);}
  await p.mouse.up();await p.waitForURL('**/work/reclaim/',{timeout:5000}).catch(()=>{});
  ok(new URL(p.url()).pathname==='/work/reclaim/','unroll: full drag completes to /work/reclaim/');
  await p.goto(BASE+'/');await p.waitForTimeout(600);await p.click('.slide.is-active .enter');await p.waitForURL('**/work/reclaim/');ok(true,'unroll: plain click still navigates');
  await p.goto(BASE+'/');await p.waitForTimeout(600);await p.focus('.slide.is-active .enter');await p.keyboard.press('Enter');await p.waitForURL('**/work/reclaim/');ok(true,'unroll: keyboard Enter navigates');
  await p.goto(BASE+'/about/');await p.waitForURL('**/profile/');ok(true,'/about/ redirects to /profile/');
  await ctx.close();}
 // 3. project index overlay + page
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/work/reclaim/');await p.waitForTimeout(600);
  await p.click('[data-open-index]');await p.waitForSelector('dialog[open]');
  const n=await p.$$eval('dialog[open] .idx__item',e=>e.length);ok(n===5,`index overlay lists 5 projects (${n})`);
  ok(await p.evaluate(()=>document.documentElement.classList.contains('is-locked')),'index: page scroll is locked while open');
  const bgOf=()=>p.evaluate(()=>[...document.querySelectorAll('dialog[open] .idx__bg.is-on')].map(e=>(e.style.backgroundImage.match(/idx\/([^."]+)/)||[])[1]).join(','));
  await p.hover('dialog[open] .idx__item:nth-child(3) a');await p.waitForTimeout(700);const hov=await bgOf();
  await p.keyboard.press('Tab');await p.focus('dialog[open] .idx__item:nth-child(4) a');await p.waitForTimeout(700);const foc=await bgOf();
  ok(hov&&foc&&hov!==foc,`index: background follows hover (${hov}) and keyboard focus (${foc})`);
  for(let i=0;i<30;i++){await p.hover(`dialog[open] .idx__item:nth-child(${1+i%5}) a`);}await p.hover('dialog[open] .idx__item:nth-child(2) a');await p.waitForTimeout(900);
  const vis=await p.evaluate(()=>[...document.querySelectorAll('dialog[open] .idx__bg')].filter(e=>getComputedStyle(e).opacity>0.5).length);
  ok(vis===1,`index: rapid switching leaves exactly one background visible (${vis})`);
  await p.keyboard.press('Escape');await p.waitForTimeout(400);ok(!(await p.$('dialog[open]')),'index: Escape closes');
  ok(await p.evaluate(()=>!document.documentElement.classList.contains('is-locked')),'index: scroll unlocked after close');
  await ctx.close();
  const t=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const q=await t.newPage();
  await q.goto(BASE+'/projects/');await q.waitForTimeout(700);
  await q.tap('.idx__item:nth-child(2) a');await q.waitForTimeout(500);
  ok(new URL(q.url()).pathname==='/projects/','touch: first tap previews rather than navigates');
  await t.close();}
 // 4. horizontal stories
 for(const r of STORIES){const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+r);await p.waitForTimeout(900);
  const g=await p.evaluate(()=>{const hs=document.querySelector('.hs'),tr=hs.querySelector('[data-track]');return {on:hs.classList.contains('is-hs'),travel:tr.scrollWidth-innerWidth,h:hs.offsetHeight,panels:hs.querySelectorAll('.hs__p').length,top:hs.getBoundingClientRect().top+scrollY};});
  ok(g.on&&Math.abs(g.h-(g.travel+900))<=2,`${r} story active, document height = travel + viewport (${g.h} vs ${g.travel+900})`);
  await p.evaluate(y=>scrollTo(0,y),g.top+g.travel/2);await p.waitForTimeout(500);
  const x=await p.evaluate(()=>-new DOMMatrix(getComputedStyle(document.querySelector('[data-track]')).transform).m41);
  ok(Math.abs(x-g.travel/2)<3,`${r} vertical scroll maps 1:1 to horizontal travel (${Math.round(x)}/${Math.round(g.travel/2)})`);
  await p.evaluate(y=>scrollTo(0,y),g.top+g.travel+50);await p.waitForTimeout(500);
  const end=await p.evaluate(()=>-new DOMMatrix(getComputedStyle(document.querySelector('[data-track]')).transform).m41);
  ok(Math.abs(end-g.travel)<3,`${r} track stops exactly at the last panel (${Math.round(end)}/${g.travel})`);
  ok(await p.evaluate(()=>!!document.querySelector('a.pn-next[data-next-unroll]')),`${r} ends with an unroll hand-off to the next page`);
  await p.evaluate(()=>scrollTo(0,0));
  await p.evaluate(()=>scrollBy(0,innerHeight));await p.waitForTimeout(300);
  const jump=await p.$$('.hs__rail button, [data-hs-jump] button, .hs__chap button');
  if(jump.length>2){await jump[2].click();await p.waitForTimeout(1400);const x2=await p.evaluate(()=>-new DOMMatrix(getComputedStyle(document.querySelector('[data-track]')).transform).m41);ok(x2>200,`${r} chapter jump moves the track (${Math.round(x2)})`);}
  await ctx.close();}
 // flat fallbacks
 for(const [name,opt] of [['reduced motion',{viewport:{width:1440,height:900},reducedMotion:'reduce'}],['phone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}],['no JS',{viewport:{width:1440,height:900},javaScriptEnabled:false}]]){
  const ctx=await b.newContext(opt);const p=await ctx.newPage();
  for(const r of STORIES){await p.goto(BASE+r);await p.waitForTimeout(500);
   const f=await p.evaluate(()=>{const hs=document.querySelector('.hs');const pin=hs.querySelector('.hs__pin');return {pos:getComputedStyle(pin).position,sw:document.documentElement.scrollWidth,iw:document.documentElement.clientWidth,tx:getComputedStyle(hs.querySelector('[data-track]')).transform};});
   ok(f.pos==='static'&&f.sw<=f.iw+1&&(f.tx==='none'||f.tx==='matrix(1, 0, 0, 1, 0, 0)'),`${name}: ${r} is a flat vertical document (pin ${f.pos}, scrollWidth ${f.sw}/${f.iw})`);}
  await ctx.close();}
 // 5. archive canvas
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/archive/');await p.waitForTimeout(1200);
  const s0=await p.evaluate(()=>window.__arState());
  await p.mouse.move(700,450);await p.mouse.down();for(let i=1;i<=12;i++){await p.mouse.move(700-i*20,450-i*8);await p.waitForTimeout(14);}
  const mid=await p.evaluate(()=>window.__arState());await p.mouse.up();await p.waitForTimeout(900);
  const s1=await p.evaluate(()=>window.__arState());
  ok(mid.dragging&&Math.hypot(s1.tx-s0.tx,s1.ty-s0.ty)>150,`archive: mouse drag pans the canvas (${Math.round(s1.tx-s0.tx)},${Math.round(s1.ty-s0.ty)}) with inertia after release`);
  ok(new URL(p.url()).pathname==='/archive/','archive: a drag does not trigger a tile click');
  for(let i=0;i<8;i++){await p.mouse.move(700,450);await p.mouse.down();await p.mouse.move(-400,-400,{steps:4});await p.mouse.up();}
  await p.waitForTimeout(900);const far=await p.evaluate(()=>window.__arState());ok(far.tx>-3700&&far.ty>-2600,'archive: panning is bounded');
  await p.click('[data-reset]');await p.waitForTimeout(1200);const rs=await p.evaluate(()=>window.__arState());ok(Math.hypot(rs.tx-s0.tx,rs.ty-s0.ty)<40,'archive: recentre returns to the start');
  await p.click('[data-listbtn]');await p.waitForTimeout(300);ok(await p.evaluate(()=>window.__arState().list)&&(await p.$$eval('[data-list] a',a=>a.length))>=20,'archive: accessible list view lists every fragment');
  await p.click('[data-listbtn]');await p.waitForTimeout(200);
  await p.focus('[data-view]');const a0=await p.evaluate(()=>window.__arState());await p.keyboard.press('ArrowLeft');await p.waitForTimeout(500);ok((await p.evaluate(()=>window.__arState())).tx!==a0.tx,'archive: arrow keys pan the canvas');
  await ctx.close();
  const t=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const q=await t.newPage();
  await q.goto(BASE+'/archive/');await q.waitForTimeout(1200);
  const cdp=await t.newCDPSession(q);const a=await q.evaluate(()=>window.__arState());
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:500}]});
  for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300-i*14,y:500-i*10}]});await q.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await q.waitForTimeout(700);
  const a1=await q.evaluate(()=>window.__arState());ok(Math.hypot(a1.tx-a.tx,a1.ty-a.ty)>80,'archive: touch drag pans the canvas');
  await t.close();}
 // 6. profile
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/profile/');await p.waitForTimeout(900);
  const txt=await p.evaluate(()=>document.body.innerText);
  ok(/Curious across\s+disciplines/i.test(txt)&&/Building across them/i.test(txt),'profile: anchor line present');
  ok(await p.evaluate(()=>![...document.querySelectorAll('audio,video')].some(m=>!m.paused||m.autoplay)),'profile: no autoplay media');
  ok(await p.evaluate(()=>[...document.querySelectorAll('a[href*="youtube"],a[href*="instagram"]')].length>=2),'profile: music channel links present');
  const y0=await p.evaluate(()=>document.querySelector('.pf__portrait')?.getBoundingClientRect().left);
  await p.evaluate(()=>scrollTo(0,innerHeight*3));await p.waitForTimeout(600);
  const y1=await p.evaluate(()=>document.querySelector('.pf__portrait')?.getBoundingClientRect().left);
  ok(y0!==y1,`profile: portrait moves on its own plane while scrolling (${Math.round(y0)}→${Math.round(y1)})`);
  await ctx.close();}
 // 7. links
 {const ctx=await b.newContext();const p=await ctx.newPage();const set=new Map();
  for(const r of routes){await p.goto(BASE+r);(await p.$$eval('a[href]',a=>a.map(x=>({h:x.href,t:x.target,rel:x.rel})))).forEach(x=>set.set(x.h,x));}
  const bad=[];for(const [h,x] of set){if(h.startsWith(BASE)){const rs=await fetch(h.split('#')[0]);if(rs.status!==200)bad.push(h+' '+rs.status);}else if(h.startsWith('http')&&x.t==='_blank'&&!/noreferrer/.test(x.rel))bad.push('rel '+h);}
  ok(bad.length===0,`internal links resolve & external links safe (${set.size} unique) ${JSON.stringify(bad)}`);
  await ctx.close();}
 // 8. experiments live iframe on demand
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();await p.goto(BASE+'/work/experiments/');
  ok((await p.$$('iframe')).length===0,'experiments: no iframe loaded by default');
  await p.evaluate(()=>document.querySelector('[data-live]').click());await p.waitForSelector('iframe');ok(true,'experiments: Try it here loads on demand');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);ok((await p.$$('iframe')).length===0,'experiments: Escape unloads it');await ctx.close();}
 console.log(out.join('\n'));console.log('\nSUMMARY pass='+out.filter(l=>l.startsWith('PASS')).length+' fail='+out.filter(l=>l.startsWith('FAIL')).length);
 await b.close();})();
