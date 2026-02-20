const keys: Record<string, boolean> = {};
const justPressed: Record<string, boolean> = {};
const justReleased: Record<string, boolean> = {};

let initialized = false;

export function initInput() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (keys[e.code]) justReleased[e.code] = true;
    keys[e.code] = false;
  });
}

export function isDown(code: string) {
  return !!keys[code];
}

export function wasPressed(code: string) {
  return !!justPressed[code];
}

export function wasReleased(code: string) {
  return !!justReleased[code];
}

export function clearJustPressed() {
  for (const k in justPressed) delete justPressed[k];
  for (const k in justReleased) delete justReleased[k];
}
