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
                    @tap="category = key"
                >
                    {{ label }}
                </button>
            </view>
        </scroll-view>
        <view class="book-list"
            ><BookCard
                v-for="book in visibleBooks"
                :key="book.id"
                :book="book"
                :saved="saved.includes(book.id)"
                @save="saveBook"
            /><view
                v-if="!visibleBooks.length"
                class="content-empty"
                ><view>还没有收藏书籍</view><view>发现喜欢的书，点击收藏即可加入书架。</view></view
            ></view
        >
        <button
            v-if="shelfOnly"
            class="content-primary"
            @tap="goToBooks"
        >
            去书店看看
        </button>
        <text class="content-note books-note">封面为原创设计，价格仅供参考，暂不提供购买服务。</text>
    </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { BOOKS, BOOK_CATEGORY_LABELS } from '@/constants/content';
import { readSavedBooks, toggleSavedBook } from '@/utils/content';
import NavBar from '@/components/NavBar/index.vue';
import BookCard from '@/components/BookCard/index.vue';
const userStore = useUserStore();
const navHeight = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
const category = ref<keyof typeof BOOK_CATEGORY_LABELS>('all');
const shelfOnly = ref(false);
const saved = ref<string[]>([]);
const visibleBooks = computed(() =>
    BOOKS.filter((book) =>
        shelfOnly.value || category.value === 'saved'
            ? saved.value.includes(book.id)
            : category.value === 'all' || book.category === category.value
    )
);
onLoad((options) => {
    shelfOnly.value = options?.mode === 'shelf';
    const value = options?.category === 'stress' ? 'emotion' : options?.category;
    if (value && Object.prototype.hasOwnProperty.call(BOOK_CATEGORY_LABELS, value))
        category.value = value as keyof typeof BOOK_CATEGORY_LABELS;
});
onShow(() => {
    saved.value = readSavedBooks();
});
function saveBook(id: string) {
    try {
        saved.value = toggleSavedBook(id, saved.value);
    } catch {
        uni.showToast({ title: '收藏保存失败，请重试', icon: 'none' });
    }
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
