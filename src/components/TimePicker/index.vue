<template>
    <view
        v-if="visible"
        class="time-picker-mask"
        :class="{ 'dark-mode': isDark }"
        @tap="handleCancel"
    >
        <view
            class="time-picker-panel"
            :class="{ 'slide-up': animating }"
            @tap.stop
        >
            <!-- 顶部操作栏 -->
            <view class="picker-header">
                <text
                    class="picker-btn cancel-btn"
                    @tap="handleCancel"
                    >取消</text
                >
                <text class="picker-title">选择提醒时间</text>
                <text
                    class="picker-btn confirm-btn"
                    @tap="handleConfirm"
                    >确定</text
                >
            </view>

            <!-- 滚动选择器 -->
            <picker-view
                class="picker-view"
                :value="pickerValue"
                :indicator-style="indicatorStyle"
                @change="onPickerChange"
            >
                <picker-view-column>
                    <view
                        v-for="h in hours"
                        :key="h"
                        class="picker-item"
                    >
                        {{ h }}
                    </view>
                </picker-view-column>
                <picker-view-column>
                    <view class="picker-item picker-separator">:</view>
                </picker-view-column>
                <picker-view-column>
                    <view
                        v-for="m in minutes"
                        :key="m"
                        class="picker-item"
                    >
                        {{ m }}
                    </view>
                </picker-view-column>
            </picker-view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps<{
    modelValue: boolean;
    time?: string;
    isDark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', time: string): void;
}>();

const visible = ref(false);
const animating = ref(false);

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// 分隔符列固定在中间位置
const separatorIndex = 0;

const pickerValue = ref([8, 0, 0]);

const indicatorStyle = computed(() => {
    return props.isDark
        ? 'height: 88rpx; border-top: 1px solid #333; border-bottom: 1px solid #333;'
        : 'height: 88rpx; border-top: 1px solid #eee; border-bottom: 1px solid #eee;';
});

// 解析初始时间
function parseTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    pickerValue.value = [h || 0, separatorIndex, m || 0];
}

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            parseTime(props.time || '08:00');
            visible.value = true;
            nextTick(() => {
                animating.value = true;
            });
        } else {
            animating.value = false;
            setTimeout(() => {
                visible.value = false;
            }, 300);
        }
    },
    { immediate: true }
);

function onPickerChange(e: any) {
    const vals = e.detail.value as number[];
    // 保持分隔符列固定
    pickerValue.value = [vals[0], separatorIndex, vals[2]];
}

function handleCancel() {
    emit('update:modelValue', false);
}

function handleConfirm() {
    const h = hours[pickerValue.value[0]];
    const m = minutes[pickerValue.value[2]];
    emit('confirm', `${h}:${m}`);
    emit('update:modelValue', false);
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.time-picker-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: flex;
    align-items: flex-end;
}

.time-picker-panel {
    width: 100%;
    background: #fff;
    border-radius: 32rpx 32rpx 0 0;
    padding-bottom: $safe-area-bottom;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.slide-up {
        transform: translateY(0);
    }
}

.picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.picker-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
}

.picker-btn {
    font-size: 28rpx;
    padding: 8rpx 16rpx;
}

.cancel-btn {
    color: $text-secondary;
}

.confirm-btn {
    color: $primary-color;
    font-weight: 600;
}

.picker-view {
    width: 100%;
    height: 480rpx;
}

.picker-item {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    font-weight: 500;
    color: $text-primary;
    height: 88rpx;
    font-variant-numeric: tabular-nums;
}

.picker-separator {
    font-size: 48rpx;
    font-weight: 700;
    color: $primary-color;
}

// 暗黑模式
.dark-mode {
    .time-picker-panel {
        background: $dark-bg-card;
    }

    .picker-header {
        border-bottom-color: $dark-border-color;
    }

    .picker-title {
        color: $dark-text-primary;
    }

    .cancel-btn {
        color: $dark-text-secondary;
    }

    .confirm-btn {
        color: $dark-primary-color;
    }

    .picker-item {
        color: $dark-text-primary;
    }

    .picker-separator {
        color: $dark-primary-color;
    }
}
</style>
