<template>
    <view
        class="custom-tab-bar"
        :class="{ 'dark-mode': userStore.isDarkMode }"
        :style="{ paddingBottom: safeAreaBottom + 'px' }"
    >
        <view
            v-for="(item, index) in tabList"
            :key="index"
            class="tab-item"
            :class="{ active: selectedIndex === index }"
            @tap="switchTab(index)"
        >
            <image
                class="tab-icon"
                :src="selectedIndex === index ? item.selectedIconPath : item.iconPath"
                mode="aspectFit"
            />
            <text class="tab-text">{{ item.text }}</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';

interface Props {
    selected?: number;
}

const props = withDefaults(defineProps<Props>(), {
    selected: 0
});

const userStore = useUserStore();
const selectedIndex = ref(props.selected);
const safeAreaBottom = ref(0);

// 根据当前页面路径更新选中状态
function updateSelectedIndex() {
    const pages = getCurrentPages();
    if (pages.length === 0) return;

    const currentPage = pages[pages.length - 1];
    const route = currentPage.route || '';

    if (route.includes('pages/index/index')) {
        selectedIndex.value = 0;
    } else if (route.includes('pages/explore/index')) {
        selectedIndex.value = 1;
    } else if (route.includes('pages/record/index')) {
        selectedIndex.value = 2;
    } else if (route.includes('pages/profile/index')) {
        selectedIndex.value = 3;
    }
}

const tabList = [
    {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: '/static/icons/home.svg',
        selectedIconPath: '/static/icons/home.svg'
    },
    {
        pagePath: '/pages/explore/index',
        text: '探索',
        iconPath: '/static/icons/search.svg',
        selectedIconPath: '/static/icons/search.svg'
    },
    {
        pagePath: '/pages/record/index',
        text: '记梦',
        iconPath: '/static/icons/edit.svg',
        selectedIconPath: '/static/icons/edit.svg'
    },
    {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconPath: '/static/icons/user.svg',
        selectedIconPath: '/static/icons/user.svg'
    }
];

function switchTab(index: number) {
    const item = tabList[index];
    uni.switchTab({
        url: item.pagePath
    });
}

onMounted(() => {
    // 获取安全区域底部高度
    const systemInfo = uni.getSystemInfoSync();
    safeAreaBottom.value = systemInfo.safeArea ? systemInfo.screenHeight - systemInfo.safeArea.bottom : 0;

    // 初始化时根据当前页面更新选中状态
    updateSelectedIndex();
});

// 组件显示时更新选中状态
onShow(() => {
    updateSelectedIndex();
});
</script>

<script lang="ts">
export default {
    options: {
        styleIsolation: 'shared'
    }
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.custom-tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100rpx;
    background: #fff;
    display: flex;
    box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
    z-index: 999;
    transition:
        background-color 0.3s ease,
        box-shadow 0.3s ease;

    &.dark-mode {
        background: $dark-bg-card;
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.3);

        .tab-icon {
            // 暗黑模式下转换为浅灰色
            filter: brightness(0) saturate(100%) invert(70%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%)
                contrast(85%);
        }

        .tab-text {
            color: $dark-text-secondary;
        }

        .tab-item.active {
            .tab-icon {
                // 暗黑模式下转换为浅紫色 (#8B6EFF)
                filter: brightness(0) saturate(100%) invert(58%) sepia(61%) saturate(4261%) hue-rotate(228deg)
                    brightness(101%) contrast(101%);
            }

            .tab-text {
                color: $dark-primary-color;
            }
        }

        .tab-item:active {
            background: rgba(255, 255, 255, 0.05);
        }
    }
}

.tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    transition: all 0.2s;

    &:active {
        background: rgba(0, 0, 0, 0.02);
    }
}

.tab-icon {
    width: 48rpx;
    height: 48rpx;
    // 将黑色 SVG 转换为灰色
    filter: brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)
        contrast(90%);
    transition:
        filter 0.2s,
        transform 0.2s;
}

.tab-text {
    font-size: 20rpx;
    color: #999;
    transition: all 0.2s;
}

.tab-item.active {
    .tab-icon {
        // 将黑色 SVG 转换为紫色 (#6B4EFF)
        filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
            contrast(104%);
        transform: scale(1.1);
    }

    .tab-text {
        color: #6b4eff;
        font-weight: 600;
    }
}
</style>
