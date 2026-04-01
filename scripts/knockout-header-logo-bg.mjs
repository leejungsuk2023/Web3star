/**
 * Remove outer black frame from header logo PNG via corner flood-fill (true alpha).
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'src', 'assets', 'web3star-header-shield-logo.png');

const FUZZ = 56; // corner-connected matte black / letterboxing

function isBg(r, g, b) {
  return r < FUZZ && g < FUZZ && b < FUZZ;
}

const image = sharp(pngPath);
const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const stride = 4;
const idx = (x, y) => (y * w + x) * stride;

const visited = new Uint8Array(w * h);
const queue = [];

function tryPush(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const p = y * w + x;
  if (visited[p]) return;
  const i = idx(x, y);
  if (!isBg(data[i], data[i + 1], data[i + 2])) return;
  visited[p] = 1;
  queue.push(x, y);
}

const seeds = [
  [0, 0],
  [w - 1, 0],
  [0, h - 1],
  [w - 1, h - 1],
];
for (const [sx, sy] of seeds) tryPush(sx, sy);

while (queue.length) {
  const y = queue.pop();
  const x = queue.pop();
  const i = idx(x, y);
  data[i + 3] = 0;
  tryPush(x + 1, y);
  tryPush(x - 1, y);
  tryPush(x, y + 1);
  tryPush(x, y - 1);
}

// Trim very dark pixels that touch transparency (removes leftover matte box edge)
const DARK = 58; // only strip pixels this dark that touch alpha=0 (matte fringe)
const neigh = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
for (let pass = 0; pass < 6; pass++) {
  let changed = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (data[i + 3] === 0) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      if (r + g + b > DARK) continue;
      let touchesClear = false;
      for (const [dx, dy] of neigh) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
          touchesClear = true;
          break;
        }
        if (data[idx(nx, ny) + 3] === 0) {
          touchesClear = true;
          break;
        }
      }
      if (touchesClear) {
        data[i + 3] = 0;
        changed = true;
      }
    }
  }
  if (!changed) break;
}

const outBuf = await sharp(data, {
  raw: { width: w, height: h, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toBuffer();

const { writeFile } = await import('fs/promises');
await writeFile(pngPath, outBuf);

console.log('OK: knocked out corner-connected black →', pngPath);
