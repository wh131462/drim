# 数据库 Seed 使用指南

## 概述

本目录包含数据库初始化和测试数据生成脚本，帮助快速搭建开发和测试环境。

## 文件结构

```
prisma/
├── schema.prisma          # 数据库模型定义
├── seed.ts               # 主 seed 脚本
├── seeds/
│   ├── achievements.ts   # 成就数据
│   └── test-data.ts      # 完整测试数据
└── README.md            # 本文件
```

## 快速开始

### 1. 初始化基础数据（生产环境）

```bash
cd server
npm run seed
```

这将创建：

- ✅ 3个 VIP 套餐
- ✅ 20个成就定义
- ✅ 17个系统配置项

### 2. 初始化 + 测试数据（开发环境）

```bash
cd server
SEED_TEST_DATA=true npm run seed
```

除了基础数据外，还将创建：

- 👤 2个测试用户
- 💭 15条梦境记录（含解析和版本）
- 🎯 6个任务记录
- 💰 8条积分记录
- 🏆 4个已解锁成就
- 🔍 3条探索浏览记录
- ✍️ 1条润色配额记录
- 💳 1条订单记录

## 测试用户信息

### 主测试用户（VIP）

- **用户名**: 测试梦想家
- **OpenID**: `test_open_id_001`
- **用户ID**: `test-user-1`
- **VIP状态**: 是（至2026-12-31）
- **幸运值**: 500
- **连续打卡**: 7天
- **梦境总数**: 15个
- **任务总数**: 8个

### 普通测试用户

- **用户名**: 普通用户
- **OpenID**: `test_open_id_002`
- **用户ID**: `test-user-2`
- **VIP状态**: 否
- **幸运值**: 120
- **连续打卡**: 3天

## 数据库操作命令

### 重置数据库（危险操作）

```bash
# 1. 删除所有数据并重置数据库结构
cd server
npx prisma migrate reset

# 2. 重新运行 migration 和 seed
# migrate reset 会自动运行 seed
```

### 只运行 seed（不重置）

```bash
cd server
npm run seed
# 或带测试数据
SEED_TEST_DATA=true npm run seed
```

### 查看数据库

```bash
cd server
npx prisma studio
```

浏览器会自动打开 Prisma Studio，可以查看和编辑数据库中的所有数据。

## 数据特点

### 梦境数据

- 包含8种不同类型的梦境内容（自然、考试、飞行、回忆等）
- 每个梦境都有完整的解析、主题、运势评分
- 部分梦境有润色版本
- 梦境按时间分布在最近30天内

### 任务数据

- 包含日常任务和周任务
- 前8个任务已完成，后续任务待完成
- 任务有合理的过期时间

### 成就系统

- 覆盖记梦、连续打卡、任务、解析、润色、探索、积分等多个维度
- 测试用户已解锁部分成就
- 可测试成就解锁和通知功能

### 积分系统

- 包含获得和消耗两种类型
- 记录来源（注册、记梦、任务、成就等）
- 余额自动累计

## 常见问题

### Q: 如何清除所有测试数据？

A: 运行 `npx prisma migrate reset`，这将删除所有数据并重新初始化。

### Q: 可以多次运行 seed 吗？

A: 可以。seed 脚本使用 `upsert` 操作，会更新已存在的记录，避免重复插入。

### Q: 如何修改测试用户的 OpenID？

A: 编辑 `seeds/test-data.ts` 文件中的 `testUsers` 数组，然后重新运行 seed。

### Q: 为什么需要测试数据？

A: 测试数据可以帮助：

- 快速验证功能是否正常工作
- 测试日历、成就、积分等需要历史数据的功能
- 进行前端界面的开发和调试
- 演示产品功能

## 开发建议

1. **开发环境**: 始终使用测试数据 `SEED_TEST_DATA=true npm run seed`
2. **测试环境**: 定期重置数据库以保持数据整洁
3. **生产环境**: 只运行基础 seed，不要创建测试数据
4. **数据备份**: 在重置数据库前，备份重要数据

## 自定义测试数据

如需添加更多测试数据，可以：

1. 编辑 `seeds/test-data.ts`
2. 添加新的梦境内容、用户或其他数据
3. 运行 `SEED_TEST_DATA=true npm run seed`

示例：

```typescript
// 在 seeds/test-data.ts 中添加新梦境
const dreamContents = [
    // ... 现有梦境
    {
        content: '你的新梦境内容...',
        tags: ['标签1', '标签2'],
        emotion: 'happy',
        theme: '主题',
        interpretation: '解析内容...',
        fortuneScore: 75
    }
];
```

## 技术支持

如遇到问题，请检查：

1. 数据库连接是否正常 (`DATABASE_URL` 配置)
2. Prisma Client 是否已生成 (`npx prisma generate`)
3. Migration 是否已运行 (`npx prisma migrate dev`)
