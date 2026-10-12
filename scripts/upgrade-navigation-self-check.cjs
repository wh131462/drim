/* eslint-disable @typescript-eslint/no-require-imports */
// Run: node scripts/upgrade-navigation-self-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { ref, computed } = require('vue');

function loadPage(file, exposed, mocks) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
    const code = script.replace(/^import .*$/gm, '') + `\nglobalThis.page = { ${exposed.join(', ')} };`;
    const context = { ref, computed, console: { error() {}, warn() {} }, onMounted() {}, onShow() {}, ...mocks };
    vm.runInNewContext(
        ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText,
        context
    );
    return context.page;
}

async function main() {
    const calls = [];
    const requests = [];
    let likes = 0;
    let releaseLike;
    const mocks = {
        useUserStore: () => ({ isVip: false }),
        getExploreFeedAdUnitId: () => '',
        isNativeAdAvailable: () => false,
        uni: { navigateTo: (item) => calls.push(item.url), showToast() {} },
        exploreApi: {
            getPublicDreams(params) {
                return new Promise((resolve, reject) => requests.push({ params, resolve, reject }));
            },
            toggleLike() {
                likes++;
                return new Promise((resolve) => {
                    releaseLike = resolve;
                });
            }
        }
    };
    const page = loadPage(
        'src/pages/explore/index.vue',
        [
            'loadPublicDreams',
            'selectFilter',
            'handleSearch',
            'onLoadMore',
            'toggleLike',
            'searchKeyword',
            'publicDreams',
            'loading',
            'loadError',
            'page',
            'goToTarot',
            'goToTests',
            'goToBooks'
        ],
        mocks
    );
    const response = (id, count = 1) => ({
        list: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}` })),
        total: count
    });
    const tick = () => new Promise(setImmediate);

    const initial = page.loadPublicDreams();
    page.selectFilter('flying');
    assert.equal(requests[1].params.tag, 'flying');
    requests[1].resolve(response('new'));
    await tick();
    requests[0].resolve(response('stale'));
    await initial;
    assert.equal(page.publicDreams.value[0].id, 'new-0', '旧筛选响应不能覆盖新结果');

    page.searchKeyword.value = '考试';
    page.handleSearch();
    assert.equal(requests[2].params.keyword, '考试');
    requests[2].resolve(response('search', 10));
    await tick();
    page.searchKeyword.value = '尚未提交';
    page.onLoadMore();
    assert.equal(requests[3].params.page, 2);
    assert.equal(requests[3].params.keyword, '考试', '分页应继续已提交的搜索');
    requests[3].reject(new Error('网络中断'));
    await tick();
    assert.equal(page.page.value, 2, '请求失败不能跳过页码');
    assert.equal(page.loadError.value, '网络中断');
    page.onLoadMore();
    assert.equal(requests[4].params.page, 2);
    requests[4].resolve(response('next'));
    await tick();
    assert.equal(page.publicDreams.value.length, 11);

    page.searchKeyword.value = '';
    page.handleSearch();
    assert.equal(requests[5].params.keyword, undefined, '空搜索应恢复分类内全部梦境');
    requests[5].resolve(response('all'));
    await tick();

    page.handleSearch();
    page.selectFilter('water');
    requests[6].reject(new Error('旧请求失败'));
    await tick();
    assert.equal(page.loading.value, true, '旧请求失败不能结束新请求加载状态');
    assert.equal(page.loadError.value, '');
    requests[7].resolve(response('water'));
    await tick();

    const dream = { id: 'liked', isLiked: false, likeCount: 0 };
    const liking = page.toggleLike(dream);
    await page.toggleLike(dream);
    assert.equal(likes, 1, '点赞请求未完成时不能重复提交');
    releaseLike({ isLiked: true, likeCount: 1 });
    await liking;
    assert.equal(dream.isLiked, true);
    page.goToTarot();
    page.goToTests();
    page.goToBooks();
    assert.deepEqual(calls, ['/pages/tarot/index', '/pages/tests/index', '/pages/books/index']);

    const props = { selected: 2, beforeSwitch: async () => false };
    const tabCalls = [];
    const tab = loadPage('src/custom-tab-bar/index.vue', ['switchTab', 'tabList'], {
        useUserStore: () => ({}),
        defineProps: () => props,
        withDefaults: (value) => value,
        uni: { switchTab: (item) => tabCalls.push(item.url) }
    });
    assert.equal(tab.tabList.length, 4);
    assert.equal(tab.tabList[1].text, '发现');
    await tab.switchTab(0);
    assert.equal(tabCalls.length, 0, '取消离开时不能导航');
    props.beforeSwitch = async () => true;
    await tab.switchTab(0);
    assert.deepEqual(tabCalls, ['/pages/index/index']);
    await tab.switchTab(2);
    assert.equal(tabCalls.length, 1, '点击当前 Tab 不应重新打开');
    console.log('首页/发现导航和信息流自检通过');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
