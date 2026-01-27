import { Module } from '@nestjs/common';
import { RedisModule } from './redis.module';

/**
 * CacheModule 提供缓存功能的抽象层
 * 当前基于 Redis 实现
 */
@Module({
    imports: [RedisModule],
    exports: [RedisModule]
})
export class CacheModule {}
