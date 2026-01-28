/**
 * 原生广告工具
 * 用于在内容列表中插入广告
 */

import { AD_CONFIG, isAdConfigured, isWeixinMiniProgram } from './config';

/** 列表项类型 */
export type ListItemType = 'content' | 'ad';

/** 混合列表项 */
export interface MixedListItem<T = any> {
    /** 唯一标识 */
    id: string;
    /** 项目类型 */
    type: ListItemType;
    /** 原始数据（仅 content 类型有值） */
    data?: T;
    /** 广告索引（仅 ad 类型有值） */
    adIndex?: number;
}

/** 插入配置 */
export interface InsertAdOptions {
    /** 首次插入位置（索引从0开始） */
    firstPosition?: number;
    /** 插入间隔 */
    interval?: number;
    /** 单页最大广告数 */
    maxCount?: number;
    /** 是否显示广告（VIP用户可关闭） */
    showAd?: boolean;
}

/**
 * 将广告插入内容列表
 * @param items 原始内容列表
 * @param options 插入配置
 * @returns 混合列表（包含内容和广告）
 */
export function insertAdsIntoList<T extends { id: string }>(items: T[], options?: InsertAdOptions): MixedListItem<T>[] {
    const {
        firstPosition = AD_CONFIG.NATIVE_AD_INSERT.FIRST_POSITION,
        interval = AD_CONFIG.NATIVE_AD_INSERT.INTERVAL,
        maxCount = AD_CONFIG.NATIVE_AD_INSERT.MAX_COUNT,
        showAd = true
    } = options || {};

    // 检查是否需要显示广告
    if (!showAd || !AD_CONFIG.ENABLED || !isWeixinMiniProgram() || !isAdConfigured(AD_CONFIG.NATIVE.EXPLORE_FEED)) {
        // 不显示广告，直接返回内容列表
        return items.map((item) => ({
            id: item.id,
            type: 'content' as const,
            data: item
        }));
    }

    const result: MixedListItem<T>[] = [];
    let adCount = 0;

    items.forEach((item, index) => {
        // 添加内容项
        result.push({
            id: item.id,
            type: 'content',
            data: item
        });

        // 判断是否需要在当前位置后插入广告
        // 规则：在 firstPosition 位置后插入第一个广告，之后每隔 interval 个内容插入一个广告
        const shouldInsertAd =
            adCount < maxCount &&
            (index === firstPosition || (index > firstPosition && (index - firstPosition) % interval === 0));

        if (shouldInsertAd) {
            result.push({
                id: `ad-${adCount}-${Date.now()}`,
                type: 'ad',
                adIndex: adCount
            });
            adCount++;
        }
    });

    return result;
}

/**
 * 计算广告插入位置
 * @param totalItems 内容总数
 * @param options 插入配置
 * @returns 广告应该插入的位置索引数组
 */
export function calculateAdPositions(totalItems: number, options?: InsertAdOptions): number[] {
    const {
        firstPosition = AD_CONFIG.NATIVE_AD_INSERT.FIRST_POSITION,
        interval = AD_CONFIG.NATIVE_AD_INSERT.INTERVAL,
        maxCount = AD_CONFIG.NATIVE_AD_INSERT.MAX_COUNT
    } = options || {};

    const positions: number[] = [];

    if (totalItems <= firstPosition) {
        return positions;
    }

    // 第一个广告位置
    positions.push(firstPosition);

    // 后续广告位置
    let nextPosition = firstPosition + interval;
    while (positions.length < maxCount && nextPosition < totalItems) {
        positions.push(nextPosition);
        nextPosition += interval;
    }

    return positions;
}

/**
 * 获取探索广场广告位 ID
 */
export function getExploreFeedAdUnitId(): string {
    return AD_CONFIG.NATIVE.EXPLORE_FEED;
}

/**
 * 检查原生广告是否可用
 */
export function isNativeAdAvailable(): boolean {
    return AD_CONFIG.ENABLED && isWeixinMiniProgram() && isAdConfigured(AD_CONFIG.NATIVE.EXPLORE_FEED);
}
