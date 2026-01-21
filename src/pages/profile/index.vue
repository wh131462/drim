<template>
  <view class="page profile-page">
    <!-- 用户信息 -->
    <view class="user-section">
      <view class="user-info">
        <image class="avatar" :src="userStore.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="user-detail">
          <text class="nickname">{{ userStore.nickname }}</text>
          <view class="vip-badge" v-if="userStore.isVip">VIP会员</view>
        </view>
      </view>
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">{{ userStore.luckyPoints }}</text>
          <text class="stat-label">幸运值</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStore.consecutiveDays }}</text>
          <text class="stat-label">连续记梦</text>
        </view>
      </view>
    </view>

    <!-- 日历 -->
    <view class="card calendar-section">
      <view class="section-header">
        <text class="section-title">📅 梦境日历</text>
        <view class="month-nav">
          <text class="nav-btn" @tap="prevMonth">&lt;</text>
          <text class="current-month">{{ currentYear }}年{{ currentMonth }}月</text>
          <text class="nav-btn" @tap="nextMonth">&gt;</text>
        </view>
      </view>
      <view class="calendar-grid">
        <view class="weekday-row">
          <text v-for="day in weekdays" :key="day" class="weekday">{{ day }}</text>
        </view>
        <view class="days-grid">
          <view
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-cell"
            :class="{
              empty: !day,
              today: day && isToday(day),
              'has-dream': day && hasDream(day)
            }"
            @tap="day && handleDayClick(day)"
          >
            <text v-if="day" class="day-number">{{ day }}</text>
            <view v-if="day && hasDream(day)" class="dream-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 成就 -->
    <view class="card achievements-section">
      <view class="section-header">
        <text class="section-title">🏆 我的成就</text>
      </view>
      <view class="achievement-list">
        <view v-for="achievement in achievements" :key="achievement.id" class="achievement-item">
          <text class="achievement-icon">{{ achievement.icon }}</text>
          <text class="achievement-name">{{ achievement.name }}</text>
        </view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="card menu-section">
      <view class="menu-item" @tap="goToVip">
        <text class="menu-icon">👑</text>
        <text class="menu-text">开通会员</text>
        <text class="menu-arrow">&gt;</text>
      </view>
      <view class="menu-item" @tap="goToSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">&gt;</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore, useDreamStore } from '@/stores'
import { getMonthDays, getFirstDayOfMonth } from '@/utils/date'

const userStore = useUserStore()
const dreamStore = useDreamStore()

// 数据
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 成就（示例数据）
const achievements = ref([
  { id: '1', name: '初次记梦', icon: '🌙' },
  { id: '2', name: '连续7天', icon: '🔥' }
])

// 计算属性
const calendarDays = computed(() => {
  const days: (number | null)[] = []
  const firstDay = getFirstDayOfMonth(currentYear.value, currentMonth.value)
  const totalDays = getMonthDays(currentYear.value, currentMonth.value)

  // 填充空白
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // 填充日期
  for (let i = 1; i <= totalDays; i++) {
    days.push(i)
  }

  return days
})

// 方法
function isToday(day: number): boolean {
  const today = new Date()
  return (
    today.getFullYear() === currentYear.value &&
    today.getMonth() + 1 === currentMonth.value &&
    today.getDate() === day
  )
}

function hasDream(day: number): boolean {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return dreamStore.calendar.some((r) => r.date === dateStr && r.hasDream)
}

function handleDayClick(day: number) {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const record = dreamStore.calendar.find((r) => r.date === dateStr)

  if (record?.dreamId) {
    uni.navigateTo({
      url: `/pages/dream-detail/index?dreamId=${record.dreamId}`
    })
  }
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
  loadCalendar()
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
  loadCalendar()
}

async function loadCalendar() {
  await dreamStore.fetchCalendar(currentYear.value, currentMonth.value)
}

function goToVip() {
  uni.navigateTo({ url: '/pages/vip/index' })
}

function goToSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

// 生命周期
onMounted(() => {
  loadCalendar()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.profile-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: $spacing-xl;
}

.user-section {
  background: linear-gradient(135deg, $primary-color, $primary-light);
  padding: $spacing-lg $spacing-base;
  padding-top: 100rpx;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-base;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-detail {
  margin-left: $spacing-base;
}

.nickname {
  font-size: $font-size-xl;
  font-weight: 600;
  color: #fff;
}

.vip-badge {
  display: inline-block;
  padding: 4rpx 16rpx;
  background: #ffd700;
  color: #333;
  font-size: $font-size-xs;
  border-radius: $radius-lg;
  margin-top: $spacing-xs;
}

.user-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-lg;
  padding: $spacing-base;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: $font-size-xxl;
  font-weight: 600;
  color: #fff;
}

.stat-label {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

.card {
  margin: $spacing-base;
  background: #fff;
  border-radius: $radius-lg;
  padding: $spacing-base;
}

.section-header {
  @include flex-between;
  margin-bottom: $spacing-base;
}

.section-title {
  font-size: $font-size-md;
  font-weight: 500;
  color: $text-primary;
}

.month-nav {
  @include flex-center;
}

.nav-btn {
  padding: 0 $spacing-sm;
  color: $text-secondary;
}

.current-month {
  font-size: $font-size-base;
  color: $text-primary;
  margin: 0 $spacing-sm;
}

.calendar-grid {
  .weekday-row {
    display: flex;
    margin-bottom: $spacing-sm;
  }

  .weekday {
    flex: 1;
    text-align: center;
    font-size: $font-size-sm;
    color: $text-placeholder;
  }

  .days-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .day-cell {
    width: calc(100% / 7);
    aspect-ratio: 1;
    @include flex-center;
    flex-direction: column;
    position: relative;

    &.empty {
      background: none;
    }

    &.today {
      .day-number {
        background: $primary-color;
        color: #fff;
        border-radius: 50%;
        width: 56rpx;
        height: 56rpx;
        @include flex-center;
      }
    }

    &.has-dream {
      .dream-dot {
        position: absolute;
        bottom: 8rpx;
        width: 8rpx;
        height: 8rpx;
        background: $primary-color;
        border-radius: 50%;
      }
    }
  }

  .day-number {
    font-size: $font-size-base;
    color: $text-primary;
  }
}

.achievement-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.achievement-item {
  @include flex-center;
  padding: $spacing-sm $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-lg;
}

.achievement-icon {
  margin-right: $spacing-xs;
}

.achievement-name {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.menu-section {
  padding: 0;
}

.menu-item {
  @include flex-between;
  padding: $spacing-base;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  margin-right: $spacing-sm;
}

.menu-text {
  flex: 1;
  font-size: $font-size-base;
  color: $text-primary;
}

.menu-arrow {
  color: $text-placeholder;
}
</style>
