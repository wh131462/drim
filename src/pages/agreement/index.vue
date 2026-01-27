<template>
    <view
        class="page agreement-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="用户协议" />

        <scroll-view
            class="agreement-content"
            scroll-y
        >
            <view class="content-wrapper">
                <view class="agreement-header">
                    <text class="title">梦见用户服务协议</text>
                    <view class="meta">
                        <text class="date">更新日期：2026年01月01日</text>
                        <text class="date">生效日期：2026年01月01日</text>
                    </view>
                </view>

                <!-- 导言 -->
                <view class="section">
                    <text class="section-title">导言</text>
                    <view class="section-content">
                        <text class="paragraph"> 欢迎你使用"梦见"小程序及服务！ </text>
                        <text class="paragraph">
                            为使用"梦见"小程序（以下简称"本软件"）及服务，你应当阅读并遵守《梦见用户服务协议》（以下简称"本协议"）。请你务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款，以及开通或使用某项服务的单独协议，并选择接受或不接受。限制、免责条款可能以加粗等形式提示你注意。
                        </text>
                        <text class="paragraph">
                            除非你已阅读并接受本协议所有条款，否则你无权使用本软件及相关服务。你的使用、登录等行为即视为你已阅读并同意上述协议的约束。
                        </text>
                        <text class="paragraph">
                            如果你未满18周岁，请在法定监护人的陪同下阅读本协议，并特别注意未成年人使用条款。
                        </text>
                    </view>
                </view>

                <!-- 一、协议的范围 -->
                <view class="section">
                    <text class="section-title">一、协议的范围</text>
                    <view class="section-content">
                        <text class="paragraph bold">1.1 协议适用主体范围</text>
                        <text class="paragraph">
                            本协议是你与"梦见"小程序运营方之间关于你使用本软件及相关服务所订立的协议。
                        </text>
                        <text class="paragraph bold">1.2 协议关系及冲突条款</text>
                        <text class="paragraph">
                            本协议内容同时包括我们可能不断发布的关于本服务的相关协议、业务规则等内容。上述内容一经正式发布，即为本协议不可分割的组成部分，你同样应当遵守。
                        </text>
                    </view>
                </view>

                <!-- 二、关于本服务 -->
                <view class="section">
                    <text class="section-title">二、关于本服务</text>
                    <view class="section-content">
                        <text class="paragraph bold">2.1 服务内容</text>
                        <text class="paragraph">
                            "梦见"是一款结合AI梦境解析与游戏化机制的每日打卡小程序。本服务主要包括但不限于：
                        </text>
                        <text class="paragraph list-item">（1）梦境记录：支持用户记录和管理个人梦境日记；</text>
                        <text class="paragraph list-item"
                            >（2）AI梦境解析：基于人工智能技术提供梦境主题分析、心理解读及运势参考；</text
                        >
                        <text class="paragraph list-item">（3）改运任务：根据梦境解析结果生成每日任务建议；</text>
                        <text class="paragraph list-item">（4）梦境润色：支持对梦境内容进行AI优化和改写；</text>
                        <text class="paragraph list-item">（5）探索广场：提供用户分享和浏览公开梦境的社区功能；</text>
                        <text class="paragraph list-item">（6）成就系统：基于用户使用行为解锁成就和奖励；</text>
                        <text class="paragraph list-item">（7）会员服务：提供更多高级功能和权益。</text>
                        <text class="paragraph bold">2.2 服务形式</text>
                        <text class="paragraph">
                            你可通过微信小程序使用本服务。我们有权根据产品需要对服务形式进行调整。
                        </text>
                        <text class="paragraph bold">2.3 服务许可范围</text>
                        <text class="paragraph">
                            我们给予你一项个人的、不可转让及非排他性的许可，以使用本软件。你可以为非商业目的使用本软件及服务。
                        </text>
                    </view>
                </view>

                <!-- 三、账号规范 -->
                <view class="section">
                    <text class="section-title">三、账号使用规范</text>
                    <view class="section-content">
                        <text class="paragraph bold">3.1 账号注册</text>
                        <text class="paragraph">
                            你需要通过微信授权登录使用本服务。你在使用本服务前需要授权获取你的微信昵称、头像等基本信息。
                        </text>
                        <text class="paragraph bold">3.2 账号安全</text>
                        <text class="paragraph">
                            用户有责任妥善保管账户信息的安全。用户需要对其账户下的行为承担法律责任。当你怀疑他人在使用你的账号时，请立即通知我们。
                        </text>
                        <text class="paragraph bold">3.3 账号回收</text>
                        <text class="paragraph">
                            用户注册账号后如果长期不登录该账号，我们有权回收该账号，以免造成资源浪费，由此带来的任何损失均由用户自行承担。
                        </text>
                    </view>
                </view>

                <!-- 四、用户行为规范 -->
                <view class="section">
                    <text class="section-title">四、用户行为规范</text>
                    <view class="section-content">
                        <text class="paragraph bold">4.1 信息内容规范</text>
                        <text class="paragraph">
                            用户使用本软件过程中所记录、发布、传播的任何内容，包括但不限于账号头像、昵称、梦境记录、评论、点赞等信息，应当遵守国家法律法规，不得包含以下内容：
                        </text>
                        <text class="paragraph list-item">（1）违反宪法所确定的基本原则的；</text>
                        <text class="paragraph list-item">（2）危害国家安全，泄露国家秘密的；</text>
                        <text class="paragraph list-item">（3）颠覆国家政权，破坏国家统一的；</text>
                        <text class="paragraph list-item">（4）损害国家荣誉和利益的；</text>
                        <text class="paragraph list-item">（5）煽动民族仇恨、民族歧视的；</text>
                        <text class="paragraph list-item">（6）破坏国家宗教政策的；</text>
                        <text class="paragraph list-item">（7）散布谣言，扰乱社会秩序的；</text>
                        <text class="paragraph list-item">（8）散布淫秽、色情、赌博、暴力、恐怖或教唆犯罪的；</text>
                        <text class="paragraph list-item">（9）侮辱或诽谤他人，侵害他人合法权益的；</text>
                        <text class="paragraph list-item">（10）法律、行政法规禁止的其他内容。</text>
                        <text class="paragraph bold">4.2 禁止行为</text>
                        <text class="paragraph">
                            除非法律允许或我们书面许可，你使用本服务过程中不得从事下列行为：
                        </text>
                        <text class="paragraph list-item">（1）提交、发布虚假信息，或冒充他人；</text>
                        <text class="paragraph list-item">（2）诱导其他用户进行违规操作；</text>
                        <text class="paragraph list-item">（3）使用任何外挂、插件、机器人程序等非法手段；</text>
                        <text class="paragraph list-item">（4）对本软件进行反向工程、反向汇编、反向编译；</text>
                        <text class="paragraph list-item">（5）利用本服务从事任何违法犯罪活动。</text>
                    </view>
                </view>

                <!-- 五、AI服务说明 -->
                <view class="section">
                    <text class="section-title">五、AI服务特别说明</text>
                    <view class="section-content">
                        <text class="paragraph bold">5.1 AI解析声明</text>
                        <text class="paragraph">
                            本服务中的AI梦境解析功能基于人工智能技术，其解析结果仅供娱乐和参考，不构成任何专业的心理咨询、医疗诊断或其他专业建议。
                        </text>
                        <text class="paragraph bold">5.2 运势提示声明</text>
                        <text class="paragraph">
                            AI生成的运势提示、改运任务等内容仅为娱乐性质，不具有任何科学依据或预测能力，用户不应将其作为决策依据。
                        </text>
                        <text class="paragraph bold">5.3 结果准确性</text>
                        <text class="paragraph">
                            由于AI技术的局限性，解析结果可能存在不准确、不完整或不适用的情况。我们不对AI生成内容的准确性、完整性或适用性作出任何保证。
                        </text>
                    </view>
                </view>

                <!-- 六、知识产权 -->
                <view class="section">
                    <text class="section-title">六、知识产权声明</text>
                    <view class="section-content">
                        <text class="paragraph">
                            6.1
                            本软件的一切著作权、商标权、专利权、商业秘密等知识产权，以及与本软件相关的所有信息内容（包括但不限于文字、图片、音频、视频、图表、界面设计、版面框架、有关数据或电子文档等）均受法律保护，我们享有上述知识产权。
                        </text>
                        <text class="paragraph">
                            6.2
                            用户在本服务中记录、发布的梦境内容，其知识产权归用户所有。用户授权我们在法律允许的范围内使用该内容，包括但不限于存储、展示、AI分析等。
                        </text>
                        <text class="paragraph">
                            6.3
                            未经我们或相关权利人书面同意，你不得为任何商业或非商业目的自行或许可任何第三方实施、利用、转让上述知识产权。
                        </text>
                    </view>
                </view>

                <!-- 七、免责声明 -->
                <view class="section">
                    <text class="section-title">七、免责声明</text>
                    <view class="section-content">
                        <text class="paragraph bold">
                            7.1
                            你理解并同意，在使用本服务的过程中，可能会遇到不可抗力等风险因素，使本服务发生中断。不可抗力是指不能预见、不能克服并不能避免的客观事件，包括但不限于自然灾害、政府行为、网络故障等。
                        </text>
                        <text class="paragraph bold">
                            7.2
                            你理解并同意，鉴于网络服务的特殊性，我们有权根据业务发展情况，对本服务的全部或部分内容进行变更、暂停、限制或终止。
                        </text>
                        <text class="paragraph bold">
                            7.3
                            AI解析结果仅供参考，我们不对其准确性、适用性承担任何责任。如你因依赖AI解析结果而做出任何决定，由此产生的后果由你自行承担。
                        </text>
                        <text class="paragraph bold">
                            7.4 你必须为自己账号下的一切行为负责，包括你所发表的任何内容及由此产生的任何后果。
                        </text>
                    </view>
                </view>

                <!-- 八、服务变更与终止 -->
                <view class="section">
                    <text class="section-title">八、服务变更与终止</text>
                    <view class="section-content">
                        <text class="paragraph">
                            8.1 我们有权根据业务发展需要，修改或中断部分或全部服务，并通过适当方式通知用户。
                        </text>
                        <text class="paragraph">
                            8.2 如用户违反本协议约定，我们有权采取包括但不限于警告、限制功能、封禁账号等措施。
                        </text>
                        <text class="paragraph"> 8.3 用户可以随时通过账号注销功能终止使用本服务。 </text>
                    </view>
                </view>

                <!-- 九、未成年人保护 -->
                <view class="section">
                    <text class="section-title">九、未成年人保护</text>
                    <view class="section-content">
                        <text class="paragraph">
                            9.1
                            我们非常重视对未成年人个人信息的保护。若你是18周岁以下的未成年人，在使用本服务前，应事先取得你的家长或法定监护人的书面同意。
                        </text>
                        <text class="paragraph">
                            9.2
                            若你是未成年人的监护人，当你对你所监护的未成年人的个人信息有相关疑问时，请通过本协议所列途径与我们联系。
                        </text>
                    </view>
                </view>

                <!-- 十、其他 -->
                <view class="section">
                    <text class="section-title">十、其他</text>
                    <view class="section-content">
                        <text class="paragraph">
                            10.1
                            你使用本软件即视为你已阅读并同意受本协议的约束。我们有权在必要时修改本协议条款，并以适当的方式提醒你。
                        </text>
                        <text class="paragraph">
                            10.2 本协议的成立、生效、履行、解释及纠纷解决，适用中华人民共和国法律。
                        </text>
                        <text class="paragraph">
                            10.3
                            若你和我们之间发生任何纠纷或争议，首先应友好协商解决；协商不成的，你同意将纠纷或争议提交有管辖权的人民法院管辖。
                        </text>
                        <text class="paragraph">
                            10.4 本协议所有条款的标题仅为阅读方便，本身并无实际涵义，不能作为本协议涵义解释的依据。
                        </text>
                    </view>
                </view>

                <!-- 联系我们 -->
                <view class="section">
                    <text class="section-title">十一、联系我们</text>
                    <view class="section-content">
                        <text class="paragraph">
                            如果你对本协议或服务有任何疑问或建议，可以通过以下方式与我们联系：
                        </text>
                        <text class="paragraph list-item">邮箱：drim@131462.wang</text>
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

.agreement-page {
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

        .agreement-header {
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

.agreement-content {
    flex: 1;
    padding-top: calc(v-bind('navBarHeight') * 2rpx);
}

.content-wrapper {
    padding: 40rpx;
    padding-bottom: 80rpx;
    background: #fff;
}

.agreement-header {
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
