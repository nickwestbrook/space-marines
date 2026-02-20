import type { Rect } from '../physics';
import { GRAVITY, resolveTileCollisions, rectsOverlap } from '../physics';
import { isSolidTile } from '../level';
import type { Projectile } from './Projectile';
import type { Player } from './Player';

const DRONE_SPEED = 90;
const DRONE_CHASE_RANGE = 220;
const DRONE_ATTACK_RANGE = 40;
const DRONE_ATTACK_COOLDOWN = 1.2;

const GUNNER_SHOOT_RANGE = 400;
const GUNNER_SHOOT_COOLDOWN = 2.0;

export type EnemyType = 'drone' | 'gunner';

export class Enemy {
  rect: Rect;
  type: EnemyType;
  hp: number;
  vx = 0;
  vy = 0;
  facingRight = false;
  active = true;
  onGround = false;
  patrolDir = 1;
  patrolTimer = 0;
  attackCooldown = 0;
  deathTimer = 0;

  constructor(x: number, y: number, type: EnemyType) {
    this.type = type;
    this.rect = { x, y, w: type === 'drone' ? 32 : 36, h: type === 'drone' ? 32 : 40 };
    this.hp = type === 'drone' ? 2 : 3;
  }

  get isDead() { return this.hp <= 0; }

  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.hp -= amount;
  }

  update(dt: number, player: Player, spawnProjectile: (p: Projectile) => void) {
    if (!this.active) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer > 0.6) this.active = false;
      return;
    }

    const dx = player.rect.x - this.rect.x;
    const dist = Math.abs(dx);
    const dy = player.rect.y - this.rect.y;
    const dist2D = Math.sqrt(dx * dx + dy * dy);

    if (this.type === 'drone') {
      this.updateDrone(dt, player, dx, dist, dist2D);
    } else {
      this.updateGunner(dt, player, dx, dist, spawnProjectile);
    }

    // Gravity & collision
    this.vy += GRAVITY * dt;
    this.rect.x += this.vx * dt;
    this.rect.y += this.vy * dt;
    const result = resolveTileCollisions(this.rect, this.vx, this.vy, isSolidTile);
    this.vx = result.outVx;
    this.vy = result.outVy;
    this.onGround = result.hitFloor;
  }

  private updateDrone(dt: number, player: Player, dx: number, dist: number, dist2D: number) {
    if (dist2D < DRONE_CHASE_RANGE) {
      // Chase
      this.vx = dx > 0 ? DRONE_SPEED : -DRONE_SPEED;
      this.facingRight = dx > 0;
      // Melee attack — require horizontal proximity AND vertical rects actually overlap
      const vertOverlap =
        player.rect.y < this.rect.y + this.rect.h + 16 &&
        player.rect.y + player.rect.h > this.rect.y - 16;
      if (dist < DRONE_ATTACK_RANGE && vertOverlap && this.attackCooldown === 0) {
        this.attackCooldown = DRONE_ATTACK_COOLDOWN;
        player.takeDamage();
      }
    } else {
      // Patrol
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolDir *= -1;
        this.patrolTimer = 1.5 + Math.random();
      }
      this.vx = this.patrolDir * (DRONE_SPEED * 0.5);
      this.facingRight = this.patrolDir > 0;
    }
  }

  private updateGunner(
    _dt: number, player: Player, dx: number, dist: number,
    spawnProjectile: (p: Projectile) => void
  ) {
    this.vx = 0;
    this.facingRight = dx > 0;
    // Only shoot if player's rect vertically overlaps with the gunner (same floor level)
    const vertOverlap =
      player.rect.y < this.rect.y + this.rect.h + 20 &&
      player.rect.y + player.rect.h > this.rect.y - 20;
    if (dist < GUNNER_SHOOT_RANGE && vertOverlap && this.attackCooldown === 0) {
      this.attackCooldown = GUNNER_SHOOT_COOLDOWN;
      spawnProjectile({
        rect: {
          x: this.facingRight ? this.rect.x + this.rect.w : this.rect.x - 12,
          y: this.rect.y + 12,
          w: 12, h: 8,
        },
        vx: this.facingRight ? 350 : -350,
        fromPlayer: false,
        active: true,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (!this.active) return;
    const sx = Math.round(this.rect.x - cameraX);
    const sy = Math.round(this.rect.y);
    const { w, h } = this.rect;
    const cx = sx + w / 2;
    const cy = sy + h / 2;

    const alpha = this.isDead ? Math.max(0, 1 - this.deathTimer / 0.6) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.type === 'drone') {
      // Hover bob
      const bob = Math.sin(Date.now() / 300) * 3;

      // Wing energy trails
      ctx.shadowColor = '#b044ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#c060ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + bob);
      ctx.lineTo(sx - 14, cy - 6 + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + bob);
      ctx.lineTo(sx + w + 14, cy - 6 + bob);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Body hexagon-ish
      const bodyGrad = ctx.createRadialGradient(cx, cy + bob, 2, cx, cy + bob, 18);
      bodyGrad.addColorStop(0, '#c060ff');
      bodyGrad.addColorStop(1, '#5a0a9a');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const r = 14;
        const px = cx + Math.cos(angle) * r;
        const py = cy + bob + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Glowing eye
      ctx.shadowColor = '#ffee00';
      ctx.shadowBlur = 20;
      const eyeDir = this.facingRight ? 6 : -6;
      ctx.fillStyle = '#ffee00';
      ctx.beginPath();
      ctx.arc(cx + eyeDir, cy - 2 + bob, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(cx + eyeDir, cy - 2 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Claws
      ctx.fillStyle = '#7a30cc';
      ctx.fillRect(cx - 10, sy + h - 8 + bob, 6, 8);
      ctx.fillRect(cx + 4, sy + h - 8 + bob, 6, 8);

    } else {
      // Robot gunner
      // Legs
      ctx.fillStyle = '#6a1010';
      ctx.fillRect(sx + 4, sy + h - 14, 10, 14);
      ctx.fillRect(sx + w - 14, sy + h - 14, 10, 14);

      // Body
      const bodyGrad = ctx.createLinearGradient(sx, sy + 10, sx + w, sy + 10);
      bodyGrad.addColorStop(0, '#7a1515');
      bodyGrad.addColorStop(0.5, '#c0392b');
      bodyGrad.addColorStop(1, '#7a1515');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(sx + 2, sy + 10, w - 4, h - 24, 3);
      ctx.fill();

      // Shoulder cannon
      const gunDir = this.facingRight ? 1 : -1;
      const gunBaseX = this.facingRight ? sx + w - 4 : sx + 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(gunBaseX - 4, sy + 14, 8, 12);
      ctx.fillStyle = '#555';
      ctx.fillRect(gunBaseX + (this.facingRight ? 0 : -18), sy + 17, 18, 6);
      // Muzzle glow
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(gunBaseX + gunDir * 18, sy + 18, 4, 4);
      ctx.shadowBlur = 0;

      // Head
      ctx.fillStyle = '#8b1a1a';
      ctx.beginPath();
      ctx.roundRect(sx + 5, sy, w - 10, 14, [4, 4, 1, 1]);
      ctx.fill();

      // Visor
      ctx.shadowColor = '#ff6060';
      ctx.shadowBlur = 14;
      const vx2 = this.facingRight ? sx + w - 16 : sx + 4;
      const visorGrad = ctx.createLinearGradient(vx2, sy + 3, vx2 + 12, sy + 10);
      visorGrad.addColorStop(0, '#ff6060');
      visorGrad.addColorStop(1, '#880000');
      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.roundRect(vx2, sy + 3, 12, 7, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // HP bar
    if (!this.isDead) {
      const maxHp = this.type === 'drone' ? 2 : 3;
      const barW = w;
      const barX = sx;
      const barY = sy - 10;
      ctx.fillStyle = '#111';
      ctx.fillRect(barX, barY, barW, 5);
      const pct = this.hp / maxHp;
      ctx.shadowColor = pct > 0.5 ? '#0f0' : '#f80';
      ctx.shadowBlur = 6;
      ctx.fillStyle = pct > 0.5 ? '#2ecc71' : '#e67e22';
      ctx.fillRect(barX, barY, barW * pct, 5);
      ctx.shadowBlur = 0;
    }
  }
}

/** Check if player melee hits an enemy */
export function checkMeleeHits(player: Player, enemies: Enemy[]) {
  if (!player.meleeActive) return;
  for (const e of enemies) {
    if (!e.active || e.isDead) continue;
    if (rectsOverlap(player.meleeHitbox, e.rect)) {
      e.takeDamage(1);
      if (e.isDead) player.score++;
    }
  }
}

/** Check if enemy projectiles hit the player, and player projectiles hit enemies */
export function checkProjectileHits(player: Player, enemies: Enemy[], projectiles: Projectile[]) {
  for (const p of projectiles) {
    if (!p.active) continue;
    if (p.fromPlayer) {
      for (const e of enemies) {
        if (!e.active || e.isDead) continue;
        if (rectsOverlap(p.rect, e.rect)) {
          p.active = false;
          e.takeDamage(1);
          if (e.isDead) player.score++;
        }
      }
    } else {
      if (rectsOverlap(p.rect, player.rect)) {
        p.active = false;
        player.takeDamage();
      }
    }
  }
}
