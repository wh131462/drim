import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
    // 记梦成就
    {
        id: 'dream_first',
        name: '初次记梦',
        description: '记录第一个梦境',
        icon: '🌙',
        conditionType: 'dream_count',
        conditionValue: 1,
        rewardPoints: 10,
        sortOrder: 1
    },
    {
        id: 'dream_beginner',
        name: '入门梦想家',
        description: '累计记录10个梦境',
        icon: '✨',
        conditionType: 'dream_count',
        conditionValue: 10,
        rewardPoints: 20,
        sortOrder: 2
    },
    {
        id: 'dream_intermediate',
        name: '资深梦想家',
        description: '累计记录50个梦境',
        icon: '🌟',
        conditionType: 'dream_count',
        conditionValue: 50,
        rewardPoints: 50,
        sortOrder: 3
    },
    {
        id: 'dream_advanced',
        name: '梦境大师',
        description: '累计记录100个梦境',
        icon: '👑',
        conditionType: 'dream_count',
        conditionValue: 100,
        rewardPoints: 100,
        sortOrder: 4
    },

    // 连续打卡成就
    {
        id: 'consecutive_3',
        name: '三日连续',
        description: '连续记梦3天',
        icon: '🔥',
        conditionType: 'consecutive_days',
        conditionValue: 3,
        rewardPoints: 15,
        sortOrder: 5
    },
    {
        id: 'consecutive_7',
        name: '周周有梦',
        description: '连续记梦7天',
        icon: '🔥🔥',
        conditionType: 'consecutive_days',
        conditionValue: 7,
        rewardPoints: 30,
        sortOrder: 6
    },
    {
        id: 'consecutive_30',
        name: '月度坚持',
        description: '连续记梦30天',
        icon: '🔥🔥🔥',
        conditionType: 'consecutive_days',
        conditionValue: 30,
        rewardPoints: 100,
        sortOrder: 7
    },
    {
        id: 'consecutive_100',
        name: '百日梦境',
        description: '连续记梦100天',
        icon: '💯',
        conditionType: 'consecutive_days',
        conditionValue: 100,
        rewardPoints: 300,
        sortOrder: 8
    },

    // 任务成就
    {
        id: 'task_first',
        name: '任务新手',
        description: '完成第一个改运任务',
        icon: '🎯',
        conditionType: 'task_count',
        conditionValue: 1,
        rewardPoints: 10,
        sortOrder: 9
    },
    {
        id: 'task_10',
        name: '任务达人',
        description: '累计完成10个改运任务',
        icon: '🏆',
        conditionType: 'task_count',
        conditionValue: 10,
        rewardPoints: 30,
        sortOrder: 10
    },
    {
        id: 'task_50',
        name: '改运专家',
        description: '累计完成50个改运任务',
        icon: '🎖️',
        conditionType: 'task_count',
        conditionValue: 50,
        rewardPoints: 100,
        sortOrder: 11
    },

    // 解析成就
    {
        id: 'analysis_10',
        name: '解梦初窥',
        description: '完成10次梦境解析',
        icon: '🔮',
        conditionType: 'analysis_count',
        conditionValue: 10,
        rewardPoints: 20,
        sortOrder: 12
    },
    {
        id: 'analysis_50',
        name: '解梦专家',
        description: '完成50次梦境解析',
        icon: '🌌',
        conditionType: 'analysis_count',
        conditionValue: 50,
        rewardPoints: 50,
        sortOrder: 13
    },

    // 润色成就
    {
        id: 'polish_first',
        name: '文采初现',
        description: '完成第一次梦境润色',
        icon: '✍️',
        conditionType: 'polish_count',
        conditionValue: 1,
        rewardPoints: 10,
        sortOrder: 14
    },
    {
        id: 'polish_10',
        name: '妙笔生花',
        description: '累计润色10次',
        icon: '🖋️',
        conditionType: 'polish_count',
        conditionValue: 10,
        rewardPoints: 30,
        sortOrder: 15
    },

    // 探索成就
    {
        id: 'explore_10',
        name: '好奇探索者',
        description: '浏览10个他人梦境',
        icon: '🔍',
        conditionType: 'explore_view_count',
        conditionValue: 10,
        rewardPoints: 20,
        sortOrder: 16
    },
    {
        id: 'explore_50',
        name: '梦境游历者',
        description: '浏览50个他人梦境',
        icon: '🗺️',
        conditionType: 'explore_view_count',
        conditionValue: 50,
        rewardPoints: 50,
        sortOrder: 17
    },

    // 积分成就
    {
        id: 'points_100',
        name: '幸运萌新',
        description: '累计获得100幸运值',
        icon: '🍀',
        conditionType: 'lucky_points',
        conditionValue: 100,
        rewardPoints: 20,
        sortOrder: 18
    },
    {
        id: 'points_500',
        name: '幸运之星',
        description: '累计获得500幸运值',
        icon: '⭐',
        conditionType: 'lucky_points',
        conditionValue: 500,
        rewardPoints: 50,
        sortOrder: 19
    },
    {
        id: 'points_1000',
        name: '幸运女神',
        description: '累计获得1000幸运值',
        icon: '💫',
        conditionType: 'lucky_points',
        conditionValue: 1000,
        rewardPoints: 100,
        sortOrder: 20
    }
];

export async function seedAchievements() {
    console.log('🌟 开始初始化成就数据...');

    for (const achievement of achievements) {
        await prisma.achievement.upsert({
            where: { id: achievement.id },
            update: achievement,
            create: achievement
        });
    }

    console.log(`✅ 成功初始化 ${achievements.length} 个成就`);
}

// 如果直接运行此文件
if (require.main === module) {
    seedAchievements()
        .catch((e) => {
            console.error('❌ 初始化成就数据失败:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
