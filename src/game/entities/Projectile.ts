import type { Rect } from '../physics';

export interface Projectile {
  rect: Rect;
  vx: number;
  fromPlayer: boolean;
  active: boolean;
}

export function updateProjectiles(projectiles: Projectile[], dt: number) {
  for (const p of projectiles) {
    if (!p.active) continue;
    p.rect.x += p.vx * dt;
    // Deactivate if off screen (simple culling — 5000px level width)
    if (p.rect.x < -50 || p.rect.x > 5000) p.active = false;
  }
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[], cameraX: number) {
  for (const p of projectiles) {
    if (!p.active) continue;
    const px = p.rect.x - cameraX + p.rect.w / 2;
    const py = p.rect.y + p.rect.h / 2;
    const color = p.fromPlayer ? '#00e5ff' : '#ff4040';
    const trailColor = p.fromPlayer ? 'rgba(0,180,255,0.15)' : 'rgba(255,60,60,0.15)';

    // Trail
    ctx.fillStyle = trailColor;
    const trailLen = 28;
    const trailDir = p.vx > 0 ? -1 : 1;
    ctx.beginPath();
    ctx.ellipse(px + trailDir * trailLen / 2, py, trailLen / 2, p.rect.h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;

    // Core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(px, py, p.rect.w / 2 - 1, p.rect.h / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow ring
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(px, py, p.rect.w / 2 + 2, p.rect.h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}
