/**
 * 로고를 캔버스 중앙에 축소(contain)해 넣고 #000000 여백을 둡니다.
 * - PWA maskable / iOS / favicon
 * - Android adaptive foreground (mipmap-*)
 *
 * 사용: node scripts/generate-app-icons.mjs [소스.png]
 * 기본 소스: android/web3star-launcher-source.png
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/** 로고가 들어갈 정사각형 한 변 = 캔버스 × 이 비율 (1 = 가용 면적 전체) */
const CONTENT_BOX_RATIO = 1;
/** contain으로 맞춘 뒤 추가 배율 — 원 안을 꽉 채우기 위해 약간 넘치게(가장자리 클리핑) */
const LOGO_OUTPUT_SCALE = 1.22;
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

/** Canva export 등으로 남은 검은 테두리 제거 — 안 하면 contain이 여백까지 맞춰 로고가 작아 보임 */
const TRIM_THRESHOLD = 12;

async function toTrimmedBuffer(sourcePath) {
  try {
    return await sharp(sourcePath).trim({ threshold: TRIM_THRESHOLD }).ensureAlpha().toBuffer();
  } catch {
    return await sharp(sourcePath).ensureAlpha().toBuffer();
  }
}

async function renderPaddedSquare(sourcePath, size) {
  const trimmed = await toTrimmedBuffer(sourcePath);
  const inner = Math.max(1, Math.round(size * CONTENT_BOX_RATIO));
  const resized = await sharp(trimmed)
    .resize({
      width: inner,
      height: inner,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .ensureAlpha()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) throw new Error('Could not read resized dimensions');

  const scaledW = Math.max(1, Math.round(w * LOGO_OUTPUT_SCALE));
  const scaledH = Math.max(1, Math.round(h * LOGO_OUTPUT_SCALE));
  const scaled = await sharp(resized)
    .resize(scaledW, scaledH, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .toBuffer();

  const side = Math.max(size, scaledW, scaledH);
  const onSquare = await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: scaled, gravity: 'center' }])
    .png()
    .toBuffer();

  const left = Math.floor((side - size) / 2);
  const top = Math.floor((side - size) / 2);
  return sharp(onSquare)
    .extract({ left, top, width: size, height: size })
    .png()
    .toBuffer();
}

async function main() {
  const srcArg = process.argv[2];
  const sourcePath = path.resolve(repoRoot, srcArg || 'android/web3star-launcher-source.png');

  if (!fs.existsSync(sourcePath)) {
    console.error('Source not found:', sourcePath);
    process.exit(1);
  }

  const publicDir = path.join(repoRoot, 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  const pwaSizes = [
    [32, 'pwa-icon-32.png'],
    [192, 'pwa-icon-192.png'],
    [512, 'pwa-icon-512.png'],
    [180, 'apple-touch-icon.png'],
  ];

  for (const [size, name] of pwaSizes) {
    const out = path.join(publicDir, name);
    const buf = await renderPaddedSquare(sourcePath, size);
    fs.writeFileSync(out, buf);
    console.log('Wrote', path.relative(repoRoot, out));
  }

  const mipmap = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
  };

  const resBase = path.join(repoRoot, 'android/app/src/main/res');
  for (const [folder, size] of Object.entries(mipmap)) {
    const dir = path.join(resBase, folder);
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'ic_launcher_foreground.png');
    const buf = await renderPaddedSquare(sourcePath, size);
    fs.writeFileSync(out, buf);
    console.log('Wrote', path.relative(repoRoot, out));
  }

  console.log('Done. CONTENT_BOX_RATIO =', CONTENT_BOX_RATIO, 'LOGO_OUTPUT_SCALE =', LOGO_OUTPUT_SCALE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
