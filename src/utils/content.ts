import { BOOKS, TEST_SETS } from '@/constants/content';

export const SAVED_BOOKS_KEY = 'drim-saved-books-v1';
export const TEST_RESULT_KEY = 'drim-test-result-v1';

export function readSavedBooks(): string[] {
    try {
        const value: unknown = uni.getStorageSync(SAVED_BOOKS_KEY);
        return Array.isArray(value)
            ? [...new Set(value.filter((id): id is string => BOOKS.some((book) => book.id === id)))]
            : [];
    } catch {
        return [];
    }
}

export function toggleSavedBook(id: string, saved: string[]): string[] {
    if (!BOOKS.some((book) => book.id === id)) return saved;
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    uni.setStorageSync(SAVED_BOOKS_KEY, next);
    return next;
}

export function testResult(
    type: 'mbti' | 'big5',
    answers: number[]
): { title: string; description: string; traits: string[] } | null {
    const questions = TEST_SETS[type];
    if (
        answers.length !== questions.length ||
        questions.some((_, index) => answers[index] !== 0 && answers[index] !== 1)
    )
        return null;
    if (type === 'big5') {
        const traits = ['开放性', '尽责性', '外向性', '宜人性', '情绪稳定性'];
        return {
            title: '你的五种性格倾向',
            description: '每个维度只用一题观察当下倾向，不代表固定的人格评分。',
            traits: traits.map(
                (name, index) => `${name}：${answers[index] === 0 ? '更倾向第一项描述' : '更倾向第二项描述'}`
            )
        };
    }
    const dimensions = ['EI', 'SN', 'TF', 'JP'];
    const traits = ['能量来源', '信息偏好', '决策偏好', '生活节奏'];
    const letters = dimensions.map((dimension) => {
        const indices = questions.flatMap((question, index) => (question.dimension === dimension ? [index] : []));
        const score = indices.reduce((sum, index) => sum + answers[index], 0);
        // 两道题意见相反时保留平衡倾向，避免把短测试包装为确定结论。
        return score === 1 ? 'X' : dimension[score === 0 ? 0 : 1];
    });
    return {
        title: letters.join(''),
        description: '这是八道题的自我观察结果；X 表示该维度偏好接近平衡。',
        traits: traits.map((name, index) => `${name}：${letters[index] === 'X' ? '偏好接近平衡' : letters[index]}`)
    };
}
