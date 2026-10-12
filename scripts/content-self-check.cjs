/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node.js CommonJS self-check. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const storage = new Map();
const uni = {
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value)
};
const modules = new Map();
function loadTypeScript(relativePath) {
    const filename = path.resolve(root, relativePath);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    vm.runInNewContext(
        source,
        {
            module,
            exports: module.exports,
            uni,
            require: (name) => loadTypeScript(`${name.replace(/^@\//, 'src/')}.ts`)
        },
        { filename }
    );
    return module.exports;
}

const { BOOKS, TEST_SETS, recommendBooks } = loadTypeScript('src/constants/content.ts');
const { SAVED_BOOKS_KEY, readSavedBooks, toggleSavedBook, testResult } = loadTypeScript('src/utils/content.ts');
assert.equal(new Set(BOOKS.map((book) => book.id)).size, BOOKS.length);
for (const [topic, category] of [
    ['考试 追逐 迷路', 'emotion'],
    ['亲人 家庭 争吵', 'relationship'],
    ['飞行 水 死亡', 'dream']
]) {
    const recommendations = recommendBooks(topic);
    assert.ok(recommendations.length >= 1 && recommendations.length <= 2);
    assert.ok(recommendations.every((book) => book.category === category));
}
assert.equal(recommendBooks('没有匹配主题')[0].id, BOOKS[0].id);
assert.equal(recommendBooks('')[1].id, BOOKS[1].id);

storage.set(SAVED_BOOKS_KEY, [BOOKS[0].id, 'unknown', BOOKS[0].id, null]);
assert.deepEqual(Array.from(readSavedBooks()), [BOOKS[0].id]);
let saved = toggleSavedBook(BOOKS[1].id, readSavedBooks());
assert.deepEqual(Array.from(saved), [BOOKS[0].id, BOOKS[1].id]);
saved = toggleSavedBook(BOOKS[0].id, saved);
assert.deepEqual(Array.from(readSavedBooks()), [BOOKS[1].id]);
assert.equal(toggleSavedBook('unknown', saved), saved);
storage.set(SAVED_BOOKS_KEY, 'invalid');
assert.equal(readSavedBooks().length, 0);
const writeStorage = uni.setStorageSync;
uni.setStorageSync = () => {
    throw new Error('storage full');
};
assert.throws(() => toggleSavedBook(BOOKS[0].id, saved), /storage full/);
assert.deepEqual(Array.from(saved), [BOOKS[1].id]);
uni.setStorageSync = writeStorage;

assert.equal(TEST_SETS.mbti.length, 8);
assert.equal(TEST_SETS.big5.length, 5);
assert.equal(testResult('mbti', Array(8).fill(0)).title, 'ESTJ');
assert.equal(testResult('mbti', Array(8).fill(1)).title, 'INFP');
assert.equal(testResult('mbti', [0, 0, 0, 0, 1, 1, 1, 1]).title, 'XXXX');
assert.equal(testResult('mbti', [0]), null);
assert.equal(testResult('mbti', Array(8)), null);
assert.equal(testResult('mbti', [...Array(7).fill(0), 2]), null);
for (let bits = 0; bits < 256; bits++) {
    const result = testResult(
        'mbti',
        Array.from({ length: 8 }, (_, index) => (bits >> index) & 1)
    );
    assert.match(result.title, /^[EIX][SNX][TFX][JPX]$/);
    assert.equal(result.traits.length, 4);
}
assert.equal(testResult('big5', [0, 1, 0, 1, 0]).traits.length, 5);
assert.equal(testResult('big5', [0, 1, 0, 1, NaN]), null);

const config = JSON.parse(fs.readFileSync(path.join(root, 'src/pages.json'), 'utf8'));
const routes = new Set(config.pages.map((page) => page.path));
assert.equal(routes.size, config.pages.length);
for (const route of routes) assert.ok(fs.existsSync(path.join(root, `src/${route}.vue`)), `${route} is missing`);
assert.equal(config.tabBar.list.length, 4);
assert.deepEqual(
    config.tabBar.list.map((tab) => tab.pagePath),
    ['pages/index/index', 'pages/explore/index', 'pages/record/index', 'pages/profile/index']
);
for (const route of ['pages/books/index', 'pages/tests/index', 'pages/tarot/index']) assert.ok(routes.has(route));

async function checkCalendar() {
    const requests = [];
    const profile = { exports: {} };
    const source = fs
        .readFileSync(path.join(root, 'src/pages/profile/index.vue'), 'utf8')
        .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
    const output = ts.transpileModule(
        `${source}\nexport { loadCalendar, currentYear, currentMonth, calendarRecords, calendarLoading, calendarError };`,
        {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
        }
    ).outputText;
    vm.runInNewContext(output, {
        module: profile,
        exports: profile.exports,
        uni,
        console: { error: () => {} },
        require: (name) => {
            if (name === 'vue')
                return {
                    ref: (value) => ({ value }),
                    computed: (getter) => ({
                        get value() {
                            return getter();
                        }
                    }),
                    onMounted: () => {}
                };
            if (name === '@/stores') return { useUserStore: () => ({}), useDreamStore: () => ({}) };
            if (name === '@dcloudio/uni-app') return { onShow: () => {} };
            if (name === '@/api')
                return {
                    dreamApi: {
                        getCalendar: (year, month) =>
                            new Promise((resolve, reject) => requests.push({ year, month, resolve, reject }))
                    }
                };
            throw new Error(`Unexpected profile import: ${name}`);
        }
    });
    const state = profile.exports;
    state.currentYear.value = 2025;
    state.currentMonth.value = 1;
    const january = state.loadCalendar();
    state.currentMonth.value = 2;
    const february = state.loadCalendar();
    requests[1].resolve({ records: [{ date: '2025-02-01', hasDream: true }] });
    await february;
    requests[0].resolve({ records: [{ date: '2025-01-01', hasDream: true }] });
    await january;
    assert.equal(state.calendarRecords.value[0].date, '2025-02-01');
    assert.equal(state.calendarLoading.value, false);
    const failure = state.loadCalendar();
    requests[2].reject(new Error('offline'));
    await failure;
    assert.equal(state.calendarError.value, true);
    const retry = state.loadCalendar();
    requests[3].resolve({ records: [] });
    await retry;
    assert.equal(state.calendarError.value, false);
}

checkCalendar()
    .then(() =>
        console.log(
            'Content self-check passed: recommendations, storage, test scoring, routes, and calendar request ordering.'
        )
    )
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
