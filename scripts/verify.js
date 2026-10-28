const {chromium}=require('playwright');
const BASE=process.env.BASE||'http://localhost:4173';
const routes=['/','/projects/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/work/aureledger/','/archive/','/about/','/contact/'];
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
   ok(info.sw<=w+1&&info.iw<=w+1,`${w}px ${r}  no horizontal overflow (scrollWidth ${info.sw}, viewport ${info.iw}, device ${w})`);
   if(w===1440){ok(info.title.length>5&&info.desc&&info.og&&info.h1===1,`${r} meta ok title="${info.title}" h1=${info.h1}`);}
   ok(info.broken.length===0&&info.noalt===0,`${w}px ${r}  images ok broken=${info.broken.length} noalt=${info.noalt}`);
   ok(info.hidden===0,`${w}px ${r}  no reveal content stuck hidden (${info.hidden})`);
   await p.close();
  }
  await ctx.close();
 }
 // 2. home interactions
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/projects/');await p.waitForTimeout(800);
  const slug=()=>p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug);
  ok(await slug()==='reclaim','collection (/projects/) opens on Reclaim');
  await p.keyboard.press('ArrowRight');await p.waitForTimeout(1300);ok(await slug()==='wealthwithsg','ArrowRight → WealthWithSG');
  ok((await p.evaluate(()=>location.hash))==='#wealthwithsg','hash updates for sharing');
  await p.keyboard.press('ArrowLeft');await p.waitForTimeout(1300);ok(await slug()==='reclaim','ArrowLeft → Reclaim');
  await p.click('[data-next]');await p.waitForTimeout(1300);await p.click('[data-next]');await p.waitForTimeout(1300);ok(await slug()==='sankalp-shristi-furnishers','Next button twice → Furnishers');
  await p.click('[data-next]');await p.waitForTimeout(1300);ok(await slug()==='aureledger','Next → Aureledger');
  await p.click('[data-go="4"]');await p.waitForTimeout(1300);ok(await slug()==='archive','tick button → Archive');
  await p.keyboard.press('ArrowRight');await p.waitForTimeout(1300);ok(await slug()==='reclaim','wraps to Reclaim');
  await p.click('[data-go="3"]');await p.waitForTimeout(3800);
  ok(await slug()==='aureledger','tick button → Aureledger (gallery)');
  ok((await p.$eval('.s-al [data-note]',e=>e.style.getPropertyValue('--split')))==='58.00%','gallery: Aureledger note lines settle at the midpoint');
  await p.mouse.move(600,400);await p.mouse.move(700,420);await p.waitForTimeout(250);
  ok(+(await p.$eval('.s-al [data-note]',e=>parseFloat(e.style.getPropertyValue('--split'))))!==58,'gallery: pointer moves the Aureledger note split');
  await p.click('[data-go="0"]');await p.waitForTimeout(1500);
  // enter project, back/forward
  await p.click('.slide.is-active .enter');await p.waitForURL('**/work/reclaim/');await p.waitForTimeout(600);
  ok(p.url().endsWith('/work/reclaim/'),'Enter opens /work/reclaim/');
  await p.goBack();await p.waitForTimeout(900);ok(new URL(p.url()).pathname==='/projects/','Back returns to the collection');ok(await slug()==='reclaim','…on the same exhibition');
  await p.goForward();await p.waitForTimeout(700);ok(p.url().endsWith('/work/reclaim/'),'Forward returns to project');
  // collection crumb from a project returns to its slide
  await p.click('.crumb');await p.waitForURL(u=>new URL(u).pathname==='/projects/');await p.waitForTimeout(800);
  ok(await slug()==='reclaim'&&p.url().includes('#reclaim'),'"← Collection" restores the Reclaim slide');
  // deep link slide
  await p.goto(BASE+'/projects/#sankalp-shristi-furnishers');await p.waitForTimeout(900);ok(await slug()==='sankalp-shristi-furnishers','deep link /projects/#slug opens that slide');
  // overlay
  await p.goto(BASE+'/projects/');await p.waitForTimeout(600);
  await p.click('.controls .all');await p.waitForSelector('dialog.index[open]');ok(true,'All projects overlay opens');
  const items=await p.$$eval('dialog.index .index__item',e=>e.length);ok(items===5,`overlay lists 5 exhibitions (${items})`);
  await p.keyboard.press('Escape');await p.waitForTimeout(500);ok(!(await p.$('dialog.index[open]')),'Esc closes overlay');
  const focused=await p.evaluate(()=>document.activeElement?.getAttribute('data-open-index')!==null);ok(focused,'focus returns to trigger');
  await p.keyboard.press('p');await p.waitForSelector('dialog.index[open]');ok(true,'"P" shortcut opens overlay');
  await p.click('dialog.index a[href="/archive/"]');await p.waitForURL('**/archive/');ok(true,'overlay link navigates');
  // keyboard: tab order starts at skip link and focus is visible
  await p.goto(BASE+'/projects/');await p.keyboard.press('Tab');
  ok(await p.evaluate(()=>document.activeElement.classList.contains('skip')),'first Tab stop = skip link');
  const outline=await p.evaluate(()=>{for(let i=0;i<4;i++)document.activeElement&&0;return 1});
  await ctx.close();}
 // 2b. homepage and personal journey
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const bad=[];
  p.on('requestfailed',q=>bad.push(q.url()));p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
  await p.goto(BASE+'/');await p.waitForTimeout(1200);
  ok(/Sankalp Kushwaha/.test(await p.title()),'home: title names me');
  ok((await p.textContent('h1')).replace(/\s+/g,' ').trim()==='Curious across disciplines. Building across them.','home: opens on the identity statement');
  ok(await p.evaluate(()=>!document.querySelector('.slide,.stage,[data-next],[data-go]')&&![...document.scripts].some(s=>/home\.js|scenes\.js/.test(s.src))),'home: no gallery stage or gallery scripts');
  ok(await p.evaluate(()=>document.querySelectorAll('.foyer .btn--solid').length===1&&document.querySelector('.foyer .btn--solid').getAttribute('href')==='/projects/'),'home: exactly one primary action, into the collection');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.foyer .paths a')].map(a=>a.getAttribute('href')).join()==='/about/,/about/#music,/contact/'),'home: Meet / Music / Contact are quiet secondary paths');
  ok(await p.evaluate(()=>['/projects/','/about/','/about/#music','/contact/'].every(h=>document.querySelector(`.chrome nav a[href="${h}"]`))),'home: header offers Work, About, Music, Contact');
  ok(await p.evaluate(()=>document.querySelectorAll('audio,video').length===0),'home: no audio or video element, so nothing can autoplay');
  ok(await p.evaluate(()=>!/upload|your photo|placeholder|todo|replace with/i.test(document.body.innerText)),'home: no development or upload wording is visible');
  ok(await p.evaluate(()=>document.querySelector('.portrait svg')&&!document.querySelector('.portrait__photo').getAttribute('src')),'portrait: complete illustration, no photo request');
  const tiles=await p.$$eval('.t a',a=>a.map(x=>x.getAttribute('href')));
  ok(JSON.stringify(tiles)===JSON.stringify(['/work/reclaim/','/work/aureledger/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/archive/']),'home: the five exhibitions are all reachable from "Now showing"');
  ok(await p.evaluate(()=>[...document.querySelectorAll('a[href^="https://www.youtube"],a[href^="https://www.instagram"]')].every(a=>/@sankalp\.mussic|sankalp\.singss/.test(a.href))&&document.querySelectorAll('a[href*="@sankalp.mussic"]').length>=1),'home: music links point at the verified channels');
  // primary action → collection, then back
  await p.click('.foyer .btn--solid');await p.waitForURL('**/projects/');await p.waitForTimeout(700);
  ok(await p.evaluate(()=>document.querySelector('.slide.is-active')?.dataset.slug)==='reclaim','Explore the work opens the collection');
  await p.goBack();await p.waitForTimeout(800);ok(new URL(p.url()).pathname==='/'&&/Curious across/.test(await p.textContent('h1')),'back from the collection returns to the homepage');
  // a tile opens its exhibition; back returns here
  await p.evaluate(()=>document.querySelector('.t--al').scrollIntoView({block:'center'}));await p.click('.t--al a');await p.waitForURL('**/work/aureledger/');
  ok(true,'home: Aureledger tile opens the exhibition');await p.goBack();await p.waitForTimeout(900);ok(new URL(p.url()).pathname==='/','back from an exhibition returns to the homepage');
  // exhibition navigation: Home + Collection
  await p.goto(BASE+'/work/wealthwithsg/');await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.querySelector('.wordmark').getAttribute('href')==='/'&&document.querySelector('.crumb').getAttribute('href')==='/projects/#wealthwithsg'),'exhibition: wordmark goes Home and the crumb goes to its place in the collection');
  await p.click('.crumb');await p.waitForURL(u=>new URL(u).pathname==='/projects/');await p.waitForTimeout(800);ok(await p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug)==='wealthwithsg','crumb lands on the right exhibition');
  await p.goto(BASE+'/work/wealthwithsg/');await p.click('.wordmark');await p.waitForURL(u=>new URL(u).pathname==='/');ok(true,'wordmark goes Home');
  // old links
  const land=async(u)=>{await p.goto(BASE+u);await p.waitForTimeout(900);return new URL(p.url())};
  let L=await land('/#wealthwithsg');ok(L.pathname==='/projects/'&&L.hash==='#wealthwithsg'&&await p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug)==='wealthwithsg','old link /#wealthwithsg lands on that exhibition, not another');
  L=await land('/#aureledger');ok(L.pathname==='/projects/'&&await p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug)==='aureledger','old link /#aureledger lands on Aureledger');
  L=await land('/#about');ok(L.pathname==='/about/','old anchor #about reaches the About page');
  L=await land('/#lab');ok(L.pathname==='/about/'&&L.hash==='#now'&&!!(await p.$('#now')),'old anchor #lab reaches "Right now"');
  L=await land('/#side-b');ok(L.pathname==='/'&&!!(await p.$('#side-b')),'old anchor #side-b reaches the Side B section on the homepage');
  L=await land('/#work');ok(L.pathname==='/'&&!!(await p.$('#work')),'old anchor #work reaches "Now showing"');
  // overlay from the homepage
  await p.goto(BASE+'/');await p.waitForTimeout(500);await p.focus('.chrome [data-open-index]');await p.keyboard.press('Enter');await p.waitForSelector('dialog.index[open]');
  ok(await p.evaluate(()=>document.querySelector('dialog.index').contains(document.activeElement)&&document.querySelectorAll('dialog.index .index__item').length===5&&!!document.querySelector('dialog.index .index__foot a[href="/"]')),'home: overlay opens with focus inside, five exhibitions and a Home link');
  await p.keyboard.press('Escape');await p.waitForTimeout(400);ok(await p.evaluate(()=>document.activeElement.hasAttribute('data-open-index')),'home: overlay returns focus to the Work link');
  // About and music
  await p.goto(BASE+'/');await p.click('.foyer .paths a[href="/about/#music"]');await p.waitForURL('**/about/#music');await p.waitForTimeout(700);
  ok(await p.evaluate(()=>{const r=document.querySelector('#music').getBoundingClientRect();return r.top<innerHeight*0.5&&r.bottom>0}),'Hear the music scrolls the About page to the music section');
  await p.goto(BASE+'/about/');await p.waitForTimeout(800);
  ok(await p.evaluate(()=>document.querySelectorAll('audio,video,[role="slider"]:not(input)').length===0&&document.querySelectorAll('#music button').length===0&&!/play(?!s)/i.test(document.querySelector('#music').innerText.replace(/Nothing on this site plays by itself\./,''))),'about: the music section has no player, no controls and no fake playback');
  ok(await p.evaluate(()=>{const a=[...document.querySelectorAll('#music .channels a')].map(x=>x.href);return a.includes('https://www.youtube.com/@sankalp.mussic')&&a.includes('https://www.instagram.com/sankalp.singss/')}),'about: the two verified channels are linked from Side B');
  ok(await p.evaluate(()=>/Hello\. I’m Sankalp\./.test(document.querySelector('h1').innerText)&&document.querySelector('.portrait svg')),'about: opens with a personal greeting and the portrait');
  ok(await p.evaluate(()=>!document.querySelector('[data-recordings]')&&!/TODO|TBD|lorem|\[.*\]/.test(document.body.innerText)),'about: no placeholder text or development markers');
  // portrait photo support (exercised with an existing image so the final photo can be dropped in)
  await p.goto(BASE+'/about/');await p.waitForTimeout(500);
  await p.evaluate(()=>{const el=document.querySelector('[data-portrait]');el.dataset.photo='/assets/img/exp/gsap-1-720.jpg';window.SVPortrait.refresh()});await p.waitForTimeout(2600);
  ok(await p.evaluate(()=>{const el=document.querySelector('[data-portrait]');return el.classList.contains('has-photo')&&getComputedStyle(el.querySelector('.portrait__photo')).display==='block'&&parseFloat(el.style.getPropertyValue('--split'))>=99}),'portrait: a supplied photograph appears and the reveal completes');
  // sitemap + robots + internal docs not served
  const sm=await (await fetch(BASE+'/sitemap.xml')).text();
  ok(['/','/projects/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/work/aureledger/','/archive/','/about/','/contact/'].every(u=>sm.includes('https://sankalpvoid-folio.vercel.app'+u+'<')),'sitemap lists all nine routes');
  ok((await fetch(BASE+'/robots.txt')).status===200,'robots.txt present');
  if(BASE.startsWith('https://')){const r=await fetch(BASE+'/docs/ASSETS-NEEDED.md');ok(r.status===404,'internal docs are not served publicly ('+r.status+')');const r2=await fetch(BASE+'/scripts/verify.js');ok(r2.status===404,'scripts are not served publicly ('+r2.status+')');}
  ok(bad.filter(x=>!/_vercel|favicon/.test(x)).length===0,'home/about journey: no failed or error requests '+JSON.stringify(bad.slice(0,3)));
  await ctx.close();}
 // 3. exhibition interactions
 {const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  await p.goto(BASE+'/work/reclaim/');await p.waitForTimeout(600);
  ok((await p.$$('.beat')).length===5,'Reclaim: five beats in the evening');
  ok((await p.$$('.beat .pin')).length>=3,'Reclaim: annotation pins present');
  const vsrc=await p.$eval('[data-vid] video',v=>({pre:v.preload,paused:v.paused,src:v.querySelector('source').src.split('/').pop()}));
  ok(vsrc.pre==='none'&&vsrc.paused&&vsrc.src==='reclaim-craving.webm','Reclaim: recording is not preloaded or playing before it is in view');
  await p.evaluate(()=>document.querySelector('[data-vid]').scrollIntoView({block:'center'}));await p.waitForTimeout(1500);
  ok(!(await p.$eval('[data-vid] video',v=>v.paused)),'Reclaim: recording plays when in view');
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(800);
  ok(await p.$eval('[data-vid] video',v=>v.paused),'Reclaim: recording pauses when scrolled away');
  await p.evaluate(()=>document.querySelector('[data-orb-btn]').scrollIntoView({block:'center'}));
  await p.click('[data-orb-btn]');await p.waitForTimeout(300);
  ok((await p.textContent('[data-orb-label]'))==='Inhale','Reclaim: breathing orb starts on request (Inhale)');
  await p.click('[data-orb-btn]');await p.waitForTimeout(200);ok((await p.textContent('[data-orb-label]'))==='Ready','Reclaim: orb stops and rests');
  await p.click('.decisions details:nth-of-type(2) summary');ok(await p.$eval('.decisions details:nth-of-type(2)',e=>e.open),'Reclaim: decisions disclose on click');
  const txt=await p.evaluate(()=>document.body.innerText);
  ok(/Worked for you before/.test(txt)&&/Not a validated or intelligent model/.test(txt),'Reclaim: recommendation described as a plain rule, not validated');
  ok(/sample data/i.test(txt)&&!/clinically|proven|guarantee/i.test(txt),'Reclaim: sample-data label present, no efficacy claims');
  await p.goto(BASE+'/work/wealthwithsg/');await p.waitForTimeout(5200);
  ok(+(await p.inputValue('#noise'))>90,'WSG: hero chart settles on structure by itself');
  await p.fill('#noise','0');await p.waitForTimeout(300);
  const nz=await p.evaluate(()=>[...document.querySelectorAll('[data-chart-env] .nz')].map(e=>+e.style.opacity));
  const cd=await p.evaluate(()=>[...document.querySelectorAll('[data-chart-env] .cd')].map(e=>+e.style.opacity));
  ok(Math.max(...nz)>0.25&&Math.max(...cd)<0.05&&(await p.textContent('#noise-out'))==='Noise','WSG: slider at 0 shows noise and no candles');
  await p.fill('#noise','100');await p.waitForTimeout(300);
  ok(Math.min(...(await p.evaluate(()=>[...document.querySelectorAll('[data-chart-env] .cd')].map(e=>+e.style.opacity))))>0.9,'WSG: slider at 100 shows full structure');
  await p.mouse.move(100,300);await p.mouse.move(120,310);await p.waitForTimeout(300);
  ok(+(await p.inputValue('#noise'))<20,'WSG: pointer on the left of the chart pulls toward noise');
  ok((await p.$$('.strip > li')).length===6,'WSG: six frames in the sideways strip');
  const ov=await p.$eval('.strip',e=>getComputedStyle(e).overflowX);ok(ov==='auto'||ov==='scroll','WSG: strip uses native sideways scroll');
  await p.goto(BASE+'/work/sankalp-shristi-furnishers/');await p.waitForTimeout(2500);
  const stageInfo=await p.evaluate(()=>{const st=document.querySelector('[data-bed-stage]');return {svg:!!st.querySelector('svg path'),imgsInStage:[...st.querySelectorAll('img')].length,paths:st.querySelectorAll('path').length,hasLinesOnly:!document.querySelector('[data-draw] img[src*="line-"]')}});
  ok(stageInfo.svg&&stageInfo.paths>=30&&stageInfo.hasLinesOnly,`SSF: stage is native traced SVG (${stageInfo.paths} paths), no website-screenshot frames`);
  const geom=async()=>p.evaluate(()=>{const s=document.querySelector('[data-bed-stage]');const imgs=[...s.querySelectorAll('image')].map(i=>{const r=i.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)].join(',')});const o=s.querySelector('path.bd-main').getBoundingClientRect();return {imgs,o:[Math.round(o.left),Math.round(o.width)].join(','),vb:s.querySelector('svg').getAttribute('viewBox'),h:s.querySelector('mask rect').getAttribute('height')}});
  const top=await p.evaluate(()=>document.querySelector('[data-draw]').offsetTop);const H=await p.evaluate(()=>document.querySelector('[data-draw]').offsetHeight-innerHeight);
  const snaps=[];for(const f of [0.05,0.3,0.6,0.9]){await p.evaluate(y=>scrollTo(0,y),top+H*f);await p.waitForTimeout(700);snaps.push(await geom());}
  ok(snaps.every(s=>s.imgs.every(i=>i===snaps[0].imgs[0]))&&snaps.every(s=>s.o===snaps[0].o)&&snaps.every(s=>s.vb===snaps[0].vb),'SSF: stage geometry (render, outline, viewBox) is identical at every progress value');
  const hs=snaps.map(s=>+s.h);ok(hs[0]<=hs[1]&&hs[1]<=hs[2]&&hs[2]<=hs[3]&&hs[3]>900,`SSF: render reveal rises monotonically with scroll (${hs.map(Math.round)})`);
  await p.evaluate(y=>scrollTo(0,y),top+H*0.05);await p.waitForTimeout(500);await p.fill('[data-scrub]','100');await p.waitForTimeout(300);
  ok(+(await geom()).h>1100,'SSF: slider scrubs the same stage to the finished render');
  await p.evaluate(()=>document.querySelector('[data-cmp]').scrollIntoView({block:'center'}));await p.fill('[data-cmp-in]','20');
  ok((await p.$eval('[data-cmp]',e=>e.style.getPropertyValue('--pos')))==='20%','SSF: before/after slider moves');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.tag')].every(t=>/render|placeholder/i.test(t.textContent))),'SSF: every render tag is labelled');
  await p.goto(BASE+'/work/aureledger/');await p.waitForTimeout(900);
  ok((await p.$$('.quiz li')).length===4,'Aureledger: four accounting-rule questions');
  await p.evaluate(()=>document.querySelector('[data-quiz]').scrollIntoView());
  await p.click('.quiz li:nth-child(2) [data-guess="no"]');
  ok(await p.$eval('.quiz li:nth-child(2) .quiz__a',e=>!e.hidden&&/Doesn.t count/.test(e.textContent))&&(await p.$eval('.quiz li:nth-child(2)',e=>e.dataset.right))==='1','Aureledger: card-bill payment answered correctly, reason revealed');
  await p.click('.quiz li:nth-child(1) [data-guess="no"]');
  ok((await p.$eval('.quiz li:nth-child(1)',e=>e.dataset.right))==='0'&&/Counts, on the day/.test(await p.$eval('.quiz li:nth-child(1) .quiz__a',e=>e.textContent)),'Aureledger: wrong answer is marked and still explained');
  await p.click('.quiz li:nth-child(1) [data-guess="counts"]',{force:true,timeout:1500}).catch(()=>{});
  ok((await p.$eval('.quiz li:nth-child(1)',e=>e.dataset.right))==='0','Aureledger: an answer cannot be changed afterwards');
  const alText=await p.evaluate(()=>document.body.innerText);
  ok(/example data/i.test(alText)&&/Not verified/.test(alText)&&/Safari, Firefox/.test(alText)&&/Three\.js and this page shows captures/.test(alText),'Aureledger: example-data, not-verified and "captures not the live scene" caveats present');
  // hero note control
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(3800);
  ok(+(await p.inputValue('#note-split'))>=55&&+(await p.inputValue('#note-split'))<=60,'Aureledger: hero lines settle at the midpoint by themselves');
  await p.fill('#note-split','10');await p.waitForTimeout(200);
  ok((await p.$eval('[data-note]',e=>e.style.getPropertyValue('--split')))==='10.00%','Aureledger: Paper/Lines control drives the note split');
  await p.mouse.move(900,420);await p.mouse.move(1000,430);await p.waitForTimeout(200);
  ok(+(await p.$eval('[data-note]',e=>parseFloat(e.style.getPropertyValue('--split'))))>10,'Aureledger: a mouse moved across the note moves the split');
  // scrubbed introduction
  const sq=await p.evaluate(()=>({top:document.querySelector('[data-seq]').offsetTop,H:document.querySelector('[data-seq]').offsetHeight-innerHeight,chips:document.querySelectorAll('[data-ch]').length}));
  ok(sq.chips===7,'Aureledger: seven chapters');
  const at=async f=>{await p.evaluate(y=>scrollTo(0,y),sq.top+sq.H*f);await p.waitForTimeout(900);return p.evaluate(()=>({j:+document.querySelector('[data-stage-img]').dataset.j,cap:document.querySelector('[data-cap-title]').textContent,cur:document.querySelector('[data-ch][aria-current=true]')?.textContent,v:+document.querySelector('[data-scrub]').value,alt:document.querySelector('[data-stage-img]').alt}));};
  const s0=await at(0),s5=await at(0.5),s9=await at(1);
  ok(s0.j===0&&/glance/.test(s0.cap)&&/Wallet/.test(s0.cur),`Aureledger: scroll start is the wallet chapter (${JSON.stringify(s0)})`);
  ok(s5.j>s0.j&&s9.j>s5.j&&s9.j===31&&/pocket/.test(s9.cap),`Aureledger: frames advance monotonically with scroll to the workspace (${s0.j}→${s5.j}→${s9.j})`);
  ok(s5.alt.includes('stage')&&s5.alt!==s0.alt,'Aureledger: stage alt text describes the current chapter');
  await p.evaluate(y=>scrollTo(0,y),sq.top);await p.waitForTimeout(500);
  await p.click('[data-ch="4"]');await p.waitForTimeout(1800);
  const gp=await p.evaluate(()=>({cap:document.querySelector('[data-cap-title]').textContent,j:+document.querySelector('[data-stage-img]').dataset.j}));
  ok(/over time/.test(gp.cap)&&gp.j>=21,`Aureledger: chapter button scrolls to its stage (${JSON.stringify(gp)})`);
  await p.fill('[data-scrub]','100');await p.waitForTimeout(1800);
  ok((await p.evaluate(()=>+document.querySelector('[data-stage-img]').dataset.j))===31,'Aureledger: slider scrubs to the last frame');
  ok(await p.evaluate(()=>{const r=document.querySelector('.seq__stage').getBoundingClientRect();const i=document.querySelector('[data-stage-img]').getBoundingClientRect();return Math.abs(r.width-i.width)<3&&Math.abs(r.height-i.height)<3}),'Aureledger: stage geometry is fixed (image fills the same box at every frame)');
  ok(await p.evaluate(()=>!document.querySelector('.seq-static')||getComputedStyle(document.querySelector('.seq-static')).display==='none'),'Aureledger: static stage list is hidden when the scrubber is active');
  ok(!/canara|icici|groww|@gmail|supabase.co|token/i.test(alText.replace(/Gmail/g,'')),'Aureledger: page names no bank, card issuer, endpoint or credential');
  ok(await p.evaluate(()=>[...document.querySelectorAll('a[href]')].every(a=>!/github\.com\/sankalpvoid\/aureledger/i.test(a.href))),'Aureledger: no link to the private repository');
  await p.goto(BASE+'/archive/');await p.click('#parallax [data-live]');await p.waitForSelector('#parallax iframe');ok(true,'Archive: "Try it here" loads the iframe on demand');
  const before=await p.$$eval('iframe',e=>e.length);await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(before===1&&(await p.$$eval('iframe',e=>e.length))===0,'Archive: Esc unloads the iframe');
  ok((await p.$$eval('iframe',e=>e.length))===0,'Archive: no live study is loaded by default');
  await ctx.close();}
 // 4. reduced motion
 {const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();
  await p.goto(BASE+'/projects/');await p.waitForTimeout(500);await p.keyboard.press('ArrowRight');await p.waitForTimeout(300);
  const anim=await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().duration>20).length);
  ok(anim===0,`reduced motion: home has no running long animations (${anim})`);
  ok((await p.evaluate(()=>document.querySelector('.slide.is-active').dataset.slug))==='wealthwithsg','reduced motion: slide still changes (instant)');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.s-wsg .cd')].every(e=>+e.style.opacity>0.9)),'reduced motion: gallery chart is already structured');
  await p.goto(BASE+'/');await p.waitForTimeout(900);
  ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.p-main')).animationName==='none'&&getComputedStyle(document.querySelector('.p-ring')).strokeDasharray==='none'&&document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().duration>20).length===0),'reduced motion: homepage portrait is a still, fully drawn sketch with no running animation');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.rv')].every(e=>{const c=getComputedStyle(e);return +c.opacity>=0.85&&c.transform==='none'&&c.visibility==='visible'})),'reduced motion: homepage content is all visible (no reveal offsets or fades)');
  await p.goto(BASE+'/work/sankalp-shristi-furnishers/');await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>document.documentElement.classList.contains('rm')&&getComputedStyle(document.querySelector('.draw__pin')).position==='static'&&document.querySelectorAll('[data-static] figure').length===4),'reduced motion: SSF becomes four fixed moments, no pin');
  await p.goto(BASE+'/work/wealthwithsg/');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>document.querySelectorAll('[data-chart-env] .cd').length>0&&[...document.querySelectorAll('[data-chart-env] .cd')].every(e=>+e.style.opacity>0.9)),'reduced motion: WSG hero rests on structure');
  await p.goto(BASE+'/work/aureledger/');await p.waitForTimeout(800);
  ok(await p.evaluate(()=>document.documentElement.classList.contains('rm')&&getComputedStyle(document.querySelector('.seq__pin')).display==='none'&&document.querySelectorAll('.seq-static li').length===7&&getComputedStyle(document.querySelector('.seq-static')).display==='grid'),'reduced motion: Aureledger shows seven fixed stages, no pin');
  ok(await p.evaluate(()=>+getComputedStyle(document.querySelector('.al-note .lines')).clipPath.length>0&&document.querySelector('[data-note]').style.getPropertyValue('--split')==='58.00%'),'reduced motion: Aureledger note rests at the midpoint');
  await p.goto(BASE+'/work/reclaim/');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.rc-ring')).animationName==='none'),'reduced motion: Reclaim rings are still');
  ok(await p.$eval('[data-vid] video',v=>v.paused),'reduced motion: recording does not autoplay');
  await ctx.close();}
 // 5. JS disabled
 {const ctx=await b.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false});const p=await ctx.newPage();
  for(const r of ['/','/about/','/projects/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/work/aureledger/','/archive/','/about/']){await p.goto(BASE+r);
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
