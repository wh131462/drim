<template>
    <view
        class="page user-profile-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <NavBar title="用户主页" />

        <!-- 加载中 -->
        <view
            v-if="loading"
            class="loading-container"
            :style="{ paddingTop: navBarPaddingTop }"
        >
            <view class="loading-animation"></view>
            <text class="loading-text">加载中...</text>
        </view>

        <!-- 隐私限制 -->
        <view
            v-else-if="profile?.isPrivate"
            class="private-container"
            :style="{ paddingTop: navBarPaddingTop }"
        >
            <view class="private-avatar">
                <image
                    v-if="profile.avatar"
                    class="avatar-image"
                    :src="profile.avatar"
                    mode="aspectFill"
                />
                <text
                    v-else
                    class="avatar-text"
                    >{{ getAvatarText(profile.nickname) }}</text
                >
            </view>
            <text class="private-name">{{ profile.nickname }}</text>
            <view class="private-icon">
                <image
                    class="lock-icon"
                    src="/static/icons/lock.svg"
                    mode="aspectFit"
                />
            </view>
            <text class="private-hint">该用户已关闭主页访问</text>
        </view>

        <!-- 正常内容 -->
        <template v-else-if="profile">
            <scroll-view
                class="profile-scroll"
                scroll-y
                :style="{ paddingTop: navBarPaddingTop }"
                @scrolltolower="onLoadMore"
                :lower-threshold="100"
            >
                <!-- 用户信息头部 -->
                <view class="profile-header">
                    <view class="user-avatar">
                        <image
                            v-if="profile.avatar && !avatarError"
                            class="avatar-image"
                            :src="profile.avatar"
                            mode="aspectFill"
                            @error="avatarError = true"
                        />
                        <text
                            v-else
                            class="avatar-text"
                            >{{ getAvatarText(profile.nickname) }}</text
                        >
                    </view>
                    <view class="user-info">
                        <view class="name-row">
                            <text class="username">{{ profile.nickname }}</text>
                            <view
                                v-if="profile.isVip"
                                class="vip-badge"
                            >
                                <image
                                    class="vip-icon"
                                    src="/static/icons/star.svg"
                                    mode="aspectFit"
                                />
                                <text>VIP</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 统计数据 -->
                <view class="stats-grid">
                    <view class="stat-item">
                        <text class="stat-value">{{ profile.publicDreamCount || 0 }}</text>
                        <text class="stat-label">公开梦境</text>
                    </view>
                    <view class="stat-item">
                        <text class="stat-value primary">{{ profile.consecutiveDays || 0 }}</text>
                        <text class="stat-label">连续打卡</text>
                    </view>
                    <view class="stat-item">
                        <text class="stat-value">{{ profile.totalLikes || 0 }}</text>
                        <text class="stat-label">获赞总数</text>
                    </view>
                </view>

                <!-- 公开梦境列表 -->
                <view class="section-title">
                    <text>公开梦境</text>
                </view>

                <view class="dream-feed">
                    <view
                        v-for="dream in dreams"
                        :key="dream.id"
                        class="public-dream-card"
                        @tap="viewDream(dream.id)"
                    >
                        <!-- 梦境内容 -->
                        <text class="dream-content">{{ dream.content }}</text>

                        <!-- 标签 -->
                        <view
                            v-if="dream.tags && dream.tags.length > 0"
                            class="dream-tags"
                        >
                            <text
                                v-for="tag in dream.tags.slice(0, 3)"
                                :key="tag"
                                class="tag-chip"
                                >{{ tag }}</text
                            >
                        </view>

                        <!-- 统计信息 -->
                        <view class="dream-stats">
                            <view
                                class="stat-item like-btn"
                                :class="{ liked: dream.isLiked }"
                                @tap.stop="toggleLike(dream)"
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
                            <text class="dream-time">{{ formatTime(dream.createdAt) }}</text>
                        </view>
                    </view>
                </view>

                <!-- 空状态 -->
                <view
                    v-if="dreams.length === 0 && !dreamsLoading"
                    class="empty-state"
                >
                    <text class="empty-text">该用户暂无公开梦境</text>
                </view>

                <!-- 加载更多 -->
                <view
                    v-if="dreamsLoading"
                    class="loading-more"
                >
                    <text>加载中...</text>
                </view>

                <view
                    v-if="noMore && dreams.length > 0"
                    class="no-more"
                >
                    <text>没有更多了</text>
                </view>

                <!-- 底部安全区域 -->
                <view class="bottom-safe-area"></view>
            </scroll-view>
        </template>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { exploreApi } from '@/api';
import type { UserProfile, PublicDream } from '@/api/modules/explore';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const userId = ref('');
const loading = ref(true);
const profile = ref<UserProfile | null>(null);
const dreams = ref<PublicDream[]>([]);
const dreamsLoading = ref(false);
const noMore = ref(false);
const page = ref(1);
const avatarError = ref(false);
const navBarHeight = ref(88);

const navBarPaddingTop = computed(() => `${(navBarHeight.value + 16) * 2}rpx`);

onLoad((options) => {
    userId.value = options?.userId || '';
});

onMounted(async () => {
    const systemInfo = uni.getSystemInfoSync();
    navBarHeight.value = (systemInfo.statusBarHeight || 20) + 44;

    if (!userId.value) {
        uni.showToast({ title: '参数错误', icon: 'none' });
        setTimeout(() => uni.navigateBack(), 1500);
        loading.value = false;
        return;
    }

    // 如果是自己，返回上一页（正常不会走到这里，入口处已拦截）
    if (userId.value === userStore.userInfo?.id) {
        loading.value = false;
        uni.navigateBack();
        return;
    }

    await loadProfile();
    if (profile.value && !profile.value.isPrivate) {
        await loadDreams();
    }
    loading.value = false;
});

async function loadProfile() {
    try {
        profile.value = await exploreApi.getUserProfile(userId.value);
    } catch (error: any) {
        uni.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
}

async function loadDreams() {
    if (dreamsLoading.value || noMore.value) return;
    dreamsLoading.value = true;
    try {
        const res = await exploreApi.getUserPublicDreams(userId.value, {
            page: page.value,
            pageSize: 10
        });
        if (res.list.length < 10) {
            noMore.value = true;
        }
        dreams.value = page.value === 1 ? res.list : [...dreams.value, ...res.list];
    } catch (error: any) {
        console.error('加载用户梦境失败:', error);
    } finally {
        dreamsLoading.value = false;
    }
}

function onLoadMore() {
    if (!noMore.value && !dreamsLoading.value) {
        page.value++;
        loadDreams();
    }
}

function viewDream(dreamId: string) {
    uni.navigateTo({
        url: `/pages/dream-detail/index?id=${dreamId}&source=filter`
    });
}

async function toggleLike(dream: PublicDream) {
    try {
        const response = await exploreApi.toggleLike(dream.id);
        dream.isLiked = response.isLiked;
        dream.likeCount = response.likeCount;
        uni.showToast({
            title: response.isLiked ? '已点赞' : '已取消',
            icon: 'none',
            duration: 1000
        });
    } catch (error: any) {
        uni.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function getAvatarText(nickname: string): string {
    if (!nickname) return '梦';
    return nickname.charAt(0);
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

.user-profile-page {
    height: 100vh;
    background: $bg-page;
    display: flex;
    flex-direction: column;
}

.profile-scroll {
    flex: 1;
    height: 100%;
}

// 加载状态
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
}

.loading-animation {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid $primary-light;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 24rpx;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    font-size: 28rpx;
    color: $text-placeholder;
}

// 隐私限制状态
.private-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 60rpx;
}

.private-avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 32rpx;

    .avatar-image {
        width: 100%;
        height: 100%;
    }

    .avatar-text {
        font-size: 64rpx;
        font-weight: 600;
        color: $primary-color;
    }
}

.private-name {
    font-size: 36rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 32rpx;
}

.private-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
}

.lock-icon {
    width: 40rpx;
    height: 40rpx;
    opacity: 0.5;
}

.private-hint {
    font-size: 28rpx;
    color: $text-placeholder;
}

// 用户信息头部
.profile-header {
    display: flex;
    align-items: center;
    gap: 32rpx;
    padding: 40rpx 40rpx 24rpx;
}

.user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    .avatar-image {
        width: 100%;
        height: 100%;
    }

    .avatar-text {
        font-size: 48rpx;
        font-weight: 600;
        color: $primary-color;
    }
}

.user-info {
    flex: 1;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.username {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
}

.vip-badge {
    display: inline-flex;
    align-items: center;
    gap: 4rpx;
    background: linear-gradient(135deg, #ffd700, #ffb700);
    padding: 4rpx 16rpx;
    border-radius: 20rpx;

    .vip-icon {
        width: 24rpx;
        height: 24rpx;
        filter: brightness(0);
    }

    text {
        font-size: 20rpx;
        font-weight: 700;
        color: #333;
    }
}

// 统计数据
.stats-grid {
    display: flex;
    justify-content: space-around;
    padding: 32rpx 40rpx;
    margin: 0 32rpx 24rpx;
    background: #fff;
    border-radius: 24rpx;
    box-shadow: $shadow-sm;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
}

.stat-value {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;

    &.primary {
        color: $primary-color;
    }
}

.stat-label {
    font-size: 24rpx;
    color: $text-placeholder;
}

// 分区标题
.section-title {
    padding: 24rpx 40rpx 16rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: $text-secondary;
}

// 梦境信息流
.dream-feed {
    padding: 0 32rpx;
}

.public-dream-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: $shadow-sm;
    transition: all 0.2s;

    &:active {
        transform: scale(0.98);
        box-shadow: $shadow-base;
    }
}

.dream-content {
    font-size: 30rpx;
    line-height: 1.7;
    color: $text-primary;
    margin-bottom: 24rpx;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dream-tags {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;
    margin-bottom: 24rpx;
}

.tag-chip {
    background: $primary-light;
    color: $primary-color;
    padding: 8rpx 24rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
}

.dream-stats {
    display: flex;
    align-items: center;
    gap: 32rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f7fafc;

    .stat-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8rpx;
        font-size: 26rpx;
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
}

.stat-icon {
    width: 32rpx;
    height: 32rpx;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.2s;
}

.dream-time {
    margin-left: auto;
    font-size: 24rpx;
    color: $text-placeholder;
}

// 空状态
.empty-state {
    display: flex;
    justify-content: center;
    padding: 120rpx 0;
}

.empty-text {
    font-size: 28rpx;
    color: $text-placeholder;
}

// 加载更多
.loading-more,
.no-more {
    text-align: center;
    padding: 40rpx 0;
    font-size: 24rpx;
    color: $text-placeholder;
}

// 底部安全区域
.bottom-safe-area {
    height: calc(40rpx + env(safe-area-inset-bottom));
}

// 暗黑模式
.user-profile-page.dark-mode {
    background: $dark-bg-page;

    .loading-animation {
        border-color: rgba(139, 110, 255, 0.15);
        border-top-color: $dark-primary-color;
    }

    .loading-text {
        color: $dark-text-placeholder;
    }

    .private-avatar {
        background: rgba(139, 110, 255, 0.15);

        .avatar-text {
            color: $dark-primary-color;
        }
    }

    .private-name {
        color: $dark-text-primary;
    }

    .private-icon {
        background: rgba(255, 255, 255, 0.1);
    }

    .lock-icon {
        filter: brightness(0) invert(1);
        opacity: 0.3;
    }

    .private-hint {
        color: $dark-text-placeholder;
    }

    .user-avatar {
        background: rgba(139, 110, 255, 0.15);

        .avatar-text {
            color: $dark-primary-color;
        }
    }

    .username {
        color: $dark-text-primary;
    }

    .stats-grid {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;
    }

    .stat-value {
        color: $dark-text-primary;

        &.primary {
            color: $dark-primary-color;
        }
    }

    .stat-label {
        color: $dark-text-placeholder;
    }

    .section-title {
        color: $dark-text-secondary;
    }

    .public-dream-card {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;

        &:active {
            box-shadow: $dark-shadow-base;
        }
    }

    .dream-content {
        color: $dark-text-primary;
    }

    .tag-chip {
        background: rgba(139, 110, 255, 0.15);
        color: $dark-primary-color;
    }

    .dream-stats {
        border-top-color: rgba(255, 255, 255, 0.1);

        .stat-item {
            color: $dark-text-secondary;
        }
    }

    .stat-icon {
        filter: brightness(0) saturate(100%) invert(62%) sepia(5%) saturate(449%) hue-rotate(169deg) brightness(92%)
            contrast(87%);
    }

    .dream-time {
        color: $dark-text-placeholder;
    }

    .empty-text {
        color: $dark-text-placeholder;
    }

    .loading-more,
    .no-more {
        color: $dark-text-placeholder;
    }
}
</style>
