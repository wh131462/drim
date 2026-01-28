/**
 * 广告服务入口
 */

// 配置
export { AD_CONFIG, isAdEnabled, isAdConfigured, isWeixinMiniProgram } from './config';

// 激励视频广告
export { rewardedVideoAd } from './rewarded-video';
export type { RewardedAdType, RewardedVideoResult, AdStatus } from './rewarded-video';

// 原生广告工具
export { insertAdsIntoList, calculateAdPositions, getExploreFeedAdUnitId, isNativeAdAvailable } from './native-ad';
export type { ListItemType, MixedListItem, InsertAdOptions } from './native-ad';
