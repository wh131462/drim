<template>
  <view class="page home-page">
    <!-- 顶部区域 -->
    <view class="header-section">
      <view class="header-bg"></view>
      <view class="header-content">
        <text class="greeting">今天，你梦见了什么？</text>
        <view class="streak-info" v-if="userStore.consecutiveDays > 0">
          <text class="streak-text">连续记梦：{{ userStore.consecutiveDays }}天 🔥</text>
        </view>
      </view>
    </view>

    <!-- 记梦按钮 -->
    <view class="record-section">
      <view class="record-card" @tap="goToRecord">
        <view class="record-icon">✏️</view>
        <view class="record-text">
          <text class="record-title">记录今天的梦</text>
          <text class="record-desc">{{ hasTodayDream ? '今日已记录' : '开始记录你的梦境' }}</text>
        </view>
        <view class="record-arrow">&gt;</view>
      </view>
    </view>

    <!-- 昨日回顾 -->
    <view class="review-section" v-if="latestDream">
      <view class="section-title">昨日解析回顾</view>
      <view class="review-card" @tap="goToDreamDetail(latestDream.id)">
        <view class="review-content">
          <text class="review-text ellipsis-2">{{ latestDream.content }}</text>
        </view>
        <view class="review-footer">
          <text class="review-date">{{ formatDreamDate(latestDream.createdAt) }}</text>
          <text class="review-action">查看详情 &gt;</text>
        </view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="feature-section">
      <view class="feature-grid">
        <view class="feature-item" @tap="goToCalendar">
          <text class="feature-icon">📅</text>
          <text class="feature-name">梦境日历</text>
        </view>
        <view class="feature-item" @tap="goToStats">
          <text class="feature-icon">📊</text>
          <text class="feature-name">数据统计</text>
        </view>
        <view class="feature-item" @tap="goToVip">
          <text class="feature-icon">👑</text>
          <text class="feature-name">会员中心</text>
        </view>
        <view class="feature-item" @tap="goToSettings">
          <text class="feature-icon">⚙️</text>
          <text class="feature-name">设置</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore, useDreamStore } from '@/stores'
import { getFriendlyDate } from '@/utils/date'

const userStore = useUserStore()
const dreamStore = useDreamStore()

// 计算属性
const hasTodayDream = computed(() => dreamStore.hasTodayDream)
const latestDream = computed(() => dreamStore.latestDream)

// 方法
function formatDreamDate(date: string) {
  return getFriendlyDate(date)
}

function goToRecord() {
  uni.switchTab({ url: '/pages/record/index' })
}

function goToDreamDetail(dreamId: string) {
  uni.navigateTo({ url: `/pages/dream-detail/index?dreamId=${dreamId}` })
}

function goToCalendar() {
  uni.switchTab({ url: '/pages/profile/index' })
}

function goToStats() {
  uni.switchTab({ url: '/pages/profile/index' })
}

function goToVip() {
  uni.navigateTo({ url: '/pages/vip/index' })
}

function goToSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

// 生命周期
onMounted(async () => {
  // 检查登录状态
  if (!userStore.checkLogin()) {
    await userStore.login()
  }

  // 加载梦境列表
  await dreamStore.fetchList(true)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.home-page {
  min-height: 100vh;
  background: $bg-page;
}

.header-section {
  position: relative;
  padding: 120rpx $spacing-base $spacing-lg;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  border-radius: 0 0 48rpx 48rpx;
}

.header-content {
  position: relative;
  z-index: 1;
}

.greeting {
  display: block;
  font-size: $font-size-xxl;
  font-weight: 600;
  color: #fff;
  margin-bottom: $spacing-sm;
}

.streak-info {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-lg;
}

.streak-text {
  font-size: $font-size-sm;
  color: #fff;
}

.record-section {
  padding: 0 $spacing-base;
  margin-top: -40rpx;
  position: relative;
  z-index: 2;
}

.record-card {
  @include card;
  @include flex-between;
  padding: $spacing-base;
  @include touch-active;
}

.record-icon {
  font-size: 64rpx;
  margin-right: $spacing-base;
}

.record-text {
  flex: 1;
}

.record-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: 500;
  color: $text-primary;
}

.record-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.record-arrow {
  font-size: $font-size-lg;
  color: $text-placeholder;
}

.review-section {
  padding: $spacing-base;
}

.section-title {
  font-size: $font-size-md;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.review-card {
  @include card;
  padding: $spacing-base;
  @include touch-active;
}

.review-content {
  margin-bottom: $spacing-sm;
}

.review-text {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: 1.6;
}

.review-footer {
  @include flex-between;
}

.review-date {
  font-size: $font-size-sm;
  color: $text-placeholder;
}

.review-action {
  font-size: $font-size-sm;
  color: $primary-color;
}

.feature-section {
  padding: $spacing-base;
}

.feature-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.feature-item {
  width: calc(50% - #{$spacing-sm} / 2);
  @include card;
  @include flex-center;
  flex-direction: column;
  padding: $spacing-base;
  @include touch-active;
}

.feature-icon {
  font-size: 48rpx;
  margin-bottom: $spacing-xs;
}

.feature-name {
  font-size: $font-size-base;
  color: $text-primary;
}
</style>
