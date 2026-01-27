<template>
    <view
        class="page settings-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="设置" />

        <view class="settings-content">
            <!-- 常规设置 -->
            <view class="section-label">常规设置</view>
            <view class="settings-list">
                <view class="settings-item">
                    <text class="settings-label">消息通知</text>
                    <switch
                        class="toggle-switch"
                        :checked="settings.notification"
                        color="#6B4EFF"
                        @change="handleNotificationChange"
                    />
                </view>
                <view
                    class="settings-item"
                    @tap="showTimePicker = true"
                >
                    <text class="settings-label">每日记梦提醒</text>
                    <view class="settings-value">
                        <text>{{ settings.reminderTime }}</text>
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
                <view class="settings-item">
                    <text class="settings-label">深色模式</text>
                    <switch
                        class="toggle-switch"
                        :checked="settings.darkMode"
                        color="#6B4EFF"
                        @change="handleDarkModeChange"
                    />
                </view>
            </view>

            <!-- 隐私与安全 -->
            <view class="section-label">隐私与安全</view>
            <view class="settings-list">
                <view
                    class="settings-item"
                    @tap="handlePrivacySettings"
                >
                    <text class="settings-label">隐私设置</text>
                    <view class="settings-value">
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
                <view
                    class="settings-item"
                    @tap="handleExportData"
                >
                    <text class="settings-label">数据导出</text>
                    <view class="settings-value">
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
            </view>

            <!-- 关于 -->
            <view class="section-label">关于</view>
            <view class="settings-list">
                <view
                    class="settings-item"
                    @tap="handleAbout"
                >
                    <text class="settings-label">关于梦见</text>
                    <view class="settings-value">
                        <text>v1.0.0</text>
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
                <view
                    class="settings-item"
                    @tap="handleAgreement"
                >
                    <text class="settings-label">用户协议</text>
                    <view class="settings-value">
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
                <view
                    class="settings-item"
                    @tap="handlePrivacy"
                >
                    <text class="settings-label">隐私政策</text>
                    <view class="settings-value">
                        <image
                            class="arrow-icon"
                            src="/static/icons/arrow-right.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>
            </view>

            <!-- 退出登录 -->
            <view class="settings-list logout-list">
                <view
                    class="settings-item logout-item"
                    @tap="handleLogout"
                >
                    <text class="logout-text">退出登录</text>
                </view>
            </view>

            <!-- 版权信息 -->
            <view class="version-info">
                <text>Drim v1.0.0</text>
                <text class="copyright">Copyright © 2026 EternalHeart. All Rights Reserved.</text>
            </view>
        </view>

        <!-- 时间选择器 -->
        <TimePicker
            v-model="showTimePicker"
            :time="settings.reminderTime"
            :is-dark="userStore.isDarkMode"
            @confirm="handleReminderTimeConfirm"
        />
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores';
import NavBar from '@/components/NavBar/index.vue';
import TimePicker from '@/components/TimePicker/index.vue';
import { settingsApi, type UserSettings } from '@/api/modules/settings';
import { exportApi } from '@/api/modules/export';

const userStore = useUserStore();
const navBarHeight = ref(0);
const serverSettings = ref<UserSettings | null>(null);
const showTimePicker = ref(false);

// 设置数据
const settings = reactive({
    notification: true,
    reminderTime: '08:00',
    darkMode: userStore.isDarkMode
});

// 方法
function loadLocalSettings() {
    try {
        const savedSettings = uni.getStorageSync('app_settings');
        if (savedSettings) {
            Object.assign(settings, JSON.parse(savedSettings));
        }
    } catch (error) {
        console.error('加载本地设置失败:', error);
    }
}

function saveLocalSettings() {
    try {
        uni.setStorageSync('app_settings', JSON.stringify(settings));
    } catch (error) {
        console.error('保存本地设置失败:', error);
    }
}

// 从服务端加载设置
async function loadServerSettings() {
    try {
        serverSettings.value = await settingsApi.getSettings();
        // 同步到本地 settings
        settings.notification = serverSettings.value.notification.enabled;
        settings.reminderTime = serverSettings.value.notification.reminderTime;
    } catch (error) {
        console.error('加载服务端设置失败:', error);
    }
}

async function handleNotificationChange(e: any) {
    const enabled = e.detail.value;

    if (enabled) {
        // #ifdef MP-WEIXIN
        // 请求订阅消息授权
        const templateId = import.meta.env.VITE_WECHAT_REMINDER_TEMPLATE_ID || '';
        if (!templateId) {
            settings.notification = enabled;
            await settingsApi.updateSettings({ notificationEnabled: enabled });
            uni.showToast({ title: '已开启通知', icon: 'success' });
            return;
        }

        uni.requestSubscribeMessage({
            tmplIds: [templateId],
            success: async (res: any) => {
                const accepted = res[templateId] === 'accept';
                await settingsApi.updateSubscription(accepted);

                if (accepted) {
                    await settingsApi.updateSettings({ notificationEnabled: true });
                    settings.notification = true;
                    saveLocalSettings();
                    uni.showToast({ title: '已开启通知', icon: 'success' });
                } else {
                    settings.notification = false;
                    uni.showToast({ title: '需要授权才能接收通知', icon: 'none' });
                }
            },
            fail: () => {
                settings.notification = false;
                uni.showToast({ title: '授权失败', icon: 'none' });
            }
        });
        // #endif

        // #ifndef MP-WEIXIN
        settings.notification = enabled;
        await settingsApi.updateSettings({ notificationEnabled: enabled });
        saveLocalSettings();
        uni.showToast({ title: '已开启通知', icon: 'success' });
        // #endif
    } else {
        await settingsApi.updateSettings({ notificationEnabled: false });
        settings.notification = false;
        saveLocalSettings();
        uni.showToast({ title: '已关闭通知', icon: 'success' });
    }
}

async function handleReminderTimeConfirm(selectedTime: string) {
    try {
        await settingsApi.updateSettings({ reminderTime: selectedTime });
        settings.reminderTime = selectedTime;
        saveLocalSettings();

        if (!settings.notification) {
            uni.showModal({
                title: '提醒时间已设置',
                content: `已设置为 ${selectedTime}，但消息通知尚未开启。开启通知后才能收到提醒哦~`,
                confirmText: '去开启',
                cancelText: '稍后再说',
                success: (modalRes) => {
                    if (modalRes.confirm) {
                        settings.notification = true;
                        handleNotificationChange({ detail: { value: true } });
                    }
                }
            });
        } else {
            uni.showToast({ title: '已设置提醒时间', icon: 'success' });
        }
    } catch (error) {
        uni.showToast({ title: '设置失败', icon: 'none' });
    }
}

function handleDarkModeChange(e: any) {
    settings.darkMode = e.detail.value;
    saveLocalSettings();

    // 通知 userStore 切换深色模式
    userStore.toggleDarkMode(settings.darkMode);

    uni.showToast({
        title: settings.darkMode ? '已开启深色模式' : '已关闭深色模式',
        icon: 'success'
    });
}

function handlePrivacySettings() {
    uni.navigateTo({ url: '/pages/privacy-settings/index' });
}

async function handleExportData() {
    try {
        uni.showLoading({ title: '获取数据...' });

        // 先预览数据
        const preview = await exportApi.preview();
        uni.hideLoading();

        const { statistics } = preview;

        uni.showModal({
            title: '确认导出',
            content: `将导出以下数据：\n- 梦境记录：${statistics.totalDreams} 条\n- 解析结果：${statistics.totalAnalyses} 条\n- 完成任务：${statistics.completedTasks} 条\n\n数据将以 JSON 格式下载`,
            confirmText: '开始导出',
            success: (res) => {
                if (res.confirm) {
                    // #ifdef MP-WEIXIN
                    const downloadUrl = exportApi.getDownloadUrl();
                    uni.showLoading({ title: '导出中...' });

                    uni.downloadFile({
                        url: downloadUrl,
                        success: (downloadRes) => {
                            uni.hideLoading();
                            if (downloadRes.statusCode === 200) {
                                uni.saveFile({
                                    tempFilePath: downloadRes.tempFilePath,
                                    success: (saveRes) => {
                                        uni.showToast({ title: '导出成功', icon: 'success' });
                                        // 打开文件
                                        uni.openDocument({
                                            filePath: saveRes.savedFilePath,
                                            showMenu: true
                                        });
                                    },
                                    fail: () => {
                                        uni.showToast({ title: '保存失败', icon: 'none' });
                                    }
                                });
                            }
                        },
                        fail: () => {
                            uni.hideLoading();
                            uni.showToast({ title: '下载失败', icon: 'none' });
                        }
                    });
                    // #endif

                    // #ifdef H5
                    window.open(exportApi.getDownloadUrl());
                    // #endif
                }
            }
        });
    } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '获取数据失败', icon: 'none' });
    }
}

function handleAbout() {
    uni.navigateTo({ url: '/pages/about/index' });
}

function handleAgreement() {
    uni.navigateTo({ url: '/pages/agreement/index' });
}

function handlePrivacy() {
    uni.navigateTo({ url: '/pages/privacy-policy/index' });
}

function handleLogout() {
    uni.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
            if (res.confirm) {
                userStore.logout();
                uni.showToast({ title: '已退出登录', icon: 'success' });
                setTimeout(() => {
                    uni.switchTab({ url: '/pages/index/index' });
                }, 1500);
            }
        }
    });
}

// 生命周期
onMounted(() => {
    loadLocalSettings();
    loadServerSettings();

    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44;
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.settings-page {
    min-height: 100vh;
    background: $bg-page;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .section-label {
            color: $dark-text-secondary;
        }

        .settings-list {
            background: $dark-bg-card;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
        }

        .settings-item {
            background: $dark-bg-card;
            border-bottom-color: $dark-border-color;
            color: $dark-text-primary;

            &:active {
                background: #252525;
            }
        }

        .settings-value {
            color: $dark-text-secondary;
        }

        .arrow-icon {
            filter: brightness(0) saturate(100%) invert(100%);
            opacity: 0.5;
        }

        .logout-item:active {
            background: #2a1515;
        }

        .version-info text {
            color: $dark-text-placeholder;
        }
    }
}

// 内容区域
.settings-content {
    padding: 40rpx;
    padding-top: calc(v-bind('navBarHeight') * 2rpx + 40rpx);
}

// 区块标题
.section-label {
    font-size: 24rpx;
    font-weight: 700;
    color: $text-secondary;
    margin-bottom: 16rpx;
    margin-left: 8rpx;
}

// 设置列表
.settings-list {
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 40rpx;
}

.settings-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 2rpx solid #f7fafc;
    font-size: 30rpx;
    color: $text-primary;
    background: #fff;
    transition: background 0.2s;

    &:active {
        background: #f9fafb;
    }

    &:last-child {
        border-bottom: none;
    }
}

.settings-label {
    font-weight: 500;
}

.settings-value {
    color: $text-secondary;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.arrow-icon {
    width: 32rpx;
    height: 32rpx;
    opacity: 0.4;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition:
        filter 0.3s ease,
        opacity 0.3s ease;
}

// 开关样式
.toggle-switch {
    transform: scale(0.9);
}

// 退出登录
.logout-list {
    margin-top: 64rpx;
}

.logout-item {
    justify-content: center;

    &:active {
        background: #fff5f5;
    }
}

.logout-text {
    color: $error-color;
    font-weight: 600;
}

// 版权信息
.version-info {
    text-align: center;
    margin-top: 40rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    text {
        font-size: 24rpx;
        color: $text-placeholder;
    }

    .copyright {
        font-size: 22rpx;
    }
}
</style>
