<template>
    <view
        class="page privacy-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="隐私设置" />

        <view class="privacy-content">
            <view class="settings-list">
                <view class="settings-item">
                    <view class="item-info">
                        <text class="settings-label">梦境默认公开</text>
                        <text class="settings-desc">新记录的梦境默认是否公开到探索广场</text>
                    </view>
                    <switch
                        class="toggle-switch"
                        :checked="privacy.defaultDreamPublic"
                        color="#6B4EFF"
                        @change="handleDefaultPublicChange"
                    />
                </view>

                <view class="settings-item">
                    <view class="item-info">
                        <text class="settings-label">允许他人查看主页</text>
                        <text class="settings-desc">关闭后他人无法访问你的个人主页</text>
                    </view>
                    <switch
                        class="toggle-switch"
                        :checked="privacy.allowProfileView"
                        color="#6B4EFF"
                        @change="handleAllowProfileViewChange"
                    />
                </view>
            </view>

            <view class="tips-section">
                <text class="tips-title">关于隐私保护</text>
                <text class="tips-content"> 1. 公开的梦境会展示在探索广场，其他用户可以浏览和点赞 </text>
                <text class="tips-content"> 2. 即使公开，你的真实身份信息也不会被展示 </text>
                <text class="tips-content"> 3. 你可以随时在梦境详情页修改单条梦境的公开状态 </text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores';
import NavBar from '@/components/NavBar/index.vue';
import { settingsApi } from '@/api/modules/settings';

const userStore = useUserStore();
const navBarHeight = ref(0);

const privacy = ref({
    defaultDreamPublic: false,
    allowProfileView: true
});

async function loadSettings() {
    try {
        const settings = await settingsApi.getSettings();
        privacy.value = settings.privacy;
    } catch (error) {
        console.error('加载隐私设置失败:', error);
    }
}

async function handleDefaultPublicChange(e: any) {
    const value = e.detail.value;

    try {
        await settingsApi.updateSettings({ defaultDreamPublic: value });
        privacy.value.defaultDreamPublic = value;
        uni.showToast({
            title: value ? '新梦境将默认公开' : '新梦境将默认私密',
            icon: 'none'
        });
    } catch (error) {
        uni.showToast({ title: '设置失败', icon: 'none' });
    }
}

async function handleAllowProfileViewChange(e: any) {
    const value = e.detail.value;

    try {
        await settingsApi.updateSettings({ allowProfileView: value });
        privacy.value.allowProfileView = value;
        uni.showToast({
            title: value ? '已允许他人查看主页' : '已禁止他人查看主页',
            icon: 'none'
        });
    } catch (error) {
        uni.showToast({ title: '设置失败', icon: 'none' });
    }
}

onMounted(() => {
    loadSettings();

    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44;
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.privacy-page {
    min-height: 100vh;
    background: $bg-page;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .settings-list {
            background: $dark-bg-card;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
        }

        .settings-item {
            background: $dark-bg-card;
            border-bottom-color: $dark-border-color;
        }

        .settings-label {
            color: $dark-text-primary;
        }

        .settings-desc {
            color: $dark-text-secondary;
        }

        .tips-section {
            background: $dark-bg-card;
        }

        .tips-title {
            color: $dark-text-primary;
        }

        .tips-content {
            color: $dark-text-secondary;
        }
    }
}

.privacy-content {
    padding: 40rpx;
    padding-top: calc(v-bind('navBarHeight') * 2rpx + 40rpx);
}

.settings-list {
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.settings-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 2rpx solid #f7fafc;
    background: #fff;

    &:last-child {
        border-bottom: none;
    }
}

.item-info {
    flex: 1;
    margin-right: 24rpx;
}

.settings-label {
    font-size: 30rpx;
    font-weight: 500;
    color: $text-primary;
    display: block;
    margin-bottom: 8rpx;
}

.settings-desc {
    font-size: 24rpx;
    color: $text-secondary;
    display: block;
    line-height: 1.5;
}

.toggle-switch {
    transform: scale(0.9);
}

.tips-section {
    margin-top: 40rpx;
    padding: 32rpx;
    background: #fff;
    border-radius: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.tips-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 20rpx;
}

.tips-content {
    font-size: 24rpx;
    color: $text-secondary;
    display: block;
    line-height: 1.8;
    margin-bottom: 8rpx;

    &:last-child {
        margin-bottom: 0;
    }
}
</style>
