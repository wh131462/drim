export function getPageHeadingMetrics(): { top: number; height: number } {
    const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0;
    // #ifdef MP-WEIXIN
    try {
        const capsule = uni.getMenuButtonBoundingClientRect();
        if (capsule.top > 0 && capsule.height > 0) {
            return { top: capsule.top, height: capsule.height };
        }
    } catch {
        // 开发工具未提供胶囊尺寸时，使用常规导航区位置。
    }
    // #endif
    return { top: statusBarHeight + 6, height: 32 };
}
