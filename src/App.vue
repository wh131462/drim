<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';

const userStore = useUserStore();

onLaunch(async () => {
    console.log('App Launch');

    // 监听 token 失效事件，同步清除 store 内存状态
    uni.$on('unauthorized', () => {
        userStore.logout();
    });

    // 初始化登录状态
    await initLogin();
});

onShow(async () => {
    console.log('App Show');

    // 从后台恢复时检查登录状态，未登录则重新登录
    if (!userStore.isLoggedIn && !userStore.token) {
        await initLogin();
    }
});

onHide(() => {
    console.log('App Hide');
});

/**
 * 初始化登录
 */
async function initLogin() {
    try {
        // 检查本地是否有token
        const hasToken = userStore.checkLogin();

        if (hasToken) {
            // 有token，尝试获取最新用户信息
            try {
                await userStore.fetchUserInfo();
                console.log('用户信息已更新');
            } catch (error) {
                // token失效，重新登录
                console.log('Token已失效，重新登录');
                await performLogin();
            }
        } else {
            // 没有token，执行登录
            await performLogin();
        }
    } catch (error) {
        console.error('登录初始化失败:', error);
    }
}

/**
 * 执行登录
 */
async function performLogin() {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
        try {
            await userStore.login();
            console.log('登录成功');
            return;
        } catch (error: any) {
            retryCount++;
            console.error(`登录失败 (${retryCount}/${maxRetries}):`, error);

            if (retryCount >= maxRetries) {
                // 达到最大重试次数，显示错误提示
                uni.showModal({
                    title: '登录失败',
                    content: '网络连接异常，请检查网络后重新打开小程序',
                    showCancel: false,
                    confirmText: '我知道了'
                });
                break;
            }

            // 等待一段时间后重试
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        }
    }
}
</script>

<style lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/dark.scss' as *;

/* 全局样式 */
page {
    background-color: $bg-page;
    color: $text-primary;
    transition:
        background-color 0.3s ease,
        color 0.3s ease;
}

/* 暗黑模式全局样式 */
.dark-mode {
    page {
        background-color: $dark-bg-page;
        color: $dark-text-primary;
    }
}
</style>
