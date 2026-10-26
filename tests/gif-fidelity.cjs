const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

const APPROVED={
  source:{path:'assets/game/player/goku-running-source.gif',blob:'a45836b56d693436b22b150f35d5c17b45281e3d',width:228,height:201},
  atlas:{path:'assets/game/player/goku-run.png',blob:'90dfb9f54ba8c7de7c14d32b9e639151246d8cde',width:1280,height:512},
};

function gitBlobSha(buffer){
  const header=Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

function gifSize(buffer){
  assert.ok(buffer.subarray(0,6).toString('ascii').startsWith('GIF8'),'approved source must remain a GIF');
  return [buffer.readUInt16LE(6),buffer.readUInt16LE(8)];
}

function pngSize(buffer){
  assert.deepEqual([...buffer.subarray(0,8)],[137,80,78,71,13,10,26,10],'approved atlas must remain a PNG');
  return [buffer.readUInt32BE(16),buffer.readUInt32BE(20)];
}

(async()=>{
  const {PLAYER_ART:a}=await import(pathToFileURL(path.resolve('js/native-player.mjs')));
  const original=fs.readFileSync(APPROVED.source.path);
  const atlas=fs.readFileSync(APPROVED.atlas.path);

  // This project intentionally keeps the user-approved Goku GIF untouched.
  // Exact Git blob hashes are stronger and more deterministic for CI than
  // decoding pixels through a runner-specific ffmpeg installation.
  assert.equal(gitBlobSha(original),APPROVED.source.blob,'approved source GIF changed unexpectedly');
  assert.equal(gitBlobSha(atlas),APPROVED.atlas.blob,'approved derived spritesheet changed unexpectedly');
  assert.deepEqual(gifSize(original),[APPROVED.source.width,APPROVED.source.height]);
  assert.deepEqual(pngSize(atlas),[APPROVED.atlas.width,APPROVED.atlas.height]);

  assert.deepEqual(a.durations,[30,30,30,40,40,30,30,30,40,40]);
  assert.equal(a.durations.reduce((x,y)=>x+y),340);
  assert.equal(a.count,10);
  assert.equal(a.frameWidth,256);
  assert.equal(a.frameHeight,256);
  assert.equal(a.key,'goku-native');

  console.log('PASS: approved Goku GIF and derived spritesheet are byte-for-byte unchanged; 10-frame 340ms timing config preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
