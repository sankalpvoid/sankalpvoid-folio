const {chromium}=require('playwright');const axe=require('fs').readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const routes=['/','/projects/','/work/reclaim/','/work/wealthwithsg/','/work/sankalp-shristi-furnishers/','/work/aureledger/','/archive/','/about/','/contact/'];
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1440,900],[390,844]]){const ctx=await b.newContext({viewport:{width:w,height:h}});
 for(const r of routes){const p=await ctx.newPage();await p.goto((process.env.BASE||'http://localhost:4173')+r);await p.waitForTimeout(1200);
  const H=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<H;y+=h*.6){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(60);}await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(6500);
  await p.evaluate(axe);const res=await p.evaluate(()=>axe.run({runOnly:['wcag2a','wcag2aa','best-practice']}));
  console.log(w+'px',r,'violations:',res.violations.map(v=>`${v.id}(${v.nodes.length}${v.nodes[0]?' e.g. '+v.nodes[0].target.join(' ').slice(0,60):''})`).join(' | ')||'none');await p.close();}
 await ctx.close();}
// iframe render check
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();await p.goto((process.env.BASE||'http://localhost:4173')+'/archive/');
for(const id of ['cyberpunk','parallax','gsap-motion']){await p.click(`#${id} [data-live]`);await p.waitForTimeout(5000);
 const f=p.frames().find(x=>x!==p.mainFrame());const t=f?await f.title().catch(()=>'ERR'):'no frame';console.log('iframe',id,'→',t);await p.keyboard.press('Escape');await p.waitForTimeout(300);}
await b.close()})();
