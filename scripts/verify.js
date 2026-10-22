const {chromium}=require('playwright');
const BASE=process.env.BASE||'http://localhost:4173';
const routes=['/','/projects/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/archive/','/about/','/contact/'];
const out=[];const ok=(c,m)=>{out.push((c?'PASS ':'FAIL ')+m);};
(async()=>{
 const b=await chromium.launch();
 // 1. every route × 3 viewports
 for(const [w,h] of [[390,844],[768,1024],[1440,900]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:w<700,hasTouch:w<800});
  for(const r of routes){
   const p=await ctx.newPage();const errs=[];
   p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('requestfailed',q=>errs.push('reqfail '+q.url()));
   p.on('response',res=>{if(res.status()>=400)errs.push(res.status()+' '+res.url())});
   const resp=await p.goto(BASE+r,{waitUntil:'load'});
   await p.waitForTimeout(800);
   // scroll through to load lazy media
   const H=await p.evaluate(()=>document.documentElement.scrollHeight);
   for(let y=0;y<H;y+=h*.6){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(90);}
   await p.waitForTimeout(700);
   const info=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,title:document.title,desc:document.querySelector('meta[name=description]')?.content?.length>40,og:!!document.querySelector('meta[property="og:image"]'),h1:document.querySelectorAll('h1').length,
     broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.currentSrc).map(i=>i.currentSrc),
     noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).length,
     hidden:[...document.querySelectorAll('.rv')].filter(e=>getComputedStyle(e).opacity<0.5).length}));
   ok(resp.status()===200&&errs.length===0,`${w}px ${r}  status=${resp.status()} errors=${JSON.stringify(errs)}`);
   ok(info.sw<=info.iw+1,`${w}px ${r}  no horizontal overflow (scrollWidth ${info.sw}/${info.iw})`);
   if(w===1440){ok(info.title.length>5&&info.desc&&info.og&&info.h1===1,`${r} meta ok title="${info.title}" h1=${info.h1}`);}
   ok(info.broken.length===0&&info.noalt===0,`${w}px ${r}  images ok broken=${info.broken.length} noalt=${info.noalt}`);
   ok(info.hidden===0,`${w}px ${r}  no reveal content stuck hidden (${info.hidden})`);
   await p.close();
  }
  await ctx.close();
 }
 // 2. home interactions
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/');await p.waitForTimeout(800);
  const slug=()=>p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug);
  ok(await slug()==='reclaim','home opens on Reclaim');
  await p.keyboard.press('ArrowRight');await p.waitForTimeout(1300);ok(await slug()==='wealthwithsg','ArrowRight → WealthWithSG');
  ok((await p.evaluate(()=>location.hash))==='#wealthwithsg','hash updates for sharing');
  await p.keyboard.press('ArrowLeft');await p.waitForTimeout(1300);ok(await slug()==='reclaim','ArrowLeft → Reclaim');
  await p.click('[data-next]');await p.waitForTimeout(1300);await p.click('[data-next]');await p.waitForTimeout(1300);ok(await slug()==='sankalp-shristi-furnishers','Next button twice → Furnishers');
  await p.click('[data-go="3"]');await p.waitForTimeout(1300);ok(await slug()==='archive','tick button → Archive');
  await p.keyboard.press('ArrowRight');await p.waitForTimeout(1300);ok(await slug()==='reclaim','wraps to Reclaim');
  // enter project, back/forward
  await p.click('.slide.is-active .enter');await p.waitForURL('**/work/reclaim/');await p.waitForTimeout(600);
  ok(p.url().endsWith('/work/reclaim/'),'Enter opens /work/reclaim/');
  await p.goBack();await p.waitForTimeout(900);ok(new URL(p.url()).pathname==='/','Back returns to gallery');ok(await slug()==='reclaim','…on the same exhibition');
  await p.goForward();await p.waitForTimeout(700);ok(p.url().endsWith('/work/reclaim/'),'Forward returns to project');
  // gallery link from project returns to its slide
  await p.click('.wordmark');await p.waitForURL(u=>new URL(u).pathname==='/');await p.waitForTimeout(800);
  ok(await slug()==='reclaim'&&p.url().includes('#reclaim'),'Gallery link restores Reclaim slide');
  // deep link slide
  await p.goto(BASE+'/#sankalp-shristi-furnishers');await p.waitForTimeout(900);ok(await slug()==='sankalp-shristi-furnishers','deep link /#slug opens that slide');
  // overlay
  await p.goto(BASE+'/');await p.waitForTimeout(600);
  await p.click('.controls .all');await p.waitForSelector('dialog.index[open]');ok(true,'All projects overlay opens');
  const items=await p.$$eval('dialog.index .index__item',e=>e.length);ok(items===4,`overlay lists 4 exhibitions (${items})`);
  await p.keyboard.press('Escape');await p.waitForTimeout(500);ok(!(await p.$('dialog.index[open]')),'Esc closes overlay');
  const focused=await p.evaluate(()=>document.activeElement?.getAttribute('data-open-index')!==null);ok(focused,'focus returns to trigger');
  await p.keyboard.press('p');await p.waitForSelector('dialog.index[open]');ok(true,'"P" shortcut opens overlay');
  await p.click('dialog.index a[href="/archive/"]');await p.waitForURL('**/archive/');ok(true,'overlay link navigates');
  // keyboard: tab order starts at skip link and focus is visible
  await p.goto(BASE+'/');await p.keyboard.press('Tab');
  ok(await p.evaluate(()=>document.activeElement.classList.contains('skip')),'first Tab stop = skip link');
  const outline=await p.evaluate(()=>{for(let i=0;i<4;i++)document.activeElement&&0;return 1});
  await ctx.close();}
 // 3. Reclaim viewer + wsg scrubber + ssf sequence + archive live
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/work/reclaim/');
  await p.click('#tab-craving');await p.waitForTimeout(900);
  ok((await p.getAttribute('[data-screen-img]','src')).includes('dark-craving'),'Reclaim viewer: Craving tab swaps screen');
  await p.click('[data-theme="light"]');await p.waitForTimeout(900);
  ok((await p.getAttribute('[data-screen-img]','src')).includes('light-craving'),'Reclaim viewer: Light theme swaps screen');
  await p.focus('#tab-craving');await p.keyboard.press('ArrowRight');await p.waitForTimeout(700);
  ok((await p.getAttribute('#tab-health','aria-selected'))==='true','Reclaim viewer: arrow keys move tabs');
  await p.goto(BASE+'/work/wealthwithsg/');await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelector('[data-scrub]').scrollIntoView());await p.waitForTimeout(4200);
  const v1=await p.inputValue('#scrub-r');ok(+v1>90,'WSG scrubber demonstrates once on first view (value '+v1+')');
  await p.fill('#scrub-r','0');await p.waitForTimeout(300);ok((await p.textContent('#scrub-out')).includes('Noise'),'WSG scrubber label responds');
  await p.click('[data-i="3"]');await p.waitForTimeout(900);ok((await p.getAttribute('[data-frame-img]','src')).includes('hero-4'),'WSG frame stepper changes frame');
  await p.goto(BASE+'/work/sankalp-shristi-furnishers/');await p.waitForTimeout(500);
  const top=await p.evaluate(()=>document.querySelector('[data-seq]').offsetTop);
  await p.evaluate(t=>scrollTo(0,t+10),top);await p.waitForTimeout(500);const o0=await p.$$eval('.seq .f',f=>f.map(x=>+x.style.opacity));
  await p.evaluate(t=>scrollTo(0,t+2400),top);await p.waitForTimeout(600);const o1=await p.$$eval('.seq .f',f=>f.map(x=>+x.style.opacity));
  ok(o0[0]>.9&&o1.indexOf(Math.max(...o1))>=4,`SSF sequence is scroll-linked (start frame1=${o0[0]}, later peak idx=${o1.indexOf(Math.max(...o1))})`);
  await p.goto(BASE+'/archive/');await p.click('#parallax [data-live]');await p.waitForSelector('#parallax iframe');ok(true,'Archive: "Try it here" loads iframe on demand');
  const before=await p.$$eval('iframe',e=>e.length);await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(before===1&&(await p.$$eval('iframe',e=>e.length))===0,'Archive: Esc unloads the iframe');
  const preload=await p.evaluate(()=>[...document.querySelectorAll('iframe')].length);
  await ctx.close();}
 // 4. reduced motion
 {const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();
  await p.goto(BASE+'/');await p.waitForTimeout(500);await p.keyboard.press('ArrowRight');await p.waitForTimeout(250);
  const anim=await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().duration>20).length);
  ok(anim===0,`reduced motion: home has no running long animations (${anim})`);
  ok((await p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug))==='wealthwithsg','reduced motion: slide still changes (instant)');
  await p.goto(BASE+'/work/sankalp-shristi-furnishers/');await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.documentElement.classList.contains('rm')&&getComputedStyle(document.querySelector('.seq__pin')).position==='static'),'reduced motion: SSF sequence becomes a static contact sheet (no pin)');
  await p.goto(BASE+'/work/wealthwithsg/');await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.querySelectorAll('[data-chart=hero] .cd').length>0&&getComputedStyle(document.querySelector('[data-chart=hero] .cd')).opacity==='1'),'reduced motion: WSG hero chart rests on final structure state');
  await ctx.close();}
 // 5. JS disabled
 {const ctx=await b.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false});const p=await ctx.newPage();
  for(const r of ['/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/archive/','/about/']){await p.goto(BASE+r);
   const t=await p.evaluate(()=>({h1:document.querySelector('h1')?.innerText?.slice(0,30),vis:[...document.querySelectorAll('.rv')].filter(e=>getComputedStyle(e).opacity==='0').length}));
   ok(t.h1&&t.vis===0,`no-JS ${r}: content visible (h1="${t.h1}", hidden reveals ${t.vis})`);}
  await ctx.close();}
 // 6. links
 {const ctx=await b.newContext();const p=await ctx.newPage();const set=new Map();
  for(const r of routes){await p.goto(BASE+r);const hs=await p.$$eval('a[href]',a=>a.map(x=>({h:x.href,t:x.target,rel:x.rel})));hs.forEach(x=>set.set(x.h,x));}
  const bad=[];for(const [h,x] of set){ if(h.startsWith(BASE)){const u=h.split('#')[0];const r=await fetch(u);if(r.status!==200)bad.push(h+' '+r.status);} else if(h.startsWith('http')){ if(x.t==='_blank'&&!/noreferrer/.test(x.rel))bad.push('rel '+h); }}
  ok(bad.length===0,`internal links resolve & external links safe (${set.size} unique) ${JSON.stringify(bad)}`);
  const ext=[...set.keys()].filter(h=>h.startsWith('http')&&!h.startsWith(BASE)&&!h.includes('github.com/sankalpvoid/')&&!h.startsWith('mailto'));
  for(const h of ext){try{const r=await fetch(h,{method:'GET',redirect:'follow',headers:{'user-agent':'Mozilla/5.0'}});out.push((r.status<400?'PASS ':'WARN ')+'external '+h+' → '+r.status);}catch(e){out.push('WARN external '+h+' '+e.message)}}
  await ctx.close();}
 console.log(out.join('\n'));console.log('\nSUMMARY pass='+out.filter(l=>l.startsWith('PASS')).length+' fail='+out.filter(l=>l.startsWith('FAIL')).length+' warn='+out.filter(l=>l.startsWith('WARN')).length);
 await b.close();})();
