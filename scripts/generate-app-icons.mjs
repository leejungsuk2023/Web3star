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

/** 로고가 들어갈 정사각형 한 변 = 캔버스 × 이 비율 (maskable 안전구역 여유)
 *  여백 비율을 줄이면 아이콘이 더 크게 보이지만, 너무 올리면 일부 소스 여백이 잘릴 수 있습니다.
 *  fit('inside')라서 기본적으로 크롭되진 않지만, 안전하게 약간만 확대합니다.
 */
const CONTENT_BOX_RATIO = 0.84;
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

async function renderPaddedSquare(sourcePath, size) {
  const inner = Math.max(1, Math.round(size * CONTENT_BOX_RATIO));
  const resized = await sharp(sourcePath)
    .resize({
      width: inner,
      height: inner,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .ensureAlpha()
    .toBuffer();

  const pipeline = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  }).composite([{ input: resized, gravity: 'center' }]);

  return pipeline.png().toBuffer();
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

  console.log('Done. CONTENT_BOX_RATIO =', CONTENT_BOX_RATIO);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
