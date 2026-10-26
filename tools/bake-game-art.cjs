// Reproducible authoring pipeline. Chrome rasterizes vector artwork into complete
// atlases. No detached limb/frame files and no runtime procedural character.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const art=require('./runner-art.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage();const atlas=art.atlasSvg();
    const png=await page.evaluate(async svg=>{
      const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL().split(',')[1];
    },atlas.svg);
    fs.writeFileSync(path.join(root,'assets/spritesheets/goku_run_v12.png'),Buffer.from(png,'base64'));
    fs.writeFileSync(path.join(root,'assets/spritesheets/goku_run_v12.motion.json'),JSON.stringify({spec:atlas.spec,poses:atlas.poses},null,2)+'\n');
    console.log('Baked one Goku atlas: 24 run poses + 4 jump poses, 1536x1280.');
    const terrain=require('./terrain-art.cjs');
    const ground=await page.evaluate('('+terrain.toString()+')().toDataURL().split(",")[1]');
    fs.writeFileSync(path.join(root,'assets/spritesheets/terrain_tiles_v5.png'),Buffer.from(ground,'base64'));
    console.log('Baked one terrain atlas: 64px left + 256px periodic center + 64px right.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
