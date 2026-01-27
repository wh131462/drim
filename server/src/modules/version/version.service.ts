import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SwitchVersionDto } from './dto/switch-version.dto';

@Injectable()
export class VersionService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 获取梦境的所有版本列表
     */
    async getVersions(dreamId: string, userId: string) {
        // 验证梦境是否存在且属于该用户
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId }
        });

        if (!dream) {
            throw new NotFoundException({
                code: 40401,
                message: '梦境不存在'
            });
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException({
                code: 40301,
                message: '无权访问该梦境版本'
            });
        }

        // 获取所有版本，按创建时间倒序排列
        const versions = await this.prisma.dreamVersion.findMany({
            where: { dreamId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                content: true,
                polishedFrom: true,
                versionNumber: true,
                isCurrent: true,
                createdAt: true
            }
        });

        // 计算统计信息
        const stats = {
            total: versions.length,
            original: versions.filter((v) => v.type === 'original').length,
            polished: versions.filter((v) => v.type === 'polished').length
        };

        return {
            dreamId,
            stats,
            versions: versions.map((v) => ({
                versionId: v.id,
                dreamId,
                type: v.type,
                content: v.content,
                polishedFrom: v.polishedFrom,
                versionNumber: v.versionNumber,
                isCurrent: v.isCurrent,
                createdAt: v.createdAt.toISOString()
            }))
        };
    }

    /**
     * 切换到指定版本
     */
    async switchVersion(dreamId: string, userId: string, dto: SwitchVersionDto) {
        const { versionId } = dto;

        // 验证梦境是否存在且属于该用户
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId }
        });

        if (!dream) {
            throw new NotFoundException({
                code: 40401,
                message: '梦境不存在'
            });
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException({
                code: 40301,
                message: '无权操作该梦境'
            });
        }

        // 验证版本是否存在
        const targetVersion = await this.prisma.dreamVersion.findFirst({
            where: {
                id: versionId,
                dreamId
            }
        });

        if (!targetVersion) {
            throw new NotFoundException({
                code: 40402,
                message: '版本不存在'
            });
        }

        // 如果已经是当前版本，直接返回
        if (targetVersion.isCurrent) {
            return {
                message: '该版本已是当前版本',
                currentVersion: {
                    versionId: targetVersion.id,
                    versionNumber: targetVersion.versionNumber,
                    type: targetVersion.type
                }
            };
        }

        // 使用事务切换版本
        await this.prisma.$transaction(async (tx) => {
            // 1. 将所有版本的 isCurrent 设为 false
            await tx.dreamVersion.updateMany({
                where: { dreamId },
                data: { isCurrent: false }
            });

            // 2. 将目标版本设为当前版本
            await tx.dreamVersion.update({
                where: { id: versionId },
                data: { isCurrent: true }
            });

            // 3. 更新梦境的当前内容和版本ID
            await tx.dream.update({
                where: { id: dreamId },
                data: {
                    content: targetVersion.content,
                    currentVersionId: versionId
                }
            });
        });

        return {
            message: '版本切换成功',
            currentVersion: {
                versionId: targetVersion.id,
                versionNumber: targetVersion.versionNumber,
                type: targetVersion.type,
                content: targetVersion.content
            }
        };
    }

    /**
     * 获取单个版本详情
     */
    async getVersionDetail(versionId: string, userId: string) {
        const version = await this.prisma.dreamVersion.findUnique({
            where: { id: versionId },
            include: {
                dream: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!version) {
            throw new NotFoundException({
                code: 40402,
                message: '版本不存在'
            });
        }

        if (version.dream.userId !== userId) {
            throw new ForbiddenException({
                code: 40301,
                message: '无权访问该版本'
            });
        }

        return {
            versionId: version.id,
            dreamId: version.dreamId,
            type: version.type,
            content: version.content,
            polishedFrom: version.polishedFrom,
            versionNumber: version.versionNumber,
            isCurrent: version.isCurrent,
            aiModel: version.aiModel,
            tokensUsed: version.tokensUsed,
            createdAt: version.createdAt.toISOString()
        };
    }
}
