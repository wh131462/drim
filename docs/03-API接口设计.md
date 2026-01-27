# 梦见小程序 - API 接口设计

## 1. 接口规范

### 1.1 基础信息

- **Base URL**: `https://api.drim.app/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 请求头

| Header        | 必填 | 说明                           |
| ------------- | ---- | ------------------------------ |
| Content-Type  | 是   | `application/json`             |
| Authorization | 是\* | `Bearer {token}`，登录接口除外 |
| X-Request-Id  | 否   | 请求追踪ID                     |
| X-Platform    | 是   | 平台标识：`mp-weixin`/`h5`     |
| X-Version     | 是   | 客户端版本号                   |

### 1.3 响应格式

```typescript
interface ApiResponse<T = any> {
    code: number; // 状态码，0表示成功
    message: string; // 提示信息
    data: T; // 响应数据
    timestamp: number; // 时间戳
    requestId: string; // 请求ID
}
```

### 1.4 状态码定义

| 状态码 | 说明             |
| ------ | ---------------- |
| 0      | 成功             |
| 400    | 参数错误         |
| 401    | 未授权/Token无效 |
| 403    | 权限不足         |
| 404    | 资源不存在       |
| 429    | 请求过于频繁     |
| 500    | 服务器内部错误   |
| 10001  | 用户不存在       |
| 10002  | 登录失败         |
| 20001  | 梦境内容违规     |
| 20002  | 今日已记录梦境   |
| 20003  | AI解析失败       |
| 30001  | 积分不足         |
| 40001  | 广告验证失败     |

---

## 2. 用户模块

### 2.1 微信登录

**POST** `/user/login/wechat`

登录获取用户Token。

**请求参数**

| 参数 | 类型   | 必填 | 说明         |
| ---- | ------ | ---- | ------------ |
| code | string | 是   | 微信登录code |

**请求示例**

```json
{
    "code": "023xxx"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresIn": 7200,
        "userInfo": {
            "id": "user_123456",
            "nickname": "用户昵称",
            "avatar": "https://xxx.com/avatar.png",
            "isVip": false,
            "vipExpireAt": null,
            "luckyPoints": 0,
            "consecutiveDays": 0
        },
        "isNewUser": true
    }
}
```

---

### 2.2 获取用户信息

**GET** `/user/info`

获取当前登录用户信息。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": "user_123456",
        "nickname": "用户昵称",
        "avatar": "https://xxx.com/avatar.png",
        "isVip": false,
        "vipExpireAt": null,
        "luckyPoints": 120,
        "consecutiveDays": 7,
        "totalDreams": 15,
        "totalTasks": 10,
        "createdAt": "2026-01-01T00:00:00.000Z"
    }
}
```

---

### 2.3 更新用户信息

**PUT** `/user/info`

更新用户基本信息。

**请求参数**

| 参数     | 类型   | 必填 | 说明    |
| -------- | ------ | ---- | ------- |
| nickname | string | 否   | 昵称    |
| avatar   | string | 否   | 头像URL |

**请求示例**

```json
{
    "nickname": "新昵称"
}
```

---

### 2.4 获取用户统计

**GET** `/user/stats`

获取用户数据统计。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "totalDreams": 30,
        "totalAnalysis": 28,
        "totalTasks": 25,
        "taskCompletionRate": 0.89,
        "currentStreak": 7,
        "longestStreak": 14,
        "luckyPoints": 520,
        "achievements": [
            {
                "id": "first_dream",
                "name": "初次记梦",
                "icon": "🌙",
                "unlockedAt": "2026-01-01T08:00:00.000Z"
            },
            {
                "id": "streak_7",
                "name": "连续7天",
                "icon": "🔥",
                "unlockedAt": "2026-01-07T08:00:00.000Z"
            }
        ]
    }
}
```

---

## 3. 梦境模块

### 3.1 提交梦境

**POST** `/dream`

提交一条梦境记录。

**请求参数**

| 参数    | 类型     | 必填 | 说明                          |
| ------- | -------- | ---- | ----------------------------- |
| content | string   | 是   | 梦境内容，50-1000字           |
| tags    | string[] | 否   | 标签数组，最多3个             |
| emotion | string   | 否   | 情绪：happy/fear/confused/sad |

**请求示例**

```json
{
    "content": "我梦见自己在一片草地上奔跑，天空很蓝，阳光很温暖...",
    "tags": ["flying", "nature"],
    "emotion": "happy"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": "dream_789",
        "content": "我梦见自己在一片草地上奔跑...",
        "tags": ["flying", "nature"],
        "emotion": "happy",
        "status": "pending",
        "createdAt": "2026-01-21T08:00:00.000Z"
    }
}
```

---

### 3.2 获取梦境列表

**GET** `/dream/list`

获取用户梦境列表。

**请求参数**

| 参数      | 类型   | 必填 | 说明             |
| --------- | ------ | ---- | ---------------- |
| page      | number | 否   | 页码，默认1      |
| pageSize  | number | 否   | 每页数量，默认20 |
| startDate | string | 否   | 开始日期         |
| endDate   | string | 否   | 结束日期         |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "id": "dream_789",
                "content": "我梦见自己在一片草地上奔跑...",
                "tags": ["flying", "nature"],
                "emotion": "happy",
                "status": "analyzed",
                "hasAnalysis": true,
                "createdAt": "2026-01-21T08:00:00.000Z"
            }
        ],
        "total": 30,
        "page": 1,
        "pageSize": 20
    }
}
```

---

### 3.3 获取梦境详情

**GET** `/dream/{dreamId}`

获取单个梦境详情。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": "dream_789",
        "content": "我梦见自己在一片草地上奔跑，天空很蓝，阳光很温暖。突然我发现自己能飞起来...",
        "tags": ["flying", "nature"],
        "emotion": "happy",
        "status": "analyzed",
        "analysis": {
            "id": "analysis_123",
            "theme": "对自由的渴望与向往",
            "interpretation": "这个梦境反映了你内心对自由的渴望...",
            "fortuneScore": 85,
            "fortuneTips": {
                "career": "适合尝试新事物",
                "love": "保持开放心态",
                "health": "多做户外运动"
            }
        },
        "createdAt": "2026-01-21T08:00:00.000Z"
    }
}
```

---

### 3.4 获取日历数据

**GET** `/dream/calendar`

获取月度日历数据。

**请求参数**

| 参数  | 类型   | 必填 | 说明      |
| ----- | ------ | ---- | --------- |
| year  | number | 是   | 年份      |
| month | number | 是   | 月份 1-12 |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "year": 2026,
        "month": 1,
        "records": [
            { "date": "2026-01-01", "hasDream": true, "dreamId": "dream_001" },
            { "date": "2026-01-02", "hasDream": false, "dreamId": null },
            { "date": "2026-01-03", "hasDream": true, "dreamId": "dream_002" }
        ],
        "consecutiveDays": 7,
        "monthTotal": 15
    }
}
```

---

### 3.5 删除梦境

**DELETE** `/dream/{dreamId}`

删除梦境记录（软删除）。

**响应示例**

```json
{
    "code": 0,
    "message": "删除成功",
    "data": null
}
```

---

### 3.6 设置梦境隐私 (新增)

**PUT** `/dream/{dreamId}/privacy`

设置梦境的公开/私密状态。

**请求参数**

| 参数     | 类型    | 必填 | 说明                    |
| -------- | ------- | ---- | ----------------------- |
| isPublic | boolean | 是   | true为公开，false为私密 |

**请求示例**

```json
{
    "isPublic": true
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "设置成功",
    "data": {
        "dreamId": "dream_789",
        "isPublic": true
    }
}
```

---

### 3.7 获取梦境版本列表 (新增)

**GET** `/dream/{dreamId}/versions`

获取梦境的所有版本历史。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "dreamId": "dream_789",
        "versions": [
            {
                "versionId": "ver_001",
                "type": "original",
                "content": "我梦见自己在一片草地上奔跑...",
                "createdAt": "2026-01-21T08:00:00.000Z",
                "isCurrent": false
            },
            {
                "versionId": "ver_002",
                "type": "polished",
                "content": "在那个宁静的午后，我发现自己置身于一片广袤无垠的草地之上...",
                "polishedFrom": "ver_001",
                "createdAt": "2026-01-21T08:10:00.000Z",
                "isCurrent": true
            }
        ],
        "total": 2
    }
}
```

---

### 3.8 切换梦境版本 (新增)

**POST** `/dream/{dreamId}/version/switch`

切换当前查看的梦境版本。

**请求参数**

| 参数      | 类型   | 必填 | 说明   |
| --------- | ------ | ---- | ------ |
| versionId | string | 是   | 版本ID |

**请求示例**

```json
{
    "versionId": "ver_001"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "切换成功",
    "data": {
        "versionId": "ver_001",
        "type": "original",
        "content": "我梦见自己在一片草地上奔跑..."
    }
}
```

---

## 4. AI润色模块 (新增)

### 4.1 请求AI润色

**POST** `/polish/request`

请求对梦境进行AI润色。

**请求参数**

| 参数      | 类型   | 必填 | 说明                             |
| --------- | ------ | ---- | -------------------------------- |
| dreamId   | string | 是   | 梦境ID                           |
| versionId | string | 否   | 指定版本ID，不指定则润色当前版本 |

**请求示例**

```json
{
    "dreamId": "dream_789",
    "versionId": "ver_001"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "润色中",
    "data": {
        "polishId": "polish_123",
        "status": "processing"
    }
}
```

---

### 4.2 获取润色结果

**GET** `/polish/{polishId}`

获取AI润色结果。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "polishId": "polish_123",
        "dreamId": "dream_789",
        "status": "completed",
        "originalVersion": "ver_001",
        "polishedVersion": {
            "versionId": "ver_002",
            "type": "polished",
            "content": "在那个宁静的午后，我发现自己置身于一片广袤无垠的草地之上。柔软的青草在微风中轻轻摇曳，像是在跳一支优雅的舞蹈。头顶的天空湛蓝如洗，阳光温暖地洒在身上，带来一种说不出的惬意...",
            "createdAt": "2026-01-21T08:10:00.000Z"
        },
        "quotaUsed": 1,
        "quotaRemaining": 2
    }
}
```

---

### 4.3 获取润色配额

**GET** `/polish/quota`

获取用户的AI润色配额。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 3,
        "used": 1,
        "remaining": 2,
        "resetAt": "2026-01-22T00:00:00.000Z",
        "isVip": false
    }
}
```

---

## 5. 探索模块 (新增)

### 5.1 获取公开梦境列表

**GET** `/explore/dreams`

获取公开的梦境列表。

**请求参数**

| 参数     | 类型     | 必填 | 说明             |
| -------- | -------- | ---- | ---------------- |
| page     | number   | 否   | 页码，默认1      |
| pageSize | number   | 否   | 每页数量，默认20 |
| tags     | string[] | 否   | 标签筛选         |
| emotion  | string   | 否   | 情绪筛选         |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "dreamId": "dream_456",
                "content": "我梦见自己在海边看日出...",
                "tags": ["nature", "water"],
                "emotion": "happy",
                "author": {
                    "id": "user_xxx",
                    "nickname": "梦想家",
                    "avatar": "https://xxx.com/avatar.png"
                },
                "likeCount": 12,
                "viewCount": 156,
                "createdAt": "2026-01-20T08:00:00.000Z"
            }
        ],
        "total": 100,
        "page": 1,
        "pageSize": 20
    }
}
```

---

### 5.2 随机探索梦境

**GET** `/explore/random`

随机获取一个公开梦境。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "dreamId": "dream_456",
        "content": "我梦见自己在海边看日出...",
        "tags": ["nature", "water"],
        "emotion": "happy",
        "author": {
            "id": "user_xxx",
            "nickname": "梦想家",
            "avatar": "https://xxx.com/avatar.png"
        },
        "likeCount": 12,
        "viewCount": 156,
        "createdAt": "2026-01-20T08:00:00.000Z"
    }
}
```

---

### 5.3 查看公开梦境详情

**GET** `/explore/dream/{dreamId}`

查看某个公开梦境的详细信息。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "dreamId": "dream_456",
        "content": "我梦见自己在海边看日出，海浪拍打着岸边...",
        "tags": ["nature", "water"],
        "emotion": "happy",
        "author": {
            "id": "user_xxx",
            "nickname": "梦想家",
            "avatar": "https://xxx.com/avatar.png"
        },
        "analysis": {
            "theme": "内心的平静与希望",
            "interpretation": "这个梦境反映了你内心对宁静和新开始的渴望..."
        },
        "likeCount": 12,
        "viewCount": 157,
        "isLiked": false,
        "createdAt": "2026-01-20T08:00:00.000Z"
    }
}
```

---

## 6. 解析模块

### 6.1 请求解析

**POST** `/analysis/request`

请求对梦境进行AI解析。

**请求参数**

| 参数    | 类型   | 必填 | 说明                          |
| ------- | ------ | ---- | ----------------------------- |
| dreamId | string | 是   | 梦境ID                        |
| adToken | string | 是   | 广告观看凭证（VIP用户可为空） |

**请求示例**

```json
{
    "dreamId": "dream_789",
    "adToken": "ad_token_xxx"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "analysisId": "analysis_123",
        "status": "processing"
    }
}
```

---

### 4.2 获取解析结果

**GET** `/analysis/{analysisId}`

获取解析结果。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": "analysis_123",
        "dreamId": "dream_789",
        "status": "completed",
        "theme": "对自由的渴望与向往",
        "interpretation": "这个梦境反映了你内心对自由的渴望。草地象征着广阔的可能性，奔跑代表追逐梦想的动力，而飞翔则意味着突破限制、超越自我的愿望。近期你可能在某些方面感到束缚，这个梦是潜意识在提醒你勇敢追求内心真正想要的东西。",
        "fortuneScore": 85,
        "fortuneTips": {
            "career": "适合尝试新事物，把握机会主动出击",
            "love": "保持开放心态，可能有意外惊喜",
            "health": "精力充沛，多做户外运动"
        },
        "task": {
            "id": "task_456",
            "type": "action",
            "content": "今天出门时深呼吸三次，感受自由的空气",
            "rewardPoints": 10
        },
        "disclaimer": "本解析仅供娱乐参考，不构成任何专业建议",
        "createdAt": "2026-01-21T08:05:00.000Z"
    }
}
```

---

### 4.3 重新解析

**POST** `/analysis/retry`

消耗积分重新解析梦境。

**请求参数**

| 参数    | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| dreamId | string | 是   | 梦境ID |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "analysisId": "analysis_124",
        "pointsConsumed": 50,
        "remainingPoints": 70
    }
}
```

---

## 5. 任务模块

### 5.1 获取今日任务

**GET** `/task/today`

获取今日改运任务。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": "task_456",
        "type": "action",
        "content": "今天出门时深呼吸三次，感受自由的空气",
        "rewardPoints": 10,
        "doubleReward": false,
        "status": "pending",
        "expireAt": "2026-01-21T23:59:59.000Z",
        "relatedDreamId": "dream_789"
    }
}
```

---

### 5.2 完成任务

**POST** `/task/{taskId}/complete`

标记任务为已完成。

**请求参数**

| 参数      | 类型    | 必填 | 说明                              |
| --------- | ------- | ---- | --------------------------------- |
| watchedAd | boolean | 否   | 是否观看广告获取双倍奖励          |
| adToken   | string  | 否   | 广告凭证（watchedAd为true时必填） |

**请求示例**

```json
{
    "watchedAd": true,
    "adToken": "ad_token_yyy"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "任务完成",
    "data": {
        "rewardPoints": 20,
        "totalPoints": 140,
        "isDoubleReward": true
    }
}
```

---

### 5.3 获取任务历史

**GET** `/task/history`

获取历史任务记录。

**请求参数**

| 参数     | 类型   | 必填 | 说明                        |
| -------- | ------ | ---- | --------------------------- |
| page     | number | 否   | 页码                        |
| pageSize | number | 否   | 每页数量                    |
| status   | string | 否   | 状态筛选：completed/expired |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "id": "task_455",
                "content": "今天喝咖啡时加一勺糖",
                "status": "completed",
                "rewardPoints": 10,
                "completedAt": "2026-01-20T15:30:00.000Z"
            }
        ],
        "total": 25,
        "page": 1,
        "pageSize": 20
    }
}
```

---

## 6. 积分模块

### 6.1 获取积分记录

**GET** `/points/records`

获取积分变动记录。

**请求参数**

| 参数     | 类型   | 必填 | 说明                   |
| -------- | ------ | ---- | ---------------------- |
| page     | number | 否   | 页码                   |
| pageSize | number | 否   | 每页数量               |
| type     | string | 否   | 类型筛选：earn/consume |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "currentPoints": 140,
        "records": [
            {
                "id": "record_001",
                "type": "earn",
                "amount": 20,
                "source": "task_complete",
                "description": "完成任务 +20",
                "createdAt": "2026-01-21T15:30:00.000Z"
            },
            {
                "id": "record_002",
                "type": "consume",
                "amount": 50,
                "source": "dream_reanalyze",
                "description": "重新解析梦境 -50",
                "createdAt": "2026-01-20T10:00:00.000Z"
            }
        ],
        "total": 50,
        "page": 1,
        "pageSize": 20
    }
}
```

---

## 7. 广告模块

### 7.1 获取广告配置

**GET** `/ad/config`

获取广告位配置。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "rewardedVideo": {
            "unitId": "adunit-xxx",
            "enabled": true
        },
        "banner": {
            "unitId": "adunit-yyy",
            "enabled": true
        }
    }
}
```

---

### 7.2 上报广告事件

**POST** `/ad/report`

上报广告展示/完成事件。

**请求参数**

| 参数      | 类型   | 必填 | 说明                  |
| --------- | ------ | ---- | --------------------- |
| adType    | string | 是   | rewarded_video/banner |
| eventType | string | 是   | show/complete/error   |
| position  | string | 是   | 广告位置              |
| duration  | number | 否   | 观看时长（秒）        |
| errorMsg  | string | 否   | 错误信息              |

**请求示例**

```json
{
    "adType": "rewarded_video",
    "eventType": "complete",
    "position": "before_analysis",
    "duration": 30
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "token": "ad_token_xxx",
        "expiresIn": 300
    }
}
```

---

## 8. 权益模块

> **重要说明**：本模块已从付费会员模式改为积分兑换模式，适用于个人开发者（无企业资质）场景。

### 8.1 获取权益信息

**GET** `/privilege/info`

获取用户权益状态和可兑换项目。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "hasPrivilege": false,
        "expireAt": null,
        "currentPoints": 520,
        "benefits": [
            { "key": "no_ad", "name": "免广告查看解析", "enabled": false },
            { "key": "unlimited_polish", "name": "无限AI润色", "enabled": false },
            { "key": "unlimited_history", "name": "无限历史记录", "enabled": false },
            { "key": "deep_analysis", "name": "深度心理分析", "enabled": false }
        ],
        "exchangeItems": [
            { "id": "ad_free_1day", "name": "免广告特权", "duration": "1天", "points": 50, "originalPoints": null },
            { "id": "ad_free_7day", "name": "免广告特权", "duration": "7天", "points": 280, "originalPoints": 350 },
            { "id": "ad_free_30day", "name": "免广告特权", "duration": "30天", "points": 900, "originalPoints": 1500 }
        ],
        "earnWays": [
            { "name": "每日记梦", "points": 10 },
            { "name": "完成任务", "points": 10 },
            { "name": "看广告翻倍", "points": 10 },
            { "name": "连续打卡奖励", "points": "20-200" },
            { "name": "解锁成就", "points": "10-100" },
            { "name": "分享梦境", "points": 5 }
        ]
    }
}
```

---

### 8.2 积分兑换权益

**POST** `/privilege/exchange`

消耗积分兑换权益。

**请求参数**

| 参数   | 类型   | 必填 | 说明                                                  |
| ------ | ------ | ---- | ----------------------------------------------------- |
| itemId | string | 是   | 兑换项目ID（ad_free_1day/ad_free_7day/ad_free_30day） |

**请求示例**

```json
{
    "itemId": "ad_free_7day"
}
```

**响应示例**

```json
{
    "code": 0,
    "message": "兑换成功",
    "data": {
        "exchangeId": "exchange_xxx",
        "itemId": "ad_free_7day",
        "itemName": "免广告特权",
        "duration": "7天",
        "pointsConsumed": 280,
        "remainingPoints": 240,
        "privilegeExpireAt": "2026-01-28T10:00:00.000Z"
    }
}
```

**错误码**

| 错误码 | 说明           |
| ------ | -------------- |
| 30001  | 积分不足       |
| 30002  | 兑换项目不存在 |
| 30003  | 兑换项目已下架 |

---

### 8.3 获取兑换记录

**GET** `/privilege/records`

获取积分兑换权益的历史记录。

**请求参数**

| 参数     | 类型   | 必填 | 说明             |
| -------- | ------ | ---- | ---------------- |
| page     | number | 否   | 页码，默认1      |
| pageSize | number | 否   | 每页数量，默认20 |

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "exchangeId": "exchange_xxx",
                "itemId": "ad_free_7day",
                "itemName": "免广告特权",
                "duration": "7天",
                "pointsConsumed": 280,
                "exchangedAt": "2026-01-21T10:00:00.000Z",
                "expireAt": "2026-01-28T10:00:00.000Z"
            }
        ],
        "total": 5,
        "page": 1,
        "pageSize": 20
    }
}
```

---

## 9. 配置模块

### 9.1 获取应用配置

**GET** `/config/app`

获取应用全局配置。

**响应示例**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "tags": [
            { "id": "chase", "name": "追逐", "icon": "🏃" },
            { "id": "flying", "name": "飞行", "icon": "🦅" },
            { "id": "exam", "name": "考试", "icon": "📝" },
            { "id": "family", "name": "亲人", "icon": "👨‍👩‍👧" },
            { "id": "water", "name": "水", "icon": "💧" },
            { "id": "animal", "name": "动物", "icon": "🐕" },
            { "id": "lost", "name": "迷路", "icon": "🗺️" },
            { "id": "death", "name": "死亡", "icon": "💀" },
            { "id": "teeth", "name": "牙齿", "icon": "🦷" },
            { "id": "naked", "name": "裸体", "icon": "🙈" }
        ],
        "emotions": [
            { "id": "happy", "name": "开心", "icon": "😊" },
            { "id": "fear", "name": "恐惧", "icon": "😨" },
            { "id": "confused", "name": "困惑", "icon": "😕" },
            { "id": "sad", "name": "悲伤", "icon": "😢" }
        ],
        "dreamMinLength": 50,
        "dreamMaxLength": 500,
        "reanalyzePointsCost": 50,
        "announcement": null,
        "appVersion": "1.0.0",
        "minSupportVersion": "1.0.0"
    }
}
```

---

## 10. 错误处理

### 10.1 错误响应示例

```json
{
    "code": 20001,
    "message": "梦境内容包含敏感词，请修改后重试",
    "data": null,
    "timestamp": 1642752000000,
    "requestId": "req_xxx"
}
```

### 10.2 常见错误处理

| 错误码 | 处理方式                          |
| ------ | --------------------------------- |
| 401    | 跳转登录页重新登录                |
| 429    | 显示"操作太频繁"提示，禁用操作3秒 |
| 20001  | 提示用户修改内容                  |
| 20002  | 显示今日已记录，引导查看          |
| 30001  | 引导用户观看广告或开通会员        |
| 500    | 显示"服务器繁忙"，提供重试按钮    |
