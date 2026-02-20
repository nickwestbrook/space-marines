import { initInput, clearJustPressed } from './input';
import { drawTiles, LEVEL_WIDTH } from './level';
import { createCamera, updateCamera } from './camera';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import type { Projectile } from './entities/Projectile';
import { updateProjectiles, drawProjectiles } from './entities/Projectile';
import { checkMeleeHits, checkProjectileHits } from './entities/Enemy';
import { Grenade, Explosion, drawExplosions, updateExplosions } from './entities/Grenade';

export type GameStatus = 'playing' | 'dead' | 'win';

export interface GameState {
  hp: number;
  ammo: number;
  score: number;
  grenades: number;
  status: GameStatus;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId = 0;
  private lastTime = 0;
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private grenades: Grenade[] = [];
  private explosions: Explosion[] = [];
  private camera = createCamera();
  private onStateChange: (s: GameState) => void;
  private lastEmittedState = '';
  paused = true;

  constructor(canvas: HTMLCanvasElement, onStateChange: (s: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    initInput();
    this.reset();
  }

  reset() {
    this.player = new Player();
    this.projectiles = [];
    this.grenades = [];
    this.explosions = [];
    this.lastEmittedState = '';
    this.paused = true;
    this.enemies = [
      // Drones
      new Enemy(300, 380, 'drone'),
      new Enemy(550, 380, 'drone'),
      new Enemy(800, 200, 'drone'),
      new Enemy(1100, 380, 'drone'),
      new Enemy(1400, 260, 'drone'),
      new Enemy(1700, 380, 'drone'),
      new Enemy(1900, 380, 'drone'),
      // Gunners
      new Enemy(650, 406, 'gunner'),
      new Enemy(1050, 406, 'gunner'),
      new Enemy(1550, 406, 'gunner'),
    ];
    this.camera = createCamera();
  }

  start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    cancelAnimationFrame(this.rafId);
  }

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    if (!this.paused) this.update(dt);
    this.render();
    clearJustPressed();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private spawnProjectile = (p: Projectile) => {
    this.projectiles.push(p);
  };

  private spawnGrenade = (g: Grenade) => {
    this.grenades.push(g);
  };

  private update(dt: number) {
    const p = this.player;
    p.update(dt, this.spawnProjectile, this.spawnGrenade);

    for (const e of this.enemies) {
      e.update(dt, p, this.spawnProjectile);
    }
    this.enemies = this.enemies.filter(e => e.active);

    updateProjectiles(this.projectiles, dt);
    this.projectiles = this.projectiles.filter(p => p.active);

    // Update grenades
    for (const g of this.grenades) {
      g.update(dt, this.enemies, this.explosions);
    }
    this.grenades = this.grenades.filter(g => g.active);
    this.enemies = this.enemies.filter(e => e.active);
    this.explosions = updateExplosions(this.explosions, dt);

    checkMeleeHits(p, this.enemies);
    checkProjectileHits(p, this.enemies, this.projectiles);

    updateCamera(this.camera, p.rect.x + p.rect.w / 2, this.canvas.width);

    // Check win: reach end of level
    const status: GameStatus = p.dead ? 'dead' : p.rect.x + p.rect.w >= LEVEL_WIDTH - 64 ? 'win' : 'playing';

    const stateKey = `${p.hp},${p.ammo},${p.score},${p.grenades},${status}`;
    if (stateKey !== this.lastEmittedState) {
      this.lastEmittedState = stateKey;
      this.onStateChange({ hp: p.hp, ammo: p.ammo, score: p.score, grenades: p.grenades, status });
    }
  }

  private render() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const cx = this.camera.x;
    const t = Date.now();

    // Deep space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#05050f');
    grad.addColorStop(0.6, '#0a0a28');
    grad.addColorStop(1, '#0d0d35');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Nebula clouds (parallax layer 0.05)
    const nebOff = cx * 0.05;
    for (let i = 0; i < 5; i++) {
      const nx = ((i * 379 - nebOff) % (W + 300)) - 150;
      const ny = (i * 127) % (H * 0.7);
      const nr = 80 + (i * 47) % 60;
      const nebGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      const hue = [260, 200, 280, 220, 240][i];
      nebGrad.addColorStop(0, `hsla(${hue},80%,30%,0.12)`);
      nebGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad;
      ctx.beginPath();
      ctx.ellipse(nx, ny, nr * 1.6, nr, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant planet (parallax 0.02)
    const planetX = 220 - cx * 0.02;
    const planetY = 80;
    const planetGrad = ctx.createRadialGradient(planetX - 12, planetY - 12, 5, planetX, planetY, 55);
    planetGrad.addColorStop(0, '#4a6fa5');
    planetGrad.addColorStop(0.6, '#1a2f5a');
    planetGrad.addColorStop(1, '#0a1020');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 55, 0, Math.PI * 2);
    ctx.fill();
    // Planet ring
    ctx.save();
    ctx.translate(planetX, planetY);
    ctx.rotate(-0.3);
    ctx.strokeStyle = 'rgba(100,150,220,0.25)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Stars (two parallax layers)
    for (let i = 0; i < 120; i++) {
      const layer = i < 80 ? 0.08 : 0.2;
      const starX = ((i * 137 + 17 - cx * layer) % (W + 4) + W + 4) % (W + 4) - 2;
      const starY = (i * 97 + i * 13) % H;
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t / 1000 + i));
      const size = i < 80 ? 1 : 1.5;
      ctx.fillStyle = `rgba(255,255,255,${twinkle * (i < 80 ? 0.5 : 0.8)})`;
      ctx.fillRect(starX, starY, size, size);
    }

    // Distant city/structure silhouette (parallax 0.3)
    const cityOff = cx * 0.3;
    ctx.fillStyle = 'rgba(10,15,30,0.9)';
    for (let b = 0; b < 18; b++) {
      const bx = ((b * 211 - cityOff) % (W + 200) + W + 200) % (W + 200) - 100;
      const bh = 30 + (b * 73) % 80;
      const bw = 18 + (b * 37) % 30;
      ctx.fillRect(bx, H - bh - 80, bw, bh);
      // Window lights
      ctx.fillStyle = `rgba(0,200,255,${0.15 + 0.1 * Math.sin(t / 800 + b)})`;
      for (let wy = H - bh - 75; wy < H - 85; wy += 10) {
        ctx.fillRect(bx + 4, wy, 4, 4);
        ctx.fillRect(bx + bw - 8, wy, 4, 4);
      }
      ctx.fillStyle = 'rgba(10,15,30,0.9)';
    }

    // Ground fog/glow
    const fogGrad = ctx.createLinearGradient(0, H - 110, 0, H);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(1, 'rgba(0,30,60,0.5)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, H - 110, W, 110);

    drawTiles(ctx, cx);
    drawProjectiles(ctx, this.projectiles, cx);
    for (const g of this.grenades) g.draw(ctx, cx);
    drawExplosions(ctx, this.explosions, cx);
    for (const e of this.enemies) e.draw(ctx, cx);
    this.player.draw(ctx, cx);

    // Win zone — glowing portal
    const wz = LEVEL_WIDTH - 96 - cx;
    const portalPulse = 0.7 + 0.3 * Math.sin(t / 400);
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 30 * portalPulse;
    ctx.strokeStyle = `rgba(0,255,136,${portalPulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(wz + 8, 60, 48, H - 180, 8);
    ctx.stroke();
    ctx.fillStyle = `rgba(0,255,136,${0.08 * portalPulse})`;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', wz + 32, 52);
    ctx.textAlign = 'left';
  }
}
