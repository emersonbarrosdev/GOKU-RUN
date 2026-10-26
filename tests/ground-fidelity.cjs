const {spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');

const file='assets/game/ground/ground-tile.png';
const result=spawnSync('ffmpeg',['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgba','pipe:1'],{
  maxBuffer:8*1024*1024,windowsHide:true,
});
assert.equal(result.status,0,result.stderr.toString());
const width=1024,height=256,pixels=result.stdout;
assert.equal(pixels.length,width*height*4);
let opaque=0,differentRows=0;
for(let y=0;y<height;y++){
  const left=(y*width)*4,right=(y*width+width-1)*4;
  assert.deepEqual([...pixels.subarray(left,left+4)],[...pixels.subarray(right,right+4)],`horizontal seam at row ${y}`);
  if(y&&pixels[(y*width+100)*4]!==pixels[((y-1)*width+100)*4])differentRows++;
}
for(let i=3;i<pixels.length;i+=4)if(pixels[i]===255)opaque++;
assert.equal(opaque,width*height,'ground must be fully opaque');
assert.ok(differentRows>150,'ground needs real vertical texture detail');
console.log('PASS: one 1024x256 ground tile, exact matching horizontal edges, opaque texture.');
