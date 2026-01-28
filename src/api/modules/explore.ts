/**
 * 探索相关 API
 */

import { get, post } from '../request';

export interface PublicDream {
    id: string;
    content: string;
    tags: string[];
    emotion?: string;
    viewCount: number;
    likeCount: number;
    isLiked: boolean;
    createdAt: string;
    author: {
        id: string;
        nickname: string;
        avatar?: string;
    };
}

export interface ViewDreamRewards {
    viewReward: number;
}

export interface PublicDreamDetail extends PublicDream {
    analysis?: {
        theme?: string;
        interpretation?: string;
        fortuneScore?: number;
        fortuneTips?: any;
    };
    rewards?: ViewDreamRewards | null;
}

export interface ExploreListParams {
    keyword?: string;
    tag?: string;
    emotion?: string;
    page?: number;
    pageSize?: number;
}

export interface ExploreListResponse {
    list: PublicDream[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface TagItem {
    tag: string;
    count: number;
}

export interface TagsResponse {
    tags: TagItem[];
    total: number;
}

export const exploreApi = {
    /**
     * 获取所有可用标签
     */
    getTags(): Promise<TagsResponse> {
        return get<TagsResponse>('/explore/tags');
    },

    /**
     * 获取公开梦境列表
     */
    getPublicDreams(params?: ExploreListParams): Promise<ExploreListResponse> {
        return get<ExploreListResponse>('/explore/dreams', params);
    },

    /**
     * 随机获取一个公开梦境
     */
    getRandomDream(): Promise<PublicDream> {
        return get<PublicDream>('/explore/random');
    },

    /**
     * 查看梦境详情
     */
    viewDream(dreamId: string, source?: string, viewDuration?: number): Promise<PublicDreamDetail> {
        return get<PublicDreamDetail>(`/explore/dream/${dreamId}`, { source, viewDuration });
    },

    /**
     * 点赞/取消点赞梦境
     */
    toggleLike(dreamId: string): Promise<{ isLiked: boolean; likeCount: number }> {
        return post<{ isLiked: boolean; likeCount: number }>(`/explore/dream/${dreamId}/like`);
    }
};
