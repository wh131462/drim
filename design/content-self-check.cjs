// Run: node design/content-self-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node(attributes = {}) {
    const classes = new Set((attributes.class || '').split(' ').filter(Boolean));
    const element = {
        attributes,
        dataset: {},
        innerHTML: '',
        textContent: '',
        style: {},
        listeners: {},
        classList: {
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name),
            contains: (name) => classes.has(name),
            toggle(name, force = !classes.has(name)) {
                force ? classes.add(name) : classes.delete(name);
                return force;
            }
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
        click() {
            this.listeners.click?.();
        },
        querySelectorAll() {
            return [];
        }
    };
    Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('data-')) element.dataset[key.slice(5)] = value;
    });
    return element;
}

function load(name, selectors, query = '') {
    const html = fs.readFileSync(path.join(__dirname, `${name}.html`), 'utf8');
    const ids = new Map(
        [...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map((match) => [
            match[1],
            node({ class: match[0].match(/class="([^"]+)"/)?.[1] || '' })
        ])
    );
    const document = {
        title: '',
        getElementById: (id) => {
            assert(ids.has(id), `Missing id ${id}`);
            return ids.get(id);
        },
        querySelector: (selector) => selectors[selector]?.[0],
        querySelectorAll: (selector) => selectors[selector] || []
    };
    const storage = new Map();
    const localStorage = {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value)
    };
    const context = vm.createContext({ document, localStorage, URLSearchParams, location: { search: query } });
    const run = (source) => vm.runInContext(source, context);
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert(script, `${name} must contain an interaction script`);
    new vm.Script(script);
    return { html, ids, document, localStorage, storage, run, start: () => run(script) };
}

const daily = node({ 'data-card': '', 'aria-pressed': 'false' });
const three = Array.from({ length: 3 }, () => node({ 'data-card': '', 'aria-pressed': 'false' }));
const modes = ['daily', 'three'].map((mode) => node({ 'data-mode': mode }));
const tarot = load('tarot', {
    '[data-mode]': modes,
    '[data-card]': [daily, ...three],
    '#daily-mode [data-card]': [daily],
    '#three-mode [data-card]': three
});
tarot.start();
assert(tarot.ids.get('daily-reading').classList.contains('hidden'));
daily.click();
assert(!tarot.ids.get('daily-reading').classList.contains('hidden'));
assert.equal(daily.getAttribute('aria-pressed'), 'true');
modes[1].click();
three.slice(0, 2).forEach((card) => card.click());
assert(tarot.ids.get('three-reading').classList.contains('hidden'));
three[2].click();
assert(!tarot.ids.get('three-reading').classList.contains('hidden'));
assert(!tarot.html.includes('每日 00:00'));

const tests = load('tests', { '[data-test]': ['mbti', 'big5'].map((test) => node({ 'data-test': test })) });
tests.start();
assert.equal(tests.run('questionSets.mbti.length'), 8);
for (const dimension of ['EI', 'SN', 'TF', 'JP'])
    assert.equal(tests.run(`questionSets.mbti.filter((q) => q.dimension === '${dimension}').length`), 2);
tests.run('Array.from({ length: 8 }, () => choose(0))');
assert(tests.ids.get('result-title').textContent.startsWith('ESTJ'));
tests.ids.get('restart').click();
tests.run('choose(0); choose(0)');
tests.ids.get('previous').click();
assert.equal(tests.run('current'), 1);
tests.run('choose(1)');
assert.equal(tests.run('answers[1]'), 1);
tests.ids.get('restart').click();
tests.run('Array.from({ length: 8 }, () => choose(1))');
assert(tests.ids.get('result-title').textContent.startsWith('INFP'));
tests.document.querySelectorAll('[data-test]')[1].click();
assert.equal(tests.run('questions.length'), 5);
tests.run('Array.from({ length: 5 }, () => choose(1))');
assert.equal(tests.ids.get('result-title').textContent, '你的五维画像');
assert.equal((tests.ids.get('result-traits').innerHTML.match(/偏低/g) || []).length, 5);

function bookPage(query) {
    const filters = ['all', 'dream', 'emotion', 'relationship', 'saved'].map((filter) =>
        node({ 'data-filter': filter })
    );
    const tabs = ['index', 'discover', 'record', 'profile'].map((page) => node({ href: `${page}.html` }));
    const page = load('books', { '[data-filter]': filters, '.tabbar .tab-item': tabs }, query);
    let rendered = null;
    let saveButtons = [];
    let detailButtons = [];
    page.ids.get('book-list').querySelectorAll = (selector) => {
        const html = page.ids.get('book-list').innerHTML;
        if (html !== rendered) {
            rendered = html;
            saveButtons = [...html.matchAll(/data-save="(\d+)"/g)].map((match) => node({ 'data-save': match[1] }));
            detailButtons = saveButtons.map(() => {
                const button = node();
                const card = node({ class: 'book-card' });
                button.closest = () => card;
                return button;
            });
        }
        return selector === '[data-save]' ? saveButtons : selector === '[data-detail]' ? detailButtons : [];
    };
    return page;
}
const books = bookPage('?filter=invalid');
books.storage.set('drim-saved-books', '[1]');
books.start();
assert.equal(books.run('filter'), 'all');
assert.equal(books.ids.get('page-title').textContent, '心灵书店');
books.document.querySelectorAll('[data-filter]')[4].click();
assert.equal(books.ids.get('page-title').textContent, '我的书架');
assert.equal(books.ids.get('page-back').href, 'profile.html');
assert(books.document.querySelectorAll('.tabbar .tab-item')[3].classList.contains('active'));
assert.equal(books.document.querySelectorAll('[data-filter]')[4].getAttribute('aria-pressed'), 'true');
assert(books.ids.get('book-list').innerHTML.includes('取消收藏《梦的解析》'));
assert(books.ids.get('book-list').innerHTML.includes('参考价'));
const details = books.ids.get('book-list').querySelectorAll('[data-detail]')[0];
details.click();
assert.equal(details.getAttribute('aria-expanded'), 'true');
assert(details.closest('.book-card').classList.contains('expanded'));
details.click();
assert.equal(details.getAttribute('aria-expanded'), 'false');
books.ids.get('book-list').querySelectorAll('[data-save]')[0].click();
assert.equal(books.storage.get('drim-saved-books'), '[]');
assert(!books.ids.get('empty').classList.contains('hidden'));
assert(!books.ids.get('empty-store').classList.contains('hidden'));
books.document.querySelectorAll('[data-filter]')[0].click();
books.localStorage.setItem = () => {
    throw Error('Storage blocked');
};
books.ids.get('book-list').querySelectorAll('[data-save]')[0].click();
assert.equal(books.run('saved.size'), 0);
assert(!books.ids.get('storage-note').classList.contains('hidden'));
const shelf = bookPage('?saved=1');
shelf.storage.set('drim-saved-books', 'broken-json');
shelf.start();
assert.equal(shelf.run('saved.size'), 0);
assert.equal(shelf.document.title, '我的书架 - 梦见');
assert.equal(shelf.ids.get('page-back').href, 'profile.html');
console.log(
    'PASS: tarot reveal gates, both tests and navigation, bookshelf state, safe persistence and failure feedback'
);
