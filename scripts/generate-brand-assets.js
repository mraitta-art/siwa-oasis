#!/usr/bin/env node
/**
 * SiWiFy master artwork -> every brand surface the platform needs.
 *
 * Input : the gold "SiWiFy.com" lockup (master PNG, gold artwork on pure black)
 * Output:
 *   public/brand/siwify-logo-source.png   master copy (kept in the repo)
 *   public/brand/siwify-emblem.png        512px emblem only, transparent
 *   public/brand/siwify-lockup.png        emblem + wordmark, transparent
 *   public/favicon-48x48.png              Google / browser tab icon
 *   public/favicon-96x96.png
 *   public/favicon.ico                    16/32/48 multi-size icon
 *   public/apple-touch-icon.png           180px iOS home screen
 *   public/icons/icon-192x192.png         PWA
 *   public/icons/icon-512x512.png         PWA / maskable
 *   public/brand/og-image.png             1200x630 social + Rich Results card
 *
 * Usage: node scripts/generate-brand-assets.js [path-to-master.png]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BRAND_DIR = path.join(PUBLIC_DIR, 'brand');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

const DEFAULT_MASTER =
  'C:/Users/7assan/AppData/Roaming/Qoder/SharedClientCache/cache/images/d610ceca/Luxury Gold Wi\u2011Fi Emblem-a19e9146.png';

const MASTER_COPY = path.join(BRAND_DIR, 'siwify-logo-source.png');
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

/** Brightness above this is considered "part of the artwork". */
const INK_THRESHOLD = 26;
/** Reference luminance of a fully opaque gold pixel inside the master. */
const GOLD_REFERENCE = 0.78;

function ensureDirs() {
  for (const dir of [PUBLIC_DIR, BRAND_DIR, ICONS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function readRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Splits the artwork into stacked bands (emblem on top, wordmark below). */
function findBands({ data, width, height }) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    let ink = false;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (Math.max(data[i], data[i + 1], data[i + 2]) > INK_THRESHOLD) {
        ink = true;
        break;
      }
    }
    rows.push(ink);
  }

  const bands = [];
  let start = -1;
  let gap = 0;
  for (let y = 0; y < height; y++) {
    if (rows[y]) {
      if (start === -1) start = y;
      gap = 0;
    } else if (start !== -1 && ++gap > 12) {
      bands.push({ top: start, bottom: y - gap });
      start = -1;
      gap = 0;
    }
  }
  if (start !== -1) bands.push({ top: start, bottom: height - 1 });

  return bands
    .filter((band) => band.bottom - band.top > 8)
    .map((band) => {
      let left = width;
      let right = 0;
      for (let y = band.top; y <= band.bottom; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (Math.max(data[i], data[i + 1], data[i + 2]) > INK_THRESHOLD) {
            if (x < left) left = x;
            if (x > right) right = x;
          }
        }
      }
      return { ...band, left, right };
    });
}

/** Pads a box so its aspect ratio is 1:1 (emblem / app icons). */
function squareBox(box, padRatio) {
  const side = Math.max(box.right - box.left + 1, box.bottom - box.top + 1);
  const padded = Math.round(side * (1 + padRatio * 2));
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  return {
    left: Math.round(cx - padded / 2),
    top: Math.round(cy - padded / 2),
    width: padded,
    height: padded,
  };
}

/**
 * Pure-black background + gold ink == alpha matte.
 * Coverage is derived from luminance, then RGB is un-premultiplied so the
 * gold keeps its saturation on light and dark surfaces alike.
 */
function keyOutBlack(rgba) {
  const out = Buffer.alloc(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const luminance = Math.max(r, g, b) / 255;
    const alpha = Math.min(1, luminance / GOLD_REFERENCE);
    const inv = 1 / Math.max(alpha, 0.02);
    out[i] = Math.min(255, Math.round(r * inv));
    out[i + 1] = Math.min(255, Math.round(g * inv));
    out[i + 2] = Math.min(255, Math.round(b * inv));
    out[i + 3] = Math.round(alpha * 255);
  }
  return out;
}

async function transparentCut(master, box, targetWidth) {
  const left = Math.max(0, box.left);
  const top = Math.max(0, box.top);
  const width = Math.min(master.width - left, box.width);
  const height = Math.min(master.height - top, box.height);

  const { data, info } = await sharp(master.path)
    .ensureAlpha()
    .extract({ left, top, width, height })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const keyed = keyOutBlack(data);
  return sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Solid app-icon style square: black plate + gold emblem with breathing room.
 * The emblem is scaled *inside* its own tight box so the wordmark below it can
 * never leak into the icon.
 */
async function solidIcon(master, box, size, padRatio) {
  const width = box.right - box.left + 1;
  const height = box.bottom - box.top + 1;
  const inner = Math.max(8, Math.round(size * (1 - padRatio * 2)));

  const emblem = await sharp(master.path)
    .extract({ left: box.left, top: box.top, width, height })
    .resize(inner, inner, { fit: 'contain', background: BLACK })
    .flatten({ background: BLACK })
    .png()
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: BLACK } })
    .composite([{ input: emblem, gravity: 'center' }])
    .flatten({ background: BLACK })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO container with embedded PNG payloads (supported by every modern browser). */
function buildIco(pngBuffers, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  const entries = [];
  const payloads = [];
  let offset = 6 + pngBuffers.length * 16;

  pngBuffers.forEach((png, index) => {
    const size = sizes[index];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
    payloads.push(png);
  });

  return Buffer.concat([header, ...entries, ...payloads]);
}

async function buildOpenGraph(lockupPath) {
  const width = 1200;
  const height = 630;
  const backdrop = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <radialGradient id="glow" cx="50%" cy="42%" r="62%">
           <stop offset="0%" stop-color="#3d2c0a"/>
           <stop offset="45%" stop-color="#10141d"/>
           <stop offset="100%" stop-color="#05070b"/>
         </radialGradient>
       </defs>
       <rect width="${width}" height="${height}" fill="url(#glow)"/>
     </svg>`
  );

  const lockup = await sharp(lockupPath)
    .resize({ height: 470, fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(lockup).metadata();

  return sharp(backdrop)
    .composite([
      {
        input: lockup,
        left: Math.round((width - meta.width) / 2),
        top: Math.round((height - meta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  ensureDirs();

  const source = process.argv[2] || DEFAULT_MASTER;
  if (!fs.existsSync(source)) {
    throw new Error(`Master artwork not found: ${source}`);
  }
  if (path.resolve(source) !== path.resolve(MASTER_COPY)) {
    fs.copyFileSync(source, MASTER_COPY);
  }

  const master = { path: MASTER_COPY, ...(await readRaw(MASTER_COPY)) };
  const bands = findBands(master);
  if (bands.length === 0) {
    throw new Error('No gold artwork detected in the master image.');
  }

  const emblemBand = bands.reduce((a, b) =>
    b.bottom - b.top > a.bottom - a.top ? b : a
  );
  const fullBox = {
    left: Math.min(...bands.map((band) => band.left)),
    top: Math.min(...bands.map((band) => band.top)),
    right: Math.max(...bands.map((band) => band.right)),
    bottom: Math.max(...bands.map((band) => band.bottom)),
  };

  const emblemBox = squareBox(emblemBand, 0.01);
  const lockupBox = {
    left: fullBox.left - 8,
    top: fullBox.top - 8,
    width: fullBox.right - fullBox.left + 16,
    height: fullBox.bottom - fullBox.top + 16,
  };

  const emblemPng = await transparentCut(master, emblemBox, 512);
  fs.writeFileSync(path.join(BRAND_DIR, 'siwify-emblem.png'), emblemPng);
  // Compact header/nav variant (rendered at <= 40px, so 128 is plenty).
  fs.writeFileSync(
    path.join(BRAND_DIR, 'siwify-emblem-128.png'),
    await transparentCut(master, emblemBox, 128)
  );

  const lockupPng = await transparentCut(master, lockupBox, 900);
  fs.writeFileSync(path.join(BRAND_DIR, 'siwify-lockup.png'), lockupPng);

  // Browser tab / Google search icon: solid plate keeps the emblem crisp at 16px.
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'favicon-48x48.png'),
    await solidIcon(master, emblemBand, 48, 0.05)
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'favicon-96x96.png'),
    await solidIcon(master, emblemBand, 96, 0.05)
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'apple-touch-icon.png'),
    await solidIcon(master, emblemBand, 180, 0.1)
  );
  fs.writeFileSync(
    path.join(ICONS_DIR, 'icon-192x192.png'),
    await solidIcon(master, emblemBand, 192, 0.12)
  );
  fs.writeFileSync(
    path.join(ICONS_DIR, 'icon-512x512.png'),
    await solidIcon(master, emblemBand, 512, 0.12)
  );

  const icoSizes = [16, 32, 48];
  const icoPayloads = [];
  for (const size of icoSizes) {
    icoPayloads.push(await solidIcon(master, emblemBand, size, 0.04));
  }
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buildIco(icoPayloads, icoSizes));

  fs.writeFileSync(
    path.join(BRAND_DIR, 'og-image.png'),
    await buildOpenGraph(path.join(BRAND_DIR, 'siwify-lockup.png'))
  );

  console.log('Brand assets generated:');
  for (const file of [
    'brand/siwify-logo-source.png',
    'brand/siwify-emblem.png',
    'brand/siwify-emblem-128.png',
    'brand/siwify-lockup.png',
    'brand/og-image.png',
    'favicon-48x48.png',
    'favicon-96x96.png',
    'favicon.ico',
    'apple-touch-icon.png',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
  ]) {
    const target = path.join(PUBLIC_DIR, file);
    console.log(`  ${file.padEnd(30)} ${(fs.statSync(target).size / 1024).toFixed(1)} KB`);
  }
}

main().catch((error) => {
  console.error('Brand asset generation failed:', error.message);
  process.exit(1);
});
