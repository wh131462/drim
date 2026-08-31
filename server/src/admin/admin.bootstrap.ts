import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { timingSafeEqual } from 'crypto';
import { join } from 'path';
import { tmpdir } from 'os';
import { PrismaService } from '@/prisma/prisma.service';

const logger = new Logger('AdminPanel');
const ADMIN_ROOT_PATH = '/admin';

type DynamicImport = (specifier: string) => Promise<any>;

// TypeScript 会把 import() 编译成 require()，而 AdminJS 7 仅提供 ESM。
// 保留原生动态 import，使当前 CommonJS NestJS 服务无需整体迁移到 ESM。
const dynamicImport: DynamicImport = new Function('specifier', 'return import(specifier)') as DynamicImport;

function constantTimeEqual(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(actualBuffer, expectedBuffer);
}

function readAdminConfig() {
    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD;
    const cookieSecret = process.env.ADMIN_COOKIE_SECRET;

    if (!email || !password || !cookieSecret) return null;
    if (cookieSecret.length < 32) throw new Error('ADMIN_COOKIE_SECRET 至少需要 32 个字符');
    return { email, password, cookieSecret };
}

const readOnlyActions = {
    new: { isAccessible: false, isVisible: false },
    edit: { isAccessible: false, isVisible: false },
    delete: { isAccessible: false, isVisible: false },
    bulkDelete: { isAccessible: false, isVisible: false }
};

function startOfToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

function daysAgo(days: number): Date {
    const date = startOfToday();
    date.setDate(date.getDate() - days);
    return date;
}

async function getDashboardStats(prisma: PrismaService) {
    const activeWhere = { deletedAt: null, status: { not: 'deleted' as const } };
    const deletedWhere = { OR: [{ deletedAt: { not: null } }, { status: 'deleted' as const }] };
    const [total, active, deleted, today, last7Days, last30Days, publicDreams, privateDreams, statusGroups, users] =
        await Promise.all([
            prisma.dream.count(),
            prisma.dream.count({ where: activeWhere }),
            prisma.dream.count({ where: deletedWhere }),
            prisma.dream.count({ where: { ...activeWhere, createdAt: { gte: startOfToday() } } }),
            prisma.dream.count({ where: { ...activeWhere, createdAt: { gte: daysAgo(6) } } }),
            prisma.dream.count({ where: { ...activeWhere, createdAt: { gte: daysAgo(29) } } }),
            prisma.dream.count({ where: { ...activeWhere, isPublic: true } }),
            prisma.dream.count({ where: { ...activeWhere, isPublic: false } }),
            prisma.dream.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.user.count()
        ]);
    const byStatus = Object.fromEntries(statusGroups.map((item) => [item.status, item._count._all]));
    return {
        total,
        active,
        deleted,
        today,
        last7Days,
        last30Days,
        publicDreams,
        privateDreams,
        users,
        byStatus: { pending: byStatus.pending || 0, analyzed: byStatus.analyzed || 0, deleted: byStatus.deleted || 0 },
        generatedAt: new Date().toISOString()
    };
}

export async function setupAdminPanel(app: NestExpressApplication): Promise<boolean> {
    const config = readAdminConfig();
    if (!config) {
        logger.warn('管理后台未启用：请配置 ADMIN_EMAIL、ADMIN_PASSWORD 和 ADMIN_COOKIE_SECRET');
        return false;
    }

    // 生产容器以非 root 用户运行，组件打包目录必须可写。
    process.env.ADMIN_JS_TMP_DIR ||= join(tmpdir(), 'drim-adminjs');
    const [{ default: AdminJS, ComponentLoader }, AdminJSExpress, prismaAdapter, memoryStoreModule, sessionModule] =
        await Promise.all([
            dynamicImport('adminjs'),
            dynamicImport('@adminjs/express'),
            dynamicImport('@adminjs/prisma'),
            dynamicImport('memorystore'),
            dynamicImport('express-session')
        ]);
    const { Database, Resource, getModelByName } = prismaAdapter;
    const prisma = app.get(PrismaService);
    AdminJS.registerAdapter({ Database, Resource });

    const componentLoader = new ComponentLoader();
    const dashboardComponent = componentLoader.add('DreamDashboard', join(__dirname, 'components', 'dream-dashboard'));
    const modelResource = (modelName: string, options: Record<string, unknown>) => ({
        resource: { model: getModelByName(modelName), client: prisma },
        options
    });

    const admin = new AdminJS({
        rootPath: ADMIN_ROOT_PATH,
        loginPath: `${ADMIN_ROOT_PATH}/login`,
        logoutPath: `${ADMIN_ROOT_PATH}/logout`,
        componentLoader,
        branding: { companyName: '梦见管理后台', withMadeWithLove: false },
        locale: {
            language: 'zh-CN',
            availableLanguages: ['zh-CN'],
            translations: {
                'zh-CN': {
                    labels: { Dream: '梦境', User: '用户', Analysis: '解析结果', navigation: '数据查看' },
                    actions: { list: '列表', show: '查看', filter: '筛选' },
                    buttons: { login: '登录', logout: '退出登录', filter: '筛选', applyChanges: '应用' },
                    messages: { loginWelcome: '使用管理员账号登录。后台默认为只读模式。' }
                }
            }
        },
        dashboard: { component: dashboardComponent, handler: async () => getDashboardStats(prisma) },
        resources: [
            modelResource('Dream', {
                navigation: { name: '数据查看', icon: 'Moon' },
                sort: { sortBy: 'createdAt', direction: 'desc' },
                listProperties: ['id', 'user', 'content', 'status', 'emotion', 'isPublic', 'createdAt', 'deletedAt'],
                showProperties: [
                    'id',
                    'user',
                    'content',
                    'originalContent',
                    'tags',
                    'emotion',
                    'wordCount',
                    'status',
                    'isPublic',
                    'currentVersionId',
                    'viewCount',
                    'likeCount',
                    'createdAt',
                    'updatedAt',
                    'deletedAt'
                ],
                filterProperties: ['id', 'user', 'content', 'status', 'emotion', 'isPublic', 'createdAt', 'deletedAt'],
                properties: { content: { type: 'textarea' }, originalContent: { type: 'textarea' } },
                actions: readOnlyActions
            }),
            modelResource('Analysis', {
                navigation: { name: '数据查看', icon: 'Search' },
                sort: { sortBy: 'createdAt', direction: 'desc' },
                listProperties: [
                    'id',
                    'dream',
                    'userId',
                    'status',
                    'theme',
                    'aiModel',
                    'tokensUsed',
                    'latency',
                    'createdAt'
                ],
                showProperties: [
                    'id',
                    'dream',
                    'userId',
                    'status',
                    'theme',
                    'interpretation',
                    'fortuneScore',
                    'fortuneTips',
                    'aiModel',
                    'tokensUsed',
                    'latency',
                    'createdAt',
                    'updatedAt'
                ],
                filterProperties: ['id', 'dream', 'userId', 'status', 'theme', 'aiModel', 'createdAt'],
                properties: { interpretation: { type: 'textarea' }, fortuneTips: { type: 'textarea' } },
                actions: readOnlyActions
            }),
            modelResource('User', {
                navigation: { name: '数据查看', icon: 'User' },
                titleProperty: 'nickname',
                sort: { sortBy: 'createdAt', direction: 'desc' },
                listProperties: ['id', 'nickname', 'status', 'isVip', 'totalDreams', 'consecutiveDays', 'createdAt'],
                showProperties: [
                    'id',
                    'nickname',
                    'avatar',
                    'gender',
                    'isVip',
                    'vipExpireAt',
                    'luckyPoints',
                    'consecutiveDays',
                    'lastDreamDate',
                    'totalDreams',
                    'totalTasks',
                    'status',
                    'createdAt',
                    'updatedAt'
                ],
                filterProperties: ['id', 'nickname', 'status', 'isVip', 'createdAt'],
                properties: {
                    openId: { isVisible: false },
                    unionId: { isVisible: false },
                    phone: { isVisible: false }
                },
                actions: readOnlyActions
            })
        ]
    });

    const session = sessionModule.default || sessionModule;
    const MemoryStoreFactory = memoryStoreModule.default || memoryStoreModule;
    const MemoryStore = MemoryStoreFactory(session);
    const router = AdminJSExpress.default.buildAuthenticatedRouter(
        admin,
        {
            cookieName: 'drim_admin_session',
            cookiePassword: config.cookieSecret,
            maxRetries: { count: 5, duration: 60 },
            authenticate: async (email: string, password: string) => {
                const emailMatches = constantTimeEqual(email, config.email);
                const passwordMatches = constantTimeEqual(password, config.password);
                const isValid = emailMatches && passwordMatches;
                return isValid ? { email: config.email, title: '只读管理员' } : null;
            }
        },
        null,
        {
            name: 'drim_admin_session',
            secret: config.cookieSecret,
            resave: false,
            saveUninitialized: false,
            store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 8 * 60 * 60 * 1000
            }
        }
    );

    app.use(ADMIN_ROOT_PATH, router);
    logger.log(`只读管理后台已启用：${ADMIN_ROOT_PATH}`);
    return true;
}
