/* Authoring source, not a runtime rig. All poses are baked together into ONE PNG.
 * Fixed-length limbs + a planted-foot trajectory give us measurable animation.
 */
(function (root) {
  const TAU = Math.PI * 2;
  const SPEC = { count: 24, columns: 6, cell: 256, scale: .5, pivot: [128, 232],
    stride: 180, stance: .28, thigh: 44, shin: 44, terrainWidth: 256, terrainHeight: 164, cap: 64 };
  const mod = t => ((t % 1) + 1) % 1;
  const n = x => Number(x.toFixed(3));
  const pt = p => `${n(p[0])} ${n(p[1])}`;
  const path = (d, fill, stroke = '#172131', width = 2) =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const line = (d, color, width = 1.4) => path(d, 'none', color, width);
  const ellipse = (x, y, rx, ry, fill) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
  // Hermite keys: phase, x offset, ankle height, dx/dphase, dy/dphase.
  // The derivative at both contact boundaries equals -stride/scale.
  const keys = [[.28,-50.4,218,-360,0],[.40,-64,187,100,-190],
    [.57,-20,181,340,20],[.76,42,190,180,130],[.90,57,206,-30,150],[1,50.4,218,-360,0]];
  function foot(t) {
    t = mod(t);
    if (t <= SPEC.stance) return [50.4 - 360*t, 218];
    let i = 0; while (keys[i+1][0] < t) i++;
    const a=keys[i],b=keys[i+1],d=b[0]-a[0],u=(t-a[0])/d;
    const h=[2*u**3-3*u*u+1,u**3-2*u*u+u,-2*u**3+3*u*u,u**3-u*u];
    return [1,2].map(k=>h[0]*a[k]+h[1]*d*a[k+2]+h[2]*b[k]+h[3]*d*b[k+2]);
  }
  function knee(hip, ankle) {
    const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],distance=Math.hypot(dx,dy);
    if(distance>SPEC.thigh+SPEC.shin) throw Error('Unreachable foot target: '+distance);
    const a=(SPEC.thigh**2-SPEC.shin**2+distance**2)/(2*distance);
    const h=Math.sqrt(Math.max(0,SPEC.thigh**2-a*a));
    return [hip[0]+dx*a/distance+dy*h/distance,hip[1]+dy*a/distance-dx*h/distance];
  }
  function pose(phase) {
    const t=mod(phase), bounce=4.5*Math.sin(TAU*2*t-.35), hip=[128,154+bounce];
    const legs=[t,mod(t+.5)].map((p,i)=>{
      const f=foot(p), ankle=[128+f[0],f[1]];
      const rotation=p<=SPEC.stance?0:-.75*Math.sin(Math.PI*(p-SPEC.stance)/(1-SPEC.stance));
      return { id:i===0?'near':'far',phase:p,stance:p<=SPEC.stance,hip:[...hip],knee:knee(hip,ankle),ankle,rotation };
    });
    const arms=[t,mod(t+.5)].map(p=>{
      const a=.85*Math.cos(TAU*(p+.14)),shoulder=[145,99+bounce];
      const elbow=[shoulder[0]-Math.sin(a)*29,shoulder[1]+Math.cos(a)*29];
      const forearm=-1.9-1.18*a;
      const wrist=[elbow[0]+Math.cos(forearm)*27,elbow[1]+Math.sin(forearm)*27];
      return { shoulder,elbow,wrist };
    });
    return { phase:t,bounce,hip,legs,arms,head:[157,66+bounce*.8] };
  }
  function limb(a,b,r1,r2,fill,shade,fold=true) {
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const deg=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI-90;
    return `<g transform="translate(${pt(a)}) rotate(${n(deg)})">`+
      path(`M ${-r1} 0 Q ${-r1-4} ${n(len*.4)} ${-r2} ${n(len)} Q 0 ${n(len+4)} ${r2} ${n(len)} Q ${r1+3} ${n(len*.4)} ${r1} 0 Q 0 -7 ${-r1} 0 Z`,fill)+
      path(`M 3 1 Q ${r1+2} ${n(len*.35)} ${r2} ${n(len)} L 0 ${n(len-2)} Q 4 ${n(len*.5)} 3 1 Z`,shade,'none')+
      (fold?line(`M ${-r1+2} ${n(len*.4)} L 2 ${n(len*.6)} L ${-r2+1} ${n(len*.58)}`,shade,2):'')+'</g>';
  }
  function boot(leg,far) {
    const a=leg.ankle;
    return `<g transform="translate(${pt(a)}) rotate(${n(leg.rotation*180/Math.PI)})">`+
      path('M -9 -19 L 8 -19 L 8 1 Q 12 5 22 8 Q 27 9 25 13 L -10 13 Q -13 9 -10 3 Z',far?'#17437e':'#1764b4')+
      path('M -10 10 L 25 10 L 25 14 L -11 14 Z',far?'#b93536':'#ee5340','#172131',1.5)+
      path('M -8 -18 L -2 -18 L -2 5 L -9 7 Z',far?'#24558a':'#3385cf','none')+
      line('M -9 -13 L 8 -13 M -9 -10 L 8 -10',far?'#b99143':'#f4cd69',1.5)+
      line('M -2 -11 L 4 -3 M 0 -9 L -5 -1','#f4cd69',1)+'</g>';
  }
  function legArt(leg,far) {
    const orange=far?'#b9541b':'#f58724',shade=far?'#833c22':'#cc541b';
    const [h,k,a]=[leg.hip,leg.knee,leg.ankle];
    const normal=(p,q,r)=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);return [(q[1]-p[1])*r/d,-(q[0]-p[0])*r/d];};
    const u=normal(h,k,15),v=normal(k,a,11),w=normal(k,a,8);
    const add=(p,v,s=1)=>[p[0]+v[0]*s,p[1]+v[1]*s];
    // One continuous trouser silhouette. No circular joint or segment seam.
    return path(`M ${pt(add(h,u))} Q ${pt(add(k,u))} ${pt(add(k,v))} Q ${pt(add(a,v))} ${pt(add(a,w))} Q ${pt(a)} ${pt(add(a,w,-1))} Q ${pt(add(a,v,-1))} ${pt(add(k,v,-1))} Q ${pt(add(k,u,-1))} ${pt(add(h,u,-1))} Q ${pt(h)} ${pt(add(h,u))} Z`,orange)+
      path(`M ${pt(add(h,u))} Q ${pt(add(k,u))} ${pt(add(k,v))} L ${pt(add(a,w))} L ${pt(a)} Q ${pt(k)} ${pt(add(k,u,.45))} Z`,shade,'none')+
      line(`M ${pt(add(k,u,-.6))} Q ${pt(k)} ${pt(add(k,v,.6))}`,shade,2)+boot(leg,far);
  }
  function armArt(arm,far) {
    const skin=far?'#d18a59':'#ffd099',shade=far?'#a76142':'#e99a60';
    const w=arm.wrist;
    return limb(arm.shoulder,arm.elbow,10,7,skin,shade,false)+
      limb(arm.elbow,w,7,6,skin,shade,false)+
      ellipse(arm.elbow[0],arm.elbow[1],6.6,6.6,skin)+
      `<g transform="translate(${pt(w)})">`+
      path('M -7 1 L 6 1 L 6 -7 L -7 -7 Z',far?'#163d78':'#185ba9')+
      path('M -5 -7 L -7 -14 Q -6 -19 -1 -20 L 7 -18 L 9 -13 L 6 -8 Z',skin)+
      line('M -1 -18 L 0 -13 M 3 -17 L 4 -13',shade,1)+'</g>';
  }
  function headArt(p) {
    const [x,y]=p.head;
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(-5)">`+
      path('M -8 12 L -11 28 L 7 31 L 12 16 Z','#f2b17c')+
      path('M -13 -15 Q -2 -23 11 -16 L 17 -5 L 16 0 L 25 6 L 17 9 L 18 17 L 10 25 L -2 23 L -13 12 L -17 -1 Z','#ffd29d')+
      path('M -12 3 L -1 14 L 11 18 L 17 13 L 17 18 L 10 24 L -2 22 L -12 12 Z','#e99e69','none')+
      path('M -13 -4 Q -22 -10 -20 2 Q -18 11 -11 9 L -9 3 Z','#ffc28c')+
      line('M -16 -2 Q -20 2 -14 5','#a75c42',1.2)+
      path('M 5 -4 L 17 -3 L 11 4 L 5 3 Z','#fff8e9','#172131',1)+
      line('M 13 -2 L 13 2','#172131',2.5)+line('M 4 -7 L 17 -5','#172131',2.4)+
      line('M 11 15 L 17 14','#8d4e39',1.4)+
      path('M -16 5 L -24 -6 L -37 -5 L -28 -16 L -42 -21 L -24 -24 L -34 -37 L -13 -32 L -13 -49 L 0 -38 L 12 -54 L 15 -35 L 33 -43 L 26 -24 L 40 -26 L 29 -14 L 33 -8 L 19 -10 L 13 -20 L 5 -9 L 0 -15 L -7 2 L -9 -10 Z','#111a28')+
      path('M -29 -22 L -13 -20 L -25 -29 L -7 -25 L -10 -38 L 0 -29 L 11 -43 L 8 -24 L 25 -31 L 16 -19 L 4 -23 L -8 -14 Z','#2c3547','none')+
      line('M -19 -12 L -10 -15 M 15 -29 L 8 -20','#465069',1.2)+'</g>';
  }
  function figure(p) {
    const b=p.bounce,flutter=Math.sin(TAU*p.phase-1)*4;
    let s=armArt(p.arms[1],true)+legArt(p.legs[1],true);
    s+=`<g transform="translate(0 ${n(b)})">`+
      path(`M 121 145 Q 97 ${139+flutter} 74 ${151+flutter} L 85 ${154+flutter} L 73 ${165+flutter} Q 99 ${156+flutter} 126 155 Z`,'#1858a1')+
      path(`M 122 149 Q 103 ${162-flutter} 88 ${169-flutter} L 104 ${169-flutter} L 98 ${178-flutter} Q 122 166 135 154 Z`,'#287bc1')+'</g>';
    s+=legArt(p.legs[0],false);
    s+=`<g transform="translate(0 ${n(b)})">`+
      path('M 126 94 Q 139 87 153 94 L 162 113 L 148 151 Q 135 161 115 151 L 119 124 Z','#ef7821')+
      path('M 124 99 L 133 102 L 129 126 L 120 146 L 116 149 L 120 123 Z','#b94a1c','none')+
      path('M 140 91 L 151 91 L 159 111 L 149 122 L 137 101 Z','#163f78')+
      path('M 136 93 L 147 92 L 153 111 L 149 117 Z','#f6b77f','#172131',1.5)+
      path('M 150 97 L 157 110 L 140 141 L 130 149 L 137 123 Z','#ff9c31','none')+
      line('M 125 118 L 130 135 L 122 144 M 146 130 L 137 145','#b94a1c',1.7)+
      path('M 115 146 Q 131 153 149 146 L 149 156 Q 128 163 113 154 Z','#174d91')+
      line('M 117 151 Q 130 156 145 151','#4286cb',2)+
      path('M 142 150 L 150 149 L 151 157 L 142 158 Z','#296bb2')+'</g>';
    s+=armArt(p.arms[0],false);
    s+=`<g transform="translate(${pt(p.arms[0].shoulder)})">`+
      path('M -10 -7 Q 0 -13 10 -7 L 13 4 L 5 10 L -9 7 Z','#174d91')+
      path('M -9 -7 Q -2 -10 1 -7 L -3 6 L -9 6 Z','#327ac0','none')+'</g>';
    s+=headArt(p);
    return s;
  }
  function jumpPose(index) {
    const p=pose([.10,.43,.90,.08][index]);
    // Same character and proportions for takeoff / tuck / fall / impact.
    if(index===1) {
      for(const [i,leg] of p.legs.entries()) {
        leg.ankle=[128+(i===0?30:-26),185+i*10];leg.knee=knee(leg.hip,leg.ankle);leg.stance=false;
      }
    }
    return p;
  }
  function atlasSvg() {
    let body='';const poses=[];
    for(let i=0;i<SPEC.count+4;i++) {
      const p=i<SPEC.count?pose(i/SPEC.count):jumpPose(i-SPEC.count);
      poses.push(p);body+=`<g transform="translate(${i%6*256} ${Math.floor(i/6)*256})">${figure(p)}</g>`;
    }
    return { svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1280" viewBox="0 0 1536 1280">${body}</svg>`,poses,spec:SPEC };
  }
  const api={SPEC,pose,foot,knee,figure,atlasSvg};
  if(typeof module!=='undefined')module.exports=api; else root.RunnerArt=api;
})(typeof window==='undefined'?globalThis:window);
