/* eslint-disable @typescript-eslint/no-require-imports -- Standalone offline startup regression check. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/pages/index/index.vue'), 'utf8');
const loadHome = source.match(/async function loadHome\([\s\S]*?\n\}/)?.[0];
assert.ok(loadHome);
let rejectLogin;
let logins = 0;
let dataLoads = 0;
const state = {
    Error,
    pageLoading: { value: false },
    pageError: { value: '' },
    userStore: {
        isLoggedIn: false,
        login: () => {
            logins++;
            return new Promise((_, reject) => {
                rejectLogin = reject;
            });
        }
    },
    refreshWelcome: () => {},
    loadPageData: async () => {
        dataLoads++;
    }
};
vm.runInNewContext(
    ts.transpileModule(loadHome, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText,
    state
);

async function check() {
    const first = state.loadHome();
    const duplicate = state.loadHome();
    assert.equal(logins, 1);
    assert.equal(state.pageLoading.value, true);
    rejectLogin(new Error('无法连接服务'));
    await Promise.all([first, duplicate]);
    assert.equal(state.pageLoading.value, false);
    assert.equal(state.pageError.value, '无法连接服务');
    assert.equal(dataLoads, 0);
    state.userStore.login = async () => {
        logins++;
        state.userStore.isLoggedIn = true;
    };
    await state.loadHome();
    assert.equal(logins, 2);
    assert.equal(dataLoads, 1);
    assert.equal(state.pageError.value, '');
    assert.equal(state.pageLoading.value, false);
    state.loadPageData = async () => {
        throw new Error('服务连接超时');
    };
    await state.loadHome();
    assert.equal(state.pageError.value, '服务连接超时');
    assert.equal(state.pageLoading.value, false);
    console.log(
        'Home loading self-check passed: offline failures release loading; explicit retry works without duplicate login.'
    );
}
check().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
