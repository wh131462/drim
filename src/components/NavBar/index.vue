<template>
    <view
        class="navbar"
        :style="{ paddingTop: statusBarHeight + 'px' }"
    >
        <view class="navbar-content">
            <view
                v-if="showBack"
                class="navbar-back"
                @tap="handleBack"
            >
                <image
                    class="back-icon"
                    src="/static/icons/back.svg"
                    mode="aspectFit"
                />
            </view>
            <text class="navbar-title">{{ title }}</text>
            <view
                v-if="$slots.right"
                class="navbar-right"
                :style="{ right: menuButtonLeft ? menuButtonLeft + 'px' : '32rpx' }"
            >
                <slot name="right"></slot>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores';

interface Props {
    title?: string;
    showBack?: boolean;
    background?: string;
    color?: string;
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    showBack: true,
    background: '#FFFFFF',
    color: '#1A1A1A'
});

const userStore = useUserStore();

// 根据深色模式动态计算背景色和文字色
const navBackground = computed(() => {
    if (props.background === 'transparent') return 'transparent';
    if (props.background.includes('gradient')) return props.background;
    return userStore.isDarkMode ? '#1A1A1A' : '#FFFFFF';
});

const navColor = computed(() => {
    return userStore.isDarkMode ? '#E8E8E8' : props.color;
});

// 根据深色模式动态计算图标颜色过滤器
const iconFilter = computed(() => {
    return userStore.isDarkMode
        ? 'brightness(0) saturate(100%) invert(100%)'
        : 'brightness(0) saturate(100%) invert(0%)';
});

// 返回按钮背景色
const backBtnBg = computed(() => {
    return userStore.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
});

const backBtnBgActive = computed(() => {
    return userStore.isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
});

const statusBarHeight = ref(0);
const menuButtonLeft = ref(0); // 胶囊按钮左边距

function handleBack() {
    // 检查页面栈，如果只有一个页面则跳转到首页
    const pages = getCurrentPages();
    if (pages.length <= 1) {
        // 没有上一页，跳转到首页
        uni.switchTab({ url: '/pages/index/index' });
    } else {
        uni.navigateBack({
            fail: () => {
                // 兜底：如果返回失败，跳转到首页
                uni.switchTab({ url: '/pages/index/index' });
            }
        });
    }
}

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;

    // #ifdef MP-WEIXIN
    // 获取胶囊按钮位置，避免右侧内容被遮挡
    try {
        const menuButton = uni.getMenuButtonBoundingClientRect();
        // 右侧内容需要在胶囊按钮左边，留出一定间距
        menuButtonLeft.value = systemInfo.windowWidth - menuButton.left + 16;
    } catch (e) {
        menuButtonLeft.value = 100; // 默认值
    }
    // #endif
});
</script>

<style lang="scss" scoped>
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: v-bind(navBackground);
    transition: background-color 0.3s ease;
}

.navbar-content {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 0 32rpx;
}

.navbar-back {
    position: absolute;
    left: 32rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: v-bind(backBtnBg);
    transition: all 0.2s;

    &:active {
        background: v-bind(backBtnBgActive);
        transform: translateY(-50%) scale(0.95);
    }
}

.back-icon {
    width: 40rpx;
    height: 40rpx;
    filter: v-bind(iconFilter);
    transition: filter 0.3s ease;
}

.navbar-title {
    font-size: 36rpx;
    font-weight: 700;
    color: v-bind(navColor);
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease;
}

.navbar-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);

    // 深色模式下右侧图标颜色
    :deep(image),
    :deep(.delete-icon),
    :deep(.menu-icon) {
        filter: v-bind(iconFilter);
        transition: filter 0.3s ease;
    }
}
</style>
