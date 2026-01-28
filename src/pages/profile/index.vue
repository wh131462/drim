<template>
    <view
        class="page profile-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 用户头部 -->
        <view class="profile-header">
            <view
                class="avatar"
                @tap="handleAvatarClick"
            >
                <image
                    v-if="userStore.avatar"
                    class="avatar-image"
                    :src="userStore.avatar"
                    mode="aspectFill"
                />
                <image
                    v-else
                    class="avatar-icon"
                    src="/static/icons/user.svg"
                    mode="aspectFit"
                />
                <view class="avatar-edit-hint">
                    <image
                        class="edit-icon"
                        src="/static/icons/edit.svg"
                        mode="aspectFit"
                    />
                </view>
            </view>
            <view class="user-info">
                <view class="user-name-row">
                    <text class="username">{{ userStore.nickname }}</text>
                    <view
                        class="vip-badge"
                        v-if="userStore.isVip"
                    >
                        <image
                            class="vip-icon"
                            src="/static/icons/star.svg"
                            mode="aspectFit"
                        />
                        <text>VIP</text>
                    </view>
                </view>
                <text class="user-id">ID: {{ userStore.userInfo?.id || '未登录' }}</text>
            </view>
        </view>

        <!-- 数据统计 -->
        <view class="stats-grid">
            <view
                class="stat-item"
                @tap="goToDreamList"
            >
                <text class="stat-value">{{ userStore.userInfo?.totalDreams || 0 }}</text>
                <text class="stat-label">记梦总数</text>
            </view>
            <view class="stat-item">
                <text class="stat-value primary">{{ userStore.consecutiveDays || 0 }}</text>
                <text class="stat-label">连续打卡</text>
            </view>
            <view class="stat-item">
                <text class="stat-value gold">{{ userStore.luckyPoints || 0 }}</text>
                <text class="stat-label">幸运值</text>
            </view>
        </view>

        <!-- 梦境日历 -->
        <view class="card calendar-card">
            <view class="card-header">
                <text class="card-title">梦境日历</text>
                <view class="month-nav">
                    <view
                        class="nav-btn"
                        @tap="prevMonth"
                    >
                        <image
                            class="nav-icon prev"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                    <view
                        class="month-badge"
                        @tap="goToCurrentMonth"
                    >
                        {{ currentYear }}年{{ currentMonth }}月
                    </view>
                    <view
                        class="nav-btn"
                        :class="{ disabled: isCurrentMonth }"
                        @tap="nextMonth"
                    >
                        <image
                            class="nav-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
            </view>
            <view class="calendar-grid">
                <!-- 星期头 -->
                <view class="calendar-day weekday">日</view>
                <view class="calendar-day weekday">一</view>
                <view class="calendar-day weekday">二</view>
                <view class="calendar-day weekday">三</view>
                <view class="calendar-day weekday">四</view>
                <view class="calendar-day weekday">五</view>
                <view class="calendar-day weekday">六</view>
                <!-- 日期 -->
                <view
                    v-for="(day, index) in calendarDays"
                    :key="index"
                    class="calendar-day"
                    :class="{
                        empty: !day,
                        active: day && isToday(day),
                        'has-dream': day && hasDream(day),
                        'multi-dream': day && getDreamCount(day) > 1
                    }"
                    @tap="day && handleDayClick(day)"
                >
                    <text v-if="day">{{ day }}</text>
                    <view
                        v-if="day && getDreamCount(day) > 1"
                        class="dream-count-badge"
                        >{{ getDreamCount(day) }}</view
                    >
                </view>
            </view>
            <!-- 月度统计 -->
            <view class="calendar-stats">
                <text class="stats-text"
                    >本月记梦 {{ monthDreamCount }} 天<text v-if="monthDreamTotal > monthDreamCount"
                        >，共 {{ monthDreamTotal }} 个梦</text
                    ></text
                >
                <text
                    v-if="!isCurrentMonth"
                    class="back-today"
                    @tap="goToCurrentMonth"
                >
                    回到今天
                </text>
            </view>
        </view>

        <!-- 菜单列表 -->
        <view class="menu-list">
            <view
                class="menu-item"
                @tap="goToVip"
            >
                <view class="menu-left">
                    <view class="menu-icon-wrapper gold">
                        <image
                            class="menu-icon"
                            src="/static/icons/star.svg"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">会员中心</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.svg"
                    mode="aspectFit"
                />
            </view>
            <view
                class="menu-item"
                @tap="goToAchievements"
            >
                <view class="menu-left">
                    <view class="menu-icon-wrapper cyan">
                        <image
                            class="menu-icon"
                            src="/static/icons/achievement.svg"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">我的成就</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.svg"
                    mode="aspectFit"
                />
            </view>
            <view
                class="menu-item"
                @tap="goToSettings"
            >
                <view class="menu-left">
                    <view class="menu-icon-wrapper gray">
                        <image
                            class="menu-icon"
                            src="/static/icons/settings.svg"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">设置</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.svg"
                    mode="aspectFit"
                />
            </view>
        </view>

        <!-- 自定义 TabBar -->
        <custom-tab-bar :selected="2" />

        <!-- 用户资料编辑弹窗 -->
        <user-profile-modal
            v-model:visible="showProfileModal"
            :allow-skip="true"
            :initial-nickname="userStore.nickname === '梦游者' ? '' : userStore.nickname"
            :initial-avatar="userStore.avatar || ''"
            @complete="onProfileComplete"
        />
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore, useDreamStore } from '@/stores';
import CustomTabBar from '@/custom-tab-bar/index.vue';
import UserProfileModal from '@/components/UserProfileModal/index.vue';
import { onShow } from '@dcloudio/uni-app';

const userStore = useUserStore();
const dreamStore = useDreamStore();
const statusBarHeight = ref(0);

// 资料编辑弹窗
const showProfileModal = ref(false);

// 数据
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const calendarLoading = ref(false);

// 判断是否为当前月份
const isCurrentMonth = computed(() => {
    const now = new Date();
    return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1;
});

// 当月记梦天数
const monthDreamCount = computed(() => {
    return dreamStore.calendar.filter((r) => r.hasDream).length;
});

// 当月梦境总数
const monthDreamTotal = computed(() => {
    return dreamStore.calendar.reduce((sum, r) => sum + (r.dreamCount || 0), 0);
});

// 计算日历数据
const calendarDays = computed(() => {
    const days: (number | null)[] = [];
    const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay();
    const totalDays = new Date(currentYear.value, currentMonth.value, 0).getDate();

    // 填充空白
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // 填充日期
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    return days;
});

// 方法
function isToday(day: number): boolean {
    const today = new Date();
    return (
        today.getFullYear() === currentYear.value &&
        today.getMonth() + 1 === currentMonth.value &&
        today.getDate() === day
    );
}

function hasDream(day: number): boolean {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dreamStore.calendar.some((r) => r.date === dateStr && r.hasDream);
}

function getDreamCount(day: number): number {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = dreamStore.calendar.find((r) => r.date === dateStr);
    return record?.dreamCount || 0;
}

function handleDayClick(day: number) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = dreamStore.calendar.find((r) => r.date === dateStr);

    if (!record?.hasDream) return;

    // 多个梦境时跳转到列表页，按日期筛选
    if (record.dreamCount > 1) {
        uni.navigateTo({
            url: `/pages/dream-list/index?date=${dateStr}`
        });
    } else if (record.dreamId) {
        uni.navigateTo({
            url: `/pages/dream-detail/index?id=${record.dreamId}`
        });
    }
}

function goToDreamList() {
    uni.navigateTo({ url: '/pages/dream-list/index' });
}

function goToVip() {
    uni.navigateTo({ url: '/pages/vip/index' });
}

function goToAchievements() {
    uni.navigateTo({ url: '/pages/achievements/index' });
}

function goToSettings() {
    uni.navigateTo({ url: '/pages/settings/index' });
}

async function loadCalendar() {
    calendarLoading.value = true;
    try {
        await dreamStore.fetchCalendar(currentYear.value, currentMonth.value);
    } finally {
        calendarLoading.value = false;
    }
}

// 上一月
function prevMonth() {
    if (currentMonth.value === 1) {
        currentMonth.value = 12;
        currentYear.value -= 1;
    } else {
        currentMonth.value -= 1;
    }
    loadCalendar();
}

// 下一月
function nextMonth() {
    if (isCurrentMonth.value) return;

    if (currentMonth.value === 12) {
        currentMonth.value = 1;
        currentYear.value += 1;
    } else {
        currentMonth.value += 1;
    }
    loadCalendar();
}

// 回到当前月份
function goToCurrentMonth() {
    const now = new Date();
    if (currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1) {
        return;
    }
    currentYear.value = now.getFullYear();
    currentMonth.value = now.getMonth() + 1;
    loadCalendar();
}

function handleAvatarClick() {
    // 打开资料编辑弹窗
    showProfileModal.value = true;
}

function onProfileComplete() {
    // 资料更新完成，刷新用户信息
    userStore.fetchUserInfo();
}

// 生命周期
onMounted(() => {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;

    loadCalendar();
});

// 页面显示时重新加载数据
onShow(() => {
    // 刷新日历数据
    loadCalendar();
    // 刷新用户信息（包含连续打卡天数等）
    userStore.fetchUserInfo();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.profile-page {
    min-height: 100vh;
    background: $bg-page;
    padding-bottom: 200rpx;
    padding-top: calc(v-bind('statusBarHeight') * 2rpx);
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .profile-header {
            background: $dark-bg-card;

            &::before {
                background: $dark-bg-card;
            }

            &::after {
                background: linear-gradient(
                    90deg,
                    transparent,
                    $dark-border-color 20%,
                    $dark-border-color 80%,
                    transparent
                );
            }
        }

        .avatar {
            background: #2a2a2a;
            border-color: $dark-bg-card;
        }

        .avatar-image {
            opacity: 0.95;
        }

        .avatar-icon {
            // 暗黑模式下转换为浅灰色
            filter: brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%)
                contrast(80%);
        }

        .username {
            color: $dark-text-primary;
        }

        .user-id {
            color: $dark-text-placeholder;
        }

        .stat-item {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .stat-value {
            color: $dark-text-primary;

            &.primary {
                color: $dark-primary-color;
            }
        }

        .stat-label {
            color: $dark-text-secondary;
        }

        .card {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .card-title {
            color: $dark-text-primary;
        }

        .month-badge {
            color: $dark-primary-color;
            background: $dark-primary-light;
        }

        .nav-btn {
            background: $dark-primary-light;

            &:active {
                background: rgba(107, 78, 255, 0.3);
            }
        }

        .nav-icon {
            filter: brightness(0) saturate(100%) invert(55%) sepia(98%) saturate(1352%) hue-rotate(235deg)
                brightness(100%) contrast(93%);
        }

        .calendar-stats {
            border-top-color: $dark-border-color;
        }

        .stats-text {
            color: $dark-text-secondary;
        }

        .back-today {
            color: $dark-primary-color;
        }

        .calendar-day {
            color: $dark-text-secondary;

            &.active {
                background: $dark-primary-color;
            }

            &.has-dream:not(.active) {
                background: $dark-primary-light;
                color: $dark-primary-color;
            }
        }

        .menu-list {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .menu-item {
            border-bottom-color: $dark-border-color;

            &:active {
                background: #252525;
            }
        }

        .menu-text {
            color: $dark-text-primary;
        }

        .menu-icon-wrapper {
            &.gold {
                background: rgba(255, 247, 230, 0.1);
            }

            &.cyan {
                background: rgba(230, 255, 251, 0.1);
            }

            &.gray {
                background: rgba(240, 240, 240, 0.1);

                .menu-icon {
                    filter: brightness(0) saturate(100%) invert(100%);
                    opacity: 0.7;
                }
            }
        }

        .menu-arrow {
            filter: brightness(0) saturate(100%) invert(100%);
            transition: filter 0.3s ease;
        }

        .calendar-day.weekday {
            color: $dark-text-placeholder;
        }
    }
}

// 用户头部
.profile-header {
    background: #fff;
    padding: 48rpx;
    // 顶部 padding = 状态栏高度 + 负边距补偿 + 原始间距
    padding-top: calc(v-bind('statusBarHeight') * 2rpx + v-bind('statusBarHeight') * 2rpx + 60rpx);
    padding-top: calc(constant(safe-area-inset-top) + v-bind('statusBarHeight') * 2rpx + 60rpx);
    padding-top: calc(env(safe-area-inset-top) + v-bind('statusBarHeight') * 2rpx + 60rpx);
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    position: relative;
    margin-top: calc(-1 * v-bind('statusBarHeight') * 2rpx);
    overflow: hidden;

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

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2rpx;
        background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
    }
}

.avatar {
    width: 144rpx;
    height: 144rpx;
    border-radius: 50%;
    background: #edf2f7;
    margin-right: 40rpx;
    border: 6rpx solid #fff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    transition: transform 0.2s;

    &:active {
        transform: scale(0.95);
    }
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-icon {
    width: 100%;
    height: 100%;
    transform: scale(1.1) translateY(8rpx);
    opacity: 0.5;
    // 将黑色 SVG 转换为深灰色
    filter: brightness(0) saturate(100%) invert(30%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(60%)
        contrast(90%);
}

.avatar-edit-hint {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;

    .avatar:active & {
        opacity: 1;
    }
}

.edit-icon {
    width: 24rpx;
    height: 24rpx;
    filter: brightness(0) invert(1);
}

.user-info {
    flex: 1;
}

.user-name-row {
    display: flex;
    align-items: center;
}

.username {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
}

.vip-badge {
    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
    color: #ffd700;
    font-size: 20rpx;
    padding: 8rpx 20rpx;
    border-radius: 24rpx;
    margin-left: 16rpx;
    font-weight: 700;
    letter-spacing: 1rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.vip-icon {
    width: 20rpx;
    height: 20rpx;
    // 将黑色 SVG 转换为金色 (#FFD700)
    filter: brightness(0) saturate(100%) invert(84%) sepia(82%) saturate(2167%) hue-rotate(360deg) brightness(104%)
        contrast(103%);
}

.user-id {
    font-size: 24rpx;
    color: $text-placeholder;
    margin-top: 12rpx;
}

// 数据统计
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;
    padding: 0 40rpx;
    margin-bottom: 48rpx;
}

.stat-item {
    background: #fff;
    border-radius: 32rpx;
    padding: 32rpx 24rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;

    &:active {
        transform: scale(0.98);
    }
}

.stat-value {
    display: block;
    font-size: 48rpx;
    font-weight: 800;
    color: $text-primary;
    margin-bottom: 8rpx;

    &.primary {
        color: $primary-color;
    }

    &.gold {
        color: #faad14;
    }
}

.stat-label {
    font-size: 22rpx;
    color: $text-secondary;
    font-weight: 500;
}

// 日历卡片
.card {
    background: #fff;
    margin: 0 40rpx 40rpx;
    border-radius: 40rpx;
    padding: 40rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.calendar-card {
    margin-top: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
}

.card-title {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $text-primary;
}

.month-nav {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.nav-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: rgba(107, 78, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:active {
        transform: scale(0.9);
        background: rgba(107, 78, 255, 0.2);
    }

    &.disabled {
        opacity: 0.3;
        pointer-events: none;
    }
}

.nav-icon {
    width: 28rpx;
    height: 28rpx;
    filter: brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(1352%) hue-rotate(235deg) brightness(87%)
        contrast(93%);

    &.prev {
        transform: rotate(180deg);
    }
}

.month-badge {
    font-size: 24rpx;
    font-weight: 700;
    color: $primary-color;
    background: rgba(107, 78, 255, 0.1);
    padding: 8rpx 24rpx;
    border-radius: 24rpx;
    min-width: 160rpx;
    text-align: center;
    transition: all 0.2s;

    &:active {
        background: rgba(107, 78, 255, 0.2);
    }
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 20rpx;
    text-align: center;
}

.calendar-day {
    font-size: 24rpx;
    color: $text-secondary;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20rpx;
    position: relative;
    transition: all 0.2s;

    &.weekday {
        font-weight: 500;
        color: $text-placeholder;
        aspect-ratio: auto;
        margin-bottom: 8rpx;
    }

    &.empty {
        background: none;
    }

    &.active {
        background: $primary-color;
        color: #fff;
        box-shadow: 0 8rpx 20rpx rgba(107, 78, 255, 0.3);
    }

    &.has-dream:not(.active) {
        background: #f0f4ff;
        color: $primary-color;
        font-weight: 600;
    }

    &.has-dream::after {
        content: '';
        position: absolute;
        bottom: 12rpx;
        width: 8rpx;
        height: 8rpx;
        background: currentColor;
        border-radius: 50%;
        opacity: 0.6;
    }

    &.multi-dream::after {
        display: none;
    }
}

.dream-count-badge {
    position: absolute;
    top: -4rpx;
    right: -4rpx;
    min-width: 28rpx;
    height: 28rpx;
    line-height: 28rpx;
    font-size: 18rpx;
    font-weight: 600;
    color: #fff;
    background: $primary-color;
    border-radius: 14rpx;
    text-align: center;
    padding: 0 6rpx;
}

// 月度统计
.calendar-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 32rpx;
    padding-top: 24rpx;
    border-top: 2rpx solid #f0f0f0;
}

.stats-text {
    font-size: 24rpx;
    color: $text-secondary;
}

.back-today {
    font-size: 24rpx;
    color: $primary-color;
    font-weight: 500;

    &:active {
        opacity: 0.7;
    }
}

// 菜单列表
.menu-list {
    background: #fff;
    margin: 0 40rpx;
    border-radius: 40rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 36rpx 40rpx;
    border-bottom: 2rpx solid #f7fafc;
    transition: background 0.2s;

    &:active {
        background: #f9fafb;
    }

    &:last-child {
        border-bottom: none;
    }
}

.menu-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.menu-icon-wrapper {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.gold {
        background: #fff7e6;

        .menu-icon {
            filter: invert(68%) sepia(58%) saturate(1078%) hue-rotate(359deg) brightness(105%) contrast(101%);
        }
    }

    &.cyan {
        background: #e6fffb;

        .menu-icon {
            filter: invert(68%) sepia(42%) saturate(5876%) hue-rotate(143deg) brightness(91%) contrast(85%);
        }
    }

    &.gray {
        background: #f0f0f0;

        .menu-icon {
            filter: invert(35%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(60%) contrast(90%);
        }
    }
}

.menu-icon {
    width: 40rpx;
    height: 40rpx;
}

.menu-text {
    font-size: 30rpx;
    font-weight: 500;
    color: $text-primary;
}

.menu-arrow {
    width: 32rpx;
    height: 32rpx;
    opacity: 0.3;
    // 将黑色 SVG 转换为灰色
    filter: brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(80%)
        contrast(90%);
}
</style>
