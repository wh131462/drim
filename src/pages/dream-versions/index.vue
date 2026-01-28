<template>
    <view
        class="page versions-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar
            title="版本历史"
            show-back
        />

        <!-- 版本统计 -->
        <view class="stats-summary">
            <view class="stats-title">
                <image
                    class="title-icon"
                    src="/static/icons/compare.svg"
                    mode="aspectFit"
                />
                <text>版本统计</text>
            </view>
            <view class="stats-grid">
                <view class="stat-box">
                    <text class="stat-value">{{ totalVersions }}</text>
                    <text class="stat-label">总版本数</text>
                </view>
                <view class="stat-box">
                    <text class="stat-value">{{ originalVersions }}</text>
                    <text class="stat-label">原始版本</text>
                </view>
                <view class="stat-box">
                    <text class="stat-value">{{ polishedVersions }}</text>
                    <text class="stat-label">润色版本</text>
                </view>
            </view>
        </view>

        <!-- 版本时间轴 -->
        <scroll-view
            class="version-timeline"
            scroll-y
        >
            <view
                v-for="(version, index) in versions"
                :key="version.versionId"
                class="timeline-item"
                :class="{ 'is-last': index === versions.length - 1 }"
            >
                <!-- 时间轴点 -->
                <view
                    class="timeline-dot"
                    :class="{
                        current: version.isCurrent,
                        original: version.type === 'original',
                        polished: version.type === 'polished'
                    }"
                >
                    <image
                        v-if="version.isCurrent"
                        class="dot-icon"
                        src="/static/icons/check.svg"
                        mode="aspectFit"
                    />
                    <image
                        v-else-if="version.type === 'polished'"
                        class="dot-icon"
                        src="/static/icons/star.svg"
                        mode="aspectFit"
                    />
                    <image
                        v-else
                        class="dot-icon"
                        src="/static/icons/edit.svg"
                        mode="aspectFit"
                    />
                </view>

                <!-- 版本卡片 -->
                <view
                    class="version-card"
                    :class="{ current: version.isCurrent }"
                >
                    <!-- 版本头部 -->
                    <view class="version-header">
                        <view class="version-type">
                            <view
                                class="type-badge"
                                :class="{ original: version.type === 'original' }"
                            >
                                <template v-if="version.type === 'polished'">
                                    <image
                                        class="badge-icon"
                                        src="/static/icons/star.svg"
                                        mode="aspectFit"
                                    />
                                    <text>AI润色</text>
                                </template>
                                <template v-else>
                                    <image
                                        class="badge-icon"
                                        src="/static/icons/edit.svg"
                                        mode="aspectFit"
                                    />
                                    <text>原始版本</text>
                                </template>
                            </view>
                            <image
                                v-if="version.isCurrent"
                                class="current-star"
                                src="/static/icons/star.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <text class="version-time">{{ formatTime(version.createdAt) }}</text>
                    </view>

                    <!-- 版本内容 -->
                    <text class="version-content">{{ version.content }}</text>

                    <!-- 版本元数据 -->
                    <view class="version-meta">
                        <view class="meta-item">
                            <image
                                class="meta-icon"
                                src="/static/icons/edit.svg"
                                mode="aspectFit"
                            />
                            <text>{{ version.content.length }} 字</text>
                        </view>
                        <view
                            v-if="version.polishedFrom"
                            class="meta-item"
                        >
                            <image
                                class="meta-icon"
                                src="/static/icons/info.svg"
                                mode="aspectFit"
                            />
                            <text>基于版本 #{{ getVersionNumber(version.polishedFrom) }}</text>
                        </view>
                        <view
                            v-if="version.type === 'original' && index === versions.length - 1"
                            class="meta-item"
                        >
                            <image
                                class="meta-icon"
                                src="/static/icons/user.svg"
                                mode="aspectFit"
                            />
                            <text>首次创建</text>
                        </view>
                    </view>

                    <!-- 操作按钮 -->
                    <view class="version-actions">
                        <view
                            class="action-btn"
                            @tap="editVersion(version)"
                        >
                            <image
                                class="btn-icon"
                                src="/static/icons/edit.svg"
                                mode="aspectFit"
                            />
                            <text>编辑</text>
                        </view>
                        <view
                            class="action-btn"
                            @tap="copyVersion(version)"
                        >
                            <image
                                class="btn-icon"
                                src="/static/icons/copy.svg"
                                mode="aspectFit"
                            />
                            <text>复制</text>
                        </view>
                        <view
                            v-if="!version.isCurrent"
                            class="action-btn"
                            @tap="switchVersion(version)"
                        >
                            <image
                                class="btn-icon"
                                src="/static/icons/check.svg"
                                mode="aspectFit"
                            />
                            <text>切换</text>
                        </view>
                        <view
                            v-else
                            class="action-btn primary"
                        >
                            <text>当前版本</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 空状态 -->
            <view
                v-if="versions.length === 0"
                class="empty-state"
            >
                <image
                    class="empty-icon"
                    src="/static/icons/edit.svg"
                    mode="aspectFit"
                />
                <text class="empty-text">暂无版本历史</text>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { versionApi } from '@/api';
import type { DreamVersion } from '@/api/modules/version';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();

// 数据
const versions = ref<DreamVersion[]>([]);
const dreamId = ref('');
const isReady = ref(false);
const navBarHeight = ref(0);

// 计算属性
const totalVersions = computed(() => versions.value.length);
const originalVersions = computed(() => versions.value.filter((v) => v.type === 'original').length);
const polishedVersions = computed(() => versions.value.filter((v) => v.type === 'polished').length);

// 方法
async function loadVersions() {
    try {
        uni.showLoading({ title: '加载中...' });

        const response = await versionApi.getVersions(dreamId.value);
        versions.value = response.versions;

        uni.hideLoading();
    } catch (error: any) {
        uni.hideLoading();
        console.error('加载版本列表失败:', error);
        uni.showToast({
            title: error.message || '加载失败',
            icon: 'none'
        });
    }
}

function editVersion(version: DreamVersion) {
    // 将版本信息存储到本地，供记录页面使用
    uni.setStorageSync('editingVersion', {
        versionId: version.versionId,
        dreamId: version.dreamId,
        content: version.content,
        type: version.type
    });

    // 使用 switchTab 跳转到 tabbar 页面
    uni.switchTab({
        url: '/pages/record/index',
        success: () => {
            // 跳转成功后，记录页面会从 storage 读取编辑信息
            uni.showToast({
                title: '进入编辑模式',
                icon: 'success',
                duration: 1500
            });
        },
        fail: (err) => {
            console.error('跳转失败:', err);
            uni.showToast({
                title: '跳转失败，请重试',
                icon: 'none'
            });
        }
    });
}

function copyVersion(version: DreamVersion) {
    uni.setClipboardData({
        data: version.content,
        success: () => {
            uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
        }
    });
}

async function switchVersion(version: DreamVersion) {
    try {
        uni.showLoading({ title: '切换中...' });

        await versionApi.switchVersion(dreamId.value, version.versionId);

        // 更新当前版本标记
        versions.value.forEach((v) => {
            v.isCurrent = v.versionId === version.versionId;
        });

        uni.hideLoading();
        uni.showToast({ title: '已切换到该版本', icon: 'success' });
    } catch (error: any) {
        uni.hideLoading();
        console.error('切换版本失败:', error);
        uni.showToast({
            title: error.message || '切换失败',
            icon: 'none'
        });
    }
}

function getVersionNumber(versionId: string): number {
    const version = versions.value.find((v) => v.versionId === versionId);
    return version?.versionNumber || 0;
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

onLoad((options) => {
    dreamId.value = options?.dreamId || '';

    if (!dreamId.value) {
        uni.showToast({ title: '参数错误', icon: 'none' });
        setTimeout(() => {
            uni.navigateBack();
        }, 1500);
        return;
    }

    isReady.value = true;
    loadVersions();
});

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44;
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;
@use '@/styles/mixins.scss' as *;

.versions-page {
    min-height: 100vh;
    background: $bg-page;
    padding-top: calc(v-bind('navBarHeight') * 2rpx);
    padding-bottom: 100rpx;
}

// 统计面板
.stats-summary {
    background: #fff;
    border-radius: 32rpx;
    padding: 40rpx;
    margin: 32rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.stats-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.title-icon {
    width: 36rpx;
    height: 36rpx;
    filter: brightness(0) saturate(100%) invert(29%) sepia(98%) saturate(1517%) hue-rotate(239deg) brightness(93%)
        contrast(100%);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;
}

.stat-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.stat-value {
    font-size: 40rpx;
    font-weight: 700;
    color: $primary-color;
}

.stat-label {
    font-size: 24rpx;
    color: $text-secondary;
}

// 版本时间轴
.version-timeline {
    padding: 0 32rpx 80rpx 32rpx;
    height: calc(100vh - 400rpx);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box;
}

.timeline-item {
    position: relative;
    padding-left: 56rpx;
    padding-right: 8rpx;
    padding-bottom: 64rpx;
    min-height: 0;
    box-sizing: border-box;

    &:not(.is-last)::before {
        content: '';
        position: absolute;
        left: 18rpx;
        top: 56rpx;
        bottom: 32rpx;
        width: 3rpx;
        background: linear-gradient(to bottom, #e0d9ff, transparent);
    }

    &:last-child {
        padding-bottom: 32rpx;
    }
}

.timeline-dot {
    position: absolute;
    left: 0;
    top: 8rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    z-index: 1;

    &.current {
        background: $primary-color;
        box-shadow: 0 0 0 6rpx rgba(107, 78, 255, 0.1);

        .dot-icon {
            filter: brightness(0) invert(1);
        }
    }

    &.original {
        background: #10b981;

        .dot-icon {
            filter: brightness(0) invert(1);
        }
    }

    &.polished {
        background: #fff;
        border: 3rpx solid $primary-color;

        .dot-icon {
            filter: brightness(0) saturate(100%) invert(29%) sepia(98%) saturate(1517%) hue-rotate(239deg)
                brightness(93%) contrast(100%);
        }
    }
}

.dot-icon {
    width: 24rpx;
    height: 24rpx;
}

// 版本卡片
.version-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 28rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    border: 4rpx solid transparent;
    transition: all 0.2s;
    min-height: 0;
    height: auto;
    overflow: visible;
    width: calc(100% - 8rpx);
    max-width: 100%;
    box-sizing: border-box;

    &.current {
        border-color: $primary-color;
        box-shadow: 0 8rpx 24rpx rgba(107, 78, 255, 0.15);
    }
}

.version-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.version-type {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.type-badge {
    background: $primary-light;
    color: $primary-color;
    padding: 8rpx 24rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8rpx;

    .badge-icon {
        width: 24rpx;
        height: 24rpx;
        filter: brightness(0) saturate(100%) invert(29%) sepia(98%) saturate(1517%) hue-rotate(239deg) brightness(93%)
            contrast(100%);
    }

    &.original {
        background: #d1fae5;
        color: #10b981;

        .badge-icon {
            filter: brightness(0) saturate(100%) invert(56%) sepia(59%) saturate(482%) hue-rotate(111deg)
                brightness(94%) contrast(94%);
        }
    }
}

.current-star {
    width: 32rpx;
    height: 32rpx;
    filter: brightness(0) saturate(100%) invert(84%) sepia(82%) saturate(2167%) hue-rotate(360deg) brightness(104%)
        contrast(103%);
    transition: filter 0.3s ease;
}

.version-time {
    font-size: 24rpx;
    color: $text-placeholder;
}

.version-content {
    font-size: 28rpx;
    line-height: 1.7;
    color: $text-primary;
    margin-bottom: 24rpx;
    display: block;
    word-wrap: break-word;
    word-break: normal;
    white-space: normal;
    overflow-wrap: anywhere;
    max-width: 100%;
}

.version-meta {
    display: flex;
    align-items: center;
    gap: 32rpx;
    font-size: 24rpx;
    color: $text-secondary;
    margin-bottom: 24rpx;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.meta-icon {
    width: 28rpx;
    height: 28rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.3s ease;
}

// 操作按钮
.version-actions {
    display: flex;
    gap: 16rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f7fafc;
}

.action-btn {
    flex: 1;
    padding: 16rpx;
    border-radius: 16rpx;
    border: 3rpx solid $border-color;
    background: #fff;
    color: $text-primary;
    font-size: 26rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    transition: all 0.2s;

    &:active {
        transform: scale(0.98);
    }

    &.primary {
        background: $primary-color;
        border-color: $primary-color;
        color: #fff;
    }
}

.btn-icon {
    width: 32rpx;
    height: 32rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.3s ease;
}

.action-btn.primary .btn-icon {
    filter: brightness(0) invert(1);
}

// 空状态
.empty-state {
    text-align: center;
    padding: 120rpx 80rpx;
}

.empty-icon {
    width: 128rpx;
    height: 128rpx;
    margin-bottom: 32rpx;
    opacity: 0.3;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
}

.empty-text {
    color: $text-placeholder;
    font-size: 28rpx;
}

// 暗黑模式
.versions-page.dark-mode {
    background: $dark-bg-page;

    .stats-summary {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;
    }

    .stats-title {
        color: $dark-text-primary;

        .title-icon {
            filter: brightness(0) saturate(100%) invert(63%) sepia(74%) saturate(1143%) hue-rotate(216deg)
                brightness(102%) contrast(101%);
        }
    }

    .stat-value {
        color: $dark-primary-color;
    }

    .stat-label {
        color: $dark-text-secondary;
    }

    .version-card {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;

        &.current {
            border-color: $dark-primary-color;
            box-shadow: 0 8rpx 24rpx rgba(139, 110, 255, 0.2);
        }
    }

    .version-content {
        color: $dark-text-primary;
    }

    .version-time {
        color: $dark-text-placeholder;
    }

    .version-meta {
        color: $dark-text-secondary;

        .meta-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);
        }
    }

    .current-star {
        filter: brightness(0) saturate(100%) invert(84%) sepia(82%) saturate(2167%) hue-rotate(360deg) brightness(104%)
            contrast(103%);
    }

    .version-actions {
        border-top-color: rgba(255, 255, 255, 0.1);
    }

    .action-btn {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: $dark-text-primary;

        .btn-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);
        }

        &.primary {
            background: $dark-primary-color;
            border-color: $dark-primary-color;
            color: #fff;

            .btn-icon {
                filter: brightness(0) invert(1);
            }
        }
    }

    .type-badge {
        background: rgba(107, 78, 255, 0.15);
        color: $dark-primary-color;

        .badge-icon {
            filter: brightness(0) saturate(100%) invert(63%) sepia(74%) saturate(1143%) hue-rotate(216deg)
                brightness(102%) contrast(101%);
        }

        &.original {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;

            .badge-icon {
                filter: brightness(0) saturate(100%) invert(76%) sepia(37%) saturate(485%) hue-rotate(99deg)
                    brightness(96%) contrast(91%);
            }
        }
    }

    .timeline-dot {
        &.current {
            background: $dark-primary-color;

            .dot-icon {
                filter: brightness(0) invert(1);
            }
        }

        &.original {
            background: #34d399;

            .dot-icon {
                filter: brightness(0) invert(1);
            }
        }

        &.polished {
            background: $dark-bg-card;
            border-color: $dark-primary-color;

            .dot-icon {
                filter: brightness(0) saturate(100%) invert(63%) sepia(74%) saturate(1143%) hue-rotate(216deg)
                    brightness(102%) contrast(101%);
            }
        }
    }

    .empty-icon {
        filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
            contrast(87%);
    }

    .empty-text {
        color: $dark-text-placeholder;
    }
}
</style>
