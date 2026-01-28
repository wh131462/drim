<template>
    <view
        class="modal-overlay"
        v-if="visible"
        @tap="handleClose"
    >
        <view
            class="modal-content"
            @tap.stop
        >
            <!-- 成功图标 -->
            <view class="success-icon">
                <image
                    class="icon-svg"
                    src="/static/icons/celebrate.svg"
                    mode="aspectFit"
                />
            </view>

            <!-- 标题 -->
            <view class="modal-header">
                <text class="modal-title">记梦成功！</text>
                <text class="modal-subtitle">已获得幸运值奖励</text>
            </view>

            <!-- 奖励明细 -->
            <view class="rewards-list">
                <view
                    v-if="dreamReward > 0"
                    class="reward-item"
                >
                    <view class="reward-icon-wrap reward-icon-dream">
                        <image
                            class="reward-icon-svg"
                            src="/static/icons/star-magic.svg"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="reward-label">记梦奖励</text>
                    <text class="reward-value">+{{ dreamReward }}</text>
                </view>

                <view
                    v-if="streakReward > 0"
                    class="reward-item"
                >
                    <view class="reward-icon-wrap reward-icon-streak">
                        <image
                            class="reward-icon-svg"
                            src="/static/icons/clover.svg"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="reward-label">连续{{ streakDays }}天</text>
                    <text class="reward-value">+{{ streakReward }}</text>
                </view>
            </view>

            <!-- 总计 -->
            <view class="total-section">
                <text class="total-label">共获得</text>
                <text class="total-value">+{{ totalReward }}</text>
                <text class="total-unit">幸运值</text>
            </view>

            <!-- 确认按钮 -->
            <button
                class="btn-confirm"
                @tap="handleClose"
            >
                开始解读
            </button>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        visible: boolean;
        dreamReward?: number;
        streakReward?: number;
        streakDays?: number;
    }>(),
    {
        dreamReward: 0,
        streakReward: 0,
        streakDays: 0
    }
);

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
}>();

// 计算总奖励
const totalReward = computed(() => props.dreamReward + props.streakReward);

/**
 * 关闭弹窗
 */
function handleClose() {
    emit('update:visible', false);
    emit('close');
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 48rpx;
}

.modal-content {
    width: 100%;
    max-width: 600rpx;
    background: #fff;
    border-radius: 40rpx;
    padding: 60rpx 40rpx 48rpx;
    animation: modalIn 0.3s ease;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(20rpx);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

// 成功图标
.success-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24rpx;
}

.icon-svg {
    width: 96rpx;
    height: 96rpx;
}

// 标题
.modal-header {
    text-align: center;
    margin-bottom: 40rpx;
}

.modal-title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 12rpx;
}

.modal-subtitle {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
}

// 奖励明细
.rewards-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 32rpx;
}

.reward-item {
    display: flex;
    align-items: center;
    padding: 24rpx 28rpx;
    background: #f7f8fa;
    border-radius: 20rpx;
}

.reward-icon-wrap {
    width: 56rpx;
    height: 56rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    flex-shrink: 0;
}

.reward-icon-dream {
    background: linear-gradient(135deg, rgba(107, 78, 255, 0.15) 0%, rgba(139, 110, 255, 0.1) 100%);
}

.reward-icon-streak {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.1) 100%);
}

.reward-icon-svg {
    width: 32rpx;
    height: 32rpx;
}

.reward-label {
    flex: 1;
    font-size: 28rpx;
    color: $text-primary;
}

.reward-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #ff9800;
}

// 总计
.total-section {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8rpx;
    margin-bottom: 40rpx;
    padding: 24rpx;
    background: linear-gradient(135deg, #fff8e7 0%, #ffefdb 100%);
    border-radius: 20rpx;
}

.total-label {
    font-size: 28rpx;
    color: $text-secondary;
}

.total-value {
    font-size: 56rpx;
    font-weight: 700;
    color: #ff9800;
}

.total-unit {
    font-size: 28rpx;
    color: $text-secondary;
}

// 确认按钮
.btn-confirm {
    width: 100%;
    height: 96rpx;
    background: $primary-gradient;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 48rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(107, 78, 255, 0.3);

    &::after {
        display: none;
    }

    &:active {
        opacity: 0.9;
    }
}

// 暗黑模式适配
@media (prefers-color-scheme: dark) {
    .modal-overlay {
        background: rgba(0, 0, 0, 0.8);
    }

    .modal-content {
        background: $dark-bg-card;
    }

    .modal-title {
        color: $dark-text-primary;
    }

    .modal-subtitle {
        color: $dark-text-secondary;
    }

    .reward-item {
        background: $dark-bg-secondary;
    }

    .reward-label {
        color: $dark-text-primary;
    }

    .total-section {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 183, 77, 0.1) 100%);
    }

    .total-label,
    .total-unit {
        color: $dark-text-secondary;
    }

    .btn-confirm {
        box-shadow: $dark-shadow-primary;
    }
}
</style>
