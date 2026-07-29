// One-off icon generator: writes solid WhatsApp-green PNGs with a white glyph
// dot into /public so they ship at the dist root. No native deps — hand-rolls a
// minimal PNG (IHDR + IDAT + IEND) with zlib deflate.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public');

// Brand palette.
const GREEN = [37, 211, 102, 255];
const WHITE = [255, 255, 255, 255];
const TRANSPARENT = [0, 0, 0, 0];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixelAt) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = compression/filter/interlace = 0

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      const p = rowStart + 1 + x * 4;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
      raw[p + 3] = a;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundedRect(x, y, left, top, right, bottom, r) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const nx = x < left + r ? left + r : x > right - r ? right - r : x;
  const ny = y < top + r ? top + r : y > bottom - r ? bottom - r : y;
  const dx = x - nx;
  const dy = y - ny;
  return dx * dx + dy * dy <= r * r;
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function edge(x, y, ax, ay, bx, by) {
  return (x - bx) * (ay - by) - (ax - bx) * (y - by);
}

function inTriangle(x, y, ax, ay, bx, by, cx, cy) {
  const d1 = edge(x, y, ax, ay, bx, by);
  const d2 = edge(x, y, bx, by, cx, cy);
  const d3 = edge(x, y, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

// A white speech bubble (with tail + message dots) on a rounded green tile.
function draw(size) {
  const bgRadius = size * 0.22;
  const bubble = { l: size * 0.19, t: size * 0.24, r: size * 0.81, b: size * 0.6, radius: size * 0.13 };
  const tail = [size * 0.32, bubble.b - 1, size * 0.3, size * 0.76, size * 0.46, bubble.b - 1];
  const dotY = size * 0.42;
  const dotR = size * 0.05;
  const dotXs = [size * 0.37, size * 0.5, size * 0.63];

  return (px, py) => {
    const x = px + 0.5;
    const y = py + 0.5;
    if (!inRoundedRect(x, y, 0, 0, size, size, bgRadius)) return TRANSPARENT;

    const inBubble =
      inRoundedRect(x, y, bubble.l, bubble.t, bubble.r, bubble.b, bubble.radius) ||
      inTriangle(x, y, tail[0], tail[1], tail[2], tail[3], tail[4], tail[5]);

    if (inBubble) {
      for (const dotX of dotXs) {
        if (inCircle(x, y, dotX, dotY, dotR)) return GREEN;
      }
      return WHITE;
    }
    return GREEN;
  };
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), encodePng(size, draw(size)));
}
console.log('Icons written to', OUT_DIR);
