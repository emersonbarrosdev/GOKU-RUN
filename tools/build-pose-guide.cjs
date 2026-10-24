// Pose-blocking reference only. This is not a runtime cut-out/limb rig.
// Contact -> compression -> passing -> flight, then the opposite foot.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require('playwright-core');
const poses=[
  {hip:205,near:[[190,250],[216,307]],far:[[115,238],[82,278]],arm:0},
  {hip:215,near:[[183,260],[153,311]],far:[[119,235],[92,211]],arm:.25},
  {hip:203,near:[[138,253],[105,295]],far:[[203,228],[175,254]],arm:.65},
  {hip:192,near:[[117,223],[80,214]],far:[[184,232],[216,280]],arm:.9},
  {hip:205,far:[[190,250],[216,307]],near:[[115,238],[82,278]],arm:1},
  {hip:215,far:[[183,260],[153,311]],near:[[119,235],[92,211]],arm:.75},
  {hip:203,far:[[138,253],[105,295]],near:[[203,228],[175,254]],arm:.35},
  {hip:192,far:[[117,223],[80,214]],near:[[184,232],[216,280]],arm:.1},
  {hip:230,near:[[203,259],[172,311]],far:[[146,260],[125,311]],arm:.7},
  {hip:196,near:[[207,221],[169,252]],far:[[143,248],[120,291]],arm:.9},
  {hip:193,near:[[207,219],[168,250]],far:[[193,231],[148,257]],arm:.85},
  {hip:230,near:[[203,259],[172,311]],far:[[146,260],[125,311]],arm:.6}
];
const limb=(pts,color,width)=>`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#14202a" stroke-width="${width+5}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
function figure(p){
  const h=p.hip,shift=h-205;
  const arm=(phase,far)=>{
    const e=[130+phase*72,156+shift],hand=[117+phase*118,116+shift];
    return limb([[177,125+shift],e,hand],far?'#c68050':'#ffc08b',17)+limb([[hand[0]-4,hand[1]+5],hand],'#2259a6',19)+`<circle cx="${hand[0]+3}" cy="${hand[1]-5}" r="10" fill="${far?'#c68050':'#ffc08b'}" stroke="#14202a" stroke-width="2"/>`;
  };
  const leg=(points,far)=>{
    const ankle=points[1],toe=[ankle[0]+17,ankle[1]+3];
    return limb([[160,h],...points],far?'#c35316':'#fa8b24',26)+limb([[ankle[0],ankle[1]-15],ankle,toe],far?'#123457':'#2259a6',18);
  };
  return arm(1-p.arm,true)+leg(p.far,true)+`<path d="M 167 ${111+shift} Q 191 ${109+shift} 204 ${130+shift} L 180 ${h-13} Q 167 ${h+6} 142 ${h-2} L 150 ${151+shift} Z" fill="#f58824" stroke="#14202a" stroke-width="3"/><path d="M 187 ${114+shift} L 200 ${128+shift} L 184 ${151+shift} L 177 ${139+shift} Z" fill="#215395"/>`+leg(p.near,false)+`<path d="M 143 ${h-7} L 178 ${h-5}" stroke="#1d4c92" stroke-width="10"/>`+
    `<g transform="translate(0 ${shift})"><path d="M 187 111 L 193 94 L 211 94 L 210 116" fill="#ffc08b" stroke="#14202a" stroke-width="2"/><path d="M 179 63 Q 192 45 216 58 L 225 79 L 234 87 L 226 91 L 224 105 L 208 113 L 188 97 Z" fill="#ffc08b" stroke="#14202a" stroke-width="3"/><path d="M 180 92 L 166 83 L 149 86 L 171 68 L 148 61 L 177 58 L 165 39 L 190 47 L 192 26 L 205 44 L 225 29 L 221 52 L 240 49 L 228 66 L 222 82 L 214 68 L 201 83 L 198 70 L 187 91 Z" fill="#131a21" stroke="#0b1117" stroke-width="2"/><path d="M 216 80 L 225 78 M 222 96 L 228 95" fill="none" stroke="#14202a" stroke-width="3"/></g>`+arm(p.arm,false);
}
(async()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'goku-pose-guide-'));
  const labels=['CONTACT A','DOWN A','PASSING A','FLIGHT A','CONTACT B','DOWN B','PASSING B','FLIGHT B','TAKEOFF','RISE','APEX / FALL','LAND'];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1020" viewBox="0 0 1536 1020"><rect width="1536" height="1020" fill="white"/>${poses.map((p,i)=>`<g transform="translate(${i%4*384+20} ${Math.floor(i/4)*340})"><text x="15" y="18" font-size="13" font-family="Arial">${i+1} ${labels[i]}</text><path d="M 0 320 H 340" stroke="#ddd"/>${figure(p)}</g>`).join('')}</svg>`;
  fs.writeFileSync(path.join(out,'guide.svg'),svg);
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{const page=await browser.newPage({viewport:{width:1536,height:1020}});await page.setContent('<body style="margin:0">'+svg);await page.screenshot({path:path.join(out,'guide.png')});}finally{await browser.close();}
  console.log(out);
})();
