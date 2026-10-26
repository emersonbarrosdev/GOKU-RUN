import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import './game.js';
import { PLAYER_ART, loadNativePlayer, NativePlayer } from './native-player.mjs';

const C=window.GokuCore,{Game,Player,Track,Assets,PATHS,SFX,GROUND}=C;
const $=id=>document.getElementById(id);
const FIXED_STEP=1/60,MAX_CATCH_UP_STEPS=3,MAX_FRAME_DELTA=FIXED_STEP*MAX_CATCH_UP_STEPS;

class RunnerScene extends Phaser.Scene {
  constructor(uiBridge){
    super('runner');
    this.ui=uiBridge;
    this.accumulator=0;this.views=new Map();this.lastState='';
    this.aliveViews=new Set();this.particleColors=new Map();
    this.backgroundWidths=C.PANELS.map(([,,w,h])=>w*720/h);
  }
  preload(){
    for(const [key,url] of Object.entries(PATHS)) {
      if (['run','jump','terrain'].includes(key)) continue;
      this.load.image(key,url);
    }
    loadNativePlayer(this);
    for(const [key,file] of Object.entries(SFX))this.load.audio('sfx-'+key,'./assets/sfx/'+file+'.wav');
    this.load.audio('music',['./assets/sounds/trilha.ogg','./assets/sounds/trilha.mp3']);
    this.load.on('progress',p=>this.ui.render({subtitle:'Carregando… '+Math.round(p*100)+'%'}));
    this.load.on('loaderror',file=>this.ui.render({subtitle:'Não foi possível carregar '+file.key+'. Reabra o jogo.'}));
  }
  create(){
    this.domAbort=new AbortController();
    this.art=new Assets();
    this.art.images=Object.fromEntries(Object.keys(PATHS).filter(k=>this.textures.exists(k)).map(k=>[k,this.textures.get(k).getSourceImage()]));
    this.art.prepareSpriteCutouts();this.makeTextures();
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
    this.groundLayer=this.add.container(0,0);this.world.add(this.groundLayer);
    this.effects=this.add.graphics();this.world.add(this.effects);
    this.nativePlayer=new NativePlayer(this,g.player,GROUND);
    g.player.motionDriver=this.nativePlayer;
    this.hero=this.nativePlayer.sprite;
    this.foreground=this.add.graphics();this.world.add(this.foreground);
    this.labels=Array.from({length:10},()=>this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'14px',fontStyle:'bold',stroke:'#142434',strokeThickness:3}).setOrigin(.5).setVisible(false));
    this.world.add(this.labels);
    this.menu=this.add.image(0,0,'menu').setOrigin(0).setDisplaySize(1280,720);
    this.bindInputs();
    this.pauseOnBlur=()=>this.pauseRun();
    this.game.events.on(Phaser.Core.Events.BLUR,this.pauseOnBlur);
    this.game.events.on(Phaser.Core.Events.HIDDEN,this.pauseOnBlur);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pauseRun();},{signal:this.domAbort.signal});
    window.addEventListener('resize',()=>{if(this.isPortrait())this.pauseRun();},{signal:this.domAbort.signal});
    if(Capacitor.isNativePlatform()){
      this.capacitorListeners=Promise.all([
        App.addListener('appStateChange',({isActive})=>{if(!isActive)this.pauseRun();}),
        App.addListener('backButton',()=>{if(g.state==='playing')this.pauseRun();else if(g.state==='paused'){g.state='menu';g.audio.stopMusic();}else App.exitApp();}),
      ]);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.domAbort.abort();
      this.game.events.off(Phaser.Core.Events.BLUR,this.pauseOnBlur);
      this.game.events.off(Phaser.Core.Events.HIDDEN,this.pauseOnBlur);
      this.capacitorListeners?.then(handles=>handles.forEach(handle=>handle.remove()));
    });
    const params=new URLSearchParams(location.search);
    if(params.get('debug')==='1'){g.persistResults=false;window.__gokuRun={game:g,core:C,scene:this,phaser:this.game};}
    if(params.get('autostart')==='1')this.startRun();
    this.syncUI();
  }
  isPortrait(){return matchMedia('(orientation:portrait) and (pointer:coarse)').matches;}
  makeTextures(){
    const atlas=(key,frames)=>{
      const columns=Math.min(8,frames.length);
      const surface=document.createElement('canvas');surface.width=160*columns;surface.height=160*Math.ceil(frames.length/columns);
      const ctx=surface.getContext('2d');
      frames.forEach((f,i)=>this.art.frame(ctx,f.key,f.bounds,f.pivot,(i%columns)*160+80,Math.floor(i/columns)*160+140,f.scale));
      const texture=this.textures.addCanvas(key,surface);
      frames.forEach((_,i)=>texture.add(i,0,(i%columns)*160,Math.floor(i/columns)*160,160,160));
    };
    atlas('soldier',C.SOLDIER_FRAMES.map((bounds,i)=>({key:'enemies',bounds,pivot:C.SOLDIER_PIVOTS[i],scale:.23})));
    atlas('flyer',C.FLIGHT_FRAMES.map((bounds,i)=>({key:'enemies',bounds,pivot:C.FLIGHT_PIVOTS[i],scale:.23})));
    const allies=document.createElement('canvas');allies.width=12*160;allies.height=160;const ac=allies.getContext('2d');
    C.FRIEND_FRAMES.forEach((bounds,i)=>{const variant=Math.floor(i/4),h=bounds[3]/[393,474,306][variant]*[101,122,72][variant];this.art.sprite(ac,'friends',bounds,i*160+80,140,h);});
    const allyTexture=this.textures.addCanvas('allies',allies);C.FRIEND_FRAMES.forEach((_,i)=>allyTexture.add(i,0,i*160,0,160,160));
    for(const [name,bounds] of [['crystal',[1109,627,341,372]],['boulder',[1627,690,329,308]]])this.textures.get('ground').add(name,0,...bounds);
    const orb=document.createElement('canvas');orb.width=48;orb.height=48;const oc=orb.getContext('2d');
    const glow=oc.createRadialGradient(20,18,1,24,24,23);glow.addColorStop(0,'#fffce3');glow.addColorStop(.42,'#ffdd76');glow.addColorStop(.65,'#ed982c');glow.addColorStop(1,'rgba(255,190,60,0)');oc.fillStyle=glow;oc.fillRect(0,0,48,48);this.textures.addCanvas('orb',orb);
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
  }
  startRun(){if(this.isPortrait())return;this.sound.context?.resume();this.model.start();this.accumulator=0;this.lastState='';}
  pauseRun(){if(this.model?.state==='playing'){this.model.state='paused';this.nativePlayer?.sprite.anims.pause();this.music.pause();this.sound.pauseAll();}}
  resumeRun(){if(this.model.state!=='paused'||this.isPortrait())return;this.model.state='playing';this.sound.resumeAll();if(this.model.audio.enabled)this.music.resume();this.accumulator=0;}
  toggleSound(){this.model.audio.toggle();}
  update(time,delta){
    if(!this.model)return;const g=this.model;
    if(g.state==='playing'){
      const frameSeconds=Math.min(Math.max(delta,0)/1000,MAX_FRAME_DELTA);
      this.accumulator=Math.min(this.accumulator+frameSeconds,MAX_FRAME_DELTA);
      let steps=0;
      while(this.accumulator>=FIXED_STEP&&steps<MAX_CATCH_UP_STEPS){
        g.update(FIXED_STEP);this.accumulator-=FIXED_STEP;steps++;
      }
      if(steps===MAX_CATCH_UP_STEPS&&this.accumulator>=FIXED_STEP)this.accumulator=0;
    }else this.accumulator=0;
    this.renderWorld();this.syncUI();
  }
  renderWorld(){
    const g=this.model,p=g.player,playing=g.state==='playing';
    this.menu.setVisible(g.state==='menu');this.world.setVisible(g.state!=='menu');
    if(g.state==='menu')return;
    const placeBackground=(image,index,progress)=>{
      const key='world'+index,w=this.backgroundWidths[index];
      if(image.texture.key!==key)image.setTexture(key);
      if(image.displayWidth!==w||image.displayHeight!==720)image.setDisplaySize(w,720);
      image.setPosition(-(w-1280)*progress,0);
    };
    placeBackground(this.background,g.phaseIndex,Math.min(1,g.phaseTime/30));
    this.previous.setVisible(g.phaseFade>0);if(g.phaseFade>0){placeBackground(this.previous,g.previousPhase,1);this.previous.setAlpha(g.phaseFade);}
    this.effects.clear();this.foreground.clear();
    if(g.track.supports(p.x))this.effects.fillStyle(0x10202a,.24).fillEllipse(p.x,GROUND+2,55,7);
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

    // O player ativo usa apenas o relógio de animação nativo do Phaser.
    this.nativePlayer.render(playing);

    const alive=this.aliveViews;alive.clear();
    const view=(entity,key)=>{alive.add(entity);let v=this.views.get(entity);if(!v){v=this.add.sprite(0,0,key,0).setOrigin(.5,140/160);this.world.add(v);this.world.bringToTop(this.foreground);this.labels.forEach(l=>this.world.bringToTop(l));this.views.set(entity,v);}return v;};
    for(const e of g.enemies){
      if(e.type==='blast'){
        this.effects.fillStyle(e.airborne?0xbc8bff:0xffa448,.35).fillEllipse(e.x+10,e.foot-13,83,20);
        this.effects.fillStyle(0xfff4ce,1).fillEllipse(e.x-16,e.foot-13,31,17);continue;
      }
      const key=e.type==='soldier'?'soldier':e.type==='flyer'?'flyer':'ground',v=view(e,key);
      if(e.type==='soldier')v.stop().setFrame(Math.floor(e.runPhase*4)%4);
      else if(e.type==='flyer')v.stop().setFrame(e.flightFrame);
      else{const frame=this.textures.getFrame('ground',e.type);v.setFrame(e.type).setOrigin(.5,1).setDisplaySize(e.height*frame.width/frame.height,e.height);}
      v.setPosition(e.x,e.foot);
      if(e.type==='flyer'){this.effects.lineStyle(2,0xd0b1ff,.4);for(let i=0;i<3;i++)this.effects.lineBetween(e.x+35,e.foot-15-i*8,e.x+70+Math.sin(g.time*10+i)*15,e.foot-15-i*8);}
      if(!e.shot&&e.chargeTime>0)this.foreground.fillStyle(e.airborne?0xd5b9ff:0xffda8e,.9).fillCircle(e.x-36,e.foot-(e.airborne?30:55),3+Math.min(1,e.chargeTime/.38)*5);
    }
    for(const f of g.friends){const v=view(f,'allies');v.setPosition(f.x,GROUND).setAlpha(f.touched?.6:1).play('ally-'+f.variant,true);if(!playing)v.anims.pause();else if(v.anims.isPaused)v.anims.resume();}
    for(const o of g.orbs){const v=view(o,'orb');v.setOrigin(.5).setDisplaySize(32,32).setPosition(o.x,o.y+Math.sin(o.age*4)*3);}
    for(const [entity,v] of this.views)if(!alive.has(entity)){v.destroy();this.views.delete(entity);}
    for(const particle of g.particles){
      let color=this.particleColors.get(particle.color);
      if(color===undefined){color=Phaser.Display.Color.HexStringToColor(particle.color).color;this.particleColors.set(particle.color,color);}
      this.foreground.fillStyle(color,Math.min(1,particle.life*3)).fillRect(particle.x,particle.y,particle.size,particle.size);
    }
    for(const impact of g.groundImpacts){const age=1-impact.life/.22;this.foreground.lineStyle(2*(1-age),0xeadbb9,(1-age)*.45).strokeEllipse(impact.x,GROUND+2,32+age*80,4+age*6);}
    this.labels.forEach((label,i)=>{const m=g.messages[i];label.setVisible(!!m);if(m){if(label.text!==m.value)label.setText(m.value);label.setPosition(m.x,m.y).setColor(m.color).setAlpha(Math.min(1,m.life*2));}});
    if(g.flash>0)this.foreground.fillStyle(0xf8534e,g.flash).fillRect(0,0,1280,720);
  }
  syncUI(){
    const g=this.model,p=g.player,state=g.state;
    this.lastState=state;
    this.ui.render({
      state,panelHidden:state==='playing',hudHidden:state==='menu',kiHidden:state!=='playing',
      startText:state==='menu'?'JOGAR':state==='paused'?'CONTINUAR':'CORRER NOVAMENTE',
      title:state==='menu'?'':state==='paused'?'PAUSADO':state==='victory'?'VOCÊ CONSEGUIU!':'VAMOS TENTAR DE NOVO?',
      subtitle:state==='menu'?'Cinco mundos para explorar. Pule os obstáculos e cuide dos amigos.':state==='paused'?'Sua aventura está esperando.':state==='victory'?'Você atravessou os cinco mundos!':'Aliados: pule por cima. Voadores: passe por baixo.',
      result:['victory','game-over'].includes(state)?Math.floor(g.score)+' PONTOS':'',
      instructions:matchMedia('(pointer:coarse)').matches?'Toque para pular · Toque outra vez no ar':'Espaço ou clique para pular · Pulo duplo',
      score:String(Math.floor(g.score)).padStart(5,'0'),lives:p.lives,
      phaseLabel:'FASE '+(g.phaseIndex+1)+' / 5',phaseName:g.phase.name,
      progress:Math.min(100,g.phaseTime/30*100).toFixed(2)+'%',
      kiFill:(p.kiActive?p.kiTime/6*100:p.charge).toFixed(1)+'%',kiReady:p.kiReady,kiActive:p.kiActive,
      kiLabel:p.kiActive?'×3':'KI',
      kiCaption:p.kiActive?'RESERVA '+Math.round(p.reserve)+'%':p.kiReady?'TOQUE AQUI':Math.round(p.charge)+'%',
      kiAria:p.kiReady?'Ativar KI':p.kiActive?'KI ativo, pontos triplicados':'KI carregando '+Math.round(p.charge)+'%',
      bannerHidden:state!=='playing'||g.phaseBanner<=0,banner:g.phase.name,
      soundText:g.audio.enabled?'SOM LIGADO':'SOM DESLIGADO',
    });
  }
}

export function createRunnerGame(uiBridge={render(){}}){
  const scene=new RunnerScene(uiBridge);
  const game=new Phaser.Game({type:Phaser.AUTO,parent:'game-container',width:1280,height:720,backgroundColor:'#102330',
    physics:{default:'arcade',arcade:{customUpdate:true,gravity:{y:0},fps:60,fixedStep:true}},
    render:{antialias:true,roundPixels:false,powerPreference:'high-performance'},
    fps:{target:60,min:30,forceSetTimeOut:false,smoothStep:true},
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    input:{activePointers:2},audio:{disableWebAudio:false},scene});
  const stageObserver=new ResizeObserver(()=>game.scale.refresh());
  stageObserver.observe($('stage'));
  const pauseOnPageHide=()=>game.scene.getScene('runner')?.pauseRun();
  window.addEventListener('pagehide',pauseOnPageHide);
  return {
    game,
    start(){scene.model?.state==='paused'?scene.resumeRun():scene.startRun();},
    pause(){scene.pauseRun();},
    activateKi(){scene.model?.activateKi();},
    toggleSound(){scene.toggleSound();},
    destroy(){
      window.removeEventListener('pagehide',pauseOnPageHide);
      stageObserver.disconnect();
      game.destroy(true);
    },
  };
}
