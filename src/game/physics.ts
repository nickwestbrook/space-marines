export const GRAVITY = 1800; // px/s²
export const TILE_SIZE = 32;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Returns tile world rect for a given tile grid position */
export function tileRect(col: number, row: number): Rect {
  return { x: col * TILE_SIZE, y: row * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
}

/**
 * Resolve entity rect against solid tiles.
 * Modifies entity position in place and returns { hitFloor, hitCeiling, hitWall }.
 */
export function resolveTileCollisions(
  rect: Rect,
  vx: number,
  vy: number,
  isSolid: (col: number, row: number) => boolean
): { hitFloor: boolean; hitCeiling: boolean; hitWall: boolean; outVx: number; outVy: number } {
  let hitFloor = false;
  let hitCeiling = false;
  let hitWall = false;
  let outVx = vx;
  let outVy = vy;

  // Vertical pass
  const minCol = Math.floor(rect.x / TILE_SIZE);
  const maxCol = Math.floor((rect.x + rect.w - 1) / TILE_SIZE);

  if (vy > 0) {
    const bottomRow = Math.floor((rect.y + rect.h) / TILE_SIZE);
    for (let c = minCol; c <= maxCol; c++) {
      if (isSolid(c, bottomRow)) {
        rect.y = bottomRow * TILE_SIZE - rect.h;
        outVy = 0;
        hitFloor = true;
        break;
      }
    }
  } else if (vy < 0) {
    const topRow = Math.floor(rect.y / TILE_SIZE);
    for (let c = minCol; c <= maxCol; c++) {
      if (isSolid(c, topRow)) {
        rect.y = (topRow + 1) * TILE_SIZE;
        outVy = 0;
        hitCeiling = true;
        break;
      }
    }
  }

  // Horizontal pass
  const minRow = Math.floor(rect.y / TILE_SIZE);
  const maxRow = Math.floor((rect.y + rect.h - 1) / TILE_SIZE);

  if (vx > 0) {
    const rightCol = Math.floor((rect.x + rect.w) / TILE_SIZE);
    for (let r = minRow; r <= maxRow; r++) {
      if (isSolid(rightCol, r)) {
        rect.x = rightCol * TILE_SIZE - rect.w;
        outVx = 0;
        hitWall = true;
        break;
      }
    }
  } else if (vx < 0) {
    const leftCol = Math.floor(rect.x / TILE_SIZE);
    for (let r = minRow; r <= maxRow; r++) {
      if (isSolid(leftCol, r)) {
        rect.x = (leftCol + 1) * TILE_SIZE;
        outVx = 0;
        hitWall = true;
        break;
      }
    }
  }

  return { hitFloor, hitCeiling, hitWall, outVx, outVy };
}
