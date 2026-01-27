<template>
    <view
        class="page benefits-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="权益中心" />

        <!-- 页面内容 -->
        <view
            class="page-content"
            :style="{ paddingTop: navBarHeight + 'px' }"
        >
            <!-- 积分头部 -->
            <view class="points-header">
                <text class="points-label">幸运积分</text>
                <text class="points-number">{{ userPoints }}</text>
                <text class="header-subtitle">通过记梦、完成任务获取积分，兑换专属权益</text>
            </view>

            <!-- 当前特权状态 -->
            <view
                class="privilege-status"
                v-if="hasPrivilege"
            >
                <view class="privilege-badge">
                    <image
                        class="privilege-badge-icon"
                        src="/static/icons/sparkle.svg"
                        mode="aspectFit"
                    />
                    <text class="privilege-text">特权生效中</text>
                </view>
                <text class="privilege-expire">{{ privilegeExpireText }}</text>
            </view>

            <!-- 积分获取方式 -->
            <view class="earn-section">
                <text class="section-title">积分获取</text>
                <view class="earn-grid">
                    <view
                        class="earn-card"
                        v-for="(way, index) in earnWays"
                        :key="index"
                    >
                        <view class="earn-icon-wrap">
                            <image
                                class="earn-icon"
                                :src="way.icon"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="earn-info">
                            <text class="earn-name">{{ way.name }}</text>
                            <text class="earn-points">+{{ way.points }} 积分</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 权益卡片 -->
            <view class="earn-section">
                <text class="section-title">可享权益</text>
            </view>
            <view class="benefit-grid">
                <view
                    class="benefit-card"
                    v-for="(benefit, index) in benefits"
                    :key="index"
                >
                    <view class="benefit-icon-wrap">
                        <image
                            class="benefit-icon"
                            :src="benefit.icon"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="benefit-name">{{ benefit.name }}</text>
                    <text class="benefit-desc">{{ benefit.desc }}</text>
                </view>
            </view>

            <!-- 积分兑换 -->
            <view class="exchange-section">
                <text class="section-title">积分兑换</text>

                <view class="exchange-list">
                    <view
                        class="exchange-item"
                        :class="{ active: selectedExchange === item.id, disabled: userPoints < item.points }"
                        @tap="selectExchange(item)"
                        v-for="item in exchangeItems"
                        :key="item.id"
                    >
                        <view
                            class="exchange-tag"
                            v-if="item.tag"
                            >{{ item.tag }}</view
                        >
                        <view class="exchange-left">
                            <text class="exchange-name">{{ item.name }}</text>
                            <text class="exchange-duration">{{ item.duration }}</text>
                        </view>
                        <view class="exchange-right">
                            <text class="price-current">{{ item.points }} 积分</text>
                            <text
                                class="price-original"
                                v-if="item.originalPoints"
                                >{{ item.originalPoints }} 积分</text
                            >
                        </view>
                    </view>
                </view>

                <!-- 兑换按钮 -->
                <view
                    class="exchange-btn"
                    :class="{ disabled: !canExchange }"
                    @tap="handleExchange"
                >
                    <text>{{ exchangeButtonText }}</text>
                </view>

                <!-- 提示 -->
                <view class="tips">
                    <view class="tip-item">
                        <image
                            class="tip-icon"
                            src="/static/icons/lamp.svg"
                            mode="aspectFit"
                        />
                        <text>连续打卡7天可免费获得1天免广告特权</text>
                    </view>
                    <view class="tip-item">
                        <image
                            class="tip-icon"
                            src="/static/icons/lamp.svg"
                            mode="aspectFit"
                        />
                        <text>看广告可额外获得积分奖励</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import NavBar from '@/components/NavBar/index.vue';
import { useUserStore } from '@/stores/modules/user';
import { privilegeApi } from '@/api/modules/vip';

const userStore = useUserStore();

// 加载状态
const loading = ref(false);

// 导航栏高度
const navBarHeight = ref(0);

// 用户积分
const userPoints = computed(() => userStore.userInfo?.luckyPoints || 0);

// 特权状态
const hasPrivilege = computed(() => userStore.userInfo?.isVip || false);
const privilegeExpireText = computed(() => {
    if (!userStore.userInfo?.vipExpireAt) return '';
    const expireDate = new Date(userStore.userInfo.vipExpireAt);
    const now = new Date();
    const days = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `剩余 ${days} 天` : '已过期';
});

// 积分获取方式 - 使用SVG图标
const earnWays = [
    { icon: '/static/icons/moon.svg', name: '每日记梦', points: 10 },
    { icon: '/static/icons/check.svg', name: '完成任务', points: 10 },
    { icon: '/static/icons/video.svg', name: '看广告翻倍', points: 10 },
    { icon: '/static/icons/fire.svg', name: '连续打卡奖励', points: '20-200' },
    { icon: '/static/icons/trophy.svg', name: '解锁成就', points: '10-100' },
    { icon: '/static/icons/share.svg', name: '分享梦境', points: 5 }
];

// 权益数据 - 使用SVG图标
const benefits = [
    { icon: '/static/icons/ban.svg', name: '免广告', desc: '解析无需看广告' },
    { icon: '/static/icons/infinity.svg', name: '无限润色', desc: '不限次数AI润色' },
    { icon: '/static/icons/book.svg', name: '历史查看', desc: '查看全部历史记录' },
    { icon: '/static/icons/crystal.svg', name: '深度解析', desc: '更详细的心理分析' }
];

// 兑换项目（从后端获取）
const exchangeItems = ref<
    {
        id: string;
        name: string;
        duration: string;
        points: number;
        originalPoints: number | null;
        tag?: string;
    }[]
>([]);

// 选中的兑换项
const selectedExchange = ref('');

// 当前选中项
const currentExchange = computed(() => {
    return exchangeItems.value.find((item) => item.id === selectedExchange.value);
});

// 是否可以兑换
const canExchange = computed(() => {
    if (!currentExchange.value) return false;
    return userPoints.value >= currentExchange.value.points;
});

// 兑换按钮文字
const exchangeButtonText = computed(() => {
    if (!currentExchange.value) return '请选择权益';
    if (userPoints.value < currentExchange.value.points) {
        return `积分不足（还差 ${currentExchange.value.points - userPoints.value} 积分）`;
    }
    return `立即兑换 ${currentExchange.value.points} 积分`;
});

// 加载权益信息
async function loadPrivilegeInfo() {
    try {
        loading.value = true;
        const info = await privilegeApi.getInfo();

        // 更新兑换项目列表
        exchangeItems.value = info.exchangeItems.map((item) => {
            // 根据时长设置标签
            let tag = '';
            if (item.duration.includes('30')) {
                tag = '超值推荐';
            } else if (item.duration.includes('365')) {
                tag = '最划算';
            }
            return {
                ...item,
                duration: `有效期 ${item.duration}`,
                tag
            };
        });

        // 默认选中第一个可兑换的项目
        const firstAffordable = exchangeItems.value.find((item) => userPoints.value >= item.points);
        if (firstAffordable) {
            selectedExchange.value = firstAffordable.id;
        } else if (exchangeItems.value.length > 0) {
            selectedExchange.value = exchangeItems.value[0].id;
        }
    } catch (error) {
        console.error('加载权益信息失败:', error);
    } finally {
        loading.value = false;
    }
}

// 方法
function selectExchange(item: (typeof exchangeItems.value)[0]) {
    if (userPoints.value >= item.points) {
        selectedExchange.value = item.id;
    } else {
        uni.showToast({ title: '积分不足', icon: 'none' });
    }
}

async function handleExchange() {
    if (!canExchange.value) {
        uni.showToast({ title: '积分不足，快去记梦吧！', icon: 'none' });
        return;
    }

    const item = currentExchange.value;
    if (!item) return;

    uni.showModal({
        title: '确认兑换',
        content: `确定消耗 ${item.points} 积分兑换「${item.name}」(${item.duration})？`,
        success: async (res) => {
            if (res.confirm) {
                uni.showLoading({ title: '兑换中...' });
                try {
                    await privilegeApi.exchange(item.id);

                    // 更新用户状态
                    await userStore.fetchUserInfo();

                    uni.hideLoading();
                    uni.showToast({ title: '兑换成功！', icon: 'success' });

                    // 刷新权益信息
                    await loadPrivilegeInfo();
                } catch (error: any) {
                    uni.hideLoading();
                    uni.showToast({ title: error.message || '兑换失败', icon: 'none' });
                }
            }
        }
    });
}

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    // 导航栏高度 = 状态栏高度 + 导航内容高度(44px)
    navBarHeight.value = statusBarHeight + 44;

    // 加载权益信息
    loadPrivilegeInfo();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.benefits-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8f5ff 0%, #ffffff 100%);
    color: $text-primary;
    transition: background 0.3s ease;
}

.page-content {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

// 积分头部
.points-header {
    padding: 40rpx 48rpx 80rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400rpx;
        height: 400rpx;
        background: radial-gradient(circle, rgba(107, 78, 255, 0.15) 0%, transparent 70%);
        filter: blur(60rpx);
        animation: pulse 4s ease-in-out infinite;
        pointer-events: none;
    }
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(1);
    }
    50% {
        opacity: 0.8;
        transform: translate(-50%, -50%) scale(1.2);
    }
}

.points-label {
    font-size: 28rpx;
    color: $text-secondary;
    margin-bottom: 16rpx;
}

.points-number {
    font-size: 96rpx;
    font-weight: 800;
    background: linear-gradient(135deg, #6b4eff 0%, #8b6eff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-bottom: 24rpx;
}

.header-subtitle {
    font-size: 26rpx;
    color: $text-secondary;
}

// 特权状态
.privilege-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 20rpx 40rpx;
    margin: -20rpx 40rpx 40rpx;
    background: rgba(107, 78, 255, 0.08);
    border-radius: 16rpx;
    border: 2rpx solid rgba(107, 78, 255, 0.2);
}

.privilege-badge {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.privilege-badge-icon {
    width: 32rpx;
    height: 32rpx;
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
}

.privilege-text {
    font-size: 28rpx;
    font-weight: 600;
    color: $primary-color;
}

.privilege-expire {
    font-size: 24rpx;
    color: $text-secondary;
}

// 积分获取
.earn-section {
    padding: 32rpx 40rpx;
}

.section-title {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 24rpx;
}

.earn-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
}

.earn-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.earn-icon-wrap {
    width: 48rpx;
    height: 48rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.earn-icon {
    width: 40rpx;
    height: 40rpx;
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
}

.earn-info {
    flex: 1;
    min-width: 0;
}

.earn-name {
    display: block;
    font-size: 26rpx;
    color: $text-primary;
    margin-bottom: 4rpx;
}

.earn-points {
    font-size: 24rpx;
    color: $primary-color;
    font-weight: 600;
}

// 权益网格
.benefit-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
    padding: 0 40rpx;
    margin-top: 24rpx;
}

.benefit-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 32rpx 24rpx;
    text-align: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.benefit-icon-wrap {
    width: 72rpx;
    height: 72rpx;
    margin: 0 auto 16rpx;
    background: linear-gradient(135deg, rgba(107, 78, 255, 0.15) 0%, rgba(107, 78, 255, 0.05) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.benefit-icon {
    width: 40rpx;
    height: 40rpx;
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
}

.benefit-name {
    display: block;
    font-size: 26rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
}

.benefit-desc {
    font-size: 22rpx;
    color: $text-secondary;
}

// 积分兑换
.exchange-section {
    padding: 48rpx 40rpx;
    padding-bottom: calc(80rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.exchange-list {
    margin-top: 24rpx;
}

.exchange-item {
    background: #fff;
    border: 4rpx solid #f0f0f0;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    transition: all 0.2s ease;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

    &.active {
        border-color: $primary-color;
        background: rgba(107, 78, 255, 0.04);
        box-shadow: 0 8rpx 32rpx rgba(107, 78, 255, 0.15);
    }

    &.disabled {
        opacity: 0.5;
    }

    &:active {
        transform: scale(0.98);
    }
}

.exchange-tag {
    position: absolute;
    top: -16rpx;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, #6b4eff 0%, #8b6eff 100%);
    color: #fff;
    font-size: 20rpx;
    padding: 4rpx 20rpx;
    border-radius: 20rpx;
    font-weight: 700;
    box-shadow: 0 4rpx 12rpx rgba(107, 78, 255, 0.4);
    white-space: nowrap;
}

.exchange-left {
    flex: 1;
}

.exchange-name {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
}

.exchange-duration {
    font-size: 24rpx;
    color: $text-secondary;
}

.exchange-right {
    text-align: right;
}

.price-current {
    display: block;
    font-size: 36rpx;
    font-weight: 800;
    color: $primary-color;
    line-height: 1.2;
}

.price-original {
    font-size: 22rpx;
    color: $text-placeholder;
    text-decoration: line-through;
    margin-top: 4rpx;
}

// 兑换按钮
.exchange-btn {
    background: linear-gradient(135deg, #6b4eff 0%, #8b6eff 100%);
    color: #fff;
    font-weight: 800;
    width: calc(100% - 56rpx);
    padding: 28rpx;
    border-radius: 56rpx;
    font-size: 30rpx;
    text-align: center;
    box-shadow: 0 12rpx 48rpx rgba(107, 78, 255, 0.3);
    transition: all 0.2s ease;
    margin-top: 32rpx;

    &.disabled {
        opacity: 0.6;
        box-shadow: none;
    }

    &:active:not(.disabled) {
        transform: scale(0.98);
        box-shadow: 0 8rpx 32rpx rgba(107, 78, 255, 0.2);
    }
}

// 提示
.tips {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    padding: 24rpx;
    margin-top: 32rpx;
    background: rgba(107, 78, 255, 0.06);
    border-radius: 16rpx;
    border: 2rpx solid rgba(107, 78, 255, 0.1);
}

.tip-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 24rpx;
    color: $text-secondary;
    line-height: 1.5;
}

.tip-icon {
    width: 28rpx;
    height: 28rpx;
    flex-shrink: 0;
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
}

// 暗黑模式
.benefits-page.dark-mode {
    background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
    color: $dark-text-primary;

    .points-header::before {
        background: radial-gradient(circle, rgba(107, 78, 255, 0.3) 0%, transparent 70%);
    }

    .points-label {
        color: $dark-text-secondary;
    }

    .points-number {
        background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .header-subtitle {
        color: $dark-text-secondary;
    }

    .privilege-status {
        background: rgba(107, 78, 255, 0.15);
        border-color: rgba(107, 78, 255, 0.3);
    }

    .privilege-badge-icon {
        filter: brightness(0) saturate(100%) invert(83%) sepia(45%) saturate(1000%) hue-rotate(359deg) brightness(103%)
            contrast(104%);
    }

    .privilege-text {
        color: #ffd700;
    }

    .privilege-expire {
        color: $dark-text-secondary;
    }

    .section-title {
        color: #fff;
    }

    .earn-card {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: none;
        border: 2rpx solid rgba(255, 255, 255, 0.08);
    }

    .earn-icon {
        filter: brightness(0) saturate(100%) invert(83%) sepia(45%) saturate(1000%) hue-rotate(359deg) brightness(103%)
            contrast(104%);
    }

    .earn-name {
        color: #fff;
    }

    .earn-points {
        color: #ffd700;
    }

    .benefit-card {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: none;
        border: 2rpx solid rgba(255, 255, 255, 0.08);
    }

    .benefit-icon {
        filter: brightness(0) saturate(100%) invert(50%) sepia(98%) saturate(2000%) hue-rotate(230deg) brightness(100%)
            contrast(95%);
    }

    .benefit-name {
        color: #fff;
    }

    .benefit-desc {
        color: $dark-text-secondary;
    }

    .exchange-item {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: none;

        &.active {
            border-color: rgba(107, 78, 255, 0.6);
            background: rgba(107, 78, 255, 0.08);
            box-shadow: 0 8rpx 32rpx rgba(107, 78, 255, 0.3);
        }
    }

    .exchange-name {
        color: #fff;
    }

    .exchange-duration {
        color: $dark-text-secondary;
    }

    .price-current {
        color: #ffd700;
    }

    .price-original {
        color: $dark-text-placeholder;
    }

    .exchange-btn {
        box-shadow: 0 12rpx 48rpx rgba(107, 78, 255, 0.4);

        &:active:not(.disabled) {
            box-shadow: 0 8rpx 32rpx rgba(107, 78, 255, 0.3);
        }
    }

    .tips {
        background: rgba(255, 215, 0, 0.08);
        border-color: rgba(255, 215, 0, 0.15);
    }

    .tip-item {
        color: $dark-text-secondary;
    }

    .tip-icon {
        filter: brightness(0) saturate(100%) invert(83%) sepia(45%) saturate(1000%) hue-rotate(359deg) brightness(103%)
            contrast(104%);
    }
}
</style>
