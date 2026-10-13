<template>
    <view
        class="content-page tarot-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
        :style="{ paddingTop: navHeight + 'px' }"
    >
        <NavBar title="塔罗" />
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
        <view
            v-if="loading"
            class="page-state"
            aria-live="polite"
            >正在加载牌组…</view
        >
        <view
            v-else-if="error"
            class="page-state"
            aria-live="polite"
        >
            <text>{{ error }}</text>
            <button
                class="content-secondary"
                @tap="retry"
            >
                重新加载
            </button>
        </view>
        <template v-else-if="cards.length">
            <view class="spread-heading">
                <text>{{ mode === 'daily' ? '今天，留一点时间给自己' : '过去 / 当下 / 方向' }}</text>
                <text>{{ revealed.length }} / {{ cards.length }}</text>
            </view>
            <view
                class="tarot-spread"
                :class="{ 'three-cards': mode === 'three' }"
            >
                <view
                    v-for="(card, index) in cards"
                    :key="`${mode}-${drawVersion}-${card.id}`"
                    class="card-slot"
                >
                    <button
                        class="tarot-card"
                        :class="{ flipped: revealed.includes(index) }"
                        :aria-label="
                            revealed.includes(index)
                                ? `${card.name}，${card.reversed ? '逆位' : '正位'}，${card.keyword}`
                                : `翻开${positionLabel(card)}的牌`
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
                            </view>
                            <view
                                class="card-face card-front"
                                :aria-hidden="!revealed.includes(index)"
                            >
                                <image
                                    class="card-art"
                                    :class="{ reversed: card.reversed }"
                                    :src="imageUrl(card)"
                                    mode="aspectFit"
                                    @error="imageErrors[card.id] = true"
                                    @load="imageErrors[card.id] = false"
                                />
                                <text
                                    v-if="imageErrors[card.id]"
                                    class="image-error"
                                    >卡面加载失败</text
                                >
                            </view>
                        </view>
                    </button>
                    <text class="tarot-position">{{ positionLabel(card) }}</text>
                    <text
                        v-if="revealed.includes(index)"
                        class="card-label"
                        >{{ card.name }} / {{ card.reversed ? '逆位' : '正位' }}</text
                    >
                    <button
                        v-if="imageErrors[card.id] && revealed.includes(index)"
                        class="image-retry"
                        @tap="retryImage(card)"
                    >
                        重载卡面
                    </button>
                </view>
            </view>
            <text class="draw-hint">{{
                allRevealed ? '把这份启发，带回今天的生活。' : '放慢呼吸，轻触牌面翻开。'
            }}</text>
            <view
                v-if="allRevealed"
                class="tarot-reading"
            >
                <view
                    v-for="card in cards"
                    :key="card.id"
                    class="reading"
                >
                    <view class="reading-heading">
                        <text class="reading-title"
                            >{{ mode === 'three' ? positionLabel(card) + '：' : '' }}{{ card.name }}</text
                        >
                        <text class="reading-keyword">{{ card.keyword }}</text>
                    </view>
                    <text class="reading-orientation"
                        >{{ card.arcana === 'major' ? '大阿卡纳' : '小阿卡纳' }} /
                        {{ card.reversed ? '逆位' : '正位' }}</text
                    >
                    <text class="reading-copy">{{ card.reading }}</text>
                    <text class="reading-copy position-copy">{{ card.positionReading }}</text>
                </view>
                <button
                    v-if="mode === 'three'"
                    class="content-secondary"
                    @tap="redraw"
                >
                    重新洗牌
                </button>
                <button
                    class="book-link"
                    @tap="goToBooks"
                >
                    <text>看看相关的成长书单</text>
                    <image
                        class="book-link-icon"
                        src="/static/icons/arrow-right.svg"
                        mode="aspectFit"
                        aria-hidden="true"
                    />
                </button>
            </view>
            <text class="content-note"
                >完整 78
                张传统塔罗牌。每日一牌按北京时间换日，结果随账号保存；三牌阵每次重新洗牌都会重新随机抽取。解读用于自我观察，不预言未来。</text
            >
        </template>
    </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { tarotApi, type TarotDraw, type TarotDrawCard } from '@/api/modules/tarot';
import { TAROT_BACK_IMAGE } from '@/constants/content';
import NavBar from '@/components/NavBar/index.vue';

const userStore = useUserStore();
const navHeight = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
const mode = ref<'daily' | 'three'>('daily');
const daily = ref<TarotDraw | null>(null);
const three = ref<TarotDraw | null>(null);
const dailyRevealed = ref<number[]>([]);
const threeRevealed = ref<number[]>([]);
const dailyLoading = ref(false);
const threeLoading = ref(false);
const dailyError = ref('');
const threeError = ref('');
const imageErrors = ref<Record<number, boolean>>({});
const imageRetries = ref<Record<number, number>>({});
const drawVersion = ref(0);
const requestVersions = { daily: 0, three: 0 };
let active = true;

const cards = computed(() => (mode.value === 'daily' ? daily.value : three.value)?.cards || []);
const revealed = computed(() => (mode.value === 'daily' ? dailyRevealed.value : threeRevealed.value));
const loading = computed(() => (mode.value === 'daily' ? dailyLoading.value : threeLoading.value));
const error = computed(() => (mode.value === 'daily' ? dailyError.value : threeError.value));
const allRevealed = computed(() => cards.value.length > 0 && revealed.value.length === cards.value.length);

watch(
    () => userStore.token,
    (token, previous) => {
        daily.value = null;
        three.value = null;
        dailyRevealed.value = [];
        threeRevealed.value = [];
        dailyError.value = '';
        threeError.value = '';
        imageErrors.value = {};
        imageRetries.value = {};
        if (previous) {
            requestVersions.daily++;
            requestVersions.three++;
            dailyLoading.value = false;
            threeLoading.value = false;
        }
        if (token && active) {
            // 登录会在设置 store 后写入 storage，下一微任务再让请求层读取令牌。
            void Promise.resolve().then(() => {
                if (!active || userStore.token !== token) return;
                void load('daily');
                if (mode.value === 'three') void load('three');
            });
        } else {
            dailyError.value = '登录状态已变化，请重新加载';
            threeError.value = dailyError.value;
        }
    },
    { flush: 'sync' }
);
onShow(() => {
    void load('daily');
    if (mode.value === 'three' && !three.value) void load('three');
});
onUnload(() => {
    active = false;
    requestVersions.daily++;
    requestVersions.three++;
});

async function load(target: 'daily' | 'three') {
    const pending = target === 'daily' ? dailyLoading : threeLoading;
    const failure = target === 'daily' ? dailyError : threeError;
    if (pending.value) return;
    const version = ++requestVersions[target];
    pending.value = true;
    failure.value = '';
    let token = userStore.token;
    try {
        if (!userStore.token) await userStore.login();
        if (!active || version !== requestVersions[target]) return;
        token = userStore.token;
        const result = await (target === 'daily' ? tarotApi.daily() : tarotApi.spread());
        if (!active || version !== requestVersions[target] || token !== userStore.token) return;
        if (target === 'daily') {
            if (daily.value?.date !== result.date) dailyRevealed.value = [];
            daily.value = result;
        } else {
            threeRevealed.value = [];
            three.value = result;
            drawVersion.value++;
        }
    } catch (cause) {
        if (active && version === requestVersions[target] && token === userStore.token)
            failure.value = cause instanceof Error ? cause.message : '抽牌失败，请稍后重试';
    } finally {
        if (version === requestVersions[target]) pending.value = false;
    }
}

function setMode(value: 'daily' | 'three') {
    mode.value = value;
    if (!(value === 'daily' ? daily.value : three.value)) void load(value);
}
function retry() {
    void load(mode.value);
}
function reveal(index: number) {
    if (!revealed.value.includes(index)) revealed.value.push(index);
}
function redraw() {
    void load('three');
}
function positionLabel(card: TarotDrawCard) {
    return { today: '今日一牌', past: '过去', present: '当下', future: '方向' }[card.position];
}
function imageUrl(card: TarotDrawCard) {
    const retry = imageRetries.value[card.id];
    return retry ? `${card.image}?retry=${retry}` : card.image;
}
function retryImage(card: TarotDrawCard) {
    imageErrors.value[card.id] = false;
    imageRetries.value[card.id] = (imageRetries.value[card.id] || 0) + 1;
}
function goToBooks() {
    uni.navigateTo({ url: '/pages/books/index?category=growth' });
}
</script>

<style lang="scss" scoped>
@use '@/styles/content.scss';

.tarot-modes {
    justify-content: center;
    margin: 20rpx 0 42rpx;
}
.spread-heading {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    color: #857d8a;
    font-size: 24rpx;
}
.page-state {
    padding: 120rpx 0;
    display: flex;
    flex-direction: column;
    gap: 28rpx;
    align-items: center;
    color: #857d8a;
    font-size: 27rpx;
}
.tarot-spread {
    display: flex;
    justify-content: center;
    gap: 16rpx;
    padding: 38rpx 0 22rpx;
}
.card-slot {
    width: 310rpx;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.tarot-card {
    position: relative;
    width: 100%;
    height: 540rpx;
    padding: 0;
    margin: 0;
    overflow: visible;
    background: transparent;
    border-radius: 10rpx;
    perspective: 1200rpx;
    line-height: normal;
}
.tarot-card::after {
    border: none;
}
.tarot-card:focus-visible {
    outline: 4rpx solid #8b6ca4;
    outline-offset: 8rpx;
}
.card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.65s ease;
}
.tarot-card.flipped .card-inner {
    transform: rotateY(180deg);
}
.card-face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 10rpx;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 8rpx 22rpx rgba(48, 33, 69, 0.12);
}
.card-back {
    background: #24243d;
}
.card-front {
    transform: rotateY(180deg);
    background: #f5eedf;
}
.card-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.card-art.reversed {
    transform: rotate(180deg);
}
.image-error {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 22rpx;
    color: #857d8a;
    background: #f5eedf;
}
.tarot-position {
    padding-top: 22rpx;
    color: #857d8a;
    font-size: 24rpx;
}
.card-label {
    margin-top: 10rpx;
    font-size: 22rpx;
    color: #5d5464;
    text-align: center;
}
.image-retry {
    padding: 12rpx 4rpx;
    font-size: 22rpx;
    color: #75588d;
    background: transparent;
    line-height: 1.5;
}
.image-retry::after,
.book-link::after {
    border: none;
}
.three-cards .card-slot {
    flex: 1;
}
.three-cards .tarot-card {
    height: 330rpx;
}
.three-cards .card-label {
    font-size: 20rpx;
}
.draw-hint {
    display: block;
    text-align: center;
    color: #918895;
    font-size: 24rpx;
    margin: 12rpx 0 38rpx;
}
.tarot-reading {
    border-top: 1rpx solid #eeeaf0;
    padding-top: 32rpx;
}
.reading {
    margin-bottom: 36rpx;
}
.reading-heading {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 10rpx;
}
.reading-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #5d5464;
}
.reading-keyword {
    font-size: 23rpx;
    color: #857d8a;
}
.reading-orientation {
    display: block;
    margin-bottom: 16rpx;
    font-size: 22rpx;
    color: #918895;
}
.reading-copy {
    display: block;
    color: #716979;
    font-size: 27rpx;
    line-height: 1.9;
}
.position-copy {
    margin-top: 12rpx;
}
.book-link {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 16rpx;
    padding: 16rpx 0;
    font-size: 25rpx;
    background: transparent;
    color: #75588d;
}
.book-link-icon {
    width: 28rpx;
    height: 28rpx;
    flex-shrink: 0;
}
.dark-mode .tarot-reading {
    border-color: #39323f;
}
.dark-mode .reading-title,
.dark-mode .card-label {
    color: #e0d5e8;
}
.dark-mode .reading-copy,
.dark-mode .page-state {
    color: #c0b3ca;
}
.dark-mode .tarot-position,
.dark-mode .spread-heading,
.dark-mode .reading-orientation,
.dark-mode .draw-hint,
.dark-mode .reading-keyword {
    color: #a99cb3;
}
.dark-mode .book-link {
    color: #cdb3df;
}
@media (prefers-reduced-motion: reduce) {
    .card-inner {
        transition: none;
    }
}
</style>
