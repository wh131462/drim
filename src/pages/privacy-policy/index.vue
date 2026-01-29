<template>
    <view
        class="page privacy-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="隐私政策" />

        <scroll-view
            class="privacy-content"
            scroll-y
        >
            <view class="content-wrapper">
                <view class="privacy-header">
                    <text class="title">梦见隐私保护政策</text>
                    <view class="meta">
                        <text class="date">更新日期：2026年01月01日</text>
                        <text class="date">生效日期：2026年01月01日</text>
                    </view>
                </view>

                <!-- 导言 -->
                <view class="section">
                    <text class="section-title">导言</text>
                    <view class="section-content">
                        <text class="paragraph">
                            "梦见"小程序（以下简称"我们"）非常重视用户的隐私保护。本隐私政策将向你说明我们如何收集、使用、存储和保护你的个人信息，以及你享有的相关权利。
                        </text>
                        <text class="paragraph">
                            请你在使用我们的服务前，仔细阅读并了解本隐私政策。如果你不同意本隐私政策的任何内容，你应当立即停止使用我们的服务。
                        </text>
                        <text class="paragraph bold"> 要点概述： </text>
                        <text class="paragraph list-item"
                            >1. 我们会收集你主动提供的信息和使用服务时自动产生的信息；</text
                        >
                        <text class="paragraph list-item">2. 我们会使用加密技术保护你的个人信息安全；</text>
                        <text class="paragraph list-item">3. 我们不会主动向第三方共享你的个人信息；</text>
                        <text class="paragraph list-item">4. 你可以查阅、更正、删除你的个人信息或注销账号。</text>
                    </view>
                </view>

                <!-- 一、我们收集的信息 -->
                <view class="section">
                    <text class="section-title">一、我们收集的信息</text>
                    <view class="section-content">
                        <text class="paragraph bold">1.1 你主动提供的信息</text>
                        <text class="paragraph"> 当你注册和使用我们的服务时，可能需要提供以下信息： </text>
                        <text class="paragraph list-item"
                            >（1）账号信息：微信昵称、微信头像、微信唯一标识（OpenID）；</text
                        >
                        <text class="paragraph list-item"
                            >（2）梦境内容：你记录的梦境描述、标签、情绪、日期等信息；</text
                        >
                        <text class="paragraph list-item">（3）互动信息：你发表的评论、点赞、分享等操作记录；</text>
                        <text class="paragraph list-item">（4）反馈信息：你向我们提交的意见反馈、投诉建议等内容。</text>

                        <text class="paragraph bold">1.2 我们自动收集的信息</text>
                        <text class="paragraph"> 当你使用我们的服务时，我们可能会自动收集以下信息： </text>
                        <text class="paragraph list-item"
                            >（1）设备信息：设备型号、操作系统版本、设备标识符、屏幕分辨率等；</text
                        >
                        <text class="paragraph list-item"
                            >（2）日志信息：访问时间、访问页面、功能使用情况、错误日志等；</text
                        >
                        <text class="paragraph list-item">（3）网络信息：网络类型、运营商信息、IP地址等。</text>

                        <text class="paragraph bold">1.3 敏感个人信息说明</text>
                        <text class="paragraph">
                            梦境内容可能包含个人敏感信息，如个人经历、心理状态等。我们会对这些信息给予严格保护。除非你选择公开分享，否则你的梦境内容默认仅对你可见。
                        </text>
                    </view>
                </view>

                <!-- 二、我们如何使用信息 -->
                <view class="section">
                    <text class="section-title">二、我们如何使用信息</text>
                    <view class="section-content">
                        <text class="paragraph"> 我们会将收集的信息用于以下目的： </text>
                        <text class="paragraph bold">2.1 提供核心服务</text>
                        <text class="paragraph list-item">（1）为你提供梦境记录和管理功能；</text>
                        <text class="paragraph list-item">（2）为你提供AI梦境解析服务；</text>
                        <text class="paragraph list-item">（3）为你生成个性化的改运任务建议；</text>
                        <text class="paragraph list-item">（4）展示你的成就和使用统计。</text>

                        <text class="paragraph bold">2.2 改善和优化服务</text>
                        <text class="paragraph list-item">（1）分析服务使用情况，改善用户体验；</text>
                        <text class="paragraph list-item">（2）修复系统故障，保障服务稳定运行；</text>
                        <text class="paragraph list-item">（3）开发新功能，提升服务质量。</text>

                        <text class="paragraph bold">2.3 安全保障</text>
                        <text class="paragraph list-item">（1）验证用户身份，保护账号安全；</text>
                        <text class="paragraph list-item">（2）预防和调查欺诈、恶意行为；</text>
                        <text class="paragraph list-item">（3）遵守适用的法律法规要求。</text>

                        <text class="paragraph bold">2.4 AI服务说明</text>
                        <text class="paragraph">
                            你记录的梦境内容会被发送至AI服务进行分析处理。我们的AI服务不会存储或记忆你的梦境内容，仅用于即时处理并返回解析结果。
                        </text>
                    </view>
                </view>

                <!-- 三、信息的存储 -->
                <view class="section">
                    <text class="section-title">三、信息的存储</text>
                    <view class="section-content">
                        <text class="paragraph bold">3.1 存储地点</text>
                        <text class="paragraph">
                            我们会按照法律法规规定，将在境内收集的用户个人信息存储于中华人民共和国境内。
                        </text>
                        <text class="paragraph bold">3.2 存储期限</text>
                        <text class="paragraph"> 我们仅在为实现目的所必需的期限内保留你的个人信息： </text>
                        <text class="paragraph list-item"
                            >（1）账号信息：在你使用服务期间持续保存，注销后依法保留必要期限后删除；</text
                        >
                        <text class="paragraph list-item">（2）梦境记录：在你主动删除前持续保存，你可随时删除；</text>
                        <text class="paragraph list-item"
                            >（3）日志信息：保存不超过6个月，用于排查问题和服务优化。</text
                        >
                        <text class="paragraph bold">3.3 服务停止后的处理</text>
                        <text class="paragraph">
                            当我们的产品或服务发生停止运营的情形时，我们将以推送通知、公告等形式通知你，并在合理的期限内删除或匿名化处理你的个人信息。
                        </text>
                    </view>
                </view>

                <!-- 四、信息安全 -->
                <view class="section">
                    <text class="section-title">四、信息安全</text>
                    <view class="section-content">
                        <text class="paragraph"> 我们非常重视你的信息安全，采取多种安全措施保护你的个人信息： </text>
                        <text class="paragraph list-item">（1）数据传输加密：使用HTTPS协议加密数据传输；</text>
                        <text class="paragraph list-item">（2）数据存储加密：对敏感数据进行加密存储；</text>
                        <text class="paragraph list-item">（3）访问控制：严格限制数据访问权限；</text>
                        <text class="paragraph list-item">（4）安全审计：定期进行安全检查和漏洞修复。</text>
                        <text class="paragraph">
                            尽管我们努力保护你的信息安全，但请你理解，任何安全措施都无法做到绝对安全。如发生个人信息安全事件，我们将按照法律法规的要求及时通知你。
                        </text>
                    </view>
                </view>

                <!-- 五、信息共享 -->
                <view class="section">
                    <text class="section-title">五、信息共享</text>
                    <view class="section-content">
                        <text class="paragraph bold">5.1 一般原则</text>
                        <text class="paragraph"> 我们不会主动向第三方共享你的个人信息，除非存在以下情形： </text>
                        <text class="paragraph list-item">（1）获得你的明确同意后；</text>
                        <text class="paragraph list-item">（2）根据法律法规的规定或政府主管部门的要求；</text>
                        <text class="paragraph list-item">（3）为保护用户或公众的人身财产安全免受紧迫危险。</text>

                        <text class="paragraph bold">5.2 公开分享</text>
                        <text class="paragraph">
                            当你选择将梦境设为公开状态时，你的梦境内容、昵称、头像等信息将在探索广场对其他用户可见。你可以随时更改梦境的公开状态。
                        </text>

                        <text class="paragraph bold">5.3 第三方服务</text>
                        <text class="paragraph">
                            我们的服务可能包含第三方服务（如智能解析服务），这些服务可能会根据其隐私政策处理你的信息。我们会尽力选择信誉良好的第三方服务商，并要求其遵守相关法律法规。
                        </text>
                    </view>
                </view>

                <!-- 六、你的权利 -->
                <view class="section">
                    <text class="section-title">六、你的权利</text>
                    <view class="section-content">
                        <text class="paragraph"> 你对你的个人信息享有以下权利： </text>
                        <text class="paragraph bold">6.1 查阅和复制</text>
                        <text class="paragraph">
                            你可以通过"我的"页面查看你的账号信息、梦境记录、成就等信息。你可以通过"设置-数据导出"功能导出你的个人数据。
                        </text>
                        <text class="paragraph bold">6.2 更正</text>
                        <text class="paragraph">
                            当你发现我们处理的个人信息有错误时，你可以通过编辑功能进行更正。
                        </text>
                        <text class="paragraph bold">6.3 删除</text>
                        <text class="paragraph">
                            你可以随时删除你的梦境记录。删除后相关数据将从服务器永久清除，无法恢复。
                        </text>
                        <text class="paragraph bold">6.4 撤回同意</text>
                        <text class="paragraph">
                            你可以通过"设置-隐私设置"管理你的授权。撤回同意后，我们将不再处理相应的个人信息，但不影响撤回前的信息处理。
                        </text>
                        <text class="paragraph bold">6.5 注销账号</text>
                        <text class="paragraph">
                            你可以通过"设置"中的相关功能申请注销账号。注销后，我们将删除或匿名化处理你的个人信息，但法律法规另有规定的除外。
                        </text>
                    </view>
                </view>

                <!-- 七、未成年人保护 -->
                <view class="section">
                    <text class="section-title">七、未成年人保护</text>
                    <view class="section-content">
                        <text class="paragraph">
                            7.1
                            我们非常重视对未成年人个人信息的保护。若你是18周岁以下的未成年人，在使用我们的服务前，应事先取得你的家长或法定监护人的同意。
                        </text>
                        <text class="paragraph">
                            7.2
                            如果我们发现自己在未事先获得可证实的监护人同意的情况下收集了未成年人的个人信息，则会设法尽快删除相关数据。
                        </text>
                        <text class="paragraph">
                            7.3
                            若你是未成年人的监护人，当你对你所监护的未成年人的个人信息有相关疑问时，请通过本政策所列途径与我们联系。
                        </text>
                    </view>
                </view>

                <!-- 八、政策更新 -->
                <view class="section">
                    <text class="section-title">八、政策更新</text>
                    <view class="section-content">
                        <text class="paragraph">
                            我们可能会适时修订本隐私政策。当政策发生重大变更时，我们会在你登录时以弹窗或其他适当形式向你展示变更后的政策，以便你及时了解最新内容。
                        </text>
                        <text class="paragraph">
                            如果你在隐私政策更新后继续使用我们的服务，即表示你已接受更新后的政策。如果你不同意更新后的政策，你应当停止使用我们的服务。
                        </text>
                    </view>
                </view>

                <!-- 九、联系我们 -->
                <view class="section">
                    <text class="section-title">九、联系我们</text>
                    <view class="section-content">
                        <text class="paragraph">
                            如果你对本隐私政策或个人信息保护相关事宜有任何疑问、意见或建议，你可以通过以下方式与我们联系：
                        </text>
                        <text class="paragraph list-item">邮箱：drim@131462.wang</text>
                        <text class="paragraph">
                            我们将尽快审核所涉问题，并在收到你的反馈后15个工作日内予以回复。
                        </text>
                    </view>
                </view>

                <view class="footer">
                    <text class="footer-text">梦见小程序运营团队</text>
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

.privacy-page {
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

        .privacy-header {
            .title {
                color: $dark-text-primary;
            }

            .date {
                color: $dark-text-secondary;
            }
        }

        .section-title {
            color: $dark-text-primary;
        }

        .paragraph {
            color: $dark-text-secondary;

            &.bold {
                color: $dark-text-primary;
            }
        }

        .footer-text {
            color: $dark-text-placeholder;
        }
    }
}

.privacy-content {
    flex: 1;
    padding-top: calc(v-bind('navBarHeight') * 2rpx);
}

.content-wrapper {
    padding: 40rpx;
    padding-bottom: 80rpx;
    background: #fff;
}

.privacy-header {
    text-align: center;
    margin-bottom: 48rpx;
    padding-bottom: 32rpx;
    border-bottom: 1rpx solid #eee;

    .title {
        display: block;
        font-size: 40rpx;
        font-weight: 700;
        color: $text-primary;
        margin-bottom: 24rpx;
    }

    .meta {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .date {
        font-size: 24rpx;
        color: $text-secondary;
    }
}

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

.paragraph {
    font-size: 28rpx;
    line-height: 1.8;
    color: $text-secondary;
    text-align: justify;

    &.bold {
        font-weight: 600;
        color: $text-primary;
    }

    &.list-item {
        padding-left: 24rpx;
        position: relative;
    }
}

.footer {
    text-align: center;
    margin-top: 64rpx;
    padding-top: 32rpx;
    border-top: 1rpx solid #eee;
}

.footer-text {
    font-size: 24rpx;
    color: $text-placeholder;
}
</style>
