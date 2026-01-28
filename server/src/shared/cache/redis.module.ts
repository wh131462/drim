import { Global, Module } from '@nestjs/common';
import { MemoryCacheService } from './memory-cache.service';

// 使用内存缓存替代 Redis，节省服务器资源
// RedisService 是 MemoryCacheService 的别名，保持向后兼容
@Global()
@Module({
    providers: [MemoryCacheService],
    exports: [MemoryCacheService]
})
export class RedisModule {}
