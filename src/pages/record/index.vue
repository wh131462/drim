<template>
  <view class="page record-page">
    <view class="record-content">
      <!-- 梦境输入 -->
      <view class="input-section">
        <view class="section-title">记录你的梦境</view>
        <textarea
          v-model="dreamContent"
          class="dream-input"
          placeholder="描述你的梦境，至少50字..."
          :maxlength="500"
          auto-height
        />
        <view class="word-count">{{ dreamContent.length }}/500</view>
      </view>

      <!-- 标签选择 -->
      <view class="tag-section">
        <view class="section-title">梦境标签（可选）</view>
        <view class="tag-list">
          <view
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
            :class="{ active: selectedTags.includes(tag.id) }"
            @tap="toggleTag(tag.id)"
          >
            <text class="tag-icon">{{ tag.icon }}</text>
            <text class="tag-name">{{ tag.name }}</text>
          </view>
        </view>
      </view>

      <!-- 情绪选择 -->
      <view class="emotion-section">
        <view class="section-title">梦中情绪（可选）</view>
        <view class="emotion-list">
          <view
            v-for="emotion in emotions"
            :key="emotion.id"
            class="emotion-item"
            :class="{ active: selectedEmotion === emotion.id }"
            @tap="selectEmotion(emotion.id)"
          >
            <text class="emotion-icon">{{ emotion.icon }}</text>
            <text class="emotion-name">{{ emotion.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section safe-bottom">
      <button class="submit-btn" :disabled="!canSubmit" @tap="handleSubmit">开始解析</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DREAM_TAGS } from '@/constants/tags'
import { EMOTION_OPTIONS } from '@/constants/emotions'
import { validateDreamContent, validateTags } from '@/utils/validate'
import { useDreamStore } from '@/stores'
import type { Emotion } from '@/types/dream'

const dreamStore = useDreamStore()

// 数据
const dreamContent = ref('')
const selectedTags = ref<string[]>([])
const selectedEmotion = ref<Emotion | null>(null)

// 常量
const tags = DREAM_TAGS
const emotions = EMOTION_OPTIONS

// 计算属性
const canSubmit = computed(() => {
  const contentValid = validateDreamContent(dreamContent.value).valid
  const tagsValid = validateTags(selectedTags.value).valid
  return contentValid && tagsValid
})

// 方法
function toggleTag(tagId: string) {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else if (selectedTags.value.length < 3) {
    selectedTags.value.push(tagId)
  } else {
    uni.showToast({ title: '最多选择3个标签', icon: 'none' })
  }
}

function selectEmotion(emotionId: Emotion) {
  selectedEmotion.value = selectedEmotion.value === emotionId ? null : emotionId
}

async function handleSubmit() {
  if (!canSubmit.value) return

  try {
    uni.showLoading({ title: '提交中...' })

    const dream = await dreamStore.submitDream({
      content: dreamContent.value.trim(),
      tags: selectedTags.value,
      emotion: selectedEmotion.value ?? undefined
    })

    uni.hideLoading()

    // 跳转到解析结果页
    uni.navigateTo({
      url: `/pages/result/index?dreamId=${dream.id}`
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.record-page {
  min-height: 100vh;
  background: $bg-page;
}

.record-content {
  padding: $spacing-base;
  padding-bottom: 160rpx;
}

.section-title {
  font-size: $font-size-md;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.input-section {
  @include card;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
}

.dream-input {
  width: 100%;
  min-height: 300rpx;
  font-size: $font-size-base;
  color: $text-primary;
  line-height: 1.6;
}

.word-count {
  text-align: right;
  font-size: $font-size-sm;
  color: $text-placeholder;
  margin-top: $spacing-sm;
}

.tag-section,
.emotion-section {
  @include card;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
}

.tag-list,
.emotion-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.tag-item,
.emotion-item {
  @include flex-center;
  padding: $spacing-sm $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-lg;
  border: 2rpx solid transparent;
  transition: $transition-base;

  &.active {
    background: rgba($primary-color, 0.1);
    border-color: $primary-color;
    color: $primary-color;
  }
}

.tag-icon,
.emotion-icon {
  margin-right: $spacing-xs;
}

.tag-name,
.emotion-name {
  font-size: $font-size-base;
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-base;
  background: $bg-primary;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: $primary-color;
  color: #fff;
  font-size: $font-size-md;
  font-weight: 500;
  border-radius: $radius-lg;
  @include flex-center;

  &[disabled] {
    background: $text-disabled;
  }
}
</style>
