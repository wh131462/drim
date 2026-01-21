<template>
  <view class="page dream-detail-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 内容 -->
    <template v-else-if="dream">
      <!-- 梦境内容 -->
      <view class="dream-section card">
        <view class="section-header">
          <text class="section-title">梦境内容</text>
          <text class="dream-date">{{ formatDate(dream.createdAt) }}</text>
        </view>
        <view class="dream-content">
          <text>{{ dream.content }}</text>
        </view>
        <view class="dream-meta" v-if="dream.tags?.length || dream.emotion">
          <view class="tags" v-if="dream.tags?.length">
            <view v-for="tag in dreamTags" :key="tag.id" class="tag-item">
              <text class="tag-icon">{{ tag.icon }}</text>
              <text class="tag-name">{{ tag.name }}</text>
            </view>
          </view>
          <view class="emotion" v-if="emotionInfo">
            <text class="emotion-icon">{{ emotionInfo.icon }}</text>
            <text class="emotion-name">{{ emotionInfo.name }}</text>
          </view>
        </view>
      </view>

      <!-- 解析结果 -->
      <template v-if="dream.analysis">
        <!-- 主题 -->
        <view class="analysis-section card">
          <view class="section-header">
            <text class="section-title">🌙 梦境主题</text>
          </view>
          <view class="theme-text">{{ dream.analysis.theme }}</view>
        </view>

        <!-- 心理解读 -->
        <view class="interpretation-section card">
          <view class="section-header">
            <text class="section-title">💭 心理解读</text>
          </view>
          <view class="interpretation-text">{{ dream.analysis.interpretation }}</view>
        </view>

        <!-- 运势 -->
        <view class="fortune-section card">
          <view class="section-header">
            <text class="section-title">✨ 今日运势</text>
          </view>
          <view class="fortune-score">
            <view class="score-circle">
              <text class="score-number">{{ dream.analysis.fortuneScore }}</text>
              <text class="score-label">分</text>
            </view>
            <view class="score-stars">
              <text
                v-for="i in 5"
                :key="i"
                class="star"
                :class="{ active: i <= Math.ceil(dream.analysis.fortuneScore / 20) }"
              >
                ⭐
              </text>
            </view>
          </view>
          <view class="fortune-tips" v-if="dream.analysis.fortuneTips">
            <view class="tip-item">
              <view class="tip-icon">💼</view>
              <view class="tip-content">
                <text class="tip-label">事业</text>
                <text class="tip-text">{{ dream.analysis.fortuneTips.career }}</text>
              </view>
            </view>
            <view class="tip-item">
              <view class="tip-icon">💕</view>
              <view class="tip-content">
                <text class="tip-label">感情</text>
                <text class="tip-text">{{ dream.analysis.fortuneTips.love }}</text>
              </view>
            </view>
            <view class="tip-item">
              <view class="tip-icon">💪</view>
              <view class="tip-content">
                <text class="tip-label">健康</text>
                <text class="tip-text">{{ dream.analysis.fortuneTips.health }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>

      <!-- 未解析提示 -->
      <view v-else class="no-analysis card">
        <view class="no-analysis-icon">🔮</view>
        <text class="no-analysis-text">该梦境尚未解析</text>
        <button class="analyze-btn" @tap="handleAnalyze">立即解析</button>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar safe-bottom">
        <button class="action-btn share-btn" open-type="share">
          <text class="btn-icon">📤</text>
          <text class="btn-text">分享</text>
        </button>
        <button class="action-btn reanalyze-btn" @tap="handleReanalyze" v-if="dream.analysis">
          <text class="btn-icon">🔄</text>
          <text class="btn-text">重新解析</text>
        </button>
        <button class="action-btn delete-btn" @tap="handleDelete">
          <text class="btn-icon">🗑️</text>
          <text class="btn-text">删除</text>
        </button>
      </view>
    </template>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-text">梦境不存在或已删除</text>
      <button class="back-btn" @tap="goBack">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dreamApi, analysisApi } from '@/api'
import { formatDate as formatDateUtil } from '@/utils/date'
import { DREAM_TAGS, getTagsByIds } from '@/constants/tags'
import { EMOTION_OPTIONS, getEmotionById } from '@/constants/emotions'
import type { DreamDetail } from '@/types/dream'
import type { Emotion } from '@/types/dream'

// 状态
const loading = ref(true)
const dream = ref<DreamDetail | null>(null)
const dreamId = ref('')

// 计算属性
const dreamTags = computed(() => {
  if (!dream.value?.tags?.length) return []
  return getTagsByIds(dream.value.tags)
})

const emotionInfo = computed(() => {
  if (!dream.value?.emotion) return null
  return getEmotionById(dream.value.emotion as Emotion)
})

// 方法
function formatDate(date: string) {
  return formatDateUtil(date, 'YYYY年MM月DD日 HH:mm')
}

async function loadDream() {
  if (!dreamId.value) return

  loading.value = true
  try {
    dream.value = await dreamApi.getById(dreamId.value)
  } catch (error) {
    console.error('加载梦境失败:', error)
    dream.value = null
  } finally {
    loading.value = false
  }
}

function handleAnalyze() {
  uni.navigateTo({
    url: `/pages/result/index?dreamId=${dreamId.value}`
  })
}

async function handleReanalyze() {
  uni.showModal({
    title: '重新解析',
    content: '重新解析将消耗50幸运值，确定继续吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '解析中...' })
          await analysisApi.retry(dreamId.value)
          uni.hideLoading()
          // 刷新页面
          await loadDream()
          uni.showToast({ title: '解析成功', icon: 'success' })
        } catch (error: any) {
          uni.hideLoading()
          uni.showToast({
            title: error.message || '解析失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

function handleDelete() {
  uni.showModal({
    title: '删除梦境',
    content: '确定要删除这个梦境吗？删除后无法恢复。',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          await dreamApi.delete(dreamId.value)
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            goBack()
          }, 1500)
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}

// 分享
onShareAppMessage(() => {
  return {
    title: dream.value?.analysis?.theme || '我记录了一个梦境',
    path: `/pages/index/index`
  }
})

// 生命周期
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as { options?: { dreamId?: string } }
  dreamId.value = currentPage.options?.dreamId || ''

  if (dreamId.value) {
    loadDream()
  } else {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.dream-detail-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $spacing-base;
  padding-bottom: 160rpx;
}

.loading-container {
  @include flex-center;
  flex-direction: column;
  padding: 200rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid $border-color;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: $spacing-sm;
}

.loading-text {
  font-size: $font-size-base;
  color: $text-secondary;
}

.card {
  background: #fff;
  border-radius: $radius-lg;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
  box-shadow: $shadow-sm;
}

.section-header {
  @include flex-between;
  margin-bottom: $spacing-sm;
}

.section-title {
  font-size: $font-size-md;
  font-weight: 500;
  color: $text-primary;
}

.dream-date {
  font-size: $font-size-sm;
  color: $text-placeholder;
}

.dream-content {
  font-size: $font-size-base;
  color: $text-primary;
  line-height: 1.8;
  margin-bottom: $spacing-base;
}

.dream-meta {
  @include flex-between;
  padding-top: $spacing-sm;
  border-top: 1rpx solid $border-light;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag-item {
  @include flex-center;
  padding: 6rpx 16rpx;
  background: rgba($primary-color, 0.1);
  border-radius: $radius-base;
}

.tag-icon {
  margin-right: 4rpx;
  font-size: $font-size-sm;
}

.tag-name {
  font-size: $font-size-sm;
  color: $primary-color;
}

.emotion {
  @include flex-center;
}

.emotion-icon {
  margin-right: 4rpx;
}

.emotion-name {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.theme-text {
  font-size: $font-size-lg;
  font-weight: 500;
  color: $primary-color;
  text-align: center;
  padding: $spacing-sm 0;
}

.interpretation-text {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: 1.8;
}

.fortune-score {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-base 0;
}

.score-circle {
  @include flex-center;
  flex-direction: column;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  margin-bottom: $spacing-sm;
}

.score-number {
  font-size: 56rpx;
  font-weight: 600;
  color: #fff;
}

.score-label {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

.score-stars {
  .star {
    opacity: 0.3;
    &.active {
      opacity: 1;
    }
  }
}

.fortune-tips {
  margin-top: $spacing-base;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.tip-icon {
  width: 48rpx;
  font-size: $font-size-lg;
}

.tip-content {
  flex: 1;
}

.tip-label {
  display: block;
  font-size: $font-size-sm;
  color: $text-placeholder;
  margin-bottom: 4rpx;
}

.tip-text {
  font-size: $font-size-base;
  color: $text-primary;
}

.no-analysis {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl;
}

.no-analysis-icon {
  font-size: 80rpx;
  margin-bottom: $spacing-base;
}

.no-analysis-text {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-bottom: $spacing-base;
}

.analyze-btn {
  width: 240rpx;
  height: 72rpx;
  background: $primary-color;
  color: #fff;
  font-size: $font-size-base;
  border-radius: $radius-lg;
  @include flex-center;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-base;
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: $radius-base;
  @include flex-center;
  flex-direction: column;
  font-size: $font-size-sm;
  background: $bg-secondary;
  color: $text-secondary;

  .btn-icon {
    font-size: $font-size-lg;
    margin-bottom: 4rpx;
  }

  .btn-text {
    font-size: $font-size-xs;
  }
}

.share-btn {
  background: rgba($primary-color, 0.1);
  color: $primary-color;
}

.delete-btn {
  background: rgba($error-color, 0.1);
  color: $error-color;
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: 200rpx 0;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-placeholder;
  margin-bottom: $spacing-base;
}

.back-btn {
  width: 200rpx;
  height: 72rpx;
  background: $primary-color;
  color: #fff;
  font-size: $font-size-base;
  border-radius: $radius-lg;
  @include flex-center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
