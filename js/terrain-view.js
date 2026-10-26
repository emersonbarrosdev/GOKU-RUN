// Actual three-piece platforms. All three pieces use ONE snapped world offset.
// No full-screen terrain mask, mirrored wrap, shaded strips or floating walls.
export class TerrainView {
  constructor(scene,parent,spec,ground){
    this.scene=scene;this.parent=parent;this.spec=spec;this.y=ground-3;this.parts=[];
  }
  allocate(){
    const s=this.scene,H=this.spec.terrainHeight;
    const part={left:s.add.image(0,this.y,'terrain-cap-left-0').setOrigin(0),
      middle:s.add.tileSprite(0,this.y,1,H,'terrain-0').setOrigin(0),
      right:s.add.image(0,this.y,'terrain-cap-right-0').setOrigin(0)};
    this.parent.add([part.left,part.middle,part.right]);this.parts.push(part);return part;
  }
  render(segments,distance,phase){
    const camera=Math.floor(distance),cap=this.spec.capWidth;
    let used=0;
    for(const segment of segments){
      const left=Math.round(segment.start)-camera,right=Math.round(segment.end)-camera;
      if(right<=0||left>=1280)continue;
      const p=this.parts[used]||this.allocate();used++;
      const width=Math.min(cap,(right-left)/2),middleWidth=Math.max(0,right-left-width*2);
      const set=(view,key,x)=>{if(view.texture?.key!==key&&view.displayTexture?.key!==key)view.setTexture(key);view.setPosition(x,this.y).setVisible(true);};
      set(p.left,'terrain-cap-left-'+phase,left);p.left.setDisplaySize(width,this.spec.terrainHeight);
      set(p.middle,'terrain-'+phase,left+width);p.middle.setSize(Math.max(1,middleWidth),this.spec.terrainHeight).setVisible(middleWidth>0);
      p.middle.tilePositionX=0;
      set(p.right,'terrain-cap-right-'+phase,right-width);p.right.setDisplaySize(width,this.spec.terrainHeight);
      p.start=left;p.end=right;
    }
    for(let i=used;i<this.parts.length;i++)for(const key of ['left','middle','right'])this.parts[i][key].setVisible(false);
  }
}
