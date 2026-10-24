// Run with PLAYWRIGHT_MODULE pointing to playwright-core and CHROME_PATH to Chrome.
// Uses an isolated browser profile, never the user's Chrome profile.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,
    args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:780}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.text().startsWith('QA:'))console.log(m.text());});
    await page.addInitScript(()=>{let seed=31;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
    await page.goto((process.env.TEST_URL || 'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR'}).click();
    const report=await page.evaluate(async()=>{
      const {game:g,scene}=window.__gokuRun,frameTimes=[],drawTimes=[],wrapTimes=[],stages=new Set(),hidden=[];
      const originalUpdate=g.update,originalDraw=scene.renderWorld;
      let previous=performance.now(),distance=0,phase=-1;
      g.update=function(dt){
        if(this.state==='playing'){
          const p=this.player;if(p.kiReady)this.activateKi();
          const dangers=[...this.enemies.filter(e=>e.active&&!e.airborne&&(!p.kiActive||p.kiTime<.5)),
            ...this.friends.filter(f=>f.active&&!f.touched)];
          const nearby=dangers.some(e=>e.x-p.x>-35&&e.x-p.x<(e.type==='blast'?175:150));
          const next=dangers.some(e=>e.type!=='blast'&&e.x-p.x>-35&&e.x-p.x<230);
          if(p.grounded&&(nearby||!this.track.supports(p.x+55,p.x+65)))p.queueJump();
          else if(!p.grounded&&p.jumps>0&&p.vy>200&&next)p.queueJump();
        }
        originalUpdate.call(this,dt);
      };
      scene.renderWorld=function(){const start=performance.now();originalDraw.call(this);drawTimes.push(performance.now()-start);};
      const musicStart=scene.music.seek;
      let musicAdvanced=false;
      await new Promise(resolve=>{
        function sample(t){
          const delta=t-previous;previous=t;
          if(frameTimes.length||delta>0)frameTimes.push(delta);
          hidden.push(document.hidden);stages.add(g.phaseIndex);
          if(Math.floor(distance/840)!==Math.floor(g.track.distance/840))wrapTimes.push(delta);
          distance=g.track.distance;
          musicAdvanced ||= scene.music.seek>musicStart+.5;
          if(phase!==g.phaseIndex){phase=g.phaseIndex;console.log('QA: stage '+(phase+1));}
          if(['victory','game-over'].includes(g.state)){resolve();return;}
          requestAnimationFrame(sample);
        }requestAnimationFrame(sample);
      });
      g.update=originalUpdate;scene.renderWorld=originalDraw;
      const stats=values=>{const a=values.slice().sort((a,b)=>a-b);return{count:a.length,
        median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],
        max:a.at(-1),over25:a.filter(n=>n>25).length,over50:a.filter(n=>n>50).length};};
      return {state:g.state,seconds:g.time,lives:g.player.lives,stages:[...stages],
        frameTimes:stats(frameTimes.slice(5)),drawTimes:stats(drawTimes),tileWraps:stats(wrapTimes),
        hiddenFrames:hidden.filter(Boolean).length,musicAdvanced,
        sfxReady:Object.keys(window.__gokuRun.core.SFX).every(key=>scene.cache.audio.exists('sfx-'+key)),
        renderer:scene.game.renderer.type};
    });
    console.log(JSON.stringify(report,null,2));
    assert.equal(report.state,'victory');assert.equal(report.stages.length,5);
    assert.equal(report.hiddenFrames,0);assert.equal(report.musicAdvanced,true);assert.equal(report.sfxReady,true);
    assert.ok(report.drawTimes.p95<16.7,'drawing budget at 60Hz');
    assert.deepEqual(errors,[]);
    await page.getByRole('button',{name:'CORRER NOVAMENTE'}).click();
    await page.keyboard.press('p');
    await page.getByRole('button',{name:'CONTINUAR'}).waitFor({state:'visible'});
    const before=await page.evaluate(()=>window.__gokuRun.game.track.distance);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.track.distance),before);
    await page.getByRole('button',{name:'CONTINUAR'}).click();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    assert.ok(await page.evaluate(()=>window.__gokuRun.game.player.foot<560));
    await page.evaluate(()=>window.__gokuRun.game.player.addKi(100));
    await page.keyboard.press('k');
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.player.kiActive),true);
    if(process.env.QA_OUTPUT_DIR)await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,'gameplay.png')});
    console.log('PASS: browser playthrough, visible page, audio, restart, pause, jump and KI.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
