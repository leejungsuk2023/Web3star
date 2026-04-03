/**
 * Header shield PNG: kill white/gray matte on the outer silhouette.
 * - Flood from edges through very light pixels only (does not cross dark shield body)
 * - Iterative: light fringe touching transparency → transparent or black matte
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, '../src/assets/web3star-header-shield-logo.png');

function isNearWhite(r, g, b) {
  return r >= 224 && g >= 224 && b >= 224;
}

/** Expand through anti-alias ring; stops at real shield black (low L) */
function isFloodWalkable(r, g, b) {
  if (isNearWhite(r, g, b)) return true;
  const L = (r + g + b) / 3;
  const d = Math.max(r, g, b) - Math.min(r, g, b);
  return L >= 200 && d <= 46;
}

function isRedText(r, g, b) {
  return r > g + 36 && r > b + 36 && r > 85;
}

function touchesTransparent(alphaBuf, i, w, h) {
  const x = i % w;
  const y = (i / w) | 0;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nx = x + dx,
      ny = y + dy;
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) return true;
    if (alphaBuf[ny * w + nx] === 0) return true;
  }
  return false;
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const w = info.width;
const h = info.height;
const out = Buffer.from(data);
const n = w * h;

const bg = new Uint8Array(n);
const queue = [];

function trySeedEdge(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const i = y * w + x;
  if (bg[i]) return;
  const o = i * 4;
  const r = data[o],
    g = data[o + 1],
    b = data[o + 2];
  if (!isFloodWalkable(r, g, b)) return;
  bg[i] = 1;
  queue.push(i);
}

for (let x = 0; x < w; x++) {
  trySeedEdge(x, 0);
  trySeedEdge(x, h - 1);
}
for (let y = 0; y < h; y++) {
  trySeedEdge(0, y);
  trySeedEdge(w - 1, y);
}

for (let qi = 0; qi < queue.length; qi++) {
  const i = queue[qi];
  const x = i % w;
  const y = (i / w) | 0;
  for (const [nx, ny] of [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ]) {
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
    const ni = ny * w + nx;
    if (bg[ni]) continue;
    const o = ni * 4;
    if (isFloodWalkable(data[o], data[o + 1], data[o + 2])) {
      bg[ni] = 1;
      queue.push(ni);
    }
  }
}

for (let i = 0; i < n; i++) {
  if (!bg[i]) continue;
  const o = i * 4;
  out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
}

for (let pass = 0; pass < 20; pass++) {
  const a = Buffer.alloc(n);
  for (let i = 0; i < n; i++) a[i] = out[i * 4 + 3];

  let changed = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const o = i * 4;
      if (a[i] === 0) continue;
      if (!touchesTransparent(a, i, w, h)) continue;

      const r = out[o],
        g = out[o + 1],
        b = out[o + 2];
      if (isRedText(r, g, b)) continue;

      const L = (r + g + b) / 3;
      const d = Math.max(r, g, b) - Math.min(r, g, b);
      if (d > 55) continue;

      if (L >= 238) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
        changed++;
      } else if (L >= 108) {
        out[o] = out[o + 1] = out[o + 2] = 0;
        out[o + 3] = 255;
        changed++;
      }
    }
  }
  if (changed === 0) break;
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .png({ compressionLevel: 9, effort: 6 })
  .toFile(input);

console.log('OK:', input);
