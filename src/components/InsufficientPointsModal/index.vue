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
            <!-- 图标 -->
            <view class="modal-icon">
                <image
                    class="status-icon"
                    :src="completed ? '/static/icons/celebrate.svg' : '/static/icons/warning.svg'"
                    mode="aspectFit"
                    aria-hidden="true"
                />
            </view>

            <!-- 标题 -->
            <view class="modal-header">
                <text class="modal-title">{{ completed ? '积分已到账！' : '积分不足' }}</text>
                <text
                    class="modal-subtitle"
                    v-if="!completed"
                >
                    当前积分：{{ currentPoints }}，所需积分：{{ requiredPoints }}
                </text>
                <text
                    class="modal-subtitle"
                    v-else
                >
                    已获得 {{ earnedPoints }} 幸运值
                </text>
            </view>

            <!-- 操作选项 -->
            <view
                class="action-options"
                v-if="!completed"
            >
                <!-- 看视频获取积分（仅广告开通后显示） -->
                <template v-if="adEnabled">
                    <view
                        class="action-option option-video"
                        @tap="handleWatchVideo"
                        v-if="canWatch()"
                    >
                        <view class="option-left">
                            <image
                                class="option-icon"
                                src="/static/icons/video.svg"
                                mode="aspectFit"
                                aria-hidden="true"
                            />
                            <view class="option-info">
                                <text class="option-title">看视频获取积分</text>
                                <text class="option-desc">今日剩余 {{ adStatus.remaining }} 次</text>
                            </view>
                        </view>
                        <view class="option-right">
                            <text class="points-value">+10</text>
                            <text class="points-unit">幸运值</text>
                        </view>
                    </view>

                    <!-- 广告次数用完提示 -->
                    <view
                        class="action-option option-disabled"
                        v-else
                    >
                        <view class="option-left">
                            <image
                                class="option-icon"
                                src="/static/icons/video.svg"
                                mode="aspectFit"
                                aria-hidden="true"
                            />
                            <view class="option-info">
                                <text class="option-title">今日广告次数已用完</text>
                                <text class="option-desc">明天再来获取积分吧</text>
                            </view>
                        </view>
                    </view>
                </template>

                <!-- 开通 VIP -->
                <view
                    class="action-option option-vip"
                    @tap="handleGoVip"
                >
                    <view class="option-left">
                        <image
                            class="option-icon"
                            src="/static/icons/crown.svg"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
                        <view class="option-info">
                            <text class="option-title">开通 VIP</text>
                            <text class="option-desc">无限次解析，无需积分</text>
                        </view>
                    </view>
                    <view class="option-arrow">
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
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
                <text class="current-points-text">当前积分：{{ currentPoints + earnedPoints }}</text>
                <button
                    class="btn-confirm"
                    @tap="handleContinue"
                >
                    继续{{ actionText }}
                </button>
            </view>

            <!-- 取消按钮 -->
            <view
                class="cancel-btn"
                v-if="!completed"
                @tap="handleClose"
            >
                <text>取消</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { rewardedVideoAd, isAdEnabled } from '@/utils/ad';
import { pointsApi } from '@/api';
import { useUserStore } from '@/stores';

// 广告功能是否开启
const adEnabled = isAdEnabled();

const props = withDefaults(
    defineProps<{
        visible: boolean;
        currentPoints: number;
        requiredPoints: number;
        actionType?: 'analysis' | 'polish';
    }>(),
    {
        actionType: 'analysis'
    }
);

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'success', points: number): void;
    (e: 'cancel'): void;
}>();

const userStore = useUserStore();
const completed = ref(false);
const earnedPoints = ref(0);
const loading = ref(false);

// 广告配额状态
const adStatus = reactive({
    total: 5,
    used: 0,
    remaining: 5
});

// 是否可以看广告
const canWatch = () => adStatus.remaining > 0;

// 操作文本
const actionText = props.actionType === 'analysis' ? '解析' : '润色';

/**
 * 获取广告配额
 */
async function fetchAdQuota() {
    try {
        const quota = await pointsApi.getAdQuota();
        Object.assign(adStatus, quota);
    } catch (error) {
        console.error('获取广告配额失败:', error);
    }
}

/**
 * 看视频获取积分
 */
async function handleWatchVideo() {
    if (loading.value || !canWatch()) return;
    loading.value = true;

    try {
        // 播放激励视频广告
        const result = await rewardedVideoAd.show('points_gain');

        if (result.success && result.isEnded) {
            // 用户完整观看视频，领取积分奖励
            const response = await pointsApi.claimAdReward('points_gain', '积分不足弹窗');

            if (response.success) {
                earnedPoints.value = response.points;
                completed.value = true;

                // 更新用户积分
                await userStore.fetchUserInfo();

                // 更新广告配额
                adStatus.remaining = response.remaining;
            }
        } else if (result.success && !result.isEnded) {
            // 用户提前关闭视频
            uni.showToast({
                title: '需完整观看视频才能获得积分',
                icon: 'none'
            });
        } else {
            // 广告加载失败
            uni.showToast({
                title: result.errMsg || '广告加载失败',
                icon: 'none'
            });
        }
    } catch (error: any) {
        console.error('看视频获取积分失败:', error);
        uni.showToast({
            title: error.message || '获取失败',
            icon: 'none'
        });
    } finally {
        loading.value = false;
    }
}

/**
 * 跳转 VIP 页面
 */
function handleGoVip() {
    emit('update:visible', false);
    uni.navigateTo({ url: '/pages/vip/index' });
}

/**
 * 继续操作（积分获取成功后）
 */
function handleContinue() {
    emit('success', earnedPoints.value);
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
    emit('cancel');
}

// 监听弹窗显示
watch(
    () => props.visible,
    (val) => {
        if (val) {
            fetchAdQuota();
        }
    }
);

onMounted(() => {
    if (props.visible) {
        fetchAdQuota();
    }
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

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

// 图标
.modal-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 24rpx;
}

.status-icon {
    width: 80rpx;
    height: 80rpx;
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

// 操作选项
.action-options {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 32rpx;
}

.action-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 24rpx;
    border-radius: 24rpx;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.option-video {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 2rpx solid rgba(33, 150, 243, 0.2);
}

.option-disabled {
    background: #f5f5f5;
    opacity: 0.6;

    &:active {
        transform: none;
    }
}

.option-vip {
    background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
    border: 2rpx solid rgba(255, 193, 7, 0.3);
}

.option-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.option-icon {
    width: 44rpx;
    height: 44rpx;
    flex-shrink: 0;
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
    color: #2196f3;
}

.points-unit {
    display: block;
    font-size: 22rpx;
    color: $text-secondary;
}

.option-arrow {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.arrow-icon {
    width: 32rpx;
    height: 32rpx;
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
    margin-bottom: 16rpx;
}

.points-label {
    font-size: 28rpx;
    color: $text-secondary;
}

.points-number {
    font-size: 72rpx;
    font-weight: 700;
    color: #2196f3;
}

.points-suffix {
    font-size: 28rpx;
    color: $text-secondary;
}

.current-points-text {
    display: block;
    font-size: 26rpx;
    color: $text-secondary;
    margin-bottom: 32rpx;
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

// 取消按钮
.cancel-btn {
    text-align: center;
    padding: 24rpx;
    margin-top: 8rpx;

    text {
        font-size: 28rpx;
        color: $text-secondary;
    }

    &:active {
        opacity: 0.7;
    }
}
</style>
