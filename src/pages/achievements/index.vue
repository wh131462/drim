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
            <text class="header-subtitle">已解锁 {{ unlockedCount }} / {{ achievements.length }} 个成就</text>
        </view>

        <!-- 等级进度 -->
        <view class="progress-section">
            <view class="progress-header">
                <text class="level-text">当前等级：Lv.{{ currentLevel }} {{ levelTitle }}</text>
                <text class="exp-text">{{ currentExp }}/{{ nextLevelExp }} EXP</text>
            </view>
            <view class="progress-bar">
                <view
                    class="progress-fill"
                    :style="{ width: progressPercent + '%' }"
                ></view>
            </view>
        </view>

        <!-- 成就网格 -->
        <view class="achievements-grid">
            <view
                v-for="achievement in achievements"
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
            v-if="loading"
            class="loading-wrapper"
        >
            <text class="loading-text">加载中...</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores';
import { achievementApi } from '@/api';
import type { Achievement } from '@/types/achievement';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const navBarHeight = ref(0);
const loading = ref(false);

// 成就数据
const achievements = ref<Achievement[]>([]);

// 等级数据
const currentLevel = ref(1);
const levelTitle = ref('梦境新手');
const currentExp = ref(0);
const nextLevelExp = ref(100);

// 计算属性
const unlockedCount = computed(() => {
    return achievements.value.filter((a) => a.unlocked).length;
});

const progressPercent = computed(() => {
    if (nextLevelExp.value === 0) return 0;
    return Math.round((currentExp.value / nextLevelExp.value) * 100);
});

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

// 加载成就数据
async function loadAchievements() {
    try {
        loading.value = true;
        const data = await achievementApi.getAchievementsWithProgress();

        // 更新成就列表
        achievements.value = data.achievements;

        // 更新等级信息
        currentLevel.value = data.level;
        levelTitle.value = data.levelTitle;
        currentExp.value = data.currentExp;
        nextLevelExp.value = data.nextLevelExp;
    } catch (error: any) {
        console.error('加载成就数据失败:', error);
        uni.showToast({
            title: error.message || '加载失败',
            icon: 'none'
        });
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44; // 状态栏高度 + 导航栏内容高度

    // 加载成就数据
    await loadAchievements();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.achievements-page {
    min-height: 100vh;
    background: $bg-page;
    padding-bottom: 40rpx;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .header-title {
            color: $dark-text-primary;
        }

        .header-subtitle {
            color: $dark-text-secondary;
        }

        .progress-section {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .level-text {
            color: $dark-text-primary;
        }

        .exp-text {
            color: $dark-primary-color;
        }

        .progress-bar {
            background: #2a2a2a;
        }

        .progress-fill {
            background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
        }

        .achievement-item {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;

            &.unlocked {
                background: linear-gradient(180deg, $dark-bg-card 0%, $dark-primary-light 100%);
                border-color: rgba(139, 110, 255, 0.3);
            }
        }

        .achievement-name {
            color: $dark-text-primary;
        }

        .achievement-date {
            color: $dark-text-placeholder;
        }
    }
}

// 标题区域
.header-section {
    padding: 40rpx 40rpx 0;
    padding-top: calc(v-bind('navBarHeight') * 2rpx + 40rpx);
}

.header-title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
}

.header-subtitle {
    font-size: 28rpx;
    color: $text-secondary;
}

// 等级进度
.progress-section {
    background: #fff;
    margin: 32rpx 40rpx;
    padding: 40rpx;
    border-radius: 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.level-text {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
}

.exp-text {
    font-size: 24rpx;
    color: $primary-color;
}

.progress-bar {
    height: 16rpx;
    background: #edf2f7;
    border-radius: 8rpx;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: $primary-gradient;
    border-radius: 8rpx;
    transition: width 0.3s ease;
}

// 成就网格
.achievements-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;
    padding: 0 40rpx;
}

.achievement-item {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx 16rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    filter: grayscale(1);
    transition: all 0.3s;

    &.unlocked {
        opacity: 1;
        filter: grayscale(0);
        background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
        border: 2rpx solid #e0d9ff;
    }
}

.achievement-icon {
    font-size: 64rpx;
    margin-bottom: 16rpx;
    display: block;
}

.achievement-name {
    font-size: 24rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8rpx;
}

.achievement-date {
    font-size: 20rpx;
    color: $text-placeholder;
}

.achievement-progress {
    margin-top: 8rpx;
    padding: 4rpx 12rpx;
    background: rgba(107, 78, 255, 0.1);
    border-radius: 12rpx;
}

.progress-text {
    font-size: 18rpx;
    color: $primary-color;
    font-weight: 600;
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
