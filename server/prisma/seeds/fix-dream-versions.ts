/**
 * 修复脚本：为没有版本记录的旧梦境创建原始版本
 *
 * 运行方式：npx ts-node prisma/seeds/fix-dream-versions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function fixDreamVersions() {
    console.log('🔧 开始修复梦境版本记录...\n');

    // 查找所有没有版本记录的梦境
    const dreamsWithoutVersions = await prisma.dream.findMany({
        where: {
            versions: {
                none: {}
            },
            status: { not: 'deleted' }
        },
        select: {
            id: true,
            userId: true,
            content: true,
            originalContent: true,
            createdAt: true
        }
    });

    console.log(`📊 发现 ${dreamsWithoutVersions.length} 个梦境缺少版本记录\n`);

    if (dreamsWithoutVersions.length === 0) {
        console.log('✅ 所有梦境都已有版本记录，无需修复');
        return { fixed: 0, total: 0 };
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const dream of dreamsWithoutVersions) {
        try {
            // 使用 originalContent 或 content 作为原始版本内容
            const content = dream.originalContent || dream.content;

            // 创建原始版本
            await prisma.dreamVersion.create({
                data: {
                    dreamId: dream.id,
                    userId: dream.userId,
                    type: 'original',
                    content: content,
                    versionNumber: 1,
                    isCurrent: true,
                    createdAt: dream.createdAt // 使用梦境创建时间
                }
            });

            // 更新梦境的 currentVersionId（如果需要）
            const version = await prisma.dreamVersion.findFirst({
                where: { dreamId: dream.id, isCurrent: true }
            });

            if (version) {
                await prisma.dream.update({
                    where: { id: dream.id },
                    data: { currentVersionId: version.id }
                });
            }

            fixedCount++;
            console.log(`  ✅ 修复梦境 ${dream.id}`);
        } catch (error) {
            errorCount++;
            console.error(`  ❌ 修复梦境 ${dream.id} 失败:`, error);
        }
    }

    console.log(`\n🎉 修复完成！`);
    console.log(`   成功: ${fixedCount}`);
    console.log(`   失败: ${errorCount}`);

    return { fixed: fixedCount, total: dreamsWithoutVersions.length };
}

// 直接运行脚本
if (require.main === module) {
    fixDreamVersions()
        .catch((e) => {
            console.error('❌ 修复失败:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
