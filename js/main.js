import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import './game.js';
import '../css/mobile.css';

const C=window.GokuCore,{Game,Player,Track,Assets,PATHS,SFX,GROUND}=C;
const $=id=>document.getElementById(id);
const ui={hud:$('hud'),panel:$('panel'),title:$('panel-title'),subtitle:$('panel-subtitle'),start:$('start-button'),
  score:$('score'),result:$('result-score'),phase:$('phase-label'),name:$('phase-name'),progress:$('phase-fill'),
  ki:$('ki-button'),kiFill:$('ki-fill'),kiCaption:$('ki-caption'),kiLabel:$('ki-label'),banner:$('phase-banner')};
const hearts=[...document.querySelectorAll('.lives span')],livesLabel=document.querySelector('.lives');
const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};

class RunnerScene extends Phaser.Scene {
  constructor(){super('runner');this.accumulator=0;this.views=new Map();this.lastState='';}
  preload(){
    for(const [key,url] of Object.entries(PATHS))this.load.image(key,url);
    for(const [key,file] of Object.entries(SFX))this.load.audio('sfx-'+key,'./assets/sfx/'+file+'.wav');
    this.load.audio('music',['./assets/sounds/trilha.ogg','./assets/sounds/trilha.mp3']);
    this.load.on('progress',p=>{ui.subtitle.textContent='Carregando… '+Math.round(p*100)+'%';});
    this.load.on('loaderror',file=>{ui.subtitle.textContent='Não foi possível carregar '+file.key+'. Reabra o jogo.';});
  }
  create(){
    this.art=new Assets();
    this.art.images=Object.fromEntries(Object.keys(PATHS).map(k=>[k,this.textures.get(k).getSourceImage()]));
    this.art.prepareSpriteCutouts();this.art.prepareGround();this.makeTextures();
    this.model=Object.create(Game.prototype);const g=this.model;
    g.player=new Player();g.track=new Track();g.best=0;
    try{g.best=Number(localStorage.getItem('goku-run-v5-best'))||0;}catch{}
    this.music=this.sound.add('music',{loop:true,volume:.35});
    g.audio={enabled:true,play:(key,volume=.25)=>{if(g.audio.enabled)this.sound.play('sfx-'+key,{volume});},
      startMusic:()=>{if(g.audio.enabled){this.music.stop();this.music.play();}},stopMusic:()=>this.music.stop(),
      toggle:()=>{g.audio.enabled=!g.audio.enabled;this.sound.mute=!g.audio.enabled;if(g.audio.enabled&&g.state==='playing')this.music.play();else this.music.pause();}};
    g.reset();g.state='menu';
    this.world=this.add.container(0,0);
    this.background=this.add.image(0,0,'world0').setOrigin(0);this.previous=this.add.image(0,0,'world0').setOrigin(0);
    this.world.add([this.background,this.previous]);
    // Recycle immutable images offscreen: no NPOT resampling, UV wrap, texture
    // re-upload or on-screen reset when the next strip replaces the previous one.
    this.floorMask=this.make.graphics({x:0,y:0,add:false});
    const groundMask=this.floorMask.createGeometryMask();
    this.groundStrips=Array.from({length:3},()=>this.add.image(0,GROUND-3,'terrain-0').setOrigin(0).setMask(groundMask));
    this.world.add(this.groundStrips);
    this.effects=this.add.graphics();this.world.add(this.effects);
    this.hero=this.add.sprite(235,GROUND,'hero',0).setOrigin(.5,140/160);this.world.add(this.hero);
    this.foreground=this.add.graphics();this.world.add(this.foreground);
    this.labels=Array.from({length:10},()=>this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'14px',fontStyle:'bold',stroke:'#142434',strokeThickness:3}).setOrigin(.5).setVisible(false));
    this.world.add(this.labels);
    this.menu=this.add.image(0,0,'menu').setOrigin(0).setDisplaySize(1280,720);
    this.bindInputs();
    this.game.events.on(Phaser.Core.Events.BLUR,()=>this.pauseRun());
    this.game.events.on(Phaser.Core.Events.HIDDEN,()=>this.pauseRun());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pauseRun();});
    window.addEventListener('resize',()=>{if(this.isPortrait())this.pauseRun();});
    if(Capacitor.isNativePlatform()){
      App.addListener('appStateChange',({isActive})=>{if(!isActive)this.pauseRun();});
      App.addListener('backButton',()=>{if(g.state==='playing')this.pauseRun();else if(g.state==='paused'){g.state='menu';g.audio.stopMusic();}else App.exitApp();});
    }
    const params=new URLSearchParams(location.search);
    if(params.get('debug')==='1'){g.persistResults=false;window.__gokuRun={game:g,core:C,scene:this,phaser:this.game};}
    if(params.get('autostart')==='1')this.startRun();
    this.syncUI();
  }
  isPortrait(){return matchMedia('(orientation:portrait) and (pointer:coarse)').matches;}
  makeTextures(){
    // Whole-frame atlas with a common anatomical origin; never separate limbs.
    const atlas=(key,frames)=>{
      const surface=document.createElement('canvas');surface.width=160*frames.length;surface.height=160;
      const ctx=surface.getContext('2d');
      frames.forEach((f,i)=>this.art.frame(ctx,f.key,f.bounds,f.pivot,i*160+80,140,f.scale));
      const texture=this.textures.addCanvas(key,surface);
      frames.forEach((_,i)=>texture.add(i,0,i*160,0,160,160));
    };
    atlas('hero',[...C.RUN_FRAMES.map((bounds,i)=>({key:'run',bounds,pivot:C.RUN_PIVOTS[i],scale:C.PLAYER_SCALE.run})),
      ...C.JUMP_FRAMES.map((bounds,i)=>({key:'jump',bounds,pivot:C.JUMP_PIVOTS[i],scale:C.PLAYER_SCALE.jump}))]);
    atlas('soldier',C.SOLDIER_FRAMES.map((bounds,i)=>({key:'enemies',bounds,pivot:C.SOLDIER_PIVOTS[i],scale:.23})));
    atlas('flyer',C.FLIGHT_FRAMES.map((bounds,i)=>({key:'enemies',bounds,pivot:C.FLIGHT_PIVOTS[i],scale:.23})));
    const allies=document.createElement('canvas');allies.width=12*160;allies.height=160;const ac=allies.getContext('2d');
    C.FRIEND_FRAMES.forEach((bounds,i)=>{const variant=Math.floor(i/4),h=bounds[3]/[393,474,306][variant]*[101,122,72][variant];this.art.sprite(ac,'friends',bounds,i*160+80,140,h);});
    const allyTexture=this.textures.addCanvas('allies',allies);C.FRIEND_FRAMES.forEach((_,i)=>allyTexture.add(i,0,i*160,0,160,160));
    this.art.groundTiles.forEach((tile,i)=>this.textures.addCanvas('terrain-'+i,tile));
    for(const [name,bounds] of [['crystal',[1109,627,341,372]],['boulder',[1627,690,329,308]]])this.textures.get('ground').add(name,0,...bounds);
    const orb=document.createElement('canvas');orb.width=48;orb.height=48;const oc=orb.getContext('2d');
    const glow=oc.createRadialGradient(20,18,1,24,24,23);glow.addColorStop(0,'#fffce3');glow.addColorStop(.42,'#ffdd76');glow.addColorStop(.65,'#ed982c');glow.addColorStop(1,'rgba(255,190,60,0)');oc.fillStyle=glow;oc.fillRect(0,0,48,48);this.textures.addCanvas('orb',orb);
    this.anims.create({key:'run',frames:this.anims.generateFrameNumbers('hero',{start:0,end:7}),frameRate:335/C.RUN_STRIDE*8,repeat:-1});
    this.anims.create({key:'enemy-run',frames:this.anims.generateFrameNumbers('soldier',{start:0,end:3}),frameRate:190/110*4,repeat:-1});
    this.anims.create({key:'enemy-fly',frames:this.anims.generateFrameNumbers('flyer',{start:0,end:1}),frameRate:5,repeat:-1});
    for(let i=0;i<3;i++)this.anims.create({key:'ally-'+i,frames:[0,1,2,3,2,1].map(n=>({key:'allies',frame:i*4+n})),frameRate:[5,4,6][i],repeat:-1});
  }
  bindInputs(){
    const g=this.model;
    this.input.on('pointerdown',()=>{if(g.state==='playing'&&!this.isPortrait())g.player.queueJump();});
    this.input.keyboard.on('keydown',event=>{
      if(event.repeat)return;const key=event.key.toLowerCase();
      if([' ','arrowup','w'].includes(key)){event.preventDefault();if(g.state==='playing')g.player.queueJump();else if(['menu','game-over','victory'].includes(g.state))this.startRun();else if(g.state==='paused')this.resumeRun();}
      else if(key==='k')g.activateKi();else if(key==='p')g.state==='playing'?this.pauseRun():this.resumeRun();else if(key==='m')this.toggleSound();
    });
    ui.start.addEventListener('click',()=>{if(g.state==='paused')this.resumeRun();else this.startRun();});
    $('pause-button').addEventListener('click',()=>this.pauseRun());
    ui.ki.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();g.activateKi();});
    $('sound-button').addEventListener('click',()=>this.toggleSound());
  }
  startRun(){if(this.isPortrait())return;this.sound.context?.resume();this.model.start();this.accumulator=0;this.lastState='';}
  pauseRun(){if(this.model?.state==='playing'){this.model.state='paused';this.music.pause();this.sound.pauseAll();}}
  resumeRun(){if(this.model.state!=='paused'||this.isPortrait())return;this.model.state='playing';this.sound.resumeAll();if(this.model.audio.enabled)this.music.resume();this.accumulator=0;}
  toggleSound(){this.model.audio.toggle();$('sound-button').textContent=this.model.audio.enabled?'SOM LIGADO':'SOM DESLIGADO';}
  update(time,delta){
    if(!this.model)return;const g=this.model;
    if(g.state==='playing'){
      this.accumulator+=Math.min(delta/1000,.075);
      while(this.accumulator>=1/120){g.update(1/120);this.accumulator-=1/120;}
    }else this.accumulator=0;
    this.renderWorld();this.syncUI();
  }
  renderWorld(){
    const g=this.model,p=g.player,playing=g.state==='playing';
    this.menu.setVisible(g.state==='menu');this.world.setVisible(g.state!=='menu');
    if(g.state==='menu')return;
    const placeBackground=(image,index,progress)=>{const size=C.PANELS[index],w=size[2]*720/size[3];if(image.texture.key!=='world'+index)image.setTexture('world'+index);image.setDisplaySize(w,720).setPosition(-(w-1280)*progress,0);};
    placeBackground(this.background,g.phaseIndex,Math.min(1,g.phaseTime/30));
    this.previous.setVisible(g.phaseFade>0);if(g.phaseFade>0){placeBackground(this.previous,g.previousPhase,1);this.previous.setAlpha(g.phaseFade);}
    const groundOffset=g.track.distance%840;
    this.groundStrips.forEach((strip,i)=>{
      if(strip.texture.key!=='terrain-'+g.phaseIndex)strip.setTexture('terrain-'+g.phaseIndex);
      strip.setPosition(i*840-groundOffset,GROUND-3);
    });
    this.floorMask.clear().fillStyle(0xffffff);for(const s of g.track.segments)this.floorMask.fillRect(s.start-g.track.distance,GROUND-3,s.end-s.start,164);
    this.effects.clear();this.foreground.clear();
    for(let i=0;i<g.track.segments.length-1;i++){
      const left=g.track.segments[i].end-g.track.distance,right=g.track.segments[i+1].start-g.track.distance;if(right<0||left>1280)continue;
      this.effects.fillStyle(g.phaseIndex===4?0xc9673e:0x729ca8,.3).fillRect(left,GROUND,right-left,160);
      for(const [edge,dir] of [[left,1],[right,-1]]){
        this.effects.fillStyle([0x536b70,0x4c6652,0x966648,0x454e61,0x673a38][g.phaseIndex],1);
        this.effects.fillPoints([{x:edge,y:GROUND},{x:edge+dir*10,y:GROUND+20},{x:edge+dir*7,y:GROUND+50},{x:edge+dir*21,y:GROUND+95},{x:edge+dir*15,y:720},{x:edge,y:720}],true);
        this.effects.lineStyle(2,0x172a36,.45);for(let y=GROUND+25;y<720;y+=30)this.effects.lineBetween(edge,y,edge+dir*12,y+7);
      }
    }
    if(g.track.supports(p.x))this.effects.fillStyle(0x10202a,.24).fillEllipse(p.x,GROUND+2,55,7);
    // Energy is an effect behind ONE opaque character, never stacked body
    // silhouettes or overlapping flame columns obscuring the running pose.
    if(p.kiActive){
      const wave=Math.sin(g.time*11)*3;
      this.effects.fillStyle(0xffb52e,.17).fillPoints([
        {x:p.x-50,y:p.foot-8},{x:p.x-59,y:p.foot-45},{x:p.x-47,y:p.foot-36},
        {x:p.x-43+wave,y:p.foot-95},{x:p.x-28,y:p.foot-83},{x:p.x-7,y:p.foot-132-wave},
        {x:p.x+4,y:p.foot-108},{x:p.x+22,y:p.foot-116},{x:p.x+41,y:p.foot-60},
        {x:p.x+35,y:p.foot-18},{x:p.x+18,y:p.foot-5}],true);
      for(let i=0;i<9;i++){
        const age=(g.time*1.6+i*.113)%1,x=p.x-35-age*74,y=p.foot-18-(i%4)*23-age*13;
        this.effects.lineStyle(1.6,0xffd778,(1-age)*.8).lineBetween(x,y,x+5+age*5,y-1);
      }
    }
    this.hero.setPosition(p.x,p.foot).setAlpha(1);
    if(p.hurtTime>0)this.hero.setTint(0xffb6a3);else this.hero.clearTint();
    if(p.grounded&&p.landTime<=0){this.hero.play('run',true);this.hero.anims.timeScale=g.phase.speed/335;}
    else{this.hero.stop();this.hero.setFrame(8+p.frame);}
    if(!playing)this.hero.anims.pause();else if(this.hero.anims.isPaused)this.hero.anims.resume();
    const alive=new Set();
    const view=(entity,key)=>{alive.add(entity);let v=this.views.get(entity);if(!v){v=this.add.sprite(0,0,key,0).setOrigin(.5,140/160);this.world.add(v);this.world.bringToTop(this.foreground);this.labels.forEach(l=>this.world.bringToTop(l));this.views.set(entity,v);}return v;};
    for(const e of g.enemies){
      if(e.type==='blast'){
        this.effects.fillStyle(e.airborne?0xbc8bff:0xffa448,.35).fillEllipse(e.x+10,e.foot-13,83,20);
        this.effects.fillStyle(0xfff4ce,1).fillEllipse(e.x-16,e.foot-13,31,17);continue;
      }
      const key=e.type==='soldier'?'soldier':e.type==='flyer'?'flyer':'ground',v=view(e,key);
      if(e.type==='soldier')v.play('enemy-run',true);
      else if(e.type==='flyer'){if(e.shot&&e.recoil<=0||e.chargeTime===0)v.play('enemy-fly',true);else{v.stop();v.setFrame(e.flightFrame);}}
      else{const frame=this.textures.getFrame('ground',e.type);v.setFrame(e.type).setOrigin(.5,1).setDisplaySize(e.height*frame.width/frame.height,e.height);}
      v.setPosition(e.x,e.foot);if(!playing)v.anims.pause();else if(v.anims.isPaused)v.anims.resume();
      if(e.type==='flyer'){this.effects.lineStyle(2,0xd0b1ff,.4);for(let i=0;i<3;i++)this.effects.lineBetween(e.x+35,e.foot-15-i*8,e.x+70+Math.sin(g.time*10+i)*15,e.foot-15-i*8);}
      if(!e.shot&&e.chargeTime>0)this.foreground.fillStyle(e.airborne?0xd5b9ff:0xffda8e,.9).fillCircle(e.x-36,e.foot-(e.airborne?30:55),3+Math.min(1,e.chargeTime/.38)*5);
    }
    for(const f of g.friends){const v=view(f,'allies');v.setPosition(f.x,GROUND).setAlpha(f.touched?.6:1).play('ally-'+f.variant,true);if(!playing)v.anims.pause();else if(v.anims.isPaused)v.anims.resume();}
    for(const o of g.orbs){const v=view(o,'orb');v.setOrigin(.5).setDisplaySize(32,32).setPosition(o.x,o.y+Math.sin(o.age*4)*3);}
    for(const [entity,v] of this.views)if(!alive.has(entity)){v.destroy();this.views.delete(entity);}
    for(const particle of g.particles)this.foreground.fillStyle(Phaser.Display.Color.HexStringToColor(particle.color).color,Math.min(1,particle.life*3)).fillRect(particle.x,particle.y,particle.size,particle.size);
    for(const impact of g.groundImpacts){const age=1-impact.life/.22;this.foreground.lineStyle(2*(1-age),0xeadbb9,(1-age)*.45).strokeEllipse(impact.x,GROUND+2,32+age*80,4+age*6);}
    this.labels.forEach((label,i)=>{const m=g.messages[i];label.setVisible(!!m);if(m){if(label.text!==m.value)label.setText(m.value);label.setPosition(m.x,m.y).setColor(m.color).setAlpha(Math.min(1,m.life*2));}});
    if(g.flash>0)this.foreground.fillStyle(0xf8534e,g.flash).fillRect(0,0,1280,720);
  }
  syncUI(){
    const g=this.model,p=g.player,state=g.state;
    if(this.lastState!==state){
      this.lastState=state;ui.panel.hidden=state==='playing';ui.panel.dataset.mode=state;
      ui.hud.hidden=state==='menu';ui.ki.hidden=state!=='playing';ui.start.hidden=false;
      ui.start.textContent=state==='menu'?'JOGAR':state==='paused'?'CONTINUAR':'CORRER NOVAMENTE';
      ui.title.textContent=state==='menu'?'':state==='paused'?'PAUSADO':state==='victory'?'VOCÊ CONSEGUIU!':'VAMOS TENTAR DE NOVO?';
      ui.subtitle.textContent=state==='menu'?'Cinco mundos para explorar. Pule os obstáculos e cuide dos amigos.':state==='paused'?'Sua aventura está esperando.':state==='victory'?'Você atravessou os cinco mundos!':'Aliados: pule por cima. Voadores: passe por baixo.';
      ui.result.textContent=['victory','game-over'].includes(state)?Math.floor(g.score)+' PONTOS':'';
      $('instructions').textContent=matchMedia('(pointer:coarse)').matches?'Toque para pular · Toque outra vez no ar':'Espaço ou clique para pular · Pulo duplo';
    }
    setText(ui.score,String(Math.floor(g.score)).padStart(5,'0'));
    hearts.forEach((node,i)=>node.classList.toggle('empty',i>=p.lives));livesLabel.setAttribute('aria-label',p.lives+' vidas');
    setText(ui.phase,'FASE '+(g.phaseIndex+1)+' / 5');setText(ui.name,g.phase.name);
    ui.progress.style.width=Math.min(100,g.phaseTime/30*100)+'%';
    ui.kiFill.style.width=(p.kiActive?p.kiTime/6*100:p.charge)+'%';
    ui.ki.classList.toggle('ready',p.kiReady);ui.ki.classList.toggle('active',p.kiActive);
    setText(ui.kiLabel,p.kiActive?'×3':'KI');setText(ui.kiCaption,p.kiActive?'RESERVA '+Math.round(p.reserve)+'%':p.kiReady?'TOQUE AQUI':Math.round(p.charge)+'%');
    ui.ki.setAttribute('aria-label',p.kiReady?'Ativar KI':p.kiActive?'KI ativo, pontos triplicados':'KI carregando '+Math.round(p.charge)+'%');
    ui.banner.hidden=state!=='playing'||g.phaseBanner<=0;if(!ui.banner.hidden)setText(ui.banner,g.phase.name);
  }
}

const game=new Phaser.Game({type:Phaser.AUTO,parent:'game-container',width:1280,height:720,backgroundColor:'#102330',
  render:{antialias:true,roundPixels:false,powerPreference:'low-power'},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  input:{activePointers:2},audio:{disableWebAudio:false},scene:RunnerScene});
// The CSS stage changes with safe areas and device rotation, independently of
// Phaser's window resize polling. Keep canvas and DOM controls on one rectangle.
const stageObserver=new ResizeObserver(()=>game.scale.refresh());
stageObserver.observe($('stage'));
game.events.once(Phaser.Core.Events.DESTROY,()=>stageObserver.disconnect());
window.addEventListener('pagehide',()=>{game.scene.getScene('runner')?.pauseRun();});
