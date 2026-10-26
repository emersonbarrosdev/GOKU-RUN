(() => {
  "use strict";
  // Deterministic simulation stride metadata; visual animation is owned by
  // Phaser (native-player.mjs) and deliberately decoupled from this clock.
  const RUN_STRIDE = 335 * .68;
  const GROUND_TILE_WIDTH = 840;

  const W = 1280, H = 720, GROUND = 560;
  const PHASE_SECONDS = 30, PLAYER_HEIGHT = 108;
  const GRAVITY = 2600, FALL_GRAVITY = 3600, JUMP_SPEED = 810;
  // Per-atlas anatomical scale, NOT normalization by a pose's bounding height.
  // The new jump drawing has the same head/torso model as the run reference.
  const PLAYER_SCALE = { run: 108 / 331, jump: 108 / 331 };
  const KI_PER_ORB = 12.5, KI_DURATION = 6;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const random = (lo, hi) => lo + Math.random() * (hi - lo);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
  const PHASES = [
    { name: "CAMPOS DE NAMEK", location: "NAMEK", speed: 335, gap: .12, interval: 3.6, air: .25, tint: null },
    { name: "FLORESTA DO DRAGÃO", location: "TERRA", speed: 355, gap: .17, interval: 3.2, air: .32, tint: "rgba(20,61,20,.12)" },
    { name: "CÂNION DO SOL", location: "DESERTO", speed: 380, gap: .22, interval: 2.9, air: .38, tint: "rgba(136,62,12,.20)" },
    { name: "CIDADE EM RUÍNAS", location: "METRÓPOLE", speed: 405, gap: .26, interval: 2.65, air: .42, tint: "rgba(17,32,70,.42)" },
    { name: "FRONTEIRA DE LAVA", location: "VULCÃO", speed: 430, gap: .30, interval: 2.4, air: .45, tint: "rgba(82,16,15,.38)" },
  ];
  const PATHS = {
    run: "./assets/spritesheets/goku_stride_v8.png",
    jump: "./assets/spritesheets/goku_stride_v8.png",
    enemies: "./assets/spritesheets/enemies_fullbody_v7.png",
    friends: "./assets/spritesheets/friends_motion_v4.png",
    terrain: "./assets/spritesheets/terrain_ground_v4.png",
    world0: "./assets/backgrounds/namek_panorama_v7.png",
    world1: "./assets/backgrounds/forest_panorama_v7.png",
    world2: "./assets/backgrounds/canyon_panorama_v7.png",
    world3: "./assets/backgrounds/city_panorama_v7.png",
    world4: "./assets/backgrounds/lava_panorama_v7.png",
    ground: "./assets/spritesheets/ground_enemy_sheet.png",
    menu: "./assets/ui/menu_clean_v8.png",
  };
  const PANELS = [[0,0,2048,768],[0,0,2170,725],[0,0,2172,724],[0,0,2172,724],[0,0,2048,768]];
  function panoramaWindow(index, progress) {
    const [x,y,w,h] = PANELS[index];
    const viewWidth = h * W / H;
    return [x + (w - viewWidth) * clamp(progress,0,1), y, viewWidth, h];
  }

  const JUMP_FRAMES = [[102,730,202,282],[468,692,222,320],[890,694,152,279],[1261,729,196,284]];
  // Atlas pivots are explicitly registered to the waist/ground reference.
  // Never center a trimmed frame by its changing width or normalize its height.
  const RUN_PIVOTS = [[187,338],[573,339],[948,339],[1347,339],[184,680],[573,683],[950,681],[1343,681]];
  const JUMP_PIVOTS = [[183,1012],[573,1012],[949,1012],[1340,1013]];
  const FRIEND_FRAMES = [[72,16,169,391],[382,17,173,389],[699,13,172,393],[996,17,193,390],[20,429,283,469],[340,426,287,474],[639,431,321,468],[960,429,284,470],[27,923,265,306],[344,923,264,306],[658,923,262,306],[975,923,255,306]];
  const RUN_FRAMES = [[35,7,285,331],[448,16,247,323],[794,9,260,330],[1209,8,295,317],[31,364,287,316],[448,364,247,319],[820,355,242,326],[1217,358,292,310]];
  const SOLDIER_FRAMES = [[49,90,419,400],[512,90,340,400],[919,99,426,390],[1426,90,320,400]];
  const FLIGHT_FRAMES = [[29,578,405,169],[438,577,424,200],[878,580,448,201],[1338,579,430,228]];
  const SOLDIER_PIVOTS = [[233,489],[680,489],[1096,489],[1576,489]];
  const FLIGHT_PIVOTS = [[207,747],[650,747],[1097,747],[1546,747]];
  const ENEMY_FRAMES = {ground:[[94,144,324,342],[595,169,346,318],[1066,172,428,315],[1619,173,347,313],[53,789,411,209],[587,706,363,293],[1109,627,341,372],[1627,690,329,308]],air:[[53,186,406,300],[567,184,403,303],[1103,189,353,297],[1578,196,428,291],[55,705,402,283],[582,702,372,283],[1134,845,300,153],[1588,752,413,245]]};
  const SFX = {
    jump: "jump", doubleJump: "double_jump", collect: "ki_collect",
    ready: "ki_ready", activate: "ki_activate", hit: "hit",
    shield: "shield_hit", shot: "enemy_shot", phase: "phase",
    fall: "fall", land: "land", gameOver: "game_over",
  };

  class Assets {
    constructor() {
      this.images = {};
    }
    prepareSpriteCutouts() {
      // Generated PNGs contain a low-opacity matte outside the painted figures.
      // Alpha-test once at load (not during gameplay) so no rectangular halo is drawn.
      for(const key of ["run","enemies"]) {
        const image=this.images[key],surface=document.createElement("canvas");
        surface.width=image.width;surface.height=image.height;
        const c=surface.getContext("2d",{willReadFrequently:true});c.drawImage(image,0,0);
        const pixels=c.getImageData(0,0,surface.width,surface.height);
        for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=clamp((pixels.data[i]-232)*255/16,0,255);
        c.putImageData(pixels,0,0);this.images[key]=surface;
      }
      this.images.jump=this.images.run;
    }
    sprite(ctx, key, bounds, cx, foot, height, flip = false, alpha = 1) {
      const image = this.images[key];
      if (!image) return;
      const [sx, sy, sw, sh] = bounds;
      const width = height * sw / sh;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(cx, foot);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -height, width, height);
      ctx.restore();
    }
    frame(ctx,key,bounds,pivot,cx,foot,scale,flip=false,alpha=1) {
      const image=this.images[key];if(!image)return;
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(cx,foot);
      if(flip)ctx.scale(-1,1);
      ctx.drawImage(image,...bounds,(bounds[0]-pivot[0])*scale,(bounds[1]-pivot[1])*scale,bounds[2]*scale,bounds[3]*scale);
      ctx.restore();
    }
  }

  class Player {
    constructor() { this.reset(); }
    reset() {
      this.x = 235; this.foot = GROUND; this.vy = 0;
      this.grounded = true; this.jumps = 2; this.coyote = .09;
      this.buffer = 0; this.runTime = 0; this.airTime = 0; this.landTime = 0;
      this.lives = 3; this.invulnerable = 0; this.hurtTime = 0;
      this.charge = 0; this.reserve = 0; this.kiTime = 0;
      this.motionDriver?.reset();
    }
    get kiActive() { return this.kiTime > 0; }
    get kiReady() { return !this.kiActive && this.charge >= 100; }
    get height() { return PLAYER_HEIGHT; }
    get box() { return this.motionDriver?.box || { x: this.x - 25, y: this.foot - 97, w: 50, h: 90 }; }
    queueJump() { this.buffer = .13; }
    activateKi() {
      if (!this.kiReady) return false;
      this.charge = 0; this.reserve = 0; this.kiTime = KI_DURATION;
      return true;
    }
    addKi(amount = KI_PER_ORB) {
      if (this.kiActive) {
        this.reserve = clamp(this.reserve + amount, 0, 100);
        return false;
      }
      const before = this.charge;
      this.charge = clamp(this.charge + amount, 0, 100);
      return before < 100 && this.charge === 100;
    }
    endKi() {
      this.kiTime = 0;
      this.charge = this.reserve;
      this.reserve = 0;
    }
    damage(friend = false) {
      if (!friend && this.kiActive) return "shield";
      if (!friend && this.invulnerable > 0) return "ignored";
      this.lives = Math.max(0, this.lives - 1);
      this.invulnerable = 1.1;
      this.hurtTime = .2;
      return "damage";
    }
    update(dt, track, speed) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      this.hurtTime = Math.max(0, this.hurtTime - dt);
      this.landTime = Math.max(0, this.landTime - dt);
      if (this.kiActive) {
        this.kiTime = Math.max(0, this.kiTime - dt);
        if (!this.kiActive) this.endKi();
      }
      if (this.motionDriver) return this.motionDriver.update(dt, track, speed);
      const supported = track.supports(this.x - 15, this.x + 15);
      if (this.grounded && !supported) this.grounded = false;
      this.coyote = this.grounded ? .09 : Math.max(0, this.coyote - dt);
      let jumped = 0, landed = false, stepped = false, impact = 0;
      if (this.buffer > 0 && (this.grounded || this.coyote > 0 || this.jumps > 0)) {
        jumped = this.grounded || this.coyote > 0 ? 1 : 2;
        this.vy = jumped === 1 ? -JUMP_SPEED : -690;
        this.jumps = jumped === 1 ? 1 : 0;
        this.grounded = false;
        this.coyote = 0; this.buffer = 0; this.airTime = 0;
      }
      this.buffer = Math.max(0, this.buffer - dt);
      if (this.grounded) {
        const count=RUN_FRAMES.length,half=count/2;
        const next=this.runTime+dt*speed/RUN_STRIDE*count;
        stepped=Math.floor(next/half)!==Math.floor(this.runTime/half);
        this.runTime=next%count;
      } else {
        this.airTime += dt;
        const before = this.foot;
        this.vy = Math.min(1400, this.vy + (this.vy > 0 ? FALL_GRAVITY : GRAVITY) * dt);
        this.foot += this.vy * dt;
        if (this.vy >= 0 && before <= GROUND + 1 && this.foot >= GROUND && supported) {
          impact = clamp(this.vy / 1050, .2, 1);
          this.foot = GROUND; this.vy = 0; this.grounded = true;
          this.jumps = 2; this.landTime = .085; landed = true;
        }
      }
      return { jumped, landed, stepped, impact };
    }
    get frame() {
      if (this.grounded) return this.landTime > 0 ? 3 : Math.floor(this.runTime) % RUN_FRAMES.length;
      if (this.airTime < .08) return 0;
      return this.vy < 70 ? 1 : 2;
    }
  }

  class Track {
    constructor() { this.reset(); }
    reset() {
      this.distance = 0;
      this.segments = [{ start: -500, end: 2200 }];
    }
    update(dt, speed, phase, protectAirX = null) {
      this.distance += dt * speed;
      this.segments = this.segments.filter(s => s.end - this.distance > -150);
      let last = this.segments[this.segments.length - 1];
      while (last.end - this.distance < W + 1800) {
        const screenEnd = last.end - this.distance;
        // Do not place a forced jump below an overhead encounter.
        const protectedZone = protectAirX !== null && Math.abs(screenEnd - protectAirX) < 650;
        const gap = !protectedZone && Math.random() < phase.gap ? random(95, 145) : 0;
        const start = last.end + gap;
        const end = start + random(1350, 1950);
        if (gap === 0) last.end = end;
        else { last = { start, end }; this.segments.push(last); }
      }
    }
    supports(left, right = left) {
      return this.segments.some(s => right + this.distance > s.start && left + this.distance < s.end);
    }
    clearRunway(x, margin = 210) {
      return this.segments.some(s => s.start - this.distance < x - margin && s.end - this.distance > x + margin);
    }
    safeRespawn(playerX) {
      // A short contiguous rescue ledge only fills the gap underneath Goku.
      const worldX = this.distance + playerX;
      this.segments.push({ start: worldX - 110, end: worldX + 400 });
      this.segments.sort((a, b) => a.start - b.start);
      this.segments = this.segments.reduce((items, item) => {
        const last = items[items.length - 1];
        if (last && item.start <= last.end) last.end = Math.max(last.end, item.end);
        else items.push({ ...item });
        return items;
      }, []);
    }
    visibleTiles() {
      const first=Math.floor(this.distance/GROUND_TILE_WIDTH);
      const last=Math.floor((this.distance+W)/GROUND_TILE_WIDTH);
      return Array.from({length:last-first+1},(_,i)=>({index:first+i,x:(first+i)*GROUND_TILE_WIDTH-this.distance}));
    }
  }

  class Enemy {
    constructor(type, x, foot) {
      this.type = type; this.x = x; this.foot = foot; this.baseFoot = foot;
      this.age = 0; this.shot = false; this.active = true; this.vy = 0;
      this.runPhase = 0; this.chargeTime = 0; this.recoil = 0;
      this.height = type === "flyer" ? 64 : type === "blast" ? 26 : type === "soldier" ? 91 : 49;
      this.width = type === "blast" ? 64 : type === "flyer" ? 86 : type === "soldier" ? 58 : 52;
      this.airborne = type === "flyer" || (type === "blast" && foot < GROUND - 110);
    }
    get box() {
      if(this.type==="flyer") {
        const frame=this.flightFrame,b=FLIGHT_FRAMES[frame],p=FLIGHT_PIVOTS[frame];
        return {x:this.x+(b[0]-p[0])*.23+6,y:this.foot+(b[1]-p[1])*.23+4,
          w:b[2]*.23-12,h:b[3]*.23-8};
      }
      return { x: this.x - this.width * .36, y: this.foot - this.height * .88,
        w: this.width * .72, h: this.height * .80 };
    }
    get flightFrame() { return this.chargeTime>0&&!this.shot?2:this.recoil>0?3:Math.floor(this.age*5)%2; }
    update(dt, speed, track) {
      this.age += dt;
      const extra = this.type === "blast" ? 210 : this.type === "flyer" ? 105 : this.type === "soldier" ? 190 : 0;
      this.x -= (speed + extra) * dt;
      this.runPhase = (this.runPhase + dt * extra / 110) % 1;
      this.recoil = Math.max(0,this.recoil-dt);
      if (this.type === "flyer") this.foot = this.baseFoot + Math.sin(this.age * 4) * 3;
      if (this.type === "soldier" && !track.supports(this.x - 15, this.x + 15)) {
        this.vy += GRAVITY * dt; this.foot += this.vy * dt;
      }
      if (this.x < -120 || this.foot > H + 100) this.active = false;
    }
    prepareShot(dt) {
      if(this.shot || !["soldier","flyer"].includes(this.type))return false;
      if(this.x<1160 && this.x>450)this.chargeTime+=dt;
      if(this.chargeTime<.38 || this.x>1000 || this.x<450)return false;
      this.shot=true;this.recoil=.2;return true;
    }
  }

  class Friend {
    constructor(x, variant) {
      this.x = x; this.variant = variant; this.time = random(0, 1);
      this.active = true; this.touched = false;
      this.height = [101, 122, 72][variant];
    }
    get frame() {
      const sequence = [0, 1, 2, 3, 2, 1];
      return this.variant * 4 + sequence[Math.floor(this.time * [5, 4, 6][this.variant]) % sequence.length];
    }
    get box() { return { x: this.x - 24, y: GROUND - this.height + 8, w: 48, h: this.height - 12 }; }
    update(dt, speed) {
      this.time += dt;
      this.x -= speed * dt;
      if (this.x < -120) this.active = false;
    }
  }

  class Game {
    get phase() { return PHASES[this.phaseIndex]; }
    reset() {
      this.player.reset(); this.track.reset();
      this.phaseIndex = 0; this.phaseTime = 0; this.time = 0; this.score = 0;
      this.enemies = []; this.friends = []; this.orbs = []; this.particles = []; this.messages = [];
      this.encounterTimer = 3.2; this.orbTimer = 1.6;
      this.lastLane = "ground"; this.laneRepeats = 0; this.encounters = 0; this.orbPatterns = 0;
      this.phaseBanner = 2.6; this.phaseFade = 0; this.previousPhase = 0;
      this.flash = 0; this.newRecord = false;
      this.hitStop = 0; this.impactTime = 0; this.impactStrength = 0; this.groundImpacts = [];
    }
    start() {
      this.reset(); this.state = "playing"; this.accumulator = 0;
      this.audio.startMusic();
    }
    activateKi() {
      if (this.state !== "playing" || !this.player.activateKi()) return false;
      this.audio.play("activate", .4);
      this.burst(this.player.x, this.player.foot - 45, "#ffe4a1", 18);
      this.message("KI ATIVO • PONTOS ×3", this.player.x, this.player.foot - 130, "#ffe486");
      return true;
    }
    setPhase(index) {
      this.previousPhase = this.phaseIndex;
      this.phaseIndex = clamp(index, 0, 4);
      this.phaseTime = 0; this.phaseBanner = 2.6; this.phaseFade = 1;
      this.audio.play("phase", .3);
    }
    update(dt) {
      this.flash = Math.max(0, this.flash - dt);
      if (this.state !== "playing") return;
      // Impacts may flash/emit particles but never halt scrolling or physics.
      this.hitStop = Math.max(0, this.hitStop - dt);
      this.impactTime = Math.max(0, this.impactTime - dt);
      this.time += dt; this.phaseTime += dt;
      this.phaseBanner = Math.max(0, this.phaseBanner - dt);
      this.phaseFade = Math.max(0, this.phaseFade - dt);
      if (this.phaseTime >= PHASE_SECONDS) {
        if (this.phaseIndex === 4) { this.finish(true); return; }
        this.score += 300; this.setPhase(this.phaseIndex + 1);
      }
      const speed = this.phase.speed;
      const overhead = this.enemies.find(e => e.type === "flyer" && e.active);
      this.track.update(dt, speed, this.phase, overhead ? overhead.x : null);
      const motion = this.player.update(dt, this.track, speed);
      if (motion.jumped) {
        this.audio.play(motion.jumped === 1 ? "jump" : "doubleJump", .24);
        this.burst(this.player.x - 16, this.player.foot, "#c6ccb0", 6);
      }
      if (motion.landed) {
        this.audio.play("land", .12 + motion.impact * .2);
        this.burst(this.player.x, GROUND - 2, "#d5c49c", Math.round(7 + motion.impact * 9));
        this.impactTime = .14; this.impactStrength = motion.impact * 2.2;
        this.groundImpacts.push({ x: this.player.x, life: .22, strength: motion.impact });
      }
      if (motion.stepped) {
        this.burst(this.player.x - 23, GROUND - 2, "#c6ccb0", 2);
        this.audio.play("land", .035);
      }
      if (this.player.foot > H + 110) {
        if (this.player.kiActive) this.player.endKi();
        this.player.damage(true); this.audio.play("fall", .25);
        if (!this.player.lives) { this.finish(false); return; }
        this.track.safeRespawn(this.player.x);
        this.player.foot = GROUND - 20; this.player.vy = 0;
        this.player.jumps = 2; this.player.grounded = false;
      }
      this.score += 14 * dt * (this.player.kiActive ? 3 : 1);
      this.encounterTimer -= dt; this.orbTimer -= dt;
      if (this.encounterTimer <= 0) this.spawnEncounter();
      if (this.orbTimer <= 0) this.spawnOrbs();
      const shots = [];
      for (const enemy of this.enemies) {
        enemy.update(dt, speed, this.track);
        if (!enemy.active) continue;
        // Charge for 380ms on screen, then fire from a distance, not at contact.
        if (enemy.prepareShot(dt)) {
          const foot = enemy.type === "flyer" ? enemy.foot - 14 : GROUND - 36;
          shots.push(new Enemy("blast", enemy.x - 36, foot));
          this.audio.play("shot", .16);
          this.burst(enemy.x - 36, foot - 10, enemy.type === "flyer" ? "#c891ff" : "#ffaf59", 5);
        }
      }
      this.enemies.push(...shots);
      for (const friend of this.friends) friend.update(dt, speed);
      for (const orb of this.orbs) { orb.x -= speed * dt; orb.age += dt; }
      for (const particle of this.particles) {
        particle.life -= dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt;
        particle.vy += 300 * dt;
      }
      for (const message of this.messages) { message.life -= dt; message.y -= dt * 26; }
      for (const impact of this.groundImpacts) { impact.life -= dt; impact.x -= speed * dt; }
      this.collisions();
      this.enemies = this.enemies.filter(e => e.active);
      this.friends = this.friends.filter(f => f.active);
      this.orbs = this.orbs.filter(o => o.active && o.x > -50);
      this.particles = this.particles.filter(p => p.life > 0);
      this.messages = this.messages.filter(m => m.life > 0);
      this.groundImpacts = this.groundImpacts.filter(i => i.life > 0);
    }
    spawnEncounter() {
      const x = W + 100;
      // Every encounter needs a continuous approach. Air hazards never cover
      // a gap or an ally/ground obstacle, leaving running underneath viable.
      if (!this.track.clearRunway(x, 470)) { this.encounterTimer = .45; return; }
      if(this.orbs.some(o=>o.active&&o.y<GROUND-100&&Math.abs(o.x-x)<600)) {
        this.encounterTimer=.45;return;
      }
      if (this.enemies.some(e => e.active && e.type !== "blast" && e.x > x - 650) ||
          this.friends.some(f => f.active && f.x > x - 650)) {
        this.encounterTimer = .5; return;
      }
      this.encounters++;
      if (this.encounters % 4 === 0) {
        this.friends.push(new Friend(x, Math.floor(this.encounters / 4 - 1) % 3));
        this.lastLane = "friend";
        this.encounterTimer = this.phase.interval + 1;
        return;
      }
      let air = Math.random() < this.phase.air;
      if (this.lastLane === "air") air = false;
      if (this.lastLane === "ground" && this.laneRepeats >= 2) air = true;
      const lane = air ? "air" : "ground";
      this.laneRepeats = lane === this.lastLane ? this.laneRepeats + 1 : 1;
      this.lastLane = lane;
      const type = air ? "flyer" : Math.random() < .52 ? "soldier" : Math.random() < .5 ? "crystal" : "boulder";
      // Bottom of flyer is 160 px above the lane; Goku is 108 px tall.
      // Even its lowest bob and its projectile leave > 40 px of clearance.
      this.enemies.push(new Enemy(type, x, air ? GROUND - 160 : GROUND));
      this.encounterTimer = this.phase.interval + random(0, .8);
    }
    spawnOrbs() {
      const start = W + 50;
      const overhead = this.enemies.some(e => e.airborne && Math.abs(e.x - start) < 450);
      if (!this.track.clearRunway(start, 200)) { this.orbTimer = .6; return; }
      // Predict the whole collection corridor: never lure a jump into a flyer,
      // its shot, an ally, or a ground shooter about to send a low projectile.
      const threats = this.enemies.some(e=>e.active && Math.abs(e.x-start)<700) ||
        this.friends.some(f=>f.active && Math.abs(f.x-start)<500);
      const patterns = [[49,49,49],[75,130,165,130,75],[145,165,145],[60,110,155,110]];
      const pattern = overhead || threats ? patterns[0] : patterns[this.orbPatterns++ % patterns.length];
      for (let i = 0; i < pattern.length; i++) {
        this.orbs.push({ x: start + i * 60, y: GROUND - pattern[i],
          active: true, age: i * .3 });
      }
      this.orbTimer = random(4.8, 6.3);
    }
    collisions() {
      const box = this.player.box;
      for (const orb of this.orbs) {
        if (!orb.active || !overlap(box, { x: orb.x - 12, y: orb.y - 12, w: 24, h: 24 })) continue;
        orb.active = false;
        const ready = this.player.addKi();
        this.score += 25 * (this.player.kiActive ? 3 : 1);
        this.audio.play(ready ? "ready" : "collect", ready ? .35 : .2);
        this.burst(orb.x, orb.y, "#ffe287", 7);
        if (this.player.kiActive) this.message("+12,5% RESERVA", orb.x, orb.y - 16, "#9aefd2");
      }
      // Allies are never destroyed. Each friend can penalize only once,
      // including with active KI or the ordinary enemy hit grace period.
      for (const friend of this.friends) {
        if (!friend.active || friend.touched || !overlap(box, friend.box)) continue;
        friend.touched = true;
        this.player.damage(true);
        this.hitStop = .04;
        this.audio.play("hit", .25); this.flash = .12;
        this.message("ALIADO! −1 VIDA", this.player.x + 20, this.player.foot - 135, "#ffabb1");
        if (!this.player.lives) { this.finish(false); return; }
      }
      for (const enemy of this.enemies) {
        if (!enemy.active || !overlap(box, enemy.box)) continue;
        const result = this.player.damage();
        if (result === "ignored") continue;
        enemy.active = false;
        if (result === "shield") {
          this.hitStop = .045;
          const points = 60 * 3;
          this.score += points;
          this.audio.play("shield", .24);
          this.message("+" + points + "  ×3", enemy.x, enemy.foot - enemy.height, "#ffe287");
          this.burst(enemy.x, enemy.foot - enemy.height / 2, "#ffc66d", 14);
        } else {
          this.hitStop = .055;
          this.audio.play("hit", .25); this.flash = .12;
          this.message("−1 VIDA", this.player.x, this.player.foot - 130, "#ffabb1");
          if (!this.player.lives) { this.finish(false); return; }
        }
      }
    }
    finish(won) {
      this.state = won ? "victory" : "game-over";
      this.flash = 0; this.hitStop = 0; this.impactTime = 0; this.audio.stopMusic();
      this.newRecord = Math.floor(this.score) > this.best;
      if (this.newRecord) {
        this.best = Math.floor(this.score);
        if (this.persistResults !== false) {
          try { localStorage.setItem("goku-run-v5-best", String(this.best)); } catch {}
        }
      }
      if (!won) this.audio.play("gameOver", .28);
      // No camera shake; the world and animation clocks freeze with the result.
    }
    burst(x, y, color, count) {
      for (let i = 0; i < count; i++) this.particles.push({
        x, y, vx: random(-90, 70), vy: random(-130, -25),
        life: random(.2, .45), color, size: random(1.5, 3),
      });
    }
    message(value, x, y, color) { this.messages.push({ value, x, y, color, life: 1.15 }); }
  }

  const core = { Player, Track, Enemy, Friend, Game, Assets, PHASES, PATHS,
    JUMP_FRAMES, RUN_FRAMES, PLAYER_SCALE, FRIEND_FRAMES, overlap, GROUND, PLAYER_HEIGHT, KI_PER_ORB,
    RUN_STRIDE, GROUND_TILE_WIDTH, panoramaWindow, PANELS, RUN_PIVOTS, JUMP_PIVOTS, SOLDIER_FRAMES, FLIGHT_FRAMES,
    SOLDIER_PIVOTS, FLIGHT_PIVOTS, SFX };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined") return;
  window.GokuCore=core;
})();
