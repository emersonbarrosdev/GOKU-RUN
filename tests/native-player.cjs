// Native gameplay integration; GIF fidelity is tested separately.
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('.local/task1',{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR',exact:true}).click().catch(async error=>{
      console.error('PLAYER_LOAD_FAILURE',JSON.stringify({errors,body:await page.locator('body').innerText()}));
      throw error;
    });
    const result=await page.evaluate(async()=>{
      const {game:g,scene:s,phaser}=window.__gokuRun,p=g.player;
      // Isolate movement from enemies; still the actual runner scene and controls.
      g.encounterTimer=g.orbTimer=10000;
      g.track.segments=[{start:-1000,end:100000}];
      const frames=new Set(),samples=[],wraps=[],repeatEvents=[];let maxEcho=0,maxAngle=0,lastFrame=null;
      const onLoop=()=>repeatEvents.push(s.time.now);
      s.hero.on('animationrepeat',onLoop);
      const onUpdate=()=>{
        const frame=+s.hero.frame.name;
        frames.add(frame);samples.push({foot:p.foot,frame});
        // Validate what is actually rendered. The GitHub headless browser can
        // throttle RAF, while Phaser smooths its own game-time delta. Using
        // Scene Clock time keeps the expected cadence tied to the animation
        // clock instead of wall-clock performance on the CI host.
        if(lastFrame!==null&&lastFrame>=8&&frame<=1)wraps.push(s.time.now);
        lastFrame=frame;
        maxEcho=Math.max(maxEcho,s.nativePlayer.echo.alpha);maxAngle=Math.max(maxAngle,Math.abs(s.hero.angle));
      };
      s.events.on('postupdate',onUpdate);
      const deadline=performance.now()+8000;
      while(wraps.length<4&&performance.now()<deadline)await new Promise(r=>setTimeout(r,100));
      s.events.off('postupdate',onUpdate);s.hero.off('animationrepeat',onLoop);
      const a=s.anims.get('goku-run');
      return {frames:[...frames].sort((a,b)=>a-b),fps:a.frameRate,repeat:a.repeat,
        count:a.frames.length,durations:a.frames.map(f=>f.duration||a.msPerFrame),texture:s.hero.texture.key,size:[s.hero.frame.width,s.hero.frame.height],
        body:[s.hero.body.width,s.hero.body.height],scale:s.hero.scaleX,rate:s.hero.anims.timeScale,maxEcho,maxAngle,
        loopMs:wraps.slice(1).map((t,i)=>t-wraps[i]),wrapCount:wraps.length,repeatEvents:repeatEvents.length,
        stateRepeat:s.hero.anims.repeat,repeatCounter:s.hero.anims.repeatCounter,isPlaying:s.hero.anims.isPlaying,
        x:p.x,feet:samples.map(x=>x.foot),samples:samples.length,
        instances:document.querySelectorAll('#game-container canvas').length,
        logical:[phaser.scale.width,phaser.scale.height],legacyHero:s.textures.exists('hero'),
        ground:{type:s.nativePlayer.floorViews[0]?.type,texture:s.nativePlayer.floorViews[0]?.texture.key,
          top:s.nativePlayer.floorViews[0]?.body.top,height:s.nativePlayer.floorViews[0]?.height}};
    });
    assert.deepEqual(result.frames,Array.from({length:10},(_,i)=>i));
    assert.equal(result.fps,1000/30);assert.equal(result.repeat,-1);assert.equal(result.count,10);
    assert.equal(result.stateRepeat,-1,'the Sprite playback state must repeat indefinitely');
    const sourceDurations=[30,30,30,40,40,30,30,30,40,40];
    assert.ok(result.durations.every((ms,i)=>Math.abs(ms-sourceDurations[i])<1e-9),'source frame durations must be preserved');
    assert.equal(result.texture,'goku-native');assert.equal(result.legacyHero,false);
    assert.deepEqual(result.ground,{type:'TileSprite',texture:'ground-seamless',top:560,height:160});
    assert.deepEqual(result.size,[256,256]);assert.deepEqual(result.logical,[1280,720]);
    assert.equal(result.instances,1);assert.equal(result.x,280);
    assert.equal(result.scale,.65);assert.equal(result.rate,.62);
    assert.ok(Math.abs(result.body[0]-41.6)<.01&&Math.abs(result.body[1]-93.6)<.01);
    assert.ok(result.loopMs.length>=2&&result.loopMs.every(ms=>ms>500&&ms<600),`rendered loop must take approximately 548ms of Phaser game time: ${JSON.stringify({loopMs:result.loopMs,wrapCount:result.wrapCount,repeatEvents:result.repeatEvents,samples:result.samples,stateRepeat:result.stateRepeat,repeatCounter:result.repeatCounter,isPlaying:result.isPlaying})}`);
    assert.ok(result.maxEcho>.02&&result.maxEcho<=.141,'short previous-frame echo must soften swaps without ghosting');
    assert.ok(result.maxAngle>.1&&result.maxAngle<=.33,'sub-degree torso sway must remain subtle');
    assert.ok(result.feet.every(y=>Math.abs(y-560)<.01),'Arcade foot baseline must not drift');
    const singleJump=async key=>{
      await page.keyboard.press(key);
      const sample=await page.evaluate(async()=>{
        const p=window.__gokuRun.game.player,feet=[];
        for(let i=0;i<50;i++){feet.push(p.foot);await new Promise(r=>setTimeout(r,20));}
        return {min:Math.min(...feet),last:p.foot,grounded:p.grounded,jumps:p.jumps};
      });
      assert.ok(sample.min>430&&sample.min<480,'single jump should rise about 100px');
      assert.ok(sample.grounded&&Math.abs(sample.last-560)<.01);assert.equal(sample.jumps,2);
      return sample;
    };
    const jump=await singleJump('Space');await singleJump('w');await singleJump('ArrowUp');
    await page.keyboard.press('Space');await page.waitForTimeout(120);await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    const second=await page.evaluate(()=>({jumps:window.__gokuRun.game.player.jumps,vy:window.__gokuRun.game.player.vy}));
    assert.equal(second.jumps,0);assert.ok(second.vy<0);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>window.__gokuRun.game.player.jumps),0,'no third jump');
    await page.waitForTimeout(1000);
    await page.keyboard.press('p');
    const paused=await page.evaluate(()=>({y:window.__gokuRun.scene.hero.y,frame:window.__gokuRun.scene.hero.frame.name}));
    await page.waitForTimeout(250);
    assert.deepEqual(await page.evaluate(()=>({y:window.__gokuRun.scene.hero.y,frame:window.__gokuRun.scene.hero.frame.name})),paused);
    const viewports=[];
    for(const [width,height] of [[1920,1080],[1366,768],[800,600]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(150);
      const rect=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {width:r.width,height:r.height,scroll:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth};});
      assert.ok(Math.abs(rect.width/rect.height-16/9)<.005);assert.equal(rect.scroll,false);
      viewports.push({width,height,...rect});
    }
    await page.keyboard.press('p');
    await page.waitForTimeout(80);
    await page.screenshot({path:'.local/task1/native-player-gameplay.png'});
    const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
    const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
    await mp.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await mp.getByRole('button',{name:'JOGAR',exact:true}).tap();
    await mp.touchscreen.tap(350,240);await mp.waitForTimeout(180);
    assert.equal(await mp.evaluate(()=>window.__gokuRun.game.player.grounded),false);
    await mp.setViewportSize({width:390,height:844});await mp.waitForTimeout(150);
    assert.equal(await mp.locator('#rotate-notice').isVisible(),true);
    assert.equal(await mp.evaluate(()=>window.__gokuRun.game.state),'paused');
    const ratio=await mp.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return r.width/r.height;});
    assert.ok(Math.abs(ratio-16/9)<.005);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({...result,feet:[Math.min(...result.feet),Math.max(...result.feet)],jump,viewports,errors,art:'Original user-selected GIF; see gif-fidelity test'},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
