/**
 * Generate TabBar PNG icons
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICONS_DIR = path.join(__dirname, '../src/static/icons');

// Ensure directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Simple PNG encoder for small icons
function createPNG(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth
  ihdrData.writeUInt8(6, 9);  // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const outIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[outIdx] = pixels[idx];     // R
      rawData[outIdx + 1] = pixels[idx + 1]; // G
      rawData[outIdx + 2] = pixels[idx + 2]; // B
      rawData[outIdx + 3] = pixels[idx + 3]; // A
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}

// Draw functions
function drawCircle(pixels, size, cx, cy, r, color) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r) {
        const idx = (y * size + x) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }
  }
}

function drawRoundedRect(pixels, size, x, y, w, h, radius, color) {
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let inside = false;
      if (px >= x + radius && px <= x + w - radius && py >= y && py <= y + h) {
        inside = true;
      } else if (px >= x && px <= x + w && py >= y + radius && py <= y + h - radius) {
        inside = true;
      } else {
        // Check corners
        const corners = [
          [x + radius, y + radius],
          [x + w - radius, y + radius],
          [x + radius, y + h - radius],
          [x + w - radius, y + h - radius]
        ];
        for (const [cx, cy] of corners) {
          const dx = px - cx;
          const dy = py - cy;
          if (Math.sqrt(dx * dx + dy * dy) <= radius) {
            inside = true;
            break;
          }
        }
      }
      if (inside) {
        const idx = (py * size + px) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Distance from point to line
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

      if (dist <= thickness / 2) {
        const idx = (py * size + px) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }
  }
}

// Icon generation functions
const SIZE = 48;
const GRAY = [153, 153, 153, 255];
const PURPLE = [107, 78, 255, 255];

function createHomeIcon(active) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const color = active ? PURPLE : GRAY;

  // Draw house roof (triangle)
  const cx = SIZE / 2;
  const roofTop = 8;
  const roofBottom = 22;
  const roofWidth = 34;

  for (let y = roofTop; y <= roofBottom; y++) {
    const progress = (y - roofTop) / (roofBottom - roofTop);
    const halfWidth = progress * roofWidth / 2;
    for (let x = Math.floor(cx - halfWidth); x <= Math.ceil(cx + halfWidth); x++) {
      if (x >= 0 && x < SIZE) {
        const idx = (y * SIZE + x) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }
  }

  // Draw house body
  drawRoundedRect(pixels, SIZE, 12, 22, 24, 18, 2, color);

  // Draw door (cutout - transparent)
  if (!active) {
    for (let y = 28; y < 40; y++) {
      for (let x = 20; x < 28; x++) {
        const idx = (y * SIZE + x) * 4;
        pixels[idx + 3] = 0; // Make transparent
      }
    }
  }

  return createPNG(SIZE, SIZE, pixels);
}

function createRecordIcon(active) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const color = active ? PURPLE : GRAY;

  // Draw pencil/pen icon
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // Main pen body (diagonal rectangle)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // Rotate coordinates 45 degrees
      const rx = (x - cx) * 0.707 + (y - cy) * 0.707;
      const ry = -(x - cx) * 0.707 + (y - cy) * 0.707;

      // Pen body
      if (rx >= -3 && rx <= 3 && ry >= -14 && ry <= 10) {
        const idx = (y * SIZE + x) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }

      // Pen tip
      if (ry >= 10 && ry <= 16 && Math.abs(rx) <= (16 - ry) / 2) {
        const idx = (y * SIZE + x) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }
  }

  return createPNG(SIZE, SIZE, pixels);
}

function createProfileIcon(active) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const color = active ? PURPLE : GRAY;

  // Draw head (circle)
  drawCircle(pixels, SIZE, SIZE / 2, 14, 8, color);

  // Draw body (rounded rectangle at bottom)
  for (let y = 26; y < 42; y++) {
    for (let x = 8; x < 40; x++) {
      // Create rounded top edge
      const cx = SIZE / 2;
      const topY = 26;
      const radius = 16;
      const dx = Math.abs(x - cx);
      const dy = y - topY;

      if (dy >= 0) {
        const curveHeight = Math.sqrt(Math.max(0, radius * radius - dx * dx)) * 0.3;
        if (dy >= curveHeight || y > 30) {
          const idx = (y * SIZE + x) * 4;
          pixels[idx] = color[0];
          pixels[idx + 1] = color[1];
          pixels[idx + 2] = color[2];
          pixels[idx + 3] = color[3];
        }
      }
    }
  }

  return createPNG(SIZE, SIZE, pixels);
}

// Generate all icons
console.log('Generating TabBar icons...');

fs.writeFileSync(path.join(ICONS_DIR, 'home.png'), createHomeIcon(false));
console.log('  Created home.png');

fs.writeFileSync(path.join(ICONS_DIR, 'home-active.png'), createHomeIcon(true));
console.log('  Created home-active.png');

fs.writeFileSync(path.join(ICONS_DIR, 'record.png'), createRecordIcon(false));
console.log('  Created record.png');

fs.writeFileSync(path.join(ICONS_DIR, 'record-active.png'), createRecordIcon(true));
console.log('  Created record-active.png');

fs.writeFileSync(path.join(ICONS_DIR, 'profile.png'), createProfileIcon(false));
console.log('  Created profile.png');

fs.writeFileSync(path.join(ICONS_DIR, 'profile-active.png'), createProfileIcon(true));
console.log('  Created profile-active.png');

console.log('\nDone! Icons created in src/static/icons/');
