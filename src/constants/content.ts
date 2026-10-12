/**
 * 首版自我探索内容：静态数据，后续可替换为接口数据。
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

export const BOOKS: Book[] = [
    {
        id: 'dream-analysis',
        category: 'dream',
        title: '梦的解析',
        author: '西格蒙德·弗洛伊德',
        tag: '潜意识',
        price: '¥49.00',
        coverImage: '/static/books/dream-analysis.jpg',
        description: '从梦的象征与线索出发，理解那些在夜里浮现的心事。',
        reason: '适合从梦境中的象征和隐喻开始了解潜意识如何表达。'
    },
    {
        id: 'jung-memoir',
        category: 'dream',
        title: '荣格自传：回忆·梦·思考',
        author: '卡尔·古斯塔夫·荣格',
        tag: '荣格',
        price: '¥58.00',
        coverImage: '/static/books/jung-memoir.jpg',
        description: '一段将梦、象征与人生经验放在一起阅读的旅程。',
        reason: '如果你常梦见水、飞行或未知空间，可以继续探索梦与象征。'
    },
    {
        id: 'power-of-now',
        category: 'emotion',
        title: '当下的力量',
        author: '埃克哈特·托利',
        tag: '情绪',
        price: '¥42.00',
        coverImage: '/static/books/power-of-now.jpg',
        description: '把注意力带回当下，给焦虑的思绪留出呼吸的空间。',
        reason: '适合整理焦虑或反复的思绪，练习回到当下。'
    },
    {
        id: 'talk-to-someone',
        category: 'emotion',
        title: '也许你该找个人聊聊',
        author: '洛莉·戈特利布',
        tag: '情绪',
        price: '¥52.00',
        coverImage: '/static/books/talk-to-someone.jpg',
        description: '在真实故事里看见改变的可能，学会温柔地理解自己。',
        reason: '适合从真实故事中整理情绪，找到被理解和改变的可能。'
    },
    {
        id: 'attached',
        category: 'relationship',
        title: '依恋',
        author: '阿米尔·莱文 / 瑞秋·赫勒',
        tag: '关系',
        price: '¥39.00',
        coverImage: '/static/books/attached.jpg',
        description: '认识亲密关系中的不同需要，找到更自在的连接方式。',
        reason: '如果你常梦见亲人、争吵或关系拉扯，可以认识关系中的需要。'
    },
    {
        id: 'courage-to-be-disliked',
        category: 'growth',
        title: '被讨厌的勇气',
        author: '岸见一郎 / 古贺史健',
        tag: '成长',
        price: '¥45.00',
        coverImage: '/static/books/courage-to-be-disliked.jpg',
        description: '从阿德勒心理学出发，重新思考自由、关系与人生选择。',
        reason: '适合继续探索自由、选择，以及如何减少对他人目光的顾虑。'
    },
    {
        id: 'personality-puzzle',
        category: 'personality',
        title: '安静：内向性格的竞争力',
        author: '苏珊·凯恩',
        tag: '人格',
        price: '即将上架',
        coverImage: '/static/books/personality-puzzle.jpg',
        description: '从不同性格的优势出发，理解自己与他人的沟通方式。',
        reason: '适合在完成性格测试后，继续理解自己的能量来源和沟通习惯。',
        comingSoon: true
    }
];

export const TAROT_BACK_IMAGE = '/static/tarot/back.jpg';

export const TAROT_CARDS = [
    {
        name: '星星',
        number: 'XVII',
        image: '/static/tarot/star.jpg',
        keyword: '希望',
        reading: '给自己一点时间，保持对未来的信任，新的方向正在变清晰。'
    },
    {
        name: '月亮',
        number: 'XVIII',
        image: '/static/tarot/moon.jpg',
        keyword: '直觉',
        reading: '先照顾好自己的感受，再分辨哪些担忧来自事实，哪些只是想象。'
    },
    {
        name: '太阳',
        number: 'XIX',
        image: '/static/tarot/sun.jpg',
        keyword: '活力',
        reading: '把注意力放回正在发生的好事，坦率表达会带来更多能量。'
    },
    {
        name: '节制',
        number: 'XIV',
        image: '/static/tarot/temperance.jpg',
        keyword: '平衡',
        reading: '不必一次解决所有问题，找到适合自己的节奏就已经在前进。'
    },
    {
        name: '隐者',
        number: 'IX',
        image: '/static/tarot/hermit.jpg',
        keyword: '内省',
        reading: '独处不是停滞，给自己安静的空间，答案会从经验里浮现。'
    }
];

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

export function recommendBooks(topic: string): Book[] {
    const source = topic || '';
    const matches = source.match(/亲人|家庭|争吵|关系|考试|追逐|迷路|焦虑|压力|飞行|水|死亡|潜意识|梦/g) || [];
    const category: BookCategory | null = /亲人|家庭|争吵|关系/.test(source)
        ? 'relationship'
        : /考试|追逐|迷路|焦虑|压力/.test(source)
          ? 'emotion'
          : /飞行|水|死亡|潜意识|梦/.test(source)
            ? 'dream'
            : null;
    const books = (category ? BOOKS.filter((book) => book.category === category) : BOOKS).slice(0, 2);
    if (!matches.length) return books;
    const topicLabel = [...new Set(matches)].slice(0, 2).join('、');
    return books.map((book) => ({ ...book, reason: `你的梦境或解析出现了“${topicLabel}”，${book.reason}` }));
}
