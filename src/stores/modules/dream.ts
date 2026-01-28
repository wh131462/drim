/**
 * 梦境状态管理
 */

import { defineStore } from 'pinia';
import { dreamApi } from '@/api';
import type { Dream, DreamInput, CalendarRecord, CreateDreamResponse } from '@/types/dream';

interface DreamState {
    list: Dream[];
    current: Dream | null;
    calendar: CalendarRecord[];
    loading: boolean;
    hasMore: boolean;
    page: number;
    currentYear: number;
    currentMonth: number;
}

export const useDreamStore = defineStore('dream', {
    state: (): DreamState => ({
        list: [],
        current: null,
        calendar: [],
        loading: false,
        hasMore: true,
        page: 1,
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1
    }),

    getters: {
        /**
         * 今日所有梦境（按创建时间倒序）
         */
        todayDreams: (state): Dream[] => {
            const today = new Date().toDateString();
            return state.list.filter((d) => new Date(d.createdAt).toDateString() === today);
        },

        /**
         * 今日第一条梦境（兼容旧逻辑）
         */
        todayDream(): Dream | undefined {
            return this.todayDreams[0];
        },

        hasTodayDream(): boolean {
            return this.todayDreams.length > 0;
        },

        /**
         * 最近一条梦境
         */
        latestDream: (state): Dream | undefined => {
            return state.list[0];
        },

        /**
         * 梦境总数
         */
        totalCount: (state): number => {
            return state.list.length;
        }
    },

    actions: {
        /**
         * 获取梦境列表
         */
        async fetchList(refresh = false): Promise<void> {
            if (this.loading) return;
            if (!refresh && !this.hasMore) return;

            this.loading = true;
            const page = refresh ? 1 : this.page;

            try {
                const { list, total } = await dreamApi.getList({
                    page,
                    pageSize: 20
                });

                if (refresh) {
                    this.list = list;
                } else {
                    this.list.push(...list);
                }

                this.page = page + 1;
                this.hasMore = this.list.length < total;
            } finally {
                this.loading = false;
            }
        },

        /**
         * 提交梦境
         */
        async submitDream(input: DreamInput): Promise<CreateDreamResponse> {
            const response = await dreamApi.create(input);
            this.list.unshift(response);
            this.current = response;
            return response;
        },

        /**
         * 获取梦境详情
         */
        async fetchDreamDetail(dreamId: string): Promise<Dream> {
            const dream = await dreamApi.getById(dreamId);
            this.current = dream;
            return dream;
        },

        /**
         * 获取日历数据
         */
        async fetchCalendar(year?: number, month?: number): Promise<void> {
            const y = year ?? this.currentYear;
            const m = month ?? this.currentMonth;

            try {
                const { records } = await dreamApi.getCalendar(y, m);
                this.calendar = records;
                this.currentYear = y;
                this.currentMonth = m;
            } catch (error) {
                console.error('获取日历数据失败:', error);
            }
        },

        /**
         * 删除梦境
         */
        async deleteDream(dreamId: string): Promise<void> {
            await dreamApi.delete(dreamId);
            this.list = this.list.filter((d) => d.id !== dreamId);

            if (this.current?.id === dreamId) {
                this.current = null;
            }
        },

        /**
         * 清除当前梦境
         */
        clearCurrent(): void {
            this.current = null;
        },

        /**
         * 重置列表状态
         */
        resetList(): void {
            this.list = [];
            this.hasMore = true;
            this.page = 1;
        }
    }
});
