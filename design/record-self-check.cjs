// Run: node design/record-self-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'record.html'), 'utf8');
const prototype = fs.readFileSync(path.join(__dirname, 'prototype.js'), 'utf8');

class Element {
    constructor(tag = 'div', attributes = {}) {
        this.tagName = tag.toUpperCase();
        this.children = [];
        this.listeners = {};
        this.dataset = Object.fromEntries(
            Object.entries(attributes)
                .filter(([key]) => key.startsWith('data-'))
                .map(([key, value]) => [key.slice(5), value])
        );
        this.attributes = attributes;
        this.value = '';
        this.textContent = '';
        this.disabled = this.checked = this.hidden = this.open = false;
        this.scrollHeight = 100;
        const classes = new Set((attributes.class || '').split(' ').filter(Boolean));
        this.classList = {
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name),
            contains: (name) => classes.has(name),
            toggle(name, force = !classes.has(name)) {
                force ? classes.add(name) : classes.delete(name);
                return force;
            }
        };
        this.style = {
            setProperty(name, value) {
                this[name] = value;
            }
        };
    }
    append(...children) {
        this.children.push(...children);
    }
    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }
    getAttribute(name) {
        return this.attributes[name];
    }
    addEventListener(name, callback) {
        (this.listeners[name] ||= []).push(callback);
    }
    trigger(name, event = {}) {
        event.target ||= this;
        event.currentTarget ||= this;
        event.preventDefault ||= () => {
            event.defaultPrevented = true;
        };
        return Promise.all((this.listeners[name] || []).map((callback) => callback(event)));
    }
    click() {
        if (!this.disabled) return this.trigger('click');
    }
    focus() {
        this.focused = true;
    }
    showModal() {
        this.open = true;
    }
    close() {
        this.open = false;
    }
    scrollIntoView() {
        this.scrolledIntoView = true;
    }
    getBoundingClientRect() {
        return { height: 72 };
    }
}

function load({ page = 'record', edit = false, blocked = false, clipboardBlocked = false, storageValue = null } = {}) {
    const source = page === 'record' ? html : fs.readFileSync(path.join(__dirname, `${page}.html`), 'utf8');
    const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert(script, `${page}.html must contain an interaction script`);
    const all = [];
    const ids = new Map();
    for (const match of source.matchAll(/<([a-z]+)\b([^>]*)>/g)) {
        const attributes = Object.fromEntries(
            [...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]])
        );
        if (!attributes.id && !Object.hasOwn(attributes, 'data-leave') && attributes['aria-current'] !== 'page')
            continue;
        const element = new Element(match[1], attributes);
        const closing = source.indexOf(`</${match[1]}>`, match.index + match[0].length);
        if (closing !== -1)
            element.textContent = source
                .slice(match.index + match[0].length, closing)
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        if (match[1] === 'select' && closing !== -1) {
            const selectBody = source.slice(match.index + match[0].length, closing);
            for (const optionMatch of selectBody.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)) {
                const optionAttrs = Object.fromEntries(
                    [...optionMatch[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]])
                );
                const option = new Element('option', optionAttrs);
                option.value = optionAttrs.value || '';
                option.disabled = /\bdisabled\b/.test(optionMatch[1]);
                option.textContent = optionMatch[2]
                    .replace(/<[^>]*>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                element.append(option);
            }
        }
        element.disabled = /\bdisabled\b/.test(match[2]);
        element.hidden = /\bhidden\b/.test(match[2]);
        element.open = /\bopen\b/.test(match[2]);
        if (attributes.id) ids.set(attributes.id, element);
        all.push(element);
    }
    if (ids.has('versionSelect')) ids.get('versionSelect').value = 'original';
    if (ids.has('privacySelect')) ids.get('privacySelect').value = 'private';
    const recordPage = new Element();
    const tabbar = new Element();
    const document = {
        documentElement: { dataset: {} },
        getElementById(id) {
            assert(ids.has(id), `Missing id ${id}`);
            return ids.get(id);
        },
        createElement(tag) {
            const element = new Element(tag);
            all.push(element);
            return element;
        },
        createTextNode: (textContent) => ({ textContent }),
        querySelector(selector) {
            assert(
                ['.record-page', '.tabbar', '[aria-current="page"]'].includes(selector),
                `Unsupported selector ${selector}`
            );
            return selector === '.record-page'
                ? recordPage
                : selector === '.tabbar'
                  ? tabbar
                  : all.find((element) => element.attributes['aria-current'] === 'page');
        },
        querySelectorAll(selector) {
            assert(
                ['[data-tag]', '[data-emotion]', '[data-leave]'].includes(selector),
                `Unsupported selector ${selector}`
            );
            const key = selector.slice(6, -1);
            return all.filter((element) => element.dataset[key] !== undefined);
        }
    };
    let saved = storageValue;
    const windowEvents = {};
    const window = {
        location: { search: edit ? '?edit=1&selfcheck' : '?selfcheck', href: '' },
        addEventListener(name, callback) {
            (windowEvents[name] ||= []).push(callback);
        },
        trigger(name, event = {}) {
            event.preventDefault ||= () => {
                event.defaultPrevented = true;
            };
            (windowEvents[name] || []).forEach((callback) => callback(event));
            return event;
        },
        localStorage: {
            getItem() {
                return null;
            },
            setItem() {}
        },
        sessionStorage: {
            getItem(key) {
                assert.equal(key, 'drim-design-dream');
                if (blocked) throw Error('Storage blocked');
                return saved;
            },
            setItem(key, value) {
                assert.equal(key, 'drim-design-dream');
                if (blocked) throw Error('Storage blocked');
                saved = value;
            }
        }
    };
    const copies = [];
    const context = vm.createContext({
        document,
        window,
        location: window.location,
        URLSearchParams,
        navigator: {
            clipboard: {
                async writeText(value) {
                    if (clipboardBlocked) throw Error('Clipboard blocked');
                    copies.push(value);
                }
            }
        },
        console: { assert: (condition, message) => assert.ok(condition, message) }
    });
    vm.runInContext(prototype, context);
    vm.runInContext(script, context);
    return {
        ids,
        all,
        window,
        document,
        recordPage,
        copies,
        input(value) {
            ids.get('dreamContent').value = value;
            ids.get('dreamContent').trigger('input');
        },
        saved: () => saved && JSON.parse(saved)
    };
}

const inputCard = html.match(/<section[^>]*class="input-card"[^>]*>[\s\S]*?<\/section>/)?.[0];
for (const control of ['versionSelect', 'polishButton']) {
    assert(inputCard?.includes(`id="${control}"`), `${control} stays in the editor`);
    assert(html.indexOf(`id="${control}"`) < html.indexOf('id="privacySelect"'));
}
assert(
    html.indexOf('id="recordStatus"') > html.indexOf('id="recordActions"'),
    'Save feedback stays with the fixed actions'
);
assert.equal((html.match(/class="tab-item/g) || []).length, 4);
assert(!/<(?:div|section)[^>]*class="[^"]*\brecord-intro\b/.test(html), 'The editor starts with the input card');
for (const removed of [
    'moreSettings',
    'privacySummary',
    'privacyToggle',
    'privacyIcon',
    'privacyTitle',
    'privacyDescription',
    'emotionGrid',
    'emotionSummary'
])
    assert(!html.includes(`id="${removed}"`), `${removed} is replaced by direct native choices`);
const privacySelectMarkup = html.match(/<select[^>]*id="privacySelect"[^>]*>[\s\S]*?<\/select>/)?.[0];
assert(privacySelectMarkup?.includes('value="private"') && privacySelectMarkup.includes('value="public"'));
assert(privacySelectMarkup.includes('仅自己可见') && privacySelectMarkup.includes('探索广场可见'));
const emotionSelectMarkup = html.match(/<select[^>]*id="emotionSelect"[^>]*>[\s\S]*?<\/select>/)?.[0];
assert(
    emotionSelectMarkup?.includes('value=""') && emotionSelectMarkup.includes('情绪（可选）'),
    'Empty emotion is an explicit optional choice'
);

const record = load();
const get = (id) => record.ids.get(id);
assert(!get('saveButton').hidden);
assert.equal(get('parseButton').textContent, '保存并解析');
assert.equal(get('inputHint').textContent, '至少 25 字，记得多少就先写多少');
const inputMinimumHeight = get('dreamContent').style.height;
assert(
    Number.parseFloat(inputMinimumHeight) > get('dreamContent').scrollHeight,
    'Initial input has room beyond its empty content'
);
assert(get('polishedOption').disabled && get('polishButton').disabled);
assert(get('polishPreview').hidden);
assert.equal(get('privacySelect').value, 'private');
assert.equal(get('privacySelect').attributes['aria-label'], '梦境隐私');
assert.equal(get('emotionSelect').value, '');
assert.equal(get('emotionSelect').attributes['aria-label'], '梦中情绪');
assert(!get('charCount').classList.contains('insufficient'));
assert(!record.window.trigger('beforeunload').defaultPrevented);
for (const [length, disabled] of [
    [0, true],
    [24, true],
    [25, false],
    [1000, false]
]) {
    record.input('梦'.repeat(length));
    assert.equal(get('parseButton').disabled, disabled);
    assert.equal(get('saveButton').disabled, disabled);
    assert.equal(get('polishButton').disabled, disabled);
    assert.equal(get('charCount').textContent, `${length}/1000`);
    assert(!get('charCount').classList.contains('insufficient'));
    assert.equal(
        get('inputHint').textContent,
        length === 0 ? '至少 25 字，记得多少就先写多少' : length === 24 ? '再写 1 字即可保存' : '已可保存，最多 1000 字'
    );
}
record.input(' '.repeat(25));
assert(get('parseButton').disabled);
assert.equal(get('inputHint').textContent, '至少 25 字，记得多少就先写多少');
assert.equal(get('charCount').textContent, '25/1000');
get('dreamContent').scrollHeight = 460;
record.input('梦'.repeat(120));
assert.equal(get('dreamContent').style.height, '460px', 'Long input grows to its measured height');
get('dreamContent').scrollHeight = 100;
record.input('梦'.repeat(25));
assert.equal(get('dreamContent').style.height, inputMinimumHeight, 'Shortened input shrinks to the minimum');
get('dreamContent').scrollHeight = 320;
record.window.trigger('resize');
assert.equal(get('dreamContent').style.height, '320px');
record.document.activeElement = get('dreamContent');
record.window.innerHeight = 844;
record.window.visualViewport = { height: 500, offsetTop: 0 };
record.window.trigger('resize');
assert(record.recordPage.classList.contains('keyboard-open'));
assert.equal(record.recordPage.style['--record-actions-bottom'], '344px');
record.window.visualViewport.height = 844;
record.window.trigger('resize');
assert(!record.recordPage.classList.contains('keyboard-open'));
assert.equal(record.recordPage.style['--record-actions-bottom'], '72px');
record.input('梦'.repeat(1001));
assert.equal(get('dreamContent').value.length, 1000);
record.input('这是醒来后还记得的原始梦境内容，我在森林里寻找一条安静的小路。');
const original = get('dreamContent').value;
const tags = record.all.filter((element) => element.dataset.tag);
assert.equal(tags.length, 8, 'All eight common dream elements remain available');
assert.deepEqual(
    tags.map((button) => button.children[0]?.textContent),
    ['追逐', '飞行', '考试', '亲人', '水', '动物', '迷路', '死亡']
);
assert(
    tags.every((button) => button.children.length === 1 && !button.children[0].tagName),
    'Common tag buttons contain text without emoji spans'
);
tags.slice(0, 4).forEach((button) => button.click());
assert.equal(tags.filter((button) => button.attributes['aria-pressed'] === 'true').length, 3);
assert.match(get('tagHint').textContent, /最多选择 3/);
assert.equal(get('recordStatus').textContent, '');
tags[0].click();
tags[3].click();
get('customTagInput').value = '<b>童年</b>';
get('addTagButton').click();
assert.match(get('tagHint').textContent, /最多选择 3/);
tags[1].click();
let prevented = false;
get('customTagInput').trigger('keydown', {
    key: 'Enter',
    preventDefault() {
        prevented = true;
    }
});
const customTag = record.all.find((element) => element.dataset.tag === '<b>童年</b>');
assert(prevented && customTag);
assert.equal(customTag.children[0].textContent, '<b>童年</b>', 'Custom label must remain text');
customTag.click();
assert(get('customTagEditor').hidden);
get('customTagToggle').click();
assert(!get('customTagEditor').hidden && get('customTagInput').focused);
assert.equal(get('customTagToggle').attributes['aria-expanded'], 'true');
get('customTagToggle').click();
assert(get('customTagEditor').hidden);
get('customTagInput').value = '';
get('addTagButton').click();
assert.match(get('tagHint').textContent, /请先输入标签/);
assert.equal(customTag.attributes['aria-pressed'], 'false');
customTag.click();

const emotionOptions = get('emotionSelect').children;
assert.equal(emotionOptions.length, 15, 'An optional empty choice plus fourteen emotions remain available');
assert.equal(emotionOptions[0].value, '');
assert.match(emotionOptions[0].textContent, /情绪（可选）/);
assert(
    emotionOptions
        .slice(1)
        .every(
            (option) =>
                option.tagName === 'OPTION' && option.value && option.textContent.trim().split(/\s+/).length === 2
        ),
    'Emotion choices retain their symbol and text label'
);
assert.deepEqual(
    emotionOptions.slice(1).map((option) => option.value),
    [
        'happy',
        'sad',
        'angry',
        'fear',
        'surprise',
        'disgust',
        'calm',
        'anxious',
        'confused',
        'excited',
        'lonely',
        'shame',
        'love',
        'bored'
    ]
);
get('emotionSelect').value = 'calm';
get('emotionSelect').trigger('change');
get('emotionSelect').value = '';
get('emotionSelect').trigger('change');
assert.equal(get('emotionSelect').value, '');
get('emotionSelect').value = 'calm';
get('emotionSelect').trigger('change');
get('privacySelect').value = 'public';
get('privacySelect').trigger('change');

get('polishButton').click();
assert.equal(get('dreamContent').value, original, 'Opening preview does not replace the original');
assert(!get('polishPreview').hidden);
assert.match(get('polishPreviewHint').textContent, /未根据你的文字生成/);
assert(get('polishPreviewContent').textContent.length >= 25);
get('cancelPolish').click();
assert(get('polishPreview').hidden && get('polishButton').focused);
assert.equal(get('dreamContent').value, original);
assert(get('polishedOption').disabled);
get('polishButton').click();
get('dreamContent').scrollHeight = 260;
get('applyPolish').click();
assert.notEqual(get('dreamContent').value, original);
assert.equal(get('dreamContent').style.height, '260px');
assert(!get('polishedOption').disabled);
assert(get('polishPreview').hidden);
const polishedEdit = `${get('dreamContent').value}我还记得风从耳边吹过。`;
record.input(polishedEdit);
get('versionSelect').value = 'original';
get('dreamContent').scrollHeight = 100;
get('versionSelect').trigger('change');
assert.equal(get('dreamContent').value, original);
assert.equal(get('dreamContent').style.height, inputMinimumHeight);
get('versionSelect').value = 'polished';
get('dreamContent').scrollHeight = 360;
get('versionSelect').trigger('change');
assert.equal(get('dreamContent').value, polishedEdit, 'Polished edits must survive version switching');
assert.equal(get('dreamContent').style.height, '360px');
get('polishButton').click();
assert.equal(get('polishPreviewContent').textContent, polishedEdit, 'Retained polished text is previewed');
assert.match(get('polishPreviewHint').textContent, /已保留的润色版本/);
get('cancelPolish').click();
get('parseButton').click();
assert.equal(record.window.location.href, 'result.html');
const draft = record.saved();
assert.equal(draft.content, polishedEdit);
assert.equal(draft.tags.length, 3);
assert.equal(draft.emotion, 'calm');
assert.equal(draft.isPublic, true);
assert.equal(draft.versions.original, original);
assert.equal(draft.versions.polished, polishedEdit);
assert.equal(draft.activeVersion, 'polished');
assert(!Number.isNaN(Date.parse(draft.recordedAt)));
assert(!record.window.trigger('beforeunload').defaultPrevented, 'Successful save clears dirty protection');

const edited = load({ edit: true, storageValue: JSON.stringify(draft) });
assert.equal(edited.ids.get('editState').textContent, '已保存');
assert.equal(edited.ids.get('pageTitle').textContent, '编辑梦境');
assert.equal(edited.ids.get('dreamContent').value, polishedEdit);
assert.equal(edited.ids.get('versionSelect').value, 'polished');
assert.equal(edited.ids.get('emotionSelect').value, 'calm');
assert.equal(edited.ids.get('privacySelect').value, 'public');
edited.ids.get('versionSelect').value = 'original';
edited.ids.get('versionSelect').trigger('change');
assert.equal(edited.ids.get('dreamContent').value, original, 'Saved original survives a page reload');
edited.ids.get('versionSelect').value = 'polished';
edited.ids.get('versionSelect').trigger('change');
assert.equal(edited.ids.get('dreamContent').value, polishedEdit);
assert.equal(edited.ids.get('saveButton').hidden, false);
assert.equal(edited.ids.get('parseButton').textContent, '保存并重新解析');
edited.input(`${polishedEdit}这是补充记录。`);
edited.ids.get('saveButton').click();
assert.equal(edited.window.location.href, 'dream-detail.html');
assert.equal(edited.saved().recordedAt, draft.recordedAt);
edited.ids.get('parseButton').click();
assert.equal(edited.window.location.href, 'result.html');

const blocked = load({ edit: true, blocked: true });
assert.equal(blocked.ids.get('dreamContent').value, '', 'Blocked reads never replace a missing dream with a sample');
assert.equal(blocked.ids.get('editState').textContent, '未找到记录');
blocked.input(`${original}这段补充还没有保存。`);
const unsaved = blocked.ids.get('dreamContent').value;
blocked.ids.get('saveButton').click();
assert.equal(blocked.window.location.href, '');
assert.match(blocked.ids.get('recordStatus').textContent, /未允许临时保存/);
assert.equal(blocked.ids.get('dreamContent').value, unsaved);
blocked.ids.get('parseButton').click();
assert.equal(blocked.window.location.href, '');
assert.match(blocked.ids.get('recordStatus').textContent, /无法进入解析结果/);
assert.equal(blocked.ids.get('dreamContent').value, unsaved);
assert(blocked.window.trigger('beforeunload').defaultPrevented, 'Failed save keeps dirty protection');
const missingEdit = load({ edit: true });
assert.equal(missingEdit.ids.get('dreamContent').value, '');
assert.equal(missingEdit.ids.get('editState').textContent, '未找到记录');
assert.match(missingEdit.ids.get('recordStatus').textContent, /未找到可编辑/);
assert(!missingEdit.window.trigger('beforeunload').defaultPrevented);
const composingTag = load();
composingTag.ids.get('customTagInput').value = '组合中';
composingTag.ids.get('customTagInput').trigger('keydown', { key: 'Enter', isComposing: true });
assert.equal(composingTag.ids.get('customTagInput').value, '组合中', 'IME Enter keeps composing text');
assert(!composingTag.all.some((element) => element.dataset.tag === '组合中'));
composingTag.ids.get('customTagInput').trigger('keydown', { key: 'Enter', keyCode: 229 });
assert(!composingTag.all.some((element) => element.dataset.tag === '组合中'));
for (const storageValue of ['broken-json', '{}', '[]', 'null', '42'])
    assert(load({ storageValue }).ids.get('parseButton').disabled);
for (const storageValue of ['broken-json', '{}', '[]', 'null', '42']) {
    const invalidEdit = load({ edit: true, storageValue });
    assert.equal(invalidEdit.ids.get('dreamContent').value, '');
    assert.equal(invalidEdit.ids.get('editState').textContent, '未找到记录');
}
const damaged = load({
    edit: true,
    storageValue: JSON.stringify({
        content: '梦'.repeat(2000),
        tags: ['flying', 'water', 'exam', 'lost'],
        emotion: 'invalid',
        isPublic: 'yes'
    })
});
damaged.ids.get('parseButton').click();
assert.equal(damaged.saved().content.length, 1000);
assert.equal(damaged.saved().tags.length, 3);
assert.equal(damaged.saved().emotion, null);
assert.equal(damaged.saved().isPublic, false);

const fresh = load({ storageValue: JSON.stringify(draft) });
assert.equal(fresh.ids.get('dreamContent').value, '', 'New recording must start empty');
assert.equal(fresh.ids.get('versionSelect').value, 'original');
assert(fresh.ids.get('parseButton').disabled);
fresh.input(original);
fresh.ids.get('saveButton').click();
assert.equal(fresh.window.location.href, 'dream-detail.html');
assert.equal(fresh.saved().content, original);
assert.equal(fresh.saved().activeVersion, 'original');
assert.equal(fresh.saved().versions.polished, '', 'Fresh records do not invent a polished version');
assert(!fresh.window.trigger('beforeunload').defaultPrevented, 'Successful save clears the baseline');

const clean = load();
assert.equal(
    clean.all.filter((element) => element.dataset.leave).length,
    4,
    'Back button and three destination tabs are registered'
);
const cleanBack = {};
clean.ids.get('backButton').trigger('click', cleanBack);
assert(cleanBack.defaultPrevented);
assert.equal(clean.window.location.href, 'index.html');
assert(!clean.ids.get('leaveDialog').open);
const currentTab = clean.all.find((element) => element.attributes['aria-current'] === 'page');
const currentClick = {};
currentTab.trigger('click', currentClick);
assert(currentClick.defaultPrevented, 'Current tab cannot reload the editor');
assert(!clean.ids.get('leaveDialog').open);

const unmodified = load({ edit: true, storageValue: JSON.stringify(draft) });
assert(!unmodified.window.trigger('beforeunload').defaultPrevented);
unmodified.ids.get('customTagInput').value = '尚未添加';
assert(!unmodified.window.trigger('beforeunload').defaultPrevented, 'Unadded custom text does not change the dream');
const firstSelected = unmodified.all.find((element) => element.dataset.tag === draft.tags[0]);
firstSelected.click();
firstSelected.click();
assert(!unmodified.window.trigger('beforeunload').defaultPrevented, 'Reordering the same selected tags stays clean');
unmodified.ids.get('backButton').click();
assert.equal(unmodified.window.location.href, 'index.html');
assert(!unmodified.ids.get('leaveDialog').open);

const clearedChoices = load({ edit: true, storageValue: JSON.stringify(draft) });
clearedChoices.ids.get('emotionSelect').value = '';
clearedChoices.ids.get('emotionSelect').trigger('change');
clearedChoices.ids.get('privacySelect').value = 'private';
clearedChoices.ids.get('privacySelect').trigger('change');
assert(
    clearedChoices.window.trigger('beforeunload').defaultPrevented,
    'Clearing emotion and private choice change the stored record'
);
clearedChoices.ids.get('saveButton').click();
assert.equal(clearedChoices.saved().emotion, null, 'Choosing empty emotion removes the saved emotion');
assert.equal(clearedChoices.saved().isPublic, false, 'Private choice is saved as false');
assert(!clearedChoices.window.trigger('beforeunload').defaultPrevented);

const dirtyChanges = {
    content: (page) => page.input(`${page.ids.get('dreamContent').value}新画面。`),
    tag: (page) => page.all.find((element) => element.dataset.tag === draft.tags[0]).click(),
    emotion: (page) => {
        page.ids.get('emotionSelect').value = 'fear';
        page.ids.get('emotionSelect').trigger('change');
    },
    privacy: (page) => {
        page.ids.get('privacySelect').value = 'private';
        page.ids.get('privacySelect').trigger('change');
    },
    version: (page) => {
        page.ids.get('versionSelect').value = 'original';
        page.ids.get('versionSelect').trigger('change');
    }
};
for (const [name, change] of Object.entries(dirtyChanges)) {
    const page = load({ edit: true, storageValue: JSON.stringify(draft) });
    change(page);
    const beforeUnload = page.window.trigger('beforeunload');
    assert(beforeUnload.defaultPrevented, `${name} changes must protect unsaved work`);
    assert.equal(beforeUnload.returnValue, '');
    const destination = page.all.find((element) => element.dataset.leave === 'discover.html');
    const navigation = {};
    destination.trigger('click', navigation);
    assert(navigation.defaultPrevented);
    assert(page.ids.get('leaveDialog').open);
    assert.equal(page.window.location.href, '');
    const beforeCancel = page.ids.get('dreamContent').value;
    page.ids.get('keepEditing').click();
    assert(!page.ids.get('leaveDialog').open);
    assert.equal(page.window.location.href, '');
    assert.equal(page.ids.get('dreamContent').value, beforeCancel);
    destination.click();
    page.ids.get('discardChanges').click();
    assert(!page.ids.get('leaveDialog').open);
    assert.equal(page.window.location.href, 'discover.html');
    assert(!page.window.trigger('beforeunload').defaultPrevented, 'Confirmed discard permits navigation');
}

const previewOnly = load({ edit: true, storageValue: JSON.stringify(draft) });
previewOnly.ids.get('polishButton').click();
assert(
    !previewOnly.window.trigger('beforeunload').defaultPrevented,
    'Previewing retained text does not modify the record'
);
previewOnly.ids.get('cancelPolish').click();
assert(!previewOnly.window.trigger('beforeunload').defaultPrevented);
const newDirty = load();
newDirty.input(original);
newDirty.ids.get('backButton').click();
assert(newDirty.ids.get('leaveDialog').open, 'New unsaved writing prompts on back');
newDirty.ids.get('keepEditing').click();
newDirty.ids.get('saveButton').click();
assert.equal(newDirty.window.location.href, 'dream-detail.html');
assert.equal(newDirty.saved().content, original);
assert.equal(newDirty.ids.get('editState').textContent, '已保存');
assert(!newDirty.window.trigger('beforeunload').defaultPrevented);
const incompleteVersion = load({
    edit: true,
    storageValue: JSON.stringify({ ...draft, versions: {}, activeVersion: 'polished' })
});
assert.equal(
    incompleteVersion.ids.get('dreamContent').value,
    draft.content,
    'Missing active version recovers the saved content'
);

(async () => {
    const history = load({ page: 'dream-versions', storageValue: JSON.stringify(draft) });
    assert.equal(history.ids.get('originalContent').textContent, original);
    assert.equal(history.ids.get('polishedContent').textContent, polishedEdit);
    assert.equal(history.ids.get('polishedCurrent').hidden, false);
    history.ids.get('compareButton').click();
    assert.equal(history.ids.get('comparePanel').hidden, false);
    assert.equal(history.ids.get('compareButton').attributes['aria-expanded'], 'true');
    assert.equal(history.ids.get('compareOriginal').textContent, original);
    history.ids.get('switchOriginal').click();
    assert.equal(history.saved().activeVersion, 'original');
    assert.equal(history.saved().content, original);
    assert.equal(history.saved().versions.polished, polishedEdit);
    await history.ids.get('copyPolished').click();
    assert.deepEqual(history.copies, [polishedEdit]);
    assert.match(history.ids.get('versionStatus').textContent, /已复制/);
    history.ids.get('editLink').trigger('click', {
        preventDefault() {
            throw Error('Editable version should save');
        }
    });
    const reloaded = load({ edit: true, storageValue: JSON.stringify(history.saved()) });
    assert.equal(reloaded.ids.get('dreamContent').value, original);
    assert.equal(reloaded.ids.get('versionSelect').value, 'original');

    const noData = load({ page: 'dream-versions' });
    assert.match(noData.ids.get('versionSource').textContent, /静态示例/);
    noData.ids.get('switchPolished').click();
    assert.equal(noData.saved(), null);
    assert(noData.ids.get('switchOriginal').disabled);
    assert(noData.ids.get('switchPolished').disabled);
    const short = load({
        page: 'dream-versions',
        storageValue: JSON.stringify({ ...draft, versions: { original: '太短', polished: polishedEdit } })
    });
    assert(short.ids.get('switchOriginal').disabled);
    assert.match(short.ids.get('originalMeta').textContent, /25～1000/);
    const failure = load({
        page: 'dream-versions',
        clipboardBlocked: true,
        storageValue: JSON.stringify({ ...draft, activeVersion: 'original', content: original })
    });
    failure.window.sessionStorage.setItem = () => {
        throw Error('Write blocked');
    };
    failure.ids.get('switchPolished').click();
    assert.match(failure.ids.get('versionStatus').textContent, /当前版本没有改变/);
    assert.equal(failure.ids.get('originalCurrent').hidden, false);
    await failure.ids.get('copyOriginal').click();
    assert.match(failure.ids.get('versionStatus').textContent, /手动复制/);
    let editPrevented = false;
    failure.ids.get('editLink').trigger('click', {
        preventDefault() {
            editPrevented = true;
        }
    });
    assert(editPrevented);

    console.log(
        'PASS: neutral hints/autoheight, preview/apply, tags/privacy, dirty leave choices, fresh/edit saves, persisted versions, readonly history/comparison/clipboard and storage failures'
    );
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
