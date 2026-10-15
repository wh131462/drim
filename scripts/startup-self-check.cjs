/* eslint-disable @typescript-eslint/no-require-imports -- Standalone startup/request regression check. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

async function assertSettled(promise, rejected = false) {
    const result = await Promise.race([
        promise.then(
            (value) => ({ value }),
            (error) => ({ error })
        ),
        new Promise((resolve) => setImmediate(() => resolve({ pending: true })))
    ]);
    assert.ok(!result.pending, 'callback must settle its promise instead of leaving it pending');
    assert.equal(Boolean(result.error), rejected);
    return result;
}

function transpile(source, filename) {
    return ts.transpileModule(source, {
        fileName: filename,
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            esModuleInterop: true
        }
    }).outputText;
}

function run(source, filename, globals, requireModule = () => ({})) {
    const module = { exports: {} };
    const context = {
        module,
        exports: module.exports,
        require: requireModule,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        setTimeout,
        clearTimeout,
        ...globals
    };
    vm.runInNewContext(transpile(source, filename), context, { filename });
    return module.exports;
}

function scriptPart(relativePath) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const match = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
    assert.ok(match, `${relativePath} has no script setup`);
    return match[1];
}

async function checkAppStartup() {
    const lifecycle = {};
    let loginCalls = 0;
    let scheduledRetries = 0;
    let resolveLogin;
    const login = () => {
        loginCalls++;
        return new Promise((resolve) => {
            resolveLogin = resolve;
        });
    };
    const userStore = {
        isLoggedIn: false,
        token: '',
        checkLogin: () => false,
        refreshVipStatus: () => {},
        login
    };
    run(
        scriptPart('src/App.vue'),
        'src/App.vue',
        {
            uni: { $on: () => {} },
            setTimeout: () => ++scheduledRetries
        },
        (name) => {
            if (name === '@dcloudio/uni-app') {
                return {
                    onLaunch: (callback) => (lifecycle.launch = callback),
                    onShow: (callback) => (lifecycle.show = callback),
                    onHide: () => {}
                };
            }
            if (name === '@/stores') return { useUserStore: () => userStore };
            throw new Error(`unexpected import ${name}`);
        }
    );

    const launch = lifecycle.launch();
    const show = lifecycle.show();
    assert.equal(loginCalls, 1, 'launch and show must share one initialization chain');
    resolveLogin(false);
    await assertSettled(Promise.all([launch, show]));

    let failed = true;
    userStore.login = async () => {
        loginCalls++;
        if (failed) {
            failed = false;
            throw new Error('offline');
        }
        return false;
    };
    userStore.isLoggedIn = false;
    userStore.token = '';
    await assertSettled(lifecycle.show());
    assert.equal(loginCalls, 2, 'an initialization failure must not schedule an automatic retry');
    assert.equal(scheduledRetries, 0, 'failed initialization must not schedule a timer');
    await assertSettled(lifecycle.show());
    assert.equal(loginCalls, 3, 'a later show must be allowed to retry');
}

function loadRequest(baseUrl, options = {}) {
    const source = fs
        .readFileSync(path.join(root, 'src/api/request.ts'), 'utf8')
        .replace(/import\.meta\.env\.VITE_API_BASE_URL/g, JSON.stringify(baseUrl))
        .replace(/import\.meta\.env\.VITE_USE_MOCK/g, '"false"');
    const storage = { token: options.token || '' };
    const requestCalls = [];
    const reLaunch = [];
    const emitted = [];
    const ui = { loading: 0, toasts: 0 };
    const uni = {
        getStorageSync: (key) => storage[key],
        setStorageSync: (key, value) => (storage[key] = value),
        removeStorageSync: (key) => delete storage[key],
        showLoading: () => ui.loading++,
        hideLoading: () => {},
        showToast: () => ui.toasts++,
        $emit: (...args) => emitted.push(args),
        reLaunch: (value) => reLaunch.push(value),
        request: (config) => {
            requestCalls.push(config);
            options.onRequest?.(config);
        }
    };
    const exports = run(source, 'src/api/request.ts', { uni }, (name) => {
        if (name === '@/types/api') return {};
        throw new Error(`unexpected request import ${name}`);
    });
    return { exports, storage, requestCalls, reLaunch, emitted, uni, ui };
}

async function checkRequest(baseUrl, expectedTimeout) {
    const state = loadRequest(baseUrl, { token: 'token-a' });
    const promise = state.exports.request({ url: '/health', method: 'GET', showLoading: false, showError: false });
    assert.equal(state.requestCalls[0].timeout, expectedTimeout, `${baseUrl} timeout`);
    state.requestCalls[0].success({ statusCode: 200, data: { code: 0, data: { ok: true } } });
    await assertSettled(promise);
    return state;
}

async function checkRequests() {
    for (const [baseUrl, expectedTimeout] of [
        ['http://localhost:3333/api/v1', 5000],
        ['http://127.0.0.1:3333/api/v1', 5000],
        ['http://[::1]:3333/api/v1', 5000],
        ['https://api.example.com/api/v1', 30000],
        ['https://localhost.example.com/api/v1', 30000]
    ]) {
        await checkRequest(baseUrl, expectedTimeout);
    }
    const online = loadRequest('https://api.example.com/api/v1');
    const explicit = online.exports.request({
        url: '/slow',
        method: 'GET',
        timeout: 7777,
        showLoading: false,
        showError: false
    });
    assert.equal(online.requestCalls[0].timeout, 7777, 'an explicit timeout must be preserved');
    online.requestCalls[0].success({ statusCode: 200, data: { code: 0, data: true } });
    await assertSettled(explicit);

    const invalid = loadRequest('http://localhost:3333/api/v1');
    for (const response of [
        { statusCode: 200, data: null },
        { statusCode: 200 },
        { statusCode: 200, data: {} },
        { statusCode: 200, data: '<html>error</html>' },
        { statusCode: 200, data: { code: 1, message: {} } },
        { statusCode: 500, data: { code: 0, data: 'wrongly successful body' } }
    ]) {
        const promise = invalid.exports.request({ url: '/invalid', showLoading: false, showError: false });
        invalid.requestCalls.at(-1).success(response);
        await assertSettled(promise, true);
    }
    const failed = invalid.exports.request({ url: '/offline', showLoading: false, showError: false });
    invalid.requestCalls.at(-1).fail({ errMsg: 'request:fail timeout' });
    const failure = await assertSettled(failed, true);
    assert.match(failure.error.message, /超时/);

    const loginSource = fs.readFileSync(path.join(root, 'src/api/modules/user.ts'), 'utf8');
    const loginState = loadRequest('http://localhost:3333/api/v1');
    const userApi = run(loginSource, 'src/api/modules/user.ts', {}, (name) => {
        if (name === '../request') return loginState.exports;
        throw new Error(`unexpected user API import ${name}`);
    });
    const loginPromise = userApi.userApi.login({ code: 'code' });
    assert.equal(loginState.ui.loading, 0, 'automatic login must not show a loading mask');
    loginState.requestCalls[0].success({ statusCode: 401, data: { code: 401 } });
    await assertSettled(loginPromise, true);
    assert.equal(loginState.reLaunch.length, 0, 'an anonymous login 401 must not redirect');
    const offlineLogin = userApi.userApi.login({ code: 'retry-code' });
    loginState.requestCalls.at(-1).fail({ errMsg: 'request:fail connection refused' });
    await assertSettled(offlineLogin, true);
    assert.equal(loginState.ui.toasts, 0, 'automatic login network failure must not show a toast');
    assert.equal(loginState.ui.loading, 0);

    const concurrent = loadRequest('https://api.example.com/api/v1', { token: 'same' });
    const one = concurrent.exports.request({ url: '/one', method: 'GET', showLoading: false, showError: false });
    const two = concurrent.exports.request({ url: '/two', method: 'GET', showLoading: false, showError: false });
    concurrent.requestCalls[0].success({ statusCode: 401, data: {} });
    concurrent.requestCalls[1].success({ statusCode: 200, data: { code: 401 } });
    await assertSettled(one, true);
    await assertSettled(two, true);
    assert.equal(concurrent.reLaunch.length, 1, 'concurrent 401 responses must redirect once');
    assert.equal(concurrent.emitted.length, 1);
    assert.equal(concurrent.storage.token, undefined);

    const late = loadRequest('https://api.example.com/api/v1', { token: 'old' });
    const latePromise = late.exports.request({ url: '/late', method: 'GET', showLoading: false, showError: false });
    late.storage.token = 'new';
    late.requestCalls[0].success({ statusCode: 401, data: {} });
    await assertSettled(latePromise, true);
    assert.equal(late.reLaunch.length, 0, 'a late 401 from an old token must not clear the new session');
    assert.equal(late.storage.token, 'new');

    const polishRequests = [];
    const polishSource = fs.readFileSync(path.join(root, 'src/api/modules/polish.ts'), 'utf8');
    const { polishApi } = run(polishSource, 'polish.ts', {}, () => ({
        post: async (url, data, options) => {
            polishRequests.push(options);
        }
    }));
    await polishApi.polishText('dream');
    await polishApi.polishDream('dream-id');
    await polishApi.polishText('dream', undefined, { timeout: 60000 });
    assert.deepEqual(
        polishRequests.map((options) => options.timeout),
        [30000, 30000, 60000],
        'slow AI work keeps its prior timeout and accepts overrides'
    );
}

checkAppStartup()
    .then(checkRequests)
    .then(() =>
        console.log('Startup self-check passed: lifecycle coalescing, retry, timeout, response and 401 guards.')
    )
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
