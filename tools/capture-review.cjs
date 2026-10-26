const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
  const out=path.resolve(__dirname,'../docs/qa');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1100,height:850}});
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'tools/review-animation.html');
    await page.waitForFunction(()=>window.review?.ready);
    await page.evaluate(()=>window.review.pause());
    const ff=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'run-ground-before-after.mp4')],{windowsHide:true,stdio:['pipe','ignore','pipe']});
    let errors='';ff.stderr.on('data',s=>errors+=s);const exited=once(ff,'exit');
    for(let i=0;i<240;i++){
      const png=await page.evaluate(i=>{
        const slow=i>=120;window.review.draw(slow?2+(i-120)/240:i/60);
        const c=document.querySelector('canvas'),ctx=c.getContext('2d');
        ctx.fillStyle='#f4deb3';ctx.font='bold 16px system-ui';ctx.fillText(slow?'CÂMERA LENTA · ¼':'VELOCIDADE NORMAL',390,590);
        return c.toDataURL().split(',')[1];
      },i);
      if(!ff.stdin.write(Buffer.from(png,'base64')))await once(ff.stdin,'drain');
    }
    ff.stdin.end();const [code]=await exited;if(code!==0)throw new Error('FFmpeg failed: '+errors);
    // Real game capture, not the comparison renderer.
    await page.setViewportSize({width:1280,height:720});
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173/')+'?debug=1');
    await page.getByRole('button',{name:'JOGAR',exact:true}).click();
    await page.evaluate(async()=>{
      const {game:g,scene:s}=window.__gokuRun;g.state='paused';s.lastState='paused';g.enemies=[];g.friends=[];g.orbs=[];
      g.phaseBanner=0;g.track.distance=0;g.track.segments=[{start:-512,end:384},{start:512,end:1920}];g.player.runTime=9;
      document.querySelector('#panel').hidden=true;s.renderWorld();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    });
    await page.screenshot({path:path.join(out,'gameplay-ground-v20.png')});
    console.log('Review video and real-game screenshot: '+out);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
