/* eslint-disable @typescript-eslint/no-require-imports -- Standalone asset generation script. */
// Regenerate bundled cards with ImageMagick: node scripts/generate-tarot-images.cjs.
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const deck = require('../server/src/modules/tarot/deck.json');
const output = join(__dirname, '../src/pages/tarot/static');
mkdirSync(output, { recursive: true });
for (const card of deck) {
    execFileSync('magick', [
        join(__dirname, `../server/public/tarot/${card.id}.jpg`),
        '-resize',
        '260x434',
        '-strip',
        '-sampling-factor',
        '4:2:0',
        '-quality',
        '55',
        join(output, `${card.id}.jpg`)
    ]);
}
console.log('Generated 78 local tarot cards.');
