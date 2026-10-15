<template>
    <view
        class="book-card"
        :class="{ 'dark-mode': userStore.isDarkMode }"
    >
        <button
            class="book-cover-link"
            :aria-label="`查看${book.title}`"
            @tap="$emit('open', book.id)"
        >
            <image
                v-if="!imageFailed && imageSrc"
                class="book-jacket"
                :src="imageSrc"
                mode="aspectFit"
                :alt="`${book.title}封面`"
                aria-hidden="true"
                @error="onImageError"
            />
            <view
                v-else
                class="book-cover-fallback"
                ><text>{{ book.title }}</text></view
            >
        </button>
        <view class="book-copy">
            <button
                class="book-title"
                :aria-label="`查看${book.title}`"
                @tap="$emit('open', book.id)"
            >
                {{ book.title }}
            </button>
            <text class="book-author">{{ book.author }}</text>
            <text
                class="book-summary"
                :class="{ 'book-recommendation': !!reason }"
                >{{ reason || book.description }}</text
            >
            <view class="book-footer">
                <text
                    v-if="book.comingSoon || book.price"
                    class="book-price"
                    >{{ book.comingSoon ? '即将上架' : `参考价 ${book.price}` }}</text
                >
                <button
                    class="save-book"
                    :class="{ saved }"
                    :disabled="pending || saveDisabled"
                    :aria-pressed="saved"
                    :aria-label="`${saved ? '取消收藏' : '收藏'}${book.title}`"
                    @tap.stop="$emit('save', book.id)"
                >
                    {{ pending ? '保存中' : saved ? '已收藏' : '收藏' }}
                </button>
            </view>
        </view>
    </view>
</template>
<script setup lang="ts">
import type { Book } from '@/constants/content';
import { useCachedImage } from '@/utils/use-cached-image';
import { useUserStore } from '@/stores';
const userStore = useUserStore();
const props = defineProps<{ book: Book; saved: boolean; pending?: boolean; saveDisabled?: boolean; reason?: string }>();
const { imageSrc, imageFailed, onImageError } = useCachedImage(
    () => props.book.coverImage,
    () => props.book.coverVersion || ''
);
defineEmits<{ (event: 'save', id: string): void; (event: 'open', id: string): void }>();
</script>
<style lang="scss" scoped>
.book-card {
    display: flex;
    align-items: flex-start;
    gap: 28rpx;
    padding: 28rpx 0;
    border-bottom: 1rpx solid #eeece8;
}
.book-cover-link {
    flex: 0 0 148rpx;
    margin: 0;
    padding: 0;
    width: 148rpx;
    height: 222rpx;
    border-radius: 2rpx;
    background: transparent;
}
.book-cover-link::after,
.book-title::after {
    border: none;
}
.book-cover-link:focus-visible,
.book-title:focus-visible {
    outline: 2rpx solid #61796a;
    outline-offset: 4rpx;
}
.book-jacket {
    display: block;
    flex: 0 0 148rpx;
    width: 148rpx;
    height: 222rpx;
    border-radius: 2rpx;
}
.book-cover-fallback {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 148rpx;
    height: 222rpx;
    padding: 16rpx;
    background: #f3f3ef;
    color: #747871;
    font-size: 23rpx;
    line-height: 1.6;
}
.book-copy {
    flex: 1;
    min-width: 0;
    min-height: 222rpx;
    display: flex;
    flex-direction: column;
}
.book-title {
    margin: 0;
    padding: 0;
    text-align: left;
    border-radius: 0;
    background: transparent;
    font-size: 29rpx;
    font-weight: 600;
    line-height: 1.5;
    color: #343632;
}
.book-author {
    margin-top: 6rpx;
    font-size: 22rpx;
    line-height: 1.5;
    color: #8b8e88;
}
.book-summary {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: 14rpx;
    font-size: 24rpx;
    line-height: 1.65;
    color: #747871;
}
.book-recommendation {
    display: block;
    overflow: visible;
}
.book-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8rpx 16rpx;
    margin-top: auto;
    padding-top: 12rpx;
}
.book-price {
    font-size: 21rpx;
    color: #989b95;
}
.save-book {
    flex-shrink: 0;
    margin: 0 0 0 auto;
    padding: 0 4rpx;
    font-size: 24rpx;
    line-height: 56rpx;
    background: transparent;
    color: #61796a;
    border-radius: 0;
}
.save-book.saved {
    color: #8b8e88;
}
.save-book::after {
    border: none;
}
.save-book:focus-visible {
    outline: 2rpx solid #61796a;
    outline-offset: 4rpx;
}
.save-book:active {
    opacity: 0.65;
}
.save-book[disabled] {
    opacity: 0.5;
    background: transparent;
}
.book-card.dark-mode {
    border-color: #363a35;
}
.dark-mode .book-cover-fallback {
    background: #2c332a;
    color: #b6beb2;
}
.dark-mode .book-title {
    color: #e5e7e1;
}
.dark-mode .book-author,
.dark-mode .book-price,
.dark-mode .save-book.saved {
    color: #939b90;
}
.dark-mode .book-summary {
    color: #b6beb2;
}
.dark-mode .save-book {
    color: #a4bba8;
}
</style>
