import { GRAVITY } from '../physics';
import type { Enemy } from './Enemy';

const FUSE_TIME = 2.2;       // seconds before exploding
const EXPLODE_RADIUS = 110;  // pixels
export const GROUND_Y = 14 * 32 - 12; // landing surface y

export interface Explosion {
  x: number;
  y: number;
  timer: number;
}

/** Simulate grenade arc and return array of {x,y} points + landing point */
export function simulateArc(
  startX: number, startY: number, vx: number, vy: number
): { dots: {x: number; y: number}[]; landing: {x: number; y: number} } {
  const dots: {x: number; y: number}[] = [];
  const step = 0.06;
  let t = 0;
  let px = startX, py = startY;
  let lpx = startX, lpy = startY;
  while (t < 3) {
    t += step;
    px = startX + vx * t;
    py = startY + vy * t + 0.5 * GRAVITY * t * t;
    if (py >= GROUND_Y) { lpx = px; lpy = GROUND_Y; break; }
    if (t % 0.18 < step) dots.push({ x: px, y: py });
    lpx = px; lpy = py;
  }
  return { dots, landing: { x: lpx, y: lpy } };
}

export class Grenade {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active = true;
  exploded = false;
  fuse = FUSE_TIME;
  rotation = 0;

  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }

  update(dt: number, enemies: Enemy[], explosions: Explosion[]) {
    if (!this.active) return;

    this.fuse -= dt;
    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.vx * dt * 0.05;

    // Bounce off ground (row 14 = y:448)
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy *= -0.35;
      this.vx *= 0.6;
    }

    // Explode when fuse runs out
    if (this.fuse <= 0) {
      this.explode(enemies, explosions);
    }
  }

  explode(enemies: Enemy[], explosions: Explosion[]) {
    if (this.exploded) return;
    this.exploded = true;
    this.active = false;

    // Damage all enemies in radius
    for (const e of enemies) {
      if (!e.active || e.isDead) continue;
      const ex = e.rect.x + e.rect.w / 2;
      const ey = e.rect.y + e.rect.h / 2;
      const dist = Math.sqrt((ex - this.x) ** 2 + (ey - this.y) ** 2);
      if (dist <= EXPLODE_RADIUS) {
        e.takeDamage(99); // instant kill
        e.active = false; // skip death animation for satisfying boom
      }
    }

    explosions.push({ x: this.x, y: this.y, timer: 1.0 });
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (!this.active) return;
    const sx = this.x - cameraX;
    const sy = this.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rotation);

    // Grenade body
    ctx.fillStyle = '#4a7c3f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pin ring
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-3, -8, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Fuse glow — flickers faster as fuse expires
    const flashRate = 3 + (1 - Math.max(0, this.fuse / 2.2)) * 12;
    if (Math.sin(Date.now() / (1000 / flashRate)) > 0) {
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

export function drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[], cameraX: number) {
  for (const exp of explosions) {
    const sx = exp.x - cameraX;
    const t = 1 - exp.timer; // 0=just exploded, 1=done
    const radius = EXPLODE_RADIUS * (0.3 + t * 0.7);

    // Outer shockwave ring
    ctx.save();
    ctx.globalAlpha = exp.timer * 0.6;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 4 * exp.timer;
    ctx.beginPath();
    ctx.arc(sx, exp.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner fireball
    const fireGrad = ctx.createRadialGradient(sx, exp.y, 0, sx, exp.y, radius * 0.7);
    fireGrad.addColorStop(0, `rgba(255,255,200,${exp.timer * 0.9})`);
    fireGrad.addColorStop(0.4, `rgba(255,140,0,${exp.timer * 0.7})`);
    fireGrad.addColorStop(1, `rgba(255,30,0,0)`);
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(sx, exp.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export function updateExplosions(explosions: Explosion[], dt: number) {
  for (const e of explosions) e.timer -= dt * 1.8;
  return explosions.filter(e => e.timer > 0);
}
