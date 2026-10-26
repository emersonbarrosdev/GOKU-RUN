// Original GIF poses and relative timing, with gameplay size/rate tuned separately.
export const PLAYER_ART = Object.freeze({
  url: './assets/game/player/goku-run.png',
  key: 'goku-native', animation: 'goku-run',
  frameWidth: 256, frameHeight: 256, count: 10, columns: 5,
  // 0.62 keeps the user-approved size and stays well below the original GIF
  // speed, while avoiding the 60–80ms pose holds that looked robotic.
  baseline: 240, scale: .65, fps: 1000 / 30, playbackRate: .62,
  durations: [30,30,30,40,40,30,30,30,40,40],
  body: { width: 64, height: 144, x: 96, y: 96 },
});

export const GROUND_ART = Object.freeze({
  key: 'ground-seamless', url: './assets/game/ground/ground-tile.png',
  width: 1024, height: 256, visibleHeight: 160,
});

export function loadNativePlayer(scene, url = PLAYER_ART.url) {
  scene.load.spritesheet(PLAYER_ART.key, url, {
    frameWidth: PLAYER_ART.frameWidth, frameHeight: PLAYER_ART.frameHeight,
    startFrame: 0, endFrame: PLAYER_ART.count - 1,
  });
  scene.load.image(GROUND_ART.key, GROUND_ART.url);
}

export class NativePlayer {
  constructor(scene, model, ground = 560) {
    this.scene = scene; this.model = model; this.ground = ground;
    const a = PLAYER_ART, image = scene.textures.get(a.key).getSourceImage();
    if (image.width !== 1280 || image.height !== 512) {
      throw new Error('Goku: a folha deve ter 1280 × 512, com 10 células de 256 × 256.');
    }
    if (!scene.anims.exists(a.animation)) scene.anims.create({
      // Phaser 4 uses absolute frame durations, not additions to msPerFrame.
      key: a.animation, frames: a.durations.map((ms, frame) => ({key:a.key,frame,duration:ms})),
      frameRate: a.fps, repeat: -1, skipMissedFrames: true,
    });
    this.echo = scene.add.sprite(280, ground, a.key, 0)
      .setOrigin(.5, a.baseline / a.frameHeight).setScale(a.scale).setAlpha(0);
    this.sprite = scene.physics.add.sprite(280, ground, a.key, 0)
      .setOrigin(.5, a.baseline / a.frameHeight).setScale(a.scale);
    // A very short, low-opacity previous-frame echo softens hard sprite swaps.
    // It is presentation-only: the Arcade body remains on the main sprite.
    scene.world.add([this.echo, this.sprite]);
    this.sprite.body.setSize(a.body.width, a.body.height, false).setOffset(a.body.x, a.body.y);
    this.sprite.body.setMaxVelocity(0, 1400);
    this.floors = scene.physics.add.staticGroup();
    this.collider = scene.physics.add.collider(this.sprite, this.floors);
    this.floorViews = [];
    this.reset();
    scene.events.once('shutdown', () => this.destroy());
  }

  reset() {
    this.model.x = 280;
    this.sprite.body.reset(280, this.ground);
    this.sprite.body.setVelocity(0, 0);
    this.lastFoot = this.ground;
    this.elapsed = 0;
    this.echoLife = 0;
    this.lastRenderedFrame = 0;
    this.echo.setAlpha(0);
  }

  get box() {
    const b = this.sprite.body;
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }

  syncFloor(track) {
    const visible = track.segments.filter(s => s.end - track.distance > -100 && s.start - track.distance < 1380);
    visible.forEach((s, i) => {
      let floor = this.floorViews[i];
      if (!floor) {
        floor = this.scene.add.tileSprite(0, this.ground, 1, GROUND_ART.visibleHeight, GROUND_ART.key).setOrigin(0);
        this.scene.groundLayer.add(floor);
        this.floors.add(floor);
        floor.body.checkCollision.left = floor.body.checkCollision.right = floor.body.checkCollision.down = false;
        this.floorViews.push(floor);
      }
      floor.setVisible(true).setPosition(s.start - track.distance, this.ground)
        .setSize(s.end - s.start, GROUND_ART.visibleHeight);
      floor.body.enable = true;
      floor.body.updateFromGameObject();
    });
    this.floorViews.slice(visible.length).forEach(f => { f.setVisible(false); f.body.enable = false; });
  }

  update(dt, track) {
    const p = this.model, b = this.sprite.body;
    this.syncFloor(track);
    // The game model can request a respawn, but never integrates physics Y.
    if (Math.abs(p.foot - this.lastFoot) > .01) b.reset(p.x, p.foot);
    const wasGrounded = p.grounded;
    p.coyote = p.grounded ? .09 : Math.max(0, p.coyote - dt);
    let jumped = 0;
    if (p.buffer > 0 && (p.grounded || p.coyote > 0 || p.jumps > 0)) {
      jumped = p.grounded || p.coyote > 0 ? 1 : 2;
      b.setVelocityY(jumped === 1 ? -760 : -650);
      p.jumps = jumped === 1 ? 1 : 0;
      p.grounded = false; p.coyote = 0; p.buffer = 0; p.airTime = 0;
    }
    p.buffer = Math.max(0, p.buffer - dt);
    b.setGravityY(b.velocity.y > 0 ? 3400 : 2600);
    const impactSpeed = b.velocity.y;
    // One fixed physics step per model step. No second automatic update.
    this.elapsed += dt * 1000;
    this.scene.physics.world.update(this.elapsed, dt * 1000);
    this.scene.physics.world.postUpdate();
    this.echoLife = Math.max(0, this.echoLife - dt);
    this.echo.setAlpha(.14 * Math.min(1, this.echoLife / .042));
    p.foot = this.lastFoot = b.bottom; p.vy = b.velocity.y;
    p.grounded = b.blocked.down;
    const landed = !wasGrounded && p.grounded;
    if (p.grounded) { p.jumps = 2; p.airTime = 0; }
    else p.airTime += dt;
    if (landed) p.landTime = .065;
    return { jumped, landed, stepped: false, impact: Math.min(1, Math.max(.2, impactSpeed / 1050)) };
  }

  render(playing) {
    const p = this.model, s = this.sprite;
    s.setVisible(this.scene.model.state !== 'menu');
    if (!playing) { s.anims.pause(); this.echo.setAlpha(0); return; }
    if (s.anims.isPaused) s.anims.resume();
    const speedScale = PLAYER_ART.playbackRate * this.scene.model.phase.speed / 335;
    s.anims.timeScale = speedScale;
    if (p.grounded) {
      s.play(PLAYER_ART.animation, true);
      const frame = Number(s.frame.name);
      if (frame !== this.lastRenderedFrame) {
        this.echo.setFrame(this.lastRenderedFrame).setPosition(s.x - 1.25, s.y);
        this.echoLife = .042;
        this.lastRenderedFrame = frame;
      }
      // Sub-degree movement around the foot pivot gives the torso a continuous
      // weight shift without moving the collision body or the ground contact.
      const cycle = .34 / speedScale;
      s.setAngle(Math.sin(this.scene.model.time / cycle * Math.PI * 2) * .32);
      this.echo.setAngle(s.angle).setVisible(true);
    }
    else {
      // Use the GIF's airborne poses, never a full run loop while jumping.
      s.stop().setFrame(p.vy < 0 ? 3 : 8).setAngle(0);
      this.echo.setAlpha(0).setVisible(false);
    }
    if (p.hurtTime > 0) s.setTint(0xffb6a3); else s.clearTint();
  }

  destroy() {
    this.collider.destroy();
    this.floorViews.forEach(f => f.destroy());
    this.floors.destroy();
    this.echo.destroy();
    this.sprite.destroy();
  }
}
