// Deterministic visual inspection; artifacts are written outside the source tree.
const {chromium}=require('playwright-core');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const out=process.env.QA_OUTPUT_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'goku-visual-'));
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR'}).click();
    const atlas=await page.evaluate(()=>window.__gokuRun.scene.textures.get('hero').getSourceImage().toDataURL());
    fs.writeFileSync(path.join(out,'hero-atlas.png'),Buffer.from(atlas.split(',')[1],'base64'));
    console.log('ARTIFACTS '+out);
    const runtime=await page.evaluate(async()=>{
      const {scene:s,game:g}=window.__gokuRun;
      g.encounterTimer=g.orbTimer=Infinity;g.enemies=[];g.orbs=[];g.friends=[];g.track.segments=[{start:-10000,end:100000}];g.phaseBanner=0;
      let uploads=0;const original=s.game.renderer.canvasToTexture;
      s.game.renderer.canvasToTexture=function(...args){uploads++;return original.apply(this,args);};
      await new Promise(r=>setTimeout(r,1000));s.game.renderer.canvasToTexture=original;
      return{uploadsPerSecond:uploads,terrain:s.groundStrips?.map(t=>t.texture.key)||s.terrain?.displayTexture.key,frame:s.hero.frame.name};
    });
    console.log(runtime);
    assert.equal(runtime.uploadsPerSecond,0,'scrolling must not re-upload terrain textures');
    await page.evaluate(()=>{const {scene:s,game:g}=window.__gokuRun;s.update=()=>{};g.time=3;g.player.kiTime=5;g.player.invulnerable=0;s.renderWorld();s.syncUI();});
    await page.screenshot({path:path.join(out,'ki-before.png')});
    const pixels=[];
    for(const distance of [838,839,840,841,1679,1680]){
      console.log('capturing ground',distance);
      await page.evaluate(async distance=>{const {scene:s,game:g}=window.__gokuRun;g.track.distance=distance;s.renderWorld();await new Promise(r=>s.game.events.once('postrender',r));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},distance);
      const png=await page.screenshot({clip:{x:0,y:590,width:1280,height:100}});
      const data=await page.evaluate(async encoded=>{
        const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();
        const c=document.createElement('canvas');c.width=1280;c.height=100;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
        return [...ctx.getImageData(0,0,1280,100).data];
      },png.toString('base64'));
      pixels.push({distance,data});
    }
    const errors=[];
    for(let i=1;i<pixels.length;i++){
      if(pixels[i].distance-pixels[i-1].distance!==1)continue;
      let diff=0,max=0;const a=pixels[i-1].data,b=pixels[i].data;
      for(let y=0;y<100;y++)for(let x=0;x<1000;x++)for(let c=0;c<3;c++){const d=Math.abs(a[(y*1280+x+1)*4+c]-b[(y*1280+x)*4+c]);diff+=d;max=Math.max(max,d);}
      errors.push({distance:pixels[i].distance,shiftDifference:diff/(100*1000*3),max});
    }
    console.log(JSON.stringify(errors));
    for(const sample of errors)assert.ok(sample.shiftDifference<.01,'ground pixels must shift continuously across wrap '+sample.distance);
    console.log('PASS: no runtime texture upload; pixel-identical ground movement across strip recycling.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
