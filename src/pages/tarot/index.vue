<template>
    <view
        class="content-page tarot-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
        :style="{ paddingTop: navHeight + 'px' }"
    >
        <NavBar title="今日塔罗" />
        <view class="content-header">
            <text class="content-title">留一点时间，听见自己</text>
            <text class="content-subtitle">从一张牌开始，观察当下的想法与感受。</text>
        </view>
        <view class="content-tabs tarot-modes">
            <button
                class="content-tab"
                :class="{ active: mode === 'daily' }"
                :aria-pressed="mode === 'daily'"
                @tap="setMode('daily')"
            >
                每日一牌
            </button>
            <button
                class="content-tab"
                :class="{ active: mode === 'three' }"
                :aria-pressed="mode === 'three'"
                @tap="setMode('three')"
            >
                三牌阵
            </button>
        </view>

        <view class="tarot-table">
            <view class="spread-heading">
                <text>{{ mode === 'daily' ? '给今天的一点启发' : '过去 → 当下 → 方向' }}</text>
                <text class="spread-progress">{{ revealed.length }} / {{ cards.length }}</text>
            </view>
            <view
                class="tarot-spread"
                :class="{ 'three-cards': mode === 'three' }"
            >
                <view
                    v-for="(card, index) in cards"
                    :key="`${mode}-${day}-${index}`"
                    class="card-slot"
                >
                    <button
                        class="tarot-card"
                        :class="{ flipped: revealed.includes(index) }"
                        :aria-label="
                            revealed.includes(index)
                                ? `${card.name}，${card.keyword}`
                                : `翻开${mode === 'three' ? positions[index] : '今日'}的牌`
                        "
                        :aria-pressed="revealed.includes(index)"
                        @tap="reveal(index)"
                    >
                        <view class="card-inner">
                            <view
                                class="card-face card-back"
                                :aria-hidden="revealed.includes(index)"
                            >
                                <image
                                    class="card-art"
                                    :src="TAROT_BACK_IMAGE"
                                    mode="aspectFill"
                                />
                                <view class="card-frame"></view>
                                <text class="back-caption">梦见 / 塔罗</text>
                            </view>
                            <view
                                class="card-face card-front"
                                :aria-hidden="!revealed.includes(index)"
                            >
                                <image
                                    class="card-art"
                                    :src="card.image"
                                    mode="aspectFill"
                                />
                                <view class="card-frame"></view>
                                <text class="card-number">{{ card.number }}</text>
                                <view class="card-title-strip">
                                    <text class="card-name">{{ card.name }}</text>
                                    <text class="card-keyword">{{ card.keyword }}</text>
                                </view>
                            </view>
                        </view>
                    </button>
                    <text class="tarot-position">{{ mode === 'three' ? positions[index] : '今日一牌' }}</text>
                </view>
            </view>
            <text class="draw-hint">{{
                revealed.length === cards.length ? '把这份启发，带回今天的生活。' : '放慢呼吸，轻触牌面翻开。'
            }}</text>
        </view>

        <view
            v-if="revealed.length === cards.length"
            class="content-panel tarot-reading"
        >
            <text class="reading-caption">牌面启示</text>
            <view
                v-for="(card, index) in cards"
                :key="card.name"
                class="reading"
            >
                <view class="reading-heading">
                    <text class="reading-number">{{ card.number }}</text>
                    <text class="reading-title"
                        >{{ mode === 'three' ? positions[index] + '：' : '' }}{{ card.name }}</text
                    >
                    <text class="reading-keyword">{{ card.keyword }}</text>
                </view>
                <text class="reading-copy">{{ card.reading }}</text>
            </view>
            <button
                class="content-secondary"
                @tap="goToBooks"
            >
                看看相关的成长书单
            </button>
        </view>
        <text class="content-note">牌面与解读来自静态内容，仅用于自我观察与娱乐，不预言未来。当次结果不保存历史。</text>
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { TAROT_BACK_IMAGE, TAROT_CARDS } from '@/constants/content';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const navHeight = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
const positions = ['过去', '当下', '方向'];
const mode = ref<'daily' | 'three'>('daily');
const revealed = ref<number[]>([]);
const day = ref('');
const dayIndex = ref(0);
const cards = computed(() =>
    (mode.value === 'daily' ? [dayIndex.value] : [dayIndex.value, dayIndex.value + 2, dayIndex.value + 4]).map(
        (index) => TAROT_CARDS[index % TAROT_CARDS.length]
    )
);

onShow(() => {
    const today = new Date();
    const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (date !== day.value) {
        day.value = date;
        dayIndex.value =
            Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000) %
            TAROT_CARDS.length;
        revealed.value = [];
    }
});

function setMode(value: 'daily' | 'three') {
    if (mode.value !== value) {
        mode.value = value;
        revealed.value = [];
    }
}
function reveal(index: number) {
    if (!revealed.value.includes(index)) revealed.value.push(index);
}
function goToBooks() {
    uni.navigateTo({ url: '/pages/books/index?category=growth' });
}
</script>

<style lang="scss" scoped>
@use '@/styles/content.scss';

.tarot-page .content-title {
    font-size: 42rpx;
    letter-spacing: -1rpx;
}
.tarot-modes {
    gap: 0;
    padding: 8rpx;
    border-radius: 20rpx;
    background: #eee9f2;
}
.tarot-modes .content-tab {
    flex: 1;
    background: transparent;
    color: #817386;
    transition:
        background 0.2s,
        color 0.2s;
}
.tarot-modes .content-tab.active {
    background: #fff;
    color: #5e497b;
    box-shadow: 0 4rpx 16rpx rgba(60, 43, 80, 0.07);
}
.tarot-table {
    padding: 28rpx 20rpx 32rpx;
    border-radius: 28rpx;
    background: radial-gradient(ellipse at 50% 40%, #f0e9f3, #f7f3f8 70%);
}
.spread-heading {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    padding: 0 8rpx;
    font-size: 23rpx;
    color: #88768e;
}
.spread-progress {
    font-variant-numeric: tabular-nums;
    color: #a193a6;
}
.tarot-spread {
    display: flex;
    justify-content: center;
    gap: 18rpx;
    padding: 44rpx 0 22rpx;
}
.card-slot {
    width: 336rpx;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.tarot-card {
    position: relative;
    width: 100%;
    height: 504rpx;
    padding: 0;
    margin: 0;
    overflow: visible;
    background: transparent;
    border-radius: 18rpx;
    perspective: 1200rpx;
    line-height: normal;
}
.tarot-card::after {
    border: none;
}
.tarot-card:focus-visible {
    outline: 4rpx solid #8b6ca4;
    outline-offset: 10rpx;
}
.card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.72s cubic-bezier(0.2, 0.75, 0.25, 1);
}
.tarot-card.flipped .card-inner {
    transform: rotateY(180deg);
}
.card-face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 18rpx;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow:
        0 18rpx 34rpx rgba(48, 33, 69, 0.2),
        0 2rpx 4rpx rgba(48, 33, 69, 0.2);
}
.card-back {
    background: radial-gradient(ellipse at 50% 42%, #494365, #24243d 75%);
    color: #d5be91;
}
.card-front {
    transform: rotateY(180deg);
    background: #eee4ce;
    color: #55473e;
}
.card-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.card-frame {
    position: absolute;
    inset: 12rpx;
    border: 1rpx solid rgba(215, 190, 141, 0.65);
    border-radius: 11rpx;
    pointer-events: none;
}
.card-frame::after {
    content: '';
    position: absolute;
    inset: 7rpx;
    border: 1rpx solid rgba(215, 190, 141, 0.25);
    border-radius: 7rpx;
}
.back-caption {
    position: absolute;
    bottom: 38rpx;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 19rpx;
    letter-spacing: 5rpx;
    color: #d3bd95;
}
.card-number {
    position: absolute;
    top: 26rpx;
    left: 0;
    right: 0;
    text-align: center;
    font-family: Georgia, serif;
    font-size: 22rpx;
    letter-spacing: 4rpx;
    color: #735d43;
    background: rgba(246, 239, 222, 0.85);
    padding: 6rpx 0;
}
.card-title-strip {
    position: absolute;
    left: 20rpx;
    right: 20rpx;
    bottom: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7rpx;
    padding: 19rpx 8rpx 16rpx;
    background: rgba(246, 239, 222, 0.94);
    border-top: 1rpx solid rgba(166, 132, 77, 0.4);
}
.card-name {
    font-family: 'Songti SC', 'STSong', serif;
    font-size: 36rpx;
    letter-spacing: 8rpx;
    padding-left: 8rpx;
    font-weight: 600;
    color: #4e4337;
}
.card-keyword {
    font-size: 20rpx;
    letter-spacing: 4rpx;
    padding-left: 4rpx;
    color: #8b765c;
}
.tarot-position {
    padding-top: 26rpx;
    color: #938197;
    font-size: 23rpx;
    letter-spacing: 3rpx;
}
.draw-hint {
    display: block;
    text-align: center;
    font-size: 23rpx;
    color: #a190a6;
}
.three-cards {
    gap: 14rpx;
}
.three-cards .card-slot {
    flex: 1;
}
.three-cards .tarot-card {
    height: 308rpx;
}
.three-cards .card-frame {
    inset: 7rpx;
    border-radius: 9rpx;
}
.three-cards .card-frame::after {
    inset: 4rpx;
}
.three-cards .card-number {
    top: 16rpx;
    font-size: 17rpx;
    letter-spacing: 2rpx;
    padding: 3rpx 0;
}
.three-cards .card-title-strip {
    left: 12rpx;
    right: 12rpx;
    bottom: 12rpx;
    padding: 12rpx 2rpx 10rpx;
    gap: 4rpx;
}
.three-cards .card-name {
    font-size: 27rpx;
    letter-spacing: 4rpx;
    padding-left: 4rpx;
}
.three-cards .card-keyword {
    font-size: 17rpx;
    letter-spacing: 2rpx;
    padding-left: 2rpx;
}
.three-cards .back-caption {
    bottom: 24rpx;
    font-size: 16rpx;
    letter-spacing: 2rpx;
}
.tarot-reading {
    margin-top: 30rpx;
}
.reading-caption {
    display: block;
    margin-bottom: 28rpx;
    font-size: 22rpx;
    color: #a39179;
    letter-spacing: 3rpx;
}
.reading {
    margin-bottom: 30rpx;
}
.reading-heading {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-bottom: 14rpx;
}
.reading-number {
    min-width: 64rpx;
    font-family: Georgia, serif;
    font-size: 23rpx;
    color: #ae9370;
}
.reading-title {
    font-size: 29rpx;
    font-weight: 600;
    color: #654e78;
}
.reading-keyword {
    margin-left: auto;
    font-size: 22rpx;
    color: #a18caa;
}
.reading-copy {
    display: block;
    color: #82768b;
    font-size: 26rpx;
    line-height: 1.9;
}
.dark-mode .tarot-modes {
    background: #2a2534;
}
.dark-mode .tarot-modes .content-tab {
    color: #b6a4c3;
}
.dark-mode .tarot-modes .content-tab.active {
    background: #41364f;
    color: #e0cdeb;
}
.dark-mode .tarot-table {
    background: radial-gradient(ellipse at 50% 40%, #30283c, #25212c 70%);
}
.dark-mode .spread-heading,
.dark-mode .tarot-position,
.dark-mode .draw-hint,
.dark-mode .reading-copy {
    color: #ad9fb7;
}
.dark-mode .reading-title {
    color: #d8c1e6;
}
.dark-mode .reading-keyword {
    color: #bda4c9;
}

@media (prefers-reduced-motion: reduce) {
    .card-inner {
        transition: none;
    }
}
</style>
