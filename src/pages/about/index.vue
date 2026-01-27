<template>
    <view
        class="page about-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="关于梦见" />

        <scroll-view
            class="about-content"
            scroll-y
        >
            <view class="content-wrapper">
                <!-- 应用信息 -->
                <view class="app-header">
                    <image
                        class="app-logo"
                        src="/static/logo.png"
                        mode="aspectFit"
                    />
                    <text class="app-name">梦见</text>
                    <text class="app-slogan">记录梦境，解读人生</text>
                    <text class="app-version">v1.0.0</text>
                </view>

                <!-- 设计理念 -->
                <view class="section">
                    <text class="section-title">设计理念</text>
                    <view class="section-content">
                        <view class="philosophy-item">
                            <view class="philosophy-icon">
                                <image
                                    src="/static/icons/moon.svg"
                                    mode="aspectFit"
                                />
                            </view>
                            <view class="philosophy-text">
                                <text class="philosophy-title">探索梦境</text>
                                <text class="philosophy-desc"
                                    >梦境是潜意识的窗口，记录下每一个梦，发现内心深处的声音</text
                                >
                            </view>
                        </view>
                        <view class="philosophy-item">
                            <view class="philosophy-icon">
                                <image
                                    src="/static/icons/sparkle.svg"
                                    mode="aspectFit"
                                />
                            </view>
                            <view class="philosophy-text">
                                <text class="philosophy-title">AI 智能解析</text>
                                <text class="philosophy-desc"
                                    >结合心理学与 AI 技术，为你的梦境提供专业、深度的解读</text
                                >
                            </view>
                        </view>
                        <view class="philosophy-item">
                            <view class="philosophy-icon">
                                <image
                                    src="/static/icons/star.svg"
                                    mode="aspectFit"
                                />
                            </view>
                            <view class="philosophy-text">
                                <text class="philosophy-title">改运任务</text>
                                <text class="philosophy-desc">根据梦境解析生成个性化任务，通过行动改变运势</text>
                            </view>
                        </view>
                        <view class="philosophy-item">
                            <view class="philosophy-icon">
                                <image
                                    src="/static/icons/trophy.svg"
                                    mode="aspectFit"
                                />
                            </view>
                            <view class="philosophy-text">
                                <text class="philosophy-title">习惯养成</text>
                                <text class="philosophy-desc">通过连续记梦打卡和成就系统，培养每日记录的好习惯</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 联系我们 -->
                <view class="section">
                    <text class="section-title">联系我们</text>
                    <view class="contact-list">
                        <view
                            class="contact-item"
                            @tap="handleCopyEmail"
                        >
                            <text class="contact-label">邮箱</text>
                            <view class="contact-value">
                                <text>drim@131462.wang</text>
                                <text class="copy-hint">点击复制</text>
                            </view>
                        </view>
                        <view
                            class="contact-item"
                            @tap="handleCopyWechat"
                        >
                            <text class="contact-label">微信</text>
                            <view class="contact-value">
                                <text>proxy_why</text>
                                <text class="copy-hint">点击复制</text>
                            </view>
                        </view>
                        <!-- #ifdef MP-WEIXIN -->
                        <button
                            class="contact-item feedback-btn"
                            open-type="feedback"
                        >
                            <text class="contact-label">意见反馈</text>
                            <view class="contact-value">
                                <text class="copy-hint">提交反馈</text>
                            </view>
                        </button>
                        <!-- #endif -->
                    </view>
                    <text class="contact-tip">如有建议、问题反馈或商务合作，欢迎随时联系我们</text>
                </view>

                <!-- 版权信息 -->
                <view class="footer">
                    <text class="footer-text">Drim v1.0.0</text>
                    <text class="footer-text">Copyright &copy; 2026 EternalHeart</text>
                    <text class="footer-text">All Rights Reserved</text>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const navBarHeight = ref(0);

function handleCopyEmail() {
    uni.setClipboardData({
        data: 'drim@131462.wang',
        success: () => {
            uni.showToast({ title: '邮箱已复制', icon: 'success' });
        }
    });
}

function handleCopyWechat() {
    uni.setClipboardData({
        data: 'proxy_why',
        success: () => {
            uni.showToast({ title: '微信号已复制', icon: 'success' });
        }
    });
}

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    navBarHeight.value = statusBarHeight + 44;
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.about-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: $bg-page;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .content-wrapper {
            background: $dark-bg-page;
        }

        .app-header {
            .app-name {
                color: $dark-text-primary;
            }

            .app-slogan {
                color: $dark-text-secondary;
            }

            .app-version {
                background: rgba(107, 78, 255, 0.2);
                color: #a893ff;
            }
        }

        .section-title {
            color: $dark-text-primary;
        }

        .philosophy-item {
            background: $dark-bg-card;

            .philosophy-icon {
                background: rgba(107, 78, 255, 0.15);
            }

            .philosophy-title {
                color: $dark-text-primary;
            }

            .philosophy-desc {
                color: $dark-text-secondary;
            }
        }

        .contact-list {
            background: $dark-bg-card;
        }

        .contact-item {
            border-bottom-color: $dark-border-color;

            .contact-label {
                color: $dark-text-secondary;
            }

            .contact-value text:first-child {
                color: $dark-text-primary;
            }
        }

        .contact-tip {
            color: $dark-text-placeholder;
        }

        .paragraph {
            color: $dark-text-secondary;
        }

        .footer-text {
            color: $dark-text-placeholder;
        }
    }
}

.about-content {
    flex: 1;
    padding-top: calc(v-bind('navBarHeight') * 2rpx);
}

.content-wrapper {
    padding: 40rpx;
    padding-bottom: 80rpx;
}

// 应用头部
.app-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48rpx 0 64rpx;

    .app-logo {
        width: 160rpx;
        height: 160rpx;
        border-radius: 32rpx;
        margin-bottom: 24rpx;
        box-shadow: 0 8rpx 24rpx rgba(107, 78, 255, 0.2);
    }

    .app-name {
        font-size: 48rpx;
        font-weight: 700;
        color: $text-primary;
        margin-bottom: 8rpx;
    }

    .app-slogan {
        font-size: 28rpx;
        color: $text-secondary;
        margin-bottom: 16rpx;
    }

    .app-version {
        font-size: 24rpx;
        color: $primary-color;
        background: rgba(107, 78, 255, 0.1);
        padding: 8rpx 24rpx;
        border-radius: 20rpx;
    }
}

// 区块
.section {
    margin-bottom: 48rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 24rpx;
    display: block;
}

.section-content {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

// 设计理念
.philosophy-item {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 28rpx;
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .philosophy-icon {
        width: 80rpx;
        height: 80rpx;
        min-width: 80rpx;
        background: rgba(107, 78, 255, 0.1);
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        image {
            width: 40rpx;
            height: 40rpx;
            filter: brightness(0) saturate(100%) invert(34%) sepia(84%) saturate(1746%) hue-rotate(234deg)
                brightness(92%) contrast(102%);
        }
    }

    .philosophy-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .philosophy-title {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-primary;
    }

    .philosophy-desc {
        font-size: 26rpx;
        color: $text-secondary;
        line-height: 1.6;
    }
}

// 联系方式
.contact-list {
    background: #fff;
    border-radius: 20rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 20rpx;
}

.contact-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-bottom: 1rpx solid #f7fafc;
    background: transparent;

    &:last-child {
        border-bottom: none;
    }

    &:active {
        background: #f9fafb;
    }

    .contact-label {
        font-size: 28rpx;
        color: $text-secondary;
    }

    .contact-value {
        display: flex;
        align-items: center;
        gap: 16rpx;

        text:first-child {
            font-size: 28rpx;
            color: $text-primary;
            font-weight: 500;
        }
    }

    .copy-hint {
        font-size: 22rpx;
        color: $primary-color;
    }
}

// 反馈按钮重置样式
.feedback-btn {
    width: 100%;
    margin: 0;
    padding: 32rpx;
    border: none;
    border-radius: 0;
    font-size: inherit;
    line-height: inherit;
    text-align: left;

    &::after {
        display: none;
    }
}

.contact-tip {
    font-size: 24rpx;
    color: $text-placeholder;
    text-align: center;
}

.paragraph {
    font-size: 28rpx;
    line-height: 1.8;
    color: $text-secondary;
    text-align: justify;
}

// 页脚
.footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    margin-top: 64rpx;
    padding-top: 32rpx;
    border-top: 1rpx solid #eee;
}

.footer-text {
    font-size: 24rpx;
    color: $text-placeholder;
}
</style>
