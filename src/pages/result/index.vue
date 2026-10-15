<template>
    <view
        class="page result-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar
            title="梦境解析"
            :custom-back="!!analysis"
            @back="handleCustomBack"
        />

        <!-- 加载中 -->
        <view
            v-if="loading"
            class="loading-container"
        >
            <!-- 背景星空 -->
            <view class="stars-bg">
                <view
                    v-for="i in 20"
                    :key="i"
                    class="star"
                    :style="getStarStyle(i)"
                ></view>
            </view>

            <!-- 主动画区域 -->
            <view class="loading-main">
                <!-- 外圈旋转光环 -->
                <view class="outer-ring"></view>
                <view class="outer-ring ring-2"></view>

                <!-- 中心水晶球 -->
                <view class="crystal-ball">
                    <view class="crystal-inner">
                        <image
                            class="crystal-icon"
                            src="/static/icons/crystal.png"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
                    </view>
                    <view class="crystal-glow"></view>
                </view>

                <!-- 环绕粒子 -->
                <view class="orbit-particles">
                    <view
                        v-for="i in 6"
                        :key="i"
                        class="particle"
                        :style="{ animationDelay: `${i * 0.5}s` }"
                    ></view>
                </view>
            </view>

            <!-- 进度文字 -->
            <view class="loading-info">
                <text class="loading-text">{{ loadingText }}</text>
            </view>

            <!-- 装饰点 -->
            <view class="loading-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
            </view>

            <!-- 提示文字 -->
            <text class="loading-hint">系统正在深度解读你的梦境...</text>
        </view>

        <!-- 错误状态 -->
        <view
            v-else-if="error"
            class="error-container"
        >
            <image
                class="error-icon"
                src="/static/icons/warning.png"
                mode="aspectFit"
                aria-hidden="true"
            />
            <text class="error-title">解析遇到问题</text>
            <text class="error-message">{{ error }}</text>
            <view class="error-actions">
                <view
                    class="retry-btn"
                    @tap="loadAnalysis"
                >
                    <text>重新加载</text>
                </view>
                <view
                    class="back-btn"
                    @tap="goBack"
                >
                    <text>返回</text>
                </view>
            </view>
        </view>

        <!-- 解析结果 -->
        <template v-else-if="analysis">
            <view
                class="result-content"
                :style="{ paddingTop: `calc(${navBarHeight}px + 40rpx)` }"
            >
                <!-- 头部区域 -->
                <view class="result-header">
                    <view class="score-wrapper">
                        <view class="score-ring"></view>
                        <view class="score-circle">
                            <text class="score-number">{{ analysis.fortuneScore }}</text>
                            <text class="score-unit">分</text>
                        </view>
                    </view>
                    <text class="score-label">运势评分</text>
                    <view
                        v-if="analysis.fortuneTips?.scoreReason"
                        class="score-reason-card"
                    >
                        <image
                            class="reason-icon"
                            src="/static/icons/sparkle.png"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
                        <text class="score-reason">{{ analysis.fortuneTips.scoreReason }}</text>
                    </view>
                </view>

                <!-- 解析卡片 -->
                <view class="card analysis-card">
                    <text class="analysis-title">{{ analysis.theme }}</text>
                    <text class="analysis-text">{{ analysis.interpretation }}</text>
                </view>

                <view
                    v-if="analysis.fortuneTips"
                    class="fortune-tips-card"
                >
                    <text class="section-caption">把解析带回今天</text>
                    <view class="fortune-tips-grid">
                        <view
                            v-for="item in fortuneTipItems"
                            :key="item.label"
                            class="fortune-tip"
                            ><text class="fortune-tip-label">{{ item.label }}</text
                            ><text>{{ item.value }}</text></view
                        >
                    </view>
                </view>

                <view
                    v-if="analysis.task"
                    class="result-task-card"
                >
                    <text class="section-caption">今日小任务</text>
                    <text class="result-task-content">{{ analysis.task.content }}</text>
                    <text class="result-task-reward">完成可获得 +{{ analysis.task.rewardPoints }} 幸运值</text>
                </view>

                <!-- 延伸阅读：由书店接口匹配解析主题 -->
                <view
                    v-if="recommendedBooks.length || recommendationsLoading || recommendationsError"
                    class="reading-section"
                >
                    <view class="reading-section-header">
                        <text class="reading-section-title">延伸阅读</text>
                        <text
                            class="reading-section-link"
                            @tap="goToBooks"
                            >查看书店</text
                        >
                    </view>
                    <text
                        v-if="recommendationsLoading"
                        class="reading-status"
                        >正在加载推荐书籍…</text
                    >
                    <button
                        v-else-if="recommendationsError"
                        class="reading-retry"
                        @tap="loadRecommendedBooks"
                    >
                        推荐书籍加载失败，点击重试
                    </button>
                    <button
                        v-if="favoritesError"
                        class="reading-retry"
                        @tap="refreshFavorites"
                    >
                        收藏状态同步失败，点击重试
                    </button>
                    <BookCard
                        v-for="book in recommendedBooks"
                        :key="book.id"
                        :book="book"
                        :saved="booksStore.savedIds.includes(book.id)"
                        :pending="booksStore.pendingIds.includes(book.id)"
                        :save-disabled="!booksStore.favoritesReady"
                        :reason="book.reason"
                        @save="saveBook"
                        @open="openBook"
                    />
                </view>

                <!-- 重新解析按钮 -->
                <view class="reanalyze-section">
                    <view
                        class="reanalyze-btn"
                        :class="{ disabled: reanalyzing }"
                        @tap="handleReanalyze"
                    >
                        <text v-if="reanalyzing">重新解析中...</text>
                        <text v-else>重新解析（消耗 {{ REANALYZE_COST }} 幸运值）</text>
                    </view>
                    <text class="reanalyze-hint">对解析结果不满意？可以消耗幸运值重新解析</text>
                </view>

                <text class="result-disclaimer">{{
                    analysis.disclaimer || '本解析仅供自我探索与娱乐参考，不构成专业建议。'
                }}</text>
            </view>
        </template>

        <!-- 记梦奖励弹窗 -->
        <DreamRewardModal
            v-model:visible="showRewardModal"
            :dream-reward="rewardInfo.dreamReward"
            :streak-reward="rewardInfo.streakReward"
            :streak-days="rewardInfo.streakDays"
        />
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore, useBooksStore } from '@/stores';
import { analysisApi, booksApi } from '@/api';
import { dreamApi } from '@/api';
import { connectAnalysisStream } from '@/utils/sse-client';
import { confirmPointsConsume, showPointsConsumed } from '@/utils/feedback';
import NavBar from '@/components/NavBar/index.vue';
import DreamRewardModal from '@/components/DreamRewardModal/index.vue';
import BookCard from '@/components/BookCard/index.vue';
import type { Book } from '@/constants/content';

const userStore = useUserStore();
const booksStore = useBooksStore();
const loading = ref(true);
const analysis = ref<any>(null);
const error = ref<string | null>(null);
const navBarHeight = ref(0);
const dreamId = ref('');
const loadingText = ref('系统正在解析你的梦境...');
const reanalyzing = ref(false);
const dreamContext = ref('');
const recommendedBooks = ref<Book[]>([]);
const recommendationsLoading = ref(false);
const recommendationsError = ref(false);
const favoritesError = ref(false);
let recommendationVersion = 0;
const recommendationTopic = computed(() =>
    !loading.value && analysis.value
        ? `${analysis.value.theme || ''} ${analysis.value.interpretation || ''} ${dreamContext.value}`
        : ''
);
watch(recommendationTopic, () => {
    void loadRecommendedBooks();
});
watch(
    () => userStore.token,
    (_, previous) => {
        if (!previous) return;
        recommendationVersion++;
        recommendedBooks.value = [];
        recommendationsLoading.value = false;
    }
);
const fortuneTipItems = computed(() =>
    [
        { label: '事业', value: analysis.value?.fortuneTips?.career },
        { label: '关系', value: analysis.value?.fortuneTips?.love },
        { label: '身心', value: analysis.value?.fortuneTips?.health }
    ].filter((item) => item.value)
);

// 重新解析消耗的积分
const REANALYZE_COST = 50;

// 奖励弹窗相关
const showRewardModal = ref(false);
const rewardInfo = ref({
    dreamReward: 0,
    streakReward: 0,
    streakDays: 0
});
// 是否为新记录的梦境（需要显示奖励弹窗）
let isNewDream = false;

// SSE 关闭函数
let closeSSE: (() => void) | null = null;
// 轮询相关 (降级方案)
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollCount = 0;
const MAX_POLL_COUNT = 60;

// 获取URL参数
onLoad((options: any) => {
    dreamId.value = options.dreamId || '';

    // 获取奖励参数
    if (options.dreamReward || options.streakReward) {
        isNewDream = true;
        rewardInfo.value = {
            dreamReward: parseInt(options.dreamReward) || 0,
            streakReward: parseInt(options.streakReward) || 0,
            streakDays: parseInt(options.streakDays) || 0
        };
    }
});

onMounted(async () => {
    const systemInfo = uni.getSystemInfoSync();
    navBarHeight.value = (systemInfo.statusBarHeight || 0) + 44;
    void loadDreamContext();
    await startAnalysis();
});

onShow(() => {
    void refreshFavorites();
});

async function loadDreamContext() {
    if (!dreamId.value) return;
    try {
        const dream = await dreamApi.getById(dreamId.value);
        dreamContext.value = `${dream.content} ${(dream.tags || []).join(' ')}`;
    } catch {
        // 无原始梦境权限时仍可用解析主题请求推荐。
    }
}

async function saveBook(id: string) {
    try {
        await booksStore.toggleFavorite(id);
    } catch (err) {
        uni.showToast({ title: err instanceof Error ? err.message : '收藏保存失败，请重试', icon: 'none' });
    }
}

async function refreshFavorites() {
    let token = userStore.token;
    try {
        token = await booksStore.ensureSession();
        await booksStore.loadFavorites(true);
        if (userStore.token === token) favoritesError.value = false;
    } catch {
        if (userStore.token === token) favoritesError.value = true;
    }
}

async function loadRecommendedBooks() {
    const version = ++recommendationVersion;
    const topic = recommendationTopic.value;
    recommendedBooks.value = [];
    recommendationsError.value = false;
    recommendationsLoading.value = !!topic;
    if (!topic) return;
    try {
        const token = await booksStore.ensureSession();
        if (version !== recommendationVersion || userStore.token !== token) return;
        const books = await booksApi.getRecommendations(topic);
        if (version !== recommendationVersion || userStore.token !== token) return;
        recommendedBooks.value = books;
    } catch {
        if (version === recommendationVersion) recommendationsError.value = true;
    } finally {
        if (version === recommendationVersion) recommendationsLoading.value = false;
    }
}

function openBook(id: string) {
    uni.navigateTo({ url: `/pages/books/detail?id=${encodeURIComponent(id)}&source=recommendation` });
}

function goToBooks() {
    uni.navigateTo({ url: '/pages/books/index' });
}

onUnmounted(() => {
    recommendationVersion++;
    cleanup();
});

/**
 * 清理资源
 */
function cleanup() {
    if (closeSSE) {
        closeSSE();
        closeSSE = null;
    }
    if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }
}

/**
 * 开始解析
 */
async function startAnalysis() {
    if (!dreamId.value) {
        error.value = '参数错误，请返回重试';
        loading.value = false;
        return;
    }

    cleanup();
    loading.value = true;
    error.value = null;
    pollCount = 0;
    loadingText.value = '正在启动智能解析...';

    try {
        // 请求解析 (SSE 模式) - showLoading: false 避免遮挡加载动画，showError: false 使用页面错误状态显示
        const response = await analysisApi.requestStream(
            { dreamId: dreamId.value },
            { showLoading: false, showError: false }
        );

        // 如果已完成，直接获取结果
        if (response.status === 'completed') {
            await loadAnalysisResult(response.analysisId);
            return;
        }

        // 使用 SSE 流式接收
        startSSEStream();
    } catch (err: any) {
        console.error('触发解析失败:', err);
        error.value = err?.message || '解析请求失败，请稍后重试';
        loading.value = false;
    }
}

/**
 * SSE 流式接收
 */
function startSSEStream() {
    loadingText.value = '系统正在解析你的梦境...';

    closeSSE = connectAnalysisStream(dreamId.value, {
        onStart: () => {
            loadingText.value = '开始解析梦境...';
        },
        onProgress: (message) => {
            loadingText.value = message;
        },
        onComplete: (data) => {
            analysis.value = data;
            loading.value = false;
            closeSSE = null;
            handleAnalysisComplete();
        },
        onError: (errorMsg) => {
            // SSE 失败，尝试降级为轮询
            console.warn('SSE error, falling back to polling:', errorMsg);
            closeSSE = null;
            fallbackToPolling();
        },
        timeout: 120000
    });
}

/**
 * 降级为轮询
 */
async function fallbackToPolling() {
    try {
        loadingText.value = '系统正在解析你的梦境...';
        const response = await analysisApi.request(
            { dreamId: dreamId.value },
            { showLoading: false, showError: false }
        );
        if (response.status === 'completed') {
            await loadAnalysisResult(response.analysisId);
        } else {
            pollForResult(response.analysisId);
        }
    } catch (err: any) {
        error.value = err?.message || '解析失败';
        loading.value = false;
    }
}

/**
 * 轮询检查结果 (降级方案)
 */
function pollForResult(analysisId: string) {
    pollTimer = setTimeout(async () => {
        pollCount++;

        if (pollCount > MAX_POLL_COUNT) {
            error.value = '解析超时，请稍后重试';
            loading.value = false;
            return;
        }

        try {
            const result = await analysisApi.getById(analysisId);

            if (result.status === 'completed') {
                analysis.value = result;
                loading.value = false;
                handleAnalysisComplete();
            } else if (result.status === 'failed') {
                error.value = '智能解析失败，请重试';
                loading.value = false;
            } else {
                // 更新提示文字
                if (pollCount > 20) {
                    loadingText.value = '即将完成，请稍候...';
                } else if (pollCount > 10) {
                    loadingText.value = '正在深度分析梦境含义...';
                }
                pollForResult(analysisId);
            }
        } catch (err: any) {
            error.value = err?.message || '获取解析结果失败，请稍后重试';
            loading.value = false;
        }
    }, 1000);
}

/**
 * 直接加载解析结果
 */
async function loadAnalysisResult(analysisId: string) {
    try {
        const result = await analysisApi.getById(analysisId, { showLoading: false, showError: false });
        analysis.value = result;
        handleAnalysisComplete();
    } catch (err: any) {
        error.value = err?.message || '加载失败，请稍后重试';
    } finally {
        loading.value = false;
    }
}

/**
 * 解析完成后的处理
 */
function handleAnalysisComplete() {
    // 如果是新记录的梦境且有奖励，显示奖励弹窗
    if (isNewDream && (rewardInfo.value.dreamReward > 0 || rewardInfo.value.streakReward > 0)) {
        // 延迟显示，让用户先看到解析结果
        setTimeout(() => {
            showRewardModal.value = true;
        }, 500);
        // 标记已显示，避免重复
        isNewDream = false;
    }
}

/**
 * 重新加载
 */
async function loadAnalysis() {
    await startAnalysis();
}

function goBack() {
    uni.navigateBack({ delta: 1 });
}

/**
 * 自定义返回处理（解析完成后）
 * 跳转到梦境详情页而不是返回 record 页面
 */
function handleCustomBack() {
    if (dreamId.value) {
        // 跳转到梦境详情页
        uni.redirectTo({
            url: `/pages/dream-detail/index?id=${dreamId.value}`
        });
    } else {
        // 兜底：跳转到首页
        uni.switchTab({ url: '/pages/index/index' });
    }
}

/**
 * 生成星星随机样式
 */
function getStarStyle(index: number) {
    const seed = index * 7919; // 使用素数生成伪随机数
    const left = (seed * 13) % 100;
    const top = (seed * 17) % 100;
    const size = 2 + ((seed * 23) % 4);
    const delay = ((seed * 29) % 30) / 10;
    const duration = 2 + ((seed * 31) % 20) / 10;

    return {
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}rpx`,
        height: `${size}rpx`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
    };
}

/**
 * 处理重新解析
 */
async function handleReanalyze() {
    if (reanalyzing.value || loading.value) return;
    reanalyzing.value = true;
    try {
        await userStore.fetchUserInfo();
        const confirmed = await confirmPointsConsume(REANALYZE_COST, userStore.luckyPoints, '重新解析');
        if (!confirmed) return;

        cleanup();
        loading.value = true;
        error.value = null;
        pollCount = 0;
        loadingText.value = '正在重新解析...';

        // 调用重新解析接口
        const response = await analysisApi.retry(dreamId.value, { showLoading: false, showError: false });

        // 显示积分消耗提示
        showPointsConsumed(response.pointsConsumed, '重新解析');

        // 刷新失败不影响已启动的解析。
        try {
            userStore.updateLuckyPoints(response.remainingPoints);
        } catch (error) {
            console.warn('解析后积分缓存更新失败:', error);
        }
        void userStore.fetchUserInfo().catch((error) => console.warn('解析后用户信息刷新失败:', error));

        // 使用 SSE 流式接收新的解析结果
        startSSEStream();
    } catch (err: any) {
        console.error('重新解析失败:', err);

        // 处理积分不足错误
        if (err?.code === 30001) {
            uni.showModal({
                title: '幸运值不足',
                content: err.message || `重新解析需要 ${REANALYZE_COST} 幸运值`,
                confirmText: '去赚取',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/vip/index' });
                    }
                }
            });
        } else {
            error.value = err?.message || '重新解析失败，请稍后重试';
        }

        loading.value = false;
    } finally {
        reanalyzing.value = false;
    }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.result-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #6b4eff 0%, #f5f5f5 50%);
    transition: background 0.3s ease;

    &.dark-mode {
        background: linear-gradient(180deg, $dark-primary-color 0%, $dark-bg-page 50%);

        .score-circle {
            background: linear-gradient(145deg, $dark-bg-card 0%, color.adjust($dark-bg-card, $lightness: -5%) 100%);
            box-shadow:
                0 8rpx 32rpx rgba(139, 110, 255, 0.3),
                inset 0 2rpx 8rpx rgba(255, 255, 255, 0.05);
        }

        .score-number {
            background: linear-gradient(
                180deg,
                $dark-primary-color 0%,
                color.adjust($dark-primary-color, $lightness: 15%) 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .score-unit {
            color: $dark-primary-color;
        }

        .score-ring {
            border-color: rgba(139, 110, 255, 0.2);

            &::before {
                border-top-color: rgba(139, 110, 255, 0.6);
            }
        }

        .score-reason-card {
            background: rgba(139, 110, 255, 0.1);
            border-color: rgba(139, 110, 255, 0.15);
        }

        .score-reason {
            color: rgba(255, 255, 255, 0.9);
        }

        .card {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .analysis-title {
            color: $dark-text-primary;
        }

        .analysis-text {
            color: $dark-text-secondary;
        }

        .loading-text {
            color: $dark-text-secondary;
        }

        .error-title {
            color: $dark-text-primary;
        }

        .error-message {
            color: $dark-text-secondary;
        }

        .error-icon {
            filter: brightness(1.4);
        }

        .retry-btn {
            background: $dark-primary-color;
        }

        .back-btn {
            background: $dark-bg-card;
            color: $dark-text-secondary;
        }
    }
}

.loading-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: linear-gradient(180deg, #1a1040 0%, #2d1b69 50%, #4a2c7a 100%);
    overflow: hidden;
}

// 背景星空
.stars-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.star {
    position: absolute;
    background: #fff;
    border-radius: 50%;
    animation: twinkle 2s ease-in-out infinite;
    box-shadow: 0 0 4rpx #fff;
}

@keyframes twinkle {
    0%,
    100% {
        opacity: 0.3;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.2);
    }
}

// 主动画区域
.loading-main {
    position: relative;
    width: 400rpx;
    height: 400rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

// 外圈旋转光环
.outer-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 4rpx solid transparent;
    border-top-color: rgba(139, 110, 255, 0.8);
    border-right-color: rgba(139, 110, 255, 0.4);
    border-radius: 50%;
    animation: spin 3s linear infinite;

    &::before {
        content: '';
        position: absolute;
        top: -4rpx;
        left: 50%;
        width: 12rpx;
        height: 12rpx;
        background: #8b6eff;
        border-radius: 50%;
        box-shadow:
            0 0 20rpx #8b6eff,
            0 0 40rpx #8b6eff;
    }

    &.ring-2 {
        width: 85%;
        height: 85%;
        animation: spin 4s linear infinite reverse;
        border-top-color: rgba(255, 182, 193, 0.6);
        border-right-color: rgba(255, 182, 193, 0.3);

        &::before {
            background: #ffb6c1;
            box-shadow:
                0 0 20rpx #ffb6c1,
                0 0 40rpx #ffb6c1;
        }
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

// 中心水晶球
.crystal-ball {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.crystal-inner {
    position: relative;
    width: 160rpx;
    height: 160rpx;
    background: linear-gradient(135deg, rgba(139, 110, 255, 0.3) 0%, rgba(75, 0, 130, 0.5) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s ease-in-out infinite;
    box-shadow:
        inset 0 0 40rpx rgba(139, 110, 255, 0.5),
        0 0 60rpx rgba(139, 110, 255, 0.4);
}

.crystal-icon {
    width: 80rpx;
    height: 80rpx;
    filter: brightness(0) invert(1);
    animation: float 3s ease-in-out infinite;
}

@keyframes pulse {
    0%,
    100% {
        transform: scale(1);
        box-shadow:
            inset 0 0 40rpx rgba(139, 110, 255, 0.5),
            0 0 60rpx rgba(139, 110, 255, 0.4);
    }
    50% {
        transform: scale(1.05);
        box-shadow:
            inset 0 0 60rpx rgba(139, 110, 255, 0.7),
            0 0 80rpx rgba(139, 110, 255, 0.6);
    }
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10rpx);
    }
}

.crystal-glow {
    position: absolute;
    width: 200rpx;
    height: 200rpx;
    background: radial-gradient(circle, rgba(139, 110, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
    0%,
    100% {
        opacity: 0.5;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.2);
    }
}

// 环绕粒子
.orbit-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    animation: spin 8s linear infinite;
}

.particle {
    position: absolute;
    width: 8rpx;
    height: 8rpx;
    background: #fff;
    border-radius: 50%;
    box-shadow:
        0 0 10rpx #8b6eff,
        0 0 20rpx #8b6eff;
    animation: particlePulse 1.5s ease-in-out infinite;

    &:nth-child(1) {
        top: 0;
        left: 50%;
    }
    &:nth-child(2) {
        top: 25%;
        right: 6%;
    }
    &:nth-child(3) {
        bottom: 25%;
        right: 6%;
    }
    &:nth-child(4) {
        bottom: 0;
        left: 50%;
    }
    &:nth-child(5) {
        bottom: 25%;
        left: 6%;
    }
    &:nth-child(6) {
        top: 25%;
        left: 6%;
    }
}

@keyframes particlePulse {
    0%,
    100% {
        opacity: 0.4;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.5);
    }
}

// 进度文字
.loading-info {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 60rpx;
}

.loading-text {
    font-size: 32rpx;
    color: #fff;
    font-weight: 500;
    text-shadow: 0 0 20rpx rgba(139, 110, 255, 0.8);
}

.loading-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    margin-top: 32rpx;
}

.loading-dots .dot {
    width: 12rpx;
    height: 12rpx;
    background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
    border-radius: 50%;
    box-shadow:
        0 0 8rpx rgba(139, 110, 255, 0.6),
        0 0 16rpx rgba(139, 110, 255, 0.3);
    animation: dotWave 1.6s ease-in-out infinite;

    &:nth-child(1) {
        animation-delay: 0s;
    }
    &:nth-child(2) {
        animation-delay: 0.15s;
    }
    &:nth-child(3) {
        animation-delay: 0.3s;
    }
}

@keyframes dotWave {
    0%,
    100% {
        opacity: 0.4;
        transform: translateY(0) scale(0.8);
        box-shadow:
            0 0 8rpx rgba(139, 110, 255, 0.4),
            0 0 16rpx rgba(139, 110, 255, 0.2);
    }
    50% {
        opacity: 1;
        transform: translateY(-16rpx) scale(1.1);
        box-shadow:
            0 0 12rpx rgba(139, 110, 255, 0.8),
            0 0 24rpx rgba(139, 110, 255, 0.5),
            0 4rpx 8rpx rgba(0, 0, 0, 0.2);
    }
}

.loading-hint {
    margin-top: 24rpx;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.6);
}

.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 48rpx;
    text-align: center;
}

.error-icon {
    width: 96rpx;
    height: 96rpx;
    margin-bottom: 32rpx;
}

.error-title {
    font-size: 36rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16rpx;
}

.error-message {
    font-size: 28rpx;
    color: $text-secondary;
    margin-bottom: 48rpx;
    line-height: 1.6;
}

.error-actions {
    display: flex;
    gap: 24rpx;
}

.retry-btn {
    padding: 24rpx 48rpx;
    background: $primary-color;
    color: #fff;
    border-radius: 48rpx;
    font-size: 28rpx;
    font-weight: 600;

    &:active {
        opacity: 0.8;
    }
}

.back-btn {
    padding: 24rpx 48rpx;
    background: #f5f5f5;
    color: $text-secondary;
    border-radius: 48rpx;
    font-size: 28rpx;

    &:active {
        background: #eee;
    }
}

.result-content {
    padding: 40rpx;
}

.result-header {
    text-align: center;
    margin-bottom: 48rpx;
    padding: 0 32rpx;
}

.score-wrapper {
    position: relative;
    width: 240rpx;
    height: 240rpx;
    margin: 0 auto 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.score-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.2);
    animation: ringPulse 3s ease-in-out infinite;

    &::before {
        content: '';
        position: absolute;
        top: -4rpx;
        left: -4rpx;
        right: -4rpx;
        bottom: -4rpx;
        border-radius: 50%;
        border: 2rpx solid transparent;
        border-top-color: rgba(255, 255, 255, 0.6);
        animation: spin 4s linear infinite;
    }
}

@keyframes ringPulse {
    0%,
    100% {
        transform: scale(1);
        opacity: 0.6;
    }
    50% {
        transform: scale(1.05);
        opacity: 1;
    }
}

.score-circle {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    background: linear-gradient(145deg, #ffffff 0%, #f8f6ff 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow:
        0 8rpx 32rpx rgba(107, 78, 255, 0.25),
        inset 0 2rpx 8rpx rgba(255, 255, 255, 0.8);
    position: relative;
    z-index: 1;
}

.score-number {
    font-size: 72rpx;
    font-weight: 800;
    color: $primary-color;
    line-height: 1;
    background: linear-gradient(180deg, #6b4eff 0%, #9b7dff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.score-unit {
    font-size: 24rpx;
    color: $primary-color;
    opacity: 0.7;
    margin-top: 4rpx;
}

.score-label {
    font-size: 30rpx;
    color: #fff;
    font-weight: 500;
    letter-spacing: 4rpx;
}

.score-reason-card {
    display: flex;
    align-items: flex-start;
    margin-top: 24rpx;
    padding: 20rpx 28rpx;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);
    border-radius: 24rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    text-align: left;
}

.reason-icon {
    flex-shrink: 0;
    width: 28rpx;
    height: 28rpx;
    margin-top: 6rpx;
    margin-right: 12rpx;
    filter: brightness(0) invert(1);
}

.score-reason {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.95);
    line-height: 1.6;
    flex: 1;
}

.card {
    background: #fff;
    border-radius: 32rpx;
    padding: 48rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    margin-bottom: 32rpx;
}

.analysis-title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 24rpx;
}

.analysis-text {
    font-size: 30rpx;
    color: $text-secondary;
    line-height: 1.8;
}

.fortune-tips-card,
.result-task-card {
    margin: 32rpx 0;
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 28rpx;
}

.section-caption {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    margin-bottom: 24rpx;
}
.fortune-tips-grid {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}
.fortune-tip {
    display: flex;
    gap: 20rpx;
    font-size: 28rpx;
    line-height: 1.7;
    color: $text-secondary;
}
.fortune-tip-label {
    color: $primary-color;
    white-space: nowrap;
}
.result-task-content {
    display: block;
    font-size: 30rpx;
    line-height: 1.8;
}
.result-task-reward {
    display: block;
    margin-top: 18rpx;
    font-size: 24rpx;
    color: $primary-color;
}
.result-disclaimer {
    display: block;
    margin: 36rpx 0;
    color: $text-placeholder;
    font-size: 23rpx;
    line-height: 1.7;
    text-align: center;
}
.dark-mode .fortune-tips-card,
.dark-mode .result-task-card {
    background: $dark-bg-card;
    color: $dark-text-primary;
}
.dark-mode .fortune-tip {
    color: $dark-text-secondary;
}

.reading-section {
    margin: 36rpx 0;
    padding: 32rpx;
    border-radius: 28rpx;
    background: rgba(255, 255, 255, 0.92);
}

.reading-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.reading-section-title {
    font-size: 32rpx;
    font-weight: 600;
}

.reading-section-link {
    color: $primary-color;
    font-size: 24rpx;
}

.reading-section :deep(.book-card:first-of-type) {
    padding-top: 24rpx;
}

.reading-status,
.reading-retry {
    display: block;
    padding: 20rpx 0;
    font-size: 24rpx;
    line-height: 1.7;
    color: #747871;
}

.reading-retry {
    margin: 0;
    text-align: left;
    background: transparent;
    color: #61796a;
}

.reading-retry::after {
    border: 0;
}

.dark-mode .reading-section {
    background: $dark-bg-card;
}

.reanalyze-section {
    margin-top: 48rpx;
    text-align: center;
}

.reanalyze-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 48rpx;
    background: transparent;
    border: 2rpx solid rgba(107, 78, 255, 0.3);
    color: $primary-color;
    border-radius: 48rpx;
    font-size: 28rpx;
    transition: all 0.3s ease;

    &:active:not(.disabled) {
        background: rgba(107, 78, 255, 0.1);
    }

    &.disabled {
        opacity: 0.5;
        pointer-events: none;
    }
}

.reanalyze-hint {
    display: block;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: $text-placeholder;
}

.dark-mode {
    .reanalyze-btn {
        border-color: rgba(139, 110, 255, 0.3);
        color: $dark-primary-color;

        &:active:not(.disabled) {
            background: rgba(139, 110, 255, 0.1);
        }
    }

    .reanalyze-hint {
        color: $dark-text-placeholder;
    }
}
</style>
