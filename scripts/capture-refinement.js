/* Evidence captures only; no dependency in the deployed portfolio.
   OUT=/absolute/review/path node scripts/capture-refinement.js */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const OUT=path.resolve(process.env.OUT||'../../outputs/refinement-review');
const BASE=process.env.BASE||'http://127.0.0.1:4195';
const BEFORE=process.env.BEFORE||'http://127.0.0.1:4196';
const slugs=['reclaim','wealthwithsg','sankalp-shristi-furnishers','aureledger','experiments'];
const sleep=(p,n=500)=>p.waitForTimeout(n);
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 const manifest=[];
 const shot=async(p,name)=>{const file=path.join(OUT,name+'.png');await p.screenshot({path:file});manifest.push(name+'.png');};
 // Every scene of every project, at all requested widths, after image decode.
 for(const w of (process.env.VIDEOS_ONLY?[]:[390,768,1440])){
  const ctx=await browser.newContext({viewport:{width:w,height:w===768?1024:900},hasTouch:w<800});const p=await ctx.newPage();
  for(const slug of slugs){await p.goto(BASE+'/work/'+slug+'/');await p.evaluate(()=>document.fonts.ready);await sleep(p,600);await shot(p,`${w}-${slug}-hero`);
   const n=await p.locator('.hs__p').count();
   for(let i=0;i<n;i++){
    await p.evaluate(i=>{const panel=document.querySelectorAll('.hs__p')[i];if(HS.active)HS.scrollToX(Math.max(0,panel.offsetLeft-40),false);else panel.scrollIntoView({block:'start'});},i);
    await sleep(p,250);await shot(p,`${w}-${slug}-scene-${String(i+1).padStart(2,'0')}`);
   }
   console.log('CAPTURED',w,slug,n,'scenes');
  }
  for(const route of ['profile','archive','projects']){await p.goto(BASE+'/'+route+'/');await sleep(p,1000);await shot(p,`${w}-${route}`);}
  await ctx.close();
 }
 // Paired views use identical routes, widths and intended story positions.
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
 for(const [name,route,position] of (process.env.VIDEOS_ONLY?[]:[['profile','/profile/','profile'],['archive','/archive/','archive'],['reclaim-story','/work/reclaim/','story'],['wealthwithsg-story','/work/wealthwithsg/','story']])){
  for(const [label,origin] of [['before',BEFORE],['after',BASE]]){await p.goto(origin+route);await sleep(p,1000);
   await p.evaluate(position=>{if(position==='profile')scrollTo(0,innerHeight*1.9);if(position==='story'&&window.HS)HS.scrollToX(HS.panels[1].offsetLeft-40,false);},position);await sleep(p,900);await shot(p,`${label}-${name}`);
  }
 }
 await ctx.close();
 const record=async(name,action,options={})=>{if(process.env.SHOTS_ONLY)return;const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(OUT,'raw'),size:{width:1440,height:900}},...options});const p=await ctx.newPage();await action(p,ctx);const video=p.video();await ctx.close();await fs.promises.rename(await video.path(),path.join(OUT,name+'.webm'));};
 await record('01-archive-fixed-title',async p=>{await p.goto(BASE+'/archive/');await sleep(p,1500);await p.mouse.move(800,450);await p.mouse.down();for(let i=1;i<=35;i++){await p.mouse.move(800-i*8,450-i*3);await sleep(p,24)}await p.mouse.up();await sleep(p,3200);await p.click('[data-reset]');await sleep(p,1800)});
 await record('02-diagonal-peel-cancel-complete',async p=>{await p.goto(BASE+'/work/reclaim/');await sleep(p,1000);const r=await p.locator('.rail [data-peel]').boundingBox();const x=r.x+r.width/2,y=r.y+r.height-24;const drag=async(n,dx,dy)=>{await p.mouse.move(x,y);await p.mouse.down();for(let i=1;i<=n;i++){await p.mouse.move(Math.max(5,x-i*dx),Math.max(5,y-i*dy));await sleep(p,30)}await sleep(p,250);await p.mouse.up()};await drag(12,12,8);await sleep(p,1800);await drag(40,32,20);await p.waitForURL('**/work/wealthwithsg/');await sleep(p,1200)});
 await record('03-weighted-story-and-rail',async p=>{await p.goto(BASE+'/work/reclaim/');await p.click('.hero a[href="#story"]');await sleep(p,800);await p.mouse.move(600,400);for(let i=0;i<40;i++){await p.mouse.wheel(0,100);await sleep(p,90)}await sleep(p,1800);await p.click('.hs__nav [data-go="3"]');await sleep(p,2200)});
 await record('04-profile-zero-to-reveal',async p=>{await p.goto(BASE+'/profile/');await sleep(p,1600);for(let i=0;i<70;i++){await p.mouse.wheel(0,65);await sleep(p,65)}await sleep(p,1600)});
 await record('05-index-hover',async p=>{await p.goto(BASE+'/projects/');await sleep(p,1500);for(let i=1;i<=5;i++){await p.hover(`.idx__item:nth-child(${i}) a`);await sleep(p,1100)}});
 await record('06-index-touch-open',async p=>{await p.goto(BASE+'/projects/');await sleep(p,1300);await p.tap('.idx__item:nth-child(2) a');await sleep(p,1400);await p.tap('[data-idx-enter] a');await p.waitForURL('**/work/wealthwithsg/');await sleep(p,1200)},{viewport:{width:390,height:844},isMobile:true,hasTouch:true,recordVideo:{dir:path.join(OUT,'raw'),size:{width:390,height:844}}});
 if(!process.env.VIDEOS_ONLY)fs.writeFileSync(path.join(OUT,'capture-manifest.json'),JSON.stringify({base:BASE,before:BEFORE,screenshots:manifest},null,2));
 await browser.close();console.log('Evidence saved:',OUT);
})().catch(e=>{console.error(e);process.exitCode=1});
