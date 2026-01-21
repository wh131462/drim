import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './shared/cache/redis.module';
import { UserModule } from './modules/user/user.module';
import { DreamModule } from './modules/dream/dream.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { TaskModule } from './modules/task/task.module';
import { PointsModule } from './modules/points/points.module';
import { VipModule } from './modules/vip/vip.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 数据库模块
    PrismaModule,
    RedisModule,

    // 业务模块
    UserModule,
    DreamModule,
    AnalysisModule,
    TaskModule,
    PointsModule,
    VipModule,
  ],
  providers: [
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 全局响应转换
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
