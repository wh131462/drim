// Run: node design/profile-self-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'profile.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function load(storageValue = null, storageBlocked = false, now = '2026-10-09T10:00:00.000Z') {
    class FixedDate extends Date {
        constructor(...args) {
            super(...(args.length ? args : [now]));
        }
        static now() {
            return Date.parse(now);
        }
    }
    const elements = new Map();
    function element(tag = 'span') {
        return {
            tag,
            children: [],
            attributes: {},
            listeners: {},
            append(child) {
                this.children.push(child);
            },
            replaceChildren() {
                this.children = [];
            },
            setAttribute(name, value) {
                this.attributes[name] = value;
            },
            addEventListener(name, listener) {
                this.listeners[name] = listener;
            }
        };
    }
    const document = {
        createElement: element,
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, element());
            return elements.get(id);
        }
    };
    const sessionStorage = {
        getItem(key) {
            assert.equal(key, 'drim-design-dream');
            if (storageBlocked) throw new Error('Storage blocked');
            return storageValue;
        }
    };
    vm.runInNewContext(script, { document, Date: FixedDate, Intl, sessionStorage });
    const days = () =>
        elements.get('calendar-days').children.filter((node) => node.className?.startsWith('calendar-day'));
    return { elements, days };
}

const initial = load();
assert.equal(initial.elements.get('calendar-month').textContent, '2026年10月');
assert.equal(initial.days().length, 31);
assert.equal(initial.elements.get('calendar-days').children.length, 42); // 7 weekday headings + 4 blanks + 31 dates.
assert.equal(initial.days().filter((day) => day.href?.startsWith('dream-detail.html?sample=1&date=')).length, 7);
assert.equal(initial.days().find((day) => day.attributes['aria-current'] === 'date').textContent, 9);
assert.match(initial.elements.get('calendar-summary').textContent, /7 天/);
for (const day of initial.days().filter((day) => day.href)) {
    assert.equal(day.href, `dream-detail.html?sample=1&date=2026-10-${String(day.textContent).padStart(2, '0')}`);
}

initial.elements.get('previous-month').listeners.click();
assert.equal(initial.elements.get('calendar-month').textContent, '2026年9月');
assert.equal(initial.days().length, 30);
assert.equal(initial.days().filter((day) => day.href).length, 8);
for (const day of initial.days().filter((day) => day.href)) {
    assert.equal(day.href, `dream-detail.html?sample=1&date=2026-09-${String(day.textContent).padStart(2, '0')}`);
}
initial.elements.get('next-month').listeners.click();
initial.elements.get('next-month').listeners.click();
assert.equal(initial.elements.get('calendar-month').textContent, '2026年11月');
assert.equal(initial.days().length, 30);
assert.equal(initial.days().filter((day) => day.href).length, 0);
initial.elements.get('next-month').listeners.click();
initial.elements.get('next-month').listeners.click();
assert.equal(initial.elements.get('calendar-month').textContent, '2027年1月');
assert.equal(initial.days().length, 31);

const saved = load(
    JSON.stringify({
        content: '昨晚我梦见在树林中散步，抬头看到了远方明亮的星星。',
        recordedAt: '2026-10-09T10:00:00.000Z'
    })
);
assert.equal(saved.elements.get('checkin-title').textContent, '今天已经记梦');
assert.equal(saved.elements.get('total-count').textContent, '16');
assert.equal(saved.elements.get('month-count').textContent, '8');
assert.equal(saved.elements.get('streak-count').textContent, '8');
assert.equal(saved.elements.get('checkin-action').href, 'dream-detail.html');
assert.equal(saved.days().filter((day) => day.href).length, 8);

// Shanghai crosses into October 9 at 16:00 UTC on October 8.
assert.equal(
    load(JSON.stringify({ content: 'valid', recordedAt: '2026-10-08T16:00:00.000Z' }))
        .days()
        .filter((day) => day.href).length,
    8
);
assert.equal(
    load(JSON.stringify({ content: 'valid', recordedAt: '2026-10-08T15:59:59.000Z' }))
        .days()
        .filter((day) => day.href).length,
    7
);

for (const damaged of [
    'broken-json',
    '{}',
    '[]',
    'null',
    '42',
    '{"content":42,"recordedAt":"2026-10-09"}',
    '{"content":" ","recordedAt":"2026-10-09"}',
    '{"content":"valid","recordedAt":"invalid-date"}',
    '{"content":"valid","recordedAt":{}}'
]) {
    assert.equal(
        load(damaged)
            .days()
            .filter((day) => day.href).length,
        7,
        damaged
    );
}
assert.equal(
    load(null, true)
        .days()
        .filter((day) => day.href).length,
    7
);

const nextDay = load(null, false, '2026-10-09T16:00:00.000Z');
assert.equal(nextDay.days().find((day) => day.attributes['aria-current'] === 'date').textContent, 10);
assert.equal(nextDay.days().filter((day) => day.href?.startsWith('dream-detail.html?sample=1&date=')).length, 7);
assert.equal(nextDay.elements.get('month-count').textContent, '7');
const savedNextDay = load(
    JSON.stringify({ content: 'valid', recordedAt: '2026-10-09T16:00:00.000Z' }),
    false,
    '2026-10-10T03:00:00.000Z'
);
assert.equal(savedNextDay.elements.get('checkin-title').textContent, '今天已经记梦');
assert.equal(savedNextDay.days().find((day) => day.attributes['aria-current'] === 'date').href, 'dream-detail.html');
assert.equal(savedNextDay.days().filter((day) => day.href?.startsWith('dream-detail.html?sample=1&date=')).length, 7);
const yesterdaySaved = load(
    JSON.stringify({ content: 'valid', recordedAt: '2026-10-09T10:00:00.000Z' }),
    false,
    '2026-10-10T03:00:00.000Z'
);
assert.equal(yesterdaySaved.days().filter((day) => day.href === 'dream-detail.html').length, 0);

const newMonth = load(null, false, '2026-11-01T03:00:00.000Z');
assert.equal(newMonth.elements.get('calendar-month').textContent, '2026年11月');
assert.equal(newMonth.elements.get('month-count').textContent, '0');
assert.equal(newMonth.elements.get('total-count').textContent, '15');
assert.equal(newMonth.days().length, 30);
assert.equal(newMonth.days().find((day) => day.attributes['aria-current'] === 'date').textContent, 1);
newMonth.elements.get('previous-month').listeners.click();
assert.equal(newMonth.elements.get('calendar-month').textContent, '2026年10月');
assert.equal(newMonth.days().filter((day) => day.href).length, 15);
const savedNewMonth = load(
    JSON.stringify({ content: 'valid', recordedAt: '2026-11-01T03:00:00.000Z' }),
    false,
    '2026-11-01T03:00:00.000Z'
);
assert.equal(savedNewMonth.elements.get('month-count').textContent, '1');
assert.equal(savedNewMonth.elements.get('total-count').textContent, '16');
assert.equal(savedNewMonth.elements.get('streak-count').textContent, '8');
assert.equal(savedNewMonth.days().filter((day) => day.href === 'dream-detail.html').length, 1);
const newYear = load(null, false, '2027-01-01T03:00:00.000Z');
assert.equal(newYear.elements.get('calendar-month').textContent, '2027年1月');
assert.equal(newYear.elements.get('month-count').textContent, '0');
newYear.elements.get('previous-month').listeners.click();
assert.equal(newYear.elements.get('calendar-month').textContent, '2026年12月');
assert.equal(newYear.days().filter((day) => day.href).length, 15);
for (const day of newYear.days().filter((day) => day.href)) {
    assert.equal(day.href, `dream-detail.html?sample=1&date=2026-12-${String(day.textContent).padStart(2, '0')}`);
}

for (const target of [
    'record.html',
    'books.html',
    'vip.html',
    'achievements.html',
    'settings.html',
    'discover.html',
    'dream-detail.html'
]) {
    assert(fs.existsSync(path.join(__dirname, target)), `Missing linked page ${target}`);
}
assert(html.includes('href="books.html?saved=1"'));
assert.equal((html.match(/class="tab-item/g) || []).length, 4);
console.log(
    'PASS: profile real Shanghai dates, calendar/month/year switching, current check-in vs sample history, damaged-storage fallback and linked menus'
);
