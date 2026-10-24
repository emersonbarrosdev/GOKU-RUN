const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR'}).waitFor({state:'visible'});
    if(process.env.QA_OUTPUT_DIR)await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,'mobile-menu.png')});
    await page.getByRole('button',{name:'JOGAR'}).tap();
    await page.waitForFunction(()=>window.__gokuRun?.game.state==='playing');
    const canvas=await page.locator('canvas').first().boundingBox();
    await page.touchscreen.tap(canvas.x+canvas.width*.35,canvas.y+canvas.height*.55);
    await page.waitForTimeout(80);
    assert.ok(await page.evaluate(()=>window.__gokuRun.game.player.foot<560));
    await page.touchscreen.tap(canvas.x+canvas.width*.35,canvas.y+canvas.height*.55);
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.player.jumps),0);
    await page.evaluate(()=>{const p=window.__gokuRun.game.player;p.foot=560;p.vy=0;p.grounded=true;p.buffer=0;p.jumps=2;p.addKi(100);});
    await page.locator('#ki-button').tap();await page.waitForTimeout(80);
    assert.deepEqual(await page.evaluate(()=>{const p=window.__gokuRun.game.player;return[p.kiActive,p.foot,p.jumps];}),[true,560,2]);
    await page.getByRole('button',{name:'Pausar',exact:true}).tap();
    const before=await page.evaluate(()=>window.__gokuRun.game.track.distance);await page.waitForTimeout(120);
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.track.distance),before);
    await page.getByRole('button',{name:'CONTINUAR'}).tap();
    await context.setOffline(true);await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.state),'playing');
    await context.setOffline(false);
    await page.setViewportSize({width:390,height:844});
    await page.locator('#rotate-notice').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.state),'paused');
    await page.setViewportSize({width:844,height:390});
    await page.waitForFunction(()=>{
      const a=document.querySelector('#stage').getBoundingClientRect(),b=document.querySelector('canvas').getBoundingClientRect();
      return Math.abs(a.width-b.width)<2&&Math.abs(a.height-b.height)<2&&Math.abs(a.x-b.x)<2&&Math.abs(a.y-b.y)<2;
    });
    await page.getByRole('button',{name:'CONTINUAR'}).tap();
    if(process.env.QA_OUTPUT_DIR)await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,'mobile-landscape.png')});
    const frames=await page.evaluate(async()=>{
      const frames=new Set();
      for(let i=0;i<20;i++){frames.add(window.__gokuRun.scene.hero.frame.name);await new Promise(r=>setTimeout(r,50));}
      return [...frames];
    });
    assert.ok(frames.length>=7,'Phaser actually advances the whole-body run frames');
    await page.getByRole('button',{name:'Pausar',exact:true}).tap();
    await page.waitForTimeout(100);
    const frozen=await page.evaluate(()=>[window.__gokuRun.scene.hero.frame.name,window.__gokuRun.game.track.distance]);
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(()=>[window.__gokuRun.scene.hero.frame.name,window.__gokuRun.game.track.distance]),frozen,'pause freezes both Phaser animation and model');
    await page.evaluate(()=>window.__gokuRun.game.finish(false));
    await page.getByRole('button',{name:'CORRER NOVAMENTE'}).waitFor({state:'visible'});
    await page.waitForTimeout(100);
    const finalState=await page.evaluate(()=>{const {game:g,scene:s}=window.__gokuRun;return[g.time,g.score,g.track.distance,s.hero.frame.name,s.world.x,s.world.y];});
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(()=>{const {game:g,scene:s}=window.__gokuRun;return[g.time,g.score,g.track.distance,s.hero.frame.name,s.world.x,s.world.y];}),finalState,'game over is frozen without camera shake');
    if(process.env.QA_OUTPUT_DIR)await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,'mobile-game-over.png')});
    await page.getByRole('button',{name:'CORRER NOVAMENTE'}).tap();
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.player.lives),3);
    assert.deepEqual(errors,[]);
    const origin=new URL(page.url()).origin;
    const external=requests.filter(url=>!url.startsWith('data:')&&new URL(url).origin!==origin);
    assert.deepEqual(external,[],'no CDN or external runtime dependencies (local blob URLs are allowed)');
    console.log('PASS: touch jump, double jump, KI without jump, pause, landscape, portrait pause, offline play, no JS errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
