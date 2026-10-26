// Original, deterministic game art. One left/middle/right atlas, not slices of
// a tall illustration. Features are wrapped in X before rasterization.
function drawTerrainAtlas() {
  const W=256,H=164,CAP=64;
  const tile=document.createElement('canvas');tile.width=W;tile.height=H;
  const c=tile.getContext('2d');
  let state=49815;
  const rand=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  const polygon=(points,fill,stroke,width=1)=>{
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  };
  const base=c.createLinearGradient(0,0,0,H);
  base.addColorStop(0,'#a96937');base.addColorStop(.45,'#75482e');base.addColorStop(1,'#382e2c');
  c.fillStyle=base;c.fillRect(0,3,W,H-3);
  const rocks=['#bd8150','#a36b41','#8c593a','#cf9460','#75503a'];
  // Periodic geometry: draw translated copies for every feature crossing a side.
  for(let i=0;i<105;i++) {
    const x=rand()*W,y=23+rand()*(H-18),r=2+rand()*9;
    const pts=Array.from({length:6},(_,j)=>{
      const a=j*Math.PI/3,rr=r*(.72+rand()*.35);return [Math.cos(a)*rr,Math.sin(a)*rr*.65];
    });
    const color=rocks[Math.floor(rand()*rocks.length)];
    for(const dx of [-W,0,W]) {
      const p=pts.map(([a,b])=>[x+dx+a,y+b]);
      polygon(p,color,'#553a2d',1.2);
      c.beginPath();c.moveTo(...p[3]);c.lineTo(...p[4]);c.lineTo(...p[5]);
      c.strokeStyle='#dbab72';c.globalAlpha=.5;c.stroke();c.globalAlpha=1;
    }
  }
  // Roots are anchored below the turf and bend naturally into soil.
  for(let i=0;i<5;i++) {
    const x=20+i*55,y=60+rand()*40,dx=-10+rand()*20;
    for(const offset of [-W,0,W]) {
      c.beginPath();c.moveTo(x+offset,15);c.bezierCurveTo(x+offset+dx,30,x+offset-dx,45,x+offset+dx,y);
      c.strokeStyle='#513327';c.lineWidth=4;c.stroke();c.strokeStyle='#b98954';c.lineWidth=2;c.stroke();
      c.beginPath();c.moveTo(x+offset,39);c.lineTo(x+offset-10,50);c.lineTo(x+offset-13,62);c.lineWidth=1;c.stroke();
    }
  }
  c.fillStyle='#284a29';c.fillRect(0,3,W,12);
  for(let i=0;i<64;i++) {
    const x=i*4,h=8+rand()*11;
    for(const dx of [-W,0,W]) polygon([[x+dx-6,7],[x+dx+7,7],[x+dx+3,h],[x+dx,14],[x+dx-4,h+2]],i%2?'#397e36':'#458b3e');
  }
  c.fillStyle='#61ac48';c.fillRect(0,3,W,4);
  for(let i=0;i<85;i++) {
    const x=rand()*W,h=2+rand()*4;
    for(const dx of [-W,0,W]) polygon([[x+dx-3,7],[x+dx-2,3-h],[x+dx,4],[x+dx+4,1],[x+dx+2,8]],i%3?'#83c658':'#b5db72');
  }
  // Caps include actual transparent cliff profiles and exposed soil, not a
  // 40px recolored strip over the same old texture.
  const atlas=document.createElement('canvas');atlas.width=CAP*2+W;atlas.height=H;
  const ac=atlas.getContext('2d');ac.drawImage(tile,CAP,0);
  for(const side of ['left','right']) {
    const cap=document.createElement('canvas');cap.width=CAP;cap.height=H;
    const cc=cap.getContext('2d');
    if(side==='right'){cc.translate(CAP,0);cc.scale(-1,1);}
    cc.beginPath();cc.moveTo(CAP,0);cc.lineTo(3,0);cc.lineTo(0,14);cc.lineTo(3,35);
    cc.lineTo(1,65);cc.lineTo(6,92);cc.lineTo(2,122);cc.lineTo(5,H);cc.lineTo(CAP,H);cc.closePath();cc.clip();
    // Caps join the corresponding edge of the periodic center.
    if(side==='left')cc.drawImage(tile,W-CAP,0,CAP,H,0,0,CAP,H);
    else {cc.save();cc.translate(CAP,0);cc.scale(-1,1);cc.drawImage(tile,0,0,CAP,H,0,0,CAP,H);cc.restore();}
    const wall=cc.createLinearGradient(0,0,28,0);wall.addColorStop(0,'rgba(20,24,25,.8)');wall.addColorStop(1,'rgba(20,24,25,0)');
    cc.fillStyle=wall;cc.fillRect(0,13,28,H);
    cc.strokeStyle='#413025';cc.lineWidth=2;cc.beginPath();cc.moveTo(4,19);cc.lineTo(9,43);cc.lineTo(7,76);cc.lineTo(13,99);cc.lineTo(9,145);cc.stroke();
    ac.drawImage(cap,side==='left'?0:CAP+W,0);
  }
  return atlas;
}
module.exports=drawTerrainAtlas;
