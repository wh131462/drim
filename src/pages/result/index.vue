<template>
    <view
        class="page result-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="梦境解析" />

        <!-- 加载中 -->
        <view
            v-if="loading"
            class="loading-container"
        >
            <view class="loading-animation"></view>
            <text class="loading-text">{{ loadingText }}</text>
        </view>

        <!-- 错误状态 -->
        <view
            v-else-if="error"
            class="error-container"
        >
            <text class="error-icon">😔</text>
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
                :style="{ paddingTop: navBarHeight * 2 + 'rpx' }"
            >
                <!-- 头部区域 -->
                <view class="result-header">
                    <view class="score-circle">
                        <text class="score-number">{{ analysis.fortuneScore }}</text>
                    </view>
                    <text class="score-label">运势评分</text>
                </view>

                <!-- 解析卡片 -->
                <view class="card analysis-card">
                    <text class="analysis-title">{{ analysis.theme }}</text>
                    <text class="analysis-text">{{ analysis.interpretation }}</text>
                </view>
            </view>
        </template>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useDreamStore, useUserStore } from '@/stores';
import { dreamApi, analysisApi } from '@/api';
import type { Dream } from '@/types/dream';
import NavBar from '@/components/NavBar/index.vue';

const dreamStore = useDreamStore();
const userStore = useUserStore();
const loading = ref(true);
const analysis = ref<any>(null);
const error = ref<string | null>(null);
const navBarHeight = ref(0);
const dreamId = ref('');
const loadingText = ref('AI 正在解析你的梦境...');
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollCount = 0;
const MAX_POLL_COUNT = 60; // 最多轮询 60 次，约 60 秒

// 获取URL参数
onLoad((options: any) => {
    dreamId.value = options.dreamId || '';
});

onMounted(async () => {
    const systemInfo = uni.getSystemInfoSync();
    navBarHeight.value = systemInfo.statusBarHeight + 44;

    // 触发解析并轮询结果
    await startAnalysis();
});

onUnmounted(() => {
    // 清理轮询定时器
    if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }
});

// 触发解析
async function startAnalysis() {
    if (!dreamId.value) {
        error.value = '参数错误，请返回重试';
        loading.value = false;
        return;
    }

    try {
        loading.value = true;
        error.value = null;
        pollCount = 0;

        // 1. 请求解析
        loadingText.value = '正在启动 AI 解析...';
        const response = await analysisApi.request({ dreamId: dreamId.value });

        // 如果已经完成，直接获取结果
        if (response.status === 'completed') {
            await loadAnalysisResult(response.analysisId);
            return;
        }

        // 2. 开始轮询
        loadingText.value = 'AI 正在解析你的梦境...';
        pollForResult(response.analysisId);
    } catch (err: any) {
        console.error('触发解析失败:', err);
        error.value = err?.message || '解析请求失败，请稍后重试';
        loading.value = false;
    }
}

// 轮询检查解析结果
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
            } else if (result.status === 'failed') {
                error.value = 'AI 解析失败，请重试';
                loading.value = false;
            } else {
                // 继续轮询，更新提示文字
                if (pollCount > 10) {
                    loadingText.value = '正在深度分析梦境含义...';
                } else if (pollCount > 20) {
                    loadingText.value = '即将完成，请稍候...';
                }
                pollForResult(analysisId);
            }
        } catch (err: any) {
            console.error('获取解析结果失败:', err);
            // 网络错误时继续重试
            if (pollCount < MAX_POLL_COUNT) {
                pollForResult(analysisId);
            } else {
                error.value = err?.message || '获取解析结果失败';
                loading.value = false;
            }
        }
    }, 1000); // 每秒轮询一次
}

// 直接加载解析结果
async function loadAnalysisResult(analysisId: string) {
    try {
        const result = await analysisApi.getById(analysisId);
        analysis.value = result;
    } catch (err: any) {
        console.error('加载解析结果失败:', err);
        error.value = err?.message || '加载失败，请稍后重试';
    } finally {
        loading.value = false;
    }
}

// 重新加载（用于错误后重试）
async function loadAnalysis() {
    await startAnalysis();
}

function goBack() {
    uni.navigateBack({ delta: 1 });
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.result-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #6b4eff 0%, #f5f5f5 50%);
    transition: background 0.3s ease;

    &.dark-mode {
        background: linear-gradient(180deg, $dark-primary-color 0%, $dark-bg-page 50%);

        .score-circle {
            background: $dark-bg-card;
            box-shadow: 0 8rpx 24rpx rgba(139, 110, 255, 0.3);
        }

        .score-number {
            color: $dark-primary-color;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 32rpx;
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
    font-size: 120rpx;
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
}

.score-circle {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(107, 78, 255, 0.3);
}

.score-number {
    font-size: 80rpx;
    font-weight: 800;
    color: $primary-color;
}

.score-label {
    font-size: 28rpx;
    color: #fff;
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
</style>
