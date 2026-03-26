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

/** PWA/iOS 아이콘: 정렬/가독성 중심 기본값 */
const CONTENT_BOX_RATIO = 0.92;
const LOGO_OUTPUT_SCALE = 1.0;
/**
 * Android adaptive icon foreground:
 * - 마스크(원/스퀘어클/티어드롭 등)에서 잘림이 발생하므로 PWA보다 보수적으로 넣어야 함
 * - "꽉 차 보이되 안 잘리게"를 위한 safe zone
 */
// Android adaptive icon foreground:
// 우측/상단이 계속 잘리면 trim 과정에서 여백이 과하게 제거된 케이스일 수 있어,
// Android는 trim을 비활성화하고(더 많은 여백 유지) 보수적으로 축소합니다.
// Reduce further to guarantee no left/right/top/bottom clipping in common launcher masks.
const ANDROID_CONTENT_BOX_RATIO = 0.68;
const ANDROID_OUTPUT_SCALE = 1.0;
const ANDROID_OFFSET_X_RATIO = 0;
const ANDROID_OFFSET_Y_RATIO = 0;
// Hard safety margin around raw source to prevent any side clipping.
const ANDROID_SOURCE_PAD_RATIO = 0.08;
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

/** Canva export 등으로 남은 검은 테두리 제거 — 안 하면 contain이 여백까지 맞춰 로고가 작아 보임 */
const TRIM_THRESHOLD = 12;
const ANDROID_TRIM_DISABLED = true;

async function toTrimmedBuffer(
  sourcePath,
  { useTrim = true, trimThreshold = TRIM_THRESHOLD } = {},
) {
  try {
    const img = sharp(sourcePath).ensureAlpha();
    if (!useTrim) return await img.toBuffer();
    return await img.trim({ threshold: trimThreshold }).toBuffer();
  } catch {
    return await sharp(sourcePath).ensureAlpha().toBuffer();
  }
}

async function renderPaddedSquare(sourcePath, size, opts = {}) {
  const trimThreshold = typeof opts.trimThreshold === 'number' ? opts.trimThreshold : TRIM_THRESHOLD;
  const useTrim = typeof opts.useTrim === 'boolean' ? opts.useTrim : true;
  const sourcePadRatio = typeof opts.sourcePadRatio === 'number' ? opts.sourcePadRatio : 0;
  const trimmed = await toTrimmedBuffer(sourcePath, { useTrim, trimThreshold });
  const sourceBuffer =
    sourcePadRatio > 0
      ? await (async () => {
          const meta = await sharp(trimmed).metadata();
          const w = meta.width ?? 0;
          const h = meta.height ?? 0;
          if (!w || !h) return trimmed;
          const pad = Math.max(1, Math.round(Math.max(w, h) * sourcePadRatio));
          const canvasW = w + pad * 2;
          const canvasH = h + pad * 2;
          return sharp({
            create: {
              width: canvasW,
              height: canvasH,
              channels: 4,
              background: BG,
            },
          })
            .composite([{ input: trimmed, left: pad, top: pad }])
            .png()
            .toBuffer();
        })()
      : trimmed;
  /** 브라우저 탭 파비콘(32)은 UI가 살짝 잘라내는 경우가 많아 로고를 작게 넣어 여유를 둠 */
  const faviconSafe = size <= 32;
  const innerRatio = typeof opts.innerRatio === 'number' ? opts.innerRatio : CONTENT_BOX_RATIO;
  const forcedOutputScale = typeof opts.outputScale === 'number' ? opts.outputScale : undefined;
  const offsetXRatio = typeof opts.offsetXRatio === 'number' ? opts.offsetXRatio : 0;
  const offsetYRatio = typeof opts.offsetYRatio === 'number' ? opts.offsetYRatio : 0;
  const inner = Math.max(
    1,
    Math.round(size * (faviconSafe ? 0.78 : innerRatio)),
  );
  const outputScale = forcedOutputScale ?? (faviconSafe ? 1.0 : LOGO_OUTPUT_SCALE);
  const resized = await sharp(sourceBuffer)
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

  const scaledW = Math.max(1, Math.round(w * outputScale));
  const scaledH = Math.max(1, Math.round(h * outputScale));
  const scaled = await sharp(resized)
    .resize(scaledW, scaledH, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .toBuffer();

  const side = Math.max(size, scaledW, scaledH);
  const base = sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: BG,
    },
  });
  const leftForComposite = Math.round((side - scaledW) / 2 + offsetXRatio * size);
  const topForComposite = Math.round((side - scaledH) / 2 + offsetYRatio * size);
  const onSquare = await base
    .composite([{ input: scaled, left: leftForComposite, top: topForComposite }])
    .png()
    .toBuffer();

  // Use round instead of floor to avoid 1px center bias (can show up as right/top clipping in preview masks).
  const left = Math.round((side - size) / 2);
  const top = Math.round((side - size) / 2);
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
    const buf = await renderPaddedSquare(sourcePath, size, {
      innerRatio: ANDROID_CONTENT_BOX_RATIO,
      outputScale: ANDROID_OUTPUT_SCALE,
      offsetXRatio: ANDROID_OFFSET_X_RATIO,
      offsetYRatio: ANDROID_OFFSET_Y_RATIO,
      useTrim: !ANDROID_TRIM_DISABLED,
      sourcePadRatio: ANDROID_SOURCE_PAD_RATIO,
    });
    fs.writeFileSync(out, buf);
    console.log('Wrote', path.relative(repoRoot, out));
  }

  // Browser preview asset (matches Android adaptive foreground settings)
  const androidPreview = path.join(publicDir, 'android-ic_launcher_foreground-preview.png');
  fs.writeFileSync(
    androidPreview,
    await renderPaddedSquare(sourcePath, 512, {
      innerRatio: ANDROID_CONTENT_BOX_RATIO,
      outputScale: ANDROID_OUTPUT_SCALE,
      offsetXRatio: ANDROID_OFFSET_X_RATIO,
      offsetYRatio: ANDROID_OFFSET_Y_RATIO,
      useTrim: !ANDROID_TRIM_DISABLED,
      sourcePadRatio: ANDROID_SOURCE_PAD_RATIO,
    }),
  );
  console.log('Wrote', path.relative(repoRoot, androidPreview));

  console.log(
    'Done. CONTENT_BOX_RATIO =',
    CONTENT_BOX_RATIO,
    'LOGO_OUTPUT_SCALE =',
    LOGO_OUTPUT_SCALE,
    'ANDROID_CONTENT_BOX_RATIO =',
    ANDROID_CONTENT_BOX_RATIO,
    'ANDROID_OUTPUT_SCALE =',
    ANDROID_OUTPUT_SCALE,
    'ANDROID_OFFSET_X_RATIO =',
    ANDROID_OFFSET_X_RATIO,
    'ANDROID_TRIM_DISABLED =',
    ANDROID_TRIM_DISABLED,
    'ANDROID_SOURCE_PAD_RATIO =',
    ANDROID_SOURCE_PAD_RATIO,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
