/* eslint-disable @typescript-eslint/no-require-imports */
// Run: node scripts/record-upgrade-self-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { ref, computed } = require('vue');

function editor() {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src/pages/record/index.vue'), 'utf8');
    const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '');
    const calls = { creates: [], updates: [], navigations: [], toasts: [] };
    const behavior = { confirm: false, rejectSave: false, deferredSave: null, polishCalls: 0 };
    const original = '原'.repeat(25);
    const polished = '润'.repeat(30);
    const response = { id: 'dream-id', rewards: { dreamReward: 10, streakReward: 5, streakDays: 3 } };
    const dreamStore = {
        listFetchedAt: 1,
        calendarKey: '2026-10',
        async submitDream(input) {
            calls.creates.push(input);
            if (behavior.rejectSave) throw new Error('保存失败');
            if (behavior.deferredSave) await behavior.deferredSave;
            return response;
        }
    };
    const context = {
        ref,
        computed,
        console,
        onMounted() {},
        onUnmounted() {},
        onShow() {},
        onHide() {},
        onBackPress() {},
        watch() {},
        window: { addEventListener() {}, removeEventListener() {} },
        useDreamStore: () => dreamStore,
        useUserStore: () => ({ isVip: false, luckyPoints: 100, fetchUserInfo: async () => {} }),
        useSettingsStore: () => ({ defaultDreamPublic: false, ensureSettings: async () => {} }),
        confirmPointsConsume: async () => true,
        showPointsConsumed() {},
        dreamApi: {
            async update(id, input) {
                calls.updates.push({ id, input });
                if (behavior.rejectSave) throw new Error('保存失败');
                return { id };
            }
        },
        polishApi: {
            getQuota: async () => ({ remaining: 3 }),
            polishText: async () => {
                behavior.polishCalls++;
                return { content: polished, quota: { remaining: 2 } };
            }
        },
        uni: {
            showToast: (input) => calls.toasts.push(input.title),
            showLoading() {},
            hideLoading() {},
            navigateTo: (input) => calls.navigations.push(input.url),
            switchTab() {},
            showModal: (input) => input.success({ confirm: behavior.confirm }),
            showActionSheet() {}
        }
    };
    const exposed = [
        'dreamContent',
        'selectedTags',
        'selectedEmotion',
        'isPublic',
        'submitting',
        'polishing',
        'canSubmit',
        'isDirty',
        'versions',
        'currentVersionType',
        'polishQuota',
        'polishDraft',
        'polishSource',
        'showPolishPreview',
        'saveDream',
        'validContent',
        'handlePolish',
        'generatePolish',
        'applyPolish',
        'hydrateEditor',
        'selectEmotion',
        'confirmLeave',
        'resetEditor'
    ];
    const code = script + `\nglobalThis.editor = { ${exposed.join(', ')} };`;
    vm.runInNewContext(
        ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText,
        context
    );
    return { state: context.editor, behavior, calls, original, polished, dreamStore };
}

async function main() {
    {
        const { state, calls, original } = editor();
        for (const [length, valid] of [
            [0, false],
            [24, false],
            [25, true],
            [1000, true],
            [1001, false]
        ]) {
            state.dreamContent.value = '字'.repeat(length);
            assert.equal(state.validContent(), valid, `${length} 字校验不正确`);
            assert.equal(state.canSubmit.value, valid);
        }
        state.dreamContent.value = `  ${original}  `;
        state.selectedTags.value = ['exam'];
        state.selectedEmotion.value = 'anxious';
        await state.saveDream(false);
        assert.equal(calls.creates.length, 1);
        assert.equal(calls.creates[0].content, original);
        assert.deepEqual(Array.from(calls.creates[0].tags), ['exam']);
        assert.equal(calls.creates[0].emotion, 'anxious');
        assert.equal(calls.navigations[0], '/pages/dream-detail/index?id=dream-id');
        assert.equal(state.dreamContent.value, '');
        assert.equal(state.submitting.value, false);
    }
    {
        const { state, calls, original } = editor();
        state.dreamContent.value = original;
        await state.saveDream(true);
        assert.equal(calls.creates.length, 1);
        assert.equal(
            calls.navigations[0],
            '/pages/result/index?dreamId=dream-id&dreamReward=10&streakReward=5&streakDays=3'
        );
    }
    {
        const { state, behavior, calls, original, polished } = editor();
        state.dreamContent.value = original;
        state.polishQuota.value = { remaining: 3 };
        state.handlePolish();
        assert.equal(state.showPolishPreview.value, true);
        assert.equal(behavior.polishCalls, 0, '打开静态预览不能消耗润色配额');
        await state.generatePolish();
        assert.equal(state.dreamContent.value, original, '生成润色不能直接改正文');
        assert.equal(state.versions.value.length, 0);
        assert.equal(state.polishDraft.value, polished);
        assert.equal(state.polishQuota.value.remaining, 2);
        state.applyPolish();
        assert.equal(state.dreamContent.value, polished);
        assert.equal(state.versions.value[0].content, original, '应用润色必须留原文');
        assert.equal(state.versions.value[1].type, 'polished');
        assert.equal(state.currentVersionType.value, 'polished');
        await state.saveDream(false);
        assert.equal(calls.creates[0].originalContent, original, '原文须跟随润色版本一起持久化');
        assert.equal(calls.creates[0].content, polished);
    }
    {
        const { state, original } = editor();
        state.dreamContent.value = original;
        state.polishSource.value = original;
        state.polishDraft.value = '短内容';
        state.applyPolish();
        assert.equal(state.dreamContent.value, original, '不合法润色不能应用');
        state.polishDraft.value = '润'.repeat(30);
        state.dreamContent.value = '新'.repeat(25);
        state.applyPolish();
        assert.equal(state.dreamContent.value, '新'.repeat(25), '正文已变化时不能应用旧润色');
    }
    {
        const { state, calls, original, dreamStore } = editor();
        state.hydrateEditor({ id: 'edit-id', content: original, tags: ['exam'], emotion: 'anxious', isPublic: true });
        state.selectedTags.value = [];
        state.selectEmotion({ detail: { value: 0 } });
        state.isPublic.value = false;
        await state.saveDream(false);
        const update = calls.updates[0];
        assert.equal(update.id, 'edit-id');
        assert.equal(update.input.tags.length, 0, '标签清空必须传给服务端');
        assert.equal(update.input.emotion, null, '情绪清空必须传 null');
        assert.equal(update.input.isPublic, false);
        assert.equal(update.input.reAnalyze, false);
        assert.equal(dreamStore.listFetchedAt, 0);
        assert.equal(dreamStore.calendarKey, '');
    }
    {
        const { state, behavior, calls, original } = editor();
        let complete;
        behavior.deferredSave = new Promise((resolve) => {
            complete = resolve;
        });
        state.dreamContent.value = original;
        const pending = state.saveDream(true);
        assert.equal(state.submitting.value, true);
        await state.saveDream(true);
        assert.equal(calls.creates.length, 1, '保存锁必须防止重复提交');
        assert.equal(await state.confirmLeave(), false, '提交时不能离开');
        complete();
        await pending;
        assert.equal(state.submitting.value, false);
    }
    {
        const { state, behavior, calls, original } = editor();
        state.dreamContent.value = original;
        assert.equal(state.isDirty.value, true);
        assert.equal(await state.confirmLeave(), false);
        assert.equal(state.dreamContent.value, original, '取消离开不能丢正文');
        behavior.confirm = true;
        assert.equal(await state.confirmLeave(), true);
        assert.equal(state.dreamContent.value, '');
        assert.equal(state.isDirty.value, false);
        state.dreamContent.value = original;
        behavior.rejectSave = true;
        await state.saveDream(false);
        assert.equal(state.dreamContent.value, original, '保存失败应保留正文');
        assert.equal(state.isDirty.value, true);
        assert.equal(state.submitting.value, false);
        assert.equal(calls.navigations.length, 0);
        assert.ok(calls.toasts.includes('保存失败'));
    }
    console.log('记梦升级自检通过：保存/解析/润色/原文/metadata 清空/字数/提交锁/离开确认/失败恢复');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
