/**
 * 积分反馈工具函数
 */

export interface PointsReward {
    dreamReward?: number; // 记梦奖励
    streakReward?: number; // 连续打卡奖励
    streakDays?: number; // 连续天数
    viewReward?: number; // 浏览奖励
    taskReward?: number; // 任务奖励
    doubleReward?: number; // 翻倍奖励
}

/**
 * 显示积分获取反馈
 */
export function showPointsReward(rewards: PointsReward) {
    const messages: string[] = [];

    // 记梦奖励
    if (rewards.dreamReward && rewards.dreamReward > 0) {
        messages.push(`记梦 +${rewards.dreamReward}`);
    }

    // 连续打卡奖励
    if (rewards.streakReward && rewards.streakReward > 0) {
        messages.push(`连续${rewards.streakDays}天 +${rewards.streakReward}`);
    }

    // 浏览奖励
    if (rewards.viewReward && rewards.viewReward > 0) {
        messages.push(`浏览 +${rewards.viewReward}`);
    }

    // 任务奖励
    if (rewards.taskReward && rewards.taskReward > 0) {
        messages.push(`任务 +${rewards.taskReward}`);
    }

    // 翻倍奖励
    if (rewards.doubleReward && rewards.doubleReward > 0) {
        messages.push(`翻倍 +${rewards.doubleReward}`);
    }

    if (messages.length === 0) return;

    // 计算总积分
    const total =
        (rewards.dreamReward || 0) +
        (rewards.streakReward || 0) +
        (rewards.viewReward || 0) +
        (rewards.taskReward || 0) +
        (rewards.doubleReward || 0);

    // 构建提示消息
    let title: string;
    if (messages.length === 1) {
        title = `${messages[0]} 幸运值`;
    } else {
        title = `获得 ${total} 幸运值`;
    }

    uni.showToast({
        title,
        icon: 'success',
        duration: 2000
    });
}

/**
 * 显示简单积分提示
 */
export function showSimplePointsReward(points: number, action?: string) {
    if (points <= 0) return;

    const title = action ? `${action} +${points} 幸运值` : `+${points} 幸运值`;

    uni.showToast({
        title,
        icon: 'success',
        duration: 2000
    });
}

/**
 * 显示积分消耗提示
 */
export function showPointsConsumed(points: number, action?: string) {
    if (points <= 0) return;

    const title = action ? `${action} -${points} 幸运值` : `-${points} 幸运值`;

    uni.showToast({
        title,
        icon: 'none',
        duration: 2000
    });
}

/**
 * 确认消耗积分的弹窗
 * @returns Promise<boolean> 用户是否确认
 */
export function confirmPointsConsume(points: number, currentPoints: number, action: string): Promise<boolean> {
    return new Promise((resolve) => {
        if (currentPoints < points) {
            // 积分不足
            uni.showModal({
                title: '幸运值不足',
                content: `${action}需要 ${points} 幸运值，当前仅有 ${currentPoints} 幸运值`,
                confirmText: '去赚取',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        // 跳转到积分获取页面
                        uni.navigateTo({ url: '/pages/privilege/index' });
                    }
                    resolve(false);
                }
            });
            return;
        }

        // 积分充足，确认消耗
        uni.showModal({
            title: '确认操作',
            content: `${action}将消耗 ${points} 幸运值，当前剩余 ${currentPoints} 幸运值，确定继续？`,
            confirmText: '确定',
            cancelText: '取消',
            success: (res) => {
                resolve(res.confirm);
            }
        });
    });
}
