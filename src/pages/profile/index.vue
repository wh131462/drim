<template>
    <view
        class="page profile-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <text class="page-title">我的</text>
        <!-- 用户头部 -->
        <view class="profile-header">
            <view
                class="avatar"
                @tap="handleAvatarClick"
            >
                <image
                    v-if="userStore.avatar && userStore.avatar !== failedAvatarUrl"
                    class="avatar-image"
                    :src="userStore.avatar"
                    mode="aspectFill"
                    @error="failedAvatarUrl = userStore.avatar"
                />
                <image
                    v-else
                    class="avatar-icon"
                    src="/static/icons/user.png"
                    mode="aspectFit"
                />
                <view class="avatar-edit-hint">
                    <image
                        class="edit-icon"
                        src="/static/icons/edit.png"
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
                            src="/static/icons/star.png"
                            mode="aspectFit"
                        />
                        <text>VIP</text>
                    </view>
                </view>
                <text class="user-id">ID: {{ userStore.userInfo?.id || '未登录' }}</text>
                <text class="user-points">幸运值 {{ userStore.luckyPoints }}</text>
            </view>
        </view>

        <!-- 今日打卡 -->
        <view class="checkin-card">
            <image
                class="checkin-icon"
                src="/static/icons/moon.png"
                mode="aspectFit"
            />
            <view class="checkin-copy">
                <text class="checkin-title">{{ checkinTitle }}</text>
                <text class="checkin-message">{{ checkinMessage }}</text>
            </view>
            <view
                class="checkin-action"
                @tap="handleCheckinAction"
            >
                <text>{{ !thisMonthLoaded && thisMonthError ? '重试' : hasTodayDream ? '回看梦境' : '去记梦' }}</text>
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
                <text class="stat-value primary">{{ thisMonthLoaded ? monthDreamCount : '—' }}</text>
                <text class="stat-label">本月打卡</text>
            </view>
            <view class="stat-item">
                <text class="stat-value">{{ userStore.consecutiveDays || 0 }}</text>
                <text class="stat-label">连续打卡</text>
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
                            src="/static/icons/arrow-right.png"
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
                            src="/static/icons/arrow-right.png"
                            mode="aspectFit"
                        />
                    </view>
                </view>
            </view>
            <view
                v-if="calendarLoading"
                class="calendar-state"
            >
                <text>正在加载日历…</text>
            </view>
            <view
                v-else-if="calendarError"
                class="calendar-state calendar-error"
                @tap="loadCalendar"
            >
                <text>日历加载失败，点击重试</text>
            </view>
            <view
                v-if="!calendarLoading && !calendarError"
                class="calendar-grid"
            >
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
            <view
                v-if="!calendarLoading && !calendarError"
                class="calendar-stats"
            >
                <text class="stats-text"
                    >{{ currentMonth }}月记梦 {{ calendarDreamCount }} 天<text
                        v-if="monthDreamTotal > calendarDreamCount"
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
                @tap="goToBookshelf"
            >
                <view class="menu-left">
                    <view class="menu-icon-wrapper cyan">
                        <image
                            class="menu-icon"
                            src="/static/icons/book.png"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">我的书架</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.png"
                    mode="aspectFit"
                />
            </view>
            <view
                class="menu-item"
                @tap="goToVip"
            >
                <view class="menu-left">
                    <view class="menu-icon-wrapper gold">
                        <image
                            class="menu-icon"
                            src="/static/icons/star.png"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">会员中心</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.png"
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
                            src="/static/icons/achievement.png"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">我的成就</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.png"
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
                            src="/static/icons/settings.png"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="menu-text">设置</text>
                </view>
                <image
                    class="menu-arrow"
                    src="/static/icons/arrow-right.png"
                    mode="aspectFit"
                />
            </view>
        </view>

        <!-- 自定义 TabBar -->
        <custom-tab-bar :selected="3" />

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
import { ref, computed } from 'vue';
import { useUserStore, useDreamStore } from '@/stores';
import { dreamApi } from '@/api';
import type { CalendarRecord } from '@/types/dream';
import CustomTabBar from '@/custom-tab-bar/index.vue';
import UserProfileModal from '@/components/UserProfileModal/index.vue';
import { onShow } from '@dcloudio/uni-app';
import { getPageHeadingMetrics } from '@/utils/navigation';

const userStore = useUserStore();
const failedAvatarUrl = ref<string | null>(null);
const dreamStore = useDreamStore();
const headingMetrics = getPageHeadingMetrics();

// 资料编辑弹窗
const showProfileModal = ref(false);

// 数据
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const calendarLoading = ref(false);
const calendarError = ref(false);
const calendarRecords = ref<CalendarRecord[]>([]);
const thisMonthRecords = ref<CalendarRecord[]>([]);
const thisMonthLoaded = ref(false);
const thisMonthError = ref(false);
const today = ref(new Date());
let calendarRequestId = 0;
let thisMonthRequestId = 0;

const todayDate = computed(() => {
    const now = today.value;
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
});

const todayRecord = computed(() => thisMonthRecords.value.find((record) => record.date === todayDate.value));
const hasTodayDream = computed(() =>
    thisMonthLoaded.value ? !!todayRecord.value?.hasDream : dreamStore.hasTodayDream
);
const checkinTitle = computed(() => {
    if (hasTodayDream.value) return '今天已经记梦';
    if (thisMonthLoaded.value) return '今天还没有记梦';
    return thisMonthError.value ? '打卡状态暂不可用' : '正在加载打卡状态';
});
const checkinMessage = computed(() => (hasTodayDream.value ? '你的梦境已收入潜意识档案' : '留住醒来时的那一点记忆'));

// 判断是否为当前月份
const isCurrentMonth = computed(() => {
    const now = today.value;
    return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1;
});

// 当月记梦天数
const monthDreamCount = computed(() => {
    return thisMonthRecords.value.filter((r) => r.hasDream).length;
});

const calendarDreamCount = computed(() => calendarRecords.value.filter((r) => r.hasDream).length);

// 当月梦境总数
const monthDreamTotal = computed(() => {
    return calendarRecords.value.reduce((sum, r) => sum + (r.dreamCount || 0), 0);
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
    const now = today.value;
    return (
        now.getFullYear() === currentYear.value && now.getMonth() + 1 === currentMonth.value && now.getDate() === day
    );
}

function hasDream(day: number): boolean {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarRecords.value.some((r) => r.date === dateStr && r.hasDream);
}

function getDreamCount(day: number): number {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = calendarRecords.value.find((r) => r.date === dateStr);
    return record?.dreamCount || 0;
}

function handleDayClick(day: number) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = calendarRecords.value.find((r) => r.date === dateStr);

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

function goToBookshelf() {
    uni.navigateTo({ url: '/pages/books/index?mode=shelf' });
}

function handleCheckinAction() {
    if (!thisMonthLoaded.value && thisMonthError.value) {
        if (isCurrentMonth.value) loadCalendar();
        else loadThisMonth();
        return;
    }
    if (hasTodayDream.value) {
        const record = todayRecord.value;
        if (record?.dreamCount && record.dreamCount > 1) {
            uni.navigateTo({ url: `/pages/dream-list/index?date=${todayDate.value}` });
            return;
        }
        const dreamId = record?.dreamId || dreamStore.todayDream?.id;
        if (dreamId) {
            uni.navigateTo({ url: `/pages/dream-detail/index?id=${dreamId}` });
            return;
        }
    }
    uni.navigateTo({ url: '/pages/record/editor' });
}

async function loadCalendar() {
    const requestId = ++calendarRequestId;
    const year = currentYear.value;
    const month = currentMonth.value;
    const now = new Date();
    const isThisMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const monthRequestId = isThisMonth ? ++thisMonthRequestId : 0;
    calendarLoading.value = true;
    calendarError.value = false;
    calendarRecords.value = [];
    try {
        const { records } = await dreamApi.getCalendar(year, month);
        if (isThisMonth && monthRequestId === thisMonthRequestId) {
            thisMonthRecords.value = records;
            thisMonthLoaded.value = true;
            thisMonthError.value = false;
        }
        if (requestId === calendarRequestId) {
            calendarRecords.value = records;
        }
    } catch (error) {
        if (requestId === calendarRequestId) calendarError.value = true;
        if (isThisMonth && monthRequestId === thisMonthRequestId) thisMonthError.value = true;
        console.error('获取日历数据失败:', error);
    } finally {
        if (requestId === calendarRequestId) calendarLoading.value = false;
    }
}

async function loadThisMonth() {
    const requestId = ++thisMonthRequestId;
    const now = new Date();
    try {
        const { records } = await dreamApi.getCalendar(now.getFullYear(), now.getMonth() + 1);
        if (requestId !== thisMonthRequestId) return;
        thisMonthRecords.value = records;
        thisMonthLoaded.value = true;
        thisMonthError.value = false;
    } catch (error) {
        if (requestId === thisMonthRequestId) thisMonthError.value = true;
        console.error('获取本月打卡失败:', error);
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
    void userStore.fetchUserInfo().catch((error) => console.warn('资料更新后用户信息刷新失败:', error));
}

// 页面显示时智能加载数据
onShow(() => {
    if (today.value.toDateString() !== new Date().toDateString()) thisMonthLoaded.value = false;
    today.value = new Date();
    loadCalendar();
    if (!isCurrentMonth.value) loadThisMonth();
    void userStore.ensureUserInfo().catch((error) => console.warn('个人页用户信息刷新失败:', error));
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.profile-page {
    min-height: 100vh;
    background: #faf8fc;
    padding-bottom: 200rpx;
    padding-top: v-bind("headingMetrics.top + 'px'");
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .page-title {
            color: $dark-text-primary;
        }

        .profile-header {
            background: $dark-bg-card;
        }

        .checkin-title {
            color: $dark-text-primary;
        }

        .checkin-card {
            background: rgba(107, 78, 255, 0.2);
        }

        .checkin-message,
        .calendar-state,
        .user-points {
            color: $dark-text-secondary;
        }

        .checkin-action {
            background: $dark-primary-color;
            color: #fff;
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

        .stats-grid {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .stat-item + .stat-item {
            border-left-color: $dark-border-color;
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
.page-title {
    @include page-heading;
    height: v-bind("headingMetrics.height + 'px'");
    margin: 0 32rpx 24rpx;
    color: $text-primary;
}

.profile-header {
    background: #fff;
    padding: 32rpx;
    display: flex;
    align-items: center;
    margin: 0 32rpx 32rpx;
    border-radius: 32rpx;
    position: relative;
    overflow: hidden;
}

.avatar {
    flex: 0 0 112rpx;
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    background: #edf2f7;
    margin-right: 24rpx;
    border: 4rpx solid #fff;
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
    min-width: 0;
}

.user-name-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.username {
    font-size: 34rpx;
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
    display: block;
    font-size: 24rpx;
    color: $text-placeholder;
    margin-top: 12rpx;
    overflow-wrap: anywhere;
}

.user-points {
    display: block;
    margin-top: 10rpx;
    font-size: 24rpx;
    color: $primary-color;
}

.checkin-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin: 0 40rpx 32rpx;
    padding: 32rpx;
    background: #eee9ff;
    border-radius: 32rpx;
}

.checkin-icon {
    width: 64rpx;
    height: 64rpx;
    flex: 0 0 64rpx;
    filter: invert(36%) sepia(65%) saturate(1308%) hue-rotate(223deg) brightness(93%) contrast(95%);
}

.checkin-copy {
    min-width: 0;
    flex: 1;
}

.checkin-title,
.checkin-message {
    display: block;
}

.checkin-title {
    font-size: 30rpx;
    font-weight: 700;
    color: $text-primary;
}

.checkin-message {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: $text-secondary;
}

.checkin-action {
    flex-shrink: 0;
    padding: 16rpx 22rpx;
    border-radius: 18rpx;
    background: $primary-color;
    color: #fff;
    font-size: 23rpx;
    font-weight: 600;
}

// 数据统计
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 32rpx 8rpx;
    margin: 0 40rpx 32rpx;
    border-radius: 32rpx;
    background: #fff;
}

.stat-item {
    text-align: center;
    transition: transform 0.2s;

    &:active {
        transform: scale(0.98);
    }
}

.stat-item + .stat-item {
    border-left: 2rpx solid #eeeaf3;
}

.stat-value {
    display: block;
    font-size: 48rpx;
    font-weight: 800;
    color: $text-primary;
    margin-bottom: 8rpx;
    font-variant-numeric: tabular-nums;

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
    margin: 0 40rpx 32rpx;
    border-radius: 32rpx;
    padding: 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.calendar-card {
    margin-top: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
}

.card-title {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $text-primary;
}

.month-nav {
    display: flex;
    align-items: center;
    gap: 8rpx;
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
    padding: 8rpx 12rpx;
    border-radius: 24rpx;
    min-width: 140rpx;
    text-align: center;
    transition: all 0.2s;

    &:active {
        background: rgba(107, 78, 255, 0.2);
    }
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12rpx;
    text-align: center;
}

.calendar-state {
    padding: 36rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: $text-secondary;
}

.calendar-error {
    color: $primary-color;
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
    }

    &.cyan {
        background: #e6fffb;
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
