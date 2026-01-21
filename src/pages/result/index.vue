<template>
  <view class="page result-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-animation"></view>
      <text class="loading-text">AI 正在解析你的梦境...</text>
    </view>

    <!-- 解析结果 -->
    <view v-else-if="analysis" class="result-content">
      <!-- 主题 -->
      <view class="theme-section">
        <view class="theme-icon">🌙</view>
        <view class="theme-title">梦境解析</view>
        <view class="theme-text">{{ analysis.theme }}</view>
      </view>

      <!-- 心理解读 -->
      <view class="card interpretation-card">
        <view class="card-title">心理解读</view>
        <view class="card-content">{{ analysis.interpretation }}</view>
      </view>

      <!-- 运势 -->
      <view class="card fortune-card">
        <view class="card-title">今日运势</view>
        <view class="fortune-score">
          <view class="score-stars">
            <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= Math.ceil(analysis.fortuneScore / 20) }">
              ⭐
            </text>
          </view>
          <text class="score-number">{{ analysis.fortuneScore }}分</text>
        </view>
        <view class="fortune-tips">
          <view class="tip-item">
            <text class="tip-label">事业</text>
            <text class="tip-text">{{ analysis.fortuneTips.career }}</text>
          </view>
          <view class="tip-item">
            <text class="tip-label">感情</text>
            <text class="tip-text">{{ analysis.fortuneTips.love }}</text>
          </view>
          <view class="tip-item">
            <text class="tip-label">健康</text>
            <text class="tip-text">{{ analysis.fortuneTips.health }}</text>
          </view>
        </view>
      </view>

      <!-- 改运任务 -->
      <view class="card task-card">
        <view class="card-title">🎯 改运任务</view>
        <view class="task-content">{{ analysis.task.content }}</view>
        <view class="task-reward">完成可获得 +{{ analysis.task.rewardPoints }} 幸运值</view>
        <view class="task-actions">
          <button class="task-btn complete-btn" @tap="handleCompleteTask">已完成</button>
          <button class="task-btn later-btn" @tap="handleLater">稍后提醒</button>
        </view>
      </view>

      <!-- 免责声明 -->
      <view class="disclaimer">{{ analysis.disclaimer }}</view>

      <!-- 分享按钮 -->
      <view class="share-section">
        <button class="share-btn" open-type="share">分享给朋友</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { analysisApi } from '@/api'
import type { Analysis } from '@/types/analysis'

// 获取页面参数
const props = defineProps<{
  dreamId?: string
}>()

// 数据
const loading = ref(true)
const analysis = ref<Analysis | null>(null)

// 生命周期
onMounted(async () => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as { options?: { dreamId?: string } }
  const dreamId = currentPage.options?.dreamId

  if (!dreamId) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  await loadAnalysis(dreamId)
})

// 方法
async function loadAnalysis(dreamId: string) {
  try {
    loading.value = true

    // 请求解析
    const { analysisId } = await analysisApi.request({ dreamId })

    // 轮询获取结果
    await pollAnalysisResult(analysisId)
  } catch (error) {
    uni.showToast({ title: '解析失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function pollAnalysisResult(analysisId: string, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await analysisApi.getById(analysisId)

    if (result.status === 'completed') {
      analysis.value = result
      return
    }

    if (result.status === 'failed') {
      throw new Error('解析失败')
    }

    // 等待 2 秒后重试
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error('解析超时')
}

function handleCompleteTask() {
  uni.showToast({ title: '任务完成！幸运值+10', icon: 'success' })
}

function handleLater() {
  uni.showToast({ title: '已设置提醒', icon: 'success' })
}

// 分享配置
onShareAppMessage(() => {
  return {
    title: `我梦见了：${analysis.value?.theme}`,
    path: `/pages/index/index`
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.result-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.loading-container {
  @include flex-center;
  flex-direction: column;
  min-height: 100vh;
  padding: $spacing-xl;
}

.loading-animation {
  width: 120rpx;
  height: 120rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: $spacing-base;
}

.loading-text {
  font-size: $font-size-md;
  color: rgba(255, 255, 255, 0.8);
}

.result-content {
  padding: $spacing-base;
  padding-bottom: $spacing-xl;
}

.theme-section {
  text-align: center;
  padding: $spacing-xl 0;
}

.theme-icon {
  font-size: 80rpx;
  margin-bottom: $spacing-sm;
}

.theme-title {
  font-size: $font-size-lg;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: $spacing-sm;
}

.theme-text {
  font-size: $font-size-xl;
  font-weight: 600;
  color: #fff;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: $radius-lg;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
}

.card-title {
  font-size: $font-size-md;
  font-weight: 500;
  color: #fff;
  margin-bottom: $spacing-sm;
}

.card-content {
  font-size: $font-size-base;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
}

.fortune-score {
  @include flex-center;
  margin-bottom: $spacing-base;
}

.score-stars {
  margin-right: $spacing-sm;

  .star {
    opacity: 0.3;

    &.active {
      opacity: 1;
    }
  }
}

.score-number {
  font-size: $font-size-xl;
  font-weight: 600;
  color: #ffd700;
}

.fortune-tips {
  .tip-item {
    @include flex-between;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);

    &:last-child {
      border-bottom: none;
    }
  }

  .tip-label {
    font-size: $font-size-base;
    color: rgba(255, 255, 255, 0.6);
  }

  .tip-text {
    font-size: $font-size-base;
    color: #fff;
    flex: 1;
    text-align: right;
    margin-left: $spacing-base;
  }
}

.task-content {
  font-size: $font-size-md;
  color: #fff;
  margin-bottom: $spacing-sm;
}

.task-reward {
  font-size: $font-size-sm;
  color: #ffd700;
  margin-bottom: $spacing-base;
}

.task-actions {
  display: flex;
  gap: $spacing-sm;
}

.task-btn {
  flex: 1;
  height: 72rpx;
  border-radius: $radius-base;
  font-size: $font-size-base;
  @include flex-center;
}

.complete-btn {
  background: $primary-color;
  color: #fff;
}

.later-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.disclaimer {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin: $spacing-base 0;
}

.share-section {
  margin-top: $spacing-lg;
}

.share-btn {
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: $font-size-md;
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
