import './visual-spec.js';
const C=window.GokuCore;
if(!C)throw new Error('GokuCore must load before visual configuration');
const S=window.GokuVisualSpec;
S.apply(C);

C.Assets.prototype.prepareSpriteCutouts=function(){
  // The imported GIF atlas has true alpha. Only legacy enemies need cleanup.
  const image=this.images.enemies;if(!image)return;
  const surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
  const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,surface.width,surface.height);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.max(0,Math.min(255,(pixels.data[i]-232)*255/16));
  ctx.putImageData(pixels,0,0);this.images.enemies=surface;
};
