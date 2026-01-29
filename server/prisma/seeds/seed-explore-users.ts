/**
 * 创建探索广场测试用户和公开梦境
 * 用于测试"查看他人主页"功能
 *
 * 运行方式: cd server && npx ts-node -r tsconfig-paths/register prisma/seeds/seed-explore-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exploreUsers = [
    {
        id: 'explore-user-luna',
        openId: 'explore_open_id_luna',
        nickname: '月光旅人',
        avatar: null,
        gender: 2,
        isVip: true,
        vipExpireAt: new Date('2027-06-30'),
        luckyPoints: 860,
        consecutiveDays: 15,
        totalDreams: 8,
        totalTasks: 12,
        lastDreamDate: new Date()
    },
    {
        id: 'explore-user-star',
        openId: 'explore_open_id_star',
        nickname: '星辰猎手',
        avatar: null,
        gender: 1,
        isVip: false,
        luckyPoints: 320,
        consecutiveDays: 5,
        totalDreams: 6,
        totalTasks: 4,
        lastDreamDate: new Date()
    },
    {
        id: 'explore-user-cloud',
        openId: 'explore_open_id_cloud',
        nickname: '云端漫步者',
        avatar: null,
        gender: 0,
        isVip: false,
        luckyPoints: 150,
        consecutiveDays: 3,
        totalDreams: 4,
        totalTasks: 2,
        lastDreamDate: new Date()
    }
];

const userDreams: Record<
    string,
    Array<{
        content: string;
        tags: string[];
        emotion: string;
        theme: string;
        interpretation: string;
        fortuneScore: number;
        isPublic: boolean;
    }>
> = {
    'explore-user-luna': [
        {
            content:
                '我站在一座巨大的天文台里，透过望远镜看到了一颗从未被发现的星球。星球表面覆盖着银色的沙漠，空中飘浮着水晶般透明的云朵。我走出天文台，发现自己已经身处那颗星球上了。脚下的银沙发出轻柔的光芒，每走一步都会留下淡蓝色的脚印。远处有一座由光线构成的城市，里面传来悠扬的音乐。',
            tags: ['探索', '奇幻', '星空'],
            emotion: 'excited',
            theme: '星际探索之旅',
            interpretation:
                '天文台象征你对未知世界的好奇和探索欲。发现新星球代表你即将在生活中遇到新的机会或领域。银色沙漠和水晶云朵反映了你丰富的想象力。光之城市预示着你心中有一个理想的目标正在召唤你。',
            fortuneScore: 90,
            isPublic: true
        },
        {
            content:
                '梦里我变成了一条巨大的鲸鱼，在深蓝色的海洋中缓缓游动。海底有着无数发光的珊瑚和海藻，鱼群围绕着我嬉戏。我能听到其他鲸鱼远处的歌声，那旋律带着一种古老而深邃的智慧。我浮上水面呼吸时，看到满天星斗倒映在平静的海面上，天空和海洋融为一体。',
            tags: ['海洋', '自由', '平静'],
            emotion: 'calm',
            theme: '深海鲸歌',
            interpretation:
                '变成鲸鱼象征你渴望更大的生命格局和深层的自我认知。深海代表你的潜意识世界。鲸鱼的歌声代表内心深处的智慧正在苏醒。天空和海洋融合暗示你正在寻找精神与现实的平衡。',
            fortuneScore: 82,
            isPublic: true
        },
        {
            content:
                '我梦见自己在一个巨大的图书馆里，书架一直延伸到看不见的高处。每本书打开后都是一个完整的世界，我翻开一本关于春天的书，立刻被温暖的风和花香包围。我在不同的书中穿梭，体验了沙漠的烈日、雪山的寒冷、热带雨林的潮湿。最后我找到了一本空白的书，封面上写着我的名字。',
            tags: ['知识', '探索', '成长'],
            emotion: 'happy',
            theme: '书中世界',
            interpretation:
                '图书馆代表你积累的知识和经验。每本书是一个世界，说明你善于从不同角度看问题。空白的书代表你的未来尚未书写，充满无限可能。这是一个极其积极的信号。',
            fortuneScore: 88,
            isPublic: true
        },
        {
            content:
                '我在一座古老的寺庙里打坐冥想，四周飘散着檀香的味道。突然我感到自己的身体变得透明，可以看到体内流动的光。光从心脏出发，沿着经脉扩散到全身。当光芒充满全身的那一刻，我感到无比的平静和清明，所有的烦恼都消失了。',
            tags: ['冥想', '平静', '觉醒'],
            emotion: 'calm',
            theme: '内心觉醒',
            interpretation:
                '寺庙代表你内心寻求精神寄托的渴望。身体变透明象征自我认知的深化。光的流动代表生命能量的畅通。这个梦提示你近期适合静心思考，重新审视人生方向。',
            fortuneScore: 75,
            isPublic: true
        },
        {
            content:
                '梦里我收到一封来自十年后自己的信。信中描述了未来的生活：住在海边的小屋里，养了一只金色的猫，每天早上在沙滩上跑步，下午写自己喜欢的故事。信的最后写着："你现在做的每一个选择都是正确的，不要害怕。"',
            tags: ['未来', '温暖', '自信'],
            emotion: 'happy',
            theme: '来自未来的信',
            interpretation:
                '这封信是你潜意识对未来的美好期许。海边小屋代表你对简单生活的向往，金色猫咪象征温暖和陪伴。信中的鼓励实际上是你内心深处对自己的肯定和支持。',
            fortuneScore: 93,
            isPublic: true
        },
        {
            content:
                '我梦见自己在暴风雨中驾驶一艘帆船。海浪高耸，闪电劈落在不远处。我紧握船舵，努力保持方向。虽然恐惧包围着我，但我知道只要不松手就不会沉没。暴风雨过后，海面出现了最壮丽的日出。',
            tags: ['挑战', '勇气', '坚持'],
            emotion: 'nervous',
            theme: '风暴中的航行',
            interpretation:
                '暴风雨象征你正在经历的困难和挑战。紧握船舵代表你面对困境时的坚持和勇气。日出预示困难终将过去，光明就在前方。这个梦提醒你当下的坚持是有价值的。',
            fortuneScore: 68,
            isPublic: false
        },
        {
            content:
                '我在一个满是萤火虫的森林里奔跑，身后有某种未知的东西在追赶我。但奇怪的是我并不害怕，因为萤火虫会自动聚集在我身边形成保护层。跑着跑着我发现追赶我的其实是我自己的影子，它只是想和我合为一体。',
            tags: ['自我', '成长', '面对'],
            emotion: 'calm',
            theme: '与影子和解',
            interpretation:
                '被追赶的梦通常代表你在逃避某些事情。追赶你的是自己的影子，说明你在逃避的其实是自我的某个面向。萤火虫的保护说明你拥有足够的力量去面对。与影子合一意味着自我接纳。',
            fortuneScore: 77,
            isPublic: true
        },
        {
            content:
                '梦中我坐在一列穿越时空的火车上，窗外的风景从春夏秋冬快速切换。每一站都有不同年龄的我上下车。小时候的我带着棒棒糖笑嘻嘻地上车，老年的我拄着拐杖慢慢走下站台。我看着这些不同版本的自己，心中涌起了复杂的情感。',
            tags: ['时间', '回忆', '人生'],
            emotion: 'sad',
            theme: '时光列车',
            interpretation:
                '时空列车象征你对人生旅程的思考。不同年龄的自己代表人生的各个阶段。这个梦反映了你对时间流逝的感慨，同时也是一种对完整人生的审视和接纳。珍惜当下，每个阶段都有其独特意义。',
            fortuneScore: 72,
            isPublic: true
        }
    ],
    'explore-user-star': [
        {
            content:
                '我梦见自己是一位剑客，行走在荒漠的古道上。风沙吹打着我的斗篷，远处有一座被遗弃的古城。我走进城中，发现城墙上刻满了古老的文字，诉说着一个关于勇气和牺牲的故事。我拔出剑，剑身开始散发温暖的光芒，照亮了整座死寂的城池。',
            tags: ['冒险', '力量', '探索'],
            emotion: 'excited',
            theme: '荒漠剑客',
            interpretation:
                '剑客形象代表你内心对冒险和独立的渴望。荒漠古道象征你正在经历的孤独而充满挑战的阶段。剑的光芒代表你拥有改变现状的力量。这个梦鼓励你勇敢前行，你的付出终将被看见。',
            fortuneScore: 85,
            isPublic: true
        },
        {
            content:
                '梦里我在一个巨大的棋盘上下棋，对手看不见面孔。每一颗棋子都代表一个真实的人，包括我的家人和朋友。我每走一步都要深思熟虑，因为任何错误的移动都会让棋子消失。最后我发现赢得比赛的唯一方法不是击败对手，而是保护好每一颗棋子。',
            tags: ['策略', '责任', '智慧'],
            emotion: 'nervous',
            theme: '命运棋局',
            interpretation:
                '棋盘象征你对生活的掌控感。看不见面孔的对手代表命运中不可控的因素。棋子代表你珍视的人和关系。这个梦揭示了你内心对身边人的保护欲和责任感，也提醒你每个决定都应该谨慎考虑。',
            fortuneScore: 65,
            isPublic: true
        },
        {
            content:
                '我在梦中成为了一名宇航员，第一次踏上月球表面。月球的静谧让我震撼，回头望去，蓝色的地球悬挂在漆黑的宇宙中，美得让人想哭。我在月球上插上了一面旗帜，上面不是任何国家的标志，而是一个笑脸。',
            tags: ['太空', '梦想', '美好'],
            emotion: 'happy',
            theme: '月球漫步',
            interpretation:
                '登月代表你对远大目标的追求。月球的静谧象征你需要的独处空间。回望地球代表你对日常生活新的理解和珍惜。笑脸旗帜暗示你最看重的不是成就本身，而是过程中的快乐。',
            fortuneScore: 91,
            isPublic: true
        },
        {
            content:
                '梦见我在一间日式居酒屋里独自喝酒。老板是一位白发苍苍的老爷爷，他给我讲了很多年轻时的故事。他说最后悔的事是年轻时没有对喜欢的人表白。我喝着酒听着故事，感觉时间都慢了下来。离开时老爷爷对我说了一句话：趁现在。',
            tags: ['感悟', '时间', '勇气'],
            emotion: 'calm',
            theme: '居酒屋物语',
            interpretation:
                '居酒屋代表你需要一个倾诉和放松的空间。白发老人是你内心智慧的化身。他的故事是你潜意识在提醒自己不要留下遗憾。"趁现在"三个字是对你最直接的忠告——把握当下。',
            fortuneScore: 79,
            isPublic: true
        },
        {
            content:
                '我在一座火山口边缘行走，脚下的岩石灼热。岩浆在下面翻滚，热浪不断涌上来。我知道这很危险，但内心有一种声音告诉我必须到达火山的另一边。走到一半时，火山突然喷发，但岩浆神奇地绕开了我。',
            tags: ['挑战', '勇气', '幸运'],
            emotion: 'nervous',
            theme: '火山之路',
            interpretation:
                '火山象征你生活中潜伏的危机或压力。在边缘行走说明你正处于一个关键时期。岩浆绕开你代表你有化险为夷的运气。这个梦预示着虽然前方有风险，但你能安全度过。',
            fortuneScore: 60,
            isPublic: true
        },
        {
            content:
                '梦中我在雨天的咖啡馆里，窗外是模糊的城市街景。我正在写一封信，但不知道要寄给谁。咖啡慢慢凉了，雨也慢慢停了。我把信折好放进口袋，走出咖啡馆时踩到了一个水洼，倒影里看到了一张陌生又熟悉的脸。',
            tags: ['孤独', '迷茫', '寻找'],
            emotion: 'sad',
            theme: '雨天的信',
            interpretation:
                '雨天的咖啡馆象征你当下的情感状态——有些落寞但不绝望。写信不知寄给谁代表你有话想说却找不到倾诉对象。水洼中的脸可能是你渴望遇见的某个人，也可能是你尚未认识的自己。',
            fortuneScore: 52,
            isPublic: true
        }
    ],
    'explore-user-cloud': [
        {
            content:
                '我在梦中飘浮在云层之上，脚下是一望无际的白色棉花糖般的云海。太阳刚刚升起，把云朵染成了粉红色和金色。我可以像走路一样在云上漫步，每一步都轻盈无比。远处有一道彩虹横跨天际，我朝着彩虹的方向走去，发现那其实是一座通往天空之城的桥。',
            tags: ['飞行', '自由', '梦幻'],
            emotion: 'happy',
            theme: '云端漫步',
            interpretation:
                '云上漫步象征你对自由和超脱的追求。粉金色的日出代表新的开始和希望。彩虹桥是连接现实与理想的通道。这个梦暗示你正处于一个充满希望的转折点。',
            fortuneScore: 87,
            isPublic: true
        },
        {
            content:
                '梦见我家里的猫突然开口说话了，它用一种很正经的语气跟我说："你最近是不是忘记了什么很重要的事？"我想了半天也想不起来。猫叹了口气说："算了，我帮你记着呢。"然后它又变回了普通的样子，跳到阳台上晒太阳去了。',
            tags: ['动物', '温暖', '日常'],
            emotion: 'happy',
            theme: '会说话的猫',
            interpretation:
                '猫代表你生活中一种自在和独立的存在。它开口说话暗示你的直觉在试图提醒你注意某件事。猫"帮你记着"说明你的潜意识比你想象的更加敏锐。不要忽视内心的感觉。',
            fortuneScore: 76,
            isPublic: true
        },
        {
            content:
                '我梦见自己在一条没有尽头的走廊里行走，两边的墙壁上挂满了画框，但画框里不是画，而是不同人生阶段的我的样子。五岁的我在骑自行车，十五岁的我在考试中奋笔疾书，二十岁的我站在大学门口。越往前走，画框里的场景越模糊，直到变成一片空白。',
            tags: ['回忆', '成长', '迷茫'],
            emotion: 'confused',
            theme: '记忆长廊',
            interpretation:
                '走廊代表你的人生道路。画框是你对不同人生阶段的记忆和审视。后面越来越模糊代表你对未来的不确定感。空白画框不是结束，而是等待你去填充的未来。',
            fortuneScore: 58,
            isPublic: true
        },
        {
            content:
                '我在一个热闹的美食夜市里闲逛，摊位上的食物都是小时候吃过的味道。糖葫芦、烤红薯、棉花糖……每一种都唤起了童年的记忆。我买了一串糖葫芦，咬下去的那一刻，发现自己真的回到了小时候，妈妈正牵着我的手走在同样的夜市上。',
            tags: ['怀旧', '温暖', '亲人'],
            emotion: 'happy',
            theme: '童年夜市',
            interpretation:
                '夜市和童年食物代表你内心最温暖的记忆。时光回溯说明你最近可能特别思念家人或过去简单快乐的时光。妈妈的出现代表你渴望被关爱和保护的情感需求。偶尔允许自己沉浸在温暖的回忆中是好的。',
            fortuneScore: 80,
            isPublic: true
        }
    ]
};

async function seedExploreUsers() {
    console.log('🌱 开始创建探索广场测试用户...\n');

    for (const userData of exploreUsers) {
        // 创建用户
        const user = await prisma.user.upsert({
            where: { id: userData.id },
            update: userData,
            create: userData
        });
        console.log(`👤 创建用户: ${user.nickname} (${user.id})`);

        // 创建用户偏好
        await prisma.userPreference.upsert({
            where: { userId: user.id },
            update: { allowProfileView: true, defaultDreamPublic: true },
            create: {
                userId: user.id,
                allowProfileView: true,
                defaultDreamPublic: true
            }
        });

        // 创建梦境
        const dreams = userDreams[userData.id] || [];
        const now = new Date();

        for (let i = 0; i < dreams.length; i++) {
            const dreamData = dreams[i];
            const createdAt = new Date(now);
            createdAt.setDate(createdAt.getDate() - i * 2);
            createdAt.setHours(Math.floor(Math.random() * 10) + 6); // 6-16点

            const dream = await prisma.dream.create({
                data: {
                    userId: userData.id,
                    content: dreamData.content,
                    originalContent: dreamData.content,
                    tags: JSON.stringify(dreamData.tags),
                    emotion: dreamData.emotion,
                    wordCount: dreamData.content.length,
                    status: 'analyzed',
                    isPublic: dreamData.isPublic,
                    viewCount: Math.floor(Math.random() * 100) + 5,
                    likeCount: Math.floor(Math.random() * 30) + 1,
                    createdAt,
                    updatedAt: createdAt
                }
            });

            // 创建原始版本
            await prisma.dreamVersion.create({
                data: {
                    dreamId: dream.id,
                    userId: userData.id,
                    type: 'original',
                    content: dreamData.content,
                    versionNumber: 1,
                    isCurrent: true,
                    createdAt
                }
            });

            // 创建解析
            await prisma.analysis.create({
                data: {
                    dreamId: dream.id,
                    userId: userData.id,
                    status: 'completed',
                    theme: dreamData.theme,
                    interpretation: dreamData.interpretation,
                    fortuneScore: dreamData.fortuneScore,
                    fortuneTips: JSON.stringify([
                        '保持积极乐观的心态',
                        '注意休息和放松',
                        '多与朋友交流',
                        '相信自己的直觉'
                    ]),
                    aiModel: 'gpt-4',
                    tokensUsed: 500,
                    latency: 2000,
                    createdAt,
                    updatedAt: createdAt
                }
            });

            const publicLabel = dreamData.isPublic ? '🌐 公开' : '🔒 私密';
            console.log(`  💭 梦境 ${i + 1}: ${dreamData.theme} (${publicLabel})`);
        }
    }

    console.log('\n🎉 探索广场测试数据创建完成！');
    console.log('\n📊 数据统计:');
    console.log(`  - 用户: ${exploreUsers.length} 个`);
    for (const user of exploreUsers) {
        const dreams = userDreams[user.id] || [];
        const publicCount = dreams.filter((d) => d.isPublic).length;
        console.log(`  - ${user.nickname}: ${dreams.length} 个梦境 (${publicCount} 个公开)`);
    }
}

seedExploreUsers()
    .catch((e) => {
        console.error('❌ 创建失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
