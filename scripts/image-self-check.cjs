/* eslint-disable @typescript-eslint/no-require-imports -- Standalone asset and upload regression check. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function walk(folder) {
    return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(folder, entry.name);
        return entry.isDirectory() ? walk(file) : [file];
    });
}

for (const file of walk(path.join(root, 'src')).filter((file) => /\.(vue|ts|scss|json)$/.test(file))) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(!/\/static\/icons\/[^\s'"`<>]*\.svg/.test(source), `${file}: unsupported local SVG`);
    for (const [reference] of source.matchAll(
        /(?<![\w/])(?:\/pages\/tarot)?\/static\/[\w/-]+\.(?:png|jpe?g|gif|webp)/g
    )) {
        assert.ok(fs.existsSync(path.join(root, 'src', reference)), `${file}: missing ${reference}`);
    }
}
for (const file of walk(path.join(root, 'src/static/icons')).filter((file) => file.endsWith('.svg'))) {
    const png = fs.readFileSync(file.replace(/\.svg$/, '.png'));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 144);
    assert.equal(png.readUInt32BE(20), 144);
}
const filterIcons = read('src/pages/explore/index.vue').match(/const tagIcons[^=]*=\s*\{([\s\S]*?)\};/)[1];
for (const [, name] of filterIcons.matchAll(/:\s*'([^']+)'/g)) {
    assert.ok(fs.existsSync(path.join(root, `src/static/icons/${name}.png`)), `missing filter icon ${name}`);
}
const deck = JSON.parse(read('server/src/modules/tarot/deck.json'));
assert.equal(deck.length, 78);
for (const card of deck) {
    const file = path.join(root, `src/pages/tarot/static/${card.id}.jpg`);
    assert.equal(fs.readFileSync(file).subarray(0, 3).toString('hex'), 'ffd8ff');
}
assert.ok(fs.existsSync(path.join(root, 'src/pages/tarot/static/back.jpg')));
const pages = JSON.parse(read('src/pages.json'));
assert.ok(!pages.pages.some((page) => page.path === 'pages/tarot/index'));
assert.ok(
    pages.subPackages.some((pkg) => pkg.root === 'pages/tarot' && pkg.pages.some((page) => page.path === 'index'))
);
if (process.argv.includes('--build')) {
    const output = path.join(root, 'dist/build/mp-weixin');
    const packageFiles = walk(path.join(output, 'pages/tarot'));
    assert.ok(
        packageFiles.reduce((bytes, file) => bytes + fs.statSync(file).size, 0) < 2 * 1024 * 1024,
        'tarot subpackage exceeds 2 MiB'
    );
    const mainFiles = walk(output).filter((file) => !file.startsWith(path.join(output, 'pages/tarot') + path.sep));
    assert.ok(
        mainFiles.reduce((bytes, file) => bytes + fs.statSync(file).size, 0) < 2 * 1024 * 1024,
        'main package exceeds 2 MiB'
    );
    for (const name of [...deck.map((card) => `${card.id}.jpg`), 'back.jpg']) {
        assert.ok(fs.existsSync(path.join(output, 'pages/tarot/static', name)), `missing bundled card ${name}`);
    }
}
const serverImages = [
    ...deck.map((card) => card.image),
    ...Array.from(read('server/prisma/seeds/books.ts').matchAll(/coverImage: '([^']+)'/g), ([, image]) => image)
];
for (const image of serverImages) {
    assert.ok(fs.existsSync(path.join(root, 'server/public', image.replace(/^\/assets\//, ''))), `missing ${image}`);
}
for (const [, image] of read('server/prisma/seed.ts').matchAll(/value: '(\/static\/[^']+)'/g)) {
    assert.ok(fs.existsSync(path.join(root, 'src', image)), `missing seed image ${image}`);
}

function load(source, globals) {
    const module = { exports: {} };
    const output = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    vm.runInNewContext(output, { module, exports: module.exports, ...globals });
    return module.exports;
}

async function check() {
    let response;
    let updates = 0;
    let uploadedUrl;
    const source = read('src/components/UserProfileModal/index.vue').match(
        /<script setup lang="ts">([\s\S]*?)<\/script>/
    )[1];
    const modal = load(`${source}\nexport { handleConfirm, avatarTempFile, nickname };`, {
        defineProps: () => ({ initialAvatar: '', initialNickname: '' }),
        withDefaults: (props) => props,
        defineEmits: () => () => {},
        console: { error: () => {} },
        uni: {
            getStorageSync: () => 'token',
            showToast: () => {},
            uploadFile: (options) => {
                uploadedUrl = options.url;
                if (response === 'network') options.fail({});
                else options.success(response);
            }
        },
        require: (name) => {
            if (name === 'vue')
                return {
                    ref: (value) => ({ value }),
                    computed: (fn) => ({
                        get value() {
                            return fn();
                        }
                    }),
                    watch: () => {}
                };
            if (name === '@/stores') return { useUserStore: () => ({ setUserInfo: () => {} }) };
            if (name === '@/api/request') return { getBaseUrl: () => 'https://example.com/api/v1' };
            if (name === '@/api')
                return {
                    userApi: {
                        updateUserInfo: async (user) => {
                            updates++;
                            assert.match(user.avatar, /^https:\/\//);
                            return user;
                        }
                    }
                };
            throw new Error(`Unexpected import ${name}`);
        }
    });
    modal.avatarTempFile.value = 'wxfile://temporary-avatar';
    modal.nickname.value = 'test';
    for (response of [
        'network',
        { statusCode: 500, data: '{}' },
        { statusCode: 200, data: 'invalid JSON' },
        { statusCode: 200, data: '{"code":1}' },
        { statusCode: 200, data: '{"code":0,"data":{"url":"wxfile://temporary-avatar"}}' }
    ]) {
        await modal.handleConfirm();
        assert.equal(updates, 0, 'failed uploads must not save a temporary avatar');
    }
    response = { statusCode: 201, data: '{"code":0,"data":{"url":"https://example.com/uploads/avatars/test.png"}}' };
    await modal.handleConfirm();
    assert.equal(updates, 1);
    assert.equal(uploadedUrl, 'https://example.com/api/v1/user/avatar');

    const { tarotApi } = load(read('src/api/modules/tarot.ts'), {
        require: () => ({
            post: async () => ({
                cards: deck.map((card) => ({ id: card.id, image: 'https://unreachable.example/card.jpg' }))
            })
        })
    });
    const result = await tarotApi.daily();
    assert.equal(result.cards.length, 78);
    for (const card of result.cards) {
        assert.equal(card.image, `/pages/tarot/static/${card.id}.jpg`);
        assert.ok(fs.existsSync(path.join(root, 'src', card.image)));
    }
    const managed = { id: 'local', coverImage: '/assets/books/dream-analysis.jpg', coverVersion: 'mtime:size' };
    const remote = { id: 'remote', coverImage: 'https://cdn.example.com/book.jpg?signature=keep', coverVersion: 'new' };
    const { booksApi } = load(read('src/api/modules/books.ts'), {
        require: () => ({
            getBaseUrl: () => 'https://example.com/api/v1',
            get: async (url) => (url === '/books' ? { items: [managed, remote] } : managed),
            post: async () => [managed, remote]
        })
    });
    const catalog = await booksApi.getList({});
    const recommendations = await booksApi.getRecommendations('dream');
    const detail = await booksApi.getById('local');
    for (const book of [catalog.items[0], recommendations[0], detail]) {
        assert.equal(book.coverImage, 'https://example.com/assets/books/dream-analysis.jpg?v=mtime%3Asize');
        assert.equal(book.coverVersion, 'mtime:size');
    }
    assert.equal(catalog.items[1].coverImage, remote.coverImage);
    assert.equal(recommendations[1].coverImage, remote.coverImage);
    console.log(
        `Image self-check passed: local PNGs, dynamic icons, ${serverImages.length} server images, upload failures and tarot URLs.`
    );
}
check().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
