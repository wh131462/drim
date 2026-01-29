import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AchievementService, AchievementConditionType } from '../achievement/achievement.service';
import { GetPublicDreamsDto, ViewDreamDto, GetUserPublicDreamsDto } from './dto';

@Injectable()
export class ExploreService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => AchievementService))
        private readonly achievementService: AchievementService
    ) {}

    /**
     * 获取所有可用标签
     */
    async getTags() {
        // 获取所有公开梦境的标签
        const dreams = await this.prisma.dream.findMany({
            where: {
                isPublic: true,
                status: 'analyzed',
                deletedAt: null,
                tags: {
                    not: null
                }
            },
            select: {
                tags: true
            }
        });

        // 统计所有标签及其出现次数
        const tagCount = new Map<string, number>();

        for (const dream of dreams) {
            if (!dream.tags) continue;

            try {
                const tags = JSON.parse(dream.tags);
                if (Array.isArray(tags)) {
                    tags.forEach((tag) => {
                        if (tag) {
                            tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
                        }
                    });
                }
            } catch (error) {
                // 跳过解析失败的标签
                continue;
            }
        }

        // 转换为数组并按出现次数排序
        const tagList = Array.from(tagCount.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);

        return {
            tags: tagList,
            total: tagList.length
        };
    }

    /**
     * 获取公开梦境列表
     */
    async getPublicDreams(userId: string, query: GetPublicDreamsDto) {
        const { keyword, tag, emotion, page = 1, pageSize = 10 } = query;
        const skip = (page - 1) * pageSize;

        // 构建查询条件
        const where: any = {
            isPublic: true,
            status: 'analyzed',
            deletedAt: null
        };

        if (keyword) {
            where.content = {
                contains: keyword
            };
        }

        if (tag) {
            where.tags = {
                contains: tag
            };
        }

        if (emotion) {
            where.emotion = emotion;
        }

        // 查询总数和列表
        const [total, dreams] = await Promise.all([
            this.prisma.dream.count({ where }),
            this.prisma.dream.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    content: true,
                    tags: true,
                    emotion: true,
                    viewCount: true,
                    likeCount: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            nickname: true,
                            avatar: true
                        }
                    },
                    exploreViews: {
                        where: {
                            viewerId: userId
                        },
                        select: {
                            isLiked: true
                        }
                    }
                }
            })
        ]);

        // 格式化返回数据
        const list = dreams.map((dream: any) => ({
            id: dream.id,
            content: dream.content.substring(0, 200), // 列表只显示前200字
            tags: dream.tags ? JSON.parse(dream.tags) : [],
            emotion: dream.emotion,
            viewCount: dream.viewCount,
            likeCount: dream.likeCount,
            isLiked: dream.exploreViews[0]?.isLiked || false,
            createdAt: dream.createdAt,
            author: {
                id: dream.user.id,
                nickname: dream.user.nickname,
                avatar: dream.user.avatar
            }
        }));

        return {
            list,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    }

    /**
     * 随机获取一个公开梦境
     */
    async getRandomDream(userId: string) {
        // 获取公开梦境总数
        const total = await this.prisma.dream.count({
            where: {
                isPublic: true,
                status: 'analyzed',
                deletedAt: null
            }
        });

        if (total === 0) {
            throw new NotFoundException('暂无公开梦境');
        }

        // 随机跳过
        const skip = Math.floor(Math.random() * total);

        const dream = await this.prisma.dream.findFirst({
            where: {
                isPublic: true,
                status: 'analyzed',
                deletedAt: null
            },
            skip,
            select: {
                id: true,
                content: true,
                tags: true,
                emotion: true,
                viewCount: true,
                likeCount: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        avatar: true
                    }
                },
                exploreViews: {
                    where: {
                        viewerId: userId
                    },
                    select: {
                        isLiked: true
                    }
                }
            }
        });

        if (!dream) {
            throw new NotFoundException('暂无公开梦境');
        }

        return {
            id: dream.id,
            content: dream.content,
            tags: dream.tags ? JSON.parse(dream.tags) : [],
            emotion: dream.emotion,
            viewCount: dream.viewCount,
            likeCount: dream.likeCount,
            isLiked: dream.exploreViews[0]?.isLiked || false,
            createdAt: dream.createdAt,
            author: {
                id: dream.user.id,
                nickname: dream.user.nickname,
                avatar: dream.user.avatar
            }
        };
    }

    // 浏览奖励配置
    private readonly EXPLORE_VIEW_REWARD = 1; // 每次浏览奖励1积分
    private readonly EXPLORE_VIEW_DAILY_LIMIT = 10; // 每日最多奖励10次

    /**
     * 查看梦境详情（记录浏览）
     */
    async viewDream(userId: string, dreamId: string, query: ViewDreamDto) {
        const { source = 'filter', viewDuration } = query;

        // 获取梦境详情
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId },
            select: {
                id: true,
                userId: true,
                content: true,
                tags: true,
                emotion: true,
                viewCount: true,
                likeCount: true,
                isPublic: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        avatar: true
                    }
                },
                analysis: {
                    select: {
                        theme: true,
                        interpretation: true,
                        fortuneScore: true,
                        fortuneTips: true
                    }
                },
                exploreViews: {
                    where: {
                        viewerId: userId
                    },
                    select: {
                        isLiked: true
                    }
                }
            }
        });

        if (!dream || !dream.isPublic) {
            throw new NotFoundException('梦境不存在或未公开');
        }

        let viewReward = 0;

        // 记录浏览（如果不是作者本人）
        if (dream.userId !== userId) {
            await Promise.all([
                // 创建浏览记录
                this.prisma.exploreView.create({
                    data: {
                        viewerId: userId,
                        dreamId,
                        authorId: dream.userId,
                        viewDuration,
                        source
                    }
                }),
                // 更新浏览次数
                this.prisma.dream.update({
                    where: { id: dreamId },
                    data: {
                        viewCount: {
                            increment: 1
                        }
                    }
                })
            ]);

            // 检查今日浏览奖励次数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayViewRewardCount = await this.prisma.pointRecord.count({
                where: {
                    userId,
                    source: 'explore_view',
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            });

            // 如果未达到每日上限，发放浏览奖励
            if (todayViewRewardCount < this.EXPLORE_VIEW_DAILY_LIMIT) {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { luckyPoints: true }
                });

                if (user) {
                    const newBalance = user.luckyPoints + this.EXPLORE_VIEW_REWARD;
                    await this.prisma.$transaction([
                        this.prisma.user.update({
                            where: { id: userId },
                            data: { luckyPoints: newBalance }
                        }),
                        this.prisma.pointRecord.create({
                            data: {
                                userId,
                                type: 'earn',
                                amount: this.EXPLORE_VIEW_REWARD,
                                balance: newBalance,
                                source: 'explore_view',
                                sourceId: dreamId,
                                description: `浏览梦境 +${this.EXPLORE_VIEW_REWARD}`
                            }
                        })
                    ]);
                    viewReward = this.EXPLORE_VIEW_REWARD;
                }
            }

            // 异步检查探索浏览相关成就
            this.achievementService
                .checkAndUnlockAchievements(userId, [AchievementConditionType.EXPLORE_VIEW_COUNT])
                .catch((err) => console.error('检查探索成就失败:', err));
        }

        return {
            id: dream.id,
            content: dream.content,
            tags: dream.tags ? JSON.parse(dream.tags) : [],
            emotion: dream.emotion,
            viewCount: dream.viewCount + (dream.userId !== userId ? 1 : 0),
            likeCount: dream.likeCount,
            isLiked: dream.exploreViews[0]?.isLiked || false,
            createdAt: dream.createdAt,
            author: {
                id: dream.user.id,
                nickname: dream.user.nickname,
                avatar: dream.user.avatar
            },
            analysis: dream.analysis
                ? {
                      theme: dream.analysis.theme,
                      interpretation: dream.analysis.interpretation,
                      fortuneScore: dream.analysis.fortuneScore,
                      fortuneTips: dream.analysis.fortuneTips ? JSON.parse(dream.analysis.fortuneTips) : null
                  }
                : null,
            rewards: viewReward > 0 ? { viewReward } : null
        };
    }

    /**
     * 点赞/取消点赞梦境
     */
    async toggleLike(userId: string, dreamId: string) {
        // 检查梦境是否存在且公开
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId },
            select: {
                id: true,
                userId: true,
                isPublic: true
            }
        });

        if (!dream || !dream.isPublic) {
            throw new NotFoundException('梦境不存在或未公开');
        }

        // 查找浏览记录
        const existingView = await this.prisma.exploreView.findFirst({
            where: {
                viewerId: userId,
                dreamId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        let isLiked: boolean;

        if (existingView) {
            // 切换点赞状态
            isLiked = !existingView.isLiked;
            await this.prisma.exploreView.update({
                where: { id: existingView.id },
                data: { isLiked }
            });
        } else {
            // 创建新的浏览记录并点赞
            isLiked = true;
            await this.prisma.exploreView.create({
                data: {
                    viewerId: userId,
                    dreamId,
                    authorId: dream.userId,
                    isLiked: true,
                    source: 'filter'
                }
            });
        }

        // 更新点赞数（统计每个用户最新的点赞状态）
        // 使用子查询统计每个用户的最新记录中点赞的数量
        const result = await this.prisma.$queryRaw<[{ likeCount: bigint }]>`
      SELECT COUNT(DISTINCT ev.viewer_id) as likeCount
      FROM explore_views ev
      INNER JOIN (
        SELECT viewer_id, MAX(created_at) as latest_created_at
        FROM explore_views
        WHERE dream_id = ${dreamId}
        GROUP BY viewer_id
      ) latest ON ev.viewer_id = latest.viewer_id
        AND ev.created_at = latest.latest_created_at
        AND ev.dream_id = ${dreamId}
      WHERE ev.is_liked = 1
    `;

        const likeCount = Number(result[0]?.likeCount || 0);

        // 更新梦境的点赞数
        await this.prisma.dream.update({
            where: { id: dreamId },
            data: { likeCount }
        });

        return {
            isLiked,
            likeCount
        };
    }

    /**
     * 获取用户公开主页信息
     */
    async getUserProfile(currentUserId: string, targetUserId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                nickname: true,
                avatar: true,
                isVip: true,
                consecutiveDays: true,
                createdAt: true,
                preference: {
                    select: { allowProfileView: true }
                }
            }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 隐私检查：非本人且关闭了主页查看权限
        const allowProfileView = user.preference?.allowProfileView ?? true;
        if (!allowProfileView && targetUserId !== currentUserId) {
            return {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar,
                isPrivate: true
            };
        }

        // 查询公开梦境数量
        const publicDreamCount = await this.prisma.dream.count({
            where: {
                userId: targetUserId,
                isPublic: true,
                status: 'analyzed',
                deletedAt: null
            }
        });

        // 查询收到的总点赞数
        const totalLikes = await this.prisma.dream.aggregate({
            where: {
                userId: targetUserId,
                isPublic: true,
                deletedAt: null
            },
            _sum: { likeCount: true }
        });

        return {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            isVip: user.isVip,
            consecutiveDays: user.consecutiveDays,
            publicDreamCount,
            totalLikes: totalLikes._sum.likeCount || 0,
            createdAt: user.createdAt,
            isPrivate: false
        };
    }

    /**
     * 获取用户公开梦境列表
     */
    async getUserPublicDreams(currentUserId: string, targetUserId: string, query: GetUserPublicDreamsDto) {
        const { page = 1, pageSize = 10 } = query;
        const skip = (page - 1) * pageSize;

        // 隐私检查
        if (targetUserId !== currentUserId) {
            const preference = await this.prisma.userPreference.findUnique({
                where: { userId: targetUserId }
            });
            const allowProfileView = preference?.allowProfileView ?? true;
            if (!allowProfileView) {
                return { list: [], total: 0, page, pageSize, totalPages: 0 };
            }
        }

        const where = {
            userId: targetUserId,
            isPublic: true,
            status: 'analyzed' as const,
            deletedAt: null
        };

        const [total, dreams] = await Promise.all([
            this.prisma.dream.count({ where }),
            this.prisma.dream.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    content: true,
                    tags: true,
                    emotion: true,
                    viewCount: true,
                    likeCount: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            nickname: true,
                            avatar: true
                        }
                    },
                    exploreViews: {
                        where: { viewerId: currentUserId },
                        select: { isLiked: true }
                    }
                }
            })
        ]);

        const list = dreams.map((dream: any) => ({
            id: dream.id,
            content: dream.content.substring(0, 200),
            tags: dream.tags ? JSON.parse(dream.tags) : [],
            emotion: dream.emotion,
            viewCount: dream.viewCount,
            likeCount: dream.likeCount,
            isLiked: dream.exploreViews[0]?.isLiked || false,
            createdAt: dream.createdAt,
            author: {
                id: dream.user.id,
                nickname: dream.user.nickname,
                avatar: dream.user.avatar
            }
        }));

        return {
            list,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    }
}
