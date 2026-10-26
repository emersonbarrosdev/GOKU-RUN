const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');

const APPROVED={
  path:'assets/game/ground/ground-tile.png',
  blob:'61f205cba14534b6863106cc572255deb74a091b',
  width:1024,
  height:256,
};

function gitBlobSha(buffer){
  const header=Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

const png=fs.readFileSync(APPROVED.path);
assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],'ground must remain a PNG');
assert.equal(png.readUInt32BE(16),APPROVED.width);
assert.equal(png.readUInt32BE(20),APPROVED.height);
assert.equal(gitBlobSha(png),APPROVED.blob,'approved seamless ground tile changed unexpectedly');

// Exact pixel seam behavior is covered in the browser continuity/flick gate.
// Keeping this check byte-for-byte deterministic avoids relying on an ffmpeg
// binary that is not guaranteed by the GitHub hosted runner image.
console.log('PASS: approved 1024x256 seamless ground tile is byte-for-byte unchanged; browser gate validates continuity and flicker.');
