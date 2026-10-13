<template>
    <view
        class="content-page"
        :class="{ 'dark-mode': userStore.isDarkMode }"
        :style="{ paddingTop: navHeight + 'px' }"
    >
        <NavBar title="心理测试" />
        <view class="content-tabs test-tabs"
            ><button
                class="content-tab"
                :class="{ active: type === 'mbti' }"
                @tap="switchTest('mbti')"
            >
                MBTI（8题）</button
            ><button
                class="content-tab"
                :class="{ active: type === 'big5' }"
                @tap="switchTest('big5')"
            >
                大五人格（5题）
            </button></view
        >
        <view
            v-if="result"
            class="content-panel"
            ><text class="result-title">{{ result.title }}</text
            ><text class="result-description">{{ result.description }}</text
            ><text
                v-for="trait in result.traits"
                :key="trait"
                class="result-trait"
                >{{ trait }}</text
            ><text class="content-note">简版结果，仅供自我探索参考。</text
            ><button
                class="content-primary"
                @tap="restart"
            >
                重新测试</button
            ><button
                class="content-secondary"
                @tap="goToBooks"
            >
                人格书单
            </button></view
        >
        <view
            v-else
            class="content-panel"
            ><text class="question-progress">第 {{ current + 1 }} 题 / 共 {{ questions.length }} 题</text
            ><progress
                :percent="Math.round((current / questions.length) * 100)"
                stroke-width="4"
                activeColor="#8966b6"
                backgroundColor="#eee9f4"
            /><text class="question-title">{{ questions[current].text }}</text
            ><button
                v-for="(option, index) in questions[current].options"
                :key="option"
                class="answer-option"
                @tap="answer(index)"
            >
                <text>{{ index === 0 ? 'A' : 'B' }}</text
                >{{ option }}</button
            ><button
                v-if="current > 0"
                class="content-secondary"
                @tap="previous"
            >
                上一题
            </button></view
        >
    </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';
import { TEST_SETS } from '@/constants/content';
import { TEST_RESULT_KEY, testResult } from '@/utils/content';
import NavBar from '@/components/NavBar/index.vue';
const userStore = useUserStore();
const navHeight = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
const type = ref<'mbti' | 'big5'>('mbti');
const answers = ref<number[]>([]);
const current = ref(0);
const questions = computed(() => TEST_SETS[type.value]);
const result = computed(() => testResult(type.value, answers.value));
onLoad(() => {
    try {
        const value = uni.getStorageSync(TEST_RESULT_KEY);
        if (
            value &&
            (value.type === 'mbti' || value.type === 'big5') &&
            Array.isArray(value.answers) &&
            testResult(value.type, value.answers)
        ) {
            type.value = value.type;
            answers.value = value.answers;
        }
    } catch {
        /* 不完整的本地结果从头作答。 */
    }
});
function answer(index: number) {
    answers.value[current.value] = index;
    if (current.value < questions.value.length - 1) current.value++;
    else {
        try {
            uni.setStorageSync(TEST_RESULT_KEY, { type: type.value, answers: answers.value });
        } catch {
            uni.showToast({ title: '结果暂时无法保存', icon: 'none' });
        }
    }
}
function previous() {
    answers.value = answers.value.slice(0, --current.value);
}
function restart() {
    answers.value = [];
    current.value = 0;
    try {
        uni.removeStorageSync(TEST_RESULT_KEY);
    } catch {
        /* 当前答题仍可继续。 */
    }
}
function switchTest(value: 'mbti' | 'big5') {
    if (type.value === value) return;
    if (answers.value.length && !result.value) {
        uni.showModal({
            title: '切换测试',
            content: '切换后当前答题进度将清空。',
            success: (res) => {
                if (res.confirm) {
                    type.value = value;
                    restart();
                }
            }
        });
    } else {
        type.value = value;
        restart();
    }
}
function goToBooks() {
    uni.navigateTo({ url: '/pages/books/index?category=personality' });
}
</script>
<style lang="scss" scoped>
@use '@/styles/content.scss';
.test-tabs {
    margin-top: 32rpx;
}
.question-progress {
    display: block;
    margin-bottom: 20rpx;
    color: #8966b6;
    font-size: 24rpx;
}
.question-title {
    display: block;
    margin: 36rpx 0;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 1.6;
}
.answer-option {
    text-align: left;
    padding: 28rpx;
    margin: 20rpx 0;
    background: #f7f3fb;
    font-size: 28rpx;
    line-height: 1.6;
    border-radius: 18rpx;
    color: #554864;
    display: flex;
    gap: 22rpx;
}
.answer-option::after {
    border: none;
}
.answer-option text {
    color: #8966b6;
    font-weight: 600;
}
.result-title {
    display: block;
    font-size: 48rpx;
    font-weight: 600;
}
.result-description {
    display: block;
    margin: 24rpx 0;
    font-size: 28rpx;
    line-height: 1.8;
}
.result-trait {
    display: block;
    font-size: 28rpx;
    line-height: 2;
}
.dark-mode .answer-option {
    background: #302740;
    color: #eee;
}
</style>
