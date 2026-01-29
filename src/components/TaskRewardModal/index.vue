<template>
    <view
        class="modal-overlay"
        v-if="visible"
        @tap="handleOverlayTap"
    >
        <view
            class="modal-content"
            @tap.stop
        >
            <!-- 成功图标 -->
            <view class="success-icon">
                <image
                    class="icon-svg"
                    :src="completed ? '/static/icons/celebrate.svg' : '/static/icons/sparkle.svg'"
                    mode="aspectFit"
                />
            </view>

            <!-- 标题 -->
            <view class="modal-header">
                <text class="modal-title">{{ completed ? '恭喜完成任务！' : '任务完成！' }}</text>
                <text class="modal-subtitle">
                    {{ completed ? `已获得 ${earnedPoints} 幸运值` : '选择领取方式' }}
                </text>
            </view>

            <!-- 奖励选项 -->
            <view
                class="reward-options"
                v-if="!completed"
            >
                <!-- 看视频双倍奖励（仅广告开通后显示） -->
                <view
                    v-if="adEnabled"
                    class="reward-option option-video"
                    @tap="handleWatchVideo"
                >
                    <view class="option-left">
                        <view class="option-icon-wrap option-icon-video">
                            <image
                                class="option-icon-svg"
                                src="/static/icons/video.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="option-info">
                            <text class="option-title">看视频领双倍</text>
                            <text class="option-desc">观看短视频，奖励翻倍</text>
                        </view>
                    </view>
                    <view class="option-right">
                        <text class="points-value">+{{ doublePoints }}</text>
                        <text class="points-unit">幸运值</text>
                    </view>
                </view>

                <!-- 直接领取 -->
                <view
                    class="reward-option"
                    :class="adEnabled ? 'option-normal' : 'option-primary'"
                    @tap="handleDirectClaim"
                >
                    <view class="option-left">
                        <view class="option-icon-wrap option-icon-clover">
                            <image
                                class="option-icon-svg"
                                src="/static/icons/clover.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="option-info">
                            <text class="option-title">{{ adEnabled ? '直接领取' : '领取奖励' }}</text>
                            <text class="option-desc">{{ adEnabled ? '获得基础奖励' : '完成任务奖励' }}</text>
                        </view>
                    </view>
                    <view class="option-right">
                        <text class="points-value">+{{ basePoints }}</text>
                        <text class="points-unit">幸运值</text>
                    </view>
                </view>
            </view>

            <!-- 完成状态 -->
            <view
                class="completed-section"
                v-else
            >
                <view class="points-display">
                    <text class="points-label">获得</text>
                    <text class="points-number">+{{ earnedPoints }}</text>
                    <text class="points-suffix">幸运值</text>
                </view>
                <button
                    class="btn-confirm"
                    @tap="handleClose"
                >
                    太棒了
                </button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { rewardedVideoAd, isAdEnabled } from '@/utils/ad';
import { pointsApi } from '@/api';
import { useUserStore } from '@/stores';

// 广告功能是否开启
const adEnabled = isAdEnabled();

const props = withDefaults(
    defineProps<{
        visible: boolean;
        taskId?: string;
        basePoints?: number;
    }>(),
    {
        basePoints: 10
    }
);

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'complete', data: { points: number; isDouble: boolean }): void;
}>();

const userStore = useUserStore();
const completed = ref(false);
const earnedPoints = ref(0);
const loading = ref(false);

// 计算双倍奖励积分
const doublePoints = computed(() => props.basePoints * 2);

/**
 * 看视频领取双倍奖励
 */
async function handleWatchVideo() {
    if (loading.value) return;
    loading.value = true;

    try {
        // 播放激励视频广告
        const result = await rewardedVideoAd.show('task_double');

        if (result.success && result.isEnded) {
            // 用户完整观看视频，领取双倍奖励
            const response = await pointsApi.claimAdReward('task_double', '任务奖励翻倍');

            if (response.success) {
                // 基础奖励 + 广告额外奖励 = 双倍
                earnedPoints.value = doublePoints.value;
                completed.value = true;

                // 更新用户积分
                await userStore.fetchUserInfo();

                emit('complete', { points: earnedPoints.value, isDouble: true });
            }
        } else if (result.success && !result.isEnded) {
            // 用户提前关闭视频，不发放额外奖励
            uni.showToast({
                title: '需完整观看视频才能获得双倍奖励',
                icon: 'none'
            });
        } else {
            // 广告加载失败，降级为直接领取
            uni.showToast({
                title: result.errMsg || '广告加载失败',
                icon: 'none'
            });
        }
    } catch (error: any) {
        console.error('看视频领取失败:', error);
        uni.showToast({
            title: error.message || '领取失败',
            icon: 'none'
        });
    } finally {
        loading.value = false;
    }
}

/**
 * 直接领取基础奖励
 */
async function handleDirectClaim() {
    if (loading.value) return;

    earnedPoints.value = props.basePoints;
    completed.value = true;
    emit('complete', { points: earnedPoints.value, isDouble: false });
}

/**
 * 点击遮罩层
 */
function handleOverlayTap() {
    if (loading.value) return;

    // 如果还没领取奖励，默认执行直接领取
    if (!completed.value) {
        handleDirectClaim();
        return;
    }

    // 已领取完成，关闭弹窗
    handleClose();
}

/**
 * 关闭弹窗
 */
function handleClose() {
    if (loading.value) return;

    completed.value = false;
    earnedPoints.value = 0;
    emit('update:visible', false);
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
    filter: none;
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

// 奖励选项
.reward-options {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.reward-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-radius: 24rpx;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.option-video {
    background: linear-gradient(135deg, #fff8e7 0%, #ffefdb 100%);
    border: 2rpx solid rgba(255, 183, 77, 0.3);
}

.option-normal {
    background: #f7f8fa;
    border: 2rpx solid transparent;
}

.option-primary {
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
    border: 2rpx solid rgba(76, 175, 80, 0.3);

    .points-value {
        color: #4caf50;
    }
}

.option-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.option-icon-wrap {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.option-icon-video {
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 183, 77, 0.1) 100%);
}

.option-icon-clover {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.1) 100%);
}

.option-icon-svg {
    width: 36rpx;
    height: 36rpx;
}

.option-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.option-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
}

.option-desc {
    font-size: 24rpx;
    color: $text-secondary;
}

.option-right {
    text-align: right;
}

.points-value {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #ff9800;
}

.points-unit {
    display: block;
    font-size: 22rpx;
    color: $text-secondary;
}

// 完成状态
.completed-section {
    text-align: center;
}

.points-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8rpx;
    margin-bottom: 40rpx;
}

.points-label {
    font-size: 28rpx;
    color: $text-secondary;
}

.points-number {
    font-size: 72rpx;
    font-weight: 700;
    color: #ff9800;
}

.points-suffix {
    font-size: 28rpx;
    color: $text-secondary;
}

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

    .option-video {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 183, 77, 0.1) 100%);
        border-color: rgba(255, 152, 0, 0.3);
    }

    .option-normal {
        background: $dark-bg-secondary;
        border-color: $dark-border-color;
    }

    .option-primary {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.1) 100%);
        border-color: rgba(76, 175, 80, 0.3);
    }

    .option-title {
        color: $dark-text-primary;
    }

    .option-desc {
        color: $dark-text-secondary;
    }

    .points-unit {
        color: $dark-text-secondary;
    }

    .points-label,
    .points-suffix {
        color: $dark-text-secondary;
    }

    .btn-confirm {
        box-shadow: $dark-shadow-primary;
    }
}
</style>
