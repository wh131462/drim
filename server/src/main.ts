import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupAdminPanel } from './admin/admin.bootstrap';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Traefik 终止 TLS，管理后台的 Secure Cookie 需要信任第一层代理。
    app.set('trust proxy', 1);

    // 静态文件服务（头像等上传文件）
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads/'
    });

    // 全局前缀
    app.setGlobalPrefix('api/v1');

    // 全局验证管道
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true
        })
    );

    // CORS
    app.enableCors({
        origin: true,
        credentials: true
    });

    // Swagger 文档
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('梦见小程序 API')
            .setDescription('梦见小程序后端接口文档')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    const adminEnabled = await setupAdminPanel(app);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
    if (adminEnabled) {
        console.log(`Admin panel: http://localhost:${port}/admin`);
    }
}

bootstrap();
