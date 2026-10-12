// Run: node design/core-self-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');
const attrs = (text) => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map((item) => [item[1], item[2]]));
function element(attributes = {}) {
    const classes = new Set((attributes.class || '').split(' ').filter(Boolean));
    return {
        attributes,
        dataset: Object.fromEntries(
            Object.entries(attributes)
                .filter(([key]) => key.startsWith('data-'))
                .map(([key, value]) => [key.slice(5), value])
        ),
        style: {},
        value: '',
        textContent: '',
        innerHTML: '',
        hidden: false,
        listeners: {},
        children: [],
        classList: {
            toggle(name, active) {
                active ? classes.add(name) : classes.delete(name);
            },
            contains: (name) => classes.has(name)
        },
        setAttribute(name, value) {
            attributes[name] = String(value);
        },
        getAttribute(name) {
            return attributes[name];
        },
        addEventListener(name, callback) {
            this.listeners[name] = callback;
        },
        emit(name) {
            this.listeners[name]?.();
        },
        click() {
            this.emit('click');
        },
        showModal() {
            this.open = true;
        },
        replaceChildren() {
            this.children = [];
        },
        append(child) {
            this.children.push(child);
        }
    };
}
function storage() {
    const items = new Map();
    return {
        items,
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => items.set(key, value),
        removeItem: (key) => items.delete(key)
    };
}
function harness(name) {
    const html = name ? read(`${name}.html`) : '';
    const ids = new Map(
        [...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map((match) => [match[1], element(attrs(match[0]))])
    );
    const filters = [...html.matchAll(/<button[^>]*data-filter="[^\"]+"[^>]*>/g)].map((match) =>
        element(attrs(match[0]))
    );
    const sessionStorage = storage();
    const localStorage = storage();
    let feedSource = null;
    let feedButtons = [];
    const document = {
        documentElement: { dataset: {} },
        createElement: () => element(),
        getElementById(id) {
            assert(ids.has(id), `Missing element: ${id}`);
            return ids.get(id);
        },
        querySelectorAll(selector) {
            if (selector === '[data-filter]') return filters;
            const feed = ids.get('dream-feed')?.innerHTML || '';
            if (feedSource !== feed) {
                feedSource = feed;
                feedButtons = [...feed.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)].map((match) => {
                    const button = element(attrs(match[1]));
                    button.textContent = match[2].replace(/<[^>]+>/g, '').trim();
                    return button;
                });
            }
            return feedButtons.filter((button) => {
                const attribute = selector.match(/^\[data-(\w+)\]$/)?.[1];
                return attribute && attribute in button.dataset;
            });
        }
    };
    const window = { sessionStorage, localStorage };
    const context = vm.createContext({
        window,
        document,
        sessionStorage,
        localStorage,
        URLSearchParams,
        location: { href: '', search: '' }
    });
    const run = (script) => vm.runInContext(script, context);
    run(read('prototype.js'));
    context.DrimDesign = window.DrimDesign;
    return {
        html,
        ids,
        filters,
        sessionStorage,
        localStorage,
        document,
        window,
        context,
        run,
        api: window.DrimDesign,
        inline() {
            const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
            assert(script, `${name} inline script`);
            run(script);
        }
    };
}

const shared = harness();
const { api, sessionStorage, localStorage, document } = shared;
const draft = {
    content: '我梦见自己慢慢飞过一条安静的河流，醒来后依然记得夜空。',
    tags: ['flying'],
    emotion: 'calm',
    isPublic: false,
    recordedAt: '2026-10-08T00:30:00Z'
};
assert.equal(api.readDream(), null);
localStorage.setItem(api.DREAM_KEY, JSON.stringify(draft));
assert.equal(api.readDream(), null, 'private draft reads session storage only');
for (const value of [
    'broken-json',
    '[]',
    'null',
    '{"content":3}',
    '{"content":"   "}',
    JSON.stringify({ content: '梦'.repeat(1001) })
]) {
    sessionStorage.setItem(api.DREAM_KEY, value);
    assert.equal(api.readDream(), null, `Reject invalid dream: ${value.slice(0, 25)}`);
}
assert(api.writeDream(draft));
assert.equal(api.readDream().content, draft.content);
sessionStorage.setItem(
    api.DREAM_KEY,
    JSON.stringify({
        ...draft,
        tags: [9, 'flying', ' ', '123456789012345678', null, 'family', 'water'],
        emotion: 4,
        isPublic: 'true',
        recordedAt: 'invalid',
        extra: 'ignored'
    })
);
const filtered = api.readDream();
assert.deepEqual(Array.from(filtered.tags), ['flying', '123456789012', 'family']);
assert.equal(filtered.emotion, null);
assert.equal(filtered.isPublic, false);
assert.equal(filtered.recordedAt, null);
assert.equal(filtered.extra, undefined);
sessionStorage.setItem(api.DREAM_KEY, JSON.stringify({ ...draft, emotion: 'x'.repeat(21), isPublic: true }));
assert.equal(api.readDream().emotion.length, 20);
assert.equal(api.readDream().isPublic, true);
assert.equal(api.labelTag('flying'), '飞行');
assert.equal(api.labelEmotion('calm'), '平静');
assert.equal(api.labelTag('童年'), '童年');
assert.equal(api.readingFor({ tags: ['exam'] }).category, 'emotion');
assert.equal(api.readingFor({ emotion: 'fear' }).category, 'emotion');
assert.equal(api.readingFor({ content: '我在梦里迷路了' }).category, 'emotion');
assert.equal(api.readingFor({ tags: ['family'] }).category, 'relationship');
assert.equal(api.readingFor({ emotion: 'love' }).title, '依恋');
assert.equal(api.readingFor({ tags: ['flying', 'water'] }).category, 'dream');
assert.equal(api.readingFor(null).category, 'all');
assert.equal(api.readingFor({ tags: ['exam', 'family'] }).category, 'emotion', 'pressure category has precedence');
api.setTheme('dark');
assert.equal(document.documentElement.dataset.theme, 'dark');
assert.equal(localStorage.getItem('drim-design-theme'), 'dark');
api.setTheme('unknown');
assert.equal(document.documentElement.dataset.theme, 'light');
shared.window.sessionStorage = {
    getItem() {
        throw Error('blocked');
    },
    setItem() {
        throw Error('blocked');
    }
};
shared.window.localStorage = {
    getItem() {
        throw Error('blocked');
    },
    setItem() {
        throw Error('blocked');
    }
};
assert.equal(api.readDream(), null);
assert.equal(api.writeDream(draft), false);
api.setTheme('dark');
assert.equal(document.documentElement.dataset.theme, 'dark', 'theme still works without storage');

const discover = harness('discover');
discover.inline();
assert.equal(discover.ids.get('feed-count').textContent, '3 场公开梦境');
assert(discover.ids.get('feed-empty').hidden);
const search = discover.ids.get('dream-search');
search.value = '  妈妈  ';
search.emit('input');
assert.equal(discover.ids.get('feed-count').textContent, '1 场公开梦境');
assert.equal(discover.document.querySelectorAll('[data-author]')[0].textContent, '追梦人');
search.value = '';
search.emit('input');
discover.filters.find((button) => button.dataset.filter === '水').click();
assert.equal(discover.ids.get('feed-count').textContent, '1 场公开梦境');
assert.equal(discover.filters.find((button) => button.dataset.filter === '水').getAttribute('aria-pressed'), 'true');
search.value = '不存在的梦境主题';
search.emit('input');
assert.equal(discover.ids.get('feed-count').textContent, '0 场公开梦境');
assert(!discover.ids.get('feed-empty').hidden);
discover.ids.get('reset-feed').click();
assert.equal(search.value, '');
assert.equal(discover.ids.get('feed-count').textContent, '3 场公开梦境');
assert.equal(discover.filters[0].getAttribute('aria-pressed'), 'true');
let like = discover.document.querySelectorAll('[data-like]').find((button) => button.dataset.like === '1');
assert(like.textContent.includes('24'));
like.click();
like = discover.document.querySelectorAll('[data-like]').find((button) => button.dataset.like === '1');
assert(like.textContent.includes('25'));
assert.equal(like.getAttribute('aria-pressed'), 'true');
assert.equal(discover.sessionStorage.getItem('drim-design-likes'), '[1]');
like.click();
assert(discover.document.querySelectorAll('[data-like]')[0].textContent.includes('24'));
discover.document.querySelectorAll('[data-open]')[0].click();
assert(discover.ids.get('public-detail').open);
assert.equal(discover.ids.get('public-title').textContent, '在草原上自由飞行');
const author = discover.document.querySelectorAll('[data-author]')[0];
assert.equal(author.textContent, '梦想家');
author.click();
assert.equal(discover.ids.get('public-kind').textContent, '公开档案');
assert.equal(discover.ids.get('public-title').textContent, '🌙 梦想家');
assert.equal(discover.ids.get('public-author').textContent, '1 场公开梦境');
assert(discover.ids.get('public-content').hidden && discover.ids.get('public-tags').hidden);
assert(!discover.ids.get('public-profile-dreams').hidden);
assert.equal(discover.ids.get('public-profile-dreams').children.length, 1);
discover.ids.get('public-profile-dreams').children[0].click();
assert.equal(discover.ids.get('public-kind').textContent, '公开梦境');
assert.equal(discover.ids.get('public-title').textContent, '在草原上自由飞行');
assert(!discover.ids.get('public-content').hidden && !discover.ids.get('public-tags').hidden);
assert(discover.ids.get('public-profile-dreams').hidden);
assert(discover.html.includes('<form method="dialog">'), 'dialog retains its close form');

for (const [tags, category, title] of [
    [['exam'], 'emotion', '当下的力量'],
    [['family'], 'relationship', '依恋'],
    [['flying'], 'dream', '荣格自传：回忆·梦·思考'],
    [['童年'], 'all', '被讨厌的勇气']
]) {
    const result = harness('result');
    result.api.writeDream({ ...draft, content: '梦见自己坐在一张椅子上，周围的颜色很特别。', tags });
    result.inline();
    assert.equal(result.ids.get('reading-link').href, `books.html?filter=${category}`);
    assert.equal(result.ids.get('reading-book-title').textContent, title);
    assert.equal(result.ids.get('result-dream-content').textContent, '梦见自己坐在一张椅子上，周围的颜色很特别。');
}
console.log(
    'PASS: shared draft validation/storage/theme, recommendation matching, discover search/filter/reset/likes/detail/author, result links'
);

assert.equal(api.labelTag('__proto__'), '__proto__');
assert.equal(api.shanghaiDate('2026-10-08T16:00:00Z'), '2026-10-09');
assert.equal(api.shanghaiDate(api.sampleDream('2026-10-03').recordedAt), '2026-10-03');
assert.notEqual(api.shanghaiDate(api.sampleDream('2026-02-31').recordedAt), '2026-02-31');
const samplePage = harness('result');
samplePage.api.writeDream(draft);
samplePage.context.location.search = '?sample=1&date=2026-10-03';
samplePage.inline();
assert.equal(samplePage.ids.get('result-dream-content').textContent, samplePage.api.sampleDream('2026-10-03').content);
assert(samplePage.ids.get('result-edit').hidden);
samplePage.ids.get('result-back').onclick();
assert.equal(samplePage.context.location.href, 'dream-detail.html?sample=1&date=2026-10-03');
assert.equal(samplePage.api.readDream().content, draft.content, 'Viewing history must not overwrite current dream');
const failedSave = harness('result');
failedSave.inline();
failedSave.sessionStorage.setItem = () => {
    throw Error('Write blocked');
};
failedSave.ids.get('save-analysis').click();
assert.equal(failedSave.ids.get('save-analysis-label').textContent, '收藏解析');
assert(failedSave.ids.get('analysis-save-status').textContent.includes('无法保存'));
console.log('PASS: sample date/routes preserve the current dream and failed analysis favorite stays unsaved');
