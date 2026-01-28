<template>
    <view
        class="page dream-list-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <!-- 导航栏 -->
        <NavBar
            :title="pageTitle"
            show-back
        >
            <template #right>
                <view
                    v-if="!isSelectMode"
                    class="nav-action"
                    @tap="enterSelectMode"
                >
                    <text>管理</text>
                </view>
                <view
                    v-else
                    class="nav-action"
                    @tap="exitSelectMode"
                >
                    <text>完成</text>
                </view>
            </template>
        </NavBar>

        <!-- 搜索栏 -->
        <view class="search-bar">
            <view class="search-input-wrapper">
                <image
                    class="search-icon"
                    src="/static/icons/search.svg"
                    mode="aspectFit"
                />
                <input
                    v-model="keyword"
                    class="search-input"
                    type="text"
                    placeholder="搜索梦境内容..."
                    confirm-type="search"
                    @confirm="handleSearch"
                />
                <view
                    v-if="keyword"
                    class="clear-btn"
                    @tap="clearSearch"
                >
                    <text>&times;</text>
                </view>
            </view>
        </view>

        <!-- 筛选区域 -->
        <view class="filter-section">
            <!-- 情绪筛选 -->
            <scroll-view
                class="filter-scroll"
                scroll-x
                :show-scrollbar="false"
            >
                <view class="filter-chips">
                    <view
                        class="filter-chip"
                        :class="{ active: !selectedEmotion }"
                        @tap="selectEmotion('')"
                    >
                        <text>全部情绪</text>
                    </view>
                    <view
                        v-for="em in emotions"
                        :key="em.id"
                        class="filter-chip"
                        :class="{ active: selectedEmotion === em.id }"
                        @tap="selectEmotion(em.id)"
                    >
                        <text>{{ em.icon }} {{ em.name }}</text>
                    </view>
                </view>
            </scroll-view>

            <!-- 标签筛选 -->
            <scroll-view
                class="filter-scroll"
                scroll-x
                :show-scrollbar="false"
            >
                <view class="filter-chips">
                    <view
                        class="filter-chip"
                        :class="{ active: !selectedTag }"
                        @tap="selectTag('')"
                    >
                        <text>全部标签</text>
                    </view>
                    <view
                        v-for="tag in tags"
                        :key="tag.id"
                        class="filter-chip"
                        :class="{ active: selectedTag === tag.id }"
                        @tap="selectTag(tag.id)"
                    >
                        <text>{{ tag.icon }} {{ tag.name }}</text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 统计信息 -->
        <view class="stats-bar">
            <text class="stats-text">共 {{ total }} 个梦境</text>
            <view
                v-if="isSelectMode &amp;&amp; selectedIds.length > 0"
                class="selected-info"
            >
                <text>已选择 {{ selectedIds.length }} 条</text>
            </view>
        </view>

        <!-- 梦境列表 -->
        <scroll-view
            class="dream-list"
            :class="{ 'has-bottom-bar': isSelectMode }"
            scroll-y
            @scrolltolower="loadMore"
        >
            <view
                v-for="dream in dreams"
                :key="dream.id"
                class="dream-item"
                :class="{ selected: selectedIds.includes(dream.id) }"
                @tap="handleItemTap(dream)"
            >
                <!-- 选择框 -->
                <view
                    v-if="isSelectMode"
                    class="checkbox-wrapper"
                    @tap.stop="toggleSelect(dream.id)"
                >
                    <view
                        class="checkbox"
                        :class="{ checked: selectedIds.includes(dream.id) }"
                    >
                        <image
                            v-if="selectedIds.includes(dream.id)"
                            class="check-icon"
                            src="/static/icons/check.svg"
                            mode="aspectFit"
                        />
                    </view>
                </view>

                <!-- 梦境内容 -->
                <view class="dream-content-wrapper">
                    <view class="dream-header">
                        <view class="dream-date">
                            <text>{{ formatDate(dream.createdAt) }}</text>
                        </view>
                        <view class="dream-badges">
                            <!-- 运势评分徽章 -->
                            <view
                                v-if="dream.fortuneScore"
                                class="score-badge"
                                :style="{ background: getScoreColor(dream.fortuneScore) }"
                            >
                                <text class="score-text">{{ dream.fortuneScore }}</text>
                            </view>
                            <view
                                v-if="dream.emotion"
                                class="emotion-badge"
                            >
                                <text>{{ getEmotionIcon(dream.emotion) }}</text>
                            </view>
                            <view
                                v-if="dream.isPublic"
                                class="public-badge"
                            >
                                <image
                                    class="badge-icon"
                                    src="/static/icons/eye.svg"
                                    mode="aspectFit"
                                />
                            </view>
                            <view
                                v-if="dream.hasAnalysis && !dream.fortuneScore"
                                class="analysis-badge"
                            >
                                <image
                                    class="badge-icon"
                                    src="/static/icons/star.svg"
                                    mode="aspectFit"
                                />
                            </view>
                        </view>
                    </view>
                    <text class="dream-content">{{ dream.content }}</text>
                    <view
                        v-if="dream.tags &amp;&amp; dream.tags.length > 0"
                        class="dream-tags"
                    >
                        <text
                            v-for="tag in dream.tags.slice(0, 3)"
                            :key="tag"
                            class="tag-item"
                        >
                            {{ getTagName(tag) }}
                        </text>
                    </view>
                </view>
            </view>

            <!-- 加载状态 -->
            <view
                v-if="isLoading"
                class="loading-more"
            >
                <text>加载中...</text>
            </view>
            <view
                v-else-if="!hasMore &amp;&amp; dreams.length > 0"
                class="no-more"
            >
                <text>没有更多了</text>
            </view>

            <!-- 空状态 -->
            <view
                v-if="!isLoading &amp;&amp; dreams.length === 0"
                class="empty-state"
            >
                <image
                    class="empty-icon"
                    src="/static/icons/moon.svg"
                    mode="aspectFit"
                />
                <text class="empty-text">{{
                    keyword || selectedEmotion || selectedTag ? '没有找到相关梦境' : '还没有记录任何梦境'
                }}</text>
                <view
                    v-if="!keyword &amp;&amp; !selectedEmotion &amp;&amp; !selectedTag"
                    class="empty-action"
                    @tap="goToRecord"
                >
                    <text>去记录梦境</text>
                </view>
            </view>
        </scroll-view>

        <!-- 底部操作栏（选择模式） -->
        <transition name="slide-up">
            <view
                v-if="isSelectMode"
                class="bottom-bar-wrapper"
            >
                <view class="bottom-bar">
                    <view
                        class="select-all-btn"
                        @tap="toggleSelectAll"
                    >
                        <view
                            class="checkbox"
                            :class="{ checked: isAllSelected }"
                        >
                            <image
                                v-if="isAllSelected"
                                class="check-icon"
                                src="/static/icons/check.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <text>全选</text>
                    </view>
                    <view
                        class="delete-btn"
                        :class="{ disabled: selectedIds.length === 0 }"
                        @tap="handleBatchDelete"
                    >
                        <image
                            class="delete-icon"
                            src="/static/icons/delete.svg"
                            mode="aspectFit"
                        />
                        <text>删除 {{ selectedIds.length > 0 ? `(${selectedIds.length})` : '' }}</text>
                    </view>
                </view>
            </view>
        </transition>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { dreamApi } from '@/api';
import type { Dream, DreamListParams } from '@/types/dream';
import { getFilterTags, getTagDisplayName, isPresetTag } from '@/constants/tags';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();

// 情绪选项
const emotions = [
    { id: 'happy', name: '开心', icon: '😊' },
    { id: 'sad', name: '悲伤', icon: '😢' },
    { id: 'fear', name: '恐惧', icon: '😨' },
    { id: 'anxious', name: '焦虑', icon: '😰' },
    { id: 'confused', name: '困惑', icon: '😕' },
    { id: 'excited', name: '兴奋', icon: '🤩' },
    { id: 'calm', name: '平静', icon: '😌' },
    { id: 'love', name: '温暖', icon: '🥰' }
];

// 预设标签选项
const presetTags = getFilterTags();

// 用户使用过的自定义标签（从后端获取）
const customTagList = ref<Array<{ id: string; name: string; icon: string }>>([]);

// 合并后的标签列表（预设 + 自定义）
const tags = computed(() => {
    return [...presetTags, ...customTagList.value];
});

/**
 * 从梦境列表中提取自定义标签
 */
function extractCustomTags(dreamList: Dream[]) {
    const existingIds = new Set(customTagList.value.map((t) => t.id));

    for (const dream of dreamList) {
        if (!dream.tags) continue;
        for (const tagId of dream.tags) {
            // 跳过预设标签和已存在的自定义标签
            if (isPresetTag(tagId) || existingIds.has(tagId)) continue;
            // 添加自定义标签（ID 就是名称）
            customTagList.value.push({
                id: tagId,
                name: tagId,
                icon: '✨'
            });
            existingIds.add(tagId);
        }
    }
}

// 数据状态
const dreams = ref<(Dream & { isPublic?: boolean })[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const isLoading = ref(false);

// 日期筛选（从日历页传入）
const filterDate = ref('');

const pageTitle = computed(() => {
    if (filterDate.value) {
        const [, m, d] = filterDate.value.split('-');
        return `${parseInt(m)}月${parseInt(d)}日的梦境`;
    }
    return '梦境管理';
});

// 筛选状态
const keyword = ref('');
const selectedEmotion = ref('');
const selectedTag = ref('');

// 选择模式
const isSelectMode = ref(false);
const selectedIds = ref<string[]>([]);

// 计算属性
const isAllSelected = computed(() => {
    return dreams.value.length > 0 && selectedIds.value.length === dreams.value.length;
});

// 方法
async function loadDreams(reset = false) {
    if (isLoading.value) return;
    if (!reset && !hasMore.value) return;

    isLoading.value = true;

    if (reset) {
        page.value = 1;
        hasMore.value = true;
    }

    try {
        const params: DreamListParams = {
            page: page.value,
            pageSize
        };

        if (keyword.value) {
            params.keyword = keyword.value;
        }
        if (selectedEmotion.value) {
            params.emotion = selectedEmotion.value;
        }
        if (selectedTag.value) {
            params.tag = selectedTag.value;
        }
        if (filterDate.value) {
            params.startDate = `${filterDate.value}T00:00:00`;
            params.endDate = `${filterDate.value}T23:59:59`;
        }

        const response = await dreamApi.getList(params);

        if (reset) {
            dreams.value = response.list;
            // 首次加载时提取自定义标签
            extractCustomTags(response.list);
        } else {
            dreams.value = [...dreams.value, ...response.list];
            // 加载更多时也提取自定义标签
            extractCustomTags(response.list);
        }

        total.value = response.total;
        hasMore.value = dreams.value.length < response.total;
        page.value++;
    } catch (error: any) {
        console.error('加载梦境列表失败:', error);
        uni.showToast({
            title: error.message || '加载失败',
            icon: 'none'
        });
    } finally {
        isLoading.value = false;
    }
}

function handleSearch() {
    loadDreams(true);
}

function clearSearch() {
    keyword.value = '';
    loadDreams(true);
}

function selectEmotion(emotion: string) {
    selectedEmotion.value = emotion;
    loadDreams(true);
}

function selectTag(tag: string) {
    selectedTag.value = tag;
    loadDreams(true);
}

function loadMore() {
    loadDreams();
}

function handleItemTap(dream: Dream) {
    if (isSelectMode.value) {
        toggleSelect(dream.id);
    } else {
        uni.navigateTo({
            url: `/pages/dream-detail/index?id=${dream.id}`
        });
    }
}

function enterSelectMode() {
    isSelectMode.value = true;
    selectedIds.value = [];
}

function exitSelectMode() {
    isSelectMode.value = false;
    selectedIds.value = [];
}

function toggleSelect(id: string) {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
        selectedIds.value.splice(index, 1);
    } else {
        selectedIds.value.push(id);
    }
}

function toggleSelectAll() {
    if (isAllSelected.value) {
        selectedIds.value = [];
    } else {
        selectedIds.value = dreams.value.map((d) => d.id);
    }
}

async function handleBatchDelete() {
    if (selectedIds.value.length === 0) return;

    uni.showModal({
        title: '确认删除',
        content: `确定要删除选中的 ${selectedIds.value.length} 条梦境吗？删除后无法恢复。`,
        confirmColor: '#FF6B6B',
        success: async (res) => {
            if (res.confirm) {
                try {
                    uni.showLoading({ title: '删除中...' });
                    await dreamApi.batchDelete(selectedIds.value);
                    uni.hideLoading();

                    uni.showToast({
                        title: `已删除 ${selectedIds.value.length} 条`,
                        icon: 'success'
                    });

                    // 重新加载列表
                    selectedIds.value = [];
                    loadDreams(true);
                } catch (error: any) {
                    uni.hideLoading();
                    uni.showToast({
                        title: error.message || '删除失败',
                        icon: 'none'
                    });
                }
            }
        }
    });
}

function goToRecord() {
    uni.switchTab({ url: '/pages/record/index' });
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return '昨天';
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    }
}

function getEmotionIcon(emotion: string): string {
    const found = emotions.find((e) => e.id === emotion);
    return found?.icon || '😶';
}

function getTagName(tagId: string): string {
    return getTagDisplayName(tagId);
}

// 运势评分颜色
function getScoreColor(score: number): string {
    if (score >= 85) return '#10b981'; // 绿色 - 大吉
    if (score >= 75) return '#8b5cf6'; // 紫色 - 吉
    if (score >= 65) return '#f59e0b'; // 橙色 - 中
    return '#ef4444'; // 红色 - 需注意
}

// 生命周期
onLoad((options) => {
    if (options?.date) {
        filterDate.value = options.date;
    }
});

onMounted(() => {
    loadDreams(true);
});

onShow(() => {
    // 页面显示时刷新列表
    if (dreams.value.length > 0) {
        loadDreams(true);
    }
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dark.scss' as *;

.dream-list-page {
    min-height: 100vh;
    background: $bg-page;
    padding-top: 44px;
    display: flex;
    flex-direction: column;
}

// 导航栏操作按钮
.nav-action {
    font-size: 28rpx;
    color: $primary-color;
    font-weight: 500;
}

// 搜索栏
.search-bar {
    padding: 24rpx 32rpx;
    background: #fff;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 40rpx;
    padding: 16rpx 24rpx;
    gap: 16rpx;
}

.search-icon {
    width: 36rpx;
    height: 36rpx;
    opacity: 0.5;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
}

.search-input {
    flex: 1;
    font-size: 28rpx;
    color: $text-primary;
}

.clear-btn {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-placeholder;
    font-size: 32rpx;
}

// 筛选区域
.filter-section {
    background: #fff;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.filter-scroll {
    white-space: nowrap;
}

.filter-chips {
    display: inline-flex;
    gap: 16rpx;
    padding: 16rpx 32rpx;
}

.filter-chip {
    display: inline-flex;
    align-items: center;
    padding: 12rpx 24rpx;
    background: #f5f7fa;
    border-radius: 32rpx;
    font-size: 24rpx;
    color: $text-secondary;
    transition: all 0.2s;

    &.active {
        background: $primary-light;
        color: $primary-color;
        font-weight: 500;
    }
}

// 统计栏
.stats-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 32rpx;
    background: $bg-page;
}

.stats-text {
    font-size: 24rpx;
    color: $text-secondary;
}

.selected-info {
    font-size: 24rpx;
    color: $primary-color;
    font-weight: 500;
}

// 梦境列表
.dream-list {
    flex: 1;
    padding: 0 32rpx;
    padding-bottom: 32rpx;
    width: calc(100% - 64rpx);
    transition: padding-bottom 0.3s ease;

    &.has-bottom-bar {
        padding-bottom: 180rpx;
    }
}

.dream-item {
    display: flex;
    align-items: flex-start;
    gap: 20rpx;
    background: #fff;
    border-radius: 24rpx;
    width: calc(100% - 56rpx);
    padding: 28rpx;
    margin-top: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: all 0.2s;

    &.selected {
        background: $primary-light;
        box-shadow:
            inset 0 0 0 3rpx $primary-color,
            0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    }

    &:active {
        transform: scale(0.98);
    }
}

// 选择框
.checkbox-wrapper {
    padding: 8rpx;
}

.checkbox {
    width: 44rpx;
    height: 44rpx;
    border: 3rpx solid #d1d5db;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &.checked {
        background: $primary-color;
        border-color: $primary-color;
    }
}

.check-icon {
    width: 28rpx;
    height: 28rpx;
    filter: brightness(0) invert(1);
}

// 梦境内容
.dream-content-wrapper {
    flex: 1;
    min-width: 0;
}

.dream-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
}

.dream-date {
    font-size: 24rpx;
    color: $text-placeholder;
}

.dream-badges {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

// 运势评分徽章
.score-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48rpx;
    height: 36rpx;
    padding: 0 12rpx;
    border-radius: 18rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.score-text {
    font-size: 22rpx;
    font-weight: 700;
    color: #fff;
}

.emotion-badge {
    font-size: 28rpx;
}

.public-badge,
.analysis-badge {
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge-icon {
    width: 28rpx;
    height: 28rpx;
    opacity: 0.6;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
}

.analysis-badge .badge-icon {
    filter: brightness(0) saturate(100%) invert(84%) sepia(82%) saturate(2167%) hue-rotate(360deg) brightness(104%)
        contrast(103%);
    opacity: 1;
}

.dream-content {
    font-size: 28rpx;
    line-height: 1.6;
    color: $text-primary;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    word-break: break-all;
}

.dream-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
}

.tag-item {
    font-size: 22rpx;
    color: $text-secondary;
    background: #f5f7fa;
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
}

// 加载状态
.loading-more,
.no-more {
    text-align: center;
    padding: 32rpx;
    font-size: 24rpx;
    color: $text-placeholder;
}

// 空状态
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 60rpx;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 32rpx;
    opacity: 0.3;
    filter: brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
        contrast(87%);
}

.empty-text {
    font-size: 28rpx;
    color: $text-placeholder;
    margin-bottom: 32rpx;
}

.empty-action {
    padding: 20rpx 48rpx;
    background: $primary-color;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
}

// 底部操作栏
.bottom-bar-wrapper {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
}

.bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1rpx solid #f0f0f0;
    box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
    border-radius: 32rpx 32rpx 0 0;
}

// 弹出动画
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

.select-all-btn {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 28rpx;
    color: $text-primary;
}

.delete-btn {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 40rpx;
    background: #ff6b6b;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
    transition: all 0.2s;

    &.disabled {
        opacity: 0.5;
    }

    &:active:not(.disabled) {
        transform: scale(0.98);
    }
}

.delete-icon {
    width: 32rpx;
    height: 32rpx;
    filter: brightness(0) invert(1);
}

// 暗黑模式
.dream-list-page.dark-mode {
    background: $dark-bg-page;

    .nav-action {
        color: $dark-primary-color;
    }

    .search-bar {
        background: $dark-bg-card;
    }

    .search-input-wrapper {
        background: $dark-bg-secondary;
    }

    .search-input {
        color: $dark-text-primary;
    }

    .search-icon {
        filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
            contrast(87%);
    }

    .filter-section {
        background: $dark-bg-card;
        border-bottom-color: $dark-border-color;
    }

    .filter-chip {
        background: $dark-bg-secondary;
        color: $dark-text-secondary;

        &.active {
            background: $dark-primary-light;
            color: $dark-primary-color;
        }
    }

    .stats-bar {
        background: $dark-bg-page;
    }

    .stats-text {
        color: $dark-text-secondary;
    }

    .selected-info {
        color: $dark-primary-color;
    }

    .dream-item {
        background: $dark-bg-card;
        box-shadow: $dark-shadow-sm;

        &.selected {
            background: $dark-primary-light;
            box-shadow:
                inset 0 0 0 3rpx $dark-primary-color,
                $dark-shadow-sm;
        }
    }

    .checkbox {
        border-color: $dark-border-color;

        &.checked {
            background: $dark-primary-color;
            border-color: $dark-primary-color;
        }
    }

    .dream-date {
        color: $dark-text-placeholder;
    }

    .dream-content {
        color: $dark-text-primary;
    }

    .tag-item {
        background: $dark-bg-secondary;
        color: $dark-text-secondary;
    }

    .badge-icon {
        filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
            contrast(87%);
    }

    .analysis-badge .badge-icon {
        filter: brightness(0) saturate(100%) invert(84%) sepia(82%) saturate(2167%) hue-rotate(360deg) brightness(104%)
            contrast(103%);
    }

    .loading-more,
    .no-more {
        color: $dark-text-placeholder;
    }

    .empty-icon {
        filter: brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(362%) hue-rotate(169deg) brightness(95%)
            contrast(87%);
    }

    .empty-text {
        color: $dark-text-placeholder;
    }

    .bottom-bar {
        background: $dark-bg-card;
        border-top-color: $dark-border-color;
        box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.3);
    }

    .select-all-btn {
        color: $dark-text-primary;
    }
}
</style>
