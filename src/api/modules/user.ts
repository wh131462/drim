/**
 * 用户相关 API
 */

import { get, post, put } from '../request';
import type { User, UserStats, LoginParams, LoginResponse } from '@/types/user';

export const userApi = {
    /**
     * 微信登录
     */
    login(params: LoginParams): Promise<LoginResponse> {
        return post<LoginResponse>('/user/login/wechat', params);
    },

    /**
     * 获取用户信息
     */
    getUserInfo(): Promise<User> {
        return get<User>('/user/info');
    },

    /**
     * 更新用户信息
     */
    updateUserInfo(data: Partial<Pick<User, 'nickname' | 'avatar' | 'gender'>>): Promise<User> {
        return put<User>('/user/info', data);
    },

    /**
     * 获取用户统计
     */
    getUserStats(): Promise<UserStats> {
        return get<UserStats>('/user/stats');
    }
};
