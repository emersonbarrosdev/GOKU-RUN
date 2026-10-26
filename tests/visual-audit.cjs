const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
(async()=>{
  const out=process.env.QA_OUTPUT_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'goku-v20-'));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR',exact:true}).click();
    const result=await page.evaluate(async()=>{
      const {scene:s,game:g}=window.__gokuRun;
      g.enemies=[];g.friends=[];g.orbs=[];g.encounterTimer=g.orbTimer=Infinity;
      g.track.segments=[{start:-512,end:2176}];g.phaseBanner=0;
      let uploads=0;const original=s.game.renderer.canvasToTexture;
      s.game.renderer.canvasToTexture=function(...args){uploads++;return original.apply(this,args);};
      await new Promise(r=>setTimeout(r,1000));s.game.renderer.canvasToTexture=original;
      g.state='paused';s.lastState='paused';document.querySelector('#panel').hidden=true;
      const seams=[];
      const pixels=source=>{const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d');ctx.drawImage(source,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
      const diff=(a,b,ax,bx,aw,bw)=>{let sum=0;for(let y=3;y<164;y++)for(let k=0;k<4;k++)sum+=Math.abs(a[(y*aw+ax)*4+k]-b[(y*bw+bx)*4+k]);return sum/(161*4);};
      for(let phase=0;phase<5;phase++){
        const center=s.textures.get('terrain-'+phase).getSourceImage(),left=s.textures.get('terrain-cap-left-'+phase).getSourceImage(),right=s.textures.get('terrain-cap-right-'+phase).getSourceImage();
        const a=pixels(center),l=pixels(left),r=pixels(right);
        const interior=Array.from({length:255},(_,x)=>diff(a,a,x,x+1,256,256)).sort((a,b)=>a-b);
        seams.push({phase,width:center.width,capWidth:left.width,edge:diff(a,a,255,0,256,256),interior95:interior[242],
          leftJoin:diff(l,a,63,0,64,256),rightJoin:diff(a,r,255,0,256,64),outerLeftAlpha:l[(80*64)*4+3],outerRightAlpha:r[(80*64+63)*4+3]});
      }
      g.track.segments=[{start:-512,end:384},{start:512,end:1920}];
      const alignment=[];
      for(const d of [128.1,128.9,129.1]){
        g.track.distance=d;s.renderWorld();alignment.push(s.groundView.parts.filter(p=>p.left.visible).map(p=>({left:p.left.x,middle:p.middle.x,right:p.right.x,end:p.end,width:p.middle.width})));
      }
      return {uploads,seams,alignment};
    });
    console.log('TERRAIN',JSON.stringify(result));assert.equal(result.uploads,0);
    for(const s of result.seams){
      assert.equal(s.width,256);assert.equal(s.capWidth,64);
      assert.ok(s.edge<s.interior95*1.5+1,`repeat boundary must not be a stronger edge than natural stone texture: ${s.phase}`);
      assert.ok(s.leftJoin<s.interior95*1.5+1&&s.rightJoin<s.interior95*1.5+1,'caps join periodic middle');
      assert.equal(s.outerLeftAlpha,0);assert.equal(s.outerRightAlpha,0,'cliffs must have actual transparent silhouette');
    }
    assert.deepEqual(result.alignment[0],result.alignment[1],'subpixel movement must not desynchronize caps and middle');
    result.alignment[0].forEach((p,i)=>{const q=result.alignment[2][i];
      for(const key of ['left','middle','right','end'])assert.equal(q[key],p[key]-1);
      assert.equal(p.middle,p.left+64);assert.equal(p.middle+p.width,p.right);assert.equal(p.right+64,p.end);
    });
    // Real GPU screenshots at three offsets straddling the repeat boundary.
    const snapshots=[];
    for(const distance of [255,256,257]){
      await page.evaluate(async d=>{const {game:g,scene:s}=window.__gokuRun;g.track.segments=[{start:-2048,end:4096}];g.track.distance=d;s.renderWorld();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},distance);
      snapshots.push((await page.screenshot({clip:{x:0,y:590,width:1280,height:100}})).toString('base64'));
    }
    const wrap=await page.evaluate(async encoded=>{
      const arrays=[];for(const value of encoded){const i=new Image();i.src='data:image/png;base64,'+value;await i.decode();const c=document.createElement('canvas');c.width=1280;c.height=100;const x=c.getContext('2d');x.drawImage(i,0,0);arrays.push(x.getImageData(0,0,1280,100).data);}
      return [0,1].map(index=>{let sum=0,max=0,count=0;for(let y=0;y<100;y++)for(let x=0;x<1000;x++)for(let k=0;k<3;k++){const d=Math.abs(arrays[index][(y*1280+x+1)*4+k]-arrays[index+1][(y*1280+x)*4+k]);sum+=d;max=Math.max(max,d);count++;}return{mean:sum/count,max};});
    },snapshots);
    console.log('GPU_WRAP',JSON.stringify(wrap));for(const w of wrap)assert.ok(w.mean<.1,'one pixel of camera movement must equal one pixel of terrain movement across wrap');
    await page.evaluate(()=>{const {scene:s,game:g}=window.__gokuRun;g.track.distance=0;g.track.segments=[{start:-512,end:384},{start:512,end:1920}];g.player.runTime=9;s.renderWorld();});
    await page.screenshot({path:path.join(out,'new-ground-and-run.png')});
    console.log('PASS: new atlas, real cliff silhouettes, joined caps, synchronous pixel snap, GPU wrap and zero steady-state texture uploads. Evidence: '+out);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
