import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './shared/cache/redis.module';
import { UserModule } from './modules/user/user.module';
import { DreamModule } from './modules/dream/dream.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { TaskModule } from './modules/task/task.module';
import { PointsModule } from './modules/points/points.module';
import { VipModule } from './modules/vip/vip.module';
import { PrivilegeModule } from './modules/privilege/privilege.module';
import { ExploreModule } from './modules/explore/explore.module';
import { PolishModule } from './modules/polish/polish.module';
import { VersionModule } from './modules/version/version.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ExportModule } from './modules/export/export.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { HealthModule } from './modules/health/health.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuthGuard } from './common/guards/auth.guard';
import { AppController } from './app.controller';

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env.development', '.env']
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
        PrivilegeModule,
        ExploreModule,
        PolishModule,
        VersionModule,
        AchievementModule,
        SettingsModule,
        ExportModule,
        SchedulerModule,
        HealthModule
    ],
    controllers: [AppController],
    providers: [
        // 全局认证守卫
        {
            provide: APP_GUARD,
            useClass: AuthGuard
        },
        // 全局异常过滤器
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter
        },
        // 全局响应转换
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor
        }
    ]
})
export class AppModule {}
