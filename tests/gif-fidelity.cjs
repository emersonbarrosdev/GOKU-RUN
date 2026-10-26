const {spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
function rgba(file){
  const r=spawnSync('ffmpeg',['-v','error','-i',file,'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:32*1024*1024,windowsHide:true});
  assert.equal(r.status,0,r.stderr.toString());return r.stdout;
}
(async()=>{
  const {PLAYER_ART:a}=await import(pathToFileURL(path.resolve('js/native-player.mjs')));
  const original=rgba('assets/game/player/goku-running-source.gif');
  const atlas=rgba('assets/game/player/goku-run.png');
  assert.equal(original.length,228*201*4*10);assert.equal(atlas.length,1280*512*4);
  const hashes=[],bounds=[];
  for(let f=0;f<10;f++){
    const frame=original.subarray(f*228*201*4,(f+1)*228*201*4);
    hashes.push(crypto.createHash('sha256').update(frame).digest('hex'));
    let transparent=0,solid=0,bottom=0;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const out=((Math.floor(f/5)*256+y)*1280+(f%5)*256+x)*4;
      const inside=x>=14&&x<242&&y>=40&&y<241;
      const src=((y-40)*228+x-14)*4;
      const alpha=inside?frame[src+3]:0;
      assert.equal(atlas[out+3],alpha,`alpha frame ${f} at ${x},${y}`);
      if(alpha){solid++;bottom=Math.max(bottom,y);for(let c=0;c<3;c++)assert.equal(atlas[out+c],frame[src+c],`original pixel changed at frame ${f}`);}
      else transparent++;
    }
    assert.ok(transparent>20000&&solid>5000,'real transparency and nonempty body');
    bounds.push(bottom);
  }
  assert.equal(new Set(hashes).size,10,'no copied/duplicated poses');
  assert.deepEqual(a.durations,[30,30,30,40,40,30,30,30,40,40]);
  assert.equal(a.durations.reduce((x,y)=>x+y),340);assert.equal(a.count,10);
  assert.ok(Math.max(...bounds)<=240,'feet are not below the physical baseline');
  console.log('PASS: all 10 frames preserve every visible RGBA pixel of original GIF; transparent padding only; original 340ms timing. Sole rows:',bounds);
})().catch(e=>{console.error(e);process.exitCode=1;});
