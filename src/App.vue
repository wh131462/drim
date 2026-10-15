<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores';

const userStore = useUserStore();
let initializing = false;

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

    // 前后台切换时立即按过期时间归一化 VIP 状态，不等待用户信息缓存刷新。
    userStore.refreshVipStatus();

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
    if (initializing) return;
    initializing = true;
    try {
        // 检查本地是否有token
        const hasToken = userStore.checkLogin();

        if (hasToken) {
            // 有token，尝试获取最新用户信息
            try {
                await userStore.fetchUserInfo();
                console.log('用户信息已更新');
            } catch (error) {
                // 只有请求层已清除 token 才重新登录，网络波动继续使用本地会话。
                if (!userStore.token) {
                    console.log('Token已失效，重新登录');
                    await userStore.login();
                } else {
                    console.warn('用户信息刷新失败，保留本地会话');
                }
            }
        } else {
            // 没有token，执行登录
            await userStore.login();
        }
    } catch (error) {
        console.error('登录初始化失败:', error);
    } finally {
        initializing = false;
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
