/**
 * Generates production PNG assets from SVG brand sources.
 * Run: node scripts/generate-brand-assets.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const brandDir = path.join(root, 'assets', 'brand');
const assetsDir = path.join(root, 'assets');

const YELLOW = '#FFD000';

async function renderSvg(svgPath, width, height, options = {}) {
  const svg = await fs.readFile(svgPath);
  let pipeline = sharp(svg, { density: 300 }).resize(width, height, {
    fit: 'contain',
    background: options.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (options.flatten) {
    pipeline = pipeline.flatten({ background: options.flatten });
  }

  return pipeline.png({ compressionLevel: 9, quality: 100 }).toBuffer();
}

async function writePng(buffer, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
  console.log('wrote', path.relative(root, dest));
}

/** Logo mark from `reference-app-icon.png` (any aspect ratio). */
async function logoMarkFromReference(maxSide, { transparentBg = false } = {}) {
  const reference = path.join(brandDir, 'reference-app-icon.png');
  try {
    await fs.access(reference);
    const mark = await sharp(reference)
      .resize(maxSide, maxSide, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const bg = transparentBg
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { r: 255, g: 208, b: 0, alpha: 255 };

    return sharp({
      create: { width: maxSide, height: maxSide, channels: 4, background: bg },
    })
      .composite([{ input: mark, gravity: 'center' }])
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer();
  } catch {
    return null;
  }
}

/** Square app icon (yellow canvas + centered logo). */
async function appIconFromReference(size) {
  const fromRef = await logoMarkFromReference(size);
  if (fromRef) {
    return fromRef;
  }

  const reference = path.join(brandDir, 'reference.png');
  try {
    await fs.access(reference);
    const meta = await sharp(reference).metadata();
    const mark = await sharp(reference)
      .extract({ left: 0, top: 0, width: Math.min(360, meta.width ?? 360), height: meta.height ?? 682 })
      .resize(Math.round(size * 0.72), Math.round(size * 0.72), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    return sharp({
      create: { width: size, height: size, channels: 4, background: YELLOW },
    })
      .composite([{ input: mark, gravity: 'center' }])
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer();
  } catch {
    return null;
  }
}

async function main() {
  const emblem = path.join(brandDir, 'emblem.svg');
  const logo = path.join(brandDir, 'logo.svg');
  const logoOnYellow = path.join(brandDir, 'logo-on-yellow.svg');
  const logoInk = path.join(brandDir, 'logo-ink.svg');
  const iconFg = path.join(brandDir, 'icon-foreground.svg');
  const splashContent = path.join(brandDir, 'splash-content.svg');

  const icon1024 =
    (await appIconFromReference(1024)) ?? (await renderSvg(emblem, 1024, 1024, { flatten: YELLOW }));
  await writePng(icon1024, path.join(assetsDir, 'icon.png'));

  const adaptiveFg =
    (await logoMarkFromReference(1024, { transparentBg: true })) ??
    (await sharp(icon1024)
      .resize(768, 768, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 128,
        bottom: 128,
        left: 128,
        right: 128,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer());
  await writePng(adaptiveFg, path.join(assetsDir, 'adaptive-icon.png'));

  const logoWide =
    (await sharp(path.join(brandDir, 'reference-app-icon.png'))
      .resize(1040, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer()
      .catch(() => null)) ??
    (await renderSvg(logo, 1040, 240, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }));
  await writePng(logoWide, path.join(assetsDir, 'logo.png'));

  const favicon =
    (await appIconFromReference(48)) ?? (await renderSvg(emblem, 48, 48, { flatten: YELLOW }));
  await writePng(favicon, path.join(assetsDir, 'favicon.png'));

  const splashLogo =
    (await logoMarkFromReference(512, { transparentBg: true })) ??
    (await renderSvg(splashContent, 512, 512, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }));
  await writePng(splashLogo, path.join(assetsDir, 'splash-logo.png'));

  const splashCanvas = await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: YELLOW,
    },
  })
    .composite([{ input: splashLogo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writePng(splashCanvas, path.join(assetsDir, 'splash.png'));

  const logoOnYellowPng = await renderSvg(logoOnYellow, 1040, 240, {
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  await writePng(logoOnYellowPng, path.join(assetsDir, 'logo-on-yellow.png'));

  const logoInkPng = await renderSvg(logoInk, 1040, 240, {
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  await writePng(logoInkPng, path.join(assetsDir, 'logo-ink.png'));

  await fs.copyFile(logo, path.join(assetsDir, 'logo.svg'));
  console.log('wrote', 'assets/logo.svg');

  await fs.copyFile(emblem, path.join(assetsDir, 'emblem.svg'));
  console.log('wrote', 'assets/emblem.svg');

  const legacyImages = path.join(assetsDir, 'images');
  await fs.mkdir(legacyImages, { recursive: true });
  for (const name of ['icon.png', 'adaptive-icon.png', 'favicon.png']) {
    await fs.copyFile(path.join(assetsDir, name), path.join(legacyImages, name));
  }
  await fs.copyFile(path.join(assetsDir, 'splash.png'), path.join(legacyImages, 'splash-icon.png'));
  console.log('synced assets/images/* for backward compatibility');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
