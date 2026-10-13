<template>
    <view
        class="page dream-detail-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar title="梦境详情" />

        <!-- 加载中 -->
        <view
            v-if="loading"
            class="loading-container"
        >
            <view class="loading-animation"></view>
            <text class="loading-text">加载中...</text>
        </view>

        <!-- 内容 -->
        <template v-else-if="dream">
            <view
                class="detail-content"
                :style="{ paddingTop: (navBarHeight + 16) * 2 + 'rpx' }"
            >
                <!-- 头部区域 -->
                <view class="detail-header">
                    <text class="dream-title">{{ dream.analysis?.theme || '我的梦境' }}</text>
                    <text class="dream-date">{{ formatDate(dream.createdAt) }}</text>
                </view>

                <!-- 梦境内容卡片 -->
                <view class="card">
                    <!-- 版本信息栏 -->
                    <view class="version-info-bar">
                        <view class="version-badges">
                            <!-- 版本类型徽章 -->
                            <view
                                class="version-type-badge"
                                :class="{ original: currentVersionType === 'original' }"
                            >
                                <image
                                    v-if="currentVersionType === 'polished'"
                                    class="badge-icon"
                                    src="/static/icons/star.svg"
                                    mode="aspectFit"
                                />
                                <text>{{
                                    currentVersionType === 'polished'
                                        ? '润色版本'
                                        : currentVersionType === 'edited'
                                          ? '编辑版本'
                                          : '原始版本'
                                }}</text>
                            </view>

                            <!-- 隐私徽章 -->
                            <view
                                v-if="source === 'own'"
                                class="privacy-badge"
                                :class="{ public: dream.isPublic }"
                                @tap="togglePrivacy"
                            >
                                <image
                                    class="privacy-icon"
                                    src="/static/icons/lock.svg"
                                    mode="aspectFit"
                                />
                                <text>{{ dream.isPublic ? '公开' : '私密' }}</text>
                            </view>
                        </view>

                        <view class="version-actions">
                            <!-- 版本历史链接 -->
                            <view
                                v-if="source === 'own'"
                                class="version-history-link"
                                @tap="goToVersionHistory"
                            >
                                <image
                                    class="history-icon"
                                    src="/static/icons/clock.svg"
                                    mode="aspectFit"
                                />
                                <text>历史</text>
                            </view>

                            <!-- 更多操作按钮（自己的和探索的梦境都显示） -->
                            <view
                                class="more-btn"
                                @tap="showActionSheet = true"
                            >
                                <view class="more-dots">
                                    <view class="dot"></view>
                                    <view class="dot"></view>
                                    <view class="dot"></view>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 作者信息（公开梦境） -->
                    <view
                        v-if="dream.author && source !== 'own'"
                        class="author-section"
                        @tap="goToUserProfile(dream.author.id)"
                    >
                        <view class="author-avatar">
                            <image
                                v-if="dream.author.avatar && !avatarError"
                                class="avatar-image"
                                :src="dream.author.avatar"
                                mode="aspectFill"
                                @error="avatarError = true"
                            />
                            <text
                                v-else-if="dream.author.nickname"
                                class="avatar-text"
                                >{{ getAvatarText(dream.author.nickname) }}</text
                            >
                            <image
                                v-else
                                class="avatar-placeholder"
                                src="/static/icons/user.svg"
                                mode="aspectFit"
                                aria-hidden="true"
                            />
                        </view>
                        <view class="author-info">
                            <text class="author-name">{{ dream.author.nickname }}</text>
                            <text class="author-label">梦想家</text>
                        </view>
                    </view>

                    <text class="dream-content">{{ dream.content }}</text>

                    <!-- 统计信息（公开梦境） -->
                    <view
                        v-if="dream.author && source !== 'own'"
                        class="dream-stats"
                    >
                        <view
                            class="stat-item like-btn"
                            :class="{ liked: dream.isLiked }"
                            @tap="toggleLike"
                        >
                            <image
                                class="stat-icon"
                                src="/static/icons/heart.svg"
                                mode="aspectFit"
                            />
                            <text>{{ dream.likeCount || 0 }}</text>
                        </view>
                        <view class="stat-item">
                            <image
                                class="stat-icon"
                                src="/static/icons/eye.svg"
                                mode="aspectFit"
                            />
                            <text>{{ dream.viewCount || 0 }}</text>
                        </view>
                    </view>
                </view>

                <!-- 解析结果（如果有） -->
                <view
                    v-if="dream.analysis && dream.analysis.interpretation"
                    class="card analysis-card"
                >
                    <view class="card-header">
                        <image
                            class="card-title-icon"
                            src="/static/icons/sparkle.svg"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
                        <text class="card-title">梦境解析</text>
                    </view>

                    <!-- 运势评分展示 -->
                    <view
                        v-if="dream.analysis.fortuneScore"
                        class="fortune-score-section"
                    >
                        <view class="score-ring-container">
                            <view class="score-ring">
                                <svg
                                    class="score-svg"
                                    viewBox="0 0 100 100"
                                >
                                    <!-- 背景圆环 -->
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="#f0f0f0"
                                        stroke-width="8"
                                    />
                                    <!-- 进度圆环 -->
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        :stroke="getScoreColor(dream.analysis.fortuneScore)"
                                        stroke-width="8"
                                        stroke-linecap="round"
                                        :stroke-dasharray="getScoreDasharray(dream.analysis.fortuneScore)"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <view class="score-value">
                                    <text class="score-number">{{ dream.analysis.fortuneScore }}</text>
                                    <text class="score-label">运势</text>
                                </view>
                            </view>
                        </view>
                        <view class="score-info">
                            <text class="score-level">{{ getScoreLevel(dream.analysis.fortuneScore) }}</text>
                            <text
                                v-if="dream.analysis.fortuneTips?.scoreReason"
                                class="score-reason"
                                >{{ dream.analysis.fortuneTips.scoreReason }}</text
                            >
                        </view>
                    </view>

                    <text class="analysis-text">{{ dream.analysis.interpretation }}</text>
                </view>
            </view>
        </template>

        <!-- 底部操作菜单 -->
        <view
            v-if="showActionSheet"
            class="action-sheet-mask"
            @tap="showActionSheet = false"
        >
            <view
                class="action-sheet"
                @tap.stop
            >
                <view class="action-sheet-header">
                    <text class="action-sheet-title">更多操作</text>
                </view>
                <view class="action-sheet-list">
                    <!-- 编辑梦境（仅自己的梦境） -->
                    <view
                        v-if="source === 'own'"
                        class="action-sheet-item"
                        @tap="handleEditFromSheet"
                    >
                        <view class="action-item-icon edit">
                            <image
                                class="action-icon"
                                src="/static/icons/edit.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="action-item-content">
                            <text class="action-item-title">编辑梦境</text>
                            <text class="action-item-desc">修改梦境内容</text>
                        </view>
                    </view>
                    <!-- 分享梦境（所有梦境都可以分享） -->
                    <view
                        class="action-sheet-item"
                        @tap="handleShareFromSheet"
                    >
                        <view class="action-item-icon share">
                            <image
                                class="action-icon"
                                src="/static/icons/share.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="action-item-content">
                            <text class="action-item-title">分享梦境</text>
                            <text class="action-item-desc">分享给好友或复制内容</text>
                        </view>
                    </view>
                    <!-- 删除梦境（仅自己的梦境） -->
                    <view
                        v-if="source === 'own'"
                        class="action-sheet-item danger"
                        @tap="handleDeleteFromSheet"
                    >
                        <view class="action-item-icon delete">
                            <image
                                class="action-icon"
                                src="/static/icons/delete.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="action-item-content">
                            <text class="action-item-title">删除梦境</text>
                            <text class="action-item-desc">删除后无法恢复</text>
                        </view>
                    </view>
                </view>
                <view
                    class="action-sheet-cancel"
                    @tap="showActionSheet = false"
                >
                    <text>取消</text>
                </view>
            </view>
        </view>

        <!-- 分享弹窗 -->
        <view
            v-if="showShareModal"
            class="share-modal-mask"
            @tap="showShareModal = false"
        >
            <view
                class="share-modal"
                @tap.stop
            >
                <view class="share-modal-header">
                    <text class="share-modal-title">分享梦境</text>
                    <view
                        class="share-modal-close"
                        @tap="showShareModal = false"
                        aria-label="关闭分享"
                    >
                        <image
                            class="close-icon"
                            src="/static/icons/close.svg"
                            mode="aspectFit"
                            aria-hidden="true"
                        />
                    </view>
                </view>

                <view class="share-options">
                    <button
                        class="share-option-card"
                        open-type="share"
                    >
                        <view class="share-card-icon wechat">
                            <image
                                class="share-icon-img"
                                src="/static/icons/share.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="share-card-info">
                            <text class="share-card-title">分享给微信好友</text>
                            <text class="share-card-desc">让朋友一起解读你的梦境</text>
                        </view>
                    </button>
                    <view
                        class="share-option-card"
                        @tap="handleCopyContent"
                    >
                        <view class="share-card-icon copy">
                            <image
                                class="share-icon-img"
                                src="/static/icons/copy.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="share-card-info">
                            <text class="share-card-title">复制梦境内容</text>
                            <text class="share-card-desc">复制文字到剪贴板</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 隐藏的 canvas 用于生成分享图片 -->
        <canvas
            canvas-id="shareCanvas"
            class="share-canvas"
            style="position: fixed; left: -9999px; top: -9999px; width: 500px; height: 400px"
        />
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app';
import { useDreamStore, useUserStore } from '@/stores';
import { dreamApi, exploreApi } from '@/api';
import { showSimplePointsReward } from '@/utils/feedback';
import NavBar from '@/components/NavBar/index.vue';

const dreamStore = useDreamStore();
const userStore = useUserStore();
const loading = ref(true);
const dream = ref<any>(null);
const navBarHeight = ref(0);
const currentVersionType = ref('original');
const dreamId = ref('');
const source = ref('own'); // 来源：random/filter/own
const avatarError = ref(false);
const showActionSheet = ref(false);

// 分享相关状态
const showShareModal = ref(false);
const shareImagePath = ref(''); // 动态生成的分享图片路径

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('zh-CN');
}

// 运势评分相关函数
function getScoreColor(score: number): string {
    if (score >= 85) return '#10b981'; // 绿色 - 大吉
    if (score >= 75) return '#6b4eff'; // 紫色 - 吉
    if (score >= 65) return '#f59e0b'; // 橙色 - 中
    return '#ef4444'; // 红色 - 需注意
}

function getScoreDasharray(score: number): string {
    const circumference = 2 * Math.PI * 42; // 圆周长
    const progress = (score / 100) * circumference;
    return `${progress} ${circumference}`;
}

function getScoreLevel(score: number): string {
    if (score >= 85) return '大吉大利';
    if (score >= 75) return '运势不错';
    if (score >= 65) return '平稳安定';
    return '宜静待时';
}

function getAvatarText(nickname: string) {
    if (!nickname) return '';
    return nickname.charAt(0).toUpperCase();
}

function goToVersionHistory() {
    if (!dreamId.value) {
        uni.showToast({ title: '无法获取梦境ID', icon: 'none' });
        return;
    }
    uni.navigateTo({
        url: `/pages/dream-versions/index?dreamId=${dreamId.value}`
    });
}

function goToUserProfile(authorId: string) {
    if (authorId === userStore.userInfo?.id) {
        uni.switchTab({ url: '/pages/profile/index' });
        return;
    }
    uni.navigateTo({
        url: `/pages/user-profile/index?userId=${authorId}`
    });
}

async function togglePrivacy() {
    if (!dream.value) return;

    try {
        const response = await dreamApi.togglePrivacy(dreamId.value);
        dream.value.isPublic = response.isPublic;

        uni.showToast({
            title: response.isPublic ? '已设为公开' : '已设为私密',
            icon: 'success',
            duration: 1500
        });
    } catch (error: any) {
        console.error('切换隐私状态失败:', error);
        uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
        });
    }
}

async function toggleLike() {
    if (!dream.value) return;

    try {
        const response = await exploreApi.toggleLike(dreamId.value);

        // 更新本地状态
        dream.value.isLiked = response.isLiked;
        dream.value.likeCount = response.likeCount;

        // 显示反馈
        uni.showToast({
            title: response.isLiked ? '已点赞' : '已取消',
            icon: 'none',
            duration: 1000
        });
    } catch (error: any) {
        console.error('点赞失败:', error);
        uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
        });
    }
}

async function loadDreamDetail() {
    try {
        loading.value = true;

        // 根据来源选择不同的API
        if (source.value === 'random' || source.value === 'filter') {
            // 从探索页面进入，使用explore API
            const response = await exploreApi.viewDream(dreamId.value, source.value);
            dream.value = response;

            // 显示浏览积分奖励
            if (response.rewards?.viewReward) {
                showSimplePointsReward(response.rewards.viewReward, '浏览');
            }
        } else {
            // 从自己的梦境列表进入，使用dream API
            dream.value = await dreamApi.getById(dreamId.value);
        }

        currentVersionType.value = dream.value.currentVersionType || 'original';

        loading.value = false;

        // 生成分享图片
        setTimeout(() => {
            generateShareImage();
        }, 500);
    } catch (error: any) {
        loading.value = false;
        console.error('加载梦境详情失败:', error);
        uni.showToast({
            title: error.message || '加载失败',
            icon: 'none',
            duration: 2000
        });
        setTimeout(() => {
            safeNavigateBack();
        }, 2000);
    }
}

// 安全返回函数：检查页面栈，避免在首页调用 navigateBack 报错
function safeNavigateBack() {
    const pages = getCurrentPages();
    if (pages.length <= 1) {
        // 没有上一页（如从分享链接直接进入），跳转到首页
        uni.switchTab({ url: '/pages/index/index' });
    } else {
        uni.navigateBack();
    }
}

async function handleDelete() {
    uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定删除这条梦境记录吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    uni.showLoading({ title: '删除中...' });
                    await dreamStore.deleteDream(dreamId.value);
                    uni.hideLoading();
                    uni.showToast({ title: '已删除', icon: 'success' });
                    setTimeout(() => {
                        safeNavigateBack();
                    }, 1500);
                } catch (error: any) {
                    uni.hideLoading();
                    console.error('删除失败:', error);
                    uni.showToast({
                        title: error.message || '删除失败',
                        icon: 'none'
                    });
                }
            }
        }
    });
}

function handleDeleteFromSheet() {
    showActionSheet.value = false;
    // 延迟一下再弹确认框，让菜单先关闭
    setTimeout(() => {
        handleDelete();
    }, 200);
}

// 编辑相关方法 - 跳转到记梦页面进行编辑
function handleEditFromSheet() {
    if (!dream.value || source.value !== 'own') return;
    showActionSheet.value = false;
    setTimeout(() => {
        // 将当前梦境信息存入 storage，供记梦页面读取
        uni.removeStorageSync('editingVersion');
        uni.setStorageSync('editingDream', {
            dreamId: dreamId.value,
            content: dream.value?.content || '',
            originalContent: dream.value?.originalContent,
            currentVersionType: dream.value?.currentVersionType,
            tags: dream.value?.tags || [],
            emotion: dream.value?.emotion || null,
            isPublic: dream.value?.isPublic || false,
            hasAnalysis: !!dream.value?.analysis,
            isEditMode: true // 标记为编辑模式
        });
        uni.navigateTo({
            url: '/pages/record/editor',
            fail: () => {
                uni.removeStorageSync('editingDream');
                uni.showToast({ title: '跳转失败，请重试', icon: 'none' });
            }
        });
    }, 200);
}

// 分享相关方法
function handleShareFromSheet() {
    showActionSheet.value = false;
    setTimeout(() => {
        showShareModal.value = true;
    }, 200);
}

function handleCopyContent() {
    if (!dream.value?.content) return;

    const content = `【我的梦境】\n${dream.value.content}\n\n${dream.value.analysis?.interpretation ? '【梦境解析】\n' + dream.value.analysis.interpretation : ''}`;

    uni.setClipboardData({
        data: content,
        success: () => {
            showShareModal.value = false;
            uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
        }
    });
}

// 生成分享图片
function generateShareImage() {
    if (!dream.value) return;

    const ctx = uni.createCanvasContext('shareCanvas');
    const width = 500;
    const height = 400;

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, width, height);

    // 绘制半透明内容区域
    ctx.setFillStyle('rgba(255, 255, 255, 0.15)');
    ctx.beginPath();
    ctx.moveTo(30, 80);
    ctx.arcTo(width - 30, 80, width - 30, height - 80, 16);
    ctx.arcTo(width - 30, height - 80, 30, height - 80, 16);
    ctx.arcTo(30, height - 80, 30, 80, 16);
    ctx.arcTo(30, 80, width - 30, 80, 16);
    ctx.fill();

    // 绘制应用名称
    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(24);
    ctx.fillText('梦见', 50, 50);

    // 绘制副标题
    ctx.setFontSize(14);
    ctx.setGlobalAlpha(0.8);
    ctx.fillText('记录梦境，解读心灵', 100, 50);
    ctx.setGlobalAlpha(1);

    // 绘制梦境内容（自动换行）
    ctx.setFontSize(18);
    const content = dream.value.content || '';
    const maxWidth = width - 100;
    const lineHeight = 28;
    let y = 120;

    // 简单的文字换行处理
    let line = '';
    for (let i = 0; i < content.length && y < height - 100; i++) {
        const char = content[i];
        const testLine = line + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
            ctx.fillText(line, 50, y);
            line = char;
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line && y < height - 100) {
        ctx.fillText(line + (content.length > 100 ? '...' : ''), 50, y);
    }

    // 绘制日期
    ctx.setFontSize(14);
    ctx.setGlobalAlpha(0.7);
    const dateStr = dream.value.createdAt ? formatDate(dream.value.createdAt) : '';
    ctx.fillText(dateStr, 50, height - 40);

    // 绘制提示文字
    ctx.setGlobalAlpha(0.9);
    ctx.fillText('点击查看完整解析', width - 150, height - 40);
    ctx.setGlobalAlpha(1);

    // 绘制完成，导出图片
    ctx.draw(false, () => {
        setTimeout(() => {
            uni.canvasToTempFilePath({
                canvasId: 'shareCanvas',
                success: (res) => {
                    shareImagePath.value = res.tempFilePath;
                    console.log('分享图片生成成功:', res.tempFilePath);
                },
                fail: (err) => {
                    console.error('生成分享图片失败:', err);
                }
            });
        }, 100);
    });
}

// 微信分享配置
onShareAppMessage(() => {
    const theme = dream.value?.analysis?.theme || '我的梦境';
    return {
        title: theme,
        path: `/pages/dream-detail/index?id=${dreamId.value}&source=share`,
        imageUrl: shareImagePath.value || '/static/logo.png'
    };
});

// 页面加载时获取参数
onLoad((options) => {
    console.log('页面参数:', options);

    // 获取参数
    dreamId.value = options?.id || '';
    source.value = options?.source || 'own';

    // 参数校验
    if (!dreamId.value) {
        console.error('梦境ID缺失');
        uni.showToast({ title: '参数错误', icon: 'none' });
        setTimeout(() => {
            safeNavigateBack();
        }, 1500);
    }
});

onShow(() => {
    if (source.value === 'own' && dream.value && !loading.value) void loadDreamDetail();
});

onMounted(async () => {
    const systemInfo = uni.getSystemInfoSync();
    navBarHeight.value = (systemInfo.statusBarHeight || 0) + 44;

    // 如果参数有效，加载数据
    if (dreamId.value) {
        await loadDreamDetail();
    }
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.dream-detail-page {
    min-height: 100vh;
    background: $bg-page;
    transition: background-color 0.3s ease;

    &.dark-mode {
        background: $dark-bg-page;

        .dream-title {
            color: $dark-text-primary;
        }

        .dream-date {
            color: $dark-text-secondary;
        }

        .card {
            background: $dark-bg-card;
            box-shadow: $dark-shadow-sm;
        }

        .dream-content {
            color: $dark-text-primary;
        }

        .loading-text {
            color: $dark-text-secondary;
        }

        // 版本信息栏
        .version-info-bar {
            border-bottom-color: $dark-border-color;
        }

        .version-type-badge {
            background: $dark-primary-light;
            color: $dark-primary-color;

            &.original {
                background: rgba(16, 185, 129, 0.15);
                color: #34d399;
            }
        }

        .privacy-badge {
            background: $dark-bg-secondary;
            color: $dark-text-secondary;

            &.public {
                background: rgba(2, 132, 199, 0.15);
                color: #38bdf8;
            }
        }

        .version-history-link {
            background: $dark-bg-card;
            border-color: $dark-border-color;
            color: $dark-text-secondary;

            &:active {
                border-color: $dark-primary-color;
                color: $dark-primary-color;
            }
        }

        // 作者信息
        .author-section {
            border-bottom-color: $dark-border-color;
        }

        .author-name {
            color: $dark-text-primary;
        }

        .author-label {
            color: $dark-text-secondary;
        }

        // 统计信息
        .dream-stats {
            border-top-color: $dark-border-color;
        }

        .stat-item {
            color: $dark-text-secondary;

            &.liked {
                color: #ff6b6b;
            }
        }

        // 解析卡片
        .card-title {
            color: $dark-text-primary;
        }

        .card-title-icon,
        .close-icon {
            filter: brightness(1.4);
        }

        .analysis-text {
            color: $dark-text-primary;
        }

        // 运势评分区域
        .fortune-score-section {
            background: linear-gradient(135deg, rgba(139, 110, 255, 0.1) 0%, rgba(255, 107, 158, 0.08) 100%);
        }

        .score-number {
            color: $dark-text-primary;
        }

        .score-label {
            color: $dark-text-secondary;
        }

        .score-level {
            color: $dark-text-primary;
        }

        .score-reason {
            color: $dark-text-secondary;
        }

        .score-svg circle:first-child {
            stroke: rgba(255, 255, 255, 0.1);
        }

        // 图标
        .delete-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);

            &:active {
                filter: brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(338deg)
                    brightness(109%) contrast(101%);
            }
        }

        .badge-icon {
            filter: brightness(0) saturate(100%) invert(58%) sepia(61%) saturate(4261%) hue-rotate(228deg)
                brightness(101%) contrast(101%);
        }

        .privacy-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);
        }

        .privacy-badge.public .privacy-icon {
            filter: brightness(0) saturate(100%) invert(60%) sepia(94%) saturate(1138%) hue-rotate(162deg)
                brightness(91%) contrast(91%);
        }

        .history-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);
        }

        .version-history-link:active .history-icon {
            filter: brightness(0) saturate(100%) invert(58%) sepia(61%) saturate(4261%) hue-rotate(228deg)
                brightness(101%) contrast(101%);
        }

        .stat-icon {
            filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
                contrast(87%);
        }

        // 更多按钮
        .more-btn {
            background: $dark-bg-secondary;

            &:active {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .more-dots .dot {
            background: $dark-text-secondary;
        }

        // 底部操作菜单
        .action-sheet {
            background: $dark-bg-card;
        }

        .action-sheet-header {
            border-bottom-color: $dark-border-color;
        }

        .action-sheet-title {
            color: $dark-text-primary;
        }

        .action-sheet-item {
            background: $dark-bg-secondary;

            &:active {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .action-item-title {
            color: $dark-text-primary;
        }

        .action-item-desc {
            color: $dark-text-secondary;
        }

        .action-sheet-cancel {
            background: $dark-bg-secondary;
            color: $dark-text-secondary;

            &:active {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        // 编辑弹窗
        .edit-modal {
            background: $dark-bg-card;
        }

        .edit-modal-header {
            border-bottom-color: $dark-border-color;
        }

        .edit-modal-title {
            color: $dark-text-primary;
        }

        .edit-modal-close {
            background: $dark-bg-secondary;
            color: $dark-text-secondary;

            &:active {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .edit-textarea {
            background: $dark-bg-secondary;
            color: $dark-text-primary;
        }

        .edit-word-count {
            color: $dark-text-secondary;
        }

        .edit-modal-footer {
            border-top-color: $dark-border-color;
        }

        .edit-tip {
            color: $dark-text-secondary;
        }

        .edit-btn {
            &.cancel {
                background: $dark-bg-secondary;
                color: $dark-text-secondary;
            }

            &.save {
                background: rgba(255, 255, 255, 0.1);
                color: $dark-text-primary;
            }
        }

        // 分享弹窗
        .share-modal {
            background: $dark-bg-card;
        }

        .share-modal-header {
            border-bottom-color: $dark-border-color;
        }

        .share-modal-title {
            color: $dark-text-primary;
        }

        .share-modal-close {
            background: $dark-bg-secondary;
            color: $dark-text-secondary;

            &:active {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .share-option-card {
            background: $dark-bg-secondary;

            &:active {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .share-card-title {
            color: $dark-text-primary;
        }

        .share-card-desc {
            color: $dark-text-secondary;
        }
    }
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 32rpx;
}

.detail-content {
    padding: 40rpx;
}

.detail-header {
    margin-bottom: 32rpx;
}

.dream-title {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 16rpx;
}

.dream-date {
    font-size: 28rpx;
    color: $text-secondary;
}

.card {
    background: #fff;
    border-radius: 32rpx;
    padding: 48rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    margin-bottom: 32rpx;
}

.dream-content {
    font-size: 32rpx;
    color: $text-primary;
    line-height: 1.8;
    display: block;
    word-wrap: break-word;
    word-break: normal;
    white-space: normal;
    overflow-wrap: anywhere;
    max-width: 100%;
}

// 版本信息栏
.version-info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 32rpx;
    margin-bottom: 32rpx;
    border-bottom: 1rpx solid #f7fafc;
}

.version-badges {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.version-type-badge {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 24rpx;
    background: $primary-light;
    color: $primary-color;
    border-radius: 24rpx;
    font-size: 24rpx;
    font-weight: 600;

    &.original {
        background: #d1fae5;
        color: #10b981;
    }
}

.badge-icon {
    width: 24rpx;
    height: 24rpx;
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
    transition: filter 0.3s ease;
}

.privacy-badge {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 20rpx;
    background: #f7fafc;
    color: $text-secondary;
    border-radius: 24rpx;
    font-size: 22rpx;
    font-weight: 500;

    &.public {
        background: #e0f2fe;
        color: #0284c7;
    }
}

.privacy-icon {
    width: 20rpx;
    height: 20rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.3s ease;
}

.privacy-badge.public .privacy-icon {
    filter: brightness(0) saturate(100%) invert(42%) sepia(94%) saturate(1138%) hue-rotate(162deg) brightness(91%)
        contrast(91%);
}

.version-history-link {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    background: #fff;
    border: 3rpx solid $border-color;
    border-radius: 24rpx;
    font-size: 24rpx;
    color: $text-secondary;
    transition: all 0.2s;

    &:active {
        transform: scale(0.95);
        border-color: $primary-color;
        color: $primary-color;
    }
}

.history-icon {
    width: 24rpx;
    height: 24rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.3s ease;
}

.version-history-link:active .history-icon {
    filter: brightness(0) saturate(100%) invert(38%) sepia(79%) saturate(2785%) hue-rotate(237deg) brightness(101%)
        contrast(104%);
}

// 作者信息
.author-section {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding-bottom: 32rpx;
    margin-bottom: 32rpx;
    border-bottom: 1rpx solid #f7fafc;
}

.author-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .avatar-image {
        width: 100%;
        height: 100%;
    }

    .avatar-text {
        font-size: 36rpx;
        font-weight: 600;
        color: #fff;
    }
}

.author-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.author-name {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
}

.author-label {
    font-size: 24rpx;
    color: $text-secondary;
}

// 统计信息
.dream-stats {
    display: flex;
    align-items: center;
    gap: 40rpx;
    padding-top: 32rpx;
    margin-top: 32rpx;
    border-top: 1rpx solid #f7fafc;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 28rpx;
    color: $text-secondary;

    &.like-btn {
        cursor: pointer;
        transition: all 0.2s;

        &:active {
            transform: scale(0.95);
        }

        &.liked {
            color: #ff6b6b;

            .stat-icon {
                filter: brightness(0) saturate(100%) invert(58%) sepia(85%) saturate(2658%) hue-rotate(329deg)
                    brightness(103%) contrast(101%);
            }
        }
    }
}

.stat-icon {
    width: 36rpx;
    height: 36rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.2s;
}

// 解析卡片
.analysis-card {
    margin-top: 32rpx;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
}

.card-title-icon {
    width: 32rpx;
    height: 32rpx;
    flex-shrink: 0;
}

.avatar-placeholder {
    width: 40rpx;
    height: 40rpx;
    filter: brightness(0) invert(1);
}

.card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
}

// 运势评分区域
.fortune-score-section {
    display: flex;
    align-items: center;
    gap: 32rpx;
    padding: 32rpx;
    margin-bottom: 32rpx;
    background: linear-gradient(135deg, #f8f7ff 0%, #fff5f7 100%);
    border-radius: 24rpx;
}

.score-ring-container {
    flex-shrink: 0;
}

.score-ring {
    position: relative;
    width: 140rpx;
    height: 140rpx;
}

.score-svg {
    width: 100%;
    height: 100%;
}

.score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.score-number {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    line-height: 1;
}

.score-label {
    font-size: 20rpx;
    color: $text-secondary;
    margin-top: 4rpx;
}

.score-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.score-level {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
}

.score-reason {
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.5;
}

.analysis-text {
    font-size: 28rpx;
    line-height: 1.8;
    color: $text-primary;
    display: block;
}

// 版本操作区
.version-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

// 更多按钮
.more-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    background: #f7fafc;
    transition: all 0.2s;

    &:active {
        background: #edf2f7;
        transform: scale(0.95);
    }
}

.more-dots {
    display: flex;
    align-items: center;
    gap: 6rpx;

    .dot {
        width: 8rpx;
        height: 8rpx;
        border-radius: 50%;
        background: $text-secondary;
        transition: background 0.2s;
    }
}

// 底部操作菜单
.action-sheet-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.action-sheet {
    width: 100%;
    background: #fff;
    border-radius: 32rpx 32rpx 0 0;
    padding: 32rpx;
    padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

.action-sheet-header {
    padding-bottom: 24rpx;
    margin-bottom: 16rpx;
    border-bottom: 1rpx solid #f7fafc;
}

.action-sheet-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
}

.action-sheet-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.action-sheet-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 24rpx;
    border-radius: 20rpx;
    background: #f7fafc;
    transition: all 0.2s;

    &:active {
        background: #edf2f7;
        transform: scale(0.98);
    }

    &.danger {
        .action-item-title {
            color: #ff6b6b;
        }
    }
}

.action-item-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.edit {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.share {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.delete {
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
    }
}

.action-icon {
    width: 40rpx;
    height: 40rpx;
    filter: brightness(0) invert(1);
}

.action-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.action-item-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
}

.action-item-desc {
    font-size: 24rpx;
    color: $text-secondary;
}

.action-sheet-cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28rpx;
    margin-top: 24rpx;
    border-radius: 20rpx;
    background: #f7fafc;
    font-size: 30rpx;
    font-weight: 500;
    color: $text-secondary;
    transition: all 0.2s;

    &:active {
        background: #edf2f7;
    }
}

// 编辑弹窗
.edit-modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx;
    animation: fadeIn 0.2s ease;
}

.edit-modal {
    width: 100%;
    max-height: 80vh;
    background: #fff;
    border-radius: 32rpx;
    overflow: hidden;
    animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.edit-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f7fafc;
}

.edit-modal-title {
    font-size: 34rpx;
    font-weight: 600;
    color: $text-primary;
}

.edit-modal-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f7fafc;
    font-size: 40rpx;
    color: $text-secondary;

    &:active {
        background: #edf2f7;
    }
}

.edit-modal-body {
    padding: 32rpx;
}

.edit-textarea {
    width: 100%;
    height: 400rpx;
    padding: 24rpx;
    background: #f7fafc;
    border-radius: 20rpx;
    font-size: 30rpx;
    line-height: 1.8;
    color: $text-primary;
}

.edit-word-count {
    display: flex;
    justify-content: flex-end;
    padding-top: 16rpx;
    font-size: 24rpx;
    color: $text-secondary;

    .error {
        color: #ff6b6b;
    }
}

.edit-modal-footer {
    padding: 24rpx 32rpx 32rpx;
    border-top: 1rpx solid #f7fafc;
}

.edit-tip {
    margin-bottom: 24rpx;
    font-size: 24rpx;
    color: $text-secondary;
    text-align: center;
}

.edit-actions {
    display: flex;
    gap: 16rpx;
}

.edit-btn {
    flex: 1;
    height: 80rpx;
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: 500;
    border: none;
    transition: all 0.2s;

    &::after {
        border: none;
    }

    &.cancel {
        background: #f7fafc;
        color: $text-secondary;
    }

    &.save {
        background: #edf2f7;
        color: $text-primary;
    }

    &.reanalyze {
        background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
        color: #fff;
    }

    &[disabled] {
        opacity: 0.5;
    }
}

// 分享弹窗
.share-modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease;
}

.share-modal {
    width: 100%;
    background: #fff;
    border-radius: 32rpx 32rpx 0 0;
    padding: 32rpx;
    padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
    animation: slideUp 0.3s ease;
}

.share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24rpx;
    margin-bottom: 16rpx;
    border-bottom: 1rpx solid #f7fafc;
}

.share-modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
}

.share-modal-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f7fafc;
    font-size: 40rpx;
    color: $text-secondary;
    transition: all 0.2s;

    &:active {
        background: #edf2f7;
    }
}

.close-icon {
    width: 32rpx;
    height: 32rpx;
}

.share-options {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.share-option-card {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 24rpx;
    padding: 24rpx;
    border-radius: 20rpx;
    background: #f7fafc;
    border: none;
    transition: all 0.2s;
    // 覆盖 button 默认样式
    text-align: left;
    line-height: normal;
    font-size: inherit;
    width: 100%;
    margin: 0;
    box-sizing: border-box;

    &::after {
        border: none;
    }

    &:active {
        background: #edf2f7;
        transform: scale(0.98);
    }
}

.share-card-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.wechat {
        background: linear-gradient(135deg, #07c160 0%, #2bae67 100%);
    }

    &.copy {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
}

.share-icon-img {
    width: 40rpx;
    height: 40rpx;
    filter: brightness(0) invert(1);
}

.share-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.share-card-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
}

.share-card-desc {
    font-size: 24rpx;
    color: $text-secondary;
}
</style>
