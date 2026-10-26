const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR',exact:true}).click();
    const result=await page.evaluate(()=>{
      const {scene,core}=window.__gokuRun,texture=scene.textures.get('hero'),source=texture.getSourceImage();
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}),frames=[];
      for(let frame=0;frame<core.RUN_FRAMES.length;frame++){
        const f=texture.get(frame);ctx.clearRect(0,0,160,160);ctx.drawImage(source,f.cutX,f.cutY,160,160,0,0,160,160);
        const data=ctx.getImageData(0,0,160,160).data;
        let pixels=0,minY=160,maxY=-1,headX=0,headN=0;
        const soles=[{x:0,y:0,n:0},{x:0,y:0,n:0}];
        for(let y=0;y<160;y++)for(let x=0;x<160;x++){
          const i=(y*160+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
          if(a<180)continue;pixels++;minY=Math.min(y,minY);maxY=Math.max(y,maxY);
          if(y<65&&r<70&&g<90&&b<120){headX+=x;headN++;}
          // Separate actual near/far boot pigments, not a motion JSON claim.
          if(y>=128&&y<=135&&r<70&&g>45&&b>g*1.25){
            const j=b>=155?0:b>=100&&b<145?1:-1;
            if(j>=0){soles[j].x+=x;soles[j].y+=y;soles[j].n++;}
          }
        }
        frames.push({frame,pixels,minY,maxY,headX:headX/headN,soles:soles.map(s=>({x:s.x/s.n,y:s.y/s.n,n:s.n}))});
      }
      return {frames,count:core.RUN_FRAMES.length,stride:core.RUN_STRIDE};
    });
    assert.equal(result.count,24);
    for(const f of result.frames)assert.ok(f.pixels>1000&&f.minY>15&&f.maxY<144,`uncropped solid frame ${f.frame}`);
    const slips=[];
    for(let leg=0;leg<2;leg++){
      const support=Array.from({length:6},(_,i)=>i+leg*12);
      const world=support.map(i=>{
        const sole=result.frames[i].soles[leg];assert.ok(sole.n>=8,`visible planted ${leg?'far':'near'} sole at frame ${i}`);
        return sole.x+i*result.stride/result.count;
      });
      const drift=Math.max(...world)-Math.min(...world);slips.push(drift);
      assert.ok(drift<1.5,`actual rendered boot slides ${drift}px while planted`);
    }
    const headRange=Math.max(...result.frames.map(f=>f.headX))-Math.min(...result.frames.map(f=>f.headX));
    assert.ok(headRange<2,'head registration must not jump horizontally');
    console.log('PIXEL_GAIT',JSON.stringify({frames:result.count,renderedPlantedFootDrift:slips,headRange}));
    console.log('PASS: both boot pigments track planted ground, atlas is unclipped, head does not teleport. Geometry tests cover identity, joints and arm opposition separately.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
