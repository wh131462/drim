/**
 * Prisma Seed Script
 * 初始化数据库基础数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据...');

  // 1. VIP 套餐
  console.log('📦 创建 VIP 套餐...');
  const vipPlans = [
    {
      id: 'monthly',
      name: '月度会员',
      durationDays: 30,
      price: 9.9,
      originalPrice: 19.9,
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 'quarterly',
      name: '季度会员',
      durationDays: 90,
      price: 25.9,
      originalPrice: 59.7,
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 'yearly',
      name: '年度会员',
      durationDays: 365,
      price: 68.0,
      originalPrice: 238.8,
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const plan of vipPlans) {
    await prisma.vipPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  console.log(`  ✅ 创建了 ${vipPlans.length} 个 VIP 套餐`);

  // 2. 成就定义
  console.log('🏆 创建成就定义...');
  const achievements = [
    {
      id: 'first_dream',
      name: '梦境初探',
      description: '记录第一个梦境',
      icon: '🌟',
      conditionType: 'total_dreams',
      conditionValue: 1,
      rewardPoints: 50,
      sortOrder: 1,
    },
    {
      id: 'dream_7',
      name: '梦境小达人',
      description: '累计记录7个梦境',
      icon: '📝',
      conditionType: 'total_dreams',
      conditionValue: 7,
      rewardPoints: 100,
      sortOrder: 2,
    },
    {
      id: 'dream_30',
      name: '梦境收集者',
      description: '累计记录30个梦境',
      icon: '📚',
      conditionType: 'total_dreams',
      conditionValue: 30,
      rewardPoints: 200,
      sortOrder: 3,
    },
    {
      id: 'dream_100',
      name: '梦境大师',
      description: '累计记录100个梦境',
      icon: '👑',
      conditionType: 'total_dreams',
      conditionValue: 100,
      rewardPoints: 500,
      sortOrder: 4,
    },
    {
      id: 'streak_3',
      name: '初露锋芒',
      description: '连续记梦3天',
      icon: '🔥',
      conditionType: 'consecutive_days',
      conditionValue: 3,
      rewardPoints: 30,
      sortOrder: 10,
    },
    {
      id: 'streak_7',
      name: '持之以恒',
      description: '连续记梦7天',
      icon: '⚡',
      conditionType: 'consecutive_days',
      conditionValue: 7,
      rewardPoints: 70,
      sortOrder: 11,
    },
    {
      id: 'streak_30',
      name: '梦境守护者',
      description: '连续记梦30天',
      icon: '🌙',
      conditionType: 'consecutive_days',
      conditionValue: 30,
      rewardPoints: 300,
      sortOrder: 12,
    },
    {
      id: 'task_10',
      name: '任务新手',
      description: '完成10个任务',
      icon: '✅',
      conditionType: 'total_tasks',
      conditionValue: 10,
      rewardPoints: 50,
      sortOrder: 20,
    },
    {
      id: 'task_50',
      name: '任务达人',
      description: '完成50个任务',
      icon: '🎯',
      conditionType: 'total_tasks',
      conditionValue: 50,
      rewardPoints: 150,
      sortOrder: 21,
    },
    {
      id: 'points_1000',
      name: '幸运满满',
      description: '累计获得1000幸运值',
      icon: '🍀',
      conditionType: 'total_points',
      conditionValue: 1000,
      rewardPoints: 100,
      sortOrder: 30,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
  console.log(`  ✅ 创建了 ${achievements.length} 个成就`);

  // 3. 系统配置
  console.log('⚙️ 创建系统配置...');
  const configs = [
    {
      key: 'app_name',
      value: '梦见',
      description: '应用名称',
    },
    {
      key: 'app_version',
      value: '1.0.0',
      description: '应用版本号',
    },
    {
      key: 'points_per_dream',
      value: '10',
      description: '每次记梦获得的基础幸运值',
    },
    {
      key: 'points_per_task',
      value: '10',
      description: '完成任务获得的基础幸运值',
    },
    {
      key: 'points_double_ad',
      value: '2',
      description: '看广告翻倍倍数',
    },
    {
      key: 'reanalyze_cost',
      value: '50',
      description: '重新解析消耗的幸运值',
    },
    {
      key: 'daily_dream_limit',
      value: '5',
      description: '每日记梦上限（非VIP）',
    },
    {
      key: 'daily_dream_limit_vip',
      value: '999',
      description: '每日记梦上限（VIP）',
    },
    {
      key: 'min_dream_length',
      value: '10',
      description: '梦境内容最小字数',
    },
    {
      key: 'max_dream_length',
      value: '2000',
      description: '梦境内容最大字数',
    },
    {
      key: 'ad_unit_reward_video',
      value: 'adunit-xxxx',
      description: '激励视频广告单元ID',
    },
    {
      key: 'ad_unit_interstitial',
      value: 'adunit-yyyy',
      description: '插屏广告单元ID',
    },
    {
      key: 'share_title',
      value: '我在「梦见」记录了一个有趣的梦境，快来看看吧！',
      description: '默认分享标题',
    },
    {
      key: 'share_image',
      value: '/static/images/share.png',
      description: '默认分享图片',
    },
    {
      key: 'contact_email',
      value: 'support@drim.app',
      description: '客服邮箱',
    },
    {
      key: 'privacy_url',
      value: 'https://drim.app/privacy',
      description: '隐私政策链接',
    },
    {
      key: 'agreement_url',
      value: 'https://drim.app/agreement',
      description: '用户协议链接',
    },
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
  }
  console.log(`  ✅ 创建了 ${configs.length} 个系统配置`);

  console.log('\n🎉 数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
