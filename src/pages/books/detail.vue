<template>
    <view
        class="content-page book-detail"
        :class="{ 'dark-mode': userStore.isDarkMode }"
        :style="{ paddingTop: navHeight + 'px' }"
    >
        <NavBar title="书籍详情" />
        <view
            v-if="loading"
            class="content-empty"
            aria-live="polite"
            >正在加载书籍…</view
        >
        <view
            v-else-if="error"
            class="content-empty"
            role="alert"
        >
            <text>{{ error }}</text>
            <button
                class="detail-retry"
                @tap="loadDetail"
            >
                重新加载
            </button>
        </view>
        <template v-else-if="book">
            <view class="detail-heading">
                <image
                    v-if="!coverFailed"
                    :key="coverRevision"
                    class="detail-cover"
                    :src="book.coverImage"
                    mode="aspectFit"
                    :alt="`${book.title}封面`"
                    @error="coverFailed = true"
                />
                <button
                    v-else
                    class="detail-cover detail-cover-retry"
                    @tap="retryCover"
                >
                    <view>封面加载失败</view><view>点击重试</view>
                </button>
                <view class="detail-meta">
                    <text class="detail-title">{{ book.title }}</text>
                    <text class="detail-author">{{ book.author }}</text>
                    <text
                        v-if="book.tag"
                        class="detail-tag"
                        >{{ book.tag }}</text
                    >
                    <text
                        v-if="book.comingSoon || book.price"
                        class="detail-price"
                        >{{ book.comingSoon ? '即将上架' : `参考价 ${book.price}` }}</text
                    >
                    <button
                        class="detail-save"
                        :disabled="booksStore.pendingIds.includes(book.id) || !booksStore.favoritesReady"
                        :aria-pressed="booksStore.savedIds.includes(book.id)"
                        @tap="saveBook"
                    >
                        {{
                            booksStore.pendingIds.includes(book.id)
                                ? '保存中…'
                                : booksStore.savedIds.includes(book.id)
                                  ? '已收藏，点击取消'
                                  : '加入书架'
                        }}
                    </button>
                </view>
            </view>
            <button
                v-if="favoritesError"
                class="detail-retry"
                @tap="refreshFavorites"
            >
                收藏状态同步失败，点击重试
            </button>
            <view class="detail-section">
                <text class="detail-section-title">关于这本书</text>
                <text class="detail-text">{{ book.description }}</text>
            </view>
            <view
                v-if="book.reason"
                class="detail-section"
            >
                <text class="detail-section-title">推荐理由</text>
                <text class="detail-text">{{ book.reason }}</text>
            </view>
            <text class="content-note">价格仅供参考，暂不提供购买服务。</text>
        </template>
    </view>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { booksApi } from '@/api';
import type { BookClickSource } from '@/api/modules/books';
import type { Book } from '@/constants/content';
import { useUserStore, useBooksStore } from '@/stores';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const booksStore = useBooksStore();
const navHeight = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
const book = ref<Book | null>(null);
const loading = ref(true);
const error = ref('');
const favoritesError = ref(false);
const coverFailed = ref(false);
const coverRevision = ref(0);
let id = '';
let source: BookClickSource = 'catalog';
const requestId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
let requestVersion = 0;
let clickStarted = false;

onLoad((options) => {
    id = options?.id || '';
    if (options?.source === 'shelf' || options?.source === 'recommendation') source = options.source;
});
onShow(() => {
    void loadDetail();
});
watch(
    () => userStore.token,
    (_, previous) => {
        if (!previous) return;
        requestVersion++;
        book.value = null;
        loading.value = false;
        error.value = '登录状态已变化，请重新加载';
    }
);
watch(
    () => book.value?.coverImage,
    () => {
        coverFailed.value = false;
    }
);

async function loadDetail() {
    const version = ++requestVersion;
    loading.value = true;
    error.value = '';
    if (!id) {
        error.value = '没有找到这本书，请返回书店';
        loading.value = false;
        return;
    }
    try {
        const token = await booksStore.ensureSession();
        if (version !== requestVersion || userStore.token !== token) return;
        void refreshFavorites();
        const result = await booksApi.getById(id);
        if (version !== requestVersion || userStore.token !== token) return;
        book.value = result;
        if (!clickStarted) {
            clickStarted = true;
            void recordClick(token).then((success) => {
                if (!success) clickStarted = false;
            });
        }
    } catch (err) {
        if (version === requestVersion) error.value = err instanceof Error ? err.message : '书籍加载失败，请重试';
    } finally {
        if (version === requestVersion) loading.value = false;
    }
}

async function recordClick(token: string): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt++) {
        if (userStore.token !== token) return false;
        try {
            await booksApi.recordClick(id, source, requestId);
            return true;
        } catch {
            // 网络重试复用事件编号，服务端去重以免重复计数。
        }
    }
    return false;
}

async function refreshFavorites() {
    let token = userStore.token;
    try {
        token = await booksStore.ensureSession();
        await booksStore.loadFavorites(true);
        if (userStore.token === token) favoritesError.value = false;
    } catch {
        if (userStore.token === token) favoritesError.value = true;
    }
}

function retryCover() {
    coverRevision.value++;
    coverFailed.value = false;
}

async function saveBook() {
    if (!book.value) return;
    try {
        await booksStore.toggleFavorite(book.value.id);
    } catch (err) {
        uni.showToast({ title: err instanceof Error ? err.message : '收藏保存失败，请重试', icon: 'none' });
    }
}
</script>
<style lang="scss" scoped>
@use '@/styles/content.scss';

.book-detail {
    background: #fff;
    color: #343632;
}
.detail-heading {
    display: flex;
    align-items: flex-start;
    gap: 32rpx;
    padding: 40rpx 0;
    border-bottom: 1rpx solid #eeece8;
}
.detail-cover {
    flex: 0 0 200rpx;
    width: 200rpx;
    height: 300rpx;
}
.detail-cover-retry {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0;
    padding: 20rpx;
    border-radius: 0;
    background: #f3f3ef;
    color: #747871;
    font-size: 24rpx;
    line-height: 1.8;
}
.detail-cover-retry::after {
    border: 0;
}
.detail-meta {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}
.detail-title {
    font-size: 35rpx;
    font-weight: 600;
    line-height: 1.5;
}
.detail-author,
.detail-tag,
.detail-price {
    margin-top: 12rpx;
    font-size: 24rpx;
    line-height: 1.6;
    color: #8b8e88;
}
.detail-save,
.detail-retry {
    margin: 24rpx 0 0;
    padding: 8rpx 0;
    background: transparent;
    color: #61796a;
    font-size: 26rpx;
    line-height: 48rpx;
    text-align: left;
}
.detail-retry {
    text-align: center;
}
.detail-save::after,
.detail-retry::after {
    border: 0;
}
.detail-save:focus-visible,
.detail-retry:focus-visible {
    outline: 2rpx solid #61796a;
}
.detail-section {
    padding: 32rpx 0 12rpx;
}
.detail-section-title {
    display: block;
    margin-bottom: 16rpx;
    font-size: 28rpx;
    font-weight: 600;
}
.detail-text {
    display: block;
    font-size: 28rpx;
    line-height: 1.8;
    white-space: pre-wrap;
    color: #747871;
}
.book-detail.dark-mode {
    background: #20251f;
    color: #e5e7e1;
}
.dark-mode .detail-heading {
    border-color: #363a35;
}
.dark-mode .detail-cover-retry {
    background: #2c332a;
    color: #b6beb2;
}
.dark-mode .detail-text {
    color: #b6beb2;
}
.dark-mode .detail-save,
.dark-mode .detail-retry {
    color: #a4bba8;
}
</style>
