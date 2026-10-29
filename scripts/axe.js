/* axe-core on every route at 1440 and 390, plus: each story scene, the project-index overlay, the archive list view, Profile scenes. */
const {chromium}=require('playwright');const axe=require('fs').readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const BASE=process.env.BASE||'http://127.0.0.1:4195';const SHARE=process.env.SHARE_QS||'';
const U=(p)=>{const [pathname,hash]=p.split('#');return BASE+pathname+SHARE+(hash?'#'+hash:'')};
const routes=['/','/projects/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/work/aureledger/','/work/kaal/','/work/experiments/','/archive/','/profile/','/contact/'];
const fmt=(res)=>res.violations.map(v=>`${v.id}(${v.nodes.length}${v.nodes[0]?' e.g. '+v.nodes[0].target.join(' ').slice(0,60):''})`).join(' | ')||'none';
const run=async(p)=>{await p.evaluate(axe);return p.evaluate(()=>axe.run({runOnly:['wcag2a','wcag2aa','best-practice']}))};
(async()=>{const b=await chromium.launch();let bad=0;
for(const [w,h] of [[1440,900],[390,844]]){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<800});
 for(const r of routes){const p=await ctx.newPage();await p.goto(U(r));await p.waitForTimeout(1500);
  const H=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<Math.min(H,20000);y+=h*.6){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(50);}await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(3500);
  const res=await run(p);const f=fmt(res);if(f!=='none')bad++;console.log(w+'px',r,'violations:',f);
  /* each scene of a story */
  if(w>860&&r.startsWith('/work/')){const n=await p.evaluate(()=>HS.panels.length);for(let i=0;i<n;i++){await p.evaluate(i=>HS.scrollToX(Math.max(0,HS.panels[i].__start-40),false),i);await p.waitForTimeout(500);const rs=await run(p);const g=fmt(rs);if(g!=='none')bad++;console.log('   scene',i+1,g);}}
  if(r==='/profile/'){for(const t of [2,5,8,10.5]){await p.evaluate(t=>scrollTo(0,t*innerHeight),t);await p.waitForTimeout(1800);const g=fmt(await run(p));if(g!=='none')bad++;console.log('   profile scene @',t,g);}}
  if(r==='/archive/'){await p.click('[data-listbtn]');await p.waitForTimeout(300);const g=fmt(await run(p));if(g!=='none')bad++;console.log('   archive list view',g);}
  if(r==='/work/reclaim/'){await p.evaluate(()=>scrollTo(0,0));await p.click('[data-open-index]');await p.waitForSelector('dialog[open]');await p.waitForTimeout(900);const g=fmt(await run(p));if(g!=='none')bad++;console.log('   index overlay',g);}
  await p.close();}
 await ctx.close();}
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();await p.goto(U('/work/experiments/'));
for(const id of ['cyberpunk','parallax','gsap-motion']){await p.evaluate(id=>HS.scrollToX(document.getElementById(id).offsetLeft,false),id);await p.waitForTimeout(500);await p.click(`#${id} [data-live]`);await p.waitForTimeout(4500);
 const f=p.frames().find(x=>x!==p.mainFrame());const t=f?await f.title().catch(()=>'ERR'):'no frame';console.log('iframe',id,'->',t);await p.keyboard.press('Escape');await p.waitForTimeout(300);}
console.log('\nAXE groups with violations:',bad);await b.close();process.exitCode=bad?1:0})().catch(e=>{console.error(e);process.exitCode=1});
