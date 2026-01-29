<template>
    <view
        class="page achievements-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="我的成就" />

        <!-- 标题区域 -->
        <view class="header-section">
            <text class="header-title">成就概览</text>
            <text class="header-subtitle"
                >已解锁 {{ achievementStore.unlockedCount }} / {{ achievementStore.totalCount }} 个成就</text
            >
        </view>

        <!-- 等级进度 -->
        <view class="progress-section">
            <view class="progress-header">
                <text class="level-text"
                    >当前等级：Lv.{{ achievementStore.level }} {{ achievementStore.levelTitle }}</text
                >
                <text class="exp-text">{{ achievementStore.currentExp }}/{{ achievementStore.nextLevelExp }} EXP</text>
            </view>
            <view class="progress-bar">
                <view
                    class="progress-fill"
                    :style="{ width: achievementStore.progressPercent + '%' }"
                ></view>
            </view>
        </view>

        <!-- 成就网格 -->
        <view class="achievements-grid">
            <view
                v-for="achievement in achievementStore.achievements"
                :key="achievement.id"
                class="achievement-item"
                :class="{ unlocked: achievement.unlocked }"
            >
                <text class="achievement-icon">{{ achievement.icon }}</text>
                <text class="achievement-name">{{ achievement.name }}</text>
                <text class="achievement-date">{{ formatUnlockDate(achievement) }}</text>
                <view
                    v-if="!achievement.unlocked && achievement.progressPercent !== undefined"
                    class="achievement-progress"
                >
                    <text class="progress-text">{{ achievement.progressPercent }}%</text>
                </view>
            </view>
        </view>

        <!-- 加载中 -->
        <view
            v-if="achievementStore.loading"
            class="loading-wrapper"
        >
            <text class="loading-text">加载中...</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore, useAchievementStore } from '@/stores';
import type { Achievement } from '@/types/achievement';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const achievementStore = useAchievementStore();
const navBarHeight = ref(0);

// 格式化解锁日期
function formatUnlockDate(achievement: Achievement): string {
    if (!achievement.unlocked) {
        return '未解锁';
    }
    if (!achievement.unlockedAt) {
        return '已解锁';
    }
    const date = new Date(achievement.unlockedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

onMounted(async () => {
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44;

    // 从 store 加载（首页已预加载，这里直接使用缓存）
    await achievementStore.ensureAchievements();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.achievements-page {
    min-height: 100vh;
    background: $bg-page;
    padding-bottom: 60rpx;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .header-title {
            color: $dark-text-primary;
        }

        .header-subtitle {
            color: rgba($dark-text-primary, 0.6);
        }

        .progress-section {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-base;
        }

        .level-text {
            color: $dark-text-primary;
        }

        .exp-text {
            color: $dark-primary-color;
            background: rgba($dark-primary-color, 0.1);
        }

        .progress-bar {
            background: rgba(255, 255, 255, 0.1);
        }

        .progress-fill {
            background: linear-gradient(90deg, $dark-primary-color 0%, #9f7aea 100%);
            box-shadow: 0 0 10rpx rgba($dark-primary-color, 0.4);
        }

        .achievement-item {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;

            &.unlocked {
                background: linear-gradient(180deg, rgba($dark-bg-card, 0.8) 0%, rgba($dark-primary-color, 0.15) 100%);
                border-color: rgba($dark-primary-color, 0.4);
                box-shadow: 0 4rpx 20rpx rgba($dark-primary-color, 0.15);

                .achievement-icon {
                    text-shadow: 0 0 20rpx rgba($dark-primary-color, 0.3);
                }
            }
        }

        .achievement-name {
            color: $dark-text-primary;
        }

        .achievement-date {
            color: $dark-text-placeholder;
        }

        .achievement-progress {
            background: rgba($dark-primary-color, 0.2);
        }
    }
}

// 标题区域
.header-section {
    padding: 20rpx 40rpx 0;
    padding-top: calc(v-bind('navBarHeight') * 2rpx + 20rpx);
    margin-bottom: 40rpx;
}

.header-title {
    display: block;
    font-size: 48rpx;
    font-weight: 800;
    color: $text-primary;
    margin-bottom: 12rpx;
    letter-spacing: -1rpx;
}

.header-subtitle {
    font-size: 28rpx;
    color: $text-secondary;
    opacity: 0.8;
}

// 等级进度
.progress-section {
    background: #fff;
    margin: 0 40rpx 48rpx;
    padding: 40rpx;
    border-radius: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28rpx;
}

.level-text {
    font-size: 32rpx;
    font-weight: 800;
    color: $text-primary;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.exp-text {
    font-size: 24rpx;
    font-weight: 600;
    color: $primary-color;
    background: rgba($primary-color, 0.08);
    padding: 6rpx 16rpx;
    border-radius: 100rpx;
}

.progress-bar {
    height: 20rpx;
    background: #f0f2f5;
    border-radius: 100rpx;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary-color 0%, #9f7aea 100%);
    border-radius: 100rpx;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        border-radius: 100rpx;
    }
}

// 成就网格
.achievements-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;
    padding: 0 40rpx;
}

.achievement-item {
    background: #fff;
    border-radius: 28rpx;
    padding: 32rpx 16rpx;
    text-align: center;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    min-height: 220rpx;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border: 2rpx solid transparent;

    // 未解锁状态：更柔和的灰色，不使用 heavy filter
    &:not(.unlocked) {
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.6);

        .achievement-icon {
            filter: grayscale(1) opacity(0.5);
            transform: scale(0.9);
        }

        .achievement-name {
            color: $text-placeholder;
        }
    }

    &.unlocked {
        background: linear-gradient(180deg, #ffffff 0%, #fcfaff 100%);
        border-color: rgba($primary-color, 0.15);
        box-shadow: 0 8rpx 24rpx rgba($primary-color, 0.08);
        transform: translateY(-2rpx);

        .achievement-icon {
            transform: scale(1.05);
            text-shadow: 0 4rpx 12rpx rgba($primary-color, 0.2);
        }
    }

    &:active {
        transform: scale(0.96);
    }
}

.achievement-icon {
    font-size: 48rpx;
    margin-bottom: 16rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    height: 64rpx;
    transition: all 0.3s ease;
}

.achievement-name {
    font-size: 24rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8rpx;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    height: 64rpx; // 强制高度对齐
    display: flex;
    align-items: center;
    justify-content: center;
}

.achievement-date {
    font-size: 20rpx;
    color: $text-placeholder;
    margin-top: auto;
}

.achievement-progress {
    margin-top: auto;
    padding: 4rpx 12rpx;
    background: rgba($primary-color, 0.08);
    border-radius: 12rpx;
}

.progress-text {
    font-size: 20rpx;
    color: $primary-color;
    font-weight: 700;
}

// 加载状态
.loading-wrapper {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 999;
}

.loading-text {
    font-size: 28rpx;
    color: $text-secondary;
}
</style>
