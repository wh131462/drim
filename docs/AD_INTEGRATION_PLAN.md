# 梦见小程序 - 广告融合方案

> 版本：v1.0
> 日期：2026-01-28
> 状态：待实施

---

## 一、方案概述

### 1.1 目标

在保证用户体验的前提下，通过合理的广告融合实现小程序变现，形成可持续的收益模式。

### 1.2 核心原则

| 原则     | 说明                                   |
| -------- | -------------------------------------- |
| 用户主动 | 激励视频广告由用户主动选择观看，不强制 |
| 价值交换 | 观看广告获得明确的积分/权益回报        |
| 体验优先 | 广告不打断核心操作流程                 |
| 自然融合 | 原生广告与内容风格保持一致             |

### 1.3 广告类型选择

| 广告类型       | 使用场景                         | 预估 CPM  |
| -------------- | -------------------------------- | --------- |
| 激励视频广告   | 任务奖励翻倍、积分不足时获取积分 | 50-150 元 |
| 原生信息流广告 | 探索广场内容中穿插               | 10-30 元  |

---

## 二、广告位详细设计

### 2.1 广告位 #1：任务完成双倍奖励

#### 基本信息

| 属性     | 值                             |
| -------- | ------------------------------ |
| 广告类型 | 激励视频广告 (RewardedVideoAd) |
| 触发位置 | 首页 - 今日任务卡片            |
| 触发时机 | 用户点击"打卡领取"完成任务后   |
| 广告时长 | 15-30 秒                       |

#### 用户流程

```
┌─────────────────────────────────────────────────────────────┐
│                        用户完成任务                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    弹出奖励选择弹窗                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │              🎉 任务完成！                            │   │
│  │                                                      │   │
│  │         基础奖励：+10 幸运值                          │   │
│  │                                                      │   │
│  │   ┌────────────────────────────────────────────┐    │   │
│  │   │  🎬 看视频领双倍  (+20 幸运值)              │    │   │
│  │   └────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │   ┌────────────────────────────────────────────┐    │   │
│  │   │  直接领取 (+10 幸运值)                      │    │   │
│  │   └────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     [选择看视频]                      [选择直接领取]
              │                               │
              ▼                               ▼
     播放激励视频广告                    获得 +10 幸运值
              │                               │
              ▼                               │
     广告播放完成                             │
              │                               │
              ▼                               │
     获得 +20 幸运值                          │
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                      显示成功提示
                      更新用户积分
```

#### 奖励规则

| 选项       | 奖励       | 说明                       |
| ---------- | ---------- | -------------------------- |
| 直接领取   | +10 幸运值 | 基础奖励                   |
| 看视频领取 | +20 幸运值 | 双倍奖励（需完整观看视频） |

#### 技术要点

- 视频未播放完成不发放双倍奖励
- 广告加载失败时降级为直接领取
- 每日任务只能领取一次奖励（防重复）
- 记录 `isDoubleReward` 状态到数据库

---

### 2.2 广告位 #2：积分不足看视频获取

#### 基本信息

| 属性     | 值                                |
| -------- | --------------------------------- |
| 广告类型 | 激励视频广告 (RewardedVideoAd)    |
| 触发位置 | 解析结果页、润色功能页            |
| 触发时机 | 用户积分不足以进行解析/润色操作时 |
| 广告时长 | 15-30 秒                          |

#### 用户流程

```
┌─────────────────────────────────────────────────────────────┐
│              用户点击"解析梦境"或"润色梦境"                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    检查用户积分是否充足
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
        [积分充足]                       [积分不足]
              │                               │
              ▼                               ▼
        正常执行操作                    弹出积分不足提示
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    积分不足弹窗                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │              😅 积分不足                              │   │
│  │                                                      │   │
│  │         当前积分：5                                   │   │
│  │         所需积分：20                                  │   │
│  │                                                      │   │
│  │   ┌────────────────────────────────────────────┐    │   │
│  │   │  🎬 看视频获取积分  (+20 幸运值)            │    │   │
│  │   └────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │   ┌────────────────────────────────────────────┐    │   │
│  │   │  开通 VIP 享无限特权                        │    │   │
│  │   └────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │            [取消]                                    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       [看视频获取]      [开通VIP]         [取消]
              │               │               │
              ▼               ▼               ▼
       播放激励视频      跳转VIP页面      关闭弹窗
              │
              ▼
       广告播放完成
              │
              ▼
       获得 +20 幸运值
              │
              ▼
       自动执行解析/润色
```

#### 奖励规则

| 场景     | 所需积分 | 广告奖励   | 说明               |
| -------- | -------- | ---------- | ------------------ |
| AI 解析  | 20       | +20 幸运值 | 刚好够一次解析     |
| 梦境润色 | 15       | +20 幸运值 | 够一次润色且有剩余 |

#### 技术要点

- 广告奖励积分实时到账
- 积分获取后自动触发原操作（解析/润色）
- 每日观看次数限制：建议 3-5 次（防止过度依赖广告）
- 记录 `PointRecord` 来源为 `ad_reward`

#### 每日限制设计

| 限制项           | 值         | 说明                 |
| ---------------- | ---------- | -------------------- |
| 每日观看上限     | 5 次       | 防止用户过度依赖广告 |
| 单次奖励         | 20 幸运值  | 固定奖励             |
| 每日最大广告积分 | 100 幸运值 | 5 次 × 20            |

---

### 2.3 广告位 #3：探索广场原生广告

#### 基本信息

| 属性     | 值                        |
| -------- | ------------------------- |
| 广告类型 | 原生信息流广告 (ad 组件)  |
| 触发位置 | 探索广场 - 梦境列表       |
| 展示方式 | 每隔 N 条内容插入一条广告 |
| 广告样式 | 与梦境卡片风格一致        |

#### 插入规则

```
┌─────────────────────────────────────────────────────────────┐
│                       探索广场                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  梦境 #1                                             │   │
│  │  "昨晚梦见在云端漫步..."                              │   │
│  │  ❤️ 128  👁️ 1.2k                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  梦境 #2                                             │   │
│  │  "梦到回到小时候的老家..."                            │   │
│  │  ❤️ 89   👁️ 856                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  梦境 #3                                             │   │
│  │  "奇怪的梦，我在水下呼吸..."                          │   │
│  │  ❤️ 234  👁️ 2.1k                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📢 广告                                             │   │  ← 第 4 条位置插入广告
│  │  [原生信息流广告]                                     │   │
│  │  与内容风格融合                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  梦境 #4                                             │   │
│  │  "梦见考试迟到..."                                    │   │
│  │  ❤️ 167  👁️ 1.5k                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              ...                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📢 广告                                             │   │  ← 第 9 条位置再次插入
│  │  [原生信息流广告]                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 插入策略

| 配置项         | 值      | 说明                      |
| -------------- | ------- | ------------------------- |
| 首次插入位置   | 第 4 条 | 让用户先看到足够内容      |
| 插入间隔       | 每 5 条 | 第 4、9、14、19... 条位置 |
| 单页最大广告数 | 3 条    | 防止广告过多影响体验      |
| 广告主题       | white   | 与页面风格一致            |

#### 广告样式要求

```scss
// 广告容器样式，与梦境卡片保持一致
.ad-card {
    background: #fff;
    border-radius: 24rpx;
    margin: 24rpx 32rpx;
    overflow: hidden;

    // 添加"广告"标识
    &::before {
        content: '广告';
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        font-size: 20rpx;
        color: #999;
        background: rgba(0, 0, 0, 0.05);
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
    }
}
```

#### 技术要点

- 广告加载失败时不占位，列表自动填充
- VIP 用户可选择关闭信息流广告
- 使用 `ad-type="video"` 获取更高收益
- 设置 `ad-intervals="60"` 自动刷新

---

## 三、技术实现方案

### 3.1 广告服务封装

#### 文件结构

```
src/
├── utils/
│   └── ad/
│       ├── index.ts              # 广告服务入口
│       ├── rewarded-video.ts     # 激励视频广告
│       ├── native-ad.ts          # 原生广告
│       └── config.ts             # 广告配置
```

#### 广告配置

```typescript
// src/utils/ad/config.ts

export const AD_CONFIG = {
    // 微信流量主广告位 ID（开通后替换）
    REWARDED_VIDEO: {
        TASK_DOUBLE: 'adunit-xxxxxxxxxx', // 任务双倍奖励
        POINTS_GAIN: 'adunit-yyyyyyyyyy' // 积分获取
    },
    NATIVE: {
        EXPLORE_FEED: 'adunit-zzzzzzzzzz' // 探索广场信息流
    },

    // 奖励配置
    REWARDS: {
        TASK_DOUBLE_POINTS: 20, // 任务双倍奖励积分
        AD_WATCH_POINTS: 20, // 看广告获得积分
        DAILY_AD_LIMIT: 5 // 每日广告观看上限
    },

    // 原生广告插入配置
    NATIVE_AD_INSERT: {
        FIRST_POSITION: 3, // 首次插入位置（索引从0开始）
        INTERVAL: 5, // 插入间隔
        MAX_COUNT: 3 // 单页最大广告数
    }
};
```

#### 激励视频广告服务

```typescript
// src/utils/ad/rewarded-video.ts

import { AD_CONFIG } from './config';

type AdType = 'task_double' | 'points_gain';

interface RewardedVideoResult {
    success: boolean;
    isEnded: boolean;
    errMsg?: string;
}

class RewardedVideoAdService {
    private adInstances: Map<AdType, WechatMiniprogram.RewardedVideoAd> = new Map();

    /**
     * 获取或创建广告实例
     */
    private getAdInstance(type: AdType): WechatMiniprogram.RewardedVideoAd | null {
        // #ifdef MP-WEIXIN
        if (this.adInstances.has(type)) {
            return this.adInstances.get(type)!;
        }

        const adUnitId =
            type === 'task_double' ? AD_CONFIG.REWARDED_VIDEO.TASK_DOUBLE : AD_CONFIG.REWARDED_VIDEO.POINTS_GAIN;

        if (!adUnitId || adUnitId.startsWith('adunit-xxx')) {
            console.warn('[Ad] 广告位ID未配置');
            return null;
        }

        try {
            const ad = wx.createRewardedVideoAd({ adUnitId });
            this.adInstances.set(type, ad);
            return ad;
        } catch (error) {
            console.error('[Ad] 创建广告实例失败:', error);
            return null;
        }
        // #endif

        return null;
    }

    /**
     * 显示激励视频广告
     */
    async show(type: AdType): Promise<RewardedVideoResult> {
        const ad = this.getAdInstance(type);

        if (!ad) {
            return { success: false, isEnded: false, errMsg: '广告服务不可用' };
        }

        return new Promise((resolve) => {
            // 监听关闭事件
            const onClose = (res: { isEnded: boolean }) => {
                ad.offClose(onClose);
                resolve({
                    success: true,
                    isEnded: res.isEnded
                });
            };

            // 监听错误事件
            const onError = (err: { errMsg: string }) => {
                ad.offError(onError);
                ad.offClose(onClose);
                resolve({
                    success: false,
                    isEnded: false,
                    errMsg: err.errMsg
                });
            };

            ad.onClose(onClose);
            ad.onError(onError);

            // 加载并显示广告
            ad.load()
                .then(() => ad.show())
                .catch((err) => {
                    ad.offClose(onClose);
                    ad.offError(onError);
                    resolve({
                        success: false,
                        isEnded: false,
                        errMsg: err.errMsg
                    });
                });
        });
    }

    /**
     * 销毁所有广告实例
     */
    destroy() {
        this.adInstances.forEach((ad) => {
            ad.destroy?.();
        });
        this.adInstances.clear();
    }
}

export const rewardedVideoAd = new RewardedVideoAdService();
```

#### 原生广告列表混入

```typescript
// src/utils/ad/native-ad.ts

import { AD_CONFIG } from './config';

interface ContentItem {
    id: string;
    type: 'content' | 'ad';
    data?: any;
}

/**
 * 将广告插入内容列表
 */
export function insertAdsIntoList<T extends { id: string }>(
    items: T[],
    options?: {
        firstPosition?: number;
        interval?: number;
        maxCount?: number;
    }
): ContentItem[] {
    const {
        firstPosition = AD_CONFIG.NATIVE_AD_INSERT.FIRST_POSITION,
        interval = AD_CONFIG.NATIVE_AD_INSERT.INTERVAL,
        maxCount = AD_CONFIG.NATIVE_AD_INSERT.MAX_COUNT
    } = options || {};

    const result: ContentItem[] = [];
    let adCount = 0;

    items.forEach((item, index) => {
        // 添加内容项
        result.push({
            id: item.id,
            type: 'content',
            data: item
        });

        // 判断是否需要插入广告
        const shouldInsertAd =
            adCount < maxCount &&
            (index === firstPosition || (index > firstPosition && (index - firstPosition) % interval === 0));

        if (shouldInsertAd) {
            result.push({
                id: `ad-${adCount}`,
                type: 'ad'
            });
            adCount++;
        }
    });

    return result;
}
```

### 3.2 后端积分记录

#### 积分来源类型扩展

```typescript
// 在 PointRecord 模型中添加新的来源类型

enum PointSource {
    TASK_COMPLETE = 'task_complete', // 任务完成
    TASK_DOUBLE = 'task_double', // 任务双倍（广告）
    AD_REWARD = 'ad_reward', // 广告奖励
    ACHIEVEMENT = 'achievement', // 成就奖励
    ANALYSIS_COST = 'analysis_cost', // 解析消耗
    POLISH_COST = 'polish_cost' // 润色消耗
}
```

#### 广告奖励 API

```typescript
// server/src/modules/points/points.controller.ts

@Post('ad-reward')
async claimAdReward(
  @CurrentUser() user: User,
  @Body() body: { type: 'task_double' | 'points_gain' }
) {
  return this.pointsService.claimAdReward(user.id, body.type);
}
```

```typescript
// server/src/modules/points/points.service.ts

async claimAdReward(userId: string, type: 'task_double' | 'points_gain') {
  // 检查每日广告观看次数
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAdCount = await this.prisma.pointRecord.count({
    where: {
      userId,
      source: { in: ['task_double', 'ad_reward'] },
      createdAt: { gte: today },
    },
  });

  if (todayAdCount >= 5) {
    throw new BadRequestException('今日广告观看次数已达上限');
  }

  // 计算奖励积分
  const points = type === 'task_double' ? 10 : 20; // 双倍是额外+10，直接看广告+20

  // 更新用户积分
  const user = await this.prisma.user.update({
    where: { id: userId },
    data: { luckyPoints: { increment: points } },
  });

  // 记录积分变动
  await this.prisma.pointRecord.create({
    data: {
      userId,
      points,
      source: type === 'task_double' ? 'task_double' : 'ad_reward',
      description: type === 'task_double' ? '任务双倍奖励' : '观看广告奖励',
    },
  });

  return {
    success: true,
    points,
    totalPoints: user.luckyPoints,
    remainingAdCount: 5 - todayAdCount - 1,
  };
}
```

---

## 四、用户体验设计

### 4.1 广告加载状态

```
┌─────────────────────────────────────────┐
│                                         │
│           ⏳ 广告加载中...               │
│                                         │
│     请稍候，精彩内容马上呈现              │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 广告加载失败降级

| 场景                 | 降级方案                                 |
| -------------------- | ---------------------------------------- |
| 任务双倍奖励广告失败 | 直接发放基础奖励 +10                     |
| 积分获取广告失败     | 提示"广告加载失败，请稍后重试"或引导 VIP |
| 信息流广告失败       | 不显示广告位，列表正常展示               |

### 4.3 VIP 用户特权

| 功能         | 普通用户      | VIP 用户               |
| ------------ | ------------- | ---------------------- |
| 探索广场广告 | 显示          | 可选择关闭             |
| 任务双倍奖励 | 需看广告      | 自动双倍（无需看广告） |
| 每日解析次数 | 需积分/看广告 | 无限次                 |

---

## 五、数据埋点

### 5.1 广告相关事件

| 事件名            | 触发时机     | 参数                                       |
| ----------------- | ------------ | ------------------------------------------ |
| `ad_load_start`   | 开始加载广告 | ad_type, ad_position                       |
| `ad_load_success` | 广告加载成功 | ad_type, ad_position, load_time            |
| `ad_load_fail`    | 广告加载失败 | ad_type, ad_position, error_code           |
| `ad_show`         | 广告展示     | ad_type, ad_position                       |
| `ad_click`        | 广告点击     | ad_type, ad_position                       |
| `ad_close`        | 广告关闭     | ad_type, ad_position, is_ended, watch_time |
| `ad_reward_claim` | 领取广告奖励 | ad_type, reward_points                     |

### 5.2 监控指标

| 指标           | 计算方式                    | 目标值       |
| -------------- | --------------------------- | ------------ |
| 广告加载成功率 | 成功次数 / 总加载次数       | > 95%        |
| 广告完播率     | 完整观看次数 / 开始播放次数 | > 80%        |
| 广告点击率     | 点击次数 / 展示次数         | 参考行业基准 |
| 广告 ARPU      | 广告收入 / 活跃用户数       | 持续优化     |

---

## 六、开通时间线

### 6.1 前置条件

| 条件       | 当前状态 | 目标                   |
| ---------- | -------- | ---------------------- |
| 小程序主体 | 个人     | 个人（可用微信流量主） |
| 累计 UV    | 待确认   | ≥ 1000                 |
| 违规记录   | 无       | 保持无违规             |

### 6.2 实施阶段

```
阶段 1: 代码开发（UV < 1000）
├── 完成广告服务封装
├── 完成 UI 组件开发
├── 完成后端 API 开发
└── 广告位预留，加载失败优雅降级

阶段 2: 开通流量主（UV ≥ 1000）
├── 申请微信流量主
├── 创建广告位，获取 adUnitId
└── 配置到项目中

阶段 3: 测试上线
├── 真机测试广告展示
├── 验证奖励发放逻辑
└── 灰度发布

阶段 4: 监控优化
├── 监控广告数据
├── 优化广告位置和频率
└── A/B 测试不同策略
```

---

## 七、风险与应对

| 风险             | 影响               | 应对措施                       |
| ---------------- | ------------------ | ------------------------------ |
| 广告加载失败率高 | 用户体验差，收益低 | 多次重试、降级方案、缓存预加载 |
| 用户反感广告     | 留存下降           | 控制频率、提供关闭选项（VIP）  |
| 广告被封禁       | 无法展示广告       | 遵守规范、及时处理违规         |
| 收益低于预期     | ROI 不达标         | 优化广告位、提升用户质量       |

---

## 八、预估收益

### 8.1 假设条件

| 指标           | 假设值 |
| -------------- | ------ |
| DAU            | 1000   |
| 任务完成率     | 30%    |
| 双倍选择率     | 50%    |
| 积分不足触发率 | 20%    |
| 广告观看率     | 60%    |
| 激励视频 eCPM  | 80 元  |
| 信息流 eCPM    | 15 元  |

### 8.2 预估日收入

| 广告位   | 计算                       | 预估收入     |
| -------- | -------------------------- | ------------ |
| 任务双倍 | 1000 × 30% × 50% × 80/1000 | ¥12/天       |
| 积分获取 | 1000 × 20% × 60% × 80/1000 | ¥9.6/天      |
| 信息流   | 1000 × 3 × 15/1000         | ¥45/天       |
| **合计** |                            | **¥66.6/天** |

> 注：以上为粗略估算，实际收益受多种因素影响

---

## 九、参考文档

- [微信小程序广告组件](https://developers.weixin.qq.com/miniprogram/dev/component/ad.html)
- [激励视频广告 API](https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.html)
- [uni-app 激励视频广告](https://uniapp.dcloud.net.cn/uni-ad/ad-rewarded-video.html)
- [小程序流量主应用规范](https://wximg.qq.com/wxp/pdftool/get.html?id=rynYA8o3f)

---

## 十、审批记录

| 日期       | 审批人 | 意见     |
| ---------- | ------ | -------- |
| 2026-01-28 | -      | 方案初稿 |
|            |        |          |
|            |        |          |
