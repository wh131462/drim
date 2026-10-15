/* eslint-disable @typescript-eslint/no-require-imports -- Standalone polling regression check. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/pages/result/index.vue'), 'utf8');
const polling = source.match(/function pollForResult\([\s\S]*?\n\}/)?.[0];
assert.ok(polling, 'result page polling function is missing');
const output = ts.transpileModule(polling, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText;

function load(getById) {
    const timers = new Map();
    let nextTimer = 0;
    const state = {
        analysisApi: { getById },
        pollTimer: null,
        pollCount: 0,
        MAX_POLL_COUNT: 60,
        analysis: { value: null },
        loading: { value: true },
        error: { value: null },
        loadingText: { value: '' },
        handleAnalysisComplete: () => {},
        setTimeout: (callback) => {
            timers.set(++nextTimer, callback);
            return nextTimer;
        }
    };
    vm.runInNewContext(output, state);
    const tick = async () => {
        assert.ok(timers.size, 'no pending polling timer');
        const [id, callback] = timers.entries().next().value;
        timers.delete(id);
        await callback();
    };
    return { state, timers, tick };
}

async function check() {
    let requests = 0;
    const offline = load(async () => {
        requests++;
        throw new Error('后端连接失败');
    });
    offline.state.pollForResult('analysis-a');
    await offline.tick();
    assert.equal(requests, 1);
    assert.equal(offline.timers.size, 0, 'network failure must not schedule another poll');
    assert.equal(offline.state.loading.value, false);
    assert.equal(offline.state.error.value, '后端连接失败');

    requests = 0;
    const completed = { status: 'completed', theme: 'test' };
    const processing = load(async () => (++requests === 1 ? { status: 'processing' } : completed));
    processing.state.pollForResult('analysis-a');
    await processing.tick();
    assert.equal(requests, 1);
    assert.equal(processing.timers.size, 1, 'a processing result must continue polling');
    assert.equal(processing.state.loading.value, true);
    await processing.tick();
    assert.equal(requests, 2);
    assert.equal(processing.timers.size, 0);
    assert.equal(processing.state.loading.value, false);
    assert.equal(processing.state.analysis.value, completed);
    console.log('Result polling self-check passed: network errors stop; processing results continue.');
}

check().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
