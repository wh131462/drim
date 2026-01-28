/**
 * 日历测试数据
 * 生成跨多个月份的梦境数据，用于测试日历功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 梦境内容模板
const dreamContents = [
    {
        content:
            '我梦见自己在一个美丽的花园里散步，周围开满了五颜六色的鲜花。阳光透过树叶洒下斑驳的光影，空气中弥漫着淡淡的花香。',
        tags: ['自然', '愉悦'],
        emotion: 'happy',
        theme: '自然与宁静',
        interpretation: '这个梦境反映了你内心对平静生活的向往。',
        fortuneScore: 85
    },
    {
        content:
            '梦里我正在参加一场重要的考试，但是突然发现自己完全没有复习，试卷上的题目一个都不会做。我感到非常焦虑和恐慌。',
        tags: ['焦虑', '考试'],
        emotion: 'fear',
        theme: '压力与焦虑',
        interpretation: '考试梦是最常见的压力梦之一，反映了你在现实生活中面临的挑战。',
        fortuneScore: 45
    },
    {
        content: '我梦见自己长出了翅膀，可以在天空中自由翱翔。我飞越了高山、大海和城市，看到了前所未见的美丽景色。',
        tags: ['飞行', '自由'],
        emotion: 'happy',
        theme: '自由与突破',
        interpretation: '飞行梦通常代表你渴望摆脱现实的束缚，追求自由和独立。',
        fortuneScore: 92
    },
    {
        content: '梦中我回到了童年的老家，看到了已经去世的奶奶正在院子里晒太阳。她看到我时露出了慈祥的笑容。',
        tags: ['怀旧', '亲人'],
        emotion: 'sad',
        theme: '回忆与思念',
        interpretation: '梦见已故的亲人通常是你内心深处的思念和回忆的体现。',
        fortuneScore: 70
    },
    {
        content: '我梦见自己被困在一个巨大的迷宫里，四周都是高高的墙壁，找不到出口。我在迷宫中不停地奔跑。',
        tags: ['迷宫', '困境'],
        emotion: 'confused',
        theme: '困境与突破',
        interpretation: '迷宫梦象征着你在现实生活中遇到的困境或困惑。',
        fortuneScore: 55
    },
    {
        content: '梦里我在海边散步，海浪轻轻拍打着沙滩。突然，我看到海面上出现了一条巨大的彩虹桥，一直延伸到天边。',
        tags: ['奇幻', '探险'],
        emotion: 'happy',
        theme: '梦幻与探索',
        interpretation: '彩虹桥和云中城堡代表你对美好事物的向往和追求。',
        fortuneScore: 88
    }
];

/**
 * 生成跨月份的测试数据
 * @param userId 用户ID
 * @param months 要生成的月数（向前推）
 * @param density 每月记梦密度 (0-1)，1 表示每天都记
 */
export async function seedCalendarTestData(userId: string, months: number = 4, density: number = 0.6) {
    console.log(`\n📅 开始创建跨 ${months} 个月的日历测试数据...`);
    console.log(`   用户ID: ${userId}`);
    console.log(`   记梦密度: ${(density * 100).toFixed(0)}%\n`);

    // 检查用户是否存在
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.log('❌ 用户不存在，请先创建用户');
        return;
    }

    const now = new Date();
    let totalCreated = 0;
    const monthStats: { month: string; count: number }[] = [];

    // 生成每个月的数据
    for (let m = 0; m < months; m++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        let monthCount = 0;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        console.log(`📆 处理 ${monthKey}...`);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const createdAt = new Date(year, month - 1, day, 8, 0, 0);

            // 跳过未来日期
            if (createdAt > now) continue;

            // 检查该日期是否已有梦境
            const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

            const existing = await prisma.dream.findFirst({
                where: {
                    userId,
                    createdAt: { gte: startOfDay, lte: endOfDay },
                    status: { not: 'deleted' }
                }
            });

            if (existing) {
                console.log(`   ⏭️  ${dateStr} 已有梦境，跳过`);
                continue;
            }

            // 根据密度随机决定是否记梦
            if (Math.random() > density) continue;

            // 随机选择梦境模板
            const dreamData = dreamContents[Math.floor(Math.random() * dreamContents.length)];

            // 创建梦境
            const dream = await prisma.dream.create({
                data: {
                    userId,
                    content: dreamData.content,
                    originalContent: dreamData.content,
                    tags: JSON.stringify(dreamData.tags),
                    emotion: dreamData.emotion,
                    wordCount: dreamData.content.length,
                    status: 'analyzed',
                    isPublic: Math.random() > 0.7,
                    viewCount: Math.floor(Math.random() * 30),
                    likeCount: Math.floor(Math.random() * 10),
                    createdAt,
                    updatedAt: createdAt
                }
            });

            // 创建原始版本
            await prisma.dreamVersion.create({
                data: {
                    dreamId: dream.id,
                    userId,
                    type: 'original',
                    content: dreamData.content,
                    versionNumber: 1,
                    isCurrent: true,
                    createdAt
                }
            });

            // 创建解析结果
            await prisma.analysis.create({
                data: {
                    dreamId: dream.id,
                    userId,
                    status: 'completed',
                    theme: dreamData.theme,
                    interpretation: dreamData.interpretation,
                    fortuneScore: dreamData.fortuneScore,
                    fortuneTips: JSON.stringify(['保持积极心态', '注意休息']),
                    aiModel: 'gpt-4',
                    tokensUsed: 300,
                    latency: 1500,
                    createdAt,
                    updatedAt: createdAt
                }
            });

            monthCount++;
            totalCreated++;
            console.log(`   ✅ ${dateStr} 创建梦境 (${dream.id.slice(-8)})`);
        }

        monthStats.push({ month: monthKey, count: monthCount });
    }

    // 更新用户统计
    const totalDreams = await prisma.dream.count({
        where: { userId, status: { not: 'deleted' } }
    });

    await prisma.user.update({
        where: { id: userId },
        data: { totalDreams }
    });

    console.log('\n🎉 日历测试数据创建完成！');
    console.log('\n📊 统计:');
    console.log(`   总计创建: ${totalCreated} 条梦境`);
    console.log('   各月分布:');
    for (const stat of monthStats) {
        console.log(`     - ${stat.month}: ${stat.count} 条`);
    }
}

// 主函数
async function main() {
    const userId = process.argv[2] || 'test-user-1';
    const months = parseInt(process.argv[3] || '4', 10);
    const density = parseFloat(process.argv[4] || '0.6');

    await seedCalendarTestData(userId, months, density);
}

// 如果直接运行此文件
if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ 创建日历测试数据失败:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
