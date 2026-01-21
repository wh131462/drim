<template>
  <view class="page vip-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else>
      <!-- VIP 状态卡片 -->
      <view class="vip-card" :class="{ 'is-vip': vipInfo?.isVip }">
        <view class="vip-badge">
          <text class="badge-icon">{{ vipInfo?.isVip ? '👑' : '💎' }}</text>
          <text class="badge-text">{{ vipInfo?.isVip ? '尊贵会员' : '普通用户' }}</text>
        </view>
        <view class="vip-status">
          <template v-if="vipInfo?.isVip">
            <text class="status-text">会员有效期至</text>
            <text class="expire-date">{{ formatDate(vipInfo.expireAt) }}</text>
          </template>
          <template v-else>
            <text class="status-text">开通会员享受更多特权</text>
          </template>
        </view>
        <view class="vip-decoration">
          <view class="star star-1">✨</view>
          <view class="star star-2">⭐</view>
          <view class="star star-3">✨</view>
        </view>
      </view>

      <!-- 会员权益 -->
      <view class="benefits-section card">
        <view class="section-header">
          <text class="section-title">会员专属权益</text>
        </view>
        <view class="benefits-grid">
          <view
            v-for="benefit in vipInfo?.benefits"
            :key="benefit.key"
            class="benefit-item"
            :class="{ enabled: benefit.enabled }"
          >
            <view class="benefit-icon">{{ getBenefitIcon(benefit.key) }}</view>
            <text class="benefit-name">{{ benefit.name }}</text>
            <view class="benefit-status">
              <text v-if="benefit.enabled" class="status-on">已开通</text>
              <text v-else class="status-off">待开通</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 套餐选择 -->
      <view class="plans-section card">
        <view class="section-header">
          <text class="section-title">选择套餐</text>
        </view>
        <view class="plans-list">
          <view
            v-for="plan in vipInfo?.plans"
            :key="plan.id"
            class="plan-item"
            :class="{ selected: selectedPlanId === plan.id }"
            @tap="selectPlan(plan.id)"
          >
            <view class="plan-info">
              <text class="plan-name">{{ plan.name }}</text>
              <view class="plan-price">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ plan.price }}</text>
                <text class="original-price" v-if="plan.originalPrice > plan.price">
                  ¥{{ plan.originalPrice }}
                </text>
              </view>
            </view>
            <view class="plan-tag" v-if="getBestValue(plan)">
              <text>{{ getBestValue(plan) }}</text>
            </view>
            <view class="plan-check">
              <view class="check-circle" :class="{ checked: selectedPlanId === plan.id }">
                <text v-if="selectedPlanId === plan.id">✓</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 购买按钮 -->
      <view class="purchase-section safe-bottom">
        <view class="price-display" v-if="selectedPlan">
          <text class="label">支付金额</text>
          <view class="amount">
            <text class="symbol">¥</text>
            <text class="value">{{ selectedPlan.price }}</text>
          </view>
        </view>
        <button
          class="purchase-btn"
          :disabled="!selectedPlanId || purchasing"
          @tap="handlePurchase"
        >
          <text v-if="purchasing">支付中...</text>
          <text v-else-if="vipInfo?.isVip">立即续费</text>
          <text v-else>立即开通</text>
        </button>
      </view>

      <!-- 说明 -->
      <view class="tips-section">
        <view class="tip-item">
          <text class="tip-icon">💡</text>
          <text class="tip-text">会员有效期内可享受所有会员权益</text>
        </view>
        <view class="tip-item">
          <text class="tip-icon">🔄</text>
          <text class="tip-text">续费将在原有效期基础上延长</text>
        </view>
        <view class="tip-item">
          <text class="tip-icon">📞</text>
          <text class="tip-text">如有问题请联系客服</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { vipApi } from '@/api'
import { formatDate as formatDateUtil } from '@/utils/date'
import type { VipInfo, VipPlan } from '@/types/vip'

// 状态
const loading = ref(true)
const purchasing = ref(false)
const vipInfo = ref<VipInfo | null>(null)
const selectedPlanId = ref<string>('')

// 计算属性
const selectedPlan = computed(() => {
  if (!selectedPlanId.value || !vipInfo.value?.plans) return null
  return vipInfo.value.plans.find(p => p.id === selectedPlanId.value) || null
})

// 权益图标映射
const benefitIcons: Record<string, string> = {
  no_ad: '🚫',
  unlimited_history: '📚',
  free_reanalyze: '🔄',
  premium_themes: '🎨'
}

// 方法
function formatDate(date: string | null) {
  if (!date) return ''
  return formatDateUtil(date, 'YYYY年MM月DD日')
}

function getBenefitIcon(key: string) {
  return benefitIcons[key] || '✨'
}

function getBestValue(plan: VipPlan): string {
  // 根据套餐类型返回标签
  if (plan.id.includes('year') || plan.name.includes('年')) {
    return '最划算'
  }
  if (plan.id.includes('quarter') || plan.name.includes('季')) {
    return '推荐'
  }
  return ''
}

function selectPlan(planId: string) {
  selectedPlanId.value = planId
}

async function loadVipInfo() {
  loading.value = true
  try {
    vipInfo.value = await vipApi.getInfo()
    // 默认选中第一个套餐
    if (vipInfo.value.plans?.length) {
      selectedPlanId.value = vipInfo.value.plans[0].id
    }
  } catch (error) {
    console.error('加载会员信息失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handlePurchase() {
  if (!selectedPlanId.value || purchasing.value) return

  purchasing.value = true
  try {
    // 创建订单
    const { orderId, paymentParams } = await vipApi.createOrder(selectedPlanId.value)

    // 调用微信支付
    await new Promise<void>((resolve, reject) => {
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType as 'RSA' | 'MD5',
        paySign: paymentParams.paySign,
        success: () => resolve(),
        fail: (err) => reject(err)
      })
    })

    // 支付成功，轮询订单状态
    let retryCount = 0
    const maxRetry = 10
    while (retryCount < maxRetry) {
      await new Promise(r => setTimeout(r, 1000))
      const orderStatus = await vipApi.getOrderStatus(orderId)
      if (orderStatus.status === 'paid') {
        uni.showToast({ title: '开通成功', icon: 'success' })
        // 刷新页面
        await loadVipInfo()
        break
      }
      retryCount++
    }
  } catch (error: any) {
    if (error.errMsg?.includes('cancel')) {
      uni.showToast({ title: '已取消支付', icon: 'none' })
    } else {
      uni.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      })
    }
  } finally {
    purchasing.value = false
  }
}

// 生命周期
onMounted(() => {
  loadVipInfo()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.vip-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $spacing-base;
  padding-bottom: 200rpx;
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

.vip-card {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: $radius-xl;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  overflow: hidden;
  color: #fff;

  &.is-vip {
    background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
  }
}

.vip-badge {
  @include flex-center;
  justify-content: flex-start;
  margin-bottom: $spacing-sm;
}

.badge-icon {
  font-size: 48rpx;
  margin-right: $spacing-xs;
}

.badge-text {
  font-size: $font-size-lg;
  font-weight: 600;
}

.vip-status {
  padding-left: 8rpx;
}

.status-text {
  font-size: $font-size-sm;
  opacity: 0.9;
  display: block;
  margin-bottom: 4rpx;
}

.expire-date {
  font-size: $font-size-md;
  font-weight: 500;
}

.vip-decoration {
  position: absolute;
  right: $spacing-base;
  top: 50%;
  transform: translateY(-50%);
}

.star {
  position: absolute;
  opacity: 0.6;
  animation: twinkle 2s infinite;

  &.star-1 {
    right: 0;
    top: -20rpx;
    font-size: 32rpx;
    animation-delay: 0s;
  }

  &.star-2 {
    right: 40rpx;
    top: 10rpx;
    font-size: 24rpx;
    animation-delay: 0.5s;
  }

  &.star-3 {
    right: 20rpx;
    top: 40rpx;
    font-size: 28rpx;
    animation-delay: 1s;
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.card {
  background: #fff;
  border-radius: $radius-lg;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
  box-shadow: $shadow-sm;
}

.section-header {
  margin-bottom: $spacing-base;
}

.section-title {
  font-size: $font-size-md;
  font-weight: 500;
  color: $text-primary;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.benefit-item {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-base;
  border: 2rpx solid transparent;

  &.enabled {
    background: rgba($primary-color, 0.1);
    border-color: $primary-color;
  }
}

.benefit-icon {
  font-size: 48rpx;
  margin-bottom: $spacing-xs;
}

.benefit-name {
  font-size: $font-size-sm;
  color: $text-primary;
  margin-bottom: 4rpx;
  text-align: center;
}

.benefit-status {
  font-size: $font-size-xs;
}

.status-on {
  color: $success-color;
}

.status-off {
  color: $text-placeholder;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.plan-item {
  display: flex;
  align-items: center;
  padding: $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-base;
  border: 2rpx solid $border-color;
  position: relative;

  &.selected {
    background: rgba($primary-color, 0.08);
    border-color: $primary-color;
  }
}

.plan-info {
  flex: 1;
}

.plan-name {
  display: block;
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.plan-price {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: $font-size-sm;
  color: $error-color;
  font-weight: 600;
}

.price-value {
  font-size: $font-size-xl;
  color: $error-color;
  font-weight: 600;
}

.original-price {
  font-size: $font-size-sm;
  color: $text-placeholder;
  text-decoration: line-through;
  margin-left: $spacing-xs;
}

.plan-tag {
  position: absolute;
  top: 0;
  right: 60rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-size: $font-size-xs;
  padding: 4rpx 12rpx;
  border-radius: 0 0 $radius-sm $radius-sm;
}

.plan-check {
  margin-left: $spacing-sm;
}

.check-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  @include flex-center;
  color: #fff;
  font-size: $font-size-sm;

  &.checked {
    background: $primary-color;
    border-color: $primary-color;
  }
}

.purchase-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: $spacing-base;
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.price-display {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.price-display .label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-right: $spacing-xs;
}

.price-display .amount {
  display: flex;
  align-items: baseline;
}

.price-display .symbol {
  font-size: $font-size-base;
  color: $error-color;
  font-weight: 600;
}

.price-display .value {
  font-size: 48rpx;
  color: $error-color;
  font-weight: 600;
}

.purchase-btn {
  width: 280rpx;
  height: 88rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: #fff;
  font-size: $font-size-md;
  font-weight: 500;
  border-radius: 44rpx;
  @include flex-center;

  &[disabled] {
    opacity: 0.6;
  }
}

.tips-section {
  padding: $spacing-base 0;
}

.tip-item {
  display: flex;
  align-items: center;
  padding: $spacing-xs 0;
}

.tip-icon {
  margin-right: $spacing-xs;
  font-size: $font-size-base;
}

.tip-text {
  font-size: $font-size-sm;
  color: $text-placeholder;
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
