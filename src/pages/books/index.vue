<template>
    <view
        class="content-page books-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
        :style="{ paddingTop: navHeight + 'px' }"
    >
        <NavBar :title="shelfOnly ? '我的书架' : '心灵书店'" />
        <scroll-view
            v-if="!shelfOnly"
            class="book-filters"
            scroll-x
            :show-scrollbar="false"
        >
            <view class="book-filter-list">
                <button
                    v-for="(label, key) in BOOK_CATEGORY_LABELS"
                    :key="key"
                    class="book-filter"
                    :class="{ active: category === key }"
                    :aria-pressed="category === key"
                    @tap="selectCategory(key)"
                >
                    {{ label }}
                </button>
            </view>
        </scroll-view>
        <button
            v-if="favoritesError"
            class="book-retry"
            @tap="refreshFavorites()"
        >
            收藏状态同步失败，点击重试
        </button>
        <view class="book-list">
            <BookCard
                v-for="book in books"
                :key="book.id"
                :book="book"
                :saved="booksStore.savedIds.includes(book.id)"
                :pending="booksStore.pendingIds.includes(book.id)"
                :save-disabled="!booksStore.favoritesReady"
                @save="saveBook"
                @open="openBook"
            />
            <view
                v-if="loading && !books.length"
                class="content-empty"
                aria-live="polite"
                >正在加载书籍…</view
            >
            <view
                v-else-if="error && !books.length"
                class="content-empty"
                role="alert"
            >
                <text>{{ error }}</text>
                <button
                    class="book-retry"
                    @tap="loadBooks(true)"
                >
                    重新加载
                </button>
            </view>
            <view
                v-else-if="!books.length"
                class="content-empty"
            >
                <template v-if="savedOnly">
                    <view>还没有收藏书籍</view>
                    <view>发现喜欢的书，点击收藏即可加入书架。</view>
                </template>
                <view v-else>这个分类暂时没有书籍</view>
            </view>
            <button
                v-if="hasMore && books.length"
                class="book-retry"
                :disabled="loading"
                @tap="loadBooks()"
            >
                {{ loading ? '正在加载…' : error ? '加载失败，点击重试' : '加载更多' }}
            </button>
            <button
                v-else-if="error && books.length"
                class="book-retry"
                @tap="loadBooks(true)"
            >
                刷新失败，点击重试
            </button>
        </view>
        <button
            v-if="shelfOnly"
            class="content-primary"
            @tap="goToBooks"
        >
            去书店看看
        </button>
        <text class="content-note books-note">价格仅供参考，暂不提供购买服务。</text>
    </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onLoad, onShow, onReachBottom } from '@dcloudio/uni-app';
import { useUserStore, useBooksStore } from '@/stores';
import { booksApi } from '@/api';
import { BOOK_CATEGORY_LABELS } from '@/constants/content';
import type { Book, BookCategory } from '@/constants/content';
import NavBar from '@/components/NavBar/index.vue';
import BookCard from '@/components/BookCard/index.vue';

const userStore = useUserStore();
const booksStore = useBooksStore();
const navHeight = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
type Category = keyof typeof BOOK_CATEGORY_LABELS;
const category = ref<Category>('all');
const shelfOnly = ref(false);
const books = ref<Book[]>([]);
const loading = ref(false);
const error = ref('');
const favoritesError = ref(false);
const page = ref(1);
const hasMore = ref(false);
const savedOnly = computed(() => shelfOnly.value || category.value === 'saved');
let requestVersion = 0;

onLoad((options) => {
    shelfOnly.value = options?.mode === 'shelf';
    const value = options?.category === 'stress' ? 'emotion' : options?.category;
    if (value && Object.prototype.hasOwnProperty.call(BOOK_CATEGORY_LABELS, value)) category.value = value as Category;
});
onShow(() => {
    void loadBooks(true);
});
onReachBottom(() => {
    if (hasMore.value && !loading.value) void loadBooks();
});
watch(
    () => userStore.token,
    (_, previous) => {
        if (!previous) return;
        requestVersion++;
        books.value = [];
        loading.value = false;
        hasMore.value = false;
        error.value = '登录状态已变化，请重新加载';
    }
);

function selectCategory(value: Category) {
    if (category.value === value) return;
    category.value = value;
    books.value = [];
    void loadBooks(true);
}

async function loadBooks(refresh = false) {
    if (!refresh && (loading.value || !hasMore.value)) return;
    const version = ++requestVersion;
    const requestedCategory = category.value;
    const saved = savedOnly.value;
    const nextPage = refresh ? 1 : page.value;
    loading.value = true;
    error.value = '';
    try {
        const token = await booksStore.ensureSession();
        if (version !== requestVersion || userStore.token !== token) return;
        void refreshFavorites(refresh);
        const result = await booksApi.getList({
            category: !saved && requestedCategory !== 'all' ? (requestedCategory as BookCategory) : undefined,
            saved: saved || undefined,
            page: nextPage,
            pageSize: 20
        });
        if (version !== requestVersion || userStore.token !== token) return;
        books.value = refresh
            ? result.items
            : [
                  ...books.value,
                  ...result.items.filter((book) => !books.value.some((existing) => existing.id === book.id))
              ];
        page.value = result.page + 1;
        hasMore.value = result.page * result.pageSize < result.total;
    } catch (err) {
        if (version === requestVersion) error.value = err instanceof Error ? err.message : '书籍加载失败，请重试';
    } finally {
        if (version === requestVersion) loading.value = false;
    }
}

async function refreshFavorites(refresh = true) {
    let token = userStore.token;
    try {
        token = await booksStore.ensureSession();
        await booksStore.loadFavorites(refresh);
        if (userStore.token !== token) return;
        favoritesError.value = false;
    } catch {
        if (userStore.token === token) favoritesError.value = true;
    }
}

async function saveBook(id: string) {
    try {
        const saved = await booksStore.toggleFavorite(id);
        if (!saved && savedOnly.value) {
            books.value = books.value.filter((book) => book.id !== id);
            void loadBooks(true);
        }
    } catch (err) {
        uni.showToast({ title: err instanceof Error ? err.message : '收藏保存失败，请重试', icon: 'none' });
    }
}

function openBook(id: string) {
    uni.navigateTo({
        url: `/pages/books/detail?id=${encodeURIComponent(id)}&source=${savedOnly.value ? 'shelf' : 'catalog'}`
    });
}
function goToBooks() {
    uni.navigateTo({ url: '/pages/books/index' });
}
</script>
<style lang="scss" scoped>
@use '@/styles/content.scss';

.books-page {
    background: #fff;
    color: #343632;
}
.book-filters {
    width: 100%;
    padding-top: 16rpx;
    border-bottom: 1rpx solid #eeece8;
    white-space: nowrap;
}
.book-filter-list {
    display: inline-flex;
    gap: 32rpx;
}
.book-filter {
    flex-shrink: 0;
    margin: 0;
    padding: 12rpx 0 20rpx;
    border-radius: 0;
    border-bottom: 3rpx solid transparent;
    background: transparent;
    color: #8b8e88;
    font-size: 25rpx;
    line-height: 44rpx;
    white-space: nowrap;
}
.book-filter::after {
    border: 0;
}
.book-filter.active {
    color: #536f5d;
    border-bottom-color: #536f5d;
    font-weight: 600;
}
.book-filter:focus-visible {
    outline: 2rpx solid #61796a;
    outline-offset: -2rpx;
}
.book-list {
    padding-top: 8rpx;
}
.book-retry {
    margin: 24rpx 0;
    padding: 12rpx 0;
    font-size: 25rpx;
    line-height: 48rpx;
    background: transparent;
    color: #61796a;
}
.book-retry::after {
    border: 0;
}
.books-note {
    padding-top: 28rpx;
    font-size: 22rpx;
    color: #a0a39d;
}
.books-page.dark-mode {
    background: #20251f;
}
.dark-mode .book-filters {
    border-color: #363a35;
}
.dark-mode .book-filter {
    color: #939b90;
}
.dark-mode .book-filter.active {
    color: #b1c4b3;
    border-bottom-color: #b1c4b3;
}
.dark-mode .books-note {
    color: #939b90;
}
.books-page .content-primary {
    background: #61796a;
}
</style>
