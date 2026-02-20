import type { Rect } from '../physics';
import { GRAVITY, resolveTileCollisions } from '../physics';
import { isDown, wasPressed } from '../input';
import { isSolidTile } from '../level';
import type { Projectile } from './Projectile';
import { Grenade } from './Grenade';

const SPEED = 220;
const JUMP_VEL = -560;
const MAX_HP = 3;
const MELEE_RANGE = 50;
const MELEE_COOLDOWN = 0.4;
const SHOOT_COOLDOWN = 0.5;
const MAX_AMMO = 10;
const MAX_GRENADES = 5;
const GRENADE_COOLDOWN = 0.5;
const INVINCIBLE_DURATION = 0.8;

export type PlayerAnim= 'idle' | 'run' | 'jump' | 'attack' | 'hurt' | 'dead';

export class Player {
  rect: Rect = { x: 64, y: 300, w: 28, h: 48 };
  vx = 0;
  vy = 0;
  hp = MAX_HP;
  ammo = MAX_AMMO;
  score = 0;
  facingRight = true;
  onGround = false;
  jumpsLeft = 2;
  anim: PlayerAnim = 'idle';
  animTimer = 0;
  meleeCooldown = 0;
  shootCooldown = 0;
  invincibleTimer = 0;
  meleeActive = false;
  meleeTimer = 0;
  dead = false;
  grenades = MAX_GRENADES;
  grenadeCooldown = 0;

  get meleeHitbox(): Rect {
    return {
      x: this.facingRight ? this.rect.x + this.rect.w : this.rect.x - MELEE_RANGE,
      y: this.rect.y + 8,
      w: MELEE_RANGE,
      h: 32,
    };
  }

  takeDamage() {
    if (this.invincibleTimer > 0 || this.dead) return;
    this.hp--;
    this.invincibleTimer = INVINCIBLE_DURATION;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.anim = 'dead';
    } else {
      this.anim = 'hurt';
      this.animTimer = 0.3;
    }
  }

  update(dt: number, spawnProjectile: (p: Projectile) => void, spawnGrenade: (g: Grenade) => void) {
    if (this.dead) return;

    // Timers
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.grenadeCooldown = Math.max(0, this.grenadeCooldown - dt);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    this.meleeTimer = Math.max(0, this.meleeTimer - dt);
    this.meleeActive = this.meleeTimer > 0;

    // Horizontal movement
    const left = isDown('ArrowLeft') || isDown('KeyA');
    const right = isDown('ArrowRight') || isDown('KeyD');
    this.vx = right ? SPEED : left ? -SPEED : 0;
    if (right) this.facingRight = true;
    if (left) this.facingRight = false;

    // Jump
    const jumpPressed = wasPressed('Space') || wasPressed('ArrowUp') || wasPressed('KeyW');
    if (jumpPressed && this.jumpsLeft > 0) {
      this.vy = JUMP_VEL;
      this.jumpsLeft--;
    }

    // Melee attack
    if (wasPressed('KeyZ') && this.meleeCooldown === 0) {
      this.meleeCooldown = MELEE_COOLDOWN;
      this.meleeActive = true;
      this.meleeTimer = 0.15;
      this.anim = 'attack';
      this.animTimer = MELEE_COOLDOWN;
    }

    // Ranged attack
    if (wasPressed('KeyX') && this.shootCooldown === 0 && this.ammo > 0) {
      this.shootCooldown = SHOOT_COOLDOWN;
      this.ammo--;
      spawnProjectile({
        rect: {
          x: this.facingRight ? this.rect.x + this.rect.w : this.rect.x - 12,
          y: this.rect.y + 16,
          w: 12,
          h: 8,
        },
        vx: this.facingRight ? 600 : -600,
        fromPlayer: true,
        active: true,
      });
    }

    // Grenade throw
    if (wasPressed('KeyC') && this.grenadeCooldown === 0 && this.grenades > 0) {
      this.grenadeCooldown = GRENADE_COOLDOWN;
      this.grenades--;
      spawnGrenade(new Grenade(
        this.rect.x + this.rect.w / 2,
        this.rect.y + 10,
        this.facingRight
      ));
    }

    // Gravity
    this.vy += GRAVITY * dt;

    // Move
    this.rect.x += this.vx * dt;
    this.rect.y += this.vy * dt;

    // Tile collision
    const result = resolveTileCollisions(this.rect, this.vx, this.vy, isSolidTile);
    this.vx = result.outVx;
    this.vy = result.outVy;
    this.onGround = result.hitFloor;
    if (this.onGround) this.jumpsLeft = 2;

    // Clamp to level
    if (this.rect.x < 0) this.rect.x = 0;

    // Animation
    if (this.animTimer > 0) {
      this.animTimer -= dt;
    } else {
      if (!this.onGround) this.anim = 'jump';
      else if (this.vx !== 0) this.anim = 'run';
      else this.anim = 'idle';
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = Math.round(this.rect.x - cameraX);
    const sy = Math.round(this.rect.y);
    const { w, h } = this.rect;
    const cx = sx + w / 2;

    // Flicker when invincible
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) return;

    ctx.save();
    if (!this.facingRight) {
      ctx.translate(sx + w, 0);
      ctx.scale(-1, 1);
      ctx.translate(-sx, 0);
    }

    const dead = this.dead;
    const alpha = dead ? 0.5 : 1;
    ctx.globalAlpha = alpha;

    // Thruster glow at feet when running
    if (this.onGround && Math.abs(this.vx) > 10 && !dead) {
      ctx.shadowColor = '#00cfff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(0,180,255,0.18)';
      ctx.fillRect(sx + 4, sy + h - 6, w - 8, 6);
      ctx.shadowBlur = 0;
    }

    // Legs
    const legOffset = this.onGround && Math.abs(this.vx) > 10
      ? Math.sin(Date.now() / 80) * 5 : 0;
    ctx.fillStyle = dead ? '#334' : '#1a3a5c';
    ctx.fillRect(sx + 4, sy + h - 16, 10, 16 + legOffset);
    ctx.fillRect(sx + w - 14, sy + h - 16, 10, 16 - legOffset);
    // Boot glow
    if (!dead) {
      ctx.shadowColor = '#0af';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#0af';
      ctx.fillRect(sx + 3, sy + h - 3, 12, 3);
      ctx.fillRect(sx + w - 15, sy + h - 3, 12, 3);
      ctx.shadowBlur = 0;
    }

    // Torso armor
    const torsoGrad = ctx.createLinearGradient(sx, sy + 14, sx + w, sy + 14);
    torsoGrad.addColorStop(0, dead ? '#334' : '#1e4d7a');
    torsoGrad.addColorStop(0.5, dead ? '#445' : '#2a6db0');
    torsoGrad.addColorStop(1, dead ? '#334' : '#1e4d7a');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.roundRect(sx + 2, sy + 14, w - 4, h - 30, 3);
    ctx.fill();

    // Chest piece
    ctx.fillStyle = dead ? '#445' : '#3a8fd1';
    ctx.beginPath();
    ctx.roundRect(sx + 6, sy + 18, w - 12, 14, 2);
    ctx.fill();
    // Chest reactor glow
    if (!dead) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(cx, sy + 25, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Shoulder pad
    ctx.fillStyle = dead ? '#556' : '#2a6db0';
    ctx.beginPath();
    ctx.roundRect(sx + w - 8, sy + 14, 10, 12, 2);
    ctx.fill();

    // Gun arm
    ctx.fillStyle = dead ? '#445' : '#1a3a5c';
    ctx.fillRect(sx + w - 2, sy + 22, 14, 8);
    ctx.fillStyle = dead ? '#556' : '#0af';
    ctx.fillRect(sx + w + 10, sy + 23, 6, 5);
    if (!dead) {
      ctx.shadowColor = '#0af';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#0af';
      ctx.fillRect(sx + w + 14, sy + 24, 4, 3);
      ctx.shadowBlur = 0;
    }

    // Neck
    ctx.fillStyle = dead ? '#334' : '#1a3a5c';
    ctx.fillRect(cx - 5, sy + 8, 10, 8);

    // Helmet
    const helmGrad = ctx.createLinearGradient(sx + 2, sy, sx + w - 2, sy + 14);
    helmGrad.addColorStop(0, dead ? '#445' : '#2a6db0');
    helmGrad.addColorStop(1, dead ? '#334' : '#1e4d7a');
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.roundRect(sx + 3, sy, w - 6, 16, [8, 8, 2, 2]);
    ctx.fill();

    // Visor
    if (!dead) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 16;
    }
    const visorGrad = ctx.createLinearGradient(sx + w - 14, sy + 4, sx + w - 4, sy + 12);
    visorGrad.addColorStop(0, dead ? '#334' : '#00e5ff');
    visorGrad.addColorStop(1, dead ? '#223' : '#0080aa');
    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.roundRect(sx + w - 14, sy + 4, 10, 7, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Melee flash
    if (this.meleeActive) {
      const mb = this.meleeHitbox;
      const mgx = this.facingRight ? mb.x - cameraX : mb.x - cameraX;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(255,120,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(mgx + mb.w / 2, mb.y + mb.h / 2, mb.w / 2, mb.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
