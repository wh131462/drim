<template>
    <view
        class="page home-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- Hero Section -->
        <view class="hero-section">
            <view class="moon-bg"></view>

            <!-- 连续记梦徽章 -->
            <view
                class="streak-badge"
                v-if="userStore.consecutiveDays > 0"
            >
                <image
                    class="streak-icon"
                    src="/static/icons/fire.svg"
                    mode="aspectFit"
                />
                <text>连续记梦 {{ userStore.consecutiveDays }} 天</text>
            </view>

            <!-- 欢迎语 -->
            <view class="welcome-text">{{ greeting }}，{{ userStore?.nickname }}</view>
            <view class="welcome-desc">{{ welcomeDesc }}</view>

            <!-- 记梦大按钮 -->
            <view class="record-btn-container">
                <view
                    class="record-btn-large"
                    @tap="goToRecord"
                >
                    <view class="record-btn-pulse"></view>
                    <image
                        class="record-icon"
                        src="/static/icons/edit.svg"
                        mode="aspectFit"
                    />
                    <text class="record-btn-text">记梦</text>
                </view>
            </view>
        </view>

        <!-- 梦境回顾卡片 -->
        <view
            class="card review-card"
            v-if="latestDream"
            @tap="goToDreamDetail(latestDream.id)"
        >
            <view class="review-header">
                <view class="review-title">
                    <image
                        class="review-icon"
                        src="/static/icons/info.svg"
                        mode="aspectFit"
                    />
                    <text>{{ reviewTitle }}</text>
                </view>
                <text class="review-date">{{ formatDreamDate(latestDream.createdAt) }}</text>
            </view>
            <view class="review-content">
                <text>"{{ latestDream.content }}"</text>
            </view>
            <view class="review-footer">
                <view class="review-tags">
                    <text
                        class="tag"
                        v-for="(tag, index) in latestDreamTags"
                        :key="index"
                        >{{ tag }}</text
                    >
                </view>
                <view class="review-action">
                    <text>查看详情</text>
                </view>
            </view>
        </view>

        <!-- 今日改运任务 -->
        <view
            class="task-card"
            v-if="currentTask"
        >
            <!-- 装饰元素 -->
            <view class="task-decor task-decor-1"></view>
            <view class="task-decor task-decor-2"></view>
            <view class="task-decor task-decor-3"></view>

            <view class="task-header">
                <view class="task-header-left">
                    <text class="task-label">✨ 今日小任务</text>
                </view>
                <view class="task-reward-badge">
                    <text class="reward-icon">🍀</text>
                    <text class="reward-value">+{{ currentTask.rewardPoints }}</text>
                </view>
            </view>

            <view class="task-main">
                <view class="task-icon-wrapper">
                    <text class="task-emoji">{{ getTaskEmoji(currentTask.type) }}</text>
                    <view class="task-icon-ring"></view>
                </view>
                <view class="task-info">
                    <text class="task-name">{{ currentTask.content }}</text>
                    <text class="task-hint">完成后好运+1 💫</text>
                </view>
            </view>

            <view class="task-action">
                <view
                    class="task-btn-fancy"
                    :class="{ completed: currentTask.status === 'completed' }"
                    @tap="currentTask.status === 'pending' && completeTask()"
                >
                    <text class="btn-text">{{ currentTask.status === 'completed' ? '🎉 已完成' : '打卡领取' }}</text>
                    <view
                        class="btn-shine"
                        v-if="currentTask.status === 'pending'"
                    ></view>
                </view>
            </view>
        </view>

        <!-- 自定义 TabBar -->
        <custom-tab-bar :selected="0" />

        <!-- 用户资料填写弹窗 -->
        <user-profile-modal
            v-model:visible="showProfileModal"
            :allow-skip="true"
            :initial-nickname="userStore.nickname === '梦游者' ? '' : userStore.nickname"
            :initial-avatar="userStore.avatar || ''"
            @complete="onProfileComplete"
            @skip="onProfileSkip"
        />
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useUserStore, useDreamStore } from '@/stores';
import { getFriendlyDate, isToday, isYesterday } from '@/utils/date';
import { taskApi } from '@/api';
import type { Task } from '@/api/modules/task';
import CustomTabBar from '@/custom-tab-bar/index.vue';
import UserProfileModal from '@/components/UserProfileModal/index.vue';

const userStore = useUserStore();
const dreamStore = useDreamStore();
const statusBarHeight = ref(0);

// 当前任务
const currentTask = ref<Task | null>(null);
const taskCompleted = ref(false);

// 资料填写弹窗
const showProfileModal = ref(false);

// 欢迎语随机索引
const welcomeIndex = ref(0);

// 欢迎语配置
const welcomeMessages: Record<string, string[]> = {
    morning: ['昨晚做了什么有趣的梦？', '梦里去了哪里冒险？', '还记得昨晚的梦吗？', '昨晚梦见谁了？'],
    noon: ['午休来记录下昨晚的梦吧', '趁记忆还在，写下来吧', '别让梦境溜走了'],
    afternoon: ['今天有没有白日梦？', '快记录下来，别让梦溜走', '梦境里发生了什么故事？'],
    evening: ['今晚会梦见什么呢？', '期待今晚的梦境', '今天想聊聊昨晚的梦吗？'],
    night: ['祝你好梦 ✨', '愿今夜星河入梦', '晚安，做个好梦']
};

// 计算属性
const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早安';
    if (hour >= 12 && hour < 14) return '午安';
    if (hour >= 14 && hour < 18) return '下午好';
    if (hour >= 18 && hour < 22) return '晚上好';
    return '夜深了';
});

// 获取当前时段
function getTimePeriod(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
}

// 欢迎描述语
const welcomeDesc = computed(() => {
    const period = getTimePeriod();
    const messages = welcomeMessages[period];
    return messages[welcomeIndex.value % messages.length];
});

// 刷新欢迎语
function refreshWelcome() {
    const period = getTimePeriod();
    const messages = welcomeMessages[period];
    welcomeIndex.value = Math.floor(Math.random() * messages.length);
}

const latestDream = computed(() => dreamStore.latestDream);
const latestDreamTags = computed(() => {
    if (!latestDream.value) return [];
    return latestDream.value.tags?.slice(0, 2) || ['飞行', '自然'];
});

// 根据梦境日期生成动态标题
const reviewTitle = computed(() => {
    if (!latestDream.value) return '';
    const date = latestDream.value.createdAt;
    if (isToday(date)) {
        return '今日梦境';
    }
    if (isYesterday(date)) {
        return '昨日解析回顾';
    }
    return `${getFriendlyDate(date)} 解析回顾`;
});

// 方法
function formatDreamDate(date: string) {
    return getFriendlyDate(date);
}

function goToRecord() {
    uni.switchTab({ url: '/pages/record/index' });
}

function goToDreamDetail(dreamId: string) {
    uni.navigateTo({ url: `/pages/dream-detail/index?id=${dreamId}` });
}

function getTaskEmoji(taskType: string): string {
    const emojiMap: Record<string, string> = {
        meditation: '🧘',
        exercise: '🏃',
        reading: '📚',
        gratitude: '🙏',
        nature: '🌳',
        music: '🎵',
        art: '🎨',
        social: '👥'
    };
    return emojiMap[taskType] || '✨';
}

async function loadTodayTask() {
    try {
        const response = await taskApi.getTodayTask();
        if (response.task && response.task.status !== 'expired') {
            currentTask.value = response.task;
            taskCompleted.value = response.completed;
        }
    } catch (error: any) {
        console.error('加载今日任务失败:', error);
    }
}

async function completeTask() {
    if (!currentTask.value) return;

    try {
        uni.showLoading({ title: '提交中...' });
        const response = await taskApi.completeTask(currentTask.value.id);
        uni.hideLoading();

        if (response.success) {
            taskCompleted.value = true;
            currentTask.value.status = 'completed';

            // 更新用户积分
            userStore.userInfo!.luckyPoints = response.totalPoints;

            uni.showToast({
                title: `打卡成功！获得${response.points}幸运值`,
                icon: 'success',
                duration: 2000
            });
        }
    } catch (error: any) {
        uni.hideLoading();
        console.error('完成任务失败:', error);
        uni.showToast({
            title: error.message || '打卡失败',
            icon: 'none'
        });
    }
}

// 加载页面数据
async function loadPageData() {
    if (!userStore.isLoggedIn) return;

    await Promise.all([dreamStore.fetchList(true), loadTodayTask()]);
}

// 资料填写完成
function onProfileComplete() {
    // 刷新页面数据
    loadPageData();
}

// 跳过资料填写
function onProfileSkip() {
    // 不做特殊处理，允许用户稍后设置
}

// 分享给好友
onShareAppMessage(() => ({
    title: '梦见 - 记录梦境，解析运势',
    path: '/pages/index/index'
}));

// 分享到朋友圈
onShareTimeline(() => ({
    title: '梦见 - 记录梦境，解析运势'
}));

// 生命周期
onMounted(() => {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;
});

onShow(async () => {
    // 刷新欢迎语
    refreshWelcome();

    // 每次页面显示时检查登录状态
    if (!userStore.isLoggedIn) {
        try {
            const needsSetup = await userStore.login();
            // 登录成功后，如果需要完善资料则弹出填写弹窗
            if (needsSetup) {
                showProfileModal.value = true;
            }
        } catch (error) {
            console.error('自动登录失败:', error);
            return;
        }
    } else if (userStore.needsProfileSetup) {
        // 已登录但资料不完整，提示完善
        showProfileModal.value = true;
    }

    // 已登录，加载数据
    await loadPageData();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.home-page {
    min-height: 100vh;
    background: #ffffff;
    padding-bottom: 140rpx;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .hero-section {
            background: radial-gradient(circle at 50% -20%, rgba(139, 110, 255, 0.15) 0%, $dark-bg-page 60%);
        }

        .moon-bg {
            background: radial-gradient(circle, rgba(139, 110, 255, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
        }

        .streak-badge {
            background: $dark-bg-card;
            box-shadow: 0 8rpx 24rpx rgba(139, 110, 255, 0.2);
        }

        .streak-icon {
            // 暗黑模式下转换为浅紫色 (#8B6EFF)
            filter: brightness(0) saturate(100%) invert(58%) sepia(61%) saturate(4261%) hue-rotate(228deg)
                brightness(101%) contrast(101%);
        }

        .welcome-text {
            color: $dark-text-primary;
        }

        .welcome-desc {
            color: $dark-text-secondary;
        }

        .record-btn-large {
            background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
            box-shadow: 0 20rpx 50rpx -10rpx rgba(139, 110, 255, 0.4);

            &:active {
                box-shadow: 0 8rpx 20rpx rgba(139, 110, 255, 0.3);
            }
        }

        .card {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .task-card {
            background: linear-gradient(135deg, rgba(255, 183, 77, 0.1) 0%, rgba(255, 138, 101, 0.08) 100%);
            box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
        }

        .task-decor-1 {
            background: rgba(255, 183, 77, 0.08);
        }

        .task-decor-2 {
            background: rgba(255, 138, 101, 0.06);
        }

        .task-decor-3 {
            background: rgba(129, 199, 132, 0.08);
        }

        .task-label {
            color: #ffb74d;
        }

        .task-name {
            color: $dark-text-primary;
        }

        .task-hint {
            color: $dark-text-secondary;
        }

        .task-icon-wrapper {
            background: rgba(255, 255, 255, 0.1);
        }

        .task-icon-ring {
            border-color: rgba(255, 183, 77, 0.3);
        }

        .task-btn-fancy {
            background: linear-gradient(135deg, rgba(255, 183, 77, 0.9) 0%, rgba(255, 138, 101, 0.9) 100%);

            &.completed {
                background: linear-gradient(135deg, rgba(165, 214, 167, 0.9) 0%, rgba(129, 199, 132, 0.9) 100%);
            }
        }
    }
}

// Hero Section
.hero-section {
    padding: 48rpx 48rpx 80rpx;
    // 顶部 padding = 状态栏高度 + 负边距补偿 + 原始间距
    padding-top: calc(v-bind('statusBarHeight') * 2rpx + v-bind('statusBarHeight') * 2rpx + 120rpx);
    padding-top: calc(constant(safe-area-inset-top) + v-bind('statusBarHeight') * 2rpx + 120rpx);
    padding-top: calc(env(safe-area-inset-top) + v-bind('statusBarHeight') * 2rpx + 120rpx);
    text-align: center;
    background: radial-gradient(circle at 50% -20%, #f3efff 0%, #ffffff 60%);
    position: relative;
    overflow: hidden;
    margin-top: calc(-1 * v-bind('statusBarHeight') * 2rpx);

    // 确保背景延伸到顶部
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: calc(v-bind('statusBarHeight') * 2rpx);
        background: inherit;
        z-index: -1;
    }
}

.moon-bg {
    position: absolute;
    top: -120rpx;
    right: -80rpx;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba(107, 78, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
    z-index: 0;
}

// 连续记梦徽章
.streak-badge {
    display: inline-flex;
    align-items: center;
    background: #fff;
    color: $primary-color;
    padding: 12rpx 28rpx;
    border-radius: 40rpx;
    font-size: $font-size-sm;
    margin-bottom: 48rpx;
    box-shadow: 0 8rpx 24rpx rgba(107, 78, 255, 0.1);
    font-weight: 600;
    position: relative;
    z-index: 1;
    animation: float 4s ease-in-out infinite;
}

.streak-icon {
    width: 28rpx;
    height: 28rpx;
    margin-right: 8rpx;
    // 将黑色 SVG 转换为紫色 (#6B4EFF)
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
}

@keyframes float {
    0% {
        transform: translateY(0rpx);
    }
    50% {
        transform: translateY(-20rpx);
    }
    100% {
        transform: translateY(0rpx);
    }
}

// 欢迎语
.welcome-text {
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 2rpx;
    position: relative;
    z-index: 1;
}

.welcome-desc {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: 16rpx;
    position: relative;
    z-index: 1;
}

// 记梦大按钮
.record-btn-container {
    margin: 80rpx 0;
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 1;
}

.record-btn-large {
    width: 260rpx;
    height: 260rpx;
    border-radius: 50%;
    background: $primary-gradient;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-primary;
    position: relative;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:active {
        transform: scale(0.92);
        box-shadow: 0 8rpx 20rpx rgba(107, 78, 255, 0.3);
    }
}

.record-btn-pulse {
    position: absolute;
    top: -20rpx;
    left: -20rpx;
    right: -20rpx;
    bottom: -20rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(107, 78, 255, 0.1);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        opacity: 0.5;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.2;
    }
    100% {
        transform: scale(0.95);
        opacity: 0.5;
    }
}

.record-icon {
    width: 80rpx;
    height: 80rpx;
    margin-bottom: 16rpx;
    // 将黑色 SVG 转换为白色
    filter: brightness(0) invert(1);
}

.record-btn-text {
    font-weight: 600;
    font-size: 32rpx;
}

// 卡片通用样式
.card {
    background: #fff;
    border-radius: 40rpx;
    padding: 48rpx;
    margin: 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    transition:
        transform 0.2s,
        box-shadow 0.2s;

    &:active {
        transform: scale(0.99);
    }
}

// 梦境回顾卡片
.review-card {
    background: $primary-gradient;
    color: #fff;
    position: relative;
    overflow: hidden;
    margin-bottom: 48rpx;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 300rpx;
        height: 100%;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 100%);
        pointer-events: none;
    }
}

.review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.review-title {
    display: flex;
    align-items: center;
    font-size: $font-size-lg;
    font-weight: 700;
}

.review-icon {
    width: 36rpx;
    height: 36rpx;
    margin-right: 8rpx;
    // 将黑色 SVG 转换为白色
    filter: brightness(0) invert(1);
}

.review-date {
    font-size: $font-size-xs;
    opacity: 0.8;
}

.review-content {
    font-size: $font-size-sm;
    margin-bottom: 32rpx;
    opacity: 0.95;
    line-height: 1.6;
    font-weight: 500;
}

.review-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.review-tags {
    display: flex;
}

.tag {
    background: rgba(255, 255, 255, 0.25);
    padding: 8rpx 20rpx;
    border-radius: 12rpx;
    font-size: 22rpx;
    margin-right: 12rpx;
    backdrop-filter: blur(4px);
    font-weight: 500;
}

.review-action {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 12rpx 28rpx;
    border-radius: 40rpx;
    font-size: 22rpx;
    backdrop-filter: blur(4px);
}

// 今日改运任务卡片 - 趣味设计
.task-card {
    background: linear-gradient(135deg, #fff8e7 0%, #ffefdb 50%, #fff5e6 100%);
    border-radius: 40rpx;
    padding: 40rpx;
    margin: 32rpx;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8rpx 32rpx rgba(255, 183, 77, 0.15);
}

// 装饰元素
.task-decor {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
}

.task-decor-1 {
    width: 120rpx;
    height: 120rpx;
    background: rgba(255, 183, 77, 0.15);
    top: -30rpx;
    right: 60rpx;
    animation: float-slow 6s ease-in-out infinite;
}

.task-decor-2 {
    width: 80rpx;
    height: 80rpx;
    background: rgba(255, 138, 101, 0.12);
    top: 40rpx;
    right: -20rpx;
    animation: float-slow 5s ease-in-out infinite reverse;
}

.task-decor-3 {
    width: 60rpx;
    height: 60rpx;
    background: rgba(129, 199, 132, 0.15);
    bottom: 20rpx;
    left: -15rpx;
    animation: float-slow 7s ease-in-out infinite;
}

@keyframes float-slow {
    0%,
    100% {
        transform: translateY(0) scale(1);
    }
    50% {
        transform: translateY(-15rpx) scale(1.05);
    }
}

.task-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28rpx;
    position: relative;
    z-index: 1;
}

.task-header-left {
    display: flex;
    align-items: center;
}

.task-label {
    font-size: $font-size-base;
    font-weight: 600;
    color: #e65100;
    letter-spacing: 1rpx;
}

.task-reward-badge {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
    padding: 8rpx 20rpx;
    border-radius: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(102, 187, 106, 0.3);
}

.reward-icon {
    font-size: 28rpx;
    margin-right: 6rpx;
}

.reward-value {
    font-size: $font-size-sm;
    font-weight: 700;
    color: #fff;
}

.task-main {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
    position: relative;
    z-index: 1;
}

.task-icon-wrapper {
    width: 100rpx;
    height: 100rpx;
    background: #fff;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.06);
}

.task-icon-ring {
    position: absolute;
    top: -8rpx;
    left: -8rpx;
    right: -8rpx;
    bottom: -8rpx;
    border: 3rpx dashed rgba(255, 183, 77, 0.5);
    border-radius: 34rpx;
    animation: rotate-slow 20s linear infinite;
}

@keyframes rotate-slow {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.task-emoji {
    font-size: 52rpx;
}

.task-info {
    flex: 1;
    margin-left: 28rpx;
}

.task-name {
    display: block;
    font-size: $font-size-base;
    font-weight: 600;
    color: #5d4037;
    margin-bottom: 8rpx;
    line-height: 1.4;
}

.task-hint {
    font-size: $font-size-xs;
    color: #8d6e63;
}

.task-action {
    position: relative;
    z-index: 1;
}

.task-btn-fancy {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #ffb74d 0%, #ff8a65 100%);
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8rpx 24rpx rgba(255, 138, 101, 0.35);
    transition: all 0.3s ease;

    &:active {
        transform: scale(0.97);
        box-shadow: 0 4rpx 12rpx rgba(255, 138, 101, 0.3);
    }

    &.completed {
        background: linear-gradient(135deg, #a5d6a7 0%, #81c784 100%);
        box-shadow: 0 8rpx 24rpx rgba(129, 199, 132, 0.35);
    }
}

.btn-text {
    font-size: $font-size-base;
    font-weight: 700;
    color: #fff;
    letter-spacing: 2rpx;
}

.btn-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 2.5s infinite;
}

@keyframes shine {
    0% {
        left: -100%;
    }
    50%,
    100% {
        left: 150%;
    }
}
</style>
