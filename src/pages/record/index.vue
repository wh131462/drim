<template>
    <view
        class="page record-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar :title="isEditMode ? '编辑梦境' : '记录梦境'" />

        <!-- 输入区域 -->
        <view class="textarea-container">
            <textarea
                v-model="dreamContent"
                class="dream-textarea"
                placeholder="昨晚梦见了什么？试着描述梦中的场景、人物和发生的事情...（至少25字）"
                :maxlength="1000"
                auto-height
            />

            <!-- 内容工具栏 -->
            <view class="content-toolbar">
                <!-- AI 润色按钮 -->
                <view
                    class="polish-btn"
                    :class="{ disabled: !canPolish }"
                    @tap="handlePolish"
                >
                    <image
                        class="polish-icon"
                        src="/static/icons/star.svg"
                        mode="aspectFit"
                    />
                    <text>润色</text>
                </view>

                <!-- 版本切换器 (有多个版本时显示) -->
                <view
                    v-if="versions.length > 1"
                    class="version-switcher"
                    @tap="showVersionPicker"
                >
                    <text class="version-badge">v{{ currentVersionNumber }}</text>
                    <text>{{ currentVersionType }}</text>
                    <image
                        class="dropdown-icon"
                        src="/static/icons/arrow-right.svg"
                        mode="aspectFit"
                    />
                </view>
            </view>

            <!-- 配额提示和字数统计 -->
            <view class="hint-row">
                <view class="quota-hint">
                    <image
                        class="info-icon"
                        src="/static/icons/info.svg"
                        mode="aspectFit"
                    />
                    <text v-if="polishQuota?.isVip">VIP 无限润色</text>
                    <text v-else-if="polishQuota">剩余 {{ polishQuota.remaining }}/{{ polishQuota.total }}</text>
                    <text v-else>润色</text>
                </view>
                <view class="word-count">
                    <text :class="{ insufficient: dreamContent.length < 25 }"> {{ dreamContent.length }}/1000 </text>
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
                        v-if="tag.icon"
                        class="tag-icon"
                        :src="tag.icon"
                        mode="aspectFit"
                    />
                    <text
                        v-else
                        class="tag-emoji"
                        >{{ tag.emoji }}</text
                    >
                    <text class="tag-text">{{ tag.name }}</text>
                    <view
                        v-if="tag.custom"
                        class="tag-remove"
                        @tap.stop="removeCustomTag(tag.id)"
                        >×</view
                    >
                </view>
                <!-- 添加自定义标签按钮 -->
                <view
                    class="tag-item add-tag-btn"
                    @tap="showAddTagDialog"
                >
                    <text class="add-icon">+</text>
                    <text class="tag-text">自定义</text>
                </view>
            </view>
        </view>

        <!-- 梦中情绪 -->
        <view class="section-wrapper">
            <view class="section-title">
                <view class="title-bar"></view>
                <text>梦中情绪 (单选)</text>
            </view>
            <view class="emotion-grid">
                <view
                    v-for="emotion in emotions"
                    :key="emotion.id"
                    class="emotion-item"
                    :class="{ active: selectedEmotion === emotion.id }"
                    @tap="selectEmotion(emotion.id)"
                >
                    <text class="emotion-icon">{{ emotion.emoji }}</text>
                    <text
                        class="emotion-text"
                        :class="{ active: selectedEmotion === emotion.id }"
                        >{{ emotion.name }}</text
                    >
                </view>
            </view>
        </view>

        <!-- 隐私设置 -->
        <view class="privacy-section">
            <view class="privacy-toggle">
                <view class="privacy-info">
                    <view class="privacy-icon">{{ isPublic ? '🌍' : '🔒' }}</view>
                    <view class="privacy-text">
                        <text class="privacy-title">{{ isPublic ? '公开梦境' : '私密梦境' }}</text>
                        <text class="privacy-desc">{{ isPublic ? '允许其他用户在探索页面查看' : '仅自己可见' }}</text>
                    </view>
                </view>
                <view
                    class="toggle-switch"
                    :class="{ active: isPublic }"
                    @tap="togglePrivacy"
                >
                    <view class="toggle-slider"></view>
                </view>
            </view>
        </view>

        <!-- 底部按钮 -->
        <view class="fixed-bottom">
            <!-- 编辑模式：显示两个按钮 -->
            <template v-if="isEditMode">
                <view class="edit-actions">
                    <view
                        class="edit-btn save"
                        :class="{ disabled: !canSubmit }"
                        @tap="handleSaveOnly"
                    >
                        <text>仅保存</text>
                    </view>
                    <view
                        v-if="hasAnalysis"
                        class="edit-btn reanalyze"
                        :class="{ disabled: !canSubmit }"
                        @tap="handleSaveAndReanalyze"
                    >
                        <text>保存并重新解析</text>
                    </view>
                    <view
                        v-else
                        class="edit-btn reanalyze"
                        :class="{ disabled: !canSubmit }"
                        @tap="handleSaveAndReanalyze"
                    >
                        <text>保存并解析</text>
                    </view>
                </view>
            </template>
            <!-- 新建模式：显示单个按钮 -->
            <template v-else>
                <view
                    class="submit-btn"
                    :class="{ disabled: !canSubmit }"
                    @tap="handleSubmit"
                >
                    <text>开始解析</text>
                </view>
            </template>
        </view>

        <!-- 自定义 TabBar -->
        <custom-tab-bar :selected="1" />
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useDreamStore, useUserStore, useSettingsStore } from '@/stores';
import { polishApi, dreamApi } from '@/api';
import type { Emotion } from '@/types/dream';
import type { PolishQuota } from '@/api/modules/polish';
import { confirmPointsConsume, showPointsConsumed } from '@/utils/feedback';
import NavBar from '@/components/NavBar/index.vue';
import CustomTabBar from '@/custom-tab-bar/index.vue';

const dreamStore = useDreamStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const navBarHeight = ref(0);

// 编辑模式相关
const isEditMode = ref(false);
const editingDreamId = ref<string | null>(null);
const hasAnalysis = ref(false); // 是否已有解析结果

// 数据
const dreamContent = ref('');
const selectedTags = ref<string[]>([]);
const selectedEmotion = ref<string | null>(null);
const customTags = ref<Array<{ id: string; name: string; emoji: string; custom: boolean }>>([]);
const isPublic = ref(false);
const versions = ref<any[]>([]);
const currentVersionNumber = ref(1);
const currentVersionType = ref('原始版');
const polishQuota = ref<PolishQuota | null>(null);
// 当前编辑的梦境 ID（如果是从版本历史页面进入编辑模式）
const currentDreamId = ref<string | null>(null);

// 梦境元素标签
const dreamTags = [
    { id: 'running', name: '追逐', icon: '/static/icons/running.svg', custom: false },
    { id: 'flying', name: '飞行', icon: '/static/icons/plane.svg', custom: false },
    { id: 'exam', name: '考试', icon: '/static/icons/exam.svg', custom: false },
    { id: 'family', name: '亲人', icon: '/static/icons/family.svg', custom: false },
    { id: 'water', name: '水', icon: '/static/icons/water.svg', custom: false },
    { id: 'animal', name: '动物', icon: '/static/icons/animal.svg', custom: false },
    { id: 'lost', name: '迷路', icon: '/static/icons/map.svg', custom: false },
    { id: 'death', name: '死亡', icon: '/static/icons/death.svg', custom: false }
];

// 所有标签（包含自定义）
const allDreamTags = computed(() => {
    return [...dreamTags, ...customTags.value];
});

// 情绪选项 - 覆盖人类情绪大类
const emotions = [
    { id: 'happy', name: '开心', emoji: '😊' },
    { id: 'sad', name: '悲伤', emoji: '😢' },
    { id: 'angry', name: '愤怒', emoji: '😡' },
    { id: 'fear', name: '恐惧', emoji: '😨' },
    { id: 'surprise', name: '惊讶', emoji: '😮' },
    { id: 'disgust', name: '厌恶', emoji: '🤢' },
    { id: 'calm', name: '平静', emoji: '😌' },
    { id: 'anxious', name: '焦虑', emoji: '😰' },
    { id: 'confused', name: '困惑', emoji: '😕' },
    { id: 'excited', name: '兴奋', emoji: '🤩' },
    { id: 'lonely', name: '孤独', emoji: '😔' },
    { id: 'shame', name: '羞愧', emoji: '😳' },
    { id: 'love', name: '温暖', emoji: '🥰' },
    { id: 'bored', name: '无聊', emoji: '😑' }
];

// 计算属性
const canSubmit = computed(() => {
    return dreamContent.value.trim().length >= 25;
});

const canPolish = computed(() => {
    if (!polishQuota.value) return false;
    // VIP用户或有剩余配额
    return dreamContent.value.trim().length >= 25 && (polishQuota.value.isVip || polishQuota.value.remaining > 0);
});

// 方法
function toggleTag(tagId: string) {
    const index = selectedTags.value.indexOf(tagId);
    if (index > -1) {
        selectedTags.value.splice(index, 1);
    } else if (selectedTags.value.length < 3) {
        selectedTags.value.push(tagId);
    } else {
        uni.showToast({ title: '最多选择3个标签', icon: 'none' });
    }
}

function selectEmotion(emotionId: string) {
    selectedEmotion.value = selectedEmotion.value === emotionId ? null : emotionId;
}

// 显示添加自定义标签对话框
function showAddTagDialog() {
    uni.showModal({
        title: '添加自定义元素',
        editable: true,
        placeholderText: '请输入梦境元素名称',
        success: (res) => {
            if (res.confirm && res.content) {
                const tagName = res.content.trim();
                if (tagName.length > 0 && tagName.length <= 4) {
                    addCustomTag(tagName);
                } else {
                    uni.showToast({
                        title: '标签名称应为1-4个字',
                        icon: 'none'
                    });
                }
            }
        }
    });
}

// 添加自定义标签
function addCustomTag(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // 检查是否已存在（包括预设标签和自定义标签）
    const exists = allDreamTags.value.some((tag) => tag.name === trimmedName || tag.id === trimmedName);
    if (exists) {
        uni.showToast({ title: '该元素已存在', icon: 'none' });
        return;
    }

    // 添加到自定义标签列表（直接使用名称作为 ID，方便展示）
    const newTag = {
        id: trimmedName,
        name: trimmedName,
        emoji: '✨',
        custom: true
    };
    customTags.value.push(newTag);

    // 自动选中新添加的标签
    if (selectedTags.value.length < 3) {
        selectedTags.value.push(newTag.id);
    }

    uni.showToast({ title: '添加成功', icon: 'success' });
}

// 删除自定义标签
function removeCustomTag(tagId: string) {
    // 从选中列表中移除
    const selectedIndex = selectedTags.value.indexOf(tagId);
    if (selectedIndex > -1) {
        selectedTags.value.splice(selectedIndex, 1);
    }

    // 从自定义标签列表中移除
    const customIndex = customTags.value.findIndex((tag) => tag.id === tagId);
    if (customIndex > -1) {
        customTags.value.splice(customIndex, 1);
    }
}

// 加载配额
async function loadQuota() {
    try {
        polishQuota.value = await polishApi.getQuota();
    } catch (error) {
        console.error('加载配额失败:', error);
    }
}

// AI 润色
async function handlePolish() {
    if (!canPolish.value) return;

    try {
        // 润色前保存原始内容（如果还没有版本）
        const originalContent = dreamContent.value.trim();

        uni.showLoading({ title: '润色中...' });

        // 调用真实 API - showError: false 使用页面自定义的错误处理
        const response = await polishApi.polishText(originalContent, undefined, { showError: false });

        // 如果是第一次润色，先添加原始版本
        if (versions.value.length === 0) {
            versions.value.push({
                versionId: 'local_v1',
                type: 'original',
                content: originalContent,
                versionNumber: 1
            });
        }

        // 添加润色版本
        const newVersionNumber = versions.value.length + 1;
        versions.value.push({
            versionId: `local_v${newVersionNumber}`,
            type: 'polished',
            content: response.content,
            versionNumber: newVersionNumber
        });

        // 更新内容和版本信息
        dreamContent.value = response.content;
        currentVersionNumber.value = newVersionNumber;
        currentVersionType.value = '润色版';

        // 更新配额
        if (response.quota) {
            polishQuota.value = response.quota;
        }

        uni.hideLoading();
        uni.showToast({ title: '润色完成', icon: 'success' });
    } catch (error: any) {
        uni.hideLoading();
        const message = error?.message || '润色失败';

        // 判断是否为可重试的错误
        const isRetryable = isRetryableError(message);

        if (isRetryable) {
            // 显示重试对话框
            uni.showModal({
                title: '润色失败',
                content: message + '\n\n是否重试？',
                confirmText: '重试',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        handlePolish();
                    }
                }
            });
        } else {
            uni.showToast({ title: message, icon: 'none' });
        }
    }
}

// 判断是否为可重试的错误
function isRetryableError(message: string): boolean {
    const retryableKeywords = ['超时', '稍后重试', '繁忙', '暂时不可用', '连接失败', '返回异常', '响应超时'];
    return retryableKeywords.some((keyword) => message.includes(keyword));
}

// 显示版本选择器
function showVersionPicker() {
    const items = versions.value.map((v) => `v${v.versionNumber} - ${v.type === 'polished' ? '润色版' : '原始版'}`);

    uni.showActionSheet({
        itemList: items,
        success: (res) => {
            const selectedVersion = versions.value[res.tapIndex];
            switchToVersion(selectedVersion);
        }
    });
}

// 切换版本
function switchToVersion(version: any) {
    dreamContent.value = version.content;
    currentVersionNumber.value = version.versionNumber;
    currentVersionType.value = version.type === 'polished' ? '润色版' : '原始版';

    uni.showToast({ title: `已切换到 v${version.versionNumber}`, icon: 'success' });
}

// 切换隐私
function togglePrivacy() {
    isPublic.value = !isPublic.value;
    uni.showToast({
        title: isPublic.value ? '已设为公开' : '已设为私密',
        icon: 'none'
    });
}

async function handleSubmit() {
    if (!canSubmit.value) {
        const currentLength = dreamContent.value.trim().length;
        uni.showToast({
            title: `至少输入25字哦，还差${25 - currentLength}字`,
            icon: 'none'
        });
        return;
    }

    try {
        uni.showLoading({ title: '提交中...' });

        const response = await dreamStore.submitDream({
            content: dreamContent.value.trim(),
            tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
            emotion: (selectedEmotion.value || undefined) as Emotion | undefined,
            isPublic: isPublic.value
        });

        uni.hideLoading();

        // 构建跳转 URL，传递奖励数据
        let url = `/pages/result/index?dreamId=${response.id}`;
        if (response.rewards) {
            const { dreamReward, streakReward, streakDays } = response.rewards;
            if (dreamReward) url += `&dreamReward=${dreamReward}`;
            if (streakReward) url += `&streakReward=${streakReward}`;
            if (streakDays) url += `&streakDays=${streakDays}`;
        }

        // 跳转到解析结果页（使用 redirectTo 替换当前页面，避免返回时出现空的记录页）
        uni.redirectTo({ url });
    } catch (error: any) {
        uni.hideLoading();
        uni.showToast({ title: error?.message || '提交失败，请重试', icon: 'none' });
    }
}

// 编辑模式：仅保存
async function handleSaveOnly() {
    if (!canSubmit.value) {
        const currentLength = dreamContent.value.trim().length;
        uni.showToast({
            title: `至少输入25字哦，还差${25 - currentLength}字`,
            icon: 'none'
        });
        return;
    }
    if (!editingDreamId.value) return;

    try {
        uni.showLoading({ title: '保存中...' });

        await dreamApi.update(editingDreamId.value, {
            content: dreamContent.value.trim(),
            reAnalyze: false
        });

        uni.hideLoading();
        uni.showToast({ title: '保存成功', icon: 'success' });

        // 跳转回详情页（因为是从 switchTab 跳转过来的，页面栈已清空，不能用 navigateBack）
        setTimeout(() => {
            uni.navigateTo({
                url: `/pages/dream-detail/index?id=${editingDreamId.value}`
            });
        }, 1500);
    } catch (error: any) {
        uni.hideLoading();
        uni.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
}

// 编辑模式：保存并重新解析
const REANALYZE_COST = 50;

async function handleSaveAndReanalyze() {
    if (!canSubmit.value) {
        const currentLength = dreamContent.value.trim().length;
        uni.showToast({
            title: `至少输入25字哦，还差${25 - currentLength}字`,
            icon: 'none'
        });
        return;
    }
    if (!editingDreamId.value) return;

    // 刷新用户积分信息
    await userStore.fetchUserInfo();

    // 确认消耗积分
    const confirmed = await confirmPointsConsume(REANALYZE_COST, userStore.luckyPoints, '重新解析');

    if (!confirmed) return;

    try {
        uni.showLoading({ title: '保存中...' });

        const result = await dreamApi.update(editingDreamId.value, {
            content: dreamContent.value.trim(),
            reAnalyze: true
        });

        uni.hideLoading();

        // 显示积分消耗提示
        if (result.pointsConsumed) {
            showPointsConsumed(result.pointsConsumed, '重新解析');
        }

        // 更新用户积分
        userStore.fetchUserInfo();

        // 跳转到解析结果页
        setTimeout(() => {
            uni.redirectTo({
                url: `/pages/result/index?dreamId=${result.id}`
            });
        }, 500);
    } catch (error: any) {
        uni.hideLoading();

        // 处理积分不足错误
        if (error?.code === 30001) {
            uni.showModal({
                title: '幸运值不足',
                content: error.message || `重新解析需要 ${REANALYZE_COST} 幸运值`,
                confirmText: '去赚取',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/vip/index' });
                    }
                }
            });
        } else {
            uni.showToast({ title: error.message || '保存失败', icon: 'none' });
        }
    }
}

// 应用默认公开设置
async function applyDefaultPublicSetting() {
    await settingsStore.ensureSettings();
    isPublic.value = settingsStore.defaultDreamPublic;
}

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44;

    // 从服务端读取默认公开状态
    applyDefaultPublicSetting();

    // 加载配额
    loadQuota();
});

// 处理从版本历史页面或详情页跳转过来的编辑模式
onShow(() => {
    try {
        // 优先处理从详情页跳转过来的编辑（editingDream）
        const editingDream = uni.getStorageSync('editingDream');
        if (editingDream) {
            // 设置编辑模式（从 storage 读取，因为 switchTab 不支持传参）
            isEditMode.value = editingDream.isEditMode || false;

            // 加载待编辑的梦境内容
            dreamContent.value = editingDream.content || '';
            editingDreamId.value = editingDream.dreamId || null;
            currentDreamId.value = editingDream.dreamId || null;
            hasAnalysis.value = editingDream.hasAnalysis || false;
            isPublic.value = editingDream.isPublic || false;

            // 加载标签
            if (editingDream.tags && Array.isArray(editingDream.tags)) {
                selectedTags.value = editingDream.tags;
            }

            // 加载情绪
            if (editingDream.emotion) {
                selectedEmotion.value = editingDream.emotion;
            }

            // 清除存储，避免重复加载
            uni.removeStorageSync('editingDream');

            console.log('已加载梦境进行编辑:', editingDream);
            return;
        }

        // 处理从版本历史页面跳转过来的编辑（editingVersion）
        const editingVersion = uni.getStorageSync('editingVersion');
        if (editingVersion) {
            // 加载待编辑的版本内容
            dreamContent.value = editingVersion.content || '';

            // 保存 dreamId，用于后续跳转到版本历史页面
            currentDreamId.value = editingVersion.dreamId || null;

            // 清除存储，避免重复加载
            uni.removeStorageSync('editingVersion');

            console.log('已加载版本进行编辑:', editingVersion);
            return;
        }

        // 非编辑模式：重置为新建状态，从服务端读取默认公开状态
        if (!isEditMode.value) {
            applyDefaultPublicSetting();
        }
    } catch (error) {
        console.error('加载编辑版本失败:', error);
    }
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.record-page {
    min-height: 100vh;
    background: $bg-page;
    padding-bottom: 300rpx;
    padding-top: calc(v-bind('navBarHeight') * 2rpx);
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

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

            .add-icon,
            .tag-text {
                color: $dark-text-secondary;
            }
        }

        .tag-emoji {
            filter: grayscale(0);
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

// 自定义标签emoji
.tag-emoji {
    font-size: 48rpx;
    margin-bottom: 12rpx;
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
    font-size: 44rpx;
    margin-bottom: 12rpx;
    color: $primary-color;
    font-weight: 300;
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
    color: #fff;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-weight: 700;
    transition: all 0.2s;

    &:active {
        background: #ff4d4f;
        transform: scale(1.1);
    }
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
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #fff;
    padding: 28rpx 40rpx;
    padding-bottom: calc(28rpx + 100rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -4rpx 32rpx rgba(107, 78, 255, 0.08);
    border-top-left-radius: 40rpx;
    border-top-right-radius: 40rpx;
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
</style>
