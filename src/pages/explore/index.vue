<template>
    <view
        class="page explore-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 整页滚动容器 -->
        <scroll-view
            class="explore-scroll"
            scroll-y
            :refresher-enabled="true"
            :refresher-triggered="refreshing"
            @refresherrefresh="onPullDownRefresh"
            @scrolltolower="onLoadMore"
            :lower-threshold="100"
        >
            <!-- 头部渐变区域 -->
            <view class="explore-header">
                <view class="header-content">
                    <text class="header-title">✨ 探索梦境</text>
                    <text class="header-subtitle">发现他人的精彩梦境世界</text>

                    <!-- 搜索栏 -->
                    <view class="search-bar">
                        <image
                            class="search-icon"
                            src="/static/icons/search.svg"
                            mode="aspectFit"
                        />
                        <input
                            v-model="searchKeyword"
                            class="search-input"
                            placeholder="搜索梦境内容..."
                            placeholder-style="color: rgba(255, 255, 255, 0.95)"
                            @confirm="handleSearch"
                        />
                    </view>
                </view>
            </view>

            <!-- 筛选标签 -->
            <view class="filter-tabs-container">
                <scroll-view
                    class="filter-tabs"
                    scroll-x
                    :show-scrollbar="false"
                >
                    <view class="filter-tabs-inner">
                        <!-- 全部标签 -->
                        <view
                            class="filter-chip"
                            :class="{ active: selectedFilter === 'all' }"
                            @tap="selectFilter('all')"
                        >
                            <text>全部</text>
                        </view>

                        <!-- 动态加载的标签 -->
                        <view
                            v-for="tagItem in availableTags"
                            :key="tagItem.tag"
                            class="filter-chip"
                            :class="{ active: selectedFilter === tagItem.tag }"
                            @tap="selectFilter(tagItem.tag)"
                        >
                            <text>{{ getTagDisplay(tagItem.tag) }}</text>
                            <text class="tag-count">{{ tagItem.count }}</text>
                        </view>
                    </view>
                </scroll-view>
            </view>

            <!-- 梦境信息流 -->
            <view class="dream-feed">
                <template
                    v-for="(item, index) in mixedList"
                    :key="item.type === 'ad' ? `ad-${index}` : item.data.id"
                >
                    <!-- 原生广告卡片 -->
                    <view
                        v-if="item.type === 'ad'"
                        class="ad-card"
                    >
                        <view class="ad-label">
                            <text>广告</text>
                        </view>
                        <!-- #ifdef MP-WEIXIN -->
                        <ad
                            unit-id="adunit-xxxxxxxx"
                            ad-type="feeds"
                            ad-theme="white"
                            @error="handleAdError"
                        />
                        <!-- #endif -->
                        <!-- #ifndef MP-WEIXIN -->
                        <view class="ad-placeholder">
                            <text class="ad-placeholder-text">广告位</text>
                        </view>
                        <!-- #endif -->
                    </view>

                    <!-- 梦境卡片 -->
                    <view
                        v-else
                        class="public-dream-card"
                        @tap="viewDream(item.data.id)"
                    >
                        <!-- 作者信息 -->
                        <view class="dream-author">
                            <view class="author-avatar">
                                <image
                                    v-if="item.data.author.avatar && !item.data.author.avatarError"
                                    class="avatar-image"
                                    :src="item.data.author.avatar"
                                    mode="aspectFill"
                                    @error="handleAvatarError(item.data)"
                                />
                                <text
                                    v-else
                                    class="avatar-text"
                                >
                                    {{ getAvatarText(item.data.author.nickname) }}
                                </text>
                            </view>
                            <view class="author-info">
                                <text class="author-name">{{ item.data.author.nickname }}</text>
                                <text class="author-time">{{ formatTime(item.data.createdAt) }}</text>
                            </view>
                        </view>

                        <!-- 梦境内容 -->
                        <text class="dream-content">{{ item.data.content }}</text>

                        <!-- 标签 -->
                        <view
                            v-if="item.data.tags && item.data.tags.length > 0"
                            class="dream-tags"
                        >
                            <text
                                v-for="tag in item.data.tags.slice(0, 3)"
                                :key="tag"
                                class="tag-chip"
                            >
                                {{ getTagLabel(tag) }}
                            </text>
                        </view>

                        <!-- 统计信息 -->
                        <view class="dream-stats">
                            <view
                                class="stat-item like-btn"
                                :class="{ liked: item.data.isLiked }"
                                @tap.stop="toggleLike(item.data)"
                            >
                                <image
                                    class="stat-icon"
                                    src="/static/icons/heart.svg"
                                    mode="aspectFit"
                                />
                                <text>{{ item.data.likeCount || 0 }}</text>
                            </view>
                            <view class="stat-item">
                                <image
                                    class="stat-icon"
                                    src="/static/icons/eye.svg"
                                    mode="aspectFit"
                                />
                                <text>{{ item.data.viewCount || 0 }}</text>
                            </view>
                        </view>
                    </view>
                </template>

                <!-- 空状态 -->
                <view
                    v-if="publicDreams.length === 0 && !loading"
                    class="empty-state"
                >
                    <text class="empty-icon">🌙</text>
                    <text class="empty-text">暂无公开梦境</text>
                </view>

                <!-- 加载更多 -->
                <view
                    v-if="loading"
                    class="loading-more"
                >
                    <text>加载中...</text>
                </view>

                <view
                    v-if="noMore && publicDreams.length > 0"
                    class="no-more"
                >
                    <text>没有更多了</text>
                </view>
            </view>
        </scroll-view>

        <!-- 随机探索按钮 -->
        <view
            class="random-btn"
            @tap="randomExplore"
        >
            <image
                class="random-icon"
                src="/static/icons/portal-door.svg"
                mode="aspectFit"
            />
        </view>

        <!-- 自定义 TabBar -->
        <custom-tab-bar :selected="1" />
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores';
import { exploreApi } from '@/api';
import type { PublicDream, TagItem } from '@/api/modules/explore';
import CustomTabBar from '@/custom-tab-bar/index.vue';
import { insertAdsIntoList, getExploreFeedAdUnitId, isNativeAdAvailable } from '@/utils/ad';
import { getTagDisplayName, getTagName } from '@/constants/tags';

const userStore = useUserStore();

// 数据
const searchKeyword = ref('');
const selectedFilter = ref('all');
const publicDreams = ref<PublicDream[]>([]);
const availableTags = ref<TagItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 10;

// 广告配置
const adUnitId = getExploreFeedAdUnitId();
const showAd = computed(() => isNativeAdAvailable() && !userStore.isVip);

// 混合列表（包含梦境和广告）
const mixedList = computed(() => {
    return insertAdsIntoList(publicDreams.value, {
        showAd: showAd.value,
        firstPosition: 3,
        interval: 5,
        maxCount: 3
    });
});

// 标签映射（包含图标）
const tagLabels: Record<string, string> = {
    // 常见主题
    追逐: '🏃',
    飞行: '🦅',
    水: '💧',
    动物: '🐕',
    亲人: '👨‍👩‍👧',
    考试: '📝',
    迷路: '🗺️',
    死亡: '💀',

    // 情绪相关
    开心: '😊',
    愉悦: '😄',
    快乐: '😃',
    恐惧: '😨',
    害怕: '😱',
    焦虑: '😰',
    紧张: '😬',
    悲伤: '😢',
    愤怒: '😠',
    平静: '😌',
    困惑: '😕',

    // 场景相关
    自然: '🌳',
    学校: '🏫',
    工作: '💼',
    旅行: '✈️',
    回忆: '💭',
    奇幻: '✨',
    探索: '🔍',
    冒险: '🗺️',

    // 其他
    压力: '😓',
    成长: '🌱',
    突破: '🚀',
    温暖: '❤️',
    思念: '💔',
    力量: '💪',
    自由: '🕊️',
    怀旧: '📷',
    美好: '🌈',
    梦幻: '🌙'
};

// 获取标签显示文本（用于筛选区域）
function getTagDisplay(tag: string): string {
    // 优先使用统一的标签工具函数
    const displayName = getTagDisplayName(tag);
    // 如果统一函数返回的是 "✨ xxx" 格式，说明是自定义标签
    // 尝试从本地映射获取图标
    if (displayName.startsWith('✨')) {
        const icon = tagLabels[tag] || tagLabels[getTagName(tag)] || '';
        return icon ? `${icon} ${getTagName(tag)}` : displayName;
    }
    return displayName;
}

// 加载可用标签
async function loadTags() {
    try {
        const response = await exploreApi.getTags();
        availableTags.value = response.tags;
    } catch (error: any) {
        console.error('加载标签失败:', error);
    }
}

// 方法
function selectFilter(filterId: string) {
    selectedFilter.value = filterId;
    page.value = 1;
    publicDreams.value = [];
    noMore.value = false;
    loadPublicDreams();
}

function handleSearch() {
    if (!searchKeyword.value.trim()) {
        return;
    }
    // 重置并重新加载
    page.value = 1;
    publicDreams.value = [];
    noMore.value = false;
    loadPublicDreams();
}

async function loadPublicDreams() {
    if (loading.value || noMore.value) return;

    loading.value = true;

    try {
        const response = await exploreApi.getPublicDreams({
            page: page.value,
            pageSize,
            tag: selectedFilter.value !== 'all' ? selectedFilter.value : undefined,
            keyword: searchKeyword.value.trim() || undefined
        });

        if (response.list.length < pageSize) {
            noMore.value = true;
        }

        publicDreams.value = page.value === 1 ? response.list : [...publicDreams.value, ...response.list];
    } catch (error: any) {
        console.error('加载公开梦境失败:', error);
        uni.showToast({
            title: error.message || '加载失败',
            icon: 'none'
        });
    } finally {
        loading.value = false;
        refreshing.value = false;
    }
}

function onPullDownRefresh() {
    refreshing.value = true;
    page.value = 1;
    noMore.value = false;
    publicDreams.value = [];
    loadPublicDreams();
}

function onLoadMore() {
    if (!noMore.value && !loading.value) {
        page.value++;
        loadPublicDreams();
    }
}

function viewDream(dreamId: string) {
    uni.navigateTo({
        url: `/pages/dream-detail/index?id=${dreamId}&source=filter`
    });
}

async function randomExplore() {
    try {
        uni.showLoading({ title: '正在探索...' });

        const randomDream = await exploreApi.getRandomDream();

        uni.hideLoading();

        // 跳转到梦境详情页
        uni.navigateTo({
            url: `/pages/dream-detail/index?id=${randomDream.id}&source=random`
        });
    } catch (error: any) {
        uni.hideLoading();
        console.error('随机探索失败:', error);
        uni.showToast({
            title: error.message || '暂无可探索的梦境',
            icon: 'none'
        });
    }
}

async function toggleLike(dream: PublicDream) {
    try {
        const response = await exploreApi.toggleLike(dream.id);

        // 更新本地状态
        dream.isLiked = response.isLiked;
        dream.likeCount = response.likeCount;

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

function getTagLabel(tagId: string): string {
    // 优先使用统一的标签工具函数获取名称
    const name = getTagName(tagId);
    // 尝试获取图标
    const icon = tagLabels[tagId] || tagLabels[name] || '';
    return icon ? `${icon} ${name}` : name;
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

// 处理头像加载错误
function handleAvatarError(dream: PublicDream) {
    // 标记该头像加载失败，后续显示默认头像
    (dream.author as any).avatarError = true;
}

// 获取头像文字（使用昵称首字符）
function getAvatarText(nickname: string): string {
    if (!nickname) return '梦';
    // 返回第一个字符
    return nickname.charAt(0);
}

// 处理广告加载错误
function handleAdError(e: any) {
    console.warn('广告加载失败:', e.detail);
}

onMounted(() => {
    loadTags();
    loadPublicDreams();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;
@use '@/styles/mixins.scss' as *;

.explore-page {
    height: 100vh;
    background: $bg-page;
    display: flex;
    flex-direction: column;
}

// 整页滚动容器
.explore-scroll {
    flex: 1;
    height: 100%;
}

// 头部区域
.explore-header {
    background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
    padding: 120rpx 32rpx 64rpx;
    border-radius: 0 0 48rpx 48rpx;
    flex-shrink: 0;
}

.header-content {
    display: flex;
    flex-direction: column;
}

.header-title {
    font-size: 48rpx;
    font-weight: 700;
    color: #fff;
    margin-bottom: 16rpx;
}

.header-subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 32rpx;
}

// 搜索栏
.search-bar {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20rpx);
    border-radius: 48rpx;
    padding: 24rpx 40rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.search-icon {
    width: 40rpx;
    height: 40rpx;
    // 将黑色 SVG 转换为白色
    filter: brightness(0) invert(1);
}

.search-input {
    flex: 1;
    font-size: 30rpx;
    color: #fff;
    background: transparent;
    caret-color: #fff;

    &::placeholder {
        color: rgba(255, 255, 255, 0.9);
    }

    // 确保输入的文字是白色
    &::-webkit-input-placeholder {
        color: rgba(255, 255, 255, 0.9);
    }
}

// 筛选标签容器
.filter-tabs-container {
    background: $bg-page;
    padding: 32rpx 0;
    flex-shrink: 0;
}

// 筛选标签
.filter-tabs {
    width: 100%;
    white-space: nowrap;
}

.filter-tabs-inner {
    display: inline-flex;
    gap: 16rpx;
    padding: 0 32rpx;
}

.filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    background: #fff;
    border: 3rpx solid #e2e8f0;
    border-radius: 40rpx;
    padding: 16rpx 32rpx;
    font-size: 26rpx;
    color: $text-secondary;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;

    &.active {
        background: $primary-color;
        border-color: $primary-color;
        color: #fff;

        .tag-count {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
        }
    }

    &:active {
        transform: scale(0.95);
    }
}

.tag-count {
    background: $primary-light;
    color: $primary-color;
    padding: 2rpx 12rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    font-weight: 600;
    min-width: 36rpx;
    text-align: center;
}

// 梦境信息流
.dream-feed {
    padding: 0 32rpx;
    padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
    min-height: 100vh;
}

// 广告卡片
.ad-card {
    background: #fff;
    border-radius: 32rpx;
    padding: 24rpx 32rpx;
    margin-bottom: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    overflow: hidden;
}

.ad-label {
    margin-bottom: 16rpx;

    text {
        font-size: 22rpx;
        color: $text-placeholder;
        background: #f5f5f5;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
    }
}

.ad-placeholder {
    height: 200rpx;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ad-placeholder-text {
    font-size: 28rpx;
    color: $text-placeholder;
}

.public-dream-card {
    background: #fff;
    border-radius: 32rpx;
    padding: 40rpx;
    margin-bottom: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    transition: all 0.2s;

    &:active {
        transform: scale(0.98);
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    }
}

// 作者信息
.dream-author {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 32rpx;
}

.author-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    overflow: hidden;
    flex-shrink: 0;
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-text {
    color: $primary-color;
    font-size: 32rpx;
    font-weight: 600;
}

.author-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.author-name {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
}

.author-time {
    font-size: 24rpx;
    color: $text-placeholder;
}

// 梦境内容
.dream-content {
    font-size: 30rpx;
    line-height: 1.7;
    color: $text-primary;
    margin-bottom: 32rpx;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
}

// 标签
.dream-tags {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;
    margin-bottom: 32rpx;
}

.tag-chip {
    background: $primary-light;
    color: $primary-color;
    padding: 8rpx 24rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
}

// 统计信息
.dream-stats {
    display: flex;
    align-items: center;
    gap: 40rpx;
    padding-top: 32rpx;
    border-top: 1rpx solid #f7fafc;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
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

.stat-icon {
    width: 32rpx;
    height: 32rpx;
    // 使用 filter 将黑色 SVG 转换为灰色
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
    transition: filter 0.2s;
}

// 随机按钮
.random-btn {
    position: fixed;
    bottom: 180rpx;
    right: 40rpx;
    width: 112rpx;
    height: 112rpx;
    background: linear-gradient(135deg, $primary-color 0%, #9f7aea 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 40rpx rgba(107, 78, 255, 0.4);
    z-index: 10;
    transition: all 0.3s;

    &:active {
        transform: scale(0.9) rotate(180deg);
    }
}

.random-icon {
    width: 56rpx;
    height: 56rpx;
    // 将黑色 SVG 转换为白色
    filter: brightness(0) invert(1);
}

// 空状态
.empty-state {
    text-align: center;
    padding: 120rpx 80rpx;
}

.empty-icon {
    font-size: 128rpx;
    margin-bottom: 32rpx;
    opacity: 0.3;
    display: block;
}

.empty-text {
    color: $text-placeholder;
    font-size: 28rpx;
}

// 加载状态
.loading-more,
.no-more {
    text-align: center;
    padding: 40rpx 0;
    font-size: 24rpx;
    color: $text-placeholder;
}

// 暗黑模式
.explore-page.dark-mode {
    background: $dark-bg-page;

    .explore-header {
        background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
    }

    .filter-tabs-container {
        background: $dark-bg-page;
    }

    .ad-card {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;
    }

    .ad-label text {
        background: rgba(255, 255, 255, 0.1);
        color: $dark-text-placeholder;
    }

    .ad-placeholder {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    }

    .ad-placeholder-text {
        color: $dark-text-placeholder;
    }

    .filter-chip {
        background: $dark-bg-card;
        border-color: rgba(255, 255, 255, 0.1);
        color: $dark-text-secondary;

        &.active {
            background: $dark-primary-color;
            border-color: $dark-primary-color;
            color: #fff;

            .tag-count {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
            }
        }
    }

    .tag-count {
        background: rgba(139, 110, 255, 0.15);
        color: $dark-primary-color;
    }

    .public-dream-card {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;

        &:active {
            box-shadow: $dark-shadow-base;
        }
    }

    .author-avatar {
        background: rgba(139, 110, 255, 0.15);
    }

    .avatar-text {
        color: $dark-primary-color;
    }

    .author-name {
        color: $dark-text-primary;
    }

    .author-time {
        color: $dark-text-placeholder;
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
    }

    .stat-item {
        color: $dark-text-secondary;
    }

    .stat-icon {
        // 暗黑模式下转换为浅灰色
        filter: brightness(0) saturate(100%) invert(62%) sepia(5%) saturate(449%) hue-rotate(169deg) brightness(92%)
            contrast(87%);
    }

    .random-btn {
        background: linear-gradient(135deg, $dark-primary-color 0%, #9f7aea 100%);
        box-shadow: 0 16rpx 40rpx rgba(139, 110, 255, 0.4);
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
