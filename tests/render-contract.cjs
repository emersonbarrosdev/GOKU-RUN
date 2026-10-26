const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR',exact:true}).click();
    const result=await page.evaluate(()=>{
      const {scene:s,game:g,core:C}=window.__gokuRun;g.state='paused';g.enemies=[];g.friends=[];g.orbs=[];
      const p=g.player,count=C.RUN_FRAMES.length,frames=[];
      p.grounded=true;p.landTime=0;
      for(let i=0;i<count;i++){p.runTime=i+.1;s.renderWorld();frames.push(Number(s.hero.frame.name));}
      p.grounded=false;p.airTime=.03;p.vy=-500;s.renderWorld();const takeoff=+s.hero.frame.name;
      p.airTime=.2;s.renderWorld();const rising=+s.hero.frame.name;
      p.vy=300;s.renderWorld();const falling=+s.hero.frame.name;
      p.grounded=true;p.landTime=.04;s.renderWorld();const landing=+s.hero.frame.name;
      const cadence=[335,430].map(speed=>{
        const player=new C.Player(),seen=new Set();let transitions=0,previous=player.frame;
        for(let i=0;i<120;i++){player.update(1/120,{supports:()=>true},speed);seen.add(player.frame);if(player.frame!==previous)transitions++;previous=player.frame;}
        return {speed,transitions,visited:seen.size,theoretical:speed/C.RUN_STRIDE*count};
      });
      const image=s.textures.get('hero').getSourceImage();
      return {frames,jumps:[takeoff,rising,falling,landing],cadence,run:C.PATHS.run,jump:C.PATHS.jump,terrain:C.PATHS.terrain,
        textureSize:[image.width,image.height],scale:[C.PLAYER_SCALE.run,C.PLAYER_SCALE.jump],grid:C.RUN_FRAMES};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(result.frames,Array.from({length:24},(_,i)=>i));
    assert.deepEqual(result.jumps,[24,25,26,27]);
    assert.equal(result.run,'./assets/spritesheets/goku_run_v12.png');assert.equal(result.jump,result.run);
    assert.equal(result.terrain,'./assets/spritesheets/terrain_tiles_v5.png');
    assert.deepEqual(result.textureSize,[1280,640],'GPU atlas stays below mobile texture limits');
    assert.deepEqual(result.scale,[.5,.5],'running and jumping share the same body');
    assert.deepEqual(result.grid,Array.from({length:24},(_,i)=>[(i%6)*256,Math.floor(i/6)*256,256,256]));
    for(const c of result.cadence){assert.equal(c.visited,24);assert.ok(c.theoretical>=40&&c.theoretical<=60);assert.ok(Math.abs(c.transitions-c.theoretical)<1);}
    console.log('RENDER_CONTRACT',JSON.stringify(result));
    console.log('PASS: runtime displays all 24 run/4 jump frames from one atlas, distance-driven, with fixed anatomical scale.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
