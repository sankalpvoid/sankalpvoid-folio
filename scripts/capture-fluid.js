/* Evidence captures for the fluid refinement (review artifacts only; nothing here ships).
   OUT=/abs/path BASE=http://127.0.0.1:4195 BEFORE=http://127.0.0.1:4196 [SHOTS_ONLY=1|VIDEOS_ONLY=1] node scripts/capture-fluid.js
   WebGL in headless Chromium uses SwiftShader; frame pacing in the recordings is therefore a software-renderer rate, not a device measurement. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const OUT=path.resolve(process.env.OUT||'../../outputs/fluid-review');
const BASE=process.env.BASE||'http://127.0.0.1:4195',BEFORE=process.env.BEFORE||'http://127.0.0.1:4196',SHARE=process.env.SHARE_QS||'';
const slugs=['reclaim','wealthwithsg','sankalp-shristi-furnishers','aureledger','kaal','experiments'];
const sleep=(p,n=500)=>p.waitForTimeout(n);const U=(o,p)=>o+p+SHARE;
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const man=[];
 const shot=async(p,n)=>{await p.screenshot({path:path.join(OUT,n+'.png')});man.push(n+'.png')};
 if(!process.env.VIDEOS_ONLY){
  for(const [w,h] of [[390,844],[768,1024],[1280,720],[1440,900]]){
   const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<800});const p=await ctx.newPage();
   await p.goto(U(BASE,'/'));await sleep(p,1500);
   for(let i=0;i<6;i++){await shot(p,`${w}-gallery-${i+1}`);await p.click('[data-next]');await sleep(p,1800);}
   for(const s of slugs){await p.goto(U(BASE,'/work/'+s+'/'));await p.evaluate(()=>document.fonts.ready);await sleep(p,700);await shot(p,`${w}-${s}-hero`);
    const n=await p.locator('.hs__p').count();
    for(let i=0;i<n;i++){await p.evaluate(i=>{const el=document.querySelectorAll('.hs__p')[i];if(window.HS&&HS.active)HS.scrollToX(Math.max(0,el.offsetLeft-40),false);else el.scrollIntoView({block:'start'});},i);await sleep(p,500);await shot(p,`${w}-${s}-scene-${String(i+1).padStart(2,'0')}`);}}
   for(const r of ['profile','archive','projects','contact']){await p.goto(U(BASE,'/'+r+'/'));await sleep(p,1200);await shot(p,`${w}-${r}`);}
   await ctx.close();}
  // before / after (the same routes and positions)
  const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  for(const [name,route,pos] of [['gallery','/',''],['projects','/projects/',''],['archive','/archive/',''],['kaal-story','/work/kaal/','story'],['reclaim-rail','/work/reclaim/','story']]){
   for(const [label,o] of [['before',BEFORE],['after',BASE]]){await p.goto(U(o,route));await sleep(p,1400);
    if(pos==='story')await p.evaluate(()=>{if(window.HS)HS.scrollToX(HS.panels[1].offsetLeft-40,false)});await sleep(p,900);await shot(p,`${label}-${name}`);}}
  await ctx.close();
 }
 if(!process.env.SHOTS_ONLY){
  const rec=async(name,fn,opt={})=>{const ctx=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(OUT,'raw'),size:{width:1280,height:800}},...opt});const p=await ctx.newPage();await fn(p);await sleep(p,500);const v=p.video();await ctx.close();await v.saveAs(path.join(OUT,name+'.webm'));console.log('recorded',name)};
  await rec('01-gallery-title-response',async p=>{await p.goto(U(BASE,'/'));await sleep(p,1600);const t=await p.locator('.slide.is-active .t a').boundingBox();for(let k=0;k<2;k++){for(let i=0;i<=24;i++){await p.mouse.move(t.x-40+i*(t.width+80)/24,t.y+t.height/2+Math.sin(i/3)*10);await sleep(p,30)}}await p.mouse.move(700,100);await sleep(p,1000)});
  await rec('02-hold-cancel-and-enter',async p=>{await p.goto(U(BASE,'/'));await sleep(p,1600);await p.mouse.move(900,330);await p.mouse.down();await sleep(p,260);await p.mouse.up();await sleep(p,1200);await p.mouse.move(900,330);await p.mouse.down();await p.waitForURL('**/work/reclaim/',{timeout:8000}).catch(()=>{});await sleep(p,2600)});
  await rec('03-next-project-transition',async p=>{await p.goto(U(BASE,'/work/reclaim/'));await sleep(p,1500);await p.click('.rail__next');await p.waitForURL('**/work/wealthwithsg/',{timeout:8000}).catch(()=>{});await sleep(p,2800)});
  await rec('04-archive-bulge-drag-release',async p=>{await p.goto(U(BASE,'/archive/'));await sleep(p,1500);await p.mouse.move(1000,330);await p.mouse.down();await sleep(p,700);for(let i=1;i<=30;i++){await p.mouse.move(1000-i*14,330+i*7);await sleep(p,18)}await p.mouse.up();await sleep(p,3000)});
  await rec('05-index-outline-hover-focus',async p=>{await p.goto(U(BASE,'/projects/'));await sleep(p,1600);for(const i of [1,3,5,6,2]){await p.hover(`.idx__item:nth-child(${i}) .idx__t`);await sleep(p,1000)}await p.mouse.move(20,520);await sleep(p,1100);await p.focus('.idx__item:nth-child(4) a');await sleep(p,1100)});
  await rec('06-index-touch-open',async p=>{await p.goto(U(BASE,'/projects/'));await sleep(p,1400);await p.tap('.idx__item:nth-child(2) a');await sleep(p,1400);await p.tap('[data-idx-enter] a');await p.waitForURL('**/work/wealthwithsg/',{timeout:6000}).catch(()=>{});await sleep(p,1500)},{viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await rec('07-kaal-crow',async p=>{await p.goto(U(BASE,'/work/kaal/'));await sleep(p,1400);await p.evaluate(()=>HS.scrollToX(document.getElementById('presence').offsetLeft-40,false));await sleep(p,1800);const bx=await p.locator('[data-crow-stage]').boundingBox();const x=bx.x+bx.width*.62,y=bx.y+bx.height*.81-60;await p.mouse.move(x-250,y);await p.mouse.move(x-80,y,{steps:10});await sleep(p,700);await p.mouse.click(x,y);await sleep(p,2600);for(let i=0;i<3;i++){await p.mouse.click(x,y);await sleep(p,110)}await sleep(p,3200)});
  await rec('08-profile-reveal-and-music',async p=>{await p.goto(U(BASE,'/profile/'));await sleep(p,1600);for(let i=0;i<150;i++){await p.mouse.wheel(0,70);await sleep(p,55)}await sleep(p,1500)});
 }
 fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({base:BASE,before:BEFORE,shots:man},null,2));await b.close();console.log('saved',OUT);
})().catch(e=>{console.error(e);process.exitCode=1});
