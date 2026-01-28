// 为了兼容性保留 RedisService 名称，实际使用内存缓存
// 这样其他模块不需要修改 import 语句
export { MemoryCacheService as RedisService } from './memory-cache.service';
