/**
 * 自我探索内容与书籍接口类型。
 */

export type BookCategory = 'dream' | 'emotion' | 'relationship' | 'growth' | 'personality';

export interface Book {
    id: string;
    category: BookCategory;
    title: string;
    author: string;
    tag: string;
    price: string;
    coverImage: string;
    description: string;
    reason: string;
    comingSoon?: boolean;
}

export const TAROT_BACK_IMAGE = '/static/tarot/back.jpg';

export interface TestQuestion {
    text: string;
    dimension?: string;
    options: [string, string];
}

export const TEST_SETS: Record<'mbti' | 'big5', TestQuestion[]> = {
    mbti: [
        {
            text: '周末突然空下来，你更想？',
            dimension: 'EI',
            options: ['约朋友出门，发现新的地方', '留在家里，按自己的节奏充电']
        },
        {
            text: '面对一个新决定，你通常先相信？',
            dimension: 'SN',
            options: ['事实、经验和可执行的细节', '直觉、可能性和内心的感觉']
        },
        {
            text: '团队出现分歧时，你会优先考虑？',
            dimension: 'TF',
            options: ['哪种方案最符合逻辑和目标', '每个人的感受以及关系的平衡']
        },
        {
            text: '面对计划外的变化，你更倾向于？',
            dimension: 'JP',
            options: ['先整理计划，再按步骤推进', '快速调整，保持开放和灵活']
        },
        {
            text: '你更容易从哪里获得能量？',
            dimension: 'EI',
            options: ['和人交流，分享即时的想法', '独处整理，按自己的节奏恢复']
        },
        {
            text: '面对复杂信息时，你更关注？',
            dimension: 'SN',
            options: ['事实、经验和可执行的细节', '可能性、联想和整体方向']
        },
        {
            text: '别人意见与你不同时，你会先？',
            dimension: 'TF',
            options: ['分析逻辑，判断是否合理', '理解感受，照顾关系氛围']
        },
        {
            text: '安排一天的行程时，你更喜欢？',
            dimension: 'JP',
            options: ['提前计划，按步骤完成', '保留弹性，边走边决定']
        }
    ],
    big5: [
        { text: '遇到新鲜事物时，你通常会？', options: ['主动尝试，享受新体验', '先观察熟悉，再决定是否加入'] },
        { text: '需要完成一项任务时，你会？', options: ['列好步骤，按计划推进', '抓住重点，边做边调整'] },
        { text: '在一群陌生人中，你更常？', options: ['主动开启话题，很快融入', '等待自然的交流，慢慢熟悉'] },
        { text: '朋友遇到烦恼向你倾诉，你会？', options: ['先陪伴和倾听他的感受', '帮他梳理问题，寻找解决办法'] },
        { text: '计划有变化时，你更常？', options: ['平静调整，很快回到自己的节奏', '感到不安，需要一些时间缓和'] }
    ]
};

export const BOOK_CATEGORY_LABELS: Record<
    'all' | 'dream' | 'emotion' | 'relationship' | 'growth' | 'personality' | 'saved',
    string
> = {
    all: '全部',
    dream: '梦与潜意识',
    emotion: '情绪整理',
    relationship: '关系',
    growth: '成长',
    personality: '人格',
    saved: '我的书架'
};
