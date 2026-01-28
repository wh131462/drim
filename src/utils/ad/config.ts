/**
 * 广告配置
 * 注意：广告位 ID 需要在开通微信流量主后替换为真实 ID
 */

export const AD_CONFIG = {
    /**
     * 广告功能总开关
     * - false: 广告未开通，隐藏所有广告相关选项
     * - true: 广告已开通，显示广告选项
     */
    ENABLED: false,

    // 微信流量主广告位 ID（开通后替换）
    REWARDED_VIDEO: {
        /** 任务双倍奖励广告位 */
        TASK_DOUBLE: '',
        /** 积分获取广告位 */
        POINTS_GAIN: ''
    },

    NATIVE: {
        /** 探索广场信息流广告位 */
        EXPLORE_FEED: ''
    },

    // 奖励配置
    REWARDS: {
        /** 任务基础奖励积分 */
        TASK_BASE_POINTS: 10,
        /** 任务双倍奖励积分 */
        TASK_DOUBLE_POINTS: 20,
        /** 看广告获得积分 */
        AD_WATCH_POINTS: 20,
        /** 每日广告观看上限 */
        DAILY_AD_LIMIT: 5
    },

    // 原生广告插入配置
    NATIVE_AD_INSERT: {
        /** 首次插入位置（索引从0开始，即第4条后插入） */
        FIRST_POSITION: 3,
        /** 插入间隔 */
        INTERVAL: 5,
        /** 单页最大广告数 */
        MAX_COUNT: 3
    }
} as const;

/**
 * 检查广告功能是否已开启
 */
export function isAdEnabled(): boolean {
    return AD_CONFIG.ENABLED;
}

/**
 * 检查广告是否已配置
 */
export function isAdConfigured(adUnitId: string): boolean {
    return !!adUnitId && !adUnitId.startsWith('adunit-xxx');
}

/**
 * 检查是否在微信小程序环境
 */
export function isWeixinMiniProgram(): boolean {
    // #ifdef MP-WEIXIN
    return true;
    // #endif
    // #ifndef MP-WEIXIN
    return false;
    // #endif
}
