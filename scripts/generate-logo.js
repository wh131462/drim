/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generate Logo PNG
 * Run with: node scripts/generate-logo.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUTPUT_PATH = path.join(__dirname, '../src/static/logo.png');

// --- PNG Encoder ---

function createPNG(width, height, pixels) {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = createChunk('IHDR', createIHDRData(width, height));
    const idat = createChunk('IDAT', compressData(width, height, pixels));
    const iend = createChunk('IEND', Buffer.alloc(0));
    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createIHDRData(width, height) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(width, 0);
    data.writeUInt32BE(height, 4);
    data.writeUInt8(8, 8);
    data.writeUInt8(6, 9);
    data.writeUInt8(0, 10);
    data.writeUInt8(0, 11);
    data.writeUInt8(0, 12);
    return data;
}

function compressData(width, height, pixels) {
    const rawData = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
        rawData[y * (1 + width * 4)] = 0;
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const outIdx = y * (1 + width * 4) + 1 + x * 4;
            rawData[outIdx] = pixels[idx];
            rawData[outIdx + 1] = pixels[idx + 1];
            rawData[outIdx + 2] = pixels[idx + 2];
            rawData[outIdx + 3] = pixels[idx + 3];
        }
    }
    return zlib.deflateSync(rawData);
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
    let crc = 0xffffffff;
    const table = makeCRCTable();
    for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function makeCRCTable() {
    const table = new Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c;
    }
    return table;
}

// --- Drawing Primitives ---

function blendPixel(pixels, width, x, y, color) {
    if (x < 0 || x >= width || y < 0) return;
    const idx = (y * width + x) * 4;
    if (idx >= pixels.length) return;

    const alpha = color[3] / 255;
    const invAlpha = 1 - alpha;

    pixels[idx] = Math.round(color[0] * alpha + pixels[idx] * invAlpha);
    pixels[idx + 1] = Math.round(color[1] * alpha + pixels[idx + 1] * invAlpha);
    pixels[idx + 2] = Math.round(color[2] * alpha + pixels[idx + 2] * invAlpha);
    pixels[idx + 3] = Math.min(255, Math.round(color[3] + pixels[idx + 3] * (1 - alpha)));
}

function isInsideRoundedRect(x, y, w, h, radius) {
    if (x < radius && y < radius) return (x - radius) ** 2 + (y - radius) ** 2 <= radius ** 2;
    if (x > w - radius && y < radius) return (x - (w - radius)) ** 2 + (y - radius) ** 2 <= radius ** 2;
    if (x < radius && y > h - radius) return (x - radius) ** 2 + (y - (h - radius)) ** 2 <= radius ** 2;
    if (x > w - radius && y > h - radius) return (x - (w - radius)) ** 2 + (y - (h - radius)) ** 2 <= radius ** 2;
    return true;
}

function drawGradientBackground(pixels, size, radius, colorTop, colorBottom) {
    for (let y = 0; y < size; y++) {
        const t = y / size;
        const r = Math.round(colorTop[0] * (1 - t) + colorBottom[0] * t);
        const g = Math.round(colorTop[1] * (1 - t) + colorBottom[1] * t);
        const b = Math.round(colorTop[2] * (1 - t) + colorBottom[2] * t);

        for (let x = 0; x < size; x++) {
            if (isInsideRoundedRect(x, y, size, size, radius)) {
                const idx = (y * size + x) * 4;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = 255;
            }
        }
    }
}

function drawCircle(pixels, size, cx, cy, r, color) {
    const boundingBox = Math.ceil(r + 1);
    for (let y = Math.floor(cy - boundingBox); y <= Math.ceil(cy + boundingBox); y++) {
        for (let x = Math.floor(cx - boundingBox); x <= Math.ceil(cx + boundingBox); x++) {
            const distSq = (x - cx) ** 2 + (y - cy) ** 2;
            if (distSq < (r - 0.5) ** 2) {
                blendPixel(pixels, size, x, y, color);
            } else if (distSq < (r + 0.5) ** 2) {
                const dist = Math.sqrt(distSq);
                const alphaFactor = 0.5 + r - dist;
                const blendedColor = [...color];
                blendedColor[3] = Math.round(color[3] * alphaFactor);
                blendPixel(pixels, size, x, y, blendedColor);
            }
        }
    }
}

// --- Logo Config ---

const SIZE = 256;
const RADIUS = 64;

// Color Palette
const BG_TOP = [45, 20, 110, 255];
const BG_BOTTOM = [120, 90, 240, 255];
const MOON_COLOR = [255, 255, 240, 255];
const STAR_COLOR = [255, 245, 180, 255];

// Improved Cloud Palette - Two distinct tones for volume
const CLOUD_MAIN = [255, 255, 255, 220]; // Whiter, brighter
const CLOUD_SHADE = [230, 230, 255, 180]; // Slightly purple/blue tinted, more transparent

function createLogo() {
    const pixels = new Uint8Array(SIZE * SIZE * 4);

    // 1. Background
    drawGradientBackground(pixels, SIZE, RADIUS, BG_TOP, BG_BOTTOM);

    // 2. Moon (Keep specific shape)
    const moonCx = SIZE / 2;
    const moonCy = SIZE / 2 - 20;
    const moonR = 60;
    const cutCx = moonCx + 25;
    const cutCy = moonCy - 10;
    const cutR = 50;

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const distMoon = Math.sqrt((x - moonCx) ** 2 + (y - moonCy) ** 2);
            const distCut = Math.sqrt((x - cutCx) ** 2 + (y - cutCy) ** 2);

            if (distMoon <= moonR) {
                if (distCut > cutR) {
                    let alphaOuter = 1;
                    if (distMoon > moonR - 1) alphaOuter = moonR - distMoon;
                    let alphaInner = 1;
                    if (distCut < cutR + 2) alphaInner = (distCut - cutR) / 2;
                    const finalAlpha = Math.min(alphaOuter, alphaInner);
                    if (finalAlpha > 0) {
                        const col = [...MOON_COLOR];
                        col[3] = Math.round(255 * finalAlpha);
                        blendPixel(pixels, SIZE, x, y, col);
                    }
                }
            }
        }
    }

    // 3. Clouds - Optimized
    // Instead of big blobs, we use a "rolling" formation at the bottom.
    // We layer them: Back (Shade) first, then Front (Main)

    // -- Back Layer (Volume) --
    drawCircle(pixels, SIZE, 60, 210, 40, CLOUD_SHADE);
    drawCircle(pixels, SIZE, 190, 205, 45, CLOUD_SHADE);
    drawCircle(pixels, SIZE, 125, 220, 40, CLOUD_SHADE); // Center filler

    // -- Front Layer (Highlights/Definition) --
    // Three distinct "humps" creating a flowing line
    drawCircle(pixels, SIZE, 85, 225, 35, CLOUD_MAIN);
    drawCircle(pixels, SIZE, 165, 220, 38, CLOUD_MAIN);

    // A connecting piece that is slightly lower
    drawCircle(pixels, SIZE, 125, 235, 30, CLOUD_MAIN);

    // 4. Stars
    drawCircle(pixels, SIZE, 180, 60, 5, STAR_COLOR);
    drawCircle(pixels, SIZE, 70, 80, 3, [255, 255, 255, 180]);
    drawCircle(pixels, SIZE, 200, 180, 3, [255, 255, 255, 180]);

    return createPNG(SIZE, SIZE, pixels);
}

console.log('Generating Final Logo...');
const logoData = createLogo();
fs.writeFileSync(OUTPUT_PATH, logoData);
console.log(`Logo created at ${OUTPUT_PATH}`);
