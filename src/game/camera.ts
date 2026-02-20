import { LEVEL_WIDTH } from './level';

export interface Camera {
  x: number;
}

export function createCamera(): Camera {
  return { x: 0 };
}

export function updateCamera(camera: Camera, targetX: number, canvasWidth: number) {
  const desired = targetX - canvasWidth / 2;
  camera.x = Math.max(0, Math.min(desired, LEVEL_WIDTH - canvasWidth));
}
