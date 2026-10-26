// Decode the complete GIF (including disposal/transparency), then pack unchanged
// frames into one native Phaser sheet. No pose generation or per-frame resizing.
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const input=path.join(root,'assets/game/player/goku-running-source.gif');
const output=path.join(root,'assets/game/player/goku-run.png');
const probe=spawnSync('ffprobe',['-v','error','-show_frames','-show_entries','frame=duration_time:stream=width,height,nb_frames','-of','json',input],{encoding:'utf8',windowsHide:true});
if(probe.status)throw new Error(probe.stderr);
const info=JSON.parse(probe.stdout);
assert.equal(info.streams[0].width,228);assert.equal(info.streams[0].height,201);
assert.equal(info.frames.length,10);
assert.deepEqual(info.frames.map(f=>Math.round(Number(f.duration_time)*1000)),[30,30,30,40,40,30,30,30,40,40]);
const result=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',input,'-vf','format=rgba,pad=256:256:14:40:color=black@0,tile=5x2','-frames:v','1',output],{encoding:'utf8',windowsHide:true});
if(result.status)throw new Error(result.stderr);
assert.ok(fs.statSync(output).size>0);
console.log('Imported 10 original frames, 1280x512 RGBA, 340ms loop; fixed padding only.');
