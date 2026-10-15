<template>
    <view
        class="page record-page"
        :class="{ 'dark-mode': userStore.isDarkMode, 'standalone-editor': standalone }"
    >
        <!-- 导航栏 -->
        <NavBar
            v-if="standalone"
            :title="isEditMode ? '编辑梦境' : '记录梦境'"
            :show-back="standalone"
            custom-back
            @back="handleBack"
        />
        <text
            v-else
            class="page-title"
            >记录梦境</text
        >
        <view
            v-if="loadingEditor || editorLoadError"
            class="record-settings"
        >
            <text>{{ loadingEditor ? '正在加载编辑内容...' : editorLoadError }}</text>
            <template v-if="editorLoadError && !loadingEditor">
                <button
                    class="setting-chip"
                    @tap="loadEditor"
                >
                    重试
                </button>
                <button
                    class="setting-chip"
                    @tap="cancelEditLoad"
                >
                    取消编辑
                </button>
            </template>
        </view>

        <!-- 输入区域 -->
        <view class="textarea-container">
            <textarea
                v-model="dreamContent"
                class="dream-textarea"
                placeholder="昨晚梦见了什么？试着描述梦中的场景、人物和发生的事情...（至少25字）"
                :maxlength="1000"
                :disabled="submitting || polishing || editorUnavailable"
                auto-height
            />

            <!-- 内容工具栏 -->
            <view class="content-toolbar">
                <!-- AI 润色按钮 -->
                <view
                    class="polish-btn"
                    :class="{ disabled: !canSubmit }"
                    @tap="handlePolish"
                >
                    <image
                        class="polish-icon"
                        src="/static/icons/star.png"
                        mode="aspectFit"
                    />
                    <text>AI 润色</text>
                </view>

                <!-- 版本切换器 (有多个版本时显示) -->
                <view
                    v-if="versions.length > 1"
                    class="version-switcher"
                    @tap="showVersionPicker"
                >
                    <text class="version-badge">v{{ currentVersionNumber }}</text>
                    <text>{{ versionLabel }}</text>
                    <image
                        class="dropdown-icon"
                        src="/static/icons/arrow-right.png"
                        mode="aspectFit"
                    />
                </view>
            </view>

            <!-- 配额提示和字数统计 -->
            <view class="hint-row">
                <view class="quota-hint">
                    <image
                        class="info-icon"
                        src="/static/icons/info.png"
                        mode="aspectFit"
                    />
                    <text v-if="userStore.isVip">VIP 无限润色</text>
                    <text v-else-if="polishQuota">今日剩余 {{ polishQuota.remaining }} 次</text>
                    <text
                        v-else
                        @tap="loadQuota"
                        >配额加载失败，重试</text
                    >
                </view>
                <view class="word-count">
                    <text :class="{ insufficient: contentLength < 25 }"
                        >{{ contentLength }}/1000{{ contentLength < 25 ? `，还差${25 - contentLength}字` : '' }}</text
                    >
                </view>
            </view>
        </view>

        <!-- 梦境元素 -->
        <view class="section-wrapper">
            <view class="section-title">
                <view class="title-bar"></view>
                <text>梦境元素 (多选)</text>
            </view>
            <view class="tag-container">
                <view
                    v-for="tag in allDreamTags"
                    :key="tag.id"
                    class="tag-item"
                    :class="{ active: selectedTags.includes(tag.id), custom: tag.custom }"
                    @tap="toggleTag(tag.id)"
                >
                    <image
                        class="tag-icon"
                        :src="tag.icon"
                        mode="aspectFit"
                        aria-hidden="true"
                    />
                    <text class="tag-text">{{ tag.name }}</text>
                    <view
                        v-if="tag.custom"
                        class="tag-remove"
                        @tap.stop="removeCustomTag(tag.id)"
                        :aria-label="`删除${tag.name}标签`"
                    >
                        <image
                            class="tag-remove-icon"
                            src="/static/icons/close.png"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
                    </view>
                </view>
                <!-- 添加自定义标签按钮 -->
                <view
                    class="tag-item add-tag-btn"
                    @tap="showAddTagDialog"
                >
                    <image
                        class="add-icon"
                        src="/static/icons/plus.png"
                        mode="aspectFit"
                        aria-hidden="true"
                    />
                    <text class="tag-text">自定义</text>
                </view>
            </view>
        </view>

        <view class="record-settings">
            <button
                class="setting-chip"
                :disabled="submitting || editorUnavailable"
                @tap="isPublic = !isPublic"
            >
                {{ isPublic ? '公开（探索广场可见）' : '私密（仅自己可见）' }}
            </button>
            <picker
                :range="emotionLabels"
                :value="emotionIndex"
                :disabled="submitting || editorUnavailable"
                @change="selectEmotion"
            >
                <view class="setting-chip emotion-picker">
                    <text>{{ emotionLabels[emotionIndex] }}</text>
                    <image
                        class="dropdown-icon"
                        src="/static/icons/arrow-right.png"
                        mode="aspectFit"
                        aria-hidden="true"
                    />
                </view>
            </picker>
        </view>
        <view
            v-if="showPolishPreview"
            class="polish-preview"
        >
            <text class="preview-title">{{ polishDraft ? '你的润色预览' : '润色示例（静态内容）' }}</text>
            <text class="preview-copy">{{
                polishDraft ||
                '原句：我梦见走进一条没有尽头的走廊。\n示例：梦里，我沿着一条漫长的走廊前行，脚步声轻轻回响，尽头隐没在微光里。'
            }}</text>
            <text class="preview-hint">原始内容始终保留。生成使用一次润色配额，确认应用后才切换版本。</text>
            <view class="preview-actions"
                ><button
                    class="setting-chip"
                    :disabled="polishing"
                    @tap="showPolishPreview = false"
                >
                    取消</button
                ><button
                    v-if="!polishDraft"
                    class="setting-chip active"
                    :disabled="!canPolish || polishing"
                    @tap="generatePolish"
                >
                    {{ polishing ? '正在生成...' : '生成我的润色' }}</button
                ><button
                    v-else
                    class="setting-chip active"
                    :disabled="dreamContent.trim() !== polishSource"
                    @tap="applyPolish"
                >
                    应用润色
                </button></view
            >
        </view>

        <!-- 底部按钮 -->
        <view class="fixed-bottom">
            <!-- 编辑模式：显示两个按钮 -->
            <template v-if="isEditMode">
                <view class="edit-actions">
                    <view
                        class="edit-btn save"
                        :class="{ disabled: !canSubmit }"
                        @tap="saveDream(false)"
                    >
                        <text>仅保存</text>
                    </view>
                    <view
                        v-if="hasAnalysis"
                        class="edit-btn reanalyze"
                        :class="{ disabled: !canSubmit }"
                        @tap="saveDream(true)"
                    >
                        <text>保存并重新解析</text>
                    </view>
                    <view
                        v-else
                        class="edit-btn reanalyze"
                        :class="{ disabled: !canSubmit }"
                        @tap="saveDream(true)"
                    >
                        <text>保存并解析</text>
                    </view>
                </view>
            </template>
            <template v-else>
                <view class="edit-actions"
                    ><button
                        class="edit-btn save"
                        :disabled="!canSubmit"
                        @tap="saveDream(false)"
                    >
                        仅保存</button
                    ><button
                        class="edit-btn reanalyze"
                        :disabled="!canSubmit"
                        @tap="saveDream(true)"
                    >
                        开始解析
                    </button></view
                >
            </template>
        </view>

        <!-- 自定义 TabBar -->
        <custom-tab-bar
            v-if="!standalone"
            :selected="2"
            :before-switch="confirmLeave"
        />
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onShow, onHide, onBackPress } from '@dcloudio/uni-app';
import { useDreamStore, useUserStore, useSettingsStore } from '@/stores';
import { polishApi, dreamApi, versionApi } from '@/api';
import type { Emotion, DreamDetail } from '@/types/dream';
import type { PolishQuota } from '@/api/modules/polish';
import { confirmPointsConsume, showPointsConsumed } from '@/utils/feedback';
import NavBar from '@/components/NavBar/index.vue';
import CustomTabBar from '@/custom-tab-bar/index.vue';
import { getPageHeadingMetrics } from '@/utils/navigation';

const props = withDefaults(defineProps<{ standalone?: boolean }>(), { standalone: false });
const headingMetrics = getPageHeadingMetrics();
const dreamStore = useDreamStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const navBarHeight = ref(0);
const isEditMode = ref(false);
const editingDreamId = ref<string | null>(null);
const hasAnalysis = ref(false);
const dreamContent = ref('');
const selectedTags = ref<string[]>([]);
const selectedEmotion = ref<Emotion | null>(null);
const isPublic = ref(false);
const submitting = ref(false);
const polishing = ref(false);
const loadingEditor = ref(false);
const editorLoadError = ref('');
const showPolishPreview = ref(false);
const polishDraft = ref('');
const polishSource = ref('');
const polishQuota = ref<PolishQuota | null>(null);
const savedSnapshot = ref(JSON.stringify(['', [], null, false]));
let applyingDefaults = false;
let pageVisible = false;
interface LocalVersion {
    content: string;
    type: 'original' | 'polished' | 'edited';
    versionNumber: number;
}
interface Tag {
    id: string;
    name: string;
    icon: string;
    custom: boolean;
}
const versions = ref<LocalVersion[]>([]);
const currentVersionNumber = ref(1);
const currentVersionType = ref<LocalVersion['type']>('original');
const customTags = ref<Tag[]>([]);
const dreamTags: Tag[] = [
    { id: 'running', name: '追逐', icon: '/static/icons/running.png', custom: false },
    { id: 'flying', name: '飞行', icon: '/static/icons/plane.png', custom: false },
    { id: 'exam', name: '考试', icon: '/static/icons/exam.png', custom: false },
    { id: 'family', name: '亲人', icon: '/static/icons/family.png', custom: false },
    { id: 'water', name: '水', icon: '/static/icons/water.png', custom: false },
    { id: 'animal', name: '动物', icon: '/static/icons/animal.png', custom: false },
    { id: 'lost', name: '迷路', icon: '/static/icons/map.png', custom: false },
    { id: 'death', name: '死亡', icon: '/static/icons/death.png', custom: false }
];
const emotions: { id: Emotion; name: string }[] = [
    { id: 'happy', name: '开心' },
    { id: 'sad', name: '悲伤' },
    { id: 'angry', name: '愤怒' },
    { id: 'fear', name: '恐惧' },
    { id: 'surprise', name: '惊讶' },
    { id: 'disgust', name: '厌恶' },
    { id: 'calm', name: '平静' },
    { id: 'anxious', name: '焦虑' },
    { id: 'confused', name: '困惑' },
    { id: 'excited', name: '兴奋' },
    { id: 'lonely', name: '孤独' },
    { id: 'shame', name: '羞愧' },
    { id: 'love', name: '温暖' },
    { id: 'bored', name: '无聊' }
];
const allDreamTags = computed(() => [...dreamTags, ...customTags.value]);
const emotionLabels = ['情绪（可选）', ...emotions.map((emotion) => emotion.name)];
const emotionIndex = computed(() => emotions.findIndex((emotion) => emotion.id === selectedEmotion.value) + 1);
const contentLength = computed(() => dreamContent.value.trim().length);
const editorUnavailable = computed(() => loadingEditor.value || !!editorLoadError.value);
const canSubmit = computed(
    () =>
        contentLength.value >= 25 &&
        contentLength.value <= 1000 &&
        !submitting.value &&
        !polishing.value &&
        !editorUnavailable.value
);
const canPolish = computed(
    () => canSubmit.value && !!polishQuota.value && (userStore.isVip || polishQuota.value.remaining > 0)
);
const versionLabel = computed(() =>
    currentVersionType.value === 'polished' ? '润色版' : currentVersionType.value === 'edited' ? '编辑版' : '原始版'
);
const snapshot = () => JSON.stringify([dreamContent.value, selectedTags.value, selectedEmotion.value, isPublic.value]);
const isDirty = computed(() => savedSnapshot.value !== snapshot());

function toggleTag(id: string) {
    if (submitting.value || polishing.value || editorUnavailable.value) return;
    const index = selectedTags.value.indexOf(id);
    if (index >= 0) selectedTags.value.splice(index, 1);
    else if (selectedTags.value.length < 3) selectedTags.value.push(id);
    else uni.showToast({ title: '最多选择3个标签', icon: 'none' });
}
function selectEmotion(event: { detail: { value: string | number } }) {
    if (submitting.value || polishing.value || editorUnavailable.value) return;
    selectedEmotion.value = emotions[Number(event.detail.value) - 1]?.id || null;
}
function showAddTagDialog() {
    if (submitting.value || polishing.value || editorUnavailable.value) return;
    uni.showModal({
        title: '添加自定义元素',
        editable: true,
        placeholderText: '请输入1-4个字',
        success: (res) => {
            if (!res.confirm || submitting.value || polishing.value || editorUnavailable.value) return;
            const name = res.content?.trim() || '';
            if (!name || name.length > 4) return uni.showToast({ title: '标签名称应为1-4个字', icon: 'none' });
            if (allDreamTags.value.some((tag) => tag.name === name || tag.id === name))
                return uni.showToast({ title: '该元素已存在', icon: 'none' });
            if (selectedTags.value.length >= 3) return uni.showToast({ title: '最多选择3个标签', icon: 'none' });
            customTags.value.push({ id: name, name, icon: '/static/icons/sparkle.png', custom: true });
            selectedTags.value.push(name);
        }
    });
}
function removeCustomTag(id: string) {
    if (submitting.value || polishing.value || editorUnavailable.value) return;
    selectedTags.value = selectedTags.value.filter((tag) => tag !== id);
    customTags.value = customTags.value.filter((tag) => tag.id !== id);
}
async function loadQuota() {
    try {
        polishQuota.value = await polishApi.getQuota({ showLoading: false, showError: false });
    } catch {
        polishQuota.value = null;
    }
}
function handlePolish() {
    if (!canSubmit.value) return;
    showPolishPreview.value = true;
    polishDraft.value = '';
}
async function generatePolish() {
    if (!canPolish.value || polishing.value) return;
    polishing.value = true;
    const source = dreamContent.value.trim();
    try {
        const response = await polishApi.polishText(source, undefined, { showLoading: false, showError: false });
        polishDraft.value = response.content;
        polishSource.value = source;
        if (response.quota) polishQuota.value = response.quota;
    } catch (error: any) {
        uni.showToast({ title: error?.message || '润色失败，请重试', icon: 'none' });
        await loadQuota();
    } finally {
        polishing.value = false;
    }
}
function applyPolish() {
    if (submitting.value || polishing.value || editorUnavailable.value) return;
    if (!polishDraft.value || dreamContent.value.trim() !== polishSource.value) return;
    const length = polishDraft.value.trim().length;
    if (length < 25 || length > 1000)
        return uni.showToast({ title: '润色内容需为25-1000字，请重新生成', icon: 'none' });
    if (!versions.value.length)
        versions.value.push({ content: polishSource.value, type: 'original', versionNumber: 1 });
    const number = Math.max(...versions.value.map((version) => version.versionNumber)) + 1;
    versions.value.push({ content: polishDraft.value.trim(), type: 'polished', versionNumber: number });
    dreamContent.value = polishDraft.value.trim();
    currentVersionNumber.value = number;
    currentVersionType.value = 'polished';
    showPolishPreview.value = false;
}
function showVersionPicker() {
    if (!versions.value.length || submitting.value || polishing.value || editorUnavailable.value) return;
    // 切换前保留当前未保存的正文，原始版本始终不覆盖。
    const current = versions.value.find((version) => version.versionNumber === currentVersionNumber.value);
    if (current?.content !== dreamContent.value && dreamContent.value.trim()) {
        const number = Math.max(...versions.value.map((version) => version.versionNumber)) + 1;
        versions.value.push({ content: dreamContent.value, type: 'edited', versionNumber: number });
        currentVersionNumber.value = number;
        currentVersionType.value = 'edited';
    }
    uni.showActionSheet({
        itemList: versions.value.map(
            (version) =>
                `v${version.versionNumber}（${version.type === 'polished' ? '润色版' : version.type === 'edited' ? '编辑版' : '原始版'}）`
        ),
        success: (res) => {
            if (submitting.value || polishing.value || editorUnavailable.value) return;
            const version = versions.value[res.tapIndex];
            if (!version) return;
            dreamContent.value = version.content;
            currentVersionNumber.value = version.versionNumber;
            currentVersionType.value = version.type;
            showPolishPreview.value = false;
        }
    });
}
function validContent(): boolean {
    if (contentLength.value >= 25 && contentLength.value <= 1000) return true;
    uni.showToast({
        title: contentLength.value < 25 ? `至少25字，还差${25 - contentLength.value}字` : '梦境不能超过1000字',
        icon: 'none'
    });
    return false;
}
async function saveDream(analyze: boolean) {
    if (submitting.value || polishing.value || editorUnavailable.value || !validContent()) return;
    submitting.value = true;
    try {
        if (isEditMode.value && analyze && hasAnalysis.value) {
            await userStore.fetchUserInfo();
            if (!(await confirmPointsConsume(50, userStore.luckyPoints, '重新解析'))) return;
        }
        uni.showLoading({ title: '保存中...', mask: true });
        const input = {
            content: dreamContent.value.trim(),
            tags: [...selectedTags.value],
            emotion: selectedEmotion.value,
            isPublic: isPublic.value
        };
        const currentVersion = versions.value.find((version) => version.versionNumber === currentVersionNumber.value);
        const versionType =
            currentVersion && currentVersion.content.trim() !== input.content ? 'edited' : currentVersionType.value;
        let id: string;
        let rewardQuery = '';
        if (isEditMode.value && editingDreamId.value) {
            const response = await dreamApi.update(editingDreamId.value, { ...input, reAnalyze: analyze, versionType });
            id = response.id;
            if (response.pointsConsumed) showPointsConsumed(response.pointsConsumed, '重新解析');
            dreamStore.listFetchedAt = 0;
            dreamStore.calendarKey = '';
        } else {
            const originalContent = versions.value[0]?.content;
            const response = await dreamStore.submitDream({
                ...input,
                versionType,
                emotion: selectedEmotion.value || undefined,
                originalContent: originalContent && originalContent !== input.content ? originalContent : undefined
            });
            id = response.id;
            if (response.rewards) {
                const { dreamReward, streakReward, streakDays } = response.rewards;
                rewardQuery = `&dreamReward=${dreamReward}&streakReward=${streakReward}&streakDays=${streakDays}`;
            }
        }
        savedSnapshot.value = snapshot();
        resetEditor();
        void userStore.fetchUserInfo().catch(() => {});
        const url = analyze ? `/pages/result/index?dreamId=${id}${rewardQuery}` : `/pages/dream-detail/index?id=${id}`;
        if (props.standalone) uni.redirectTo({ url });
        else uni.navigateTo({ url });
    } catch (error: any) {
        uni.showToast({ title: error?.message || '保存失败，请重试', icon: 'none' });
    } finally {
        uni.hideLoading();
        submitting.value = false;
    }
}
function resetEditor() {
    dreamContent.value = '';
    selectedTags.value = [];
    selectedEmotion.value = null;
    isPublic.value = false;
    versions.value = [];
    customTags.value = [];
    isEditMode.value = false;
    editingDreamId.value = null;
    hasAnalysis.value = false;
    currentVersionNumber.value = 1;
    currentVersionType.value = 'original';
    showPolishPreview.value = false;
    polishDraft.value = '';
    polishSource.value = '';
    editorLoadError.value = '';
    savedSnapshot.value = snapshot();
}
async function confirmLeave(): Promise<boolean> {
    if (submitting.value || polishing.value || loadingEditor.value) {
        uni.showToast({ title: '请等待当前操作完成', icon: 'none' });
        return false;
    }
    if (!isDirty.value) return true;
    const confirmed = await new Promise<boolean>((resolve) =>
        uni.showModal({
            title: '还有未保存的梦境',
            content: '离开会丢弃这次修改，确定离开吗？',
            confirmText: '离开',
            cancelText: '继续记录',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
        })
    );
    if (confirmed) resetEditor();
    return confirmed;
}
async function handleBack() {
    if (!(await confirmLeave())) return;
    if (props.standalone && getCurrentPages().length > 1) {
        uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) });
    } else {
        uni.switchTab({ url: '/pages/index/index' });
    }
}
onBackPress((options) => {
    if (options.from === 'navigateBack') return false;
    void handleBack();
    return true;
});
async function applyDefaultPublicSetting() {
    if (applyingDefaults || isEditMode.value || isDirty.value || editorUnavailable.value) return;
    applyingDefaults = true;
    try {
        await settingsStore.ensureSettings();
        if (!isEditMode.value && !isDirty.value && !editorUnavailable.value) {
            isPublic.value = settingsStore.defaultDreamPublic;
            savedSnapshot.value = snapshot();
        }
    } catch {
        /* 默认保持私密，用户仍可手动选择。 */
    } finally {
        applyingDefaults = false;
    }
}
function hydrateEditor(dream: DreamDetail) {
    isEditMode.value = true;
    editingDreamId.value = dream.id;
    dreamContent.value = dream.content;
    selectedTags.value = [...(dream.tags || [])];
    customTags.value = selectedTags.value
        .filter((id) => !dreamTags.some((tag) => tag.id === id))
        .map((id) => ({ id, name: id, icon: '/static/icons/sparkle.png', custom: true }));
    selectedEmotion.value = dream.emotion || null;
    isPublic.value = !!dream.isPublic;
    hasAnalysis.value = !!(dream.analysis || dream.hasAnalysis);
    currentVersionType.value =
        dream.currentVersionType || (dream.content === dream.originalContent ? 'original' : 'edited');
    versions.value = [{ content: dream.originalContent || dream.content, type: 'original', versionNumber: 1 }];
    if (dreamContent.value !== versions.value[0].content) {
        versions.value.push({ content: dreamContent.value, type: currentVersionType.value, versionNumber: 2 });
        currentVersionNumber.value = 2;
    } else currentVersionNumber.value = 1;
    showPolishPreview.value = false;
    polishDraft.value = '';
    polishSource.value = '';
    savedSnapshot.value = snapshot();
}
function cancelEditLoad() {
    if (loadingEditor.value) return;
    uni.removeStorageSync('editingDream');
    uni.removeStorageSync('editingVersion');
    resetEditor();
    void applyDefaultPublicSetting();
}
async function loadEditor() {
    if (loadingEditor.value || submitting.value || polishing.value) return;
    const editingDream = uni.getStorageSync('editingDream');
    const editingVersion = uni.getStorageSync('editingVersion');
    if (editingDream || editingVersion) {
        const request = editingDream || editingVersion;
        if (isDirty.value && !(await confirmLeave())) {
            uni.removeStorageSync('editingDream');
            uni.removeStorageSync('editingVersion');
            return;
        }
        loadingEditor.value = true;
        editorLoadError.value = '';
        try {
            const dream = await dreamApi.getById(request.dreamId);
            // 已保存版本入口继续复用，编辑区只负责选择与润色。
            const response = await versionApi.getVersions(dream.id);
            const selectedVersion = editingVersion
                ? response.versions.find((version) => version.versionId === editingVersion.versionId)
                : response.versions.find((version) => version.isCurrent);
            if (editingVersion && !selectedVersion) throw new Error('该版本已不可用，请返回版本历史重新选择');
            hydrateEditor(dream);
            if (response.versions.length) {
                versions.value = response.versions.map((version) => ({
                    content: version.content,
                    type: version.type,
                    versionNumber: version.versionNumber
                }));
                if (selectedVersion) {
                    dreamContent.value = selectedVersion.content;
                    currentVersionNumber.value = selectedVersion.versionNumber;
                    currentVersionType.value = selectedVersion.type;
                }
            }
            savedSnapshot.value = snapshot();
            uni.removeStorageSync('editingDream');
            uni.removeStorageSync('editingVersion');
        } catch (error: any) {
            editorLoadError.value = error?.message || '编辑内容加载失败，请重试';
        } finally {
            loadingEditor.value = false;
        }
    } else {
        await applyDefaultPublicSetting();
    }
}
onMounted(() => {
    navBarHeight.value = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
});
onShow(() => {
    pageVisible = true;
    void loadEditor();
    void loadQuota();
});
onHide(() => {
    pageVisible = false;
    // #ifdef MP-WEIXIN
    uni.disableAlertBeforeUnload?.();
    // #endif
});
watch(
    [dreamContent, selectedTags, selectedEmotion, isPublic],
    () => {
        // #ifdef MP-WEIXIN
        if (pageVisible && typeof uni.enableAlertBeforeUnload === 'function') {
            if (isDirty.value) uni.enableAlertBeforeUnload({ message: '梦境尚未保存，确定离开吗？' });
            else uni.disableAlertBeforeUnload();
        }
        // #endif
    },
    { deep: true }
);
// #ifdef H5
function beforeUnload(event: BeforeUnloadEvent) {
    if (isDirty.value) {
        event.preventDefault();
        event.returnValue = '';
    }
}
window.addEventListener('beforeunload', beforeUnload);
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload));
// #endif
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.record-page {
    min-height: 100vh;
    background: #faf8fc;
    padding-bottom: 300rpx;
    padding-top: v-bind("headingMetrics.top + 'px'");
    transition: background-color 0.3s ease;

    &.standalone-editor {
        padding-bottom: 200rpx;
        padding-top: v-bind("navBarHeight + 'px'");

        .fixed-bottom {
            bottom: env(safe-area-inset-bottom);
        }
    }

    &.dark-mode {
        background: $dark-bg-page;

        .page-title {
            color: $dark-text-primary;
        }

        .textarea-container {
            background: $dark-bg-card;
            box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.3);

            &:focus-within {
                box-shadow: 0 8rpx 32rpx rgba(139, 110, 255, 0.2);
            }
        }

        .dream-textarea {
            color: $dark-text-primary;
            caret-color: $dark-primary-color;

            &::placeholder {
                color: rgba(255, 255, 255, 0.25);
            }
        }

        .word-count {
            color: $dark-text-placeholder;

            .insufficient {
                color: #ff8b8b;
            }
        }

        .section-title {
            color: $dark-text-secondary;

            .title-bar {
                background: $dark-primary-color;
            }
        }

        .tag-item {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;

            .tag-icon {
                filter: brightness(0) saturate(100%) invert(100%);
                transition: filter 0.3s ease;
            }

            &.active {
                background: $dark-primary-light;
                border-color: $dark-primary-color;

                .tag-icon {
                    filter: brightness(0) saturate(100%) invert(58%) sepia(61%) saturate(4261%) hue-rotate(228deg)
                        brightness(101%) contrast(101%);
                }

                .tag-text {
                    color: $dark-primary-color;
                }
            }
        }

        .tag-text {
            color: $dark-text-primary;
        }

        .add-tag-btn {
            background: $dark-bg-card;
            border-color: $dark-border-color;
            border-style: dashed;

            .tag-text {
                color: $dark-text-secondary;
            }

            .add-icon {
                filter: brightness(1.4);
            }
        }

        .tag-remove {
            background: rgba(255, 255, 255, 0.2);
            color: $dark-text-primary;
        }

        .polish-btn {
            background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
            box-shadow: 0 4rpx 16rpx rgba(139, 110, 255, 0.25);

            &:active {
                box-shadow: 0 2rpx 8rpx rgba(139, 110, 255, 0.2);
            }

            &.disabled {
                background: #333333;
                color: #666666;
            }
        }

        .version-switcher {
            background: $dark-primary-light;
            color: $dark-primary-color;

            .version-badge {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .content-toolbar {
            border-top-color: rgba(255, 255, 255, 0.1);
        }

        .quota-hint {
            color: $dark-text-placeholder;
        }

        .dropdown-icon {
            filter: brightness(0) saturate(100%) invert(58%) sepia(61%) saturate(4261%) hue-rotate(228deg)
                brightness(101%) contrast(101%);
        }

        .info-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);
        }

        .emotion-item.active {
            .emotion-text {
                color: $dark-text-primary;
            }

            &::after {
                background: $dark-primary-color;
            }
        }

        .emotion-text {
            color: $dark-text-secondary;
        }

        .privacy-section {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .privacy-icon {
            background: $dark-primary-light;
        }

        .privacy-title {
            color: $dark-text-primary;
        }

        .privacy-desc {
            color: $dark-text-secondary;
        }

        .toggle-switch {
            background: #333333;

            &.active {
                background: $dark-primary-color;
            }
        }

        .fixed-bottom {
            background: $dark-bg-card;
            box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.3);
        }

        .submit-btn {
            background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
            box-shadow: 0 8rpx 24rpx rgba(139, 110, 255, 0.3);

            &.disabled {
                background: #333333;
                box-shadow: none;
            }

            &:active:not(.disabled) {
                box-shadow: 0 4rpx 12rpx rgba(139, 110, 255, 0.25);
            }
        }

        // 编辑模式按钮
        .edit-btn {
            &.save {
                background: $dark-bg-secondary;
                color: $dark-text-primary;
                border-color: $dark-border-color;
            }

            &.reanalyze {
                background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
                box-shadow: 0 8rpx 24rpx rgba(139, 110, 255, 0.3);
            }

            &.disabled {
                opacity: 0.5;
            }
        }
    }
}

// 输入区域
.page-title {
    @include page-heading;
    height: v-bind("headingMetrics.height + 'px'");
    margin: 0 32rpx 24rpx;
    color: $text-primary;
}

.textarea-container {
    background: #fff;
    padding: 40rpx;
    margin: 32rpx;
    margin-top: 24rpx;
    border-radius: 32rpx;
    box-shadow: 0 4rpx 24rpx rgba(107, 78, 255, 0.08);
    transition: box-shadow 0.3s ease;

    &:focus-within {
        box-shadow: 0 8rpx 32rpx rgba(107, 78, 255, 0.15);
    }
}

.dream-textarea {
    width: 100%;
    min-height: 360rpx;
    font-size: 32rpx;
    line-height: 1.8;
    letter-spacing: 1rpx;
    color: $text-primary;
    background: transparent;
    transition: opacity 0.3s ease;
    caret-color: $primary-color;

    &::placeholder {
        color: rgba(0, 0, 0, 0.3);
        font-weight: 300;
        letter-spacing: 0;
    }
}

.word-count {
    font-size: $font-size-xs;
    color: $text-placeholder;

    .insufficient {
        color: #ff6b6b;
    }
}

// 内容工具栏
.content-toolbar {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-top: 28rpx;
    padding-top: 28rpx;
    border-top: 1rpx solid rgba(107, 78, 255, 0.08);
    flex-wrap: wrap;
}

// AI 润色按钮
.polish-btn {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 14rpx 32rpx;
    background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
    color: #fff;
    border-radius: 40rpx;
    font-size: 26rpx;
    font-weight: 600;
    box-shadow: 0 6rpx 20rpx rgba(107, 78, 255, 0.3);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
        transform: scale(0.92);
        box-shadow: 0 2rpx 12rpx rgba(107, 78, 255, 0.25);
    }

    &.disabled {
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        box-shadow: none;
        color: #94a3b8;
    }
}

.polish-icon {
    width: 28rpx;
    height: 28rpx;
    filter: brightness(0) invert(1);
    transition: filter 0.3s ease;
}

// 版本切换器
.version-switcher {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 14rpx 28rpx;
    background: $primary-light;
    border-radius: 40rpx;
    font-size: 24rpx;
    color: $primary-color;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
        transform: scale(0.92);
        background: rgba(107, 78, 255, 0.15);
    }
}

.version-badge {
    background: #fff;
    padding: 6rpx 18rpx;
    border-radius: 20rpx;
    font-weight: 600;
    box-shadow: 0 2rpx 8rpx rgba(107, 78, 255, 0.1);
}

.dropdown-icon {
    width: 24rpx;
    height: 24rpx;
    transform: rotate(90deg);
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
    transition: filter 0.3s ease;
}

// 提示行（配额 + 字数）
.hint-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16rpx;
}

// 配额提示
.quota-hint {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 22rpx;
    color: $text-placeholder;
}

.info-icon {
    width: 24rpx;
    height: 24rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.3s ease;
}

// 区块标题
.section-wrapper {
    padding: 0 40rpx;
    margin-top: 8rpx;
}

.section-title {
    display: flex;
    align-items: center;
    font-size: $font-size-sm;
    font-weight: 700;
    color: $text-secondary;
    margin-bottom: 28rpx;
}

.title-bar {
    width: 6rpx;
    height: 32rpx;
    background: linear-gradient(180deg, $primary-color 0%, #9f7aea 100%);
    border-radius: 3rpx;
    margin-right: 16rpx;
}

// 梦境元素标签
.tag-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    margin-bottom: 48rpx;
}

.tag-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28rpx 16rpx;
    background: #fff;
    border-radius: 20rpx;
    border: 2rpx solid transparent;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
        transform: scale(0.93);
    }

    &.active {
        border-color: $primary-color;
        background: linear-gradient(180deg, rgba(107, 78, 255, 0.08) 0%, rgba(159, 122, 234, 0.08) 100%);
        box-shadow: 0 4rpx 20rpx rgba(107, 78, 255, 0.15);

        .tag-icon {
            opacity: 1;
            filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg)
                brightness(101%) contrast(104%);
        }

        .tag-text {
            color: $primary-color;
            font-weight: 600;
        }
    }
}

.tag-icon {
    width: 48rpx;
    height: 48rpx;
    margin-bottom: 12rpx;
    opacity: 0.7;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition:
        filter 0.3s ease,
        opacity 0.3s ease;
}

.tag-text {
    font-size: 24rpx;
    font-weight: 500;
    color: $text-primary;
}

// 添加标签按钮
.add-tag-btn {
    border-style: dashed;
    border-color: rgba(107, 78, 255, 0.25);
    background: rgba(107, 78, 255, 0.03);

    &:active {
        transform: scale(0.93);
        background: rgba(107, 78, 255, 0.1);
        border-color: rgba(107, 78, 255, 0.4);
    }
}

.add-icon {
    width: 48rpx;
    height: 48rpx;
    margin-bottom: 12rpx;
    opacity: 0.7;
}

// 自定义标签
.tag-item.custom {
    position: relative;
}

.tag-remove {
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:active {
        background: #ff4d4f;
        transform: scale(1.1);
    }
}

.tag-remove-icon {
    width: 20rpx;
    height: 20rpx;
    filter: brightness(0) invert(1);
}

.emotion-picker {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
}

// 情绪选择
.emotion-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 28rpx 20rpx;
    margin-bottom: 48rpx;
    padding: 0 12rpx;
}

.emotion-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.45;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;

    &.active {
        opacity: 1;
        transform: scale(1.15);

        &::after {
            content: '';
            position: absolute;
            bottom: -14rpx;
            width: 8rpx;
            height: 8rpx;
            background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
            border-radius: 50%;
            box-shadow: 0 2rpx 8rpx rgba(107, 78, 255, 0.4);
        }

        .emotion-icon {
            filter: grayscale(0);
            text-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
        }

        .emotion-text {
            font-weight: 700;
            color: $text-primary;
        }
    }
}

.emotion-icon {
    font-size: 52rpx;
    margin-bottom: 10rpx;
    filter: grayscale(0.4);
    transition: all 0.3s ease;
}

.emotion-text {
    font-size: 22rpx;
    color: $text-secondary;
    text-align: center;
    transition: all 0.3s ease;
}

// 隐私设置
.privacy-section {
    background: #fff;
    border-radius: 24rpx;
    padding: 28rpx 36rpx;
    margin: 0 32rpx 48rpx;
    box-shadow: 0 4rpx 20rpx rgba(107, 78, 255, 0.06);
    transition: box-shadow 0.3s ease;
}

.privacy-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.privacy-info {
    display: flex;
    align-items: center;
    gap: 20rpx;
    flex: 1;
}

.privacy-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, rgba(107, 78, 255, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
}

.privacy-text {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.privacy-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
}

.privacy-desc {
    font-size: 22rpx;
    color: rgba(0, 0, 0, 0.45);
}

// Toggle 开关
.toggle-switch {
    position: relative;
    width: 88rpx;
    height: 52rpx;
    background: #e2e8f0;
    border-radius: 26rpx;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.active {
        background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
    }
}

.toggle-slider {
    position: absolute;
    width: 40rpx;
    height: 40rpx;
    background: #fff;
    border-radius: 50%;
    top: 6rpx;
    left: 6rpx;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);

    .toggle-switch.active & {
        transform: translateX(36rpx);
    }
}

// 底部按钮
.fixed-bottom {
    position: fixed;
    bottom: calc(100rpx + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    z-index: 100;
    background: #fff;
    padding: 28rpx 40rpx;
    padding-bottom: 28rpx;
    box-shadow: 0 -4rpx 32rpx rgba(107, 78, 255, 0.08);
    border-top-left-radius: 24rpx;
    border-top-right-radius: 24rpx;
}

.submit-btn {
    width: 100%;
    height: 100rpx;
    background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 28rpx rgba(107, 78, 255, 0.35);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &.disabled {
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        box-shadow: none;
        color: #94a3b8;
    }

    &:active:not(.disabled) {
        transform: scale(0.97);
        box-shadow: 0 4rpx 16rpx rgba(107, 78, 255, 0.3);
    }
}

// 编辑模式按钮
.edit-actions {
    display: flex;
    gap: 20rpx;
}

.edit-btn {
    flex: 1;
    height: 100rpx;
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 600;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &.save {
        background: rgba(107, 78, 255, 0.06);
        color: $primary-color;
        border: 2rpx solid rgba(107, 78, 255, 0.2);
    }

    &.reanalyze {
        background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
        color: #fff;
        box-shadow: 0 8rpx 28rpx rgba(107, 78, 255, 0.35);
    }

    &.disabled {
        opacity: 0.5;
        box-shadow: none;
    }

    &:active:not(.disabled) {
        transform: scale(0.97);
    }
}
.record-settings {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin: 0 32rpx 32rpx;
}
.setting-chip {
    margin: 0;
    padding: 14rpx 20rpx;
    border-radius: 14rpx;
    background: #eee9f4;
    color: #776787;
    font-size: 24rpx;
    line-height: 1.5;
}
.setting-chip::after,
.edit-btn::after {
    border: none;
}
.setting-chip.active {
    background: #7653af;
    color: #fff;
}
.polish-preview {
    margin: 24rpx 32rpx;
    padding: 28rpx;
    border-radius: 20rpx;
    background: #fff;
}
.preview-title,
.preview-copy,
.preview-hint {
    display: block;
}
.preview-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #8966b6;
}
.preview-copy {
    font-size: 28rpx;
    line-height: 1.8;
    white-space: pre-wrap;
    margin: 20rpx 0;
}
.preview-hint {
    color: #8e839b;
    font-size: 23rpx;
    line-height: 1.6;
}
.preview-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12rpx;
    margin-top: 24rpx;
}
.dark-mode .setting-chip {
    background: #302740;
    color: #bea6eb;
}
.dark-mode .polish-preview {
    background: #1a1a1a;
    color: #eee;
}
</style>
