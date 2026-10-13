import { PrismaClient } from '@prisma/client';

export const BOOK_SEED_DATA = [
    {
        id: 'dream-analysis',
        category: 'dream',
        title: '梦的解析',
        author: '西格蒙德·弗洛伊德',
        tag: '潜意识',
        price: '¥49.00',
        coverImage: '/assets/books/dream-analysis.jpg',
        description: '从梦的象征与线索出发，理解那些在夜里浮现的心事。',
        reason: '适合从梦境中的象征和隐喻开始了解潜意识如何表达。',
        comingSoon: false,
        published: true,
        sortOrder: 1
    },
    {
        id: 'jung-memoir',
        category: 'dream',
        title: '荣格自传：回忆·梦·思考',
        author: '卡尔·古斯塔夫·荣格',
        tag: '荣格',
        price: '¥58.00',
        coverImage: '/assets/books/jung-memoir.jpg',
        description: '一段将梦、象征与人生经验放在一起阅读的旅程。',
        reason: '如果你常梦见水、飞行或未知空间，可以继续探索梦与象征。',
        comingSoon: false,
        published: true,
        sortOrder: 2
    },
    {
        id: 'power-of-now',
        category: 'emotion',
        title: '当下的力量',
        author: '埃克哈特·托利',
        tag: '情绪',
        price: '¥42.00',
        coverImage: '/assets/books/power-of-now.jpg',
        description: '把注意力带回当下，给焦虑的思绪留出呼吸的空间。',
        reason: '适合整理焦虑或反复的思绪，练习回到当下。',
        comingSoon: false,
        published: true,
        sortOrder: 3
    },
    {
        id: 'talk-to-someone',
        category: 'emotion',
        title: '也许你该找个人聊聊',
        author: '洛莉·戈特利布',
        tag: '情绪',
        price: '¥52.00',
        coverImage: '/assets/books/talk-to-someone.jpg',
        description: '在真实故事里看见改变的可能，学会温柔地理解自己。',
        reason: '适合从真实故事中整理情绪，找到被理解和改变的可能。',
        comingSoon: false,
        published: true,
        sortOrder: 4
    },
    {
        id: 'attached',
        category: 'relationship',
        title: '依恋',
        author: '阿米尔·莱文 / 瑞秋·赫勒',
        tag: '关系',
        price: '¥39.00',
        coverImage: '/assets/books/attached.jpg',
        description: '认识亲密关系中的不同需要，找到更自在的连接方式。',
        reason: '如果你常梦见亲人、争吵或关系拉扯，可以认识关系中的需要。',
        comingSoon: false,
        published: true,
        sortOrder: 5
    },
    {
        id: 'courage-to-be-disliked',
        category: 'growth',
        title: '被讨厌的勇气',
        author: '岸见一郎 / 古贺史健',
        tag: '成长',
        price: '¥45.00',
        coverImage: '/assets/books/courage-to-be-disliked.jpg',
        description: '从阿德勒心理学出发，重新思考自由、关系与人生选择。',
        reason: '适合继续探索自由、选择，以及如何减少对他人目光的顾虑。',
        comingSoon: false,
        published: true,
        sortOrder: 6
    },
    {
        id: 'personality-puzzle',
        category: 'personality',
        title: '安静：内向性格的竞争力',
        author: '苏珊·凯恩',
        tag: '人格',
        price: '即将上架',
        coverImage: '/assets/books/personality-puzzle.jpg',
        description: '从不同性格的优势出发，理解自己与他人的沟通方式。',
        reason: '适合在完成性格测试后，继续理解自己的能量来源和沟通习惯。',
        comingSoon: true,
        published: true,
        sortOrder: 7
    }
];

export async function seedBooks(prisma: PrismaClient) {
    for (const book of BOOK_SEED_DATA) {
        await prisma.book.upsert({ where: { id: book.id }, create: book, update: {} });
    }
    console.log(`  已初始化 ${BOOK_SEED_DATA.length} 本书籍（保留已有运营编辑）`);
}
