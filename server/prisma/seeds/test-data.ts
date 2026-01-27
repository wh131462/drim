/**
 * 测试数据初始化
 * 包含测试用户、梦境、解析、任务等全套数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 测试用户数据
const testUsers = [
    {
        id: 'test-user-1',
        openId: 'test_open_id_001',
        nickname: '测试梦想家',
        avatar: null, // 使用默认文字头像
        gender: 1,
        isVip: true,
        vipExpireAt: new Date('2026-12-31'),
        luckyPoints: 500,
        consecutiveDays: 7,
        totalDreams: 15,
        totalTasks: 8,
        lastDreamDate: new Date()
    },
    {
        id: 'test-user-2',
        openId: 'test_open_id_002',
        nickname: '普通用户',
        avatar: null, // 使用默认文字头像
        gender: 2,
        isVip: false,
        luckyPoints: 120,
        consecutiveDays: 3,
        totalDreams: 5,
        totalTasks: 2,
        lastDreamDate: new Date()
    }
];

// 梦境内容模板
const dreamContents = [
    {
        content:
            '我梦见自己在一个美丽的花园里散步，周围开满了五颜六色的鲜花。阳光透过树叶洒下斑驳的光影，空气中弥漫着淡淡的花香。突然，我发现前方有一条通往未知的小路，我好奇地走了过去，看到了一个闪闪发光的湖泊。湖水清澈见底，倒映着蓝天白云。我在湖边坐下，感受到了前所未有的宁静与平和。',
        tags: ['自然', '愉悦', '探索'],
        emotion: 'happy',
        theme: '自然与宁静',
        interpretation:
            '这个梦境反映了你内心对平静生活的向往。花园象征着你的内心世界，五颜六色的鲜花代表生活的多姿多彩。通往未知的小路暗示你对新事物充满好奇，而清澈的湖泊则象征心灵的纯净。这是一个非常积极的梦境，预示着你即将进入一个平和安宁的生活阶段。',
        fortuneScore: 85
    },
    {
        content:
            '梦里我正在参加一场重要的考试，但是突然发现自己完全没有复习，试卷上的题目一个都不会做。我感到非常焦虑和恐慌，时间在一分一秒地流逝，而我却什么都写不出来。周围的同学都在奋笔疾书，只有我坐在那里束手无策。我想要离开考场，但发现门被锁住了，只能继续面对这个无法完成的考试。',
        tags: ['焦虑', '考试', '压力'],
        emotion: 'nervous',
        theme: '压力与焦虑',
        interpretation:
            '考试梦是最常见的压力梦之一。它反映了你在现实生活中面临的某种考验或挑战，可能是工作、学业或人际关系方面的压力。没有准备的感觉表明你对某些即将到来的事情感到缺乏信心。这个梦境提醒你需要做好充分准备，同时也要学会放松，不要给自己太大压力。',
        fortuneScore: 45
    },
    {
        content:
            '我梦见自己长出了翅膀，可以在天空中自由翱翔。我飞越了高山、大海和城市，看到了前所未见的美丽景色。风在耳边呼啸而过，但我感到无比自由和快乐。我可以随心所欲地改变飞行方向，体验着完全的自由感。最后我降落在一座高山之巅，俯瞰着整个世界，心中充满了力量和自信。',
        tags: ['飞行', '自由', '力量'],
        emotion: 'excited',
        theme: '自由与突破',
        interpretation:
            '飞行梦通常代表你渴望摆脱现实的束缚，追求自由和独立。长出翅膀象征着你内在力量的觉醒，自由翱翔则表明你有能力掌控自己的人生。这个梦境预示着你即将突破某些限制，在生活中取得重大进展。保持这种积极向上的心态，你会发现更多可能性。',
        fortuneScore: 92
    },
    {
        content:
            '梦中我回到了童年的老家，看到了已经去世的奶奶正在院子里晒太阳。她看到我时露出了慈祥的笑容，伸手摸了摸我的头。院子里的一切都和记忆中一模一样，那棵老槐树还在，井边的石头还是那么光滑。我和奶奶坐在一起聊天，她告诉我要好好照顾自己。醒来后我发现自己泪流满面，心中充满了温暖和思念。',
        tags: ['怀旧', '亲人', '温暖'],
        emotion: 'sad',
        theme: '回忆与思念',
        interpretation:
            '梦见已故的亲人通常是你内心深处的思念和回忆的体现。奶奶的慈祥笑容代表着爱和关怀永远不会消失。这个梦境是你潜意识在处理失去亲人的情感，同时也在寻求内心的安慰。奶奶让你好好照顾自己，这其实是你内心深处对自己的提醒和鼓励。',
        fortuneScore: 70
    },
    {
        content:
            '我梦见自己被困在一个巨大的迷宫里，四周都是高高的墙壁，找不到出口。我在迷宫中不停地奔跑，尝试各种路线，但总是走到死路。天色渐渐暗了下来，我感到越来越焦虑。就在我快要放弃的时候，突然看到远处有一道光，我朝着那道光跑去，终于找到了出口。走出迷宫的瞬间，我感到如释重负。',
        tags: ['迷宫', '困境', '突破'],
        emotion: 'nervous',
        theme: '困境与突破',
        interpretation:
            '迷宫梦象征着你在现实生活中遇到的困境或困惑。高墙代表你感受到的限制和障碍，找不到出口则反映了你对现状的无力感。但最终看到光明并找到出口，预示着问题终将得到解决。这个梦境鼓励你不要放弃，坚持下去就能看到希望。',
        fortuneScore: 55
    },
    {
        content:
            '梦里我在海边散步，海浪轻轻拍打着沙滩。突然，我看到海面上出现了一条巨大的彩虹桥，一直延伸到天边。我沿着彩虹桥走去，脚下是柔软的云朵。桥的尽头是一座美丽的云中城堡，里面住着许多友善的居民。他们热情地欢迎我，带我参观这个奇妙的世界。在这里，一切都是那么美好和梦幻。',
        tags: ['奇幻', '探险', '美好'],
        emotion: 'happy',
        theme: '梦幻与探索',
        interpretation:
            '彩虹桥和云中城堡代表你对美好事物的向往和追求。这个梦境充满了奇幻色彩，反映了你丰富的想象力和创造力。友善的居民象征着你内心渴望建立良好的人际关系。这是一个非常积极的梦境，预示着美好的机遇正在向你走来，要保持开放的心态去迎接。',
        fortuneScore: 88
    },
    {
        content:
            '我梦见自己变成了一棵大树，扎根在土地上。我能感受到阳光的温暖，雨水的滋润，还有风吹过枝叶的感觉。小鸟在我的枝头筑巢，松鼠在我的树干上跳跃。季节在变换，我看到春天的嫩芽，夏天的繁茂，秋天的落叶，冬天的雪花。虽然不能移动，但我感到与自然融为一体，内心无比平静和满足。',
        tags: ['自然', '成长', '平静'],
        emotion: 'calm',
        theme: '扎根与成长',
        interpretation:
            '变成树的梦境象征着你对稳定和归属感的渴望。扎根土地代表你想要在某个地方或某个领域建立稳固的基础。感受四季变换表明你正在经历人生的不同阶段，学会接受和适应变化。与自然融为一体的感觉预示着你即将找到内心的平衡和宁静。',
        fortuneScore: 78
    },
    {
        content:
            '梦中我在一个熙熙攘攘的市场里寻找什么东西，但我不知道自己在找什么。市场里人来人往，商品琳琅满目，各种声音混杂在一起。我从一个摊位走到另一个摊位，看到很多有趣的东西，但都不是我要找的。时间过得很快，市场快要关门了，我还是没有找到。我感到既失落又迷茫，不知道自己到底在寻找什么。',
        tags: ['寻找', '迷茫', '人群'],
        emotion: 'confused',
        theme: '寻找与迷茫',
        interpretation:
            '在市场寻找的梦境反映了你在现实生活中的某种缺失感。不知道在找什么表明你对自己的真正需求还不够清晰。人群和嘈杂的环境象征着外界的干扰和诱惑。这个梦境提醒你需要静下心来，思考自己真正想要的是什么，而不是被外界的声音所左右。',
        fortuneScore: 50
    }
];

// 任务模板
const taskTemplates = [
    { type: 'daily', content: '今天对着镜子微笑3次' },
    { type: 'daily', content: '给一个久未联系的朋友发条消息' },
    { type: 'daily', content: '整理房间的一个角落' },
    { type: 'daily', content: '学习一个新技能10分钟' },
    { type: 'weekly', content: '完成一次户外运动' },
    { type: 'weekly', content: '阅读一本书的一个章节' }
];

export async function seedTestData() {
    console.log('🌱 开始创建测试数据...\n');

    // 1. 创建测试用户
    console.log('👤 创建测试用户...');
    for (const userData of testUsers) {
        const user = await prisma.user.upsert({
            where: { id: userData.id },
            update: userData,
            create: userData
        });
        console.log(`  ✅ 创建用户: ${user.nickname} (${user.id})`);
    }

    // 2. 为第一个测试用户创建梦境数据（最近30天）
    console.log('\n💭 创建梦境数据...');
    const testUser = testUsers[0];
    const now = new Date();
    const createdDreams = [];

    for (let i = 0; i < 15; i++) {
        const dreamData = dreamContents[i % dreamContents.length];
        const daysAgo = Math.floor(i * 2); // 每隔2天记一个梦
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);

        const dream = await prisma.dream.create({
            data: {
                userId: testUser.id,
                content: dreamData.content,
                originalContent: dreamData.content,
                tags: JSON.stringify(dreamData.tags),
                emotion: dreamData.emotion,
                wordCount: dreamData.content.length,
                status: 'analyzed',
                isPublic: i % 3 === 0, // 每3个有1个是公开的
                viewCount: Math.floor(Math.random() * 50),
                likeCount: Math.floor(Math.random() * 20),
                createdAt,
                updatedAt: createdAt
            }
        });

        createdDreams.push(dream);
        console.log(`  ✅ 创建梦境 ${i + 1}: ${dream.id}`);

        // 创建原始版本
        await prisma.dreamVersion.create({
            data: {
                dreamId: dream.id,
                userId: testUser.id,
                type: 'original',
                content: dreamData.content,
                versionNumber: 1,
                isCurrent: true,
                createdAt
            }
        });

        // 为部分梦境创建润色版本
        if (i % 2 === 0) {
            await prisma.dreamVersion.create({
                data: {
                    dreamId: dream.id,
                    userId: testUser.id,
                    type: 'polished',
                    content: `【润色版】${dreamData.content}在这个梦境中，我体会到了深刻的情感和寓意。`,
                    polishedFrom: dream.id,
                    polishPrompt: '请以文学化的方式润色这段梦境描述',
                    aiModel: 'gpt-4',
                    tokensUsed: 150,
                    versionNumber: 2,
                    isCurrent: false,
                    createdAt: new Date(createdAt.getTime() + 3600000) // 1小时后
                }
            });
        }

        // 创建解析结果
        await prisma.analysis.create({
            data: {
                dreamId: dream.id,
                userId: testUser.id,
                status: 'completed',
                theme: dreamData.theme,
                interpretation: dreamData.interpretation,
                fortuneScore: dreamData.fortuneScore,
                fortuneTips: JSON.stringify(['保持积极乐观的心态', '注意休息和放松', '多与朋友交流', '相信自己的直觉']),
                aiModel: 'gpt-4',
                tokensUsed: 500,
                latency: 2000,
                createdAt,
                updatedAt: createdAt
            }
        });

        // 为每个梦境创建一个任务
        if (i < taskTemplates.length) {
            const task = taskTemplates[i];
            const expireAt = new Date(createdAt);
            expireAt.setDate(expireAt.getDate() + (task.type === 'daily' ? 1 : 7));

            const isCompleted = i < 8; // 前8个任务已完成
            await prisma.task.create({
                data: {
                    userId: testUser.id,
                    dreamId: dream.id,
                    type: task.type,
                    content: task.content,
                    rewardPoints: task.type === 'daily' ? 10 : 30,
                    status: isCompleted ? 'completed' : 'pending',
                    completedAt: isCompleted ? new Date(createdAt.getTime() + 86400000) : null,
                    expireAt,
                    createdAt
                }
            });
        }
    }

    // 3. 创建积分记录
    console.log('\n💰 创建积分记录...');
    const pointRecords = [
        { type: 'earn', amount: 50, source: 'signup', description: '注册奖励' },
        { type: 'earn', amount: 10, source: 'dream', description: '记录梦境' },
        { type: 'earn', amount: 10, source: 'dream', description: '记录梦境' },
        { type: 'earn', amount: 10, source: 'task', description: '完成任务' },
        { type: 'earn', amount: 20, source: 'achievement', description: '解锁成就' },
        { type: 'consume', amount: -50, source: 'reanalyze', description: '重新解析梦境' },
        { type: 'earn', amount: 10, source: 'task', description: '完成任务' },
        { type: 'earn', amount: 100, source: 'achievement', description: '解锁成就：连续打卡7天' }
    ];

    let balance = 0;
    for (const record of pointRecords) {
        balance += record.amount;
        await prisma.pointRecord.create({
            data: {
                userId: testUser.id,
                type: record.type as 'earn' | 'consume',
                amount: Math.abs(record.amount),
                balance,
                source: record.source,
                description: record.description
            }
        });
    }
    console.log(`  ✅ 创建了 ${pointRecords.length} 条积分记录`);

    // 4. 创建用户成就
    console.log('\n🏆 解锁用户成就...');
    const userAchievements = ['first_dream', 'dream_7', 'streak_3', 'streak_7'];
    for (const achievementId of userAchievements) {
        const achievement = await prisma.achievement.findUnique({
            where: { id: achievementId }
        });
        if (achievement) {
            await prisma.userAchievement.create({
                data: {
                    userId: testUser.id,
                    achievementId: achievement.id
                }
            });
            console.log(`  ✅ 解锁成就: ${achievement.name}`);
        }
    }

    // 5. 创建探索浏览记录（为公开的梦境）
    console.log('\n🔍 创建探索浏览记录...');
    const publicDreams = createdDreams.filter((_, i) => i % 3 === 0);
    for (const dream of publicDreams.slice(0, 3)) {
        await prisma.exploreView.create({
            data: {
                viewerId: testUsers[1].id,
                dreamId: dream.id,
                authorId: testUser.id,
                viewDuration: Math.floor(Math.random() * 120) + 30,
                isLiked: Math.random() > 0.5,
                source: 'random'
            }
        });
    }
    console.log(`  ✅ 创建了 ${publicDreams.slice(0, 3).length} 条浏览记录`);

    // 6. 创建润色配额记录
    console.log('\n✍️  创建润色配额记录...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.polishQuota.create({
        data: {
            userId: testUser.id,
            date: today,
            total: 3,
            used: 1,
            remaining: 2
        }
    });
    console.log('  ✅ 创建今日润色配额记录');

    // 7. 创建订单记录
    console.log('\n💳 创建订单记录...');
    const order = await prisma.order.create({
        data: {
            userId: testUser.id,
            orderNo: `ORDER${Date.now()}`,
            type: 'vip',
            productId: 'monthly',
            productName: '月度会员',
            amount: 19.9,
            payAmount: 9.9,
            status: 'paid',
            payType: 'wechat',
            transactionId: `WX${Date.now()}`,
            paidAt: new Date(),
            expireAt: new Date(Date.now() + 1800000) // 30分钟后过期
        }
    });
    console.log(`  ✅ 创建订单: ${order.orderNo}`);

    console.log('\n🎉 测试数据创建完成！');
    console.log('\n📊 数据统计:');
    console.log(`  - 用户: ${testUsers.length} 个`);
    console.log(`  - 梦境: ${createdDreams.length} 个`);
    console.log(`  - 任务: ${Math.min(createdDreams.length, taskTemplates.length)} 个`);
    console.log(`  - 积分记录: ${pointRecords.length} 条`);
    console.log(`  - 成就: ${userAchievements.length} 个`);
    console.log(`  - 探索记录: ${publicDreams.slice(0, 3).length} 条`);
    console.log('\n测试用户信息:');
    console.log(`  - 用户名: ${testUser.nickname}`);
    console.log(`  - OpenID: ${testUser.openId}`);
    console.log(`  - 幸运值: ${testUser.luckyPoints}`);
    console.log(`  - 连续打卡: ${testUser.consecutiveDays} 天`);
}

// 如果直接运行此文件
if (require.main === module) {
    seedTestData()
        .catch((e) => {
            console.error('❌ 创建测试数据失败:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
