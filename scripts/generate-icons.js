/* eslint-disable @typescript-eslint/no-require-imports -- Standalone asset generation script. */
/** Regenerate PNGs from the SVG originals: install librsvg, then node scripts/generate-icons.js. */
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const iconsDir = join(__dirname, '../src/static/icons');
for (const name of readdirSync(iconsDir).filter((name) => name.endsWith('.svg'))) {
    execFileSync('rsvg-convert', [
        '--width',
        '144',
        '--height',
        '144',
        '--output',
        join(iconsDir, name.replace(/\.svg$/, '.png')),
        join(iconsDir, name)
    ]);
}
console.log('Generated mini-program PNG icons from SVG originals.');
