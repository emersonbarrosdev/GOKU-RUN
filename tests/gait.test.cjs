const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {SPEC,pose}=require('../tools/runner-art.cjs');
const baked=require('../assets/spritesheets/goku_run_v12.motion.json');
const {RUN_STRIDE,RUN_FRAMES,PLAYER_SCALE}=require('../js/goku-visual-config.cjs');
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('baked atlas geometry and runtime share the same stride, count and scale',()=>{
  assert.equal(RUN_STRIDE,SPEC.stride);assert.equal(RUN_FRAMES.length,SPEC.count);assert.equal(PLAYER_SCALE.run,SPEC.scale);
  assert.equal(baked.poses.length,SPEC.count+4);
  for(let i=0;i<SPEC.count;i++)assert.deepEqual(baked.poses[i],pose(i/SPEC.count),'rebake artwork after editing motion');
  const png=fs.readFileSync('assets/spritesheets/goku_run_v12.png');
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1536,1280]);
});

test('both anatomical legs travel ahead AND behind the hip, exactly half a cycle apart',()=>{
  const poses=Array.from({length:240},(_,i)=>pose(i/240));
  for(let leg=0;leg<2;leg++){
    const x=poses.map(p=>p.legs[leg].ankle[0]-p.hip[0]);
    assert.ok(Math.min(...x)<-50&&Math.max(...x)>50);
    const stance=poses.filter(p=>p.legs[leg].stance);
    assert.ok(stance.length>40&&stance.length<90,'each foot has one short support phase');
  }
  for(let i=0;i<120;i++){
    const a=poses[i].legs[0],b=poses[i+120].legs[1];
    assert.ok(length(a.ankle,b.ankle)<1e-8,'same motion, opposite phase, persistent identity');
  }
});

test('planting a foot does not slide relative to the moving world',()=>{
  for(const speed of [335,430])for(const index of [0,1]){
    let min=Infinity,max=-Infinity;
    for(let i=0;i<100;i++){
      const local=i/100*SPEC.stance,phase=local+index*.5,p=pose(phase);
      const time=phase*SPEC.stride/speed;
      const worldFoot=speed*time+(p.legs[index].ankle[0]-128)*SPEC.scale;
      min=Math.min(min,worldFoot);max=Math.max(max,worldFoot);
      assert.ok(Math.abs(p.legs[index].ankle[1]+14-SPEC.pivot[1])<1e-8);
    }
    assert.ok(max-min<1e-8,`planted foot drift ${max-min}px`);
  }
});

test('limb lengths stay constant; joints and loop boundary have no teleport',()=>{
  for(let i=0;i<1000;i++){
    const p=pose(i/1000);
    for(const leg of p.legs){
      assert.ok(Math.abs(length(leg.hip,leg.knee)-SPEC.thigh)<1e-8);
      assert.ok(Math.abs(length(leg.knee,leg.ankle)-SPEC.shin)<1e-8);
    }
    for(const arm of p.arms){assert.ok(Math.abs(length(arm.shoulder,arm.elbow)-29)<1e-8);assert.ok(Math.abs(length(arm.elbow,arm.wrist)-27)<1e-8);}
  }
  for(let i=0;i<SPEC.count;i++){
    const a=pose(i/SPEC.count),b=pose((i+1)/SPEC.count);
    for(let leg=0;leg<2;leg++)for(const joint of ['ankle','knee']){
      assert.ok(length(a.legs[leg][joint],b.legs[leg][joint])*SPEC.scale<14,`joint jump in frame ${i}`);
    }
  }
  const a=pose(1-1e-6),b=pose(0);
  assert.ok(length(a.legs[0].ankle,b.legs[0].ankle)<.001);
});

test('run contains alternating support, real flight, and contralateral arm swing',()=>{
  let flight=0;
  const feet=[],hands=[];
  for(let i=0;i<240;i++){
    const p=pose(i/240);
    assert.ok(!(p.legs[0].stance&&p.legs[1].stance),'a run is not double-support walking');
    if(p.legs.every(l=>!l.stance))flight++;
    feet.push(p.legs[0].ankle[0]);hands.push(p.arms[0].wrist[0]);
  }
  const average=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const mx=average(feet),my=average(hands);
  const covariance=feet.reduce((s,x,i)=>s+(x-mx)*(hands[i]-my),0);
  const correlation=covariance/Math.sqrt(feet.reduce((s,x)=>s+(x-mx)**2,0)*hands.reduce((s,y)=>s+(y-my)**2,0));
  assert.ok(flight>60&&flight<140);
  assert.ok(correlation<-.6,`arm and same-side leg must oppose: ${correlation}`);
});
