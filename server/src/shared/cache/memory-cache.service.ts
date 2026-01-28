import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface CacheItem {
    value: string;
    expireAt?: number;
}

@Injectable()
export class MemoryCacheService implements OnModuleDestroy {
    private cache = new Map<string, CacheItem>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // 每分钟清理过期缓存
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    onModuleDestroy() {
        clearInterval(this.cleanupInterval);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.expireAt && item.expireAt < now) {
                this.cache.delete(key);
            }
        }
    }

    private isExpired(item: CacheItem): boolean {
        return item.expireAt !== undefined && item.expireAt < Date.now();
    }

    /**
     * 设置缓存
     */
    async set(key: string, value: string, ttl?: number): Promise<void> {
        const item: CacheItem = { value };
        if (ttl) {
            item.expireAt = Date.now() + ttl * 1000;
        }
        this.cache.set(key, item);
    }

    /**
     * 获取缓存
     */
    async get(key: string): Promise<string | null> {
        const item = this.cache.get(key);
        if (!item) return null;
        if (this.isExpired(item)) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    /**
     * 删除缓存
     */
    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    /**
     * 设置JSON缓存
     */
    async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttl);
    }

    /**
     * 获取JSON缓存
     */
    async getJson<T>(key: string): Promise<T | null> {
        const value = await this.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }

    /**
     * 自增
     */
    async incr(key: string): Promise<number> {
        const value = await this.get(key);
        const num = value ? parseInt(value, 10) + 1 : 1;
        const item = this.cache.get(key);
        await this.set(key, String(num), item?.expireAt ? Math.floor((item.expireAt - Date.now()) / 1000) : undefined);
        return num;
    }

    /**
     * 设置过期时间
     */
    async expire(key: string, seconds: number): Promise<void> {
        const item = this.cache.get(key);
        if (item) {
            item.expireAt = Date.now() + seconds * 1000;
        }
    }

    /**
     * 检查key是否存在
     */
    async exists(key: string): Promise<boolean> {
        const item = this.cache.get(key);
        if (!item) return false;
        if (this.isExpired(item)) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * 获取剩余过期时间
     */
    async ttl(key: string): Promise<number> {
        const item = this.cache.get(key);
        if (!item) return -2;
        if (!item.expireAt) return -1;
        const remaining = Math.floor((item.expireAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
}
