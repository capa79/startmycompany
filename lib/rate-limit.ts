// Enkel bremse mot passordgjetting (i minnet, én serverprosess).
// Etter 8 feil på samme e-post eller 30 fra samme IP stenges innlogging i 15 minutter.
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map<string, { n: number; first: number }>();

function limitFor(key: string) {
  return key.startsWith("ip:") ? 30 : 8;
}

export function tooManyFails(...keys: string[]): boolean {
  const now = Date.now();
  return keys.some((k) => {
    const f = fails.get(k);
    if (!f) return false;
    if (now - f.first > WINDOW_MS) {
      fails.delete(k);
      return false;
    }
    return f.n >= limitFor(k);
  });
}

export function noteFail(...keys: string[]) {
  const now = Date.now();
  for (const k of keys) {
    const f = fails.get(k);
    if (!f || now - f.first > WINDOW_MS) fails.set(k, { n: 1, first: now });
    else f.n++;
  }
  if (fails.size > 10_000) fails.clear();
}

export function clearFails(...keys: string[]) {
  for (const k of keys) fails.delete(k);
}
