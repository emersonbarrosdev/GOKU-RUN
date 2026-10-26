(function(root){
  const spec={runCount:10,cell:256,columns:5,scale:.65,pivot:[128,240],terrainWidth:840,terrainHeight:164,capWidth:64};
  spec.apply=function(C){
    Object.assign(C.PATHS,{run:'./assets/game/player/goku-run.png',jump:'./assets/game/player/goku-run.png',terrain:'./assets/spritesheets/terrain_ground_v4.png'});
    const bounds=i=>[(i%spec.columns)*spec.cell,Math.floor(i/spec.columns)*spec.cell,spec.cell,spec.cell];
    const pivot=i=>{const [x,y]=bounds(i);return[x+spec.pivot[0],y+spec.pivot[1]];};
    C.RUN_FRAMES.splice(0,C.RUN_FRAMES.length,...Array.from({length:spec.runCount},(_,i)=>bounds(i)));
    C.RUN_PIVOTS.splice(0,C.RUN_PIVOTS.length,...Array.from({length:spec.runCount},(_,i)=>pivot(i)));
    C.JUMP_FRAMES.splice(0,C.JUMP_FRAMES.length,...[3,3,8,0].map(bounds));
    C.JUMP_PIVOTS.splice(0,C.JUMP_PIVOTS.length,...[3,3,8,0].map(pivot));
    C.PLAYER_SCALE.run=C.PLAYER_SCALE.jump=spec.scale;
    C.VISUAL=spec;
    return C;
  };
  // Vite can wrap this shared file as CommonJS. Browser publication must not
  // depend on the absence of that bundler-provided module object.
  if(typeof module!=='undefined')module.exports=spec;
  root.GokuVisualSpec=spec;
})(typeof window==='undefined'?globalThis:window);
