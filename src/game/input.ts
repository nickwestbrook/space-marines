const keys: Record<string, boolean> = {};
const justPressed: Record<string, boolean> = {};

let initialized = false;

export function initInput() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
}

export function isDown(code: string) {
  return !!keys[code];
}

export function wasPressed(code: string) {
  return !!justPressed[code];
}

export function clearJustPressed() {
  for (const k in justPressed) delete justPressed[k];
}
